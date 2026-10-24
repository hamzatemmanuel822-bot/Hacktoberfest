# Arduino UNO Q Wi-Fi Setup & Hardware Integration Guide

SmartWelcome AI interacts in real-time with the **Arduino UNO Q** over an authenticated Wi-Fi connection.

---

## 1. Hardware Architecture

The Arduino UNO Q features a dual-core heterogeneous architecture:
1. **Qualcomm QRB2210 MPU (Linux / Debian)**: Connects to your facility Wi-Fi, runs the `uno_q_agent.py` Python agent daemon, manages TLS/WebSocket authentication, and buffers attendance commands.
2. **STM32U585 MCU (Real-Time Microcontroller)**: Drives the onboard 8x12 LED Matrix and multi-color RGB status LEDs with zero-latency hardware interrupts.
3. **Qualcomm RPMSG Inter-Processor Bridge (`/dev/ttyRPMSG0`)**: Transfers validated commands between Linux and the MCU.

---

## 2. Onboard Status Indications

| System Event | LED Matrix Pattern | RGB LED Color | Acoustic / Behaviour |
| :--- | :--- | :--- | :--- |
| **STARTUP** | Rotating perimeter box | Blue pulse | Initializing radio & peripherals |
| **IDLE** | Gentle smiling eye icon | Cyan breathing | Ready for approaching attendees |
| **PERSON_DETECTED**| Human head & shoulders | Amber warning | Kiosk camera presence detected |
| **CHECKIN_PENDING** | QR frame pattern | Yellow pulse | Awaiting sticker QR scan |
| **ATTENDANCE_SUCCESS** | Bright checkmark | Vivid Green | Valid attendance logged |
| **ATTENDANCE_FAILURE** | Clear cross 'X' | High-contrast Red | Invalid / expired / revoked token |
| **FAULT / OFFLINE** | Exclamation warning | Rapid Red blink | Wi-Fi dropped / missing heartbeat |

---

## 3. Deployment Steps on the Arduino UNO Q

### Step A: Flash the MCU Sketch
1. Open the Arduino IDE 2.x or Arduino App Lab on your Windows computer.
2. Select board **Arduino UNO Q (STM32 Core)**.
3. Open `hardware/uno_q_mcu.ino`.
4. Install the required libraries via Library Manager:
   - `Arduino_LED_Matrix`
   - `ArduinoJson` (v6 or v7)
5. Click **Upload**.

### Step B: Connect UNO Q Linux to Wi-Fi
SSH into the UNO Q Linux environment over USB serial or Ethernet:
```bash
# Connect to your Wi-Fi network using NetworkManager on Debian:
sudo nmcli device wifi connect "YOUR_WIFI_SSID" password "YOUR_WIFI_PASSWORD"

# Verify IP address:
ip addr show wlan0
```

### Step C: Install Agent Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip python3-serial
pip3 install websocket-client
```

### Step D: Run the SmartWelcome Device Agent
```bash
# Set your gateway IP (the computer running SmartWelcome AI):
export SMARTWELCOME_GATEWAY_URL="ws://<YOUR_COMPUTER_IP>:3000/ws/device"
export UNO_Q_AUTH_TOKEN="uno-q-sec-9812-token-auth"
export UNO_Q_DEVICE_ID="UNO-Q-ENTRANCE-01"

# Launch agent:
python3 hardware/uno_q_agent.py
```

### Step E: Systemd Auto-Start Service (Optional for Production)
To keep the agent running persistently on boot, install as a systemd unit:
```bash
sudo cp hardware/uno-q-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable uno-q-agent
sudo systemctl start uno-q-agent
```

---

## 4. Troubleshooting & Wi-Fi Reliability

1. **Firewall Rules**: Ensure incoming port 3000 on your host computer allows LAN traffic:
   - *Windows Defender*: Allow Node.js / `tsx` on private network.
   - *Linux*: `sudo ufw allow 3000/tcp`
2. **Client Isolation**: On enterprise guest Wi-Fi networks, device-to-device communication is often blocked. Use a standard 2.4/5GHz router or smartphone hotspot to connect both the host laptop and the UNO Q.
3. **Reconnection & Synchronization**: If Wi-Fi is temporarily interrupted, the agent automatically reconnects every 5 seconds. The SmartWelcome AI backend queues pending indicator events and resynchronizes state immediately upon re-registration.
