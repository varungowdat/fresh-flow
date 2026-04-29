import { useState, useEffect, useCallback } from "react";

/* ─── COLOUR TOKENS ──────────────────────────────────── */
const C = {
  // Customer palette
  custBg: "#f2efe7",
  custAccent: "#b8004a",
  custAccentLight: "#fce8f0",
  custAccentDark: "#8a0037",
  // Shopkeeper palette
  shopBg: "#e4ddd3",
  shopAccent: "#00a19b",
  shopAccentLight: "#e0f5f4",
  shopAccentDark: "#007a75",
  // Shared
  white: "#ffffff",
  ink: "#1a1612",
  inkMuted: "#6b5e52",
  inkFaint: "#c4b5aa",
  cream: "#faf7f2",
  red: "#c0392b", redLight: "#fdecea",
  amber: "#d97706", amberLight: "#fef3c7",
  green: "#15803d", greenLight: "#dcfce7",
};

/* ─── GLOBAL STYLE ───────────────────────────────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#faf7f2;color:${C.ink};-webkit-font-smoothing:antialiased}
    h1,h2,h3,h4,h5{font-family:'Syne',sans-serif}
    button,input,select,textarea{font-family:'DM Sans',sans-serif}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#c4b5aa;border-radius:10px}
    .fade-in{animation:fadeIn 0.3s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .pulse{animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .spin{animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `}</style>
);

/* ─── MOCK DATA ──────────────────────────────────────── */
const MOCK_DEALS = [
  { id:1, name:"Amul Butter 100g", category:"Dairy", mrp:62, discount:40, store:"Raju Kirana", distance:"180m", daysLeft:1, emoji:"🧈", reserved:false, qty:3 },
  { id:2, name:"Britannia Bread", category:"Bakery", mrp:45, discount:35, store:"Sri Stores", distance:"340m", daysLeft:2, emoji:"🍞", reserved:true, reserveMin:14, qty:2 },
  { id:3, name:"Parle-G 800g", category:"Snacks", mrp:88, discount:20, store:"Ramesh General", distance:"520m", daysLeft:4, emoji:"🍪", reserved:false, qty:5 },
  { id:4, name:"Tropicana 1L", category:"Beverages", mrp:120, discount:30, store:"Corner Shop", distance:"700m", daysLeft:3, emoji:"🥤", reserved:false, qty:1 },
  { id:5, name:"Haldiram's Mix 400g", category:"Snacks", mrp:150, discount:15, store:"Pandey Kirana", distance:"850m", daysLeft:6, emoji:"🍿", reserved:false, qty:4 },
  { id:6, name:"Mother Dairy Curd", category:"Dairy", mrp:38, discount:50, store:"Raju Kirana", distance:"180m", daysLeft:1, emoji:"🥛", reserved:false, qty:2 },
];

const MOCK_SHOP_PRODUCTS = [
  { id:1, name:"Amul Butter 100g", category:"Dairy", mrp:62, discount:40, expiry:"2025-05-01", daysLeft:1, qty:3, reserved:true, reserveMin:14, reservedBy:"Priya S." },
  { id:2, name:"Mother Dairy Curd", category:"Dairy", mrp:38, discount:50, expiry:"2025-05-01", daysLeft:1, qty:2, reserved:false, reserveMin:0 },
  { id:3, name:"Tropicana 1L", category:"Beverages", mrp:120, discount:30, expiry:"2025-05-03", daysLeft:3, qty:1, reserved:false, reserveMin:0 },
  { id:4, name:"Britannia Bread", category:"Bakery", mrp:45, discount:35, expiry:"2025-05-02", daysLeft:2, qty:2, reserved:false, reserveMin:0, lapsed:true },
  { id:5, name:"Haldiram's Mix", category:"Snacks", mrp:150, discount:15, expiry:"2025-05-06", daysLeft:6, qty:4, reserved:false, reserveMin:0 },
];

/* ─── AI DISCOUNT ENGINE ─────────────────────────────── */
function getAIDiscount(daysLeft, category, qty) {
  let base;
  if (daysLeft === 0) base = 70;
  else if (daysLeft === 1) base = 52;
  else if (daysLeft === 2) base = 40;
  else if (daysLeft <= 4) base = 30;
  else if (daysLeft <= 7) base = 20;
  else base = 8;
  const perishable = ["Dairy","Bakery"].includes(category);
  const highQty = qty > 5;
  const final = Math.min(80, base + (perishable ? 5 : 0) + (highQty ? 3 : 0));
  const labels = { 0:"Emergency clearance", 1:"Last chance!", 2:"Last chance!", 4:"Urgent clearance", 7:"Move it now", 99:"Early bird" };
  const key = Object.keys(labels).map(Number).sort((a,b)=>a-b).find(k => daysLeft <= k) ?? 99;
  return {
    pct: final,
    label: labels[key] || "Early bird",
    reason: `${daysLeft} day${daysLeft!==1?"s":""} to expiry${perishable?" · Perishable +5%":""}${highQty?" · High stock +3%":""}`,
  };
}

function discountedPrice(mrp, pct) { return Math.round(mrp * (1 - pct/100)); }

/* ─── SHARED SMALL COMPONENTS ────────────────────────── */
const LogoBox = ({ accent }) => (
  <div style={{ width:110, height:36, border:`2px dashed ${accent}40`, borderRadius:8,
    display:"flex", alignItems:"center", justifyContent:"center" }}>
    <span style={{ fontSize:11, color:`${accent}80`, fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:"0.08em" }}>LOGO</span>
  </div>
);

const Badge = ({ children, color, bg }) => (
  <span style={{ background:bg, color, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, display:"inline-block" }}>
    {children}
  </span>
);

const UrgencyBadge = ({ days }) => {
  if (days <= 1) return <Badge color={C.red} bg={C.redLight}>🔴 {days===0?"Today":"1 day left"}</Badge>;
  if (days <= 3) return <Badge color={C.amber} bg={C.amberLight}>🟠 {days} days left</Badge>;
  return <Badge color={C.green} bg={C.greenLight}>🟢 {days} days left</Badge>;
};

const Btn = ({ children, onClick, color, bg, style={}, disabled=false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#e0dbd5" : bg, color: disabled ? C.inkFaint : color,
    border:"none", padding:"10px 20px", borderRadius:10, fontSize:14, fontWeight:600,
    cursor: disabled ? "not-allowed" : "pointer", transition:"all 0.15s",
    display:"inline-flex", alignItems:"center", gap:6, ...style
  }}>{children}</button>
);

const StatCard = ({ label, value, sub, accent }) => (
  <div className="fade-in" style={{ background:C.white, borderRadius:14, padding:"18px 20px",
    boxShadow:"0 1px 3px rgba(0,0,0,0.07)", border:`1px solid ${accent}20` }}>
    <div style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:accent }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:600, color:C.ink, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontSize:12, color:C.inkMuted, marginTop:2 }}>{sub}</div>}
  </div>
);

/* ─── LOGIN MODAL ────────────────────────────────────── */
// Simulated saved-account store (persists within session)
const SAVED_ACCOUNTS = {};

function LoginModal({ role, onLogin, onClose }) {
  const isShop = role === "shopkeeper";
  const accent = isShop ? C.shopAccent : C.custAccent;
  const accentLight = isShop ? C.shopAccentLight : C.custAccentLight;

  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [shopName, setShopName]   = useState("");
  const [location, setLocation]   = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // When username changes, auto-fill saved location for returning shopkeepers
  useEffect(() => {
    if (isShop && username && SAVED_ACCOUNTS[username]) {
      const saved = SAVED_ACCOUNTS[username];
      setShopName(saved.shop || "");
      setLocation(saved.location || "");
      setLicenceNumber(saved.licenceNumber || "");
    }
  }, [username, isShop]);

  const isReturning = isShop && username && !!SAVED_ACCOUNTS[username];

  function handleLogin() {
    if (!username.trim() || !password.trim()) { setError("Please fill in all required fields."); return; }
    if (isShop && !shopName.trim()) { setError("Shop name is required."); return; }
    if (isShop && !location.trim()) { setError("Shop location is required."); return; }
    if (isShop && !licenceNumber.trim()) { setError("Licence number is required."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      // Save account for future logins
      if (isShop) SAVED_ACCOUNTS[username] = { shop: shopName, location, licenceNumber };
      setLoading(false);
      onLogin(role, { name: username, shop: shopName, location, licenceNumber });
    }, 800);
  }

  const inp = (val, setter, placeholder, type="text") => ({
    value: val,
    onChange: e => { setter(e.target.value); setError(""); },
    placeholder,
    type,
    style: { width:"100%", padding:"10px 14px", border:`1.5px solid ${C.inkFaint}`,
      borderRadius:10, fontSize:14, outline:"none", background:C.white,
      transition:"border-color 0.15s" },
    onFocus: e => e.target.style.borderColor = accent,
    onBlur:  e => e.target.style.borderColor = C.inkFaint,
  });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,22,18,0.6)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background:C.white, borderRadius:20, padding:36,
        maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:accent,
              textTransform:"uppercase", marginBottom:6 }}>
              {isShop ? "🏪 Shopkeeper Login" : "🛍️ Customer Login"}
            </div>
            <h2 style={{ fontSize:22, fontWeight:800 }}>Welcome back</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20,
            color:C.inkMuted, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Username */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Username</label>
            <input {...inp(username, setUsername, isShop ? "e.g. ramesh_store" : "e.g. priya_sharma")} />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input {...inp(password, setPassword, "Enter your password", showPw ? "text" : "password")}
                style={{ width:"100%", padding:"10px 40px 10px 14px", border:`1.5px solid ${C.inkFaint}`,
                  borderRadius:10, fontSize:14, outline:"none", background:C.white }} />
              <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer",
                fontSize:16, color:C.inkMuted }}>{showPw ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {/* Shopkeeper-only fields */}
          {isShop && (
            <>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Shop Name</label>
                <input {...inp(shopName, setShopName, "e.g. Ramesh General Store")} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Licence Number</label>
                <input {...inp(licenceNumber, setLicenceNumber, "e.g. 1234567890")} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>
                  Shop Location
                  {isReturning && (
                    <span style={{ marginLeft:8, fontSize:11, color:C.green, fontWeight:700,
                      background:C.greenLight, padding:"1px 7px", borderRadius:6 }}>📍 Saved</span>
                  )}
                </label>
                <input {...inp(location, setLocation, "e.g. 12th Cross, Indiranagar, Bengaluru")}
                  style={{ width:"100%", padding:"10px 14px",
                    border:`1.5px solid ${isReturning ? C.green : C.inkFaint}`,
                    borderRadius:10, fontSize:14, outline:"none",
                    background: isReturning ? C.greenLight : C.white,
                    color: C.ink, transition:"all 0.15s" }} />
                {isReturning && (
                  <div style={{ fontSize:11, color:C.inkMuted, marginTop:4 }}>
                    📍 Location saved from last login · You can update it anytime
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ background:C.redLight, color:C.red, padding:"9px 14px",
              borderRadius:9, fontSize:13, fontWeight:600 }}>⚠️ {error}</div>
          )}

          {/* Submit */}
          <Btn onClick={handleLogin} color={C.white} bg={accent}
            disabled={!username || !password}
            style={{ width:"100%", justifyContent:"center", padding:"13px 20px", fontSize:15, marginTop:2 }}>
            {loading
              ? <span className="spin" style={{ display:"inline-block", width:16, height:16,
                  border:`2px solid white`, borderTopColor:"transparent", borderRadius:"50%" }} />
              : `Login as ${isShop ? "Shopkeeper" : "Customer"} →`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── LANDING PAGE ───────────────────────────────────── */
function LandingPage({ onSelectRole }) {
  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", flexDirection:"column" }}>
      {/* Navbar */}
      <nav style={{ background:C.white, borderBottom:`1px solid #e8e0d8`, padding:"0 32px",
        height:64, display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50 }}>
        <LogoBox accent={C.ink} />
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Btn onClick={()=>onSelectRole("customer")} color={C.custAccent} bg={C.custAccentLight}
            style={{ border:`1.5px solid ${C.custAccent}33` }}>
            🛍️ Sign in as Customer
          </Btn>
          <Btn onClick={()=>onSelectRole("shopkeeper")} color={C.white} bg={C.shopAccent}>
            🏪 Sign in as Shopkeeper
          </Btn>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"60px 24px", textAlign:"center" }}>
        <div className="fade-in" style={{ maxWidth:600 }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.12em", color:C.shopAccent,
            textTransform:"uppercase", marginBottom:16 }}>Hyperlocal · Real-time · Neighbourhood</div>
          <h1 style={{ fontSize:"clamp(36px,6vw,58px)", fontWeight:800, lineHeight:1.1,
            color:C.ink, marginBottom:20 }}>
            Fresh deals.<br />
            <span style={{ color:C.custAccent }}>Zero waste.</span><br />
            Walking distance.
          </h1>
          <p style={{ fontSize:17, color:C.inkMuted, lineHeight:1.7, marginBottom:36, maxWidth:480, margin:"0 auto 36px" }}>
            KiranaDeals connects neighbourhood shopkeepers with nearby customers — turning near-expiry products into real savings for everyone.
          </p>
        </div>

        {/* Stats row */}
        <div className="fade-in" style={{ display:"flex", gap:32, marginTop:64, flexWrap:"wrap", justifyContent:"center" }}>
          {[["2,400+","Kirana stores"],["₹18L","Losses prevented"],["340 kg","Food saved"],["4 min","Avg deal pickup"]].map(([v,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:28, fontFamily:"'Syne',sans-serif", fontWeight:800, color:C.ink }}>{v}</div>
              <div style={{ fontSize:13, color:C.inkMuted, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Role cards */}
        <div style={{ display:"flex", gap:20, marginTop:60, maxWidth:700, width:"100%", flexWrap:"wrap", justifyContent:"center" }}>
          {[
            { role:"shopkeeper", icon:"🏪", title:"For Shopkeepers", accent:C.shopAccent, bg:C.shopAccentLight, pts:["Upload near-expiry products in 30s","AI suggests optimal discount","Live on map instantly","Track reservations & queue"] },
            { role:"customer", icon:"🛍️", title:"For Customers", accent:C.custAccent, bg:C.custAccentLight, pts:["See deals within 2km","Reserve for 20 minutes","Walk in, show app, save money","Real savings, no delivery wait"] },
          ].map(c=>(
            <div key={c.role} onClick={()=>onSelectRole(c.role)} style={{ background:C.white, borderRadius:18, padding:28,
              flex:1, minWidth:280, cursor:"pointer", transition:"all 0.2s",
              border:`1.5px solid ${c.accent}30`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 24px ${c.accent}25`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)"}}>
              <div style={{ fontSize:36, marginBottom:12 }}>{c.icon}</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:c.accent, marginBottom:12 }}>{c.title}</h3>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {c.pts.map(p=>(
                  <li key={p} style={{ fontSize:14, color:C.inkMuted, display:"flex", gap:8, alignItems:"flex-start" }}>
                    <span style={{ color:c.accent, fontWeight:700 }}>✓</span>{p}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop:18, background:c.bg, color:c.accent, padding:"9px 16px",
                borderRadius:10, fontSize:14, fontWeight:700, textAlign:"center" }}>
                Sign in as {c.title.split(" ")[2]} →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SHOPKEEPER DASHBOARD ───────────────────────────── */
function ShopkeeperDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState(MOCK_SHOP_PRODUCTS);

  return (
    <div style={{ minHeight:"100vh", background:C.shopBg }}>
      {/* Navbar */}
      <nav style={{ background:C.white, borderBottom:"1px solid #d8cfc6", padding:"0 28px",
        height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <LogoBox accent={C.shopAccent} />
          <div style={{ display:"flex", gap:4 }}>
            {[["dashboard","📊 Dashboard"],["upload","📦 Upload Product"],["expiring","⏰ Expiring Soon"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                background: tab===t ? C.shopAccentLight : "transparent",
                color: tab===t ? C.shopAccent : C.inkMuted,
                border: tab===t ? `1.5px solid ${C.shopAccent}30` : "1.5px solid transparent",
                padding:"8px 16px", borderRadius:9, fontSize:14, fontWeight: tab===t ? 700 : 500, cursor:"pointer", transition:"all 0.15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:13, color:C.inkMuted }}>
            🏪 <strong style={{ color:C.ink }}>{user.shop || "My Store"}</strong>
          </div>
          <button onClick={onLogout} style={{ background:"none", border:`1px solid ${C.inkFaint}`,
            padding:"6px 14px", borderRadius:8, fontSize:13, color:C.inkMuted, cursor:"pointer" }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth:980, margin:"0 auto", padding:"28px 20px" }}>
        {tab==="dashboard" && <ShopDashboard products={products} accent={C.shopAccent} accentLight={C.shopAccentLight} />}
        {tab==="upload" && <ShopUpload products={products} setProducts={setProducts} accent={C.shopAccent} accentLight={C.shopAccentLight} />}
        {tab==="expiring" && <ShopExpiring products={products} setProducts={setProducts} accent={C.shopAccent} accentLight={C.shopAccentLight} />}
      </div>
    </div>
  );
}

function ShopDashboard({ products, accent, accentLight }) {
  const active = products.filter(p=>!p.lapsed).length;
  const reserved = products.filter(p=>p.reserved).length;
  const lapsed = products.filter(p=>p.lapsed).length;
  const saved = products.reduce((s,p)=>s + Math.round(p.mrp * p.discount / 100), 0);

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>Good morning, Ramesh 👋</h2>
      <p style={{ color:C.inkMuted, marginBottom:24 }}>Here's your store overview for today.</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:32 }}>
        <StatCard label="Active Listings" value={active} sub="Live on map right now" accent={accent} />
        <StatCard label="Reserved" value={reserved} sub="Customers on their way" accent={C.amber} />
        <StatCard label="Lapsed Reservations" value={lapsed} sub="Relisted automatically" accent={C.red} />
        <StatCard label="Potential Loss Saved" value={`₹${saved}`} sub="via discounts today" accent={C.green} />
      </div>

      <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>Active listings</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {products.map(p=>(
          <div key={p.id} style={{ background:C.white, borderRadius:14, padding:"14px 18px",
            display:"flex", alignItems:"center", gap:16, border:`1px solid ${accent}15`,
            boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:28, width:44, textAlign:"center" }}>{["🧈","🍞","🥤","🍪","🥛","🍿"][p.id%6]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{p.name}</div>
              <div style={{ fontSize:13, color:C.inkMuted }}>{p.category} · {p.qty} in stock</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:800, fontSize:16, color:accent }}>₹{discountedPrice(p.mrp,p.discount)}</div>
              <div style={{ fontSize:12, color:C.inkMuted, textDecoration:"line-through" }}>₹{p.mrp}</div>
            </div>
            <UrgencyBadge days={p.daysLeft} />
            {p.reserved && <Badge color={C.amber} bg={C.amberLight}>🔒 Reserved</Badge>}
            {p.lapsed && <Badge color={C.red} bg={C.redLight}>⚠ Lapsed</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopUpload({ products, setProducts, accent, accentLight }) {
  const [form, setForm] = useState({ name:"", category:"Dairy", mrp:"", expiry:"", qty:"1", customDiscount:"", fssai:"" });
  const [aiResult, setAiResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function calcDays(expiry) {
    if (!expiry) return null;
    const diff = Math.floor((new Date(expiry) - new Date(today)) / 86400000);
    return Math.max(0, diff);
  }

  const daysLeft = calcDays(form.expiry);
  const usingDiscount = form.customDiscount !== "" ? parseInt(form.customDiscount) : aiResult?.pct;
  const finalPrice = form.mrp && usingDiscount ? discountedPrice(parseInt(form.mrp), usingDiscount) : null;

  useEffect(()=>{
    if (daysLeft !== null && form.category && form.qty) {
      setAiResult(getAIDiscount(daysLeft, form.category, parseInt(form.qty)||1));
    }
  }, [daysLeft, form.category, form.qty]);

  function handleSubmit() {
    if (!form.name || !form.mrp || !form.expiry) return;
    const newP = {
      id: products.length + 10,
      name: form.name,
      category: form.category,
      mrp: parseInt(form.mrp),
      fssai: form.fssai,
      discount: usingDiscount || 10,
      expiry: form.expiry,
      daysLeft: daysLeft,
      qty: parseInt(form.qty),
      reserved: false, reserveMin:0
    };
    setProducts(p=>[newP,...p]);
    setSubmitted(true);
    setTimeout(()=>{ setSubmitted(false); setForm({ name:"", category:"Dairy", mrp:"", expiry:"", qty:"1", customDiscount:"", fssai:"" }); setAiResult(null); }, 3000);
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f=>({...f,[field]:e.target.value})),
    style: { width:"100%", padding:"10px 14px", border:`1.5px solid #d8cfc6`,
      borderRadius:10, fontSize:14, outline:"none", background:C.white, transition:"border-color 0.15s" },
    onFocus: e => e.target.style.borderColor=accent,
    onBlur: e => e.target.style.borderColor="#d8cfc6",
  });

  if (submitted) return (
    <div className="fade-in" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:16 }}>
      <div style={{ fontSize:64 }}>🎉</div>
      <h3 style={{ fontSize:24, fontWeight:800, color:accent }}>Product listed!</h3>
      <p style={{ color:C.inkMuted }}>Your deal is now live on the customer map.</p>
    </div>
  );

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>Upload Near-Expiry Product</h2>
      <p style={{ color:C.inkMuted, marginBottom:24 }}>Fill in the details — our AI will suggest the best discount.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, alignItems:"start" }}>
        {/* Form */}
        <div style={{ background:C.white, borderRadius:16, padding:28, boxShadow:"0 1px 8px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div style={{ gridColumn:"span 2" }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Product Name *</label>
              <input {...inp("name")} placeholder="e.g. Amul Butter 100g" />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Category *</label>
              <select {...inp("category")} style={{...inp("category").style}}>
                {["Dairy","Bakery","Snacks","Beverages","Staples","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>MRP (₹) *</label>
              <input {...inp("mrp")} type="number" placeholder="e.g. 62" />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Expiry Date *</label>
              <input {...inp("expiry")} type="date" min={today} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Stock Qty</label>
              <input {...inp("qty")} type="number" min="1" placeholder="1" />
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>FSSAI Number</label>
              <input {...inp("fssai")} placeholder="e.g. 12345678901234" />
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>
                Your Discount % <span style={{ color:C.inkFaint, fontWeight:400 }}>(optional — leave blank for AI suggestion)</span>
              </label>
              <input {...inp("customDiscount")} type="number" min="1" max="90" placeholder="e.g. 30" />
            </div>

            {/* Photo upload placeholder */}
            <div style={{ gridColumn:"span 2" }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Product Photo</label>
              <div style={{ border:`2px dashed ${accent}40`, borderRadius:12, padding:"20px", textAlign:"center",
                background:accentLight, cursor:"pointer" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
                <div style={{ fontSize:13, color:accent, fontWeight:600 }}>Tap to upload / use camera</div>
                <div style={{ fontSize:12, color:C.inkMuted, marginTop:3 }}>JPG, PNG — max 5MB</div>
              </div>
            </div>
          </div>

          <Btn onClick={handleSubmit} color={C.white} bg={accent}
            disabled={!form.name || !form.mrp || !form.expiry}
            style={{ width:"100%", justifyContent:"center", padding:"13px", fontSize:15, marginTop:4 }}>
            🚀 List Deal — Go Live Instantly
          </Btn>
        </div>

        {/* AI Panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {aiResult && form.mrp ? (
            <div className="fade-in" style={{ background:C.white, borderRadius:16, padding:24, border:`2px solid ${accent}30`, boxShadow:"0 1px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:"0.08em", color:accent, textTransform:"uppercase", marginBottom:10 }}>🤖 AI Recommendation</div>
              <div style={{ fontSize:42, fontFamily:"'Syne',sans-serif", fontWeight:800, color:accent }}>{aiResult.pct}% OFF</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginTop:4, marginBottom:6 }}>{aiResult.label}</div>
              <div style={{ fontSize:12, color:C.inkMuted, background:accentLight, padding:"8px 12px", borderRadius:8, lineHeight:1.6 }}>{aiResult.reason}</div>
              {form.customDiscount !== "" && (
                <div style={{ marginTop:10, fontSize:12, color:C.amber, background:C.amberLight, padding:"8px 12px", borderRadius:8 }}>
                  ✏️ You are overriding with <strong>{form.customDiscount}%</strong> discount
                </div>
              )}
              {finalPrice && (
                <div style={{ marginTop:14, background:C.shopBg, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:12, color:C.inkMuted }}>Final price shown to customers</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:4 }}>
                    <span style={{ fontSize:26, fontFamily:"'Syne',sans-serif", fontWeight:800, color:C.green }}>₹{finalPrice}</span>
                    <span style={{ fontSize:14, color:C.inkMuted, textDecoration:"line-through" }}>₹{form.mrp}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:C.white, borderRadius:16, padding:24, border:`1px dashed ${C.inkFaint}`, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
              <div style={{ fontSize:14, color:C.inkMuted, lineHeight:1.6 }}>Fill in expiry date & category to get an AI-powered discount suggestion</div>
            </div>
          )}

          <div style={{ background:C.white, borderRadius:16, padding:20, border:`1px solid ${accent}15` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.inkMuted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Discount Guide</div>
            {[["Same day","60–80%","Emergency"],["1–2 days","40–60%","Last chance"],["3–4 days","25–35%","Urgent"],["5–7 days","15–25%","Move it"],["8+ days","5–15%","Early bird"]].map(([d,p,l])=>(
              <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f0ebe5" }}>
                <span style={{ fontSize:13, color:C.inkMuted }}>{d}</span>
                <span style={{ fontSize:13, fontWeight:700, color:accent }}>{p}</span>
                <span style={{ fontSize:11, color:C.inkFaint }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopExpiring({ products, setProducts, accent, accentLight }) {
  const [timers, setTimers] = useState({});

  useEffect(()=>{
    const t = setInterval(()=>{
      setTimers(prev=>{
        const next = {...prev};
        products.forEach(p=>{
          if (p.reserved && p.reserveMin > 0) {
            if (!next[p.id]) next[p.id] = p.reserveMin * 60;
            else if (next[p.id] > 0) next[p.id]--;
          }
        });
        return next;
      });
    }, 1000);
    return ()=>clearInterval(t);
  }, [products]);

  function release(id) {
    setProducts(ps=>ps.map(p=>p.id===id ? {...p, reserved:false, reserveMin:0} : p));
  }

  const sorted = [...products].sort((a,b)=>a.daysLeft - b.daysLeft);

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>Expiring Soon</h2>
      <p style={{ color:C.inkMuted, marginBottom:24 }}>Products sorted by urgency · Reservations update in real time</p>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {sorted.map(p=>{
          const secs = timers[p.id] || (p.reserveMin * 60);
          const mm = String(Math.floor(secs/60)).padStart(2,"0");
          const ss = String(secs%60).padStart(2,"0");
          return (
            <div key={p.id} className="fade-in" style={{ background:C.white, borderRadius:16, padding:"18px 22px",
              boxShadow:"0 1px 6px rgba(0,0,0,0.07)", border: p.daysLeft<=1 ? `1.5px solid ${C.red}30` : p.lapsed ? `1.5px solid ${C.amber}30` : `1px solid ${accent}15` }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                <div style={{ fontSize:34 }}>{["🧈","🍞","🥤","🍪","🥛","🍿"][p.id%6]}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>{p.name}</span>
                    <span style={{ fontSize:12, color:C.inkMuted, background:"#f5f0ea", padding:"2px 8px", borderRadius:8 }}>{p.category}</span>
                    <UrgencyBadge days={p.daysLeft} />
                  </div>
                  <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:18, fontWeight:800, color:accent }}>₹{discountedPrice(p.mrp, p.discount)}</span>
                    <span style={{ fontSize:13, color:C.inkMuted, textDecoration:"line-through" }}>₹{p.mrp}</span>
                    <span style={{ background:accent, color:C.white, fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:6 }}>{p.discount}% OFF</span>
                    <span style={{ fontSize:13, color:C.inkMuted }}>· {p.qty} in stock</span>
                  </div>
                </div>

                {/* Queue status */}
                <div style={{ minWidth:220, textAlign:"right" }}>
                  {p.lapsed && (
                    <div style={{ background:C.amberLight, color:C.amber, borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:600 }}>
                      ⚠️ Reservation lapsed<br/><span style={{ fontSize:12, fontWeight:400 }}>Back on market for customers</span>
                    </div>
                  )}
                  {p.reserved && !p.lapsed && (
                    <div style={{ background:"#fff8f0", border:`1px solid ${C.amber}40`, borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ fontSize:12, color:C.inkMuted, marginBottom:4 }}>🔒 Reserved by {p.reservedBy || "Customer"}</div>
                      <div style={{ fontSize:22, fontFamily:"'Syne',sans-serif", fontWeight:800, color:C.amber }}>{mm}:{ss}</div>
                      <div style={{ fontSize:11, color:C.inkMuted, marginBottom:8 }}>remaining</div>
                      <button onClick={()=>release(p.id)} style={{ background:C.white, border:`1px solid ${C.red}40`,
                        color:C.red, padding:"5px 12px", borderRadius:7, fontSize:12, cursor:"pointer", fontWeight:600 }}>
                        Release reservation
                      </button>
                    </div>
                  )}
                  {!p.reserved && !p.lapsed && (
                    <div style={{ fontSize:13, color:C.green, fontWeight:600, padding:"10px 14px",
                      background:C.greenLight, borderRadius:10 }}>✓ Available — visible to customers</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CUSTOMER HOME ──────────────────────────────────── */
function CustomerHome({ user, onLogout }) {
  const [tab, setTab] = useState("deals");
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [reserved, setReserved] = useState({});
  const [timers, setTimers] = useState({});

  useEffect(()=>{
    const t = setInterval(()=>{
      setTimers(prev=>{
        const next = {...prev};
        Object.entries(next).forEach(([id, secs])=>{
          if (secs > 0) next[id] = secs - 1;
          else {
            delete next[id];
            setReserved(r=>{ const nr={...r}; delete nr[id]; return nr; });
            setDeals(ds=>ds.map(d=>d.id===parseInt(id) ? {...d, reserved:false} : d));
          }
        });
        return next;
      });
    }, 1000);
    return ()=>clearInterval(t);
  }, []);

  function reserve(deal) {
    if (Object.keys(reserved).length >= 3) return alert("Max 3 active reservations allowed.");
    setReserved(r=>({...r,[deal.id]:true}));
    setTimers(t=>({...t,[deal.id]:1200}));
    setDeals(ds=>ds.map(d=>d.id===deal.id ? {...d, reserved:true} : d));
  }

  return (
    <div style={{ minHeight:"100vh", background:C.custBg }}>
      {/* Navbar */}
      <nav style={{ background:C.white, borderBottom:"1px solid #e8e2da", padding:"0 28px",
        height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <LogoBox accent={C.custAccent} />
          <div style={{ display:"flex", gap:4 }}>
            {[["deals","🗺️ Deals Near Me"],["search","🔍 Search"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                background: tab===t ? C.custAccentLight : "transparent",
                color: tab===t ? C.custAccent : C.inkMuted,
                border: tab===t ? `1.5px solid ${C.custAccent}30` : "1.5px solid transparent",
                padding:"8px 16px", borderRadius:9, fontSize:14, fontWeight: tab===t ? 700 : 500, cursor:"pointer", transition:"all 0.15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {Object.keys(reserved).length > 0 && (
            <div style={{ background:C.custAccentLight, color:C.custAccent, padding:"6px 12px",
              borderRadius:8, fontSize:13, fontWeight:700 }}>
              🔒 {Object.keys(reserved).length} reserved
            </div>
          )}
          <div style={{ fontSize:13, color:C.inkMuted }}>👤 {user.name}</div>
          <button onClick={onLogout} style={{ background:"none", border:`1px solid ${C.inkFaint}`,
            padding:"6px 14px", borderRadius:8, fontSize:13, color:C.inkMuted, cursor:"pointer" }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"28px 20px" }}>
        {tab==="deals" && <CustomerDeals deals={deals} reserved={reserved} timers={timers} onReserve={reserve} />}
        {tab==="search" && <CustomerSearch deals={deals} reserved={reserved} timers={timers} onReserve={reserve} />}
      </div>
    </div>
  );
}

function DealCard({ deal, reserved, timer, onReserve }) {
  const isReserved = reserved || deal.reserved;
  const mm = timer ? String(Math.floor(timer/60)).padStart(2,"0") : "20";
  const ss = timer ? String(timer%60).padStart(2,"0") : "00";
  const discPrice = discountedPrice(deal.mrp, deal.discount);

  return (
    <div className="fade-in" style={{ background:C.white, borderRadius:16, overflow:"hidden",
      boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border: isReserved ? `2px solid ${C.custAccent}` : `1px solid ${C.custAccent}15`,
      transition:"transform 0.15s, box-shadow 0.15s", display:"flex", flexDirection:"column" }}
      onMouseEnter={e=>{if(!isReserved){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(184,0,74,0.12)"}}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=isReserved?"":"0 2px 10px rgba(0,0,0,0.08)"}}>
      {/* Image area */}
      <div style={{ background:`${C.custAccent}10`, height:90, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 18px", position:"relative" }}>
        <div style={{ fontSize:48 }}>{deal.emoji}</div>
        <div style={{ background:C.custAccent, color:C.white, padding:"6px 12px", borderRadius:10,
          fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{deal.discount}% OFF</div>
        {isReserved && (
          <div style={{ position:"absolute", top:8, left:8, background:C.custAccent, color:C.white,
            fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6 }}>🔒 RESERVED</div>
        )}
      </div>
      <div style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{deal.name}</div>
          <div style={{ fontSize:12, color:C.inkMuted }}>{deal.category}</div>
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:22, fontWeight:800, fontFamily:"'Syne',sans-serif", color:C.custAccent }}>₹{discPrice}</span>
          <span style={{ fontSize:13, color:C.inkMuted, textDecoration:"line-through" }}>₹{deal.mrp}</span>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:C.inkMuted }}>🏪 {deal.store}</span>
          <span style={{ fontSize:12, color:C.inkMuted }}>📍 {deal.distance}</span>
        </div>
        <UrgencyBadge days={deal.daysLeft} />
        <div style={{ marginTop:"auto", paddingTop:8 }}>
          {isReserved && reserved ? (
            <div style={{ background:`${C.custAccent}12`, borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:C.custAccent, fontWeight:700, marginBottom:2 }}>Walk to store · Time remaining</div>
              <div style={{ fontSize:24, fontWeight:800, fontFamily:"'Syne',sans-serif", color:C.custAccent }}>{mm}:{ss}</div>
            </div>
          ) : isReserved ? (
            <div style={{ background:"#f5f0ea", borderRadius:10, padding:"10px 14px", textAlign:"center",
              fontSize:13, color:C.inkMuted, fontWeight:600 }}>Reserved by another customer</div>
          ) : (
            <button onClick={()=>onReserve(deal)} style={{ width:"100%", background:C.custAccent, color:C.white,
              border:"none", padding:"11px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer",
              transition:"all 0.15s" }}
              onMouseEnter={e=>e.target.style.background=C.custAccentDark}
              onMouseLeave={e=>e.target.style.background=C.custAccent}>
              Reserve for 20 mins ⏱
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MockMap({ deals, reserved }) {
  const pins = [
    { x:120, y:160, deals:[deals[0], deals[5]], label:"Raju Kirana" },
    { x:280, y:90,  deals:[deals[1]], label:"Sri Stores" },
    { x:400, y:200, deals:[deals[2]], label:"Ramesh General" },
    { x:520, y:130, deals:[deals[3]], label:"Corner Shop" },
    { x:600, y:250, deals:[deals[4]], label:"Pandey Kirana" },
  ];
  const roads = [[60,100,700,100],[60,200,700,200],[200,40,200,300],[450,40,450,300],[300,140,300,300]];

  return (
    <div style={{ background:"#e8e4dc", borderRadius:16, overflow:"hidden", position:"relative",
      border:`1px solid ${C.custAccent}20`, boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
      <svg width="100%" viewBox="0 0 700 300" style={{ display:"block" }}>
        {roads.map(([x1,y1,x2,y2],i)=>(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d0c8bc" strokeWidth={i<3?"18":"12"} strokeLinecap="round" />
        ))}
        <circle cx={340} cy={175} r={140} fill={`${C.custAccent}08`} stroke={`${C.custAccent}30`} strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={340} y={330} textAnchor="middle" fontSize={11} fill={`${C.custAccent}80`} fontFamily="DM Sans">2km radius</text>
        <circle cx={340} cy={175} r={6} fill={C.custAccent} />
        <circle cx={340} cy={175} r={14} fill={`${C.custAccent}30`} />
        <text x={352} y={170} fontSize={10} fill={C.custAccent} fontWeight="bold" fontFamily="DM Sans">You</text>

        {pins.map((pin,i)=>{
          const d = pin.deals[0];
          const isRes = d && (reserved[d.id] || d.reserved);
          const col = d?.daysLeft <= 1 ? C.red : d?.daysLeft <= 3 ? C.amber : C.green;
          return (
            <g key={i}>
              <circle cx={pin.x} cy={pin.y} r={20} fill={isRes ? "#999" : col} opacity={0.9} />
              <text x={pin.x} y={pin.y+1} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="white" fontWeight="bold" fontFamily="DM Sans">
                {d ? `₹${discountedPrice(d.mrp,d.discount)}` : ""}
              </text>
              {isRes && <text x={pin.x} y={pin.y-26} textAnchor="middle" fontSize={10} fill="#666" fontFamily="DM Sans">🔒</text>}
              <text x={pin.x} y={pin.y+32} textAnchor="middle" fontSize={9} fill={C.inkMuted} fontFamily="DM Sans">{pin.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position:"absolute", top:10, right:10, background:C.white, borderRadius:10,
        padding:"8px 12px", fontSize:11, boxShadow:"0 1px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:C.red, display:"inline-block" }} /> Today
          <span style={{ width:8, height:8, borderRadius:"50%", background:C.amber, display:"inline-block" }} /> 2–3 days
          <span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block" }} /> 4–7 days
        </div>
      </div>
    </div>
  );
}

function CustomerDeals({ deals, reserved, timers, onReserve }) {
  const [sort, setSort] = useState("distance");
  const sorted = [...deals].sort((a,b)=>{
    if (sort==="discount") return b.discount - a.discount;
    if (sort==="expiry") return a.daysLeft - b.daysLeft;
    return parseInt(a.distance) - parseInt(b.distance);
  });

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800 }}>Deals Near You 📍</h2>
          <p style={{ color:C.inkMuted, fontSize:14, marginTop:2 }}>Indiranagar, Bengaluru · {deals.length} deals within 2km</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:13, color:C.inkMuted }}>Sort:</span>
          {[["distance","📍 Distance"],["discount","💰 Discount"],["expiry","⏰ Expiry"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSort(v)} style={{
              background: sort===v ? C.custAccent : C.white,
              color: sort===v ? C.white : C.inkMuted,
              border: `1px solid ${sort===v ? C.custAccent : C.inkFaint}`,
              padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight: sort===v ? 700 : 500, cursor:"pointer"
            }}>{l}</button>
          ))}
        </div>
      </div>

      <MockMap deals={deals} reserved={reserved} />
      <div style={{ height:20 }} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
        {sorted.map(d=>(
          <DealCard key={d.id} deal={d} reserved={reserved[d.id]} timer={timers[d.id]} onReserve={onReserve} />
        ))}
      </div>
    </div>
  );
}

function CustomerSearch({ deals, reserved, timers, onReserve }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");
  const [minDiscount, setMinDiscount] = useState(0);

  const results = deals.filter(d=>{
    const q = query.toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.store.toLowerCase().includes(q);
    const matchC = category==="All" || d.category===category;
    const matchD = d.discount >= minDiscount;
    return matchQ && matchC && matchD;
  });

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Search Deals</h2>
      <p style={{ color:C.inkMuted, marginBottom:20 }}>Find products by name, store, or category</p>

      <div style={{ background:C.white, borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(0,0,0,0.07)", marginBottom:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>🔍 Product / Store</label>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. bread, milk, Raju..."
              style={{ width:"100%", padding:"10px 14px", border:`1.5px solid #e0d8d0`,
                borderRadius:10, fontSize:14, outline:"none" }}
              onFocus={e=>e.target.style.borderColor=C.custAccent}
              onBlur={e=>e.target.style.borderColor="#e0d8d0"} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>📍 Area / PIN code</label>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Indiranagar, 560038"
              style={{ width:"100%", padding:"10px 14px", border:`1.5px solid #e0d8d0`,
                borderRadius:10, fontSize:14, outline:"none" }}
              onFocus={e=>e.target.style.borderColor=C.custAccent}
              onBlur={e=>e.target.style.borderColor="#e0d8d0"} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)}
              style={{ width:"100%", padding:"10px 14px", border:`1.5px solid #e0d8d0`, borderRadius:10, fontSize:14, outline:"none" }}>
              {["All","Dairy","Bakery","Snacks","Beverages","Staples"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:C.inkMuted, display:"block", marginBottom:5 }}>
              Min Discount: <span style={{ color:C.custAccent, fontWeight:800 }}>{minDiscount}%</span>
            </label>
            <input type="range" min={0} max={70} step={5} value={minDiscount} onChange={e=>setMinDiscount(Number(e.target.value))}
              style={{ width:"100%", accentColor:C.custAccent }} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom:14, fontSize:14, color:C.inkMuted }}>
        {results.length} deal{results.length!==1?"s":""} found
        {query && <span> for "<strong style={{color:C.ink}}>{query}</strong>"</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
        {results.map(d=>(
          <DealCard key={d.id} deal={d} reserved={reserved[d.id]} timer={timers[d.id]} onReserve={onReserve} />
        ))}
      </div>
      {results.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.inkMuted }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600 }}>No deals found</div>
          <div style={{ fontSize:14, marginTop:6 }}>Try a different keyword or reduce the min discount filter</div>
        </div>
      )}
    </div>
  );
}

/* ─── README PAGE ────────────────────────────────────── */
function ReadmePage({ onBack }) {
  const sections = [
    { icon:"📌", title:"Project Overview", content:"KiranaDeals is a real-time hyperlocal web platform connecting small kirana shopkeepers with nearby customers by surfacing near-expiry products at AI-suggested discounts. Shopkeepers reduce losses and food waste; customers get genuine deals within walking distance. No delivery. No middlemen. Just fast, trust-based neighbourhood commerce." },
    { icon:"🏠", title:"Landing Page", content:"Entry point for all users. Completely blank content area — no deals shown before login. Top navbar has logo placeholder on the left and two role-based sign-in buttons on the right: 'Sign in as Customer' and 'Sign in as Shopkeeper'. Each opens a scoped modal." },
    { icon:"🏪", title:"Shopkeeper Dashboard", content:"Three tabs: Dashboard (stats overview), Upload Product (form with AI discount engine), Expiring Soon (live queue tracker). Colour palette: #e4ddd3 background with #00a19b teal accent throughout." },
    { icon:"📦", title:"Upload Product", content:"Form fields: product name, category, MRP, expiry date, photo upload, stock quantity, and optional custom discount. AI calculates discount based on days remaining, category (perishables get +5%), and quantity (>5 units get +3%). Shopkeeper can override at any time." },
    { icon:"🤖", title:"AI Discount Engine", content:"Same day: 60–80% (Emergency). 1–2 days: 40–60% (Last chance). 3–4 days: 25–35% (Urgent). 5–7 days: 15–25% (Move it). 8+ days: 5–15% (Early bird). Dairy and Bakery add +5%. High stock adds +3%. Always shown as a suggestion — shopkeeper has final say." },
    { icon:"⏱️", title:"20-Min Reservation Queue", content:"Customer taps Reserve → 20-min countdown starts → item marked Reserved on map → customer walks to store → shopkeeper marks Collected. If timer expires: product relists automatically, customer notified. Max 3 active reservations per customer. Same item cannot be re-reserved within 2 hours of lapse." },
    { icon:"🛍️", title:"Customer Home", content:"Two tabs: Deals Near Me (map + card feed, sortable by distance/discount/expiry) and Search (product + location filters, category, min discount slider). Colour palette: #f2efe7 background with #b8004a crimson accent." },
    { icon:"🗺️", title:"Map Integration", content:"Recommended: Leaflet.js with OpenStreetMap (no API costs). Pins are colour-coded by urgency (red = today, orange = 2–3 days, green = 4–7 days). Reserved items show greyed pins with lock icon. Default radius: 2km." },
    { icon:"🔐", title:"Authentication", content:"OTP-based login — no passwords. Customers: name, phone, PIN code. Shopkeepers: name, phone, shop name, address, GSTIN (optional). JWT token encodes role for routing guards. Designed for low-digital-literacy users on budget Android phones." },
    { icon:"🧱", title:"Tech Stack", content:"Frontend: React + Vite · Styling: Tailwind CSS · Map: Leaflet.js · State: Zustand · Auth: Firebase/Supabase OTP · Backend: Node.js + Express or Supabase Edge Functions · DB: PostgreSQL · Storage: Firebase/Supabase · Realtime: Supabase Realtime listeners · AI discount: pure JS (no external API for V1)." },
    { icon:"🚫", title:"Out of Scope — V1", content:"Delivery logistics (pick-up only). In-app payments (cash at store). Reviews or ratings. Multi-language UI (architecture ready for V2). Analytics dashboard." },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <nav style={{ background:C.white, borderBottom:"1px solid #e8e0d8", padding:"0 32px",
        height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <LogoBox accent={C.ink} />
        <button onClick={onBack} style={{ background:"none", border:`1px solid ${C.inkFaint}`,
          padding:"8px 18px", borderRadius:9, fontSize:14, cursor:"pointer", color:C.inkMuted, fontWeight:600 }}>
          ← Back to App
        </button>
      </nav>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"48px 24px" }}>
        <div className="fade-in">
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.1em", color:C.shopAccent,
            textTransform:"uppercase", marginBottom:12 }}>Documentation</div>
          <h1 style={{ fontSize:"clamp(32px,5vw,48px)", fontWeight:800, lineHeight:1.1, marginBottom:16 }}>
            KiranaDeals
          </h1>
          <p style={{ fontSize:18, color:C.inkMuted, lineHeight:1.7, marginBottom:12, fontStyle:"italic" }}>
            Giving India's neighbourhood kirana stores a fighting chance — one discounted product at a time.
          </p>
          <div style={{ display:"flex", gap:10, marginBottom:48, flexWrap:"wrap" }}>
            {["Hyperlocal","Real-time","AI-powered","Mobile-first","Kirana ecosystem"].map(t=>(
              <span key={t} style={{ background:C.shopAccentLight, color:C.shopAccent,
                padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{t}</span>
            ))}
          </div>

          {sections.map((s,i)=>(
            <div key={i} style={{ marginBottom:32, paddingBottom:32,
              borderBottom: i<sections.length-1 ? "1px solid #e8e0d8" : "none" }}>
              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
                <span>{s.icon}</span> {s.title}
              </h2>
              <p style={{ fontSize:15, color:C.inkMuted, lineHeight:1.8 }}>{s.content}</p>
            </div>
          ))}

          {/* Build order */}
          <div style={{ background:C.white, borderRadius:16, padding:28, border:"1px solid #e8e0d8", marginBottom:32 }}>
            <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>📋 Build Order</h2>
            {[["Phase 1 — Shell & Auth",["LandingPage.jsx","Navbar.jsx","SignInModal.jsx"],C.shopAccent],
              ["Phase 2 — Shopkeeper Flow",["ShopkeeperDashboard.jsx","ProductUploadForm.jsx","aiDiscount.js","ExpiryQueue.jsx"],C.custAccent],
              ["Phase 3 — Customer Flow",["CustomerHome.jsx","DealCard.jsx","MapView.jsx","SearchBar.jsx"],C.amber],
              ["Phase 4 — Queue System",["QueueManager.jsx"],C.green],
              ["Phase 5 — Polish",["Skeleton loaders","Toast notifications","Responsive optimisation","Empty states"],C.inkMuted],
            ].map(([phase, items, col])=>(
              <div key={phase} style={{ marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:col, marginBottom:6 }}>{phase}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {items.map(item=>(
                    <div key={item} style={{ display:"flex", gap:10, alignItems:"center", fontSize:14, color:C.inkMuted }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:col, display:"inline-block", flexShrink:0 }}/>
                      <code style={{ fontFamily:"monospace", fontSize:13 }}>{item}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center", padding:"24px 0", color:C.inkMuted,
            fontStyle:"italic", fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:16 }}>
            Built for Bharat. Built for the kirana. Built to last. 🇮🇳
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("landing"); // landing | login | shopkeeper | customer | readme
  const [loginRole, setLoginRole] = useState(null);
  const [user, setUser] = useState(null);

  function handleSelectRole(role) { setLoginRole(role); setPage("login"); }
  function handleLogin(role, info) { setUser({ role, ...info }); setPage(role); }
  function handleLogout() { setUser(null); setLoginRole(null); setPage("landing"); }

  return (
    <>
      <GlobalStyle />
      {page === "readme" && <ReadmePage onBack={()=>setPage(user ? user.role : "landing")} />}
      {page === "landing" && (
        <div>
          <LandingPage onSelectRole={handleSelectRole} />
          <div style={{ position:"fixed", bottom:20, right:20 }}>
            <button onClick={()=>setPage("readme")} style={{ background:C.ink, color:C.white,
              border:"none", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>📄 README</button>
          </div>
        </div>
      )}
      {page === "login" && (
        <div>
          <LandingPage onSelectRole={handleSelectRole} />
          <LoginModal role={loginRole} onLogin={handleLogin} onClose={()=>setPage("landing")} />
        </div>
      )}
      {page === "shopkeeper" && user && (
        <div>
          <ShopkeeperDashboard user={user} onLogout={handleLogout} />
          <div style={{ position:"fixed", bottom:20, right:20 }}>
            <button onClick={()=>setPage("readme")} style={{ background:C.ink, color:C.white,
              border:"none", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>📄 README</button>
          </div>
        </div>
      )}
      {page === "customer" && user && (
        <div>
          <CustomerHome user={user} onLogout={handleLogout} />
          <div style={{ position:"fixed", bottom:20, right:20 }}>
            <button onClick={()=>setPage("readme")} style={{ background:C.ink, color:C.white,
              border:"none", padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 14px rgba(0,0,0,0.2)" }}>📄 README</button>
          </div>
        </div>
      )}
    </>
  );
}
