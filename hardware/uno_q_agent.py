#!/usr/bin/env python3
"""
SmartWelcome AI — Arduino UNO Q Linux Device Agent
Target Hardware: Arduino UNO Q (Qualcomm QRB2210 Linux MPU running Debian)
Communication: WebSocket over Wi-Fi to SmartWelcome AI Backend
Bridge/RPC: Communicates with STM32U585 MCU over local RPC bridge
"""

import os
import sys
import time
import json
import socket
import logging
import threading
from urllib.parse import urlparse

# Try importing websocket-client (install via: pip3 install websocket-client)
try:
    import websocket
except ImportError:
    print("[ERROR] 'websocket-client' package is required. Install on UNO Q with:")
    print("        sudo apt update && sudo apt install -y python3-pip")
    print("        pip3 install websocket-client")
    sys.exit(1)

# Configuration from environment or defaults
GATEWAY_URL = os.environ.get("SMARTWELCOME_GATEWAY_URL", "ws://192.168.1.100:3000/ws/device")
DEVICE_ID = os.environ.get("UNO_Q_DEVICE_ID", "UNO-Q-ENTRANCE-01")
AUTH_TOKEN = os.environ.get("UNO_Q_AUTH_TOKEN", "uno-q-sec-9812-token-auth")
HEARTBEAT_INTERVAL = int(os.environ.get("UNO_Q_HEARTBEAT_SEC", "15"))
SERIAL_PORT = os.environ.get("UNO_Q_BRIDGE_PORT", "/dev/ttyRPMSG0") # Standard Qualcomm RPMSG endpoint

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] (UNO-Q-Agent) %(message)s'
)
logger = logging.getLogger("UNO-Q-Agent")

class UnoQBridgeClient:
    """Interface to STM32U585 MCU via Bridge / Serial RPC"""
    def __init__(self, port):
        self.port = port
        self.serial_conn = None
        self._init_bridge()

    def _init_bridge(self):
        try:
            import serial
            self.serial_conn = serial.Serial(self.port, 115200, timeout=1)
            logger.info(f"Connected to MCU bridge on {self.port}")
        except Exception as e:
            logger.warning(f"Hardware MCU serial port ({self.port}) not open ({e}). Running in simulated hardware mode.")
            self.serial_conn = None

    def send_to_mcu(self, command_id: str, event_type: str, rgb_color: str, matrix_preset: str):
        """Send RPC frame to STM32 MCU"""
        rpc_payload = {
            "cmd": command_id,
            "evt": event_type,
            "rgb": rgb_color,
            "preset": matrix_preset
        }
        raw_msg = json.dumps(rpc_payload) + "\n"
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(raw_msg.encode('utf-8'))
                self.serial_conn.flush()
                logger.info(f"MCU Bridge Sent: {raw_msg.strip()}")
            except Exception as e:
                logger.error(f"MCU Bridge write error: {e}")
        else:
            logger.info(f"[MCU Simulated Drive] Event: {event_type} | Color: {rgb_color} | Matrix: {matrix_preset}")

class UnoQDeviceAgent:
    def __init__(self):
        self.ws = None
        self.bridge = UnoQBridgeClient(SERIAL_PORT)
        self.running = True
        self.connected = False
        self.start_time = time.time()

    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def on_open(self, ws):
        logger.info(f"Connected to SmartWelcome Gateway at {GATEWAY_URL}")
        self.connected = True

        # Send Registration handshake
        reg_payload = {
            "type": "REGISTER",
            "deviceId": DEVICE_ID,
            "deviceName": "Arduino UNO Q Entrance Terminal",
            "authToken": AUTH_TOKEN,
            "firmwareVersion": "v1.4.0-stm32u585",
            "protocolVersion": "1.0",
            "ipAddress": self.get_local_ip(),
            "macAddress": "E4:5F:01:2A:8C:99"
        }
        ws.send(json.dumps(reg_payload))
        logger.info("Sent registration request to gateway")

        # Start heartbeat thread
        hb_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        hb_thread.start()

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "REGISTER_OK":
                logger.info(f"Device registration confirmed by server. Device ID: {data.get('deviceId')}")
                self.bridge.send_to_mcu("init", "IDLE", "#06b6d4", "IDLE")
                return

            if msg_type == "HEARTBEAT_ACK":
                logger.debug("Heartbeat ACK received")
                return

            # Attendance or presence command from gateway
            event_type = data.get("eventType")
            command_id = data.get("commandId")

            if command_id and event_type:
                start_exec = time.time()
                logger.info(f">>> Received Hardware Command: {event_type} (ID: {command_id})")

                payload = data.get("payload", {})
                rgb = payload.get("rgbColor", "#06b6d4")
                preset = payload.get("matrixPattern", event_type)

                # Forward to STM32 MCU
                self.bridge.send_to_mcu(command_id, event_type, rgb, preset)

                # Send ACK back to Gateway
                exec_ms = int((time.time() - start_exec) * 1000)
                ack_msg = {
                    "protocolVersion": "1.0",
                    "commandId": command_id,
                    "deviceId": DEVICE_ID,
                    "status": "ACK",
                    "executionTimeMs": max(1, exec_ms),
                    "hardwareState": event_type
                }
                ws.send(json.dumps(ack_msg))
                logger.info(f"<<< Sent ACK for {command_id} in {exec_ms}ms")

        except Exception as e:
            logger.error(f"Error handling message: {e}")

    def on_error(self, ws, error):
        logger.error(f"WebSocket Error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        logger.warning(f"Connection closed ({close_status_code}): {close_msg}")
        self.connected = False
        # Set offline indicator on MCU
        self.bridge.send_to_mcu("offline", "FAULT", "#ef4444", "FAULT")

    def _heartbeat_loop(self):
        while self.connected and self.running:
            time.sleep(HEARTBEAT_INTERVAL)
            if self.connected and self.ws:
                try:
                    uptime = int(time.time() - self.start_time)
                    hb_msg = {
                        "type": "HEARTBEAT",
                        "deviceId": DEVICE_ID,
                        "uptimeSeconds": uptime,
                        "wifiRssi": -55,
                        "ipAddress": self.get_local_ip()
                    }
                    self.ws.send(json.dumps(hb_msg))
                    logger.debug("Sent periodic heartbeat")
                except Exception as e:
                    logger.warning(f"Failed to send heartbeat: {e}")

    def start(self):
        logger.info(f"Starting SmartWelcome AI Uno Q Agent. Target gateway: {GATEWAY_URL}")
        while self.running:
            try:
                self.ws = websocket.WebSocketApp(
                    GATEWAY_URL,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close
                )
                self.ws.run_forever()
            except Exception as e:
                logger.error(f"WebSocket connection failed: {e}")
            logger.info("Reconnecting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    agent = UnoQDeviceAgent()
    try:
        agent.start()
    except KeyboardInterrupt:
        logger.info("Agent shutting down")
        sys.exit(0)
