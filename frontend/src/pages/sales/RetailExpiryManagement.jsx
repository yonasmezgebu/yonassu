import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, RefreshCw, Loader2, Search, CheckCircle,
  XCircle, Clock, Package, Printer, FileText
} from 'lucide-react';
import salesService from '../../services/salesService';
import apiClient from '../../services/apiClient';

/* ── Palette ─────────────────────────────────────────── */
const MINT   = '#E0FDF0';   // light mint green
const CREAM  = '#FDF9CC';   // pale yellow-cream
const DARK   = '#1A3025';   // deep forest green (text / borders)
const MID    = '#2D5440';   // medium green (header bg)
const ACCENT = '#5BAD7F';   // vibrant green (highlights)
const GOLD   = '#8BC34A';
const GOLD2  = '#6B8E23';

const LOOK_AHEAD_DAYS = 90;

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now  = new Date();
  const then = new Date(dateStr);
  return Math.ceil((then - now) / (1000 * 60 * 60 * 24));
};

const statusBadge = (days) => {
  if (days === null)   return { bg: '#f1f5f9',  color: '#64748b',  label: 'Unknown'       };
  if (days < 0)        return { bg: '#fee2e2',  color: '#991b1b',  label: 'Expired'       };
  if (days <= 7)       return { bg: '#fef2f2',  color: '#dc2626',  label: 'Critical'      };
  if (days <= 30)      return { bg: '#fffbeb',  color: '#92400e',  label: 'Warning'       };
  return               { bg: MINT,             color: DARK,       label: 'Expiring Soon' };
};

/* ── Component ───────────────────────────────────────── */
const RetailExpiryManagement = () => {
  const [searchParams]   = useSearchParams();
  const [products,  setProducts]     = useState([]);
  const [loading,   setLoading]      = useState(true);
  const [error,     setError]        = useState('');
  const [search,    setSearch]       = useState('');
  const [filterMode,setFilterMode]   = useState(searchParams.get('filter') || '');
  const [msg,       setMsg]          = useState({ type: '', text: '' });
  const [spinning,  setSpinning]     = useState(false);

  const [reportForm,    setReportForm]    = useState(null);
  const [reportQty,     setReportQty]     = useState('');
  const [reportAction,  setReportAction]  = useState('Dispose');
  const [reportNotes,   setReportNotes]   = useState('');
  const [reportSaving,  setReportSaving]  = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  /* ── data ── */
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await salesService.getRetailProducts({ limit: 1000 });
      let list = Array.isArray(raw) ? raw : raw?.data?.products || raw?.data || [];
      list = list.filter(p => p.expiry_date || p.expiry);
      list.sort((a, b) => new Date(a.expiry_date || a.expiry) - new Date(b.expiry_date || b.expiry));
      setProducts(list);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = () => { setSpinning(true); loadData(); };

  /* ── filter ── */
  const today    = new Date();
  const filtered = products.filter(p => {
    const expiry = new Date(p.expiry_date || p.expiry);
    const diff   = Math.ceil((expiry - today) / (1000 * 86400));
    if (filterMode === 'expiring' && (diff > 30 || diff < 0)) return false;
    return diff <= LOOK_AHEAD_DAYS;
  });
  const searched = filtered.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.name || '').toLowerCase().includes(q)
      || (p.batch_number || p.batch || '').toLowerCase().includes(q)
      || (p.branch_name  || p.branch  || '').toLowerCase().includes(q);
  });

  /* ── report form ── */
  const openReportForm = (product) => {
    setReportForm(product);
    setReportQty(product.stock_quantity || 1);
    setReportAction('Dispose');
    setReportNotes('');
    setReportSuccess(false);
  };

  const submitReport = async () => {
    if (!reportForm || !reportQty) return;
    setReportSaving(true);
    try {
      await apiClient.post('/sales/expired-products', {
        product_id:         reportForm.id,
        product_name:       reportForm.name,
        quantity:        parseInt(reportQty),
        expiry_date:     reportForm.expiry_date || reportForm.expiry,
        action_required: reportAction,
        notes:           reportNotes,
      });
      setReportSuccess(true);
      setMsg({ type: 'success', text: 'Expired product report submitted to CEO' });
      setTimeout(() => { setReportForm(null); loadData(); }, 1500);
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || e.message || 'Failed to submit report' });
    } finally {
      setReportSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const handlePrint = (product) => {
    const w = window.open('', '_blank');
    const expiry = product.expiry_date || product.expiry || 'N/A';
    w.document.write(`<!DOCTYPE html><html><head><title>Expiry Report</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;}</style>
    </head><body>
    <h1>EXPIRY REPORT</h1>
    <p><strong>product:</strong> ${product.name} &nbsp;&nbsp; <strong>Batch:</strong> ${product.batch_number || product.batch || 'N/A'}</p>
    <p><strong>Expiry Date:</strong> ${expiry} &nbsp;&nbsp; <strong>Quantity:</strong> ${product.stock_quantity || 0}</p>
    <p><strong>Branch:</strong> ${product.branch_name || product.branch || 'N/A'} &nbsp;&nbsp; <strong>Days Remaining:</strong> ${daysUntil(expiry)}</p>
    <p><strong>Reported By:</strong> Sales Manager &nbsp;&nbsp; <strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
    <div class="stamp"><p>Manager Stamp Area</p><p style="margin-top:40px;">______________________</p><p>CEO Approval: ______________________</p></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  /* ── helpers ── */
  const thStyle = {
    padding: '14px 18px', textAlign: 'left', fontWeight: 900,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em',
    color: MINT, background: DARK, borderBottom: `3px solid ${ACCENT}`,
    whiteSpace: 'nowrap',
  };
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 900,
    color: DARK, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const inputStyle = {
    width: '100%', padding: '11px 16px', border: `3px solid ${DARK}`,
    borderRadius: 0, fontSize: 13, fontWeight: 700, color: DARK,
    background: 'white', outline: 'none', boxSizing: 'border-box',
    boxShadow: `3px 3px 0 ${DARK}`,
  };

  /* ══════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 0, margin: 0, minHeight: '100vh', width: '100%', background: MINT, fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes spin    { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

        @keyframes blink3D {
          0%,100%{ opacity:1;  transform:perspective(400px) rotateY(0deg) scale(1); }
          50%    { opacity:0.5; transform:perspective(400px) rotateY(180deg) scale(1.15); }
        }
        @keyframes rowIn3D {
          from{ opacity:0; transform:perspective(900px) rotateX(-55deg) translateY(-18px); }
          to  { opacity:1; transform:perspective(900px) rotateX(0deg)   translateY(0);     }
        }
        @keyframes iconPop {
          0%,100%{ transform:scale(1) rotateZ(0deg); }
          50%    { transform:scale(1.25) rotateZ(12deg); }
        }

        /* Button 3-D lift */
        .btn3d {
          transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
        }
        .btn3d:hover {
          transform: perspective(500px) translateZ(10px) translateY(-3px) rotateX(6deg) !important;
          box-shadow: 0 9px 0 ${GOLD2}, 0 12px 18px rgba(0,0,0,.22) !important;
        }
        .btn3d:active {
          transform: perspective(500px) translateZ(0) translateY(5px) rotateX(0deg) !important;
          box-shadow: 0 0 0 ${GOLD2} !important;
        }

        /* Row 3-D hover */
        .row3d {
          transition: transform .22s ease, box-shadow .22s ease;
          transform-style: preserve-3d;
        }
        .row3d:hover {
          transform: perspective(900px) scale(1.005) translateZ(6px);
          box-shadow: 0 8px 18px rgba(0,0,0,.12);
          z-index: 5;
          position: relative;
        }

        .icon3d { animation: blink3D 3.2s ease-in-out infinite; display:inline-block; }
        .iconPop { animation: iconPop 2.5s ease-in-out infinite; display:inline-block; }
      `}</style>

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 24px', borderRadius: 0,
          background: msg.type === 'success' ? MINT : '#fef2f2',
          border: `3px solid ${msg.type === 'success' ? DARK : '#991b1b'}`,
          color: msg.type === 'success' ? DARK : '#991b1b',
          fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `4px 4px 0 ${msg.type === 'success' ? DARK : '#991b1b'}`,
          animation: 'fadeSlide .3s ease-out'
        }}>
          <span className="icon3d">
            {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </span>
          {msg.text}
        </div>
      )}

      {/* ══ HEADER BAR ══════════════════════════════════════════ */}
      <div style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: '0 24px', animation: 'fadeUp .3s ease' }}>
        {/* shimmer strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},${CREAM},${MINT},${ACCENT})`, backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>

          {/* Left – icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon3d" style={{
              width: 48, height: 48, background: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${MINT}`, boxShadow: `4px 4px 0 ${MINT}`
            }}>
              <Clock size={24} color={DARK} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: CREAM, margin: 0, lineHeight: 1.1 }}>
                Expiry Management
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: ACCENT }}>
                Monitor • Report • Dispose
              </p>
            </div>
          </div>

          {/* Centre – blinking stat pills */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { icon: <AlertTriangle size={13}/>, label: 'EXPIRY WATCH', color: '#f59e0b' },
              { icon: <Package size={13}/>,       label: `${searched.length} ITEMS`, color: MINT  },
            ].map((p, i) => (
              <div key={i} className="icon3d" style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.12)', color: p.color,
                fontSize: 10, fontWeight: 800, letterSpacing: '1.5px',
              }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>

          {/* Right – single Refresh */}
          <button
            onClick={handleRefresh}
            className="btn3d"
            style={{
              background: CREAM, color: DARK, border: `3px solid ${DARK}`,
              padding: '10px 22px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
              boxShadow: `4px 4px 0 ${DARK}`, display: 'inline-flex',
              alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1.5px',
            }}
          >
            <RefreshCw size={17} style={spinning ? { animation: 'spin .7s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════ */}
      <div style={{ padding: '24px', animation: 'fadeUp .4s ease' }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: `3px solid #dc2626`, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `4px 4px 0 #dc2626` }}>
            <span className="icon3d"><XCircle size={20} color="#dc2626" /></span>
            <span style={{ color: '#991b1b', fontWeight: 700, flex: 1 }}>{error}</span>
            <button onClick={loadData} className="btn3d" style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: `3px solid #991b1b`, fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: `3px 3px 0 #991b1b` }}>Retry</button>
          </div>
        )}

        {/* Filter pill */}
        {filterMode === 'expiring' && (
          <div style={{ background: CREAM, border: `3px solid ${DARK}`, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 800, color: DARK, boxShadow: `4px 4px 0 ${DARK}` }}>
            <span className="iconPop"><Clock size={16} /></span>
            Showing items expiring within 30 days only
            <span style={{ marginLeft: 'auto', cursor: 'pointer', color: ACCENT, fontWeight: 900, textDecoration: 'underline' }}
              onClick={() => { setFilterMode(''); window.history.replaceState({}, '', '/sales/expiry-management'); }}>
              Clear filter
            </span>
          </div>
        )}

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={17} color={DARK} style={{ position: 'absolute', left: 14, top: 13, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by product, batch, branch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 44 }}
            />
          </div>
        </div>

        {/* Main table card */}
        <div style={{ background: CREAM, border: `3px solid ${DARK}`, overflow: 'hidden', boxShadow: `6px 6px 0 ${DARK}`, animation: 'fadeSlide .5s ease-out' }}>

          {/* Table header bar */}
          <div style={{ padding: '18px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DARK }}>
            <span style={{ fontWeight: 900, color: CREAM, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="icon3d"><AlertTriangle size={18} color="#f59e0b" /></span>
              Expiring &amp; Expired Products
            </span>
            <span style={{ fontSize: 12, color: DARK, background: MINT, padding: '4px 12px', fontWeight: 900 }}>
              {loading
                ? <><Loader2 size={13} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: 6 }} />LOADING...</>
                : `${searched.length} ITEMS`}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>product Name</th>
                  <th style={thStyle}>Batch</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Days Left</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '70px 24px', textAlign: 'center' }}>
                    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: DARK }} />
                    <p style={{ color: DARK, margin: '14px 0 0', fontWeight: 800, textTransform: 'uppercase' }}>Loading products…</p>
                  </td></tr>
                ) : searched.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '70px 24px', textAlign: 'center', color: DARK }}>
                    <span className="iconPop" style={{ fontSize: 40, display: 'block', marginBottom: 14 }}>📦</span>
                    <p style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px', textTransform: 'uppercase' }}>No expiring products found</p>
                    <p style={{ fontSize: 13, margin: 0, fontWeight: 700 }}>All products are within safe expiry windows.</p>
                  </td></tr>
                ) : searched.map((p, idx) => {
                  const expiry = p.expiry_date || p.expiry;
                  const days   = daysUntil(expiry);
                  const badge  = statusBadge(days);
                  const rowBg  = idx % 2 === 0 ? CREAM : MINT;
                  return (
                    <tr
                      key={p.id || idx}
                      className="row3d"
                      style={{ borderBottom: `2px solid ${DARK}`, background: rowBg, animation: `rowIn3D .35s ease-out ${idx * 0.03}s both` }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 900, color: DARK, fontSize: 14 }}>{p.name}</td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: MID, fontSize: 13, fontWeight: 700 }}>{p.batch_number || p.batch || '-'}</td>
                      <td style={{ padding: '14px 18px', color: days < 0 ? '#dc2626' : DARK, fontWeight: days < 0 ? 900 : 700 }}>
                        {expiry ? new Date(expiry).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 900, color: days < 0 ? '#dc2626' : days <= 7 ? '#f59e0b' : DARK }}>
                        {days !== null ? (days < 0 ? `${Math.abs(days)}d OVERDUE` : `${days}d`) : '-'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 900, color: DARK, fontSize: 15 }}>{p.stock_quantity || 0}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 11, fontWeight: 900, border: `2px solid ${badge.color}`, background: badge.bg, color: badge.color, textTransform: 'uppercase' }}>
                          <span className="icon3d">{days < 0 ? <XCircle size={12} /> : <Clock size={12} />}</span>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => openReportForm(p)}
                            className="btn3d"
                            style={{ padding: '7px 13px', background: GOLD, color: DARK, border: `3px solid ${GOLD2}`, fontSize: 11, cursor: 'pointer', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: `3px 3px 0 ${GOLD2}`, textTransform: 'uppercase' }}
                          >
                            <span className="icon3d"><FileText size={12} /></span> Report
                          </button>
                          <button
                            onClick={() => handlePrint(p)}
                            className="btn3d"
                            style={{ padding: '7px 13px', background: DARK, color: MINT, border: `3px solid ${MID}`, fontSize: 11, cursor: 'pointer', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: `3px 3px 0 ${MID}`, textTransform: 'uppercase' }}
                          >
                            <span className="icon3d"><Printer size={12} /></span> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ REPORT MODAL ════════════════════════════════════ */}
      {reportForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeSlide .2s ease-out' }}>
          <div style={{ background: CREAM, border: `4px solid ${DARK}`, padding: 36, width: 500, boxShadow: `10px 10px 0 ${DARK}`, maxHeight: '90vh', overflowY: 'auto' }}>
            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <span className="iconPop" style={{ display: 'inline-block', fontSize: 56, marginBottom: 12 }}>✅</span>
                <h3 style={{ color: DARK, margin: '0 0 8px', fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>Report Sent to CEO</h3>
                <p style={{ color: MID, margin: 0, fontSize: 14, fontWeight: 700 }}>CEO, Store Manager and Finance Manager have been notified simultaneously.</p>
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 6px', color: DARK, fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
                  <span className="icon3d"><FileText size={20} color="#dc2626" /></span> Report Expired product
                </h3>
                <p style={{ color: MID, margin: '0 0 20px', fontSize: 13, fontWeight: 700 }}>
                  product: <strong>{reportForm.name}</strong> — Expiry: {reportForm.expiry_date || reportForm.expiry} — Qty: {reportForm.stock_quantity || 0}
                </p>

                {/* Warning notice */}
                <div style={{ background: MINT, border: `3px solid ${DARK}`, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DARK, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `3px 3px 0 ${DARK}` }}>
                  <span className="iconPop"><AlertTriangle size={16} color="#f59e0b" /></span>
                  This will notify CEO, Store Manager, and Finance Manager simultaneously.
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Quantity to Report *</label>
                  <input
                    type="number" min={1} max={reportForm.stock_quantity || 999}
                    value={reportQty} onChange={e => setReportQty(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Action */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Action Required</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Dispose', 'Return', 'Write-off'].map(a => (
                      <label key={a} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', cursor: 'pointer', background: reportAction === a ? DARK : 'white', border: `3px solid ${DARK}`, transition: 'all .2s', fontSize: 12, fontWeight: 900, color: reportAction === a ? CREAM : DARK, textTransform: 'uppercase' }}>
                        <input type="radio" value={a} checked={reportAction === a} onChange={() => setReportAction(a)} style={{ accentColor: ACCENT }} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={reportNotes} onChange={e => setReportNotes(e.target.value)}
                    rows={3} placeholder="Describe action requested..."
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <button
                    onClick={submitReport}
                    disabled={!reportQty || reportSaving}
                    className={!reportQty || reportSaving ? '' : 'btn3d'}
                    style={{ flex: 1, padding: '14px', background: !reportQty || reportSaving ? '#e2e8f0' : GOLD, color: !reportQty || reportSaving ? '#94a3b8' : DARK, border: `3px solid ${!reportQty || reportSaving ? 'transparent' : GOLD2}`, fontWeight: 900, fontSize: 13, cursor: !reportQty || reportSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: !reportQty || reportSaving ? 'none' : `4px 4px 0 ${GOLD2}`, textTransform: 'uppercase' }}
                  >
                    {reportSaving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {reportSaving ? 'Submitting…' : <><span className="icon3d"><FileText size={16} /></span> Submit to CEO</>}
                  </button>
                  <button
                    onClick={() => setReportForm(null)}
                    className="btn3d"
                    style={{ flex: 1, padding: '14px', background: MINT, color: DARK, border: `3px solid ${DARK}`, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: `4px 4px 0 ${DARK}`, textTransform: 'uppercase' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailExpiryManagement;
