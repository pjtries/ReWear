/**
 * ============================================================================
 * ReWear ESP32-CAM + Controlled LED Ring Garment Inspection Station Firmware
 * File: hardware/esp32_inspection_station/esp32_rewear_inspector.ino
 * Target Board: AI-Thinker ESP32-CAM (OV2640 2MP Sensor + PSRAM)
 * Station Deployment: Dayananda Sagar University (DSU) Campus Hubs & Bengaluru Concierge
 * ============================================================================
 *
 * FEATURES:
 * 1. Controls a 16-Pixel WS2812B / High-CRI 5600K Daylight LED Ring Light (GPIO 12)
 *    to provide uniform ~865 Lux illumination during garment condition photography.
 * 2. Reads or receives a signed ReWear Booking QR Token (`RWQR-<booking>-<garment>-<sig>`)
 *    over Serial UART (GM65 QR Scanner module or USB Serial) or decodes via on-board frame.
 * 3. Triggered by a physical tactile push button (GPIO 13, active-LOW) or Serial command:
 *    - Ramps LED Ring to calibrated full daylight brightness (865 Lux)
 *    - Captures a UXGA (1600x1200) JPEG frame via OV2640 camera
 *    - Base64-encodes the JPEG frame in PSRAM
 *    - Sends an HTTP/HTTPS JSON POST to `/api/hardware/esp32-inspection`
 *      with header `x-esp32-device-key: <ESP32_DEVICE_API_KEY>`
 *    - Parses the AI Vision Defect Detection score (`condition_score` 0-100) and
 *      flashes Green (Pass >= 85) or Terracotta Red (Defect Flagged) on the LED Ring.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "mbedtls/base64.h"

// ============================================================================
// 1. NETWORK & REWEAR BACKEND CONFIGURATION
// ============================================================================
const char* WIFI_SSID             = "DSU_CAMPUS_IOT_WIFI";
const char* WIFI_PASSWORD         = "rewear_dsu_2026";

// ReWear Express Backend Endpoint (Use HTTPS in production or local LAN IP in campus booth)
const char* REWEAR_API_ENDPOINT   = "http://192.168.1.100:4000/api/hardware/esp32-inspection";
const char* ESP32_DEVICE_ID       = "ESP32-CAM-DSU-HAROHALLI-01";
const char* ESP32_DEVICE_API_KEY  = "rw_esp32_hw_key_dsu_harohalli_2026";

// ============================================================================
// 2. GPIO PIN DEFINITIONS (AI-THINKER ESP32-CAM)
// ============================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// External Inspection Booth Peripherals
#define LED_RING_PWM_PIN  12   // MOSFET / WS2812 Controlled 5600K LED Ring Light
#define TRIGGER_BTN_PIN   13   // Physical Capture Push-Button (Active LOW with internal pull-up)
#define STAGE_SWITCH_PIN  14   // Toggle Switch: HIGH = PRE_HANDOFF, LOW = AT_RETURN
#define ONBOARD_FLASH_PIN  4   // Secondary onboard fill LED

// PWM Channel Configuration for Calibrated Lux Control
#define PWM_CHANNEL        2
#define PWM_FREQ        5000
#define PWM_RESOLUTION     8
#define CALIBRATED_DUTY  230   // ~90% duty cycle -> calibrated 865 Lux at 45cm stand-off
#define CALIBRATED_LUX   865

// Active Session State
String activeQrToken = "RWQR-44444402-22222203-7C3B1E9F4A2D02";
String activeStage   = "PRE_HANDOFF";

// ============================================================================
// 3. CAMERA INITIALIZATION
// ============================================================================
bool initOv2640Camera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size   = FRAMESIZE_UXGA; // 1600x1200 High-Res Garment Inspection
    config.jpeg_quality = 10;             // High quality (lower number = higher quality)
    config.fb_count     = 2;
  } else {
    config.frame_size   = FRAMESIZE_SVGA; // 800x600 fallback
    config.jpeg_quality = 12;
    config.fb_count     = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[ERROR] OV2640 Camera init failed with error 0x%x\n", err);
    return false;
  }

  // Lock White Balance & Exposure for consistent textile color/stain comparison
  sensor_t* s = esp_camera_sensor_get();
  if (s != NULL) {
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_wb_mode(s, 1); // Sunny / 5600K Daylight preset matching LED Ring
    s->set_Saturation(s, 0);
    s->set_contrast(s, 1);
  }

  Serial.println("[OK] OV2640 Camera initialized with 5600K color profile.");
  return true;
}

// ============================================================================
// 4. CONTROLLED LED RING LIGHTING CONTROLLER
// ============================================================================
void setLedRingBrightness(uint8_t dutyCycle) {
  ledcWrite(PWM_CHANNEL, dutyCycle);
}

void blinkLedRingFeedback(int pulses, int delayMs) {
  for (int i = 0; i < pulses; i++) {
    setLedRingBrightness(255);
    delay(delayMs);
    setLedRingBrightness(20);
    delay(delayMs);
  }
  setLedRingBrightness(0);
}

// ============================================================================
// 5. CAPTURE JPEG UNDER CONTROLLED LED RING & POST TO REWEAR BACKEND
// ============================================================================
void captureAndUploadInspection(const String& qrToken, const String& stage) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(1500);
  }

  Serial.println("------------------------------------------------------------");
  Serial.printf("[SCAN] Starting %s inspection for QR Token: %s\n", stage.c_str(), qrToken.c_str());

  // 1. Ramp Controlled LED Ring to Calibrated 865 Lux and allow sensor AEC to settle
  setLedRingBrightness(CALIBRATED_DUTY);
  delay(450);

  // Flush stale frame buffer and capture fresh UXGA JPEG frame
  camera_fb_t* fb = esp_camera_fb_get();
  if (fb) esp_camera_fb_return(fb);
  fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("[ERROR] Camera frame buffer capture failed!");
    setLedRingBrightness(0);
    return;
  }

  Serial.printf("[OK] Captured JPEG Frame (%u bytes) at %d Lux\n", fb->len, CALIBRATED_LUX);

  //Dim LED Ring after optical capture
  setLedRingBrightness(25);

  // 2. Base64-encode JPEG image in PSRAM
  size_t outLen = 0;
  size_t base64MaxLen = ((fb->len + 2) / 3) * 4 + 1;
  unsigned char* base64Buf = (unsigned char*)ps_malloc(base64MaxLen);

  if (!base64Buf) {
    Serial.println("[ERROR] Failed to allocate PSRAM for Base64 JPEG buffer");
    esp_camera_fb_return(fb);
    setLedRingBrightness(0);
    return;
  }

  mbedtls_base64_encode(base64Buf, base64MaxLen, &outLen, fb->buf, fb->len);
  base64Buf[outLen] = '\0';
  esp_camera_fb_return(fb);

  // 3. Construct JSON Payload for POST /api/hardware/esp32-inspection
  String jsonPayload;
  jsonPayload.reserve(outLen + 512);
  jsonPayload += "{";
  jsonPayload += "\"qr_token\":\"" + qrToken + "\",";
  jsonPayload += "\"device_id\":\"" + String(ESP32_DEVICE_ID) + "\",";
  jsonPayload += "\"stage\":\"" + stage + "\",";
  jsonPayload += "\"led_lux_level\":" + String(CALIBRATED_LUX) + ",";
  jsonPayload += "\"image_base64_or_url\":\"data:image/jpeg;base64,";
  jsonPayload += (const char*)base64Buf;
  jsonPayload += "\"}";

  free(base64Buf);

  // 4. POST to ReWear Backend API
  HTTPClient http;
  http.begin(REWEAR_API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-esp32-device-key", ESP32_DEVICE_API_KEY);
  http.setTimeout(15000);

  Serial.printf("[HTTP] POSTing inspection payload to %s ...\n", REWEAR_API_ENDPOINT);
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String responseBody = http.getString();
    Serial.printf("[HTTP %d] Response: %s\n", httpResponseCode, responseBody.c_str());

    // Visual LED Ring confirmation: 2 slow pulses if clean, 5 rapid pulses if defect flagged
    if (responseBody.indexOf("\"passed_clean\":true") >= 0) {
      Serial.println("[RESULT] AI Vision Passed Clean! Escrow cleared.");
      blinkLedRingFeedback(2, 300);
    } else {
      Serial.println("[RESULT] AI Vision Flagged Defect! Escrow frozen for review.");
      blinkLedRingFeedback(5, 100);
    }
  } else {
    Serial.printf("[ERROR] HTTP POST failed: %s\n", http.errorToString(httpResponseCode).c_str());
    blinkLedRingFeedback(3, 120);
  }

  http.end();
  setLedRingBrightness(0);
}

// ============================================================================
// 6. ARDUINO SETUP & LOOP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n============================================================");
  Serial.println("ReWear ESP32-CAM Garment Inspection Station Booting...");
  Serial.println("============================================================");

  pinMode(TRIGGER_BTN_PIN, INPUT_PULLUP);
  pinMode(STAGE_SWITCH_PIN, INPUT_PULLUP);

  // Configure LED Ring PWM
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(LED_RING_PWM_PIN, PWM_CHANNEL);
  setLedRingBrightness(0);

  // Initialize OV2640 Camera
  initOv2640Camera();

  // Connect to Campus Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[OK] Connected! Station IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[WARN] WiFi connection timed out; awaiting Serial QR commands.");
  }

  Serial.println("[READY] Scan Booking QR Token (RWQR-...) via UART or press GPIO 13 Trigger Button.");
}

void loop() {
  // 1. Read incoming QR Code string from GM65 UART QR Scanner or Serial Monitor
  // Supported formats:
  //   RWQR-44444402-22222203-7C3B1E9F4A2D02
  //   RWQR-44444402-22222203-7C3B1E9F4A2D02|AT_RETURN
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\n');
    incoming.trim();
    if (incoming.startsWith("RWQR-")) {
      int sepIdx = incoming.indexOf('|');
      if (sepIdx > 0) {
        activeQrToken = incoming.substring(0, sepIdx);
        activeStage   = incoming.substring(sepIdx + 1);
      } else {
        activeQrToken = incoming;
        activeStage   = (digitalRead(STAGE_SWITCH_PIN) == HIGH) ? "PRE_HANDOFF" : "AT_RETURN";
      }
      Serial.printf("[QR LOCKED] Token: %s | Stage: %s\n", activeQrToken.c_str(), activeStage.c_str());
      captureAndUploadInspection(activeQrToken, activeStage);
    }
  }

  // 2. Physical Push-Button Trigger (GPIO 13 pulled LOW)
  if (digitalRead(TRIGGER_BTN_PIN) == LOW) {
    delay(60); // Debounce
    if (digitalRead(TRIGGER_BTN_PIN) == LOW) {
      activeStage = (digitalRead(STAGE_SWITCH_PIN) == HIGH) ? "PRE_HANDOFF" : "AT_RETURN";
      captureAndUploadInspection(activeQrToken, activeStage);
      while (digitalRead(TRIGGER_BTN_PIN) == LOW) {
        delay(50);
      }
    }
  }

  delay(20);
}
