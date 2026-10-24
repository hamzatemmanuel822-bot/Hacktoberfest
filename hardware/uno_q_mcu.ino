/*
  SmartWelcome AI — Arduino UNO Q MCU Firmware
  Hardware: Arduino UNO Q (STM32U585 Core)
  Controls: Onboard 8x12 LED Matrix and RGB Status Indicator
  Communication: Serial/RPMSG Bridge with Linux Qualcomm QRB2210 MPU
*/

#include "Arduino_LED_Matrix.h"
#include <ArduinoJson.h>

ArduinoLEDMatrix matrix;

// RGB Status LED Pins on Arduino UNO Q
#ifndef LED_RED
#define LED_RED 22
#endif
#ifndef LED_GREEN
#define LED_GREEN 23
#endif
#ifndef LED_BLUE
#define LED_BLUE 24
#endif

// 8x12 LED Matrix Frames (Bitmapped representations)
// 12 columns x 8 rows = 96 bits -> 3 x uint32_t

// 1. IDLE (Calm smiling eye / presence waiting)
const uint32_t frame_idle[] = {
  0x0300c000,
  0x0300c000,
  0x000ff000
};

// 2. PERSON_DETECTED (Target alert box / human icon)
const uint32_t frame_person[] = {
  0x07e0ff00,
  0x0db0ff00,
  0x07e3ff00
};

// 3. CHECKIN_PENDING (QR Badge waiting indicator)
const uint32_t frame_pending[] = {
  0xf0f90990,
  0x999ff090,
  0x909f0ff0
};

// 4. ATTENDANCE_SUCCESS (Crisp Checkmark Pattern)
const uint32_t frame_success[] = {
  0x00100300,
  0x0600c018,
  0x03006003
};

// 5. ATTENDANCE_FAILURE (Clear X Pattern)
const uint32_t frame_failure[] = {
  0x80140220,
  0x04100820,
  0x04402201
};

// 6. FAULT / ERROR
const uint32_t frame_fault[] = {
  0x01803c03,
  0xc03c0180,
  0x00001801
};

void setRGB(uint8_t r, uint8_t g, uint8_t b) {
  analogWrite(LED_RED, 255 - r);
  analogWrite(LED_GREEN, 255 - g);
  analogWrite(LED_BLUE, 255 - b);
}

void setup() {
  Serial.begin(115200);     // USB debug
  SerialRPMSG.begin(115200); // Inter-processor bridge to Linux MPU

  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // Initialize LED Matrix
  matrix.begin();

  // Startup indication (Blue)
  setRGB(0, 100, 255);
  matrix.loadFrame(frame_idle);
  delay(1000);

  // Settle to IDLE (Cyan)
  setRGB(0, 200, 200);
}

void loop() {
  // Read incoming commands from Linux Device Agent
  if (SerialRPMSG.available()) {
    String line = SerialRPMSG.readStringUntil('\n');
    line.trim();

    if (line.length() > 0) {
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, line);

      if (!err) {
        const char* evt = doc["evt"] | "IDLE";
        const char* cmd = doc["cmd"] | "";

        if (strcmp(evt, "STARTUP") == 0) {
          setRGB(0, 100, 255);
          matrix.loadFrame(frame_idle);
        } 
        else if (strcmp(evt, "IDLE") == 0) {
          setRGB(0, 180, 200); // Cyan
          matrix.loadFrame(frame_idle);
        } 
        else if (strcmp(evt, "PERSON_DETECTED") == 0) {
          setRGB(255, 165, 0); // Amber alert
          matrix.loadFrame(frame_person);
        } 
        else if (strcmp(evt, "CHECKIN_PENDING") == 0) {
          setRGB(255, 220, 0); // Yellow
          matrix.loadFrame(frame_pending);
        } 
        else if (strcmp(evt, "ATTENDANCE_SUCCESS") == 0) {
          setRGB(0, 255, 60);  // Vivid Green
          matrix.loadFrame(frame_success);
          // Keep success screen for 3 seconds, then return to idle
          delay(3000);
          setRGB(0, 180, 200);
          matrix.loadFrame(frame_idle);
        } 
        else if (strcmp(evt, "ATTENDANCE_FAILURE") == 0) {
          setRGB(255, 0, 0);   // Red
          matrix.loadFrame(frame_failure);
          delay(3000);
          setRGB(0, 180, 200);
          matrix.loadFrame(frame_idle);
        } 
        else if (strcmp(evt, "FAULT") == 0) {
          setRGB(255, 0, 0);
          matrix.loadFrame(frame_fault);
        }

        // Send acknowledgement back across RPC bridge
        StaticJsonDocument<128> ackDoc;
        ackDoc["cmd"] = cmd;
        ackDoc["status"] = "OK";
        serializeJson(ackDoc, SerialRPMSG);
        SerialRPMSG.println();
      }
    }
  }
}
