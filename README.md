# SmartWelcome AI
### Gemma 4-Powered Smart Entry, Computer Vision Human Detection, Visitor Management, and Wi-Fi-Connected Arduino UNO Q Attendance System

---

## 1. Overview & Problem Solved

Organizations often lack a dedicated attendance officer. People entering premises may not be welcomed, visitors may not be registered consistently, and manual sign-in books are slow, unreliable, and prone to error.

**SmartWelcome AI** automates the entrance experience:
1. **Camera-Based Human Detection**: Automatically detects a person approaching the entrance using an in-browser neural network without storing video or biometric face templates.
2. **Gemma 4 Intelligent Assistance**: Welcomes attendees, answers organizational questions using administrator-approved knowledge (RAG), and provides multi-language support.
3. **Cryptographic Sticker Badges**: Issues unique, high-entropy sticker badges (`SWK-STF-...` and `SWK-VIS-...`) with printed QR codes and label formats.
4. **Authoritative Attendance Persistence**: Verifies QR scans or manual codes transactionally, prevents duplicate check-ins, and persists records across restarts in `data/smartwelcome.json`.
5. **Real Wi-Fi Arduino UNO Q Integration**: Communicates bidirectionally over an authenticated WebSocket with the dual-core Arduino UNO Q (Qualcomm QRB2210 Linux MPU + STM32U585 MCU) to drive onboard 8x12 LED matrix animations and RGB status lights.

---

## 2. System Architecture

```
[ Laptop Webcam ] ──> Neural Vision (COCO-SSD / TensorFlow.js)
                             │
                             ▼ (Person Detected)
             [ SmartWelcome AI Gateway (Node.js/Express) ]
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
 [ Google Gemma 4 ]  [ Transactional DB ]  [ Wi-Fi WebSocket ]
 - Welcome Assistant  - Staff & Visitors    - Port 3000 /ws/device
 - Approved Knowledge - Tokens (SHA-256)    - Authenticated Handshake
 - Controlled Tools   - Attendance Log      - Command Acknowledgement
 - Executive Summary  - Audit Trail                      │
                                                         ▼
                                          [ Arduino UNO Q Hardware ]
                                          ├── Qualcomm Linux MPU
                                          │   └── uno_q_agent.py
                                          ├── RPMSG Bridge (/dev/ttyRPMSG0)
                                          └── STM32U585 MCU
                                              ├── 8x12 LED Matrix Frames
                                              └── RGB Multi-Color LEDs
```

---

## 3. Google Gemma 4 Integration (Mandatory Section 4)

- **Model Choices**: `gemma-4-e4b-it` (recommended for edge/workstations), `gemma-4-12b-it`, `gemma-4-26b-a4b`, `gemma-4-31b`, `gemma-4-e2b`.
- **Inference Runtimes**:
  - *Option 1*: Local inference via Ollama / vLLM (`http://localhost:11434/api/chat`).
  - *Option 2*: Google GenAI SDK (`@google/genai`) using `GEMINI_API_KEY`.
  - *Option 3*: Deterministic Knowledge Fallback engine ensuring zero downtime if inference is unreachable.
- **Controlled Tools**:
  - `get_public_checkin_instructions()`
  - `get_department_information(departmentName)`
  - `get_aggregate_attendance_summary(date)`
  - `get_device_health_status()`
- **Safety Boundary**: The model cannot alter attendance records, determine identity from appearance, or execute arbitrary SQL/shell commands.

---

## 4. Arduino UNO Q Hardware & Wi-Fi Protocol

### Message Protocol (v1.0)
- **Device Registration**:
  `{ "type": "REGISTER", "deviceId": "UNO-Q-ENTRANCE-01", "authToken": "...", "ipAddress": "..." }`
- **Heartbeat (every 15s)**:
  `{ "type": "HEARTBEAT", "deviceId": "...", "uptimeSeconds": 1420 }`
- **Hardware Command Dispatch**:
  `{ "protocolVersion": "1.0", "commandId": "cmd_...", "eventType": "ATTENDANCE_SUCCESS", "payload": { ... } }`
- **Command Acknowledgement**:
  `{ "protocolVersion": "1.0", "commandId": "cmd_...", "deviceId": "...", "status": "ACK", "executionTimeMs": 18 }`

### Physical Indications
- **STARTUP**: Perimeter LED chase, Blue pulse
- **IDLE**: Gentle smiling eye icon, Cyan breathing
- **PERSON_DETECTED**: Human silhouette icon, Amber alert strobe
- **CHECKIN_PENDING**: QR reticle pattern, Yellow pulse
- **ATTENDANCE_SUCCESS**: High-contrast checkmark, Vivid Green
- **ATTENDANCE_FAILURE**: Red cross ('X') pattern, Warning buzzer
- **FAULT**: Exclamation warning, Rapid red flash

---

## 5. Quickstart & Deployment

### Run Application:
```bash
npm install
npm run dev
```
The application runs on `http://localhost:3000`.

### Deploy Arduino UNO Q:
1. Flash `hardware/uno_q_mcu.ino` using Arduino IDE 2.x to the STM32 core.
2. Connect UNO Q Linux to Wi-Fi via `sudo nmcli device wifi connect "SSID" password "PASS"`.
3. Launch `python3 hardware/uno_q_agent.py` on the Qualcomm Linux terminal.

---

## 6. Hackathon Acceptance Criteria Summary

All 16 verification tests from Section 14 & 15 can be run in real-time from the **Test Suite** tab:
- **T01-T07**: Staff/Visitor registration, QR validation, duplicate check-in prevention, and transactional persistence.
- **T08-T11**: Gemma 4 variant identification, approved knowledge grounding, multi-language support, and controlled tools.
- **T12-T14**: Arduino UNO Q protocol, command dispatch, ACK latency, and 8x12 LED matrix visual mapping.
- **T15-T16**: Absence timeout, detection cooldown, and privacy compliance.
