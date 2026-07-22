import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── Color Palette ───────────────────────────────────────────────────────── */
const G = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57', leaf: '#4CAF50',
  sage: '#A5D6A7', olive: '#6B8E23', lime: '#8BC34A', mint: '#98FF98',
  brown: '#8D6E63', sky: '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336',
};

/* ─── API ─────────────────────────────────────────────────────────────────── */
const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Global Styles ───────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

    * { box-sizing: border-box; }

    .pm-page {
      margin: -24px;
      padding: 0;
      min-height: 100vh;
      width: calc(100% + 48px);
      background: ${G.lightGray};
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes toastIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    @keyframes barGrow {
      from { width: 0; }
    }
    @keyframes pulse3d {
      0%,100% { box-shadow: 6px 6px 0 ${G.dark}; }
      50%      { box-shadow: 8px 8px 0 ${G.dark}; }
    }

    .pm-btn {
      border-radius: 0;
      border: 3px solid ${G.dark};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 5px 5px 0 ${G.dark};
      transition: all 0.12s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', sans-serif;
    }
    .pm-btn:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 ${G.dark};
    }
    .pm-btn:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 1px 1px 0 ${G.dark};
    }
    .pm-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: translate(2px, 2px);
      box-shadow: 3px 3px 0 ${G.dark};
    }

    .pm-card {
      background: ${G.white};
      border: 4px solid ${G.forest};
      box-shadow: 8px 8px 0 ${G.dark};
      animation: fadeUp 0.4s ease backwards;
    }

    .pm-input {
      border-radius: 0;
      border: 3px solid ${G.forest};
      box-shadow: inset 2px 2px 0 rgba(0,0,0,0.08), 4px 4px 0 ${G.sage};
      outline: none;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      transition: all 0.15s;
      background: ${G.white};
    }
    .pm-input:focus {
      border-color: ${G.dark};
      box-shadow: inset 2px 2px 0 rgba(0,0,0,0.08), 4px 4px 0 ${G.emerald};
    }

    .pm-row {
      border-bottom: 3px solid ${G.sage};
      transition: background 0.15s;
      animation: slideRight 0.35s ease backwards;
    }
    .pm-row:hover { background: ${G.mint}33 !important; }
    .pm-row:last-child { border-bottom: none; }

    .pm-header-txt {
      font-size: clamp(1.8rem, 4vw, 3rem);
      font-weight: 900;
      color: ${G.white};
      text-transform: uppercase;
      letter-spacing: 3px;
      text-shadow: 4px 4px 0 ${G.dark}, 6px 6px 20px rgba(0,0,0,0.35);
      margin: 0;
      line-height: 1.1;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pm-grid-4 { grid-template-columns: 1fr 1fr !important; }
      .pm-grid-3 { grid-template-columns: 1fr !important; }
      .pm-table-wrap { overflow-x: auto; }
      .pm-actions { flex-direction: column !important; }
      .pm-header-bar { padding: 24px 20px !important; flex-direction: column !important; gap: 20px !important; }
    }
    @media (max-width: 480px) {
      .pm-grid-4 { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ─── Toast ───────────────────────────────────────────────────────────────── */
const Toast = ({ toast }) => toast ? (
  <div style={{
    position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
    background: toast.type === 'success' ? G.forest : G.red,
    color: G.white, border: `3px solid ${G.dark}`,
    boxShadow: `6px 6px 0 ${G.dark}`,
    padding: '18px 28px', display: 'flex', gap: 14, alignItems: 'center',
    fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
    animation: 'toastIn .3s ease',
  }}>
    <span style={{ fontSize: 22 }}>{toast.type === 'success' ? '✅' : '❌'}</span>
    <span>{toast.msg}</span>
  </div>
) : null;

/* ─── Progress Bar ────────────────────────────────────────────────────────── */
const ProgressBar = ({ pct }) => {
  const color = pct > 90 ? G.red : pct > 65 ? G.orange : G.leaf;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        <span>Consumption Progress</span>
        <span style={{ color: pct > 90 ? G.red : G.darkGray }}>{pct}%</span>
      </div>
      <div style={{ background: `${G.sage}55`, height: 12, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
        <div style={{
          height: '100%', background: color, width: `${Math.min(pct, 100)}%`,
          animation: 'barGrow 1s ease', transition: 'width 0.4s',
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.3)`,
        }} />
      </div>
    </div>
  );
};

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color = G.forest, delay = 0 }) => (
  <div className="pm-card" style={{ padding: '24px 28px', animationDelay: `${delay}s` }}>
    <div style={{ fontSize: 11, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, fontWeight: 700, color: G.darkGray, marginTop: 6 }}>{sub}</div>}
  </div>
);

/* ─── Consume Modal ───────────────────────────────────────────────────────── */
const ConsumeModal = ({ mat, onClose, onDone, showToast }) => {
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const remaining = parseFloat(mat.quantity_remaining || 0);

  const submit = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return showToast('error', 'Enter a valid quantity to consume');
    if (q > remaining) return showToast('error', `Cannot consume more than remaining (${remaining} ${mat.unit})`);
    setBusy(true);
    try {
      await api.post(`${BASE}/production/materials/${mat.id}/consume`, { quantity_consumed: q });
      showToast('success', `Logged: ${q} ${mat.unit} consumed from ${mat.material_name}`);
      onDone();
      onClose();
    } catch (e) { showToast('error', e.response?.data?.message || e.message); }
    setBusy(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
      <div className="pm-card" style={{ width: 520, maxWidth: '100%', padding: 0 }}>
        <div style={{ background: G.dark, padding: '22px 28px', borderBottom: `4px solid ${G.olive}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: G.white, fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>🔥 Log Consumption</h2>
          <button onClick={onClose} className="pm-btn" style={{ background: G.red, color: G.white, borderColor: G.dark, padding: '8px 16px', fontSize: 13 }}>✕ CLOSE</button>
        </div>
        <div style={{ padding: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>{mat.material_id} · {mat.category}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', marginBottom: 24 }}>{mat.material_name}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Moved In', val: parseFloat(mat.quantity_moved).toLocaleString(), color: G.forest },
              { label: 'Consumed', val: parseFloat(mat.quantity_consumed).toLocaleString(), color: G.orange },
              { label: 'Remaining', val: remaining.toLocaleString(), color: remaining < 5 ? G.red : G.leaf },
            ].map(s => (
              <div key={s.label} style={{ background: G.lightGray, border: `3px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}`, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val} <span style={{ fontSize: 12 }}>{mat.unit}</span></div>
              </div>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Quantity to Consume ({mat.unit})
          </label>
          <input
            type="number" min="0.001" step="0.001" value={qty}
            onChange={e => setQty(e.target.value)}
            className="pm-input"
            style={{ width: '100%', padding: '16px 20px', fontSize: 22, fontWeight: 900, marginBottom: 28 }}
            placeholder="0"
            autoFocus
          />

          <button onClick={submit} disabled={busy || !qty} className="pm-btn"
            style={{ width: '100%', background: G.orange, color: G.white, borderColor: G.dark, padding: '18px 0', fontSize: 16, justifyContent: 'center' }}>
            {busy ? '⏳ SAVING...' : '🔥 CONFIRM CONSUMPTION'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const PrintingProdMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consumeTarget, setConsumeTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE}/production/materials`);
      setMaterials(data.data || []);
    } catch {
      setMaterials([]);
      showToast('error', 'Failed to load production materials');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 20s
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const pct = (m) => parseFloat(m.quantity_moved) > 0
    ? Math.round((parseFloat(m.quantity_consumed) / parseFloat(m.quantity_moved)) * 100)
    : 0;

  const totalMoved     = materials.reduce((s, m) => s + parseFloat(m.quantity_moved    || 0), 0);
  const totalConsumed  = materials.reduce((s, m) => s + parseFloat(m.quantity_consumed || 0), 0);
  const totalRemaining = materials.reduce((s, m) => s + parseFloat(m.quantity_remaining|| 0), 0);
  const criticalCount  = materials.filter(m => parseFloat(m.quantity_remaining) <= parseFloat(m.reorder_level || 5)).length;

  const filtered = materials.filter(m =>
    !searchTerm ||
    (m.material_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.material_id   || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category      || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pm-page">
      <GlobalStyles />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="pm-header-bar" style={{
        background: `linear-gradient(135deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`,
        borderBottom: `6px solid ${G.lime}`,
        padding: '40px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: `0 10px 30px ${G.dark}66`,
      }}>
        <div>
          <h1 className="pm-header-txt">🏭 Production Materials</h1>
          <div style={{ fontSize: 14, fontWeight: 800, color: G.mint, textTransform: 'uppercase', letterSpacing: 4, marginTop: 10 }}>
            Printing Department — Live Stock
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {criticalCount > 0 && (
            <div style={{ background: G.red, color: G.white, border: `3px solid ${G.dark}`, boxShadow: `4px 4px 0 ${G.dark}`, padding: '10px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13 }}>
              ⚠ {criticalCount} Critical
            </div>
          )}
          <button onClick={load} className="pm-btn"
            style={{ background: G.lime, color: G.dark, borderColor: G.dark, padding: '14px 28px', fontSize: 14 }}>
            🔄 REFRESH
          </button>
        </div>
      </div>

      {/* ── STAT STRIP ─────────────────────────────────────────────────── */}
      <div style={{ background: G.dark, borderBottom: `4px solid ${G.forest}`, padding: '0 60px' }}>
        <div className="pm-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'Materials in Production', val: materials.length, color: G.lime },
            { label: 'Total Moved In', val: totalMoved.toLocaleString(), color: G.sky },
            { label: 'Total Consumed', val: totalConsumed.toLocaleString(), color: G.orange },
            { label: 'Total Remaining', val: totalRemaining.toLocaleString(), color: G.leaf },
          ].map((s, i) => (
            <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? `2px solid ${G.forest}55` : 'none', textAlign: i === 0 ? 'left' : 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: G.sage, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────────────────────────────── */}
      <div style={{ background: G.white, borderBottom: `4px solid ${G.sage}`, padding: '20px 60px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by name, ID or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pm-input"
          style={{ flex: 1, maxWidth: 480, padding: '12px 18px', fontSize: 14 }}
        />
        <div style={{ fontSize: 13, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>
          {filtered.length} / {materials.length} records
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="pm-btn"
            style={{ background: G.lightGray, color: G.darkGray, borderColor: G.sage, padding: '10px 18px', fontSize: 12, boxShadow: `3px 3px 0 ${G.sage}` }}>
            ✕ CLEAR
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div style={{ padding: '32px 60px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🌿</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 4 }}>
              Loading Production Stock...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pm-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>📦</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              {materials.length === 0 ? 'No Production Materials Found' : 'No Results Match Your Search'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: G.olive, maxWidth: 480, margin: '0 auto' }}>
              {materials.length === 0
                ? 'Materials appear here automatically when the Printing Supervisor confirms receipt from the Store Materials page.'
                : 'Try a different search term.'}
            </div>
          </div>
        ) : (
          <div className="pm-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr 180px',
              background: `linear-gradient(90deg, ${G.dark}, ${G.forest})`,
              borderBottom: `4px solid ${G.lime}`,
            }}>
              {['Material', 'Category', 'Moved In', 'Consumed', 'Remaining', 'Usage %', 'Action'].map(h => (
                <div key={h} style={{
                  padding: '18px 20px', color: G.white, fontWeight: 900,
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2,
                  borderRight: `2px solid ${G.forest}88`,
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((m, i) => {
              const usage     = pct(m);
              const remaining = parseFloat(m.quantity_remaining || 0);
              const reorder   = parseFloat(m.reorder_level || 5);
              const isCrit    = remaining <= reorder;
              const usageColor = usage > 90 ? G.red : usage > 65 ? G.orange : G.leaf;
              const rowBg     = i % 2 === 0 ? '#f8fff8' : G.white;

              return (
                <div key={m.id} className="pm-row" style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1fr 180px',
                  background: isCrit ? `${G.red}08` : rowBg,
                  borderLeft: `5px solid ${isCrit ? G.red : usageColor}`,
                  animationDelay: `${i * 0.04}s`,
                }}>
                  {/* Material name */}
                  <div style={{ padding: '20px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{m.material_id}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: G.dark, textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 4 }}>{m.material_name}</div>
                    {m.unit && <div style={{ fontSize: 11, fontWeight: 700, color: G.darkGray }}>Unit: {m.unit}</div>}
                    {m.moved_date && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: G.sage, marginTop: 4 }}>
                        Last updated: {new Date(m.updated_at || m.moved_date).toLocaleDateString()}
                      </div>
                    )}
                    {isCrit && (
                      <div style={{ display: 'inline-block', marginTop: 6, background: G.red, color: G.white, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, padding: '3px 10px', border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                        ⚠ CRITICAL LOW
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ background: G.dark, color: G.white, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, padding: '6px 12px', border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.olive}` }}>
                      {m.category || '—'}
                    </span>
                  </div>

                  {/* Moved */}
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: G.forest }}>
                      {parseFloat(m.quantity_moved).toLocaleString()}
                      <div style={{ fontSize: 11, fontWeight: 700, color: G.olive }}>{m.unit}</div>
                    </div>
                  </div>

                  {/* Consumed */}
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: G.orange }}>
                      {parseFloat(m.quantity_consumed).toLocaleString()}
                      <div style={{ fontSize: 11, fontWeight: 700, color: G.olive }}>{m.unit}</div>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: isCrit ? G.red : G.leaf }}>
                      {remaining.toLocaleString()}
                      <div style={{ fontSize: 11, fontWeight: 700, color: G.olive }}>{m.unit}</div>
                    </div>
                  </div>

                  {/* Usage % + mini bar */}
                  <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: usageColor, marginBottom: 6 }}>{usage}%</div>
                    <div style={{ background: `${G.sage}55`, height: 10, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}` }}>
                      <div style={{ height: '100%', background: usageColor, width: `${Math.min(usage, 100)}%`, animation: 'barGrow 1s ease' }} />
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setConsumeTarget(m)}
                      className="pm-btn"
                      disabled={remaining <= 0}
                      style={{
                        background: remaining <= 0 ? G.lightGray : G.orange,
                        color: remaining <= 0 ? G.darkGray : G.white,
                        borderColor: G.dark,
                        padding: '10px 16px',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {remaining <= 0 ? '✓ DEPLETED' : '🔥 LOG USE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INFO PANEL ──────────────────────────────────────────────── */}
        {!loading && materials.length > 0 && (
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="pm-grid-3">
            <div className="pm-card" style={{ padding: 28, animationDelay: '0.2s' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, borderBottom: `3px solid ${G.lime}`, paddingBottom: 12 }}>
                📊 How Materials Appear Here
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { step: '1', icon: '📨', text: 'Supervisor requests material from Store Materials page', color: G.forest },
                  { step: '2', icon: '✅', text: 'CEO approves the request', color: G.emerald },
                  { step: '3', icon: '📦', text: 'General Store Keeper ships the material', color: G.sky },
                  { step: '4', icon: '📥', text: 'Supervisor confirms receipt — material appears HERE automatically', color: G.leaf },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ background: s.color, color: G.white, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, flexShrink: 0 }}>{s.step}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.darkGray, paddingTop: 4 }}>{s.icon} {s.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pm-card" style={{ padding: 28, animationDelay: '0.3s' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, borderBottom: `3px solid ${G.lime}`, paddingBottom: 12 }}>
                📈 Summary Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Total Materials', val: materials.length, color: G.dark },
                  { label: 'Critical / Low Stock', val: criticalCount, color: criticalCount > 0 ? G.red : G.leaf },
                  { label: 'Total Moved In', val: `${totalMoved.toLocaleString()} units`, color: G.forest },
                  { label: 'Total Consumed', val: `${totalConsumed.toLocaleString()} units`, color: G.orange },
                  { label: 'Total Remaining', val: `${totalRemaining.toLocaleString()} units`, color: G.leaf },
                  { label: 'Overall Usage Rate', val: `${totalMoved > 0 ? Math.round((totalConsumed / totalMoved) * 100) : 0}%`, color: G.olive },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${G.sage}55`, paddingBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: G.darkGray, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────── */}
      {consumeTarget && (
        <ConsumeModal
          mat={consumeTarget}
          onClose={() => setConsumeTarget(null)}
          onDone={load}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default PrintingProdMaterials;
