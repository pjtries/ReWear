# ReWear ESP32-CAM + Controlled LED Ring Garment Inspection Station

> **Hardware Companion Documentation**  
> **Station Locations**: Dayananda Sagar University (DSU Harohalli Main Campus Hostel Gate, Kudlu Gate Innovation Campus) & Bengaluru Concierge Hubs (Jayanagar, Kumaraswamy Layout, Koramangala).

---

## 1. Hardware Bill of Materials (BOM)

| Component | Specification | Purpose |
| :--- | :--- | :--- |
| **Microcontroller & Camera** | AI-Thinker **ESP32-CAM** (with OV2640 2MP sensor & 4MB PSRAM) | High-resolution UXGA (`1600x1200`) garment photography & HTTPS JSON upload |
| **Controlled Lighting** | 16-LED **5600K High-CRI Daylight Ring Light** (or WS2812B Ring driven at 5600K white) + IRLZ44N Logic-Level N-Channel MOSFET | Delivers calibrated **~865 Lux** uniform shadowless lighting across fabric weave |
| **QR Scanner Module (Optional)** | **GM65 UART 1D/2D QR Barcode Scanner** (or USB Serial bridge) | Reads the signed `inspection_qr_token` (`RWQR-...`) from the borrower/lender's phone screen |
| **Tactile Trigger Button** | 12mm Momentary Push Button | Triggers controlled LED ramp + OV2640 frame capture |
| **Stage Selector Switch** | SPDT Toggle Switch | Selects `PRE_HANDOFF` (`HIGH`) vs `AT_RETURN` (`LOW`) |
| **Power Supply** | Regulated **5V 2.5A DC** Buck Adapter | Powers ESP32-CAM (`5V` pin) and external LED Ring without brownout resets |

---

## 2. Wiring Diagram & Pinout Mapping

```text
                  +-----------------------------------------+
                  |        AI-THINKER ESP32-CAM             |
                  |                                         |
  5V 2.5A PSU --->| 5V                               GPIO 12|---> IRLZ44N Gate (16-LED 5600K Ring)
          GND --->| GND                              GPIO 13|---> Momentary Capture Button (to GND)
                  |                                  GPIO 14|---> Stage Toggle Switch (HIGH=PRE, LOW=RETURN)
  GM65 QR TX  --->| U0RXD (GPIO 3)                   U0TXD  |---> Serial Monitor / Debug (115200 baud)
                  +-----------------------------------------+
```

### Detailed Pin Connections
1. **Controlled LED Ring (`GPIO 12`)**:
   - Connect `GPIO 12` through a `220 Ω` resistor to the Gate of an `IRLZ44N` MOSFET (or Data-In of a 5V WS2812B LED Ring).
   - Connect a `10 kΩ` pull-down resistor from MOSFET Gate to `GND`.
   - Connect the LED Ring `V+` to the external `5V 2.5A` rail and `V-` to the MOSFET Drain (Source to common `GND`).
2. **Capture Trigger Push-Button (`GPIO 13`)**:
   - Connect one leg of the push-button to `GPIO 13` and the other leg to `GND`.
   - Firmware enables `INPUT_PULLUP` internally; pressing the button pulls `GPIO 13` `LOW` to trigger a calibrated capture.
3. **Stage Selector Switch (`GPIO 14`)**:
   - Connect the center pole to `GPIO 14` (`INPUT_PULLUP`).
   - Open (`HIGH`) = `PRE_HANDOFF` baseline scan; Closed to `GND` (`LOW`) = `AT_RETURN` post-rental inspection scan.
4. **GM65 QR Scanner (`U0RXD / GPIO 3`)**:
   - Configure the GM65 QR scanner to **UART 115200 baud, CR+LF suffix**.
   - Scanning a ReWear booking QR code sends `RWQR-44444402-22222203-7C3B1E9F4A2D02\n` directly into `Serial`, locking the booking token and triggering the capture automatically.

---

## 3. Flashing & Calibration Instructions

1. **Arduino IDE Setup**:
   - Install the **ESP32 Board Package** (`esp32 by Espressif Systems`).
   - Select Board: **`AI Thinker ESP32-CAM`**, Partition Scheme: **`Huge APP (3MB No OTA/1MB SPIFFS)`**, PSRAM: **`Enabled`**.
2. **Configure Credentials**:
   - Open [esp32_rewear_inspector.ino](file:///Users/prajwalt/Desktop/ReWear/hardware/esp32_inspection_station/esp32_rewear_inspector.ino) and set:
     - `WIFI_SSID` / `WIFI_PASSWORD`
     - `REWEAR_API_ENDPOINT` (e.g., `http://<YOUR_LAN_IP>:4000/api/hardware/esp32-inspection`)
     - `ESP32_DEVICE_API_KEY` (must match `ESP32_DEVICE_API_KEY` in `backend/.env`)
3. **Testing Without Physical Hardware**:
   - Open the ReWear web app at `/bookings` (**Escrow & 5-Pt Log** tab) and click **"Simulate ESP32 Hardware Scan (QR-Linked)"**, or run:
     ```bash
     curl -X POST http://localhost:4000/api/hardware/esp32-inspection \
       -H "Content-Type: application/json" \
       -H "x-esp32-device-key: rw_esp32_hw_key_dsu_harohalli_2026" \
       -d '{
         "qr_token": "RWQR-44444402-22222203-7C3B1E9F4A2D02",
         "device_id": "ESP32-CAM-DSU-HAROHALLI-01",
         "stage": "AT_RETURN",
         "led_lux_level": 865,
         "simulate_defect_mode": "DAMAGE_FLAGGED"
       }'
     ```
