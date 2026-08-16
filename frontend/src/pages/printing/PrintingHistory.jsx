import React, { useState, useEffect } from 'react';
import { Archive, Search, RefreshCw, CheckCircle2, Printer } from 'lucide-react';
import axios from 'axios';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { StageStyles } from './printingStageStyles';

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
          <div class="data-cell"><div class="label">VAT Amount</div><div class="value">ETB ${parseFloat(order.vat_amount || 0).toLocaleString()}</div></div>
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
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh + 48px)' }}>
      <StageStyles />
      <div style={{ width: '100%', margin: '0 auto', maxWidth: 1400 }}>

        {/* ── Header ── */}
        <div className="stg-head">
          <h1 className="stg-title">
            <CheckCircle2 style={{ color: 'var(--success)' }} />
            Delivered Jobs History
          </h1>
          <p className="stg-sub">{total} records found</p>
        </div>

        {/* ── Toolbar: filter / search / actions ── */}
        <div className="stg-toolbar">
          <div className="stg-field" style={{ minWidth: 170 }}>
            <span className="stg-label">Time Range</span>
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
              className="stg-select"
            >
              {TIME_FILTERS.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="stg-search">
            <Search />
            <label className="stg-label" htmlFor="stg-history-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search history</label>
            <input
              id="stg-history-search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order number or customer name..."
              className="stg-input"
            />
          </div>

          <button onClick={handlePrint} className="stg-btn stg-btn--ghost">
            <Printer /> Print
          </button>
          <button onClick={fetchOrders} className="stg-btn stg-btn--primary">
            <RefreshCw /> Refresh
          </button>
        </div>

        {/* ── Records ── */}
        <div>
          {loading ? (
            <div className="stg-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <SegmentedSpinner size={40} />
              <p style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: 15, marginTop: 4 }}>Loading history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="stg-card" style={{ textAlign: 'center', padding: '80px 20px' }}>
              <Archive size={48} style={{ opacity: 0.3, marginBottom: 16, color: 'var(--text-3)' }} />
              <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-1)', margin: 0 }}>No history records found.</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id} className="stg-card" style={{ marginBottom: 16, animationDelay: `${idx * 0.05}s` }}>
                {/* Order # + Status */}
                <div className="stg-record-head">
                  <div>
                    <div className="stg-detail-label">Order Number</div>
                    <div className="stg-record-id">{order.order_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stg-detail-label">Status</div>
                    <span className="stg-pill stg-pill--success" style={{ marginTop: 6 }}>
                      {order.status_name || order.status_code || 'DELIVERED'}
                    </span>
                  </div>
                </div>

                {/* Detail Grid */}
                <div className="stg-detail-grid">
                  {[
                    ['Customer Name',  order.customer_name  || '—'],
                    ['Customer Phone', order.customer_phone || '—'],
                    ['Product Type',   order.product_type   || '—'],
                    ['Quantity',       (order.quantity || 0).toLocaleString()],
                    ['Paper / Pages',  `${order.paper_type || '—'} · ${order.pages_per_copy || '—'} pgs`],
                    ['Color / Binding',`${order.color_printing ? 'Color' : 'B&W'} · ${order.binding_type || 'None'}`],
                    ['Total Price',    `ETB ${parseFloat(order.total_price || 0).toLocaleString()}`],
                    ['VAT Amount',     `ETB ${parseFloat(order.vat_amount || 0).toLocaleString()}`],
                    ['Completed Date', order.completed_at ? new Date(order.completed_at).toLocaleString() : order.due_date ? new Date(order.due_date).toLocaleDateString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="stg-detail-label">{label}</div>
                      <p className="stg-detail-value">{val}</p>
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <div className="stg-note-box">
                    <div className="stg-note-label">Special Instructions</div>
                    <p className="stg-note-text">{order.special_instructions}</p>
                  </div>
                )}

                {order.attachments && Array.isArray(order.attachments) && order.attachments.length > 0 && (
                  <div className="stg-note-box stg-note-box--info">
                    <div className="stg-note-label">Ready Files / Attachments</div>
                    <div className="stg-file-chips">
                      {order.attachments.map((file, i) => (
                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="stg-file-chip">
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
          <div className="stg-pager">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="stg-btn stg-btn--ghost">
              ← Previous
            </button>
            <div className="stg-pager-page">
              Page {page} of {Math.ceil(total / 100)}
            </div>
            <button disabled={page >= Math.ceil(total / 100)} onClick={() => setPage(p => p + 1)} className="stg-btn stg-btn--ghost">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingHistory;
