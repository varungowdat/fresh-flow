# 🛒 KiranaDeals — Hyperlocal Near-Expiry Discount Platform

> Giving India's neighbourhood kirana stores a fighting chance — one discounted product at a time.

---

## 📌 Project Overview

**KiranaDeals** is a real-time hyperlocal web platform that connects small kirana shopkeepers with nearby customers by surfacing near-expiry products at AI-suggested discounts. Shopkeepers reduce losses and food waste; customers get genuine deals within walking distance. No delivery. No middlemen. Just fast, trust-based neighbourhood commerce.

---

## 🚀 Recent Updates (Hackathon)

- **Twilio OTP Call Integration**: Created `send-otp-call.js` for real-time automated phone calls to deliver OTPs.
- **UI Refinements**:
  - Removed "Find Deals Near Me" and "I'm a Shopkeeper" buttons from the hero section.
  - Added **Licence Number** requirement in the Shopkeeper Login modal.
  - Added **FSSAI Number** requirement in the Shopkeeper Product Upload form.

---

## 🗂️ Project Structure

```
kirana-deals/
├── public/
│   └── logo-placeholder.png          # Replace with actual brand logo
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx           # Root page — shared entry point
│   │   ├── ShopkeeperDashboard.jsx   # Shopkeeper's main interface
│   │   └── CustomerHome.jsx          # Customer's deal discovery interface
│   ├── components/
│   │   ├── Navbar.jsx                # Shared top navigation bar
│   │   ├── SignInModal.jsx           # Login/signup modal (Customer / Shopkeeper)
│   │   ├── ProductUploadForm.jsx     # Upload near-expiry product (Shopkeeper)
│   │   ├── ExpiryQueue.jsx           # Products nearing expiry tracker
│   │   ├── QueueManager.jsx          # 20-min customer reservation manager
│   │   ├── DealCard.jsx              # Customer-facing deal card component
│   │   ├── MapView.jsx               # Hyperlocal map with deal pins
│   │   └── SearchBar.jsx             # Product + location search (Customer)
│   ├── utils/
│   │   ├── aiDiscount.js             # AI discount suggestion logic
│   │   └── geolocation.js            # Location utilities
│   ├── App.jsx
│   └── main.jsx
├── README.md
└── package.json
```

---

## 🖥️ Pages & Features

---

### 1. 🏠 Landing / Login Page

**Route:** `/`

**Purpose:** Entry point for all users — no content shown until role is selected.

**Layout:**
- Completely blank content area (intentional — no home feed until signed in)
- **Top Navigation Bar** with:
  - **Top-Left:** Logo placeholder (leave blank / use a box placeholder — logo to be provided later)
  - **Top-Right:** Two CTA buttons:
    - `Sign in as Customer`
    - `Sign in as Shopkeeper`

**Behaviour:**
- Clicking either button opens a Sign In / Sign Up modal scoped to that role
- After successful login, user is redirected to their respective dashboard
- No cross-role access — a shopkeeper token cannot view the customer app and vice versa

---

### 2. 🏪 Shopkeeper Dashboard

**Route:** `/shopkeeper/dashboard`

**Access:** Shopkeeper login only

#### 2a. Top Navigation Bar (Shopkeeper)
| Tab | Description |
|-----|-------------|
| **Dashboard** | Overview stats — active deals, reserved items, expired losses saved |
| **Upload Product** | Form to add a near-expiry product |
| **Expiring Soon** | List of products approaching expiry with queue + reservation status |

---

#### 2b. Upload Product Page

**Route:** `/shopkeeper/upload`

**Form Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Product Name | Text input | e.g., "Amul Butter 100g" |
| Category | Dropdown | Dairy / Bakery / Snacks / Beverages / Staples / Other |
| MRP (₹) | Number input | Original price |
| Expiry Date | Date picker | Must be a future date |
| FSSAI Number | Text input | Added for compliance |
| Product Photo | Image upload | Mobile camera-friendly; max 5MB |
| Stock Quantity | Number input | How many units available |
| Shopkeeper's Own Discount (%) | Optional number | If left blank, AI calculates |

**AI Discount Engine (`aiDiscount.js`):**

```
Days Remaining → Suggested Discount

> 7 days     →  5–10%   (Early bird, gentle nudge)
5–7 days     →  15–20%  (Move it now)
3–4 days     →  25–35%  (Urgent clearance)
1–2 days     →  40–60%  (Last chance)
Same day     →  60–80%  (Emergency clearance)
```

- Discount is calculated automatically on date entry
- Shopkeeper sees the AI suggestion with a note: *"AI recommends X% based on Y days remaining"*
- Shopkeeper can **override** with their own discount percentage
- Final discounted price is shown in real time as the form is filled
- On submit → product goes **live instantly** on the customer map

---

#### 2c. Expiring Soon Page

**Route:** `/shopkeeper/expiring`

**Purpose:** A live dashboard of all active listings sorted by urgency (soonest expiry first).

**Each product card shows:**
- Product name + photo thumbnail
- MRP → Discounted Price
- Expiry date + **days remaining** (colour-coded: red < 2 days, orange 3–5, yellow 6–7)
- Current discount %
- **Queue Status:**
  - Number of customers currently in reservation queue
  - If a customer has reserved: show `🔒 Reserved by Customer — 18 min remaining`
  - If reservation expired (customer didn't collect): show `⚠️ Reservation Lapsed — Back on Market`
  - Shopkeeper can manually **release** a reservation if needed

**Queue Logic (important — see Section 4 for full detail)**

---

### 3. 🛍️ Customer Home

**Route:** `/customer/home`

**Access:** Customer login only

#### 3a. Top Navigation Bar (Customer)
| Element | Description |
|---------|-------------|
| Logo | Top-left placeholder |
| **Deals Near Me** | Default landing tab — hyperlocal map + deal cards |
| **Search** | Search bar for product name + location (see 3c) |
| Profile icon | Account / logout |

---

#### 3b. Deals Near Me (Default View)

**Layout:** Split view (or toggle)
- **Map View** — Interactive map (Leaflet.js / Google Maps) centred on user's current location. Each deal is a map pin showing:
  - Store name
  - Product thumbnail
  - Discounted price
  - Distance (e.g., "340m away")
  - Expiry urgency badge (colour-coded dot)
- **List / Card View** — Scrollable feed of `DealCard` components sorted by:
  - Distance (default)
  - Discount % (optional sort)
  - Expiry urgency (optional sort)

**DealCard Component shows:**
- Product photo
- Product name + category
- ~~MRP~~ → **Discounted Price** (bold)
- Discount badge (e.g., `35% OFF`)
- Store name + distance
- Expiry date + days remaining
- `Reserve for 20 Minutes` button

---

#### 3c. Search Page

**Route:** `/customer/search`

**Elements:**
- Search input: product name (e.g., "bread", "milk", "chips")
- Optional location filter: enter pin code / area name, or use current location
- Results shown as filterable cards (same `DealCard` format)
- Filters: Category, Max Distance, Min Discount %

---

### 4. ⏱️ 20-Minute Reservation Queue System

This is the core trust mechanism of the platform.

#### How It Works

**Customer Side:**
1. Customer taps `Reserve for 20 Minutes` on a DealCard
2. A **20-minute countdown timer** starts (shown prominently on their screen)
3. The item is marked as `Reserved` on the map — other customers cannot reserve it during this window
4. Customer walks to the store, shows their reservation on the app, and collects the item
5. Shopkeeper marks it as `Collected` → deal closes

**If Customer Does NOT Collect in 20 Minutes:**
- Reservation automatically expires
- Product is **immediately relisted** on the map for other customers
- Customer receives a notification: *"Your reservation for [Product] has expired. The deal is back on the market."*
- Shopkeeper sees: *"⚠️ Reservation by [Customer ID] lapsed — product is now visible to all again"*

**Shopkeeper Controls:**
- Can view active reservation (who reserved, time remaining)
- Can manually release a reservation (e.g., customer said they're not coming)
- Cannot delete a product while it has an active reservation (must release first)

**Rules:**
- One customer can hold maximum **3 active reservations** at a time
- Same customer cannot re-reserve the same item within 2 hours of a lapsed reservation
- Items with 0 stock left are automatically delisted

---

## 🤖 AI Discount Suggestion — Specification

**File:** `src/utils/aiDiscount.js`

**Input:**
```js
{
  expiryDate: "2025-08-05",   // ISO date string
  mrp: 120,                   // Original price in ₹
  category: "Dairy",          // Product category
  quantity: 3                 // Units available
}
```

**Logic:**
```js
const daysLeft = differenceInDays(expiryDate, today);

const discountMap = {
  "0":   { min: 60, max: 80 },
  "1":   { min: 45, max: 60 },
  "2":   { min: 35, max: 45 },
  "3-4": { min: 25, max: 35 },
  "5-7": { min: 15, max: 25 },
  "8+":  { min: 5,  max: 15 },
};

// Category modifier: perishables (Dairy, Bakery) → add +5%
// High quantity (> 5 units) → add +3% to move stock faster
```

**Output:**
```js
{
  suggestedDiscount: 35,         // Recommended discount %
  discountedPrice: 78,           // MRP after discount
  urgencyLabel: "Move it now",   // Human-readable label
  reasoning: "3 days to expiry. Dairy product — slightly higher discount advised."
}
```

**Important:** The shopkeeper always sees the AI suggestion with reasoning. They can accept it or type their own discount. The final discount used is always the shopkeeper's choice (defaulting to AI if no override).

---

## 🗺️ Map Integration

**Recommended Library:** Leaflet.js (open source, mobile-friendly, works without heavy API costs)

**Fallback Option:** Google Maps JavaScript API (if budget allows)

**Map Behaviour:**
- On load: request user's geolocation
- Show all active deals within a configurable radius (default: 2km)
- Each pin = one deal (cluster pins if > 5 deals from same store)
- Tapping a pin opens a bottom sheet with the full `DealCard`
- Reserved items shown with a greyed-out pin and lock icon

---

## 🔐 Authentication

**Two Separate Auth Flows:**

| Role | Sign Up Requires | Sign In |
|------|-----------------|---------|
| Customer | Name, Phone, PIN code | Phone + OTP |
| Shopkeeper | Name, Phone, Shop Name, Address, Licence Number | Phone + OTP |

- OTP-based login (no passwords) — suits low-digital-literacy users
- JWT tokens stored in `localStorage` / `sessionStorage`
- Role is encoded in token — routing guards enforce `/shopkeeper/*` vs `/customer/*`

---

## 📱 Mobile-First Design Principles

This platform is primarily used on **budget Android phones** in India.

| Principle | Implementation |
|-----------|---------------|
| Low-literacy friendly | Icon + text labels everywhere, no jargon |
| Large tap targets | All buttons min 48×48px |
| Camera-first upload | Default to camera on mobile for product photo |
| Slow connection tolerant | Lazy load images, skeleton screens while loading |
| Vernacular ready | Architecture should support i18n (Hindi, Kannada, Tamil etc. — Phase 2) |
| Offline graceful | Show cached deals if network drops; no blank error screens |

---

## 🧱 Tech Stack (Recommended)

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Map | Leaflet.js + OpenStreetMap |
| State | Zustand (lightweight) |
| Auth | Firebase Auth (OTP) or Supabase |
| Backend | Node.js + Express or Supabase Edge Functions |
| Database | PostgreSQL (via Supabase) or Firebase Firestore |
| Storage | Firebase Storage / Supabase Storage (product photos) |
| Realtime | Supabase Realtime or Firebase Firestore listeners (for queue updates) |
| AI Discount | Pure JS logic (no external AI API needed for V1) |

---

## 📋 Build Order for AI / Developer

Build the pages in this sequence for the smoothest development flow:

```
Phase 1 — Shell & Auth
  ├── [1] LandingPage.jsx         — blank page + navbar with two sign-in buttons
  ├── [2] Navbar.jsx              — shared navigation bar component
  └── [3] SignInModal.jsx         — role-based login/signup modal

Phase 2 — Shopkeeper Flow
  ├── [4] ShopkeeperDashboard.jsx — tabbed layout (Dashboard / Upload / Expiring)
  ├── [5] ProductUploadForm.jsx   — upload form with AI discount engine
  ├── [6] aiDiscount.js           — discount calculation utility
  └── [7] ExpiryQueue.jsx         — expiring products tracker + reservation status

Phase 3 — Customer Flow
  ├── [8] CustomerHome.jsx        — deals feed + map view
  ├── [9] DealCard.jsx            — reusable product deal card
  ├── [10] MapView.jsx            — Leaflet map with deal pins
  └── [11] SearchBar.jsx          — product + location search

Phase 4 — Queue System
  └── [12] QueueManager.jsx       — 20-min reservation timer + release logic

Phase 5 — Polish
  ├── Skeleton loaders
  ├── Toast notifications (reservation confirmed, lapsed, etc.)
  ├── Responsive mobile optimisation
  └── Empty states (no deals nearby, no expiring products)
```

---

## ⚙️ Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIREBASE_API_KEY=your_firebase_key          # if using Firebase Auth
VITE_MAPS_API_KEY=your_google_maps_key           # optional, Leaflet needs no key
VITE_DEFAULT_RADIUS_KM=2                         # deal discovery radius
VITE_RESERVATION_TIMEOUT_MINUTES=20

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
OTP_RECIPIENT_PHONE_NUMBER=recipient_phone_number
```

---

## 🚫 Out of Scope for V1

- Delivery / logistics (pick-up only)
- In-app payments (cash at store only)
- Reviews or ratings
- Multi-language UI (architecture should allow it in V2)
- Analytics dashboard

---

## 💡 Key UX Decisions to Preserve

1. **The logo space is intentionally left blank** — a brand asset will be provided separately. Render a rectangular placeholder box in the top-left navbar position.
2. **Landing page has zero content** — it is purely a gateway. No deals are shown before login.
3. **Shopkeeper overrides AI** — never force the AI discount. Always show it as a suggestion with a visible override field.
4. **Reservation lapses silently** — when a 20-min window expires, the product relists automatically without requiring any shopkeeper action.
5. **Map is the soul of the customer experience** — it should load first, feel fast, and have visually distinct urgency indicators.

---

## 📄 Licence

MIT — open for community contribution and local adaptation.

---

*Built for Bharat. Built for the kirana. Built to last.*
