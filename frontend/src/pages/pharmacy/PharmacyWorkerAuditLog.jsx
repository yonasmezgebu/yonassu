import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' +
    dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
};

const ACTION_META = {
  PAID:                 { label: 'Sale — PAID',           icon: '🛒', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  CASHOUT:              { label: 'Sale — CASHOUT',         icon: '💵', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  RETURN:               { label: 'Sale Return',            icon: '↩️', bg: '#fff7ed', border: '#fdba74', chip: '#ffedd5', chipText: '#9a3412' },
  DAILY_SUBMIT:         { label: 'Daily Submission',       icon: '📤', bg: '#eff6ff', border: '#93c5fd', chip: '#dbeafe', chipText: '#1e40af' },
  STOCK_IN:             { label: 'Stock Received',         icon: '📦', bg: '#f5f3ff', border: '#c4b5fd', chip: '#ede9fe', chipText: '#5b21b6' },
  STOCK_OUT:            { label: 'Stock Deduction',        icon: '📉', bg: '#fff1f2', border: '#fda4af', chip: '#fee2e2', chipText: '#991b1b' },
  PRESCRIPTION_PENDING: { label: 'Prescription Issued',    icon: '📋', bg: '#fefce8', border: '#fde047', chip: '#fef9c3', chipText: '#713f12' },
  PRESCRIPTION_PREPARED:{ label: 'Prescription Prepared',  icon: '✅', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  PRESCRIPTION_PICKED_UP:{ label: 'Prescription Picked Up',icon: '🤝', bg: '#f0fdf4', border: '#86efac', chip: '#dcfce7', chipText: '#166534' },
  PRESCRIPTION_CANCELLED:{ label: 'Prescription Cancelled',icon: '❌', bg: '#fff1f2', border: '#fda4af', chip: '#fee2e2', chipText: '#991b1b' },
};

const getMeta = (action = '') => ACTION_META[action] || {
  label: action.replace(/_/g, ' '),
  icon: '●',
  bg: '#f8fafc', border: '#e2e8f0', chip: '#f1f5f9', chipText: '#334155',
};

/* ── Snapshot renderer: full sale details card ── */
function SaleSnapshot({ snap }) {
  if (!snap) return <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>No detailed snapshot available.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {snap.receipt_no && <Pill label="Receipt" value={snap.receipt_no} color="#6366f1" />}
        {snap.sale_type  && <Pill label="Type"    value={snap.sale_type}  color="#0891b2" />}
        {snap.payment_method && <Pill label="Payment" value={snap.payment_method} color="#16a34a" />}
        {snap.payment_status && <Pill label="Status"  value={snap.payment_status} color="#d97706" />}
      </div>

      {/* Customer row */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}>
        <span>👤 <strong>Customer:</strong> {snap.customer || 'Walk-in'}</span>
        {snap.customer_phone && <span>📞 {snap.customer_phone}</span>}
        {snap.bank_name && <span>🏦 Bank: {snap.bank_name}</span>}
        {snap.telbir_number && <span>📱 Telebirr: {snap.telbir_number}</span>}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
        <span style={{ color: '#374151' }}>🧴 <strong>Products:</strong> {snap.total_products}</span>
        <span style={{ color: '#059669', fontWeight: 700, fontSize: 14 }}>💰 Total: {fmt(snap.total_amount)} ETB</span>
      </div>

      {/* Items table */}
      {snap.items && snap.items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#1e1b4b' }}>
                <th style={thS}>Drug / Medicine</th>
                <th style={{ ...thS, textAlign: 'right' }}>Qty</th>
                <th style={{ ...thS, textAlign: 'right' }}>Unit Price</th>
                <th style={{ ...thS, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {snap.items.map((it, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={tdS}>{it.drug_name}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(it.unit_price)} ETB</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{fmt(it.total_price)} ETB</td>
                </tr>
              ))}
              <tr style={{ background: '#1e1b4b' }}>
                <td colSpan={3} style={{ ...tdS, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                <td style={{ ...tdS, textAlign: 'right', fontWeight: 800, color: '#6ee7b7', fontFamily: 'monospace' }}>{fmt(snap.total_amount)} ETB</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PrescriptionSnapshot({ snap }) {
  if (!snap) return <div style={{ color: '#94a3b8', fontSize: 13 }}>No details available.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {snap.reference_no && <Pill label="Ref #" value={snap.reference_no} color="#d97706" />}
        {snap.status && <Pill label="Status" value={snap.status} color="#6366f1" />}
        {snap.source && <Pill label="Source" value={snap.source} color="#0891b2" />}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}>
        <span>💊 <strong>Drug:</strong> {snap.drug_name} × {snap.quantity}</span>
        <span>👤 <strong>Patient:</strong> {snap.customer}</span>
        {snap.customer_phone && <span>📞 {snap.customer_phone}</span>}
      </div>
    </div>
  );
}

function StockSnapshot({ snap }) {
  if (!snap) return <div style={{ color: '#94a3b8', fontSize: 13 }}>No details available.</div>;
  const sign = snap.quantity_change > 0 ? '+' : '';
  const color = snap.quantity_change > 0 ? '#16a34a' : '#dc2626';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {snap.reference_no && <Pill label="Ref #" value={snap.reference_no} color="#6366f1" />}
        {snap.unit && <Pill label="Unit" value={snap.unit} color="#0891b2" />}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}>
        <span>💊 <strong>Drug:</strong> {snap.drug_name}</span>
        <span style={{ color, fontWeight: 700 }}>📊 Change: {sign}{snap.quantity_change}</span>
        {snap.current_stock != null && <span>🗃️ Current Stock: {snap.current_stock}</span>}
      </div>
      {snap.reason && (
        <div style={{ fontSize: 12.5, color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          📝 Reason: {snap.reason}
        </div>
      )}
    </div>
  );
}

function DailySubmitSnapshot({ snap }) {
  if (!snap) return <div style={{ color: '#94a3b8', fontSize: 13 }}>No details available.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#475569' }}>
        <span>📋 <strong>Submitted:</strong> {snap.submitted_count} transactions</span>
        <span style={{ color: '#059669', fontWeight: 700 }}>💰 Total: {fmt(snap.total_amount)} ETB</span>
      </div>
      {snap.note && <div style={{ fontSize: 12.5, color: '#64748b' }}>📝 {snap.note}</div>}
      {snap.sales && snap.sales.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#1e1b4b' }}>
              <th style={thS}>Receipt</th>
              <th style={thS}>Type</th>
              <th style={{ ...thS, textAlign: 'right' }}>Amount</th>
              <th style={thS}>Date</th>
            </tr></thead>
            <tbody>
              {snap.sales.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontWeight: 700 }}>{s.receipt_no}</td>
                  <td style={tdS}>{s.sale_type}</td>
                  <td style={{ ...tdS, textAlign: 'right', color: '#059669', fontFamily: 'monospace' }}>{fmt(s.total_amount)} ETB</td>
                  <td style={{ ...tdS, color: '#94a3b8', fontSize: 11 }}>{fmtDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* small reusable pill */
function Pill({ label, value, color }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '18', color, border: `1px solid ${color}40` }}>
      {label}: {value}
    </span>
  );
}

const thS = { padding: '7px 12px', color: '#fff', fontSize: 11.5, fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' };
const tdS = { padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 12.5, color: '#334155', verticalAlign: 'middle' };

/* ── Main component ─────────────────────────────────────────────────────── */
export default function PharmacyWorkerAuditLog() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [draft, setDraft]             = useState('');
  const [expanded, setExpanded]       = useState(null);
  const [page, setPage]               = useState(1);
  const [timeFilter, setTimeFilter]   = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const PAGE_SIZE = 30;

  useEffect(() => {
    const handleDashSearch = (e) => {
      const q = e.detail || '';
      setDraft(q);
      setSearch(q);
      setPage(1);
    };
    window.addEventListener('dashboardSearch', handleDashSearch);
    return () => window.removeEventListener('dashboardSearch', handleDashSearch);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch up to 1000 so we can comfortably filter locally for quarterly reports
      const res = await apiClient.get('/pharmacy/audit-trail', {
        params: { search, limit: 1000 },
      });
      const data = Array.isArray(res?.data) ? res.data
                 : Array.isArray(res?.data?.data) ? res.data.data
                 : Array.isArray(res) ? res : [];
      setLogs(data);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const handleSearch = () => { setSearch(draft); setPage(1); };

  // ── Local Filtering ──
  const now = new Date();
  const filteredLogs = logs.filter(l => {
    // 1. Time Filter
    if (timeFilter !== 'ALL') {
      const logDate = new Date(l.created_at);
      const diffTime = Math.abs(now - logDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (timeFilter === 'DAILY' && diffDays > 1) return false;
      if (timeFilter === 'WEEKLY' && diffDays > 7) return false;
      if (timeFilter === 'MONTHLY' && diffDays > 30) return false;
      if (timeFilter === 'QUARTERLY' && diffDays > 90) return false;
    }
    
    // 2. Activity Filter
    const a = l.action || '';
    if (activityFilter === 'SALES' && !/^PAID|CASHOUT/.test(a)) return false;
    if (activityFilter === 'RETURNS' && !/^RETURN/.test(a)) return false;
    if (activityFilter === 'PRESCRIPTIONS' && !/^PRESCRIPTION/.test(a)) return false;
    if (activityFilter === 'SUBMITS' && !/^DAILY/.test(a)) return false;
    if (activityFilter === 'STOCK' && !/^STOCK/.test(a)) return false;
    
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const visible    = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats (on filtered data)
  const stats = filteredLogs.reduce((acc, l) => {
    const a = l.action || '';
    if (/^PAID|CASHOUT/.test(a)) acc.sales++;
    else if (/^RETURN/.test(a)) acc.returns++;
    else if (/^PRESCRIPTION/.test(a)) acc.prescriptions++;
    else if (/^STOCK/.test(a)) acc.stock++;
    else if (/^DAILY/.test(a)) acc.submits++;
    acc.total++;
    return acc;
  }, { total: 0, sales: 0, returns: 0, prescriptions: 0, stock: 0, submits: 0 });

  // ── Print New Tab HTML ──
  const handlePrintNewTab = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow pop-ups to print this report.');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pharmacy Worker Audit Log - Print</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #334155; }
            h1 { color: #1e1b4b; text-align: center; margin-bottom: 5px; }
            .meta { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 25px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; vertical-align: top; }
            th { background-color: #f8fafc; font-weight: 700; color: #1e293b; }
            .right { text-align: right; }
            .amt-pos { color: #059669; font-weight: bold; font-family: monospace; font-size: 13px; }
            .amt-neg { color: #dc2626; font-weight: bold; font-family: monospace; font-size: 13px; }
            .ref { font-weight: bold; }
            .action-label { font-weight: bold; color: #4f46e5; }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h1>Pharmacy Worker Audit Log</h1>
          <div class="meta">
            <strong>Printed:</strong> ${new Date().toLocaleString()} <br/>
            <strong>Time Period:</strong> ${timeFilter} &nbsp;|&nbsp; <strong>Activity Type:</strong> ${activityFilter} <br/>
            <strong>Total Records:</strong> ${filteredLogs.length}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 140px;">Date & Time</th>
                <th>Activity</th>
                <th>Worker / Branch</th>
                <th>Reference / Details</th>
                <th class="right">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => {
                const meta = getMeta(log.action);
                const isNeg = log.amount < 0;
                let ref = '';
                if (log.snapshot?.receipt_no) ref = log.snapshot.receipt_no;
                else if (log.snapshot?.reference_no) ref = log.snapshot.reference_no;
                
                return `
                  <tr>
                    <td style="white-space:nowrap;">${fmtDate(log.created_at)}</td>
                    <td class="action-label">${meta.label}</td>
                    <td>${log.worker_name || '—'}<br/><span style="color:#64748b;font-size:11px;">${log.branch_name || '—'}</span></td>
                    <td>
                      ${ref ? `<div class="ref">${ref}</div>` : ''}
                      ${log.recipient ? `<div style="margin-top:2px;">${log.recipient}</div>` : ''}
                    </td>
                    <td class="right ${isNeg ? 'amt-neg' : 'amt-pos'}">
                      ${log.amount != null ? fmt(log.amount) : '—'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  /* ── styles ── */
  const s = {
    page: { padding: '2rem', fontFamily: "'Inter','Segoe UI',sans-serif", background: 'linear-gradient(135deg,#f0f4ff 0%,#fafbff 100%)', minHeight: '100%' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 10 },
    dot: { width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'wdot 1.8s ease-in-out infinite' },
    title: { fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' },
    subtitle: { color: '#64748b', fontSize: 13.5, fontWeight: 500 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, margin: '1.5rem 0' },
    statCard: (col) => ({ background: '#fff', border: `1px solid ${col}30`, borderTop: `4px solid ${col}`, borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }),
    statLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 4 },
    statValue: (col) => ({ fontSize: '1.7rem', fontWeight: 900, color: col, lineHeight: 1 }),
    toolbar: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap' },
    searchWrap: { display: 'flex', flex: 1, maxWidth: 400, position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13.5, outline: 'none', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    searchBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: '#6366f1' },
    filterSelect: { padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13.5, outline: 'none', background: '#fff', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', color: '#334155' },
    printBtn: { padding: '10px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 2px 8px rgba(79,70,229,0.3)' },
    tableCard: { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8ecf3', overflow: 'hidden' },
    col: { padding: '12px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
    hcol: { background: '#1e1b4b', color: '#fff', padding: '12px 14px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.3px', textAlign: 'left', whiteSpace: 'nowrap' },
    expandBtn: (open) => ({ padding: '4px 12px', background: open ? '#4f46e5' : '#eef2ff', color: open ? '#fff' : '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }),
    detailPanel: (bg) => ({ background: bg || '#fafbff', borderLeft: '4px solid #6366f1', padding: '16px 20px 16px 28px' }),
    paginRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#fafbff' },
    pageBtn: (d) => ({ padding: '6px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: d ? '#f8fafc' : '#4f46e5', color: d ? '#94a3b8' : '#fff', cursor: d ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: d ? 0.5 : 1 }),
    empty: { textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: 14 },
    spinner: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: 12, color: '#6366f1' },
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes wdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}} @keyframes wspin{to{transform:rotate(360deg)}}`}</style>

      <div style={s.badge}><span style={s.dot} /> Pharmacy Worker Activity Log</div>
      <h1 style={s.title}>Audit Log</h1>
      <p style={s.subtitle}>Complete record of every sale, return, prescription, stock change and daily submission.</p>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Records',    value: stats.total,         color: '#6366f1' },
          { label: 'Sales Made',       value: stats.sales,         color: '#16a34a' },
          { label: 'Returns',          value: stats.returns,       color: '#ea580c' },
          { label: 'Prescriptions',    value: stats.prescriptions, color: '#d97706' },
          { label: 'Stock Movements',  value: stats.stock,         color: '#7c3aed' },
          { label: 'Daily Submits',    value: stats.submits,       color: '#0891b2' },
        ].map(({ label, value, color }) => (
          <div key={label} style={s.statCard(color)}>
            <div style={s.statLabel}>{label}</div>
            <div style={s.statValue(color)}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <input
            style={s.searchInput}
            placeholder="Search action, customer, drug…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button style={s.searchBtn} onClick={handleSearch}>🔍</button>
        </div>

        <select style={s.filterSelect} value={timeFilter} onChange={e => { setTimeFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Time</option>
          <option value="DAILY">Daily (Last 24h)</option>
          <option value="WEEKLY">Weekly (Last 7 Days)</option>
          <option value="MONTHLY">Monthly (Last 30 Days)</option>
          <option value="QUARTERLY">Quarterly (Last 90 Days)</option>
        </select>

        <select style={s.filterSelect} value={activityFilter} onChange={e => { setActivityFilter(e.target.value); setPage(1); }}>
          <option value="ALL">All Activities</option>
          <option value="SALES">Sales</option>
          <option value="RETURNS">Returns</option>
          <option value="PRESCRIPTIONS">Prescriptions</option>
          <option value="SUBMITS">Daily Submits</option>
          <option value="STOCK">Movement</option>
        </select>

        <button style={s.printBtn} onClick={handlePrintNewTab}>⬇ Print / Export</button>
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        {loading ? (
          <div style={s.spinner}>
            <div style={{ width: 34, height: 34, border: '3px solid #e0e7ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'wspin .8s linear infinite' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Loading activity…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.hcol}>#</th>
                    <th style={s.hcol}>Activity</th>
                    <th style={s.hcol}>Worker / Branch</th>
                    <th style={s.hcol}>Reference / Customer</th>
                    <th style={{ ...s.hcol, textAlign: 'right' }}>Amount (ETB)</th>
                    <th style={s.hcol}>Date & Time</th>
                    <th style={s.hcol}>Full Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} style={s.empty}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                      No activity records found for these filters.
                    </td></tr>
                  ) : visible.map((log, idx) => {
                    const meta = getMeta(log.action);
                    const isExp = expanded === log.id;
                    const rowIdx = (page - 1) * PAGE_SIZE + idx + 1;

                    return (
                      <React.Fragment key={log.id}>
                        <tr style={{ background: isExp ? meta.bg : (idx % 2 === 0 ? '#fff' : '#fafbff'), borderLeft: isExp ? `3px solid ${meta.border}` : '3px solid transparent' }}>
                          {/* # */}
                          <td style={{ ...s.col, color: '#94a3b8', fontSize: 12, width: 40 }}>{rowIdx}</td>
                          {/* action chip */}
                          <td style={s.col}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: meta.chip, color: meta.chipText }}>
                              {meta.label}
                            </span>
                          </td>
                          {/* worker / branch */}
                          <td style={s.col}>
                            <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: 13 }}>{log.worker_name || '—'}</div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{log.branch_name || '—'}</div>
                          </td>
                          {/* reference / customer */}
                          <td style={{ ...s.col, fontSize: 12.5, color: '#475569', maxWidth: 220 }}>
                            {log.snapshot?.receipt_no
                              ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>{log.snapshot.receipt_no}</span>
                              : log.snapshot?.reference_no
                              ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d97706' }}>{log.snapshot.reference_no}</span>
                              : null}
                            {log.recipient
                              ? <div style={{ marginTop: 2, color: '#64748b' }}>{log.recipient}</div>
                              : null}
                          </td>
                          {/* amount */}
                          <td style={{ ...s.col, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: log.amount < 0 ? '#dc2626' : '#059669', fontSize: 13.5 }}>
                            {log.amount != null ? fmt(log.amount) : '—'}
                          </td>
                          {/* date */}
                          <td style={{ ...s.col, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                            {fmtDate(log.created_at)}
                          </td>
                          {/* expand */}
                          <td style={s.col}>
                            <button style={s.expandBtn(isExp)} onClick={() => setExpanded(isExp ? null : log.id)}>
                              {isExp ? '▲ Hide' : '▼ Details'}
                            </button>
                          </td>
                        </tr>

                        {/* ── Detail panel ── */}
                        {isExp && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <div style={s.detailPanel(meta.bg)}>
                                {/^PAID|CASHOUT|RETURN/.test(log.action) && <SaleSnapshot snap={log.snapshot} />}
                                {/^PRESCRIPTION/.test(log.action) && <PrescriptionSnapshot snap={log.snapshot} />}
                                {/^STOCK/.test(log.action) && <StockSnapshot snap={log.snapshot} />}
                                {/^DAILY/.test(log.action) && <DailySubmitSnapshot snap={log.snapshot} />}
                                {!log.snapshot && (
                                  <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>
                                    No extra details recorded for this activity.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={s.paginRow}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Page {page} of {totalPages} &nbsp;·&nbsp; {filteredLogs.length} total records
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.pageBtn(page === 1)} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button style={s.pageBtn(page >= totalPages)} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
