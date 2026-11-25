# ReWear — AI-Assisted Peer-to-Peer Circular Clothing Rental Platform

> **"Wear More. Waste Less. Give Every Garment Another Life."**  
> Launching at **Dayananda Sagar University (DSU), Bengaluru** (Harohalli Main Campus, Kudlu Gate City Innovation Campus, Kumaraswamy Layout) with scalability across Bengaluru (Jayanagar, Koramangala, Indiranagar, HSR Layout) and India.

---

## 1. Strict UI & Color Palette Specification

Every component in `frontend/src/` adheres strictly to the 6-color editorial palette with crisp `1px` `#000000` structural borders:

| Role | Color Name | Hex Code | Usage Across UI |
| :--- | :--- | :--- | :--- |
| **Primary Brand / Trust & Sustainability** | Teal Slate | `#588B8B` | Verification badges, Sustainability Impact Wallet header, Environmental Savings banners |
| **Canvas / Clean Background** | Pure White | `#FFFFFF` | Page canvas, editorial cards, form inputs |
| **Soft Surface / Cards / Highlights** | Warm Peach | `#FFD5C2` | Pricing callouts, Impact Wallet container, filter consoles, calendar buffer cells |
| **Primary CTA / Interactive Accents** | Vibrant Tangerine | `#F28F3B` | Primary action buttons, AI Auto-Fill button, active navigation tabs, star ratings |
| **Alerts / Damage Flags / High-Value Badges** | Terracotta Red | `#C8553D` | `HIGH_VALUE_CONCIERGE` badges, KYC gate locks, AI Defect bounding boxes, dispute flags |
| **Primary Typography / High-Contrast Borders** | Pure Black | `#000000` | Primary typography, `1px` structural borders, hard offset editorial shadows |

---

## 2. Complete Monorepo Folder Structure

```text
ReWear/
├── package.json                                        # Monorepo workspace scripts
├── README.md                                           # Setup guide & End-to-End Demo Script
├── hardware/
│   └── esp32_inspection_station/
│       ├── esp32_rewear_inspector.ino                  # Production ESP32-CAM + LED Ring firmware
│       └── README.md                                   # BOM, GPIO pinout wiring diagram & calibration
├── backend/                                            # Node.js + Express.js + PostgreSQL (Prisma ORM)
│   ├── package.json
│   ├── .env.example                                    # DB, JWT, QR, Gemini/OpenAI, & ESP32 API keys
│   ├── prisma/
│   │   ├── schema.prisma                               # 9-table PostgreSQL Prisma schema
│   │   ├── seed.js                                     # Database seeder for DSU & Bengaluru
│   │   └── migrations/
│   │       └── 20261125000000_init_rewear_schema/
│   │           └── migration.sql                       # Raw PostgreSQL DDL (ENUMs, FKs, CHECKs, Indexes)
│   └── src/
│       ├── index.js                                    # Express REST API server (:4000)
│       ├── auth/
│       │   └── jwtAuth.js                              # HS256 JWT auth & tokenized KYC generators
│       ├── data/
│       │   └── seedData.js                             # Realistic DSU & Bengaluru relational dataset
│       ├── db/
│       │   └── repository.js                           # Prisma connector + live stateful seed fallback
│       └── services/
│           ├── aiWardrobeService.js                    # AI Garment Vision + Smart Price Recommender
│           ├── aiIntelligenceSuite.js                  # Utilisation Assistant, End-of-Life, Demand Forecast
│           ├── impactCalculator.js                     # Personal Water (L), Carbon (kg CO2e), Energy (kWh)
│           └── inspectionAndEscrowService.js           # Signed QR tokens, ESP32 AI Defect Detection, Escrow
└── frontend/                                           # React + Vite + React Router + Tailwind CSS + Lucide
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js                              # Strict ReWear 6-color editorial theme
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── theme/
        │   └── rewearTheme.js
        ├── data/
        │   └── fallbackData.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── GarmentCard.jsx
        │   ├── VerificationCenterModal.jsx             # 3-Tier KYC Center (Basic, DSU Student, Aadhaar KYC)
        │   ├── CheckoutEscrowModal.jsx                 # Live Environmental Savings + Razorpay Route Escrow
        │   ├── QrCodeBadge.jsx                         # Deterministic matrix QR code SVG generator
        │   └── DualRatingModal.jsx                     # Dual-sided 1-5 star & quick-tag post-rental rating
        └── pages/
            ├── MarketplacePage.jsx                     # Smart Discovery Feed + Date/Color/Price Filters
            ├── GarmentDetailPage.jsx                   # Gallery, +1d Buffer Calendar, End-of-Life & Timeline
            ├── ListGarmentPage.jsx                     # "List an Outfit" AI Studio + Smart Price Pills
            ├── BookingsAndConditionPage.jsx            # State Machine, ESP32 Simulator & Side-by-Side Diff
            ├── ProfileDashboardPage.jsx                # Impact Wallet, Demand Forecast, Utilisation Optimizer
            ├── PartnersAndKycPage.jsx                  # 1-Click Bengaluru Care Partners & KYC Verifier
            ├── AuthPage.jsx                            # Unified JWT Login/Register + Demo Persona Switcher
            └── SchemaAndThemePage.jsx                  # Interactive 6-Color Palette & 9-Table Schema Audit
```

---

## 3. Environment Configuration (`backend/.env.example`)

Copy [backend/.env.example](file:///Users/prajwalt/Desktop/ReWear/backend/.env.example) to `backend/.env`:

```env
# 1. PostgreSQL Connection (Prisma ORM)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rewear_db?schema=public"

# 2. Express Server & Platform Commission
PORT=4000
NODE_ENV=development
PLATFORM_FEE_PERCENT=10

# 3. JWT & QR Cryptographic Signing Secrets
JWT_SECRET="rewear-dsu-bengaluru-circular-jwt-secret-2026"
QR_SECRET="rewear-esp32-qr-inspection-secret-dsu-2026"

# 4. Multimodal AI Vision Key (Optional — falls back to deterministic ReWear Vision Heuristic if unset)
GEMINI_API_KEY=""
OPENAI_API_KEY=""

# 5. ESP32-CAM Hardware Inspection Station API Key
ESP32_DEVICE_API_KEY="rw_esp32_hw_key_dsu_harohalli_2026"
```

> **Note on Graceful Local Demo Mode**:  
> - If local PostgreSQL is not running, [repository.js](file:///Users/prajwalt/Desktop/ReWear/backend/src/db/repository.js) automatically boots an in-memory stateful relational store hydrated with the exact DSU & Bengaluru seed records.  
> - If `GEMINI_API_KEY` is left blank, all 6 AI endpoints (`/api/ai/analyze-garment`, `/api/ai/recommend-price`, `/api/ai/inspect-condition`, `/api/ai/wardrobe-insights/:userId`, `/api/ai/end-of-life/:garmentId`, `/api/ai/demand-forecast`) seamlessly use deterministic structured heuristics.

---

## 4. Installation, Database Migration & Startup

```bash
# 1. Install dependencies across root, backend, and frontend
npm install

# 2. (Optional when local PostgreSQL is running) Generate Prisma client, run SQL migration & seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 3. Start Backend API (http://localhost:4000) and Frontend Dev Server (http://localhost:5173)
npm run dev:backend
npm run dev:frontend
```

---

## 5. Step-by-Step End-to-End Demo Script

Follow this 5-part walkthrough to demonstrate the entire ReWear platform end-to-end:

### Demo Step 1: 3-Tier Identity Verification & High-Value Concierge Gating
1. Navigate to **`/auth`** (**Auth / Switch** in the top bar).
2. In the **Instant Demo Switcher** on the right, click **"Switch Account"** on **Rohan Kulkarni** (`STUDENT_VERIFIED` via `@dsu.edu.in`) or **Karthik Reddy** (`UNVERIFIED`).
3. Go to **`/`** (**Campus Closet**) and click **"Rent w/ Escrow"** on the *Sabyasachi-Inspired Emerald Silk Organza Lehenga Set* (`HIGH_VALUE_CONCIERGE`, Retail ₹28,500).
4. Observe the **`#C8553D` Terracotta Red KYC Gate** blocking the booking because `HIGH_VALUE_CONCIERGE` outfits (Retail $\ge$ ₹5,000) strictly require `AADHAAR_KYC_VERIFIED`.
5. Click **"Open 3-Tier Verification Center"** $\to$ test the Privacy Block by entering 12 raw digits (watch it reject raw Aadhaar storage) $\to$ clear the test field and click **"Complete 3rd-Party KYC (`AADHAAR_KYC_VERIFIED`)"** to mint an anonymized `DIGILOCKER_TKN_...` reference token and unlock Concierge rentals.

### Demo Step 2: "List an Outfit" AI Studio & Smart Rental Price Recommender
1. Navigate to **`/list`** (**List Garment**).
2. Under **Quick-Test AI Vision Presets**, select *"Ivory Chikankari Mirror Sherwani"* or *"Champagne Satin Corset Party Gown"* (or upload a local garment image).
3. Click **"Auto-Fill with ReWear AI"** (`POST /api/ai/analyze-garment` + `POST /api/ai/recommend-price`).
4. Watch `category`, `primary_color`, `secondary_color`, `pattern`, `style_tags`, `occasion`, editorial title/description, and the **3 Clickable AI Price Recommendation Pills (`Min`, `★ AI Optimal`, `Max`)** + **Monthly Earnings Forecast** populate automatically.
5. Click any price pill (or enter a custom price) and click **"Publish Outfit to ReWear Circular Closet"**.

### Demo Step 3: Smart Discovery Filters, Checkout Sustainability Calculator & Escrow QR
1. Navigate to **`/`** (**Campus Closet**).
2. Filter outfits by **Occasion Pills** (`Wedding`, `Formal`, `College Event`), **Category**, **Color**, **DSU Campus Hub**, or **`available_from` / `available_to` dates** (which automatically hides outfits locked in active rentals or their `+1d` post-return cleaning buffer).
3. Click **"Rent w/ Escrow"** on any available outfit to open the **Razorpay Route Escrow Checkout Modal**.
4. Review the **Live Checkout Environmental Savings Card (`#588B8B` & `#FFD5C2`)** displaying exact **Water Saved (L)**, **Carbon Avoided ($\text{kg CO}_2\text{e}$)**, and **Energy Saved (kWh)** for renting that specific category vs. buying new.
5. Review the **Razorpay Route Escrow Split** (`rental_amount + pickup_fee + refundable_deposit` held in `ESCROW_HELD`) and click **"Authorize Escrow & Mint QR"** to generate the cryptographically signed `inspection_qr_token` (`RWQR-...`) and scannable matrix QR code.

### Demo Step 4: ESP32-CAM Hardware QR Inspection & Side-by-Side Dispute Engine
1. Navigate to **`/bookings`** (**Escrow & 5-Pt Log**).
2. View the active booking's **Interactive State Machine Stepper** (`REQUESTED` $\to$ `APPROVED` $\to$ `HANDED_OVER` $\to$ `ACTIVE` $\to$ `RETURNED` $\to$ `COMPLETED`) and scannable **Inspection QR Token**.
3. In the **ESP32-CAM + Controlled LED Ring Station Simulator** (`POST /api/hardware/esp32-inspection`):
   - Select Stage: `AT_RETURN`, Device: `ESP32-CAM-DSU-HAROHALLI-01`, Lux: `865`, and Sample Condition: `Stain + Zipper Snag Detected (Score 64/100 • Auto-Dispute)`.
   - Click **"Simulate ESP32 Hardware Scan (QR-Linked)"**.
4. Scroll down to the **Side-by-Side Dispute Resolution Engine**:
   - Compare the timestamped `PRE_HANDOFF` baseline photo (`99/100`) against the `AT_RETURN` photo (`64/100`) with **`#C8553D` AI Defect Bounding Boxes** highlighting the stain and zipper snag.
   - Adjust the **Repair Deduction (₹)** in the **Razorpay Route Escrow Settlement Calculator** and click **"Settle Dispute & Release Escrow"** to release `(rental_amount - 10% commission + repair credit)` to the Lender and refund the remaining deposit to the Borrower.

### Demo Step 5: AI Wardrobe Intelligence Suite, End-of-Life Advisor & 1-Click Local Care
1. Navigate to **`/profile`** (**Profile & Impact**).
2. Review the **AI Demand Prediction Engine** banner (*"High demand predicted for Pastel Lehengas & Men’s Blazers in the next 14 days — list yours now"*) and upcoming DSU Cultural Fest & Placement Gala cards (`GET /api/ai/demand-forecast`).
3. In the **AI Wardrobe Utilisation Assistant** (`GET /api/ai/wardrobe-insights/:userId`), click **"Apply 1-Click Fix"** on recommendations like *"Lower daily price (+35% Est. Bookings)"* or *"Add 2 natural-light photos"* to optimize listings immediately.
4. Review the **Personal Sustainability Impact Wallet** (`Water L`, `Carbon kg CO2e`, `Energy kWh`, `Net Lender Earnings ₹`) and separate **Lender Rating** & **Borrower Rating** cards. Click **"Rate Lender / Borrower"** to test the dual-sided post-rental rating modal with quick tags.
5. Click **"End-of-Life Advisor & Timeline"** on any garment to open **`/garments/:id`**, inspect the **AI Garment End-of-Life Advisor** (`Keep Renting`, `Repair`, `Resell`, `Donate/Upcycle`), and click **"Log & Book Partner"** or visit **`/partners`** to book a verified Bengaluru dry cleaner, master tailor, resale collective, or NGO in one click and watch the **Chronological Garment Lifecycle Timeline** update live.
