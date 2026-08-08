import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Pill, DollarSign, TrendingUp,
  Warehouse, Store, RefreshCw,
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
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.red : t.type === 'warn' ? G.orange : G.forest;
      const Icon = t.type === 'error' ? AlertTriangle : t.type === 'warn' ? Info : CheckCircle;
      return (
        <div key={t.id} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 280, maxWidth: 380, border: `2px solid ${G.dark}`,
        }}>
          <Icon size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, pointerEvents: 'all' }}>
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

// ─── FLAT BUTTON ─────────────────────────────────────────────────────────────
const FlatBtn = ({ children, onClick, color = G.emerald, icon: Icon, disabled, small }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? G.sage : color,
      color: '#fff',
      border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 20px',
      fontWeight: 800,
      fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      transition: 'background 0.2s',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      textTransform: 'uppercase',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = G.dark; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = color; }}
  >
    {Icon && <Icon size={small ? 13 : 16} />}
    {children}
  </button>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, sub }) => (
  <div
    style={{
      background: '#fff', border: `2px solid ${G.dark}`,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, display: 'flex' }}>
        <Icon size={20} color="#fff" />
      </div>
      {sub && <span style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 4 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {label}
    </div>
    <div style={{ height: 3, background: color, marginTop: 2 }} />
  </div>
);

// ─── PHARMACY STORE TAB ───────────────────────────────────────────────────────
const PharmacyStoreTab = ({ items, loading, reload }) => {
  const grandTotal = items.reduce((sum, m) => sum + ((parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);

  return (
    <div>
      {/* Info + Controls Strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, marginBottom: 18,
        padding: '12px 18px', background: G.lightGray,
        border: `2px solid ${G.dark}`, borderLeft: `6px solid ${G.forest}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Warehouse size={17} color={G.forest} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            Items currently held in the General Medical Store before being issued to the Pharmacy.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 14, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} /> Store Value: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <FlatBtn small icon={RefreshCw} color={G.emerald} onClick={reload} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </FlatBtn>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: G.olive, fontWeight: 800, fontSize: 16 }}>
          Loading Store Inventory…
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: G.darkGray, fontWeight: 700, fontSize: 15, border: `2px dashed ${G.sage}`, background: G.lightGray }}>
          No items found in the Medical Store.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `2px solid ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr style={{ background: G.dark }}>
                {['Drug ID', 'Name', 'Category', 'Unit', 'Price (ETB)', 'Store Stock Qty', 'Total Value (ETB)'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', fontWeight: 900,
                    textTransform: 'uppercase', fontSize: 11, letterSpacing: 1,
                    whiteSpace: 'nowrap', color: '#fff', border: `1px solid ${G.forest}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((m, i) => {
                const totalVal = (parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0);
                const isLow = m.stock_quantity <= m.min_level;
                return (
                  <tr key={m.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald, border: `1px solid ${G.sage}` }}>{m.drug_id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark, border: `1px solid ${G.sage}` }}>{m.name}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{m.category || 'Uncategorized'}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{m.unit}</td>
                    <td style={{ padding: '11px 16px', border: `1px solid ${G.sage}` }}>{parseFloat(m.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: isLow ? G.red : G.forest, border: `1px solid ${G.sage}` }}>
                      {parseFloat(m.stock_quantity).toLocaleString()}
                      {isLow && <ShieldAlert size={13} color={G.red} style={{ marginLeft: 6, verticalAlign: 'middle' }} title="Low Stock" />}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest, border: `1px solid ${G.sage}` }}>
                      ETB {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark }}>
                <td colSpan={6} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                  Total Lines in Store — {items.length} Item{items.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15, color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
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

// ─── PHARMACY STOCK TAB ───────────────────────────────────────────────────────
const PharmacyStockTab = ({ drugs, loading, reload }) => {
  const grandTotal = drugs.reduce((sum, d) => sum + ((parseFloat(d.quantity) || 0) * (parseFloat(d.unit_price) || 0)), 0);

  return (
    <div>
      {/* Info + Controls Strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, marginBottom: 18,
        padding: '12px 18px', background: G.lightGray,
        border: `2px solid ${G.dark}`, borderLeft: `6px solid ${G.brown}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Store size={17} color={G.brown} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            Medications currently available on the Pharmacy shelves for dispensing.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 14, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} /> Stock Value: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <FlatBtn small icon={RefreshCw} color={G.emerald} onClick={reload} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </FlatBtn>
        </div>
      </div>

      {loading && drugs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: G.olive, fontWeight: 800, fontSize: 16 }}>
          Loading pharmacy stock…
        </div>
      ) : drugs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: G.darkGray, fontWeight: 700, fontSize: 15, border: `2px dashed ${G.sage}`, background: G.lightGray }}>
          No drugs found in Pharmacy inventory.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `2px solid ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: G.dark }}>
                {['Drug ID', 'Name', 'Strength', 'Category', 'Unit', 'Price (ETB)', 'Stock Qty', 'Total Value (ETB)'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', fontWeight: 900,
                    textTransform: 'uppercase', fontSize: 11, letterSpacing: 1,
                    whiteSpace: 'nowrap', color: '#fff', border: `1px solid ${G.forest}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drugs.map((d, i) => {
                const totalVal = (parseFloat(d.quantity) || 0) * (parseFloat(d.unit_price) || 0);
                const isLow = d.quantity <= d.reorder_level;
                return (
                  <tr key={d.inventory_id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald, border: `1px solid ${G.sage}` }}>{d.drug_id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark, border: `1px solid ${G.sage}` }}>{d.name}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{d.strength || '—'}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{d.category || 'Uncategorized'}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{d.unit}</td>
                    <td style={{ padding: '11px 16px', border: `1px solid ${G.sage}` }}>{parseFloat(d.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: isLow ? G.red : G.forest, border: `1px solid ${G.sage}` }}>
                      {parseFloat(d.quantity).toLocaleString()}
                      {isLow && <ShieldAlert size={13} color={G.red} style={{ marginLeft: 6, verticalAlign: 'middle' }} title="Low Stock" />}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest, border: `1px solid ${G.sage}` }}>
                      ETB {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark }}>
                <td colSpan={7} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                  Total Pharmacy Inventory Value — {drugs.length} Item{drugs.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15, color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
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

  // Active tab computed stats
  let activeTypes = 0, activeQty = 0, activeValue = 0;
  if (tab === 'store') {
    activeTypes = storeItems.length;
    activeQty   = storeItems.reduce((s, m) => s + (parseFloat(m.stock_quantity) || 0), 0);
    activeValue = storeItems.reduce((s, m) => s + ((parseFloat(m.stock_quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);
  } else {
    activeTypes = stockItems.length;
    activeQty   = stockItems.reduce((s, m) => s + (parseFloat(m.quantity) || 0), 0);
    activeValue = stockItems.reduce((s, m) => s + ((parseFloat(m.quantity) || 0) * (parseFloat(m.unit_price) || 0)), 0);
  }

  const TABS = [
    { id: 'store', label: 'Medical Store Evaluation', icon: Warehouse, color: G.forest },
    { id: 'stock', label: 'Pharmacy Stock Evaluation', icon: Store,     color: G.brown  },
  ];

  const CARDS = [
    { label: tab === 'store' ? 'Store Drug Types'    : 'Pharmacy Drug Types',    value: activeTypes, Icon: Pill,      color: G.lime,    sub: 'Types' },
    { label: tab === 'store' ? 'Total Store Stock Qty': 'Total Pharmacy Stock Qty', value: activeQty.toLocaleString(), Icon: Store, color: G.emerald, sub: 'Units' },
    { label: 'Total Stock Value', value: `ETB ${activeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, Icon: DollarSign, color: G.forest, sub: 'Value' },
  ];

  return (
    <div style={{
      background: '#FFFFFF', minHeight: '100vh', width: '100%',
      fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box',
    }}>

      <style>{`
        @keyframes psa-spin { 100% { transform: rotate(360deg); } }
        .psa-spin { animation: psa-spin 1s linear infinite; }
        * { box-sizing: border-box; }

        .psa-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .psa-tab-row {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
        }
        .psa-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border: 2px solid #1B5E20;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: background 0.2s, color 0.2s;
          font-family: inherit;
        }
        .psa-tab-btn:first-child { border-right: none; }

        @media (max-width: 900px) { .psa-kpi-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) {
          .psa-kpi-grid { grid-template-columns: 1fr; }
          .psa-tab-row { flex-direction: column; }
          .psa-tab-btn:first-child { border-right: 2px solid #1B5E20; border-bottom: none; }
        }
      `}</style>

      <ToastContainer toasts={toasts} remove={remove} />

      {/* ── CONTENT WRAPPER ── */}
      <div style={{ padding: '20px 24px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <Pill size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Pharmacy Store &amp; Stock Valuation
              </div>
              <div style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Evaluate exact stock quantities and values in the Medical Store and Active Pharmacy shelves.
              </div>
            </div>
          </div>
          <FlatBtn icon={RefreshCw} color={G.emerald} onClick={loadData} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh Data'}
          </FlatBtn>
        </div>

        {/* ── KPI CARDS ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 36, color: G.olive, fontWeight: 800, fontSize: 15 }}>
            <SegmentedSpinner size={28} />
            Loading stats…
          </div>
        ) : (
          <div className="psa-kpi-grid">
            {CARDS.map((c, i) => (
              <StatCard key={i} label={c.label} value={c.value} color={c.color} Icon={c.Icon} sub={c.sub} />
            ))}
          </div>
        )}

        {/* ── INFO STRIP ── */}
        <div style={{
          background: '#E3F2FD', border: `2px solid ${G.sky}`, borderLeft: `6px solid ${G.sky}`,
          padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
        }}>
          <Info size={16} color={G.sky} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: G.dark, fontWeight: 600 }}>
            <strong>Medical Store</strong> holds incoming stock before it moves to the Pharmacy.&nbsp;
            <strong>Pharmacy Stock</strong> shows what is actively available for dispensing to patients.
          </div>
        </div>

        {/* ── TAB BUTTONS ── */}
        <div className="psa-tab-row">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                className="psa-tab-btn"
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? G.dark : '#fff',
                  color: active ? '#fff' : G.darkGray,
                  borderColor: G.dark,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = G.lightGray; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
              >
                <t.icon size={17} color={active ? '#fff' : t.color} />
                {t.label}
                {active && <div style={{ width: 6, height: 6, background: G.leaf, borderRadius: '50%' }} />}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT PANEL ── */}
        <div style={{ background: '#fff', border: `2px solid ${G.dark}`, padding: '22px' }}>

          {/* Sub-header (small label only — not a bold full-width color block, rule 16) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: `2px solid ${G.sage}` }}>
            <div style={{ background: tab === 'store' ? G.forest : G.brown, padding: 8, border: `2px solid ${G.dark}`, display: 'flex' }}>
              {tab === 'store' ? <Warehouse size={18} color="#fff" /> : <Store size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>
                {tab === 'store' ? 'Medical Store Evaluation' : 'Pharmacy Stock Evaluation'}
              </div>
              <div style={{ fontSize: 11, color: G.olive, fontWeight: 700, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
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
    </div>
  );
};

export default FinancePharmacyAssets;
