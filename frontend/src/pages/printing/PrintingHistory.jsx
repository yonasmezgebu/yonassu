import React, { useState, useEffect } from 'react';
import { Archive, Search, RefreshCw, CheckCircle2, Printer } from 'lucide-react';
import axios from 'axios';

const G = {
  forest:   '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf:     '#4CAF50', sage: '#A5D6A7', olive: '#6B8E23',
  mint:     '#98FF98', lime: '#8BC34A', brown: '#8D6E63',
  sky:      '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red: '#F44336',
};

const API = '/api/v1/printing';
const api = axios.create({ baseURL: '' });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const TIME_FILTERS = [
  { id: 'all',     label: 'All Time' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year',    label: 'This Year' },
];

const getTimeRange = (filter) => {
  const today = new Date();
  let start = new Date();
  if (filter === 'week') {
    start.setDate(today.getDate() - today.getDay());
  } else if (filter === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (filter === 'quarter') {
    const quarter = Math.floor(today.getMonth() / 3);
    start = new Date(today.getFullYear(), quarter * 3, 1);
  } else if (filter === 'year') {
    start = new Date(today.getFullYear(), 0, 1);
  } else {
    return { startDate: null, endDate: null };
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate:   today.toISOString().split('T')[0],
  };
};

/* ─── Build full standalone HTML for new-window print ─── */
const buildPrintHTML = (orders, filterLabel) => {
  const dateStr = new Date().toLocaleString();

  const rows = orders.map(order => {
    const completedDate = order.completed_at
      ? new Date(order.completed_at).toLocaleString()
      : order.due_date ? new Date(order.due_date).toLocaleDateString() : '—';

    const attHtml = order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0
      ? `<div class="section-box">
           <div class="section-label">Files / Attachments</div>
           <div>${order.attachments.map((f, i) => `<span class="file-tag">&#128206; ${f.filename || 'File ' + (i + 1)}</span>`).join(' ')}</div>
         </div>` : '';

    const instrHtml = order.special_instructions
      ? `<div class="section-box instructions">
           <div class="section-label">Special Instructions</div>
           <div>${order.special_instructions}</div>
         </div>` : '';

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="label">Order Number</div>
            <div class="order-number">${order.order_number}</div>
          </div>
          <div class="status-badge">&#10003; DELIVERED</div>
        </div>
        <div class="data-grid">
          <div class="data-cell"><div class="label">Customer Name</div><div class="value">${order.customer_name || '—'}</div></div>
          <div class="data-cell"><div class="label">Customer Phone</div><div class="value">${order.customer_phone || '—'}</div></div>
          <div class="data-cell"><div class="label">Product Type</div><div class="value">${order.product_type || '—'}</div></div>
          <div class="data-cell"><div class="label">Quantity</div><div class="value strong">${(order.quantity || 0).toLocaleString()}</div></div>
          <div class="data-cell"><div class="label">Paper / Pages</div><div class="value">${order.paper_type || '—'} · ${order.pages_per_copy || '—'} pgs</div></div>
          <div class="data-cell"><div class="label">Color / Binding</div><div class="value">${order.color_printing ? 'Color' : 'B&W'} · ${order.binding_type || 'None'}</div></div>
          <div class="data-cell"><div class="label">Total Price</div><div class="value strong">ETB ${parseFloat(order.total_price || 0).toLocaleString()}</div></div>
          <div class="data-cell"><div class="label">Completed Date</div><div class="value">${completedDate}</div></div>
        </div>
        ${instrHtml}
        ${attHtml}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Sutana — Delivered Jobs History</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;font-size:13px;padding:18mm 14mm;}
    .page-header{text-align:center;border-bottom:3px double #1B5E20;padding-bottom:10px;margin-bottom:18px;}
    .page-title{font-size:22pt;font-weight:900;color:#1B5E20;letter-spacing:1px;}
    .page-meta{font-size:10pt;color:#555;margin-top:4px;}
    .order-card{border:1px solid #bbb;border-bottom:4px solid #1B5E20;padding:14px 16px;margin-bottom:16px;page-break-inside:avoid;break-inside:avoid;}
    .order-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #ddd;}
    .label{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#555;margin-bottom:3px;}
    .order-number{font-size:18pt;font-weight:900;color:#1B5E20;}
    .status-badge{font-size:11pt;font-weight:800;border:2px solid #1B5E20;color:#1B5E20;padding:4px 14px;border-radius:20px;}
    .data-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 16px;background:#f7f7f7;border:1px solid #e0e0e0;padding:12px;margin-bottom:10px;}
    .value{font-size:12pt;font-weight:600;color:#111;margin-top:2px;}
    .value.strong{font-weight:800;color:#1B5E20;}
    .section-box{margin-top:8px;padding:10px 12px;border:1px dashed #aaa;background:#fafafa;}
    .section-box.instructions{border-color:#6B8E23;}
    .section-label{font-size:9pt;font-weight:800;text-transform:uppercase;color:#333;margin-bottom:4px;}
    .file-tag{display:inline-block;padding:3px 10px;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:4px;font-size:11pt;margin:2px 4px 2px 0;}
    .page-footer{text-align:center;margin-top:24px;padding-top:10px;border-top:1px solid #ccc;font-size:9pt;color:#888;}
    @media print{body{padding:10mm 10mm;}}
  </style>
</head>
<body>
  <div class="page-header">
    <div class="page-title">Sutana Printing &mdash; Delivered Jobs History</div>
    <div class="page-meta">Filter: ${filterLabel} &nbsp;|&nbsp; Printed: ${dateStr} &nbsp;|&nbsp; Total: ${orders.length} records</div>
  </div>
  ${rows || '<p style="text-align:center;color:#999;padding:40px 0;">No records found.</p>'}
  <div class="page-footer">Sutana Enterprise Management System &nbsp;&middot;&nbsp; Delivered Jobs Report &nbsp;&middot;&nbsp; ${dateStr}</div>
  <script>window.onload=function(){window.print();};<\/script>
</body>
</html>`;
};

/* ─── Component ─── */
const PrintingHistory = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getTimeRange(activeFilter);
      const params = { page, limit: 100, search, status: 'delivered' };
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await api.get(`${API}/orders`, { params });
      setOrders(data.data?.orders || []);
      setTotal(data.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [activeFilter, page, search]);

  /* Opens a brand-new clean window and auto-prints it */
  const handlePrint = () => {
    const filterLabel = TIME_FILTERS.find(f => f.id === activeFilter)?.label || 'All Time';
    const html = buildPrintHTML(orders, filterLabel);
    const win = window.open('', '_blank', 'width=1050,height=850');
    if (!win) { alert('Please allow pop-ups for this site to print.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: `linear-gradient(135deg, ${G.lightGray}, #E8F5E9)`, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:translateY(0); } }
        .btn-3d {
          background: linear-gradient(135deg, #2E8B57, #228B22);
          border: none; border-radius: 12px; padding: 10px 24px;
          color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px;
          font-weight: 800; font-size: 14px;
          box-shadow: 0 6px 0 #1B5E20, 0 10px 20px rgba(34,139,34,0.4);
          transition: all 0.1s; text-transform: uppercase; letter-spacing: 1px;
        }
        .btn-3d.secondary {
          background: linear-gradient(135deg, #424242, #1B5E20);
          box-shadow: 0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.3);
        }
        .btn-3d:active { transform: translateY(6px); box-shadow: 0 0 0 transparent; }
        .btn-3d:hover  { filter: brightness(1.1); }
      `}</style>

      <div style={{ width: '100%' }}>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${G.dark}, ${G.forest})`,
          borderRadius: 16, padding: '24px 30px', marginBottom: 20,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: `0 8px 24px ${G.dark}55`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Delivered Jobs History</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.8, fontWeight: 500 }}>{total} records found</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase' }}>Time:</span>
              <select
                value={activeFilter}
                onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none', outline: 'none',
                  background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', appearance: 'none',
                }}
              >
                {TIME_FILTERS.map(f => (
                  <option key={f.id} value={f.id} style={{ color: G.dark, fontWeight: 700 }}>{f.label}</option>
                ))}
              </select>
            </div>
            <button onClick={handlePrint} className="btn-3d secondary">
              <Printer size={16} /> Print
            </button>
            <button onClick={fetchOrders} className="btn-3d">
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, border: `2px solid ${G.sage}44`, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: G.olive }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search history by order number or customer name..."
              style={{
                width: '100%', padding: '12px 16px 12px 46px',
                border: `2px solid ${G.sage}`, borderRadius: 12, fontSize: 15, fontWeight: 500,
                outline: 'none', boxSizing: 'border-box', background: G.lightGray, color: G.dark,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = G.emerald)}
              onBlur={e  => (e.target.style.borderColor = G.sage)}
            />
          </div>
        </div>

        {/* ── Records ── */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 16 }}>
              <RefreshCw size={40} color={G.emerald} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ fontWeight: 700, color: G.olive, fontSize: 16 }}>Loading history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 16, color: G.olive }}>
              <Archive size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 18 }}>No history records found.</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id} style={{
                background: '#fff',
                borderBottom: `6px solid ${G.forest}`,
                padding: '24px 30px',
                marginBottom: 20,
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                animation: 'slideIn 0.3s ease',
                animationDelay: `${idx * 0.05}s`,
                animationFillMode: 'both',
              }}>
                {/* Order # + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order Number</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: G.dark }}>{order.order_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Status</div>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 800, background: `${G.dark}15`, color: G.dark, border: `2px solid ${G.dark}` }}>
                      {order.status_name || order.status_code || 'DELIVERED'}
                    </div>
                  </div>
                </div>

                {/* Detail Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px', background: G.lightGray, padding: 20, borderRadius: 12, border: `1px solid ${G.sage}66`, marginBottom: 0 }}>
                  {[
                    ['Customer Name',  order.customer_name  || '—'],
                    ['Customer Phone', order.customer_phone || '—'],
                    ['Product Type',   order.product_type   || '—'],
                    ['Quantity',       (order.quantity || 0).toLocaleString()],
                    ['Paper / Pages',  `${order.paper_type || '—'} · ${order.pages_per_copy || '—'} pgs`],
                    ['Color / Binding',`${order.color_printing ? 'Color' : 'B&W'} · ${order.binding_type || 'None'}`],
                    ['Total Price',    `ETB ${parseFloat(order.total_price || 0).toLocaleString()}`],
                    ['Completed Date', order.completed_at ? new Date(order.completed_at).toLocaleString() : order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontWeight: 700, color: G.darkGray, fontSize: 15 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <div style={{ marginTop: 16, background: `${G.sage}15`, padding: 16, borderRadius: 12, border: `1px dashed ${G.sage}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: G.forest, textTransform: 'uppercase', marginBottom: 6 }}>Special Instructions</div>
                    <div style={{ color: G.dark, fontWeight: 600, fontSize: 14 }}>{order.special_instructions}</div>
                  </div>
                )}

                {order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0 && (
                  <div style={{ marginTop: 16, padding: 16, background: `${G.sky}15`, borderRadius: 12, border: `1px solid ${G.sky}44` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: G.dark, textTransform: 'uppercase', marginBottom: 12 }}>Ready Files / Attachments</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {order.attachments.map((file, i) => (
                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                          background: '#fff', borderRadius: 8, border: `1px solid ${G.sky}66`,
                          color: G.dark, textDecoration: 'none', fontSize: 13, fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}>
                          📎 {file.filename || `File ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {total > 100 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, paddingBottom: 40 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '10px 20px', border: `2px solid ${G.sage}`, borderRadius: 10, cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff', fontWeight: 800, color: G.dark }}>
              ← Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 800, color: G.forest, background: '#fff', borderRadius: 10, border: `2px solid ${G.sage}44` }}>
              Page {page} of {Math.ceil(total / 100)}
            </div>
            <button disabled={page >= Math.ceil(total / 100)} onClick={() => setPage(p => p + 1)}
              style={{ padding: '10px 20px', border: `2px solid ${G.sage}`, borderRadius: 10, cursor: page >= Math.ceil(total / 100) ? 'not-allowed' : 'pointer', background: '#fff', fontWeight: 800, color: G.dark }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingHistory;
