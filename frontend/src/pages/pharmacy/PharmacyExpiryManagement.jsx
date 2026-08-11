import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Search, CheckCircle,
  XCircle, Clock, Package, Printer, FileText
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

const LOOK_AHEAD_DAYS = 90;

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now  = new Date();
  const then = new Date(dateStr);
  return Math.ceil((then - now) / (1000 * 60 * 60 * 24));
};

const statusBadge = (days) => {
  if (days === null) return { bg: '#F1F5F9', color: '#64748B', label: 'Unknown' };
  if (days < 0)      return { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  label: 'Expired'       };
  if (days <= 7)     return { bg: '#FFF1F2',                 color: '#BE123C',              label: 'Critical'      };
  if (days <= 30)    return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Warning'       };
  return               { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Expiring Soon' };
};

/* ── Component ───────────────────────────────────────── */
const PharmacyExpiryManagement = () => {
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
      const raw = await pharmacyService.getAllProducts();
      let list = Array.isArray(raw) ? raw : raw?.data || [];
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
      await apiClient.post('/pharmacy/expired-drugs', {
        drug_id:         reportForm.id,
        drug_name:       reportForm.name,
        quantity:        parseInt(reportQty),
        expiry_date:     reportForm.expiry_date || reportForm.expiry,
        action_required: reportAction,
        notes:           reportNotes,
      });
      setReportSuccess(true);
      setMsg({ type: 'success', text: 'Expired drug report submitted to CEO' });
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
    <style>body{font-family:Inter,Arial,sans-serif;padding:40px;color:#111827;}.stamp{margin-top:60px;border-top:2px solid #000;padding-top:10px;width:200px;text-align:center;} h1{font-size:22px;margin-bottom:20px;} table{width:100%;border-collapse:collapse;margin-bottom:24px;} td,th{padding:10px 14px;border:1px solid #E5E7EB;font-size:13px;} th{background:#F9FAFB;font-weight:600;text-transform:uppercase;font-size:11px;}</style>
    </head><body>
    <h1>EXPIRY REPORT</h1>
    <table><tbody>
      <tr><th>Drug</th><td>${product.name}</td><th>Batch</th><td>${product.batch_number || product.batch || 'N/A'}</td></tr>
      <tr><th>Expiry Date</th><td>${expiry}</td><th>Quantity</th><td>${product.stock_quantity || 0}</td></tr>
      <tr><th>Branch</th><td>${product.branch_name || product.branch || 'N/A'}</td><th>Days Remaining</th><td>${daysUntil(expiry)}</td></tr>
      <tr><th>Reported By</th><td>Pharmacy Manager</td><th>Report Date</th><td>${new Date().toISOString().split('T')[0]}</td></tr>
    </tbody></table>
    <div class="stamp"><p>Manager Stamp</p><p style="margin-top:40px;">______________________</p><p>CEO Approval: ______________________</p></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="pso-root">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .exp-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: var(--color-bg-card);
          border-left: 4px solid var(--color-success);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 14px 20px; min-width: 280px;
          animation: slideIn .2s ease;
          display: flex; gap: 12px; align-items: center;
          font-size: 14px; font-weight: 500;
          color: var(--color-text-primary);
        }
        .exp-toast.error { border-left-color: var(--color-danger); }

        /* Report modal action radio cards */
        .action-radio {
          flex: 1; display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; cursor: pointer;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg-page);
          font-size: 13px; font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition);
        }
        .action-radio:hover { border-color: var(--color-primary); }
        .action-radio.active {
          background: var(--color-info-bg);
          border-color: var(--color-info);
          color: var(--color-info);
          font-weight: 600;
        }
        .action-radio input { accent-color: var(--color-primary); }

        /* Expiry table row */
        .exp-row { transition: background var(--transition); }
        .exp-row:hover { background: var(--color-bg-page) !important; }
      `}</style>

      {/* Toast notification */}
      {msg.text && (
        <div className={`exp-toast ${msg.type === 'error' ? 'error' : ''}`}>
          {msg.type === 'success'
            ? <CheckCircle size={18} color="var(--color-success)" />
            : <XCircle size={18} color="var(--color-danger)" />}
          <span style={{ flex: 1 }}>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Clock size={20} />
          </div>
          <div>
            <h1 className="pso-title">Expiry Management</h1>
            <p className="pso-subtitle">Monitor · Report · Dispose</p>
          </div>
        </div>
        <div className="pso-header-right">
          {/* Live counts */}
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pso-badge" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <AlertTriangle size={12} /> Expiry Watch
            </span>
            <span className="pso-badge">
              <Package size={12} /> {loading ? '…' : searched.length} Items
            </span>
          </div>
          <button onClick={handleRefresh} className="pso-btn-refresh" disabled={spinning || loading}>
            <SegmentedSpinner size={15} spinning={spinning || loading} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="pso-content">
        <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

          {/* Error banner */}
          {error && (
            <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <XCircle size={16} /> {error}
              <button onClick={loadData} className="btn-secondary" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12 }}>Retry</button>
            </div>
          )}

          {/* Active filter pill */}
          {filterMode === 'expiring' && (
            <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--color-warning)', fontWeight: 500 }}>
              <Clock size={16} />
              Showing items expiring within 30 days only
              <button
                onClick={() => { setFilterMode(''); window.history.replaceState({}, '', '/pharmacy/expiry-management'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Search bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative', maxWidth: 480 }}>
              <Search size={15} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="pso-input"
                type="text"
                placeholder="Search by drug, batch, branch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Main table card */}
          <div className="card-container" style={{ overflow: 'hidden', padding: 0 }}>

            {/* Table header bar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="var(--color-warning)" /> Expiring &amp; Expired Products
              </span>
              <span className="pso-badge">
                {loading
                  ? <><SegmentedSpinner size={12} spinning={true} /> Loading…</>
                  : `${searched.length} Items`}
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="pso-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Batch</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <SegmentedSpinner size={28} spinning={true} />
                        <p style={{ margin: '14px 0 0', fontWeight: 500 }}>Loading products…</p>
                      </td>
                    </tr>
                  ) : searched.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>No expiring products found</p>
                        <p style={{ fontSize: 13, margin: 0 }}>All products are within safe expiry windows.</p>
                      </td>
                    </tr>
                  ) : searched.map((p, idx) => {
                    const expiry = p.expiry_date || p.expiry;
                    const days   = daysUntil(expiry);
                    const badge  = statusBadge(days);
                    return (
                      <tr key={p.id || idx} className="exp-row">
                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 14 }}>{p.name}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)', fontSize: 13 }}>{p.batch_number || p.batch || '—'}</td>
                        <td style={{ color: days !== null && days < 0 ? 'var(--color-danger)' : 'var(--color-text-primary)', fontWeight: days !== null && days < 0 ? 600 : 400 }}>
                          {expiry ? new Date(expiry).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: days === null ? 'var(--color-text-muted)' : days < 0 ? 'var(--color-danger)' : days <= 7 ? '#BE123C' : days <= 30 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {days !== null ? (days < 0 ? `${Math.abs(days)}d OVERDUE` : `${days}d`) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {p.stock_quantity || 0}
                        </td>
                        <td>
                          <span className="pso-badge" style={{ background: badge.bg, color: badge.color }}>
                            {days !== null && days < 0 ? <XCircle size={11} /> : <Clock size={11} />} {badge.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => openReportForm(p)}
                              className="btn-secondary"
                              style={{ padding: '5px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <FileText size={13} /> Report
                            </button>
                            <button
                              onClick={() => handlePrint(p)}
                              className="btn-secondary"
                              style={{ padding: '5px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <Printer size={13} /> Print
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
      </div>

      {/* ══ REPORT MODAL ════════════════════════════════════ */}
      {reportForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', boxShadow: '0 24px 48px rgba(0,0,0,.18)', padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Report Sent to CEO</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>CEO, Store Manager and Finance Manager have been notified simultaneously.</p>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={20} color="var(--color-danger)" /> Report Expired Drug
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      <strong>{reportForm.name}</strong> — Expires: {reportForm.expiry_date || reportForm.expiry} — Qty: {reportForm.stock_quantity || 0}
                    </p>
                  </div>
                  <button onClick={() => setReportForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, lineHeight: 1 }}>✕</button>
                </div>

                {/* Warning notice */}
                <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <AlertTriangle size={16} />
                  This will notify CEO, Store Manager, and Finance Manager simultaneously.
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: 18 }}>
                  <label className="pso-label">Quantity to Report <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    className="pso-input"
                    type="number" min={1} max={reportForm.stock_quantity || 999}
                    value={reportQty} onChange={e => setReportQty(e.target.value)}
                  />
                </div>

                {/* Action */}
                <div style={{ marginBottom: 18 }}>
                  <label className="pso-label">Action Required</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Dispose', 'Return', 'Write-off'].map(a => (
                      <label key={a} className={`action-radio ${reportAction === a ? 'active' : ''}`}>
                        <input type="radio" value={a} checked={reportAction === a} onChange={() => setReportAction(a)} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <label className="pso-label">Notes</label>
                  <textarea
                    className="pso-input"
                    value={reportNotes} onChange={e => setReportNotes(e.target.value)}
                    rows={3} placeholder="Describe action requested..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={submitReport}
                    disabled={!reportQty || reportSaving}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', opacity: (!reportQty || reportSaving) ? 0.5 : 1, cursor: (!reportQty || reportSaving) ? 'not-allowed' : 'pointer' }}
                  >
                    {reportSaving
                      ? <><SegmentedSpinner size={16} spinning={true} /> Submitting…</>
                      : <><FileText size={15} /> Submit to CEO</>
                    }
                  </button>
                  <button
                    onClick={() => setReportForm(null)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
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

export default PharmacyExpiryManagement;
