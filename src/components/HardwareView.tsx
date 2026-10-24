import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Terminal, 
  FileCode, 
  Play, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { DeviceTwin } from '../types';

interface HardwareViewProps {
  deviceTwin: DeviceTwin | null;
  onRefresh: () => void;
}

export const HardwareView: React.FC<HardwareViewProps> = ({ deviceTwin, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'twin' | 'telemetry' | 'guide'>('twin');
  const [telemetryEvents, setTelemetryEvents] = useState<any[]>([]);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const data = await api.getDeviceStatus();
      if (data.recentEvents) {
        setTelemetryEvents(data.recentEvents);
      }
    } catch (err) {
      // quiet poll
    }
  };

  const handleTriggerCommand = async (eventType: string) => {
    setIsSendingCommand(true);
    try {
      await api.sendDeviceTestCommand(eventType, {
        personName: 'Admin Hardware Test',
        audioChime: true
      });
      onRefresh();
      fetchTelemetry();
    } catch (err) {
      console.error('Error triggering command:', err);
    } finally {
      setIsSendingCommand(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isOnline = deviceTwin?.status === 'online';
  const matrix = deviceTwin?.matrixPattern || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Arduino UNO Q Hardware Twin & Wi-Fi</h2>
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded border ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
              }`}
            >
              {isOnline ? 'Authenticated Link Active' : 'Disconnected'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Bidirectional WebSocket control of Qualcomm QRB2210 Linux MPU & STM32U585 MCU onboard indicators
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Ping Board</span>
        </button>
      </div>

      {/* Diagnostics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Device Hardware ID</div>
          <div className="text-sm font-bold font-mono text-cyan-400 truncate">
            {deviceTwin?.deviceId || 'UNO-Q-ENTRANCE-01'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">MAC: {deviceTwin?.macAddress || 'E4:5F:01:2A:8C:99'}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Wi-Fi IP & Protocol</div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {deviceTwin?.ipAddress || '192.168.1.150'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Protocol v{deviceTwin?.protocolVersion || '1.0'} · RSSI: {deviceTwin?.rssi || -58} dBm
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Firmware Core</div>
          <div className="text-sm font-bold text-slate-100">
            {deviceTwin?.firmwareVersion || 'v1.4.0-stm32u585'}
          </div>
          <div className="text-[11px] text-slate-500">Qualcomm RPMSG Bridge</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 shadow-md">
          <div className="text-[11px] text-slate-400">Current Indicator State</div>
          <div className="text-sm font-bold uppercase font-mono text-cyan-400">
            {deviceTwin?.currentIndicatorState || 'IDLE'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Last ACK: {deviceTwin?.lastAckTimestamp ? new Date(deviceTwin.lastAckTimestamp).toLocaleTimeString() : 'Ready'}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('twin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'twin'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Interactive Virtual Twin</span>
        </button>
        <button
          onClick={() => setActiveSubTab('telemetry')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'telemetry'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>WebSocket Telemetry Log</span>
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeSubTab === 'guide'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-3.5 w-3.5" />
          <span>Firmware & Agent Code</span>
        </button>
      </div>

      {/* SUBTAB 1: Interactive Virtual Twin */}
      {activeSubTab === 'twin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Virtual Board Representation (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Arduino UNO Q Physical Board Visual Twin
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                8x12 Onboard Matrix & RGB Bus
              </span>
            </div>

            {/* Board PCB Rendering */}
            <div className="rounded-2xl border-2 border-emerald-900/70 bg-gradient-to-br from-teal-950 via-slate-950 to-slate-900 p-6 relative overflow-hidden shadow-2xl">
              {/* Silk-screen board markings */}
              <div className="flex items-center justify-between text-[11px] font-mono text-teal-400/80 mb-6 border-b border-teal-800/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="font-bold tracking-wider">ARDUINO UNO Q</span>
                </div>
                <span>QUALCOMM QRB2210 + STM32U585</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* 8x12 LED Matrix Display Grid */}
                <div className="sm:col-span-8 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 mb-2">
                    8 × 12 ONBOARD LED MATRIX DISPLAY
                  </div>
                  <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                    {matrix.map((row, rIdx) =>
                      row.map((col, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 ${
                            col === 1
                              ? 'bg-cyan-400 shadow-sm shadow-cyan-400 scale-105'
                              : 'bg-slate-950/80 border border-slate-800'
                          }`}
                        />
                      ))
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 mt-2">
                    Active Preset: {deviceTwin?.currentIndicatorState || 'IDLE'}
                  </div>
                </div>

                {/* RGB Status LED & Chips */}
                <div className="sm:col-span-4 space-y-4">
                  {/* RGB LED */}
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/90 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 mb-2">RGB STATUS LED</span>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-slate-700 transition-all duration-300 shadow-lg animate-pulse"
                      style={{
                        backgroundColor: deviceTwin?.rgbColor || '#06b6d4',
                        boxShadow: `0 0 18px ${deviceTwin?.rgbColor || '#06b6d4'}`
                      }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-2">
                      {deviceTwin?.rgbColor || '#06b6d4'}
                    </span>
                  </div>

                  {/* Qualcomm SoC Label */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="text-teal-300 font-bold">QUALCOMM LINUX MPU</div>
                    <div>WebSocket Gateway</div>
                    <div>Agent Daemon: <span className="text-emerald-400">Running</span></div>
                  </div>
                </div>
              </div>

              {/* Bottom Connectors */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-6 pt-2 border-t border-slate-800/80">
                <span>USB-C POWER & COMM</span>
                <span>RPMSG BRIDGE: /dev/ttyRPMSG0</span>
                <span>WLAN0: 192.168.1.150</span>
              </div>
            </div>
          </div>

          {/* Manual Test Controls (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Play className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Hardware Indicator Manual Test Bench
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Trigger real hardware commands over Wi-Fi to verify each physical LED pattern.
              </p>

              <div className="grid grid-cols-1 gap-2 pt-4">
                {[
                  {
                    id: 'STARTUP',
                    label: 'Startup (Spinning Box / Blue Pulse)',
                    color: 'text-blue-400 border-blue-900/40'
                  },
                  {
                    id: 'IDLE',
                    label: 'Idle (Smiling Eye / Cyan Breathing)',
                    color: 'text-cyan-400 border-cyan-900/40'
                  },
                  {
                    id: 'PERSON_DETECTED',
                    label: 'Person Detected (Amber Human Icon)',
                    color: 'text-amber-400 border-amber-900/40'
                  },
                  {
                    id: 'CHECKIN_PENDING',
                    label: 'Check-in Pending (Yellow QR Frame)',
                    color: 'text-yellow-400 border-yellow-900/40'
                  },
                  {
                    id: 'ATTENDANCE_SUCCESS',
                    label: 'Attendance Success (Green Checkmark)',
                    color: 'text-emerald-400 border-emerald-900/40'
                  },
                  {
                    id: 'ATTENDANCE_FAILURE',
                    label: 'Invalid Sticker (Red Cross Warning)',
                    color: 'text-rose-400 border-rose-900/40'
                  },
                  {
                    id: 'FAULT',
                    label: 'Hardware Fault / Offline (Rapid Blink)',
                    color: 'text-red-500 border-red-900/40'
                  }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    disabled={isSendingCommand}
                    onClick={() => handleTriggerCommand(btn.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border bg-slate-950 hover:bg-slate-900 transition-colors text-xs text-left ${btn.color}`}
                  >
                    <span>{btn.label}</span>
                    <Play className="h-3 w-3 shrink-0 ml-2 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-800">
              Each test command transmits a versioned JSON payload and records the round-trip acknowledgement latency.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WebSocket Telemetry */}
      {activeSubTab === 'telemetry' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Bidirectional WebSocket Command & Event Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Endpoint: /ws/device</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-2 max-h-[420px] overflow-y-auto">
            {telemetryEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="text-cyan-400 font-bold">{evt.eventType}</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Status: <span className="uppercase text-emerald-400 font-semibold">{evt.status}</span> · Command ID: {evt.id}
                </div>
                {evt.payload && (
                  <pre className="text-[10px] text-slate-400 mt-1 overflow-x-auto">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {telemetryEvents.length === 0 && (
              <div className="text-slate-500 text-center py-6">
                No telemetry commands logged yet. Use the test bench to dispatch hardware indications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Firmware & Agent Code */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          {/* Python Device Agent */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  1. Linux Device Agent (Python 3): <code className="text-cyan-300 font-mono">hardware/uno_q_agent.py</code>
                </h3>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `export SMARTWELCOME_GATEWAY_URL="ws://<YOUR_IP>:3000/ws/device"\npython3 hardware/uno_q_agent.py`,
                    'agent-cmd'
                  )
                }
                className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                {copiedCode === 'agent-cmd' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy Launch Command</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Runs on the UNO Q Qualcomm Linux MPU. Manages authenticated WebSocket connectivity, heartbeats, and forwards commands to the STM32 MCU via `/dev/ttyRPMSG0`.
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
{`# Connect UNO Q to Wi-Fi:
sudo nmcli device wifi connect "YOUR_WIFI" password "YOUR_PASSWORD"

# Run Agent:
export SMARTWELCOME_GATEWAY_URL="ws://192.168.1.100:3000/ws/device"
export UNO_Q_AUTH_TOKEN="uno-q-sec-9812-token-auth"
python3 hardware/uno_q_agent.py`}
            </pre>
          </div>

          {/* Arduino MCU Sketch */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  2. Arduino MCU Sketch (C++): <code className="text-emerald-300 font-mono">hardware/uno_q_mcu.ino</code>
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Flashed to the STM32U585 microcontroller. Directly drives the 8x12 LED matrix frames and RGB status LEDs with zero-latency hardware interrupts.
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-48 border border-slate-800">
{`#include "Arduino_LED_Matrix.h"
#include <ArduinoJson.h>

ArduinoLEDMatrix matrix;
// Flashed via Arduino IDE 2.x or App Lab to "Arduino UNO Q (STM32)"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
