import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Pill, DollarSign, TrendingUp,
  Warehouse, Store, RefreshCw, Save,
  CheckCircle, AlertTriangle, Info, X, ShieldAlert
} from 'lucide-react';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const G = {
  forest:    '#228B22', dark:      '#1B5E20', emerald:   '#2E8B57',
  leaf:      '#4CAF50', sage:      '#A5D6A7', olive:     '#6B8E23',
  mint:      '#98FF98', lime:      '#8BC34A', brown:     '#8D6E63',
  sky:       '#87CEEB', white:     '#FFFFFF', lightGray: '#F5F5F5',
  darkGray:  '#424242', orange:    '#FF9800', red:       '#F44336',
};

// ─── API ─────────────────────────────────────────────────────────────────────
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ─── TOAST ───────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.red : t.type === 'warn' ? G.orange : G.forest;
      const Icon = t.type === 'error' ? AlertTriangle : t.type === 'warn' ? Info : CheckCircle;
      return (
        <div key={t.id} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: `6px 6px 0 ${G.dark}`, minWidth: 280, maxWidth: 380,
          animation: 'toastIn .3s cubic-bezier(.175,.885,.32,1.275)',
          border: `2px solid ${G.dark}`,
        }}>
          <Icon size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
            <X size={16} />
          </button>
        </div>
      );
    })}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
const Btn3D = ({ children, onClick, color = G.emerald, icon: Icon, disabled, full, small }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: color, color: '#fff', border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 20px',
      fontWeight: 800, fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 7,
      boxShadow: `4px 4px 0 ${G.dark}`, borderRadius: 0,
      width: full ? '100%' : undefined, justifyContent: full ? 'center' : undefined,
      transition: 'all .1s', userSelect: 'none',
      whiteSpace: 'nowrap',
    }}
    onMouseDown={e => { if (!disabled) { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}}
    onMouseUp={e => { if (!disabled) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`; }}}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`; }}
  >
    {Icon && <Icon size={small ? 14 : 16} />}
    {children}
  </button>
);

// ─── STAT CARD (3-D, sharp) ───────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, sub }) => (
  <div style={{
    background: '#fff', border: `3px solid ${G.dark}`,
    boxShadow: `6px 6px 0 ${G.dark}`, padding: '22px 24px',
    flex: '1 1 220px', minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 8,
    animation: 'cardIn .4s ease-out',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
        <Icon size={22} color="#fff" />
      </div>
      {sub && <span style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 6 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>
      {label}
    </div>
    <div style={{ height: 4, background: color, marginTop: 4, boxShadow: `2px 2px 0 ${G.dark}` }} />
  </div>
);


// ─── PHARMACY STORE TAB ────────────────────────────────────────────────────────────
// The actual items in the physical pharmacy store. We use the store_inventory endpoint that we found is exposed for Pharmacy managers to view store stock.
const PharmacyStoreTab = ({ items, loading, reload }) => {

  const grandTotal = items.reduce((sum, m) => sum + ((parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, padding: '16px 20px', background: G.lightGray, border: `2px solid ${G.sage}`, borderLeft: `6px solid ${G.forest}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Warehouse size={18} color={G.forest} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            This shows items currently held in the General Medical Store before being issued to the Pharmacy.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 15, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} /> Store Value: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <Btn3D small icon={RefreshCw} color={G.emerald} onClick={reload} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Btn3D>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.olive, fontWeight: 800, fontSize: 18 }}>Loading Store Inventory…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.sage, fontWeight: 800, fontSize: 16, border: `3px dashed ${G.sage}` }}>
          No items found in the Medical Store.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr style={{ background: G.dark, color: '#fff' }}>
                {['Drug ID', 'Name', 'Category', 'Unit', 'Price (ETB)', 'Store Stock Qty', 'Total Value (ETB)'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', borderBottom: `4px solid ${G.forest}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((m, i) => {
                const totalValue = (parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0);
                const isLowStock = m.stock_quantity <= m.min_level;
                return (
                <tr key={m.id}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `2px solid ${G.lightGray}`, transition: 'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                >
                  <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald }}>{m.drug_id}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark }}>{m.name}</td>
                  <td style={{ padding: '11px 16px', color: G.darkGray }}>{m.category || 'Uncategorized'}</td>
                  <td style={{ padding: '11px 16px', color: G.darkGray }}>{m.unit}</td>
                  <td style={{ padding: '11px 16px' }}>{parseFloat(m.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 900, color: isLowStock ? G.red : G.forest }}>
                    {parseFloat(m.stock_quantity).toLocaleString()}
                    {isLowStock && <ShieldAlert size={14} color={G.red} style={{ marginLeft: 6, verticalAlign: 'middle' }} title="Low Stock" />}
                  </td>
                  <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest }}>
                    ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark, color: '#fff' }}>
                <td colSpan={6} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  Total Lines in Store — {items.length} Item{items.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 16, color: '#98FF98', whiteSpace: 'nowrap' }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── PHARMACY STOCK TAB ─────────────────────────────────────────────────────────────
const PharmacyStockTab = ({ drugs, loading, reload }) => {

  const grandTotal = drugs.reduce((sum, d) => sum + ((parseFloat(d.quantity) || 0) * (parseFloat(d.unit_price) || 0)), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, padding: '16px 20px', background: G.lightGray, border: `2px solid ${G.sage}`, borderLeft: `6px solid ${G.brown}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Store size={18} color={G.brown} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            This shows exactly the medications currently available on the Pharmacy shelves for dispensing.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 15, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} /> Stock Value: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <Btn3D small icon={RefreshCw} color={G.emerald} onClick={reload} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Btn3D>
        </div>
      </div>

      {loading && drugs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.olive, fontWeight: 800, fontSize: 18 }}>Loading pharmacy stock…</div>
      ) : drugs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.sage, fontWeight: 800, fontSize: 16, border: `3px dashed ${G.sage}` }}>
          No drugs found in Pharmacy inventory.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: G.dark, color: '#fff' }}>
                {['Drug ID', 'Name', 'Strength', 'Category', 'Unit', 'Price (ETB)', 'Stock Qty', 'Total Value (ETB)'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', borderBottom: `4px solid ${G.forest}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drugs.map((d, i) => {
                const totalValue = (parseFloat(d.quantity) || 0) * (parseFloat(d.unit_price) || 0);
                const isLowStock = d.quantity <= d.reorder_level;
                return (
                  <tr key={d.inventory_id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `2px solid ${G.lightGray}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald }}>{d.drug_id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark }}>{d.name}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray }}>{d.strength || '—'}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray }}>{d.category || 'Uncategorized'}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray }}>{d.unit}</td>
                    <td style={{ padding: '11px 16px' }}>{parseFloat(d.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: isLowStock ? G.red : G.forest }}>
                      {parseFloat(d.quantity).toLocaleString()}
                      {isLowStock && <ShieldAlert size={14} color={G.red} style={{ marginLeft: 6, verticalAlign: 'middle' }} title="Low Stock" />}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest }}>
                      ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark, color: '#fff' }}>
                <td colSpan={7} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  Total Pharmacy Inventory Value — {drugs.length} Item{drugs.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 16, color: '#98FF98', whiteSpace: 'nowrap' }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const FinancePharmacyAssets = () => {
  const [tab, setTab] = useState('store');
  const [storeItems, setStoreItems] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, push, remove } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [storeRes, stockRes] = await Promise.all([
        api.get('/api/v1/pharmacy/store-inventory').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/pharmacy-inventory/current').catch(() => ({ data: { data: [] } }))
      ]);
      setStoreItems(storeRes.data?.data || []);
      setStockItems(stockRes.data?.data || []);
    } catch { push('Could not load data', 'warn'); }
    setLoading(false);
  }, [push]);

  useEffect(() => { loadData(); }, [loadData]);

  let activeTypes = 0;
  let activeQty = 0;
  let activeValue = 0;
  let hasValue = false;

  if (tab === 'store') {
    activeTypes = storeItems.length;
    activeQty = storeItems.reduce((s, m) => s + (parseFloat(m.stock_quantity) || 0), 0);
    activeValue = storeItems.reduce((s, m) => s + ((parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);
    hasValue = true;
  } else {
    activeTypes = stockItems.length;
    activeQty = stockItems.reduce((s, m) => s + (parseFloat(m.quantity) || 0), 0);
    activeValue = stockItems.reduce((s, m) => s + ((parseFloat(m.quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);
    hasValue = true;
  }

  const TABS = [
    { id: 'store', label: 'Medical Store Evaluation', icon: Warehouse, color: G.forest  },
    { id: 'stock', label: 'Pharmacy Stock Evaluation', icon: Store,     color: G.brown   },
  ];

  const CARDS = [
    { label: tab === 'store' ? 'Store Drug Types' : 'Pharmacy Drug Types', value: activeTypes, Icon: Pill, color: G.lime, sub: 'Types' },
    { label: tab === 'store' ? 'Total Store Stock Qty' : 'Total Pharmacy Stock Qty', value: activeQty.toLocaleString(), Icon: Store, color: G.emerald, sub: 'Units' },
    ...(hasValue ? [{ label: 'Total Stock Value', value: 'ETB ' + activeValue.toLocaleString(undefined, { minimumFractionDigits: 2 }), Icon: DollarSign, color: G.forest, sub: 'Value' }] : [])
  ];

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px 0' }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes toastIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin    { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }

        /* Responsive */
        @media (max-width: 900px) {
          .stat-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .tab-row    { flex-direction: column !important; }
          .tab-btn    { width: 100% !important; border-right: 3px solid ${G.dark} !important; margin-bottom: -3px; }
          .page-header h1 { font-size: 20px !important; }
          .page-header p  { font-size: 13px !important; }
        }
        @media (max-width: 480px) {
          .stat-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── FULL-WIDTH HEADER ── */}
      <div style={{
        background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`,
        padding: '28px 40px', color: '#fff',
        boxShadow: `0 8px 32px ${G.dark}66`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }} className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: G.mint, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <Pill size={28} color={G.dark} />
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: -.5 }}>
              Pharmacy Store &amp; Stock Valuation
            </h1>
          </div>
          <p style={{ margin: '0 0 0 52px', opacity: .85, fontSize: 14, lineHeight: 1.5 }}>
            Evaluate exact stock quantities and values in the Medical Store and Active Pharmacy shelves.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.4)`, color: '#fff', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh Data
        </button>
      </div>

      <div style={{ padding: '32px 40px 0' }}>

        {/* ── STAT CARDS — 2×2 responsive grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: G.olive, fontWeight: 800, fontSize: 16 }}>
            Loading stats…
          </div>
        ) : (
          <div className="stat-grid" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${CARDS.length}, 1fr)`,
            gap: 20, marginBottom: 32,
          }}>
            {CARDS.map((c, i) => (
              <StatCard key={i} label={c.label} value={c.value} color={c.color} Icon={c.Icon} sub={c.sub} />
            ))}
          </div>
        )}

        {/* ── STRETCHED TAB BUTTONS (2 per row, full-width each) ── */}
        <div className="tab-row" style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
          {TABS.map((t, idx) => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="tab-btn"
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px 24px', border: `3px solid ${G.dark}`,
                  borderRight: idx < TABS.length - 1 ? 'none' : `3px solid ${G.dark}`,
                  background: active ? G.dark : '#fff',
                  color: active ? '#fff' : G.darkGray,
                  fontWeight: 900, fontSize: 15, cursor: 'pointer',
                  boxShadow: active ? `0 6px 0 ${G.forest}` : 'none',
                  transform: active ? 'translateY(-3px)' : 'translateY(0)',
                  transition: 'all .2s',
                  position: 'relative',
                  zIndex: active ? 2 : 1,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = G.lightGray; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
              >
                <t.icon size={18} color={active ? '#fff' : t.color} />
                {t.label}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 40, height: 6, background: G.leaf,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT PANEL ── */}
        <div style={{
          background: '#fff', border: `3px solid ${G.dark}`,
          boxShadow: `6px 6px 0 ${G.dark}`, padding: '28px 28px',
          animation: 'fadeIn .25s ease-out',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingBottom: 18, marginBottom: 24,
            borderBottom: `3px solid ${G.sage}`,
          }}>
            <div style={{ background: tab === 'store' ? G.forest : G.brown, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              {tab === 'store' ? <Warehouse size={20} color="#fff" /> : <Store size={20} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: G.dark }}>
                {tab === 'store' ? 'Medical Store Evaluation' : 'Pharmacy Stock Evaluation'}
              </div>
              <div style={{ fontSize: 12, color: G.olive, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: .8 }}>
                {tab === 'store' ? 'Backend Store Inventory' : 'Front Pharmacy Inventory'}
              </div>
            </div>
          </div>

          {tab === 'store'
            ? <PharmacyStoreTab items={storeItems} loading={loading} reload={loadData} />
            : <PharmacyStockTab drugs={stockItems} loading={loading} reload={loadData} />
          }
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
};

export default FinancePharmacyAssets;
