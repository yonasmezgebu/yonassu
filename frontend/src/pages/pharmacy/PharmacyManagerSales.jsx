import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { ShoppingCart, ClipboardList, RefreshCw, ChevronDown, ChevronUp, Search } from 'lucide-react';

/* ── helpers ────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' +
    dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
};

const ACTION_META = {
  PAID:                  { label: 'Sale — PAID',            icon: '🛒', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  CASHOUT:               { label: 'Sale — CASHOUT',          icon: '💵', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  RETURN:                { label: 'Sale Return',             icon: '↩️', bg: '#fff7ed', border: '#fdba74', chip: '#ffedd5', chipText: '#9a3412' },
  DAILY_SUBMIT:          { label: 'Daily Submission',        icon: '📤', bg: '#eff6ff', border: '#93c5fd', chip: '#dbeafe', chipText: '#1e40af' },
  STOCK_IN:              { label: 'Stock Received',          icon: '📦', bg: '#f5f3ff', border: '#c4b5fd', chip: '#ede9fe', chipText: '#5b21b6' },
  STOCK_OUT:             { label: 'Stock Deduction',         icon: '📉', bg: '#fff1f2', border: '#fda4af', chip: '#fee2e2', chipText: '#991b1b' },
  PRESCRIPTION_PENDING:  { label: 'Prescription Issued',     icon: '📋', bg: '#fefce8', border: '#fde047', chip: '#fef9c3', chipText: '#713f12' },
  PRESCRIPTION_PREPARED: { label: 'Prescription Prepared',   icon: '✅', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  PRESCRIPTION_PICKED_UP:{ label: 'Prescription Picked Up',  icon: '🤝', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  PRESCRIPTION_CANCELLED:{ label: 'Prescription Cancelled',  icon: '❌', bg: '#fff1f2', border: '#fda4af', chip: '#fee2e2', chipText: '#991b1b' },
};
const getMeta = (action = '') => ACTION_META[action] || {
  label: action.replace(/_/g, ' '), icon: '●',
  bg: '#f8fafc', border: '#e2e8f0', chip: '#f1f5f9', chipText: '#334155',
};

const td  = { padding: '10px 12px', fontSize: 13, color: '#374151', verticalAlign: 'middle' };
const th  = { padding: '10px 12px', color: '#fff', fontWeight: 600, fontSize: 12, textAlign: 'left' };
const tds = { padding: '7px 10px', fontSize: 12, color: '#374151' };

function SaleRow({ sale, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <td style={td}>{sale.id}</td>
        <td style={td}>{fmtDate(sale.created_at)}</td>
        <td style={td}>{sale.worker_name || sale.cashier_name || '—'}</td>
        <td style={td}>{sale.branch_name || sale.branch_id || '—'}</td>
        <td style={td}>{sale.customer_name || 'Walk-in'}</td>
        <td style={td}>
          <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
            {sale.payment_status || sale.status || '—'}
          </span>
        </td>
        <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmt(sale.total_amount)} ETB</td>
        <td style={{ ...td, textAlign: 'center' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} style={{ background: '#f1f5f9', padding: '12px 20px' }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
              <strong>Payment Method:</strong> {sale.payment_method || '—'} &nbsp;·&nbsp;
              <strong>Sale Type:</strong> {sale.sale_type || 'walk_in'} &nbsp;·&nbsp;
              <strong>Receipt:</strong> {sale.receipt_no || '—'}
            </div>
            {sale.items && sale.items.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e1b4b' }}>
                    <th style={th}>Drug / Medicine</th>
                    <th style={{ ...th, textAlign: 'right' }}>Qty</th>
                    <th style={{ ...th, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ ...th, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={tds}>{it.drug_name}</td>
                      <td style={{ ...tds, textAlign: 'right' }}>{it.quantity}</td>
                      <td style={{ ...tds, textAlign: 'right' }}>{fmt(it.unit_price)}</td>
                      <td style={{ ...tds, textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function AuditRow({ entry, idx }) {
  const [open, setOpen] = useState(false);
  const meta = getMeta(entry.action);
  let snap = null;
  try { snap = typeof entry.snapshot === 'string' ? JSON.parse(entry.snapshot) : entry.snapshot; } catch (_) {}
  return (
    <>
      <tr style={{ background: meta.bg, cursor: 'pointer', borderBottom: `1px solid ${meta.border}` }} onClick={() => setOpen(o => !o)}>
        <td style={td}>{fmtDate(entry.created_at)}</td>
        <td style={td}>
          <span>{meta.icon}</span>{' '}
          <span style={{ background: meta.chip, color: meta.chipText, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
            {meta.label}
          </span>
        </td>
        <td style={td}>{entry.worker_name || '—'}</td>
        <td style={td}>{entry.branch_name || '—'}</td>
        <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
          {entry.total_amount ? `${fmt(entry.total_amount)} ETB` : '—'}
        </td>
        <td style={{ ...td, textAlign: 'center' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
      </tr>
      {open && snap && (
        <tr>
          <td colSpan={6} style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: `1px solid ${meta.border}` }}>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
              <strong>Customer:</strong> {snap.customer || 'Walk-in'}&nbsp;·&nbsp;
              <strong>Payment:</strong> {snap.payment_method || '—'}&nbsp;·&nbsp;
              <strong>Receipt:</strong> {snap.receipt_no || '—'}
            </div>
            {snap.items && snap.items.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e1b4b' }}>
                    <th style={th}>Drug / Medicine</th>
                    <th style={{ ...th, textAlign: 'right' }}>Qty</th>
                    <th style={{ ...th, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ ...th, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.items.map((it, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={tds}>{it.drug_name}</td>
                      <td style={{ ...tds, textAlign: 'right' }}>{it.quantity}</td>
                      <td style={{ ...tds, textAlign: 'right' }}>{fmt(it.unit_price)}</td>
                      <td style={{ ...tds, textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function PharmacyManagerSales() {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales]         = useState([]);
  const [audit, setAudit]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/sales?limit=200');
      setSales(Array.isArray(res.data) ? res.data : (res.data?.sales || res.data?.data || []));
    } catch (e) { console.error('Failed to load sales', e); }
    finally { setLoading(false); }
  }, []);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/audit-trail?limit=200');
      setAudit(Array.isArray(res.data) ? res.data : (res.data?.entries || res.data?.data || []));
    } catch (e) { console.error('Failed to load audit trail', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSales(); loadAudit(); }, [loadSales, loadAudit]);

  // Sync with navbar search bar
  useEffect(() => {
    const handleNavSearch = (e) => setSearch(e.detail || '');
    window.addEventListener('dashboardSearch', handleNavSearch);
    return () => window.removeEventListener('dashboardSearch', handleNavSearch);
  }, []);

  const q = search.toLowerCase();
  const filteredSales = sales.filter(s =>
    !q || (s.worker_name||'').toLowerCase().includes(q) ||
    (s.customer_name||'').toLowerCase().includes(q) ||
    (s.branch_name||'').toLowerCase().includes(q) || String(s.id).includes(q)
  );
  const filteredAudit = audit.filter(e =>
    !q || (e.worker_name||'').toLowerCase().includes(q) ||
    (e.branch_name||'').toLowerCase().includes(q) || (e.action||'').toLowerCase().includes(q)
  );

  const totalRevenue = sales.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0);
  const todaySales   = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0);

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>💊 Worker Sales Overview</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>View-only — All pharmacy worker sales and audit trail</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Transactions', value: sales.length, color: '#2563eb', icon: '🛒' },
          { label: 'Total Revenue', value: `${fmt(totalRevenue)} ETB`, color: '#059669', icon: '💰' },
          { label: "Today's Sales", value: todaySales.length, color: '#7c3aed', icon: '📅' },
          { label: "Today's Revenue", value: `${fmt(todayRevenue)} ETB`, color: '#d97706', icon: '💵' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: card.color, marginTop: 4 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: 8, padding: 4 }}>
          {[{ key: 'sales', label: '🛒 Sales' }, { key: 'audit', label: '📋 Audit Trail' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: activeTab === t.key ? 700 : 500,
                background: activeTab === t.key ? '#fff' : 'transparent',
                color: activeTab === t.key ? '#111827' : '#6b7280',
                boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', gap: 8, flexGrow: 1, maxWidth: 320 }}>
          <Search size={14} color="#9ca3af" />
          <input placeholder="Search worker, branch, customer…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, color: '#374151' }} />
        </div>
        <button onClick={() => { loadSales(); loadAudit(); }} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
          <RefreshCw size={14} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {activeTab === 'sales' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 14 }}>
            Sales Records ({filteredSales.length})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e1b4b' }}>
                  {['ID', 'Date & Time', 'Worker', 'Branch', 'Customer', 'Status', 'Total', ''].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No sales records found.</td></tr>
                ) : filteredSales.map((s, i) => <SaleRow key={s.id} sale={s} idx={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 14 }}>
            Audit Trail ({filteredAudit.length})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e1b4b' }}>
                  {['Date & Time', 'Action', 'Worker', 'Branch', 'Amount', ''].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading…</td></tr>
                ) : filteredAudit.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No audit entries found.</td></tr>
                ) : filteredAudit.map((e, i) => <AuditRow key={e.id || i} entry={e} idx={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
