# 🔧 KiranaDeals — Fix All Problems

## 🚨 Problems Found (7 total)

### Problem 1 — ❌ No `customers` table in database
Customer login data is **NOT stored anywhere**. When a customer signs up with name/phone, it's only kept in React state (lost on refresh). The `reservations` table stores `customer_name` as plain text but there's no proper customer record.

### Problem 2 — ❌ Login is completely fake
Both shopkeeper and customer login accept **any username/password** — there's no real auth. `SAVED_ACCOUNTS` is just a JS object that resets on page refresh.

### Problem 3 — ❌ Map is a hardcoded SVG drawing
`MockMap` component is a static SVG with manually placed pins. Not a real map. Pins don't correspond to actual shop locations.

### Problem 4 — ❌ Distances are fake strings
Deal cards show hardcoded strings like `"180m"`, `"340m"`. No real geolocation or distance calculation. Shop `latitude`/`longitude` columns exist in schema but are never populated.

### Problem 5 — ❌ No Groq AI integration
The AI discount engine is simple if/else math. No LLM intelligence for smarter pricing, product descriptions, or recommendations.

### Problem 6 — ❌ Shopkeeper greeting is hardcoded
Dashboard always says "Good morning, Ramesh 👋" regardless of who logged in.

### Problem 7 — ❌ No FSSAI number stored in products table
The upload form collects FSSAI but the schema column for FSSAI is on `shops`, not `products`, and the `createProduct` call doesn't send it.

---

## Proposed Changes

### 1. Database — Add `customers` table + fix `products` FSSAI

#### [MODIFY] [schema.sql](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/supabase/schema.sql)

Add this SQL to your Supabase SQL editor:
```sql
-- CUSTOMERS TABLE
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  pin_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now()
);
create unique index if not exists customers_name_idx on public.customers(name);

alter table public.customers enable row level security;
create policy "Anyone can read customers" on public.customers for select to anon, authenticated using (true);
create policy "Anyone can add customers" on public.customers for insert to anon, authenticated with check (true);
create policy "Anyone can update customers" on public.customers for update to anon, authenticated using (true) with check (true);

-- Add FSSAI to products
alter table public.products add column if not exists fssai_number text;

-- Add customer_id to reservations (link to customers table)
alter table public.reservations add column if not exists customer_id uuid references public.customers(id);
```

> [!IMPORTANT]
> **You need to run this SQL in Supabase SQL Editor** (same way you ran the RLS policies).

---

### 2. Real Geolocation + Distance Calculation

#### [NEW] [geolocation.js](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/utils/geolocation.js)

- Use browser's `navigator.geolocation` to get customer's lat/lng
- Haversine formula to calculate real distance between customer and shop
- Format distance as "180m" / "1.2km"

#### [MODIFY] [App.jsx](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/App.jsx)
- On customer login, request location permission and store lat/lng
- Calculate real distances for each deal card
- Sort "Deals Near Me" by actual distance

---

### 3. Real Map with Leaflet.js

#### [MODIFY] [App.jsx](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/App.jsx)
- Replace `MockMap` with real Leaflet.js map
- Show actual deal pins at shop lat/lng coordinates
- Color-coded by urgency (same logic)
- Click pin → show deal info

> [!NOTE]
> Leaflet.js is free (no API key needed). We'll load it from CDN.

---

### 4. Groq AI Integration

#### [NEW] [groqAI.js](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/utils/groqAI.js)

Use Groq's fast LLM API for:
- **Smarter discount reasoning** — instead of simple if/else, ask the LLM to analyze the product and give reasoning
- **Product tips** — suggest selling strategies to shopkeepers
- **Customer recommendations** — "You might also find deals on..."

> [!IMPORTANT]
> **You need to provide your Groq API key.** Add it to `.env` as:
> ```
> VITE_GROQ_API_KEY=your_groq_api_key_here
> ```

---

### 5. Customer Login → Save to Supabase

#### [MODIFY] [database.js](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/services/database.js)
- Add `findOrCreateCustomer(name, phone, pinCode)`
- Store customer lat/lng on login

#### [MODIFY] [App.jsx](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/App.jsx)
- On customer login, call `findOrCreateCustomer` to save to DB
- Store `customerId` in state for reservation tracking
- Fix hardcoded "Good morning, Ramesh" → use actual logged-in name

---

### 6. Fix Shopkeeper Greeting + Minor Bugs

#### [MODIFY] [App.jsx](file:///c:/Users/varun/projects%20ml%20and%20data%20preprocessing/project%204%20hacthon/src/App.jsx)
- Use `user.name` instead of hardcoded "Ramesh"
- Pass FSSAI number in `createProduct` call
- Fix `deal.distance` to show real distance or fallback gracefully

---

## Open Questions

> [!IMPORTANT]
> **I need your Groq API key.** Please share it and I'll add it to `.env` and wire it up.

> [!IMPORTANT]
> **Have you already run the schema.sql in Supabase?** The `shops`, `products`, `reservations` tables — did you create them by running the SQL? Or only the RLS policies?

> [!NOTE]
> For the map, shops need real lat/lng coordinates. For the hackathon demo, I can:
> - **Option A**: Auto-assign random Bengaluru coordinates for demo shops
> - **Option B**: Use a free geocoding API to convert the shop address text to lat/lng
> Which do you prefer?

---

## Verification Plan

### Automated Tests
1. `npm run build` — verify no compile errors
2. `npm run dev` — verify app loads
3. Test shopkeeper flow: login → upload product → verify in Supabase dashboard
4. Test customer flow: login → see deals → reserve → verify in Supabase

### Manual Verification
- Check Supabase dashboard → `customers` table has entries after login
- Check map shows real pins
- Check distances update based on browser location
- Check Groq AI returns smart discount reasoning
