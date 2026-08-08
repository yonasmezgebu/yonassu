import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../services/apiClient';
import { useAuth } from '../../../hooks/useAuth';
import {
  Search, RefreshCw, Car, Tractor, Calendar, FileText,
  Filter, ChevronLeft, ChevronRight, Clock, CheckCircle,
  XCircle, AlertCircle, Download, User, Phone, Mail
} from 'lucide-react';

/* ─── Color Tokens ───────────────────────────────────────────────────────── */
const C = {
  bg:        '#E8F4EC',
  surface:   '#FFFFFF',
  border:    '#C8E6C9',
  forest:    '#228B22',
  dark:      '#1B5E20',
  emerald:   '#2E8B57',
  leaf:      '#4CAF50',
  sage:      '#A5D6A7',
  text:      '#1B2A1B',
  textSec:   '#4A6741',
  orange:    '#E65100',
  red:       '#B71C1C',
  blue:      '#1565C0',
  purple:    '#4A148C',
};

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @keyframes rr-fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
    @keyframes rr-spin   { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }

    .rr-page { background:${C.bg}; min-height:100vh; padding:2rem; font-family:'Inter','Segoe UI',sans-serif; }

    .rr-header { animation:rr-fadeUp .35s ease; }
    .rr-title  { font-size:2rem; font-weight:900; color:${C.dark}; margin:0 0 4px 0;
                 text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 #fff,4px 4px 0 ${C.forest},5px 5px 12px rgba(0,0,0,.12); }
    .rr-sub    { font-size:.875rem; color:${C.textSec}; font-weight:600; text-transform:uppercase; letter-spacing:.1em; }

    .rr-stat-card { background:${C.surface}; border-radius:16px; padding:20px 24px;
                    box-shadow:0 2px 12px rgba(34,139,34,.1); border:1.5px solid ${C.border};
                    animation:rr-fadeUp .4s ease both; display:flex; flex-direction:column; gap:4px; }
    .rr-stat-card .label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:${C.textSec}; }
    .rr-stat-card .val   { font-size:2rem; font-weight:900; color:${C.dark}; line-height:1; }
    .rr-stat-card .icon  { width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:6px; }

    .rr-filter-bar { background:${C.surface}; border-radius:14px; padding:16px 20px;
                     border:1.5px solid ${C.border}; box-shadow:0 2px 8px rgba(34,139,34,.07);
                     display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; }
    .rr-filter-bar label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:${C.textSec}; display:block; margin-bottom:4px; }
    .rr-input  { padding:8px 12px; border-radius:9px; border:1.5px solid ${C.border};
                 font-size:13px; color:${C.text}; background:#F7FBF7; outline:none; min-width:130px;
                 transition:border-color .2s; font-family:inherit; }
    .rr-input:focus { border-color:${C.forest}; background:#fff; }
    .rr-search-wrap { position:relative; flex:1; min-width:200px; }
    .rr-search-wrap svg { position:absolute;left:10px;top:50%;transform:translateY(-50%);color:${C.textSec}; }
    .rr-search-wrap input { padding-left:34px; width:100%; box-sizing:border-box; }

    .rr-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;
              font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s; }
    .rr-btn-primary { background:${C.forest};color:#fff; }
    .rr-btn-primary:hover { background:${C.dark}; }
    .rr-btn-outline { background:#fff;color:${C.forest};border:1.5px solid ${C.forest}; }
    .rr-btn-outline:hover { background:${C.bg}; }

    .rr-table-wrap { background:${C.surface}; border-radius:16px; overflow:hidden;
                     border:1.5px solid ${C.border}; box-shadow:0 2px 12px rgba(34,139,34,.08); animation:rr-fadeUp .5s ease; }
    .rr-table { width:100%; border-collapse:collapse; font-size:13px; }
    .rr-table thead tr { background:linear-gradient(135deg,${C.dark},${C.forest}); }
    .rr-table thead th { color:#fff; padding:12px 14px; text-align:left; font-weight:700;
                         font-size:11px; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
    .rr-table tbody tr { border-bottom:1px solid #F0F7F0; transition:background .15s; }
    .rr-table tbody tr:hover { background:#F7FBF7; }
    .rr-table tbody td { padding:11px 14px; color:${C.text}; vertical-align:middle; }
    .rr-table tbody tr:last-child { border-bottom:none; }

    .rr-badge { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;
                font-size:11px;font-weight:700;white-space:nowrap; }

    .rr-pager { display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:1.5px solid ${C.border};
                justify-content:space-between;flex-wrap:wrap;background:#FAFDF8; }
    .rr-pager-info { font-size:12px;color:${C.textSec};font-weight:600; }
    .rr-pager-btns { display:flex;gap:6px; }
    .rr-page-btn { width:32px;height:32px;border-radius:8px;border:1.5px solid ${C.border};
                   background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;
                   color:${C.forest};font-weight:700;transition:all .15s; }
    .rr-page-btn:hover:not(:disabled) { background:${C.forest};color:#fff; }
    .rr-page-btn:disabled { opacity:.4;cursor:not-allowed; }

    .rr-empty { padding:60px 20px;text-align:center;color:${C.textSec}; }
    .rr-empty svg { margin-bottom:12px;opacity:.4; }
    .rr-spin { animation:rr-spin 1s linear infinite; display:inline-block; }

    .rr-type-car   { background:#EFF6FF;color:${C.blue};  border:1.5px solid #BFDBFE; }
    .rr-type-agri  { background:#ECFDF5;color:${C.dark};  border:1.5px solid #A7F3D0; }

    .rr-status-PENDING_APPROVAL,.rr-status-pending { background:#FFF3E0;color:${C.orange};border:1.5px solid #FFCC80; }
    .rr-status-APPROVED,.rr-status-approved,.rr-status-confirmed { background:#E8F5E9;color:#2E7D32;border:1.5px solid #A5D6A7; }
    .rr-status-ACTIVE,.rr-status-active { background:#E3F2FD;color:${C.blue};border:1.5px solid #90CAF9; }
    .rr-status-COMPLETED,.rr-status-completed { background:#F3E5F5;color:${C.purple};border:1.5px solid #CE93D8; }
    .rr-status-CANCELLED,.rr-status-cancelled,.rr-status-REJECTED,.rr-status-rejected { background:#FFEBEE;color:${C.red};border:1.5px solid #EF9A9A; }

    .rr-pay-Pending,.rr-pay-PENDING   { background:#FFF3E0;color:${C.orange};border:1.5px solid #FFCC80; }
    .rr-pay-Confirmed,.rr-pay-PAID    { background:#E8F5E9;color:#2E7D32;border:1.5px solid #A5D6A7; }
    .rr-pay-Rejected,.rr-pay-REJECTED { background:#FFEBEE;color:${C.red};border:1.5px solid #EF9A9A; }

    .rr-cancelled-flag { background:#FFF3CD;color:#7C5E00;border:1.5px solid #FFE082;font-size:10px; }

    @media(max-width:768px){
      .rr-page { padding:1rem; }
      .rr-table-wrap { overflow-x:auto; }
      .rr-stat-grid { grid-template-columns:1fr 1fr !important; }
    }
  `}</style>
);

/* ─── Status Badge ───────────────────────────────────────────────────────── */
const StatusBadge = ({ code, prefix = 'rr-status' }) => (
  <span className={`rr-badge ${prefix}-${code}`}>{(code || '—').replace(/_/g, ' ')}</span>
);

/* ─── Date formatting ────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const daysDiff = (from, to) => {
  if (!from || !to) return '—';
  try {
    const ms = new Date(to) - new Date(from);
    return Math.max(0, Math.round(ms / 86400000)) + 'd';
  } catch { return '—'; }
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const RentalReport = () => {
  const { user } = useAuth();

  /* State */
  const [carOrders,  setCarOrders]  = useState([]);
  const [agriOrders, setAgriOrders] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [spinning,   setSpinning]   = useState(false);

  const [filters, setFilters] = useState({
    assetType: '',      // '' | 'car' | 'agri'
    status: '',
    paymentStatus: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });

  const LIMIT = 30;

  /* ── Fetch ───────────────────────────────────────────────────────────────── */
  const load = useCallback(async (f) => {
    try {
      setLoading(true);

      const carParams  = { limit: 9999 };
      const agriParams = { limit: 9999 };

      if (f.status)        { carParams.status  = f.status;        agriParams.status        = f.status; }
      if (f.paymentStatus) { carParams.paymentStatus = f.paymentStatus; agriParams.paymentStatus = f.paymentStatus; }
      if (f.search)        { carParams.search  = f.search;        agriParams.search        = f.search; }

      const [carRes, agriRes] = await Promise.all([
        f.assetType === 'agri' ? Promise.resolve(null) : axios.get('/rental-orders',   { params: carParams }),
        f.assetType === 'car'  ? Promise.resolve(null) : axios.get('/agrirent-orders', { params: agriParams }),
      ]);

      let cars  = [];
      let agris = [];

      if (carRes) {
        const d = carRes.data ?? carRes;
        cars = (Array.isArray(d) ? d : d?.orders ?? d?.data ?? []).map(o => ({ ...o, _type: 'car' }));
      }
      if (agriRes) {
        const d = agriRes.data ?? agriRes;
        agris = (Array.isArray(d) ? d : d?.orders ?? d?.data ?? []).map(o => ({ ...o, _type: 'agri' }));
      }

      /* Date filter (client-side since API may not support it) */
      const filterByDate = (arr, dateField) => {
        return arr.filter(o => {
          const d = o[dateField];
          if (!d) return true;
          if (f.dateFrom && new Date(d) < new Date(f.dateFrom)) return false;
          if (f.dateTo   && new Date(d) > new Date(f.dateTo + 'T23:59:59')) return false;
          return true;
        });
      };

      cars  = filterByDate(cars,  'pickup_datetime');
      agris = filterByDate(agris, 'start_date');

      setCarOrders(cars);
      setAgriOrders(agris);
    } catch (err) {
      console.error('RentalReport load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, []);  // initial load

  /* ── Derived combined list ───────────────────────────────────────────────── */
  const combined = [...carOrders, ...agriOrders].sort((a, b) => {
    const da = new Date(a.created_at || 0);
    const db = new Date(b.created_at || 0);
    return db - da;
  });

  /* ── Paginate client-side ───────────────────────────────────────────────── */
  const totalRows  = combined.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / LIMIT));
  const page       = Math.min(filters.page, totalPages);
  const rows       = combined.slice((page - 1) * LIMIT, page * LIMIT);

  /* ── Summary stats ───────────────────────────────────────────────────────── */
  const stats = {
    total:    combined.length,
    cars:     carOrders.length,
    agri:     agriOrders.length,
    active:   combined.filter(o => ['ACTIVE','active'].includes(o.status)).length,
    completed: combined.filter(o => ['COMPLETED','completed'].includes(o.status)).length,
    cancelled: combined.filter(o => ['CANCELLED','cancelled','REJECTED','rejected'].includes(o.status)).length,
    payPending: combined.filter(o => ['Pending','PENDING'].includes(o.payment_status)).length,
  };

  /* ── Handlers ────────────────────────────────────────────────────────────── */
  const handleSearch = () => {
    const f = { ...filters, page: 1 };
    setFilters(f);
    load(f);
  };

  const handleRefresh = async () => {
    setSpinning(true);
    await load(filters);
    setTimeout(() => setSpinning(false), 600);
  };

  const handleFilterChange = (key, val) => {
    setFilters(p => ({ ...p, [key]: val, page: 1 }));
  };

  const handleApplyFilters = () => {
    const f = { ...filters, page: 1 };
    setFilters(f);
    load(f);
  };

  const exportCSV = () => {
    const headers = ['Type','Order No','Asset','Customer','Phone','Email','Driver','Pickup / Start','Return / End','Days','Status','Payment Status','Cancelled','Notes'];
    const rows2   = combined.map(o => {
      const isCar = o._type === 'car';
      return [
        isCar ? 'Car Rental' : 'Agri Equipment',
        o.order_number || o.id,
        isCar ? (o.car_name || o.car_make_model || '—') : (o.tractor_name || '—'),
        isCar ? (o.customer_name || o.renter_name || '—') : (o.customer_name || '—'),
        isCar ? (o.customer_phone || '—') : (o.customer_phone || '—'),
        isCar ? (o.customer_email || '—') : '—',
        isCar ? (o.driver_name || '—') : '—',
        fmt(isCar ? o.pickup_datetime : o.start_date),
        fmt(isCar ? o.return_datetime : o.end_date),
        isCar ? daysDiff(o.pickup_datetime, o.return_datetime) : daysDiff(o.start_date, o.end_date),
        o.status || '—',
        o.payment_status || '—',
        o.is_cancelled ? 'Yes' : 'No',
        o.notes || o.manager_note || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows2].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'rental_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="rr-page">
      <Styles />

      {/* Header */}
      <div className="rr-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="rr-title">📋 Rental Report</h1>
          <p className="rr-sub">Car &amp; Agri Equipment · Operational Booking Overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="rr-btn rr-btn-outline" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="rr-btn rr-btn-primary" onClick={handleRefresh} disabled={loading}>
            <SegmentedSpinner size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="rr-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Orders',   val: stats.total,      iconBg: '#E8F5E9', icon: <FileText size={18} color={C.forest} /> },
          { label: 'Car Rentals',    val: stats.cars,       iconBg: '#EFF6FF', icon: <Car      size={18} color={C.blue}   /> },
          { label: 'Agri Equipment', val: stats.agri,       iconBg: '#ECFDF5', icon: <Tractor  size={18} color={C.dark}   /> },
          { label: 'Active Now',     val: stats.active,     iconBg: '#E3F2FD', icon: <Calendar size={18} color={C.blue}   /> },
          { label: 'Pay Pending',    val: stats.payPending, iconBg: '#FFF3E0', icon: <Clock    size={18} color={C.orange} /> },
        ].map((s, i) => (
          <div key={i} className="rr-stat-card" style={{ animationDelay: `${i * .06}s` }}>
            <div className="icon" style={{ background: s.iconBg }}>{s.icon}</div>
            <div className="label">{s.label}</div>
            <div className="val">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rr-filter-bar" style={{ marginBottom: '1.25rem' }}>
        {/* Search */}
        <div className="rr-search-wrap" style={{ flexBasis: 220 }}>
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.textSec }} />
            <input
              className="rr-input"
              style={{ paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
              placeholder="Order #, customer…"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        {/* Asset Type */}
        <div>
          <label>Asset Type</label>
          <select className="rr-input" value={filters.assetType} onChange={e => handleFilterChange('assetType', e.target.value)}>
            <option value="">All Types</option>
            <option value="car">Car Rental</option>
            <option value="agri">Agri Equipment</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label>Status</label>
          <select className="rr-input" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="pending">Agri Pending</option>
            <option value="active">Agri Active</option>
            <option value="completed">Agri Completed</option>
            <option value="cancelled">Agri Cancelled</option>
          </select>
        </div>

        {/* Payment */}
        <div>
          <label>Payment</label>
          <select className="rr-input" value={filters.paymentStatus} onChange={e => handleFilterChange('paymentStatus', e.target.value)}>
            <option value="">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label>From Date</label>
          <input type="date" className="rr-input" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
        </div>

        {/* Date To */}
        <div>
          <label>To Date</label>
          <input type="date" className="rr-input" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} />
        </div>

        <button className="rr-btn rr-btn-primary" style={{ marginTop: 18 }} onClick={handleApplyFilters}>
          <Filter size={13} /> Apply
        </button>
      </div>

      {/* Table */}
      <div className="rr-table-wrap">
        <table className="rr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Order No.</th>
              <th>Asset</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Driver</th>
              <th>Start / Pickup</th>
              <th>Return / End</th>
              <th>Days</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="rr-empty">
                <SegmentedSpinner size={28} /><br />Loading orders…
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={13} className="rr-empty">
                <FileText size={40} /><br />
                <strong>No orders found</strong><br />
                <span style={{ fontSize: 12 }}>Try adjusting the filters above.</span>
              </td></tr>
            ) : rows.map((o, idx) => {
              const isCar   = o._type === 'car';
              const assetNm = isCar ? (o.car_name || o.car_make_model || o.car_plate || '—') : (o.tractor_name || o.equipment_type || '—');
              const custNm  = o.customer_name || o.renter_name || '—';
              const phone   = o.customer_phone || '—';
              const email   = isCar ? (o.customer_email || '—') : '—';
              const driver  = isCar ? (o.driver_name || '—') : '—';
              const start   = fmt(isCar ? o.pickup_datetime : o.start_date);
              const end     = fmt(isCar ? o.return_datetime : o.end_date);
              const days    = isCar ? daysDiff(o.pickup_datetime, o.return_datetime) : daysDiff(o.start_date, o.end_date);
              const isCancelled = o.is_cancelled || o.status === 'CANCELLED' || o.status === 'cancelled';

              return (
                <tr key={`${o._type}-${o.id}`} style={{ animationDelay: `${idx * .02}s` }}>
                  <td style={{ color: C.textSec, fontSize: 11, fontWeight: 700 }}>{(page - 1) * LIMIT + idx + 1}</td>
                  <td>
                    <span className={`rr-badge ${isCar ? 'rr-type-car' : 'rr-type-agri'}`}>
                      {isCar ? <Car size={11} /> : <Tractor size={11} />}
                      &nbsp;{isCar ? 'Car' : 'Agri'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{o.order_number || `#${o.id}`}</td>
                  <td style={{ fontWeight: 600 }}>{assetNm}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{custNm}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {phone !== '—' && <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11 }}><Phone size={10} color={C.textSec} />{phone}</span>}
                      {email !== '—' && <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11 }}><Mail  size={10} color={C.textSec} />{email}</span>}
                      {phone === '—' && email === '—' && <span style={{ color: C.textSec, fontSize: 11 }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: driver === '—' ? C.textSec : C.text }}>{driver}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{start}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{end}</td>
                  <td style={{ fontWeight: 700, color: C.forest }}>{days}</td>
                  <td><StatusBadge code={o.status || 'unknown'} /></td>
                  <td><span className={`rr-badge rr-pay-${o.payment_status || 'Pending'}`}>{o.payment_status || 'Pending'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {isCancelled && <span className="rr-badge rr-cancelled-flag">Cancelled</span>}
                      {o.notes && <span title={o.notes} style={{ cursor:'help',fontSize:11,color:C.textSec }}>📝</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="rr-pager">
          <span className="rr-pager-info">
            Showing {rows.length > 0 ? (page - 1) * LIMIT + 1 : 0}–{Math.min(page * LIMIT, totalRows)} of {totalRows} orders
            &nbsp;·&nbsp; {stats.cars} car, {stats.agri} agri
          </span>
          <div className="rr-pager-btns">
            <button className="rr-page-btn" disabled={page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
              <ChevronLeft size={14} />
            </button>
            <button className="rr-page-btn" style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} disabled>
              {page} / {totalPages}
            </button>
            <button className="rr-page-btn" disabled={page >= totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalReport;
