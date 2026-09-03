import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckSquare, XSquare, Package, RefreshCw,
  ArrowLeft, User, Mail, Phone, MapPin, Truck, Hash, Calendar,
  DollarSign, Image as ImageIcon, AlertCircle, Upload, FileText, CheckCircle, Trash2
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

/* ─── status maps ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:          { label: 'Pending Review',   color: '#FFFFFF', bg: '#8D6E63' },
  approved:         { label: 'Approved',         color: '#FFFFFF', bg: '#8BC34A' }, // lime green badge
  rejected:         { label: 'Rejected',         color: '#FFFFFF', bg: '#F44336' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#FFFFFF', bg: '#2E8B57' },
  picked_up:        { label: 'Picked Up',        color: '#FFFFFF', bg: '#228B22' },
  delivered:        { label: 'Delivered',        color: '#FFFFFF', bg: '#228B22' },
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders', Icon: ClipboardList },
  { key: 'pending',   label: 'Pending',    Icon: Clock },
  { key: 'approved',  label: 'Approved',   Icon: CheckCircle },
  { key: 'delivered', label: 'Delivered',  Icon: Truck },
];

/* ─── shared CSS ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .cp-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #424242;
  }
  @media (max-width: 720px) { .cp-page { padding: 16px; } }

  /* header row */
  .cp-page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .cp-page-title  { font-size: 2rem; font-weight: 700; color: #1B5E20; margin: 0; }
  .cp-page-sub    { font-size: 0.95rem; color: #424242; margin: 6px 0 0; }

  /* tabs */
  .cp-tabs { display: flex; gap: 0; border-bottom: 1px solid #8D6E63; margin-bottom: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cp-tab  { background: transparent; border: none; border-bottom: 3px solid transparent; padding: 12px 24px; color: #424242; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s ease; font-size: 0.95rem; white-space: nowrap; }
  .cp-tab.active { color: #228B22; border-bottom: 3px solid #228B22; }
  .cp-tab:hover:not(.active) { color: #228B22; }

  /* card list (row layout) */
  .cp-list { display: flex; flex-direction: column; gap: 8px; }
  .cp-card { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 8px; padding: 14px 20px; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .cp-card:hover { background: #F5F5F5; border-color: #2E8B57; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  
  .cp-card-header { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
  .cp-order-num { font-size: 0.75rem; font-weight: 700; color: #8D6E63; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  
  .cp-card-title { flex: 1; font-size: 0.9375rem; font-weight: 700; color: #1B5E20; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  .cp-card-meta { display: flex; gap: 20px; font-size: 0.8125rem; color: #424242; flex-shrink: 0; flex-wrap: nowrap; }
  .cp-card-meta span { display: flex; align-items: center; gap: 5px; white-space: nowrap; font-weight: 500; }
  
  .cp-card-footer { flex-shrink: 0; margin-left: auto; display: flex; align-items: center; }
  .cp-view-link { color: #2E8B57; font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; white-space: nowrap; }


  /* empty state */
  .cp-empty { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; padding: 64px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }

  /* ─── DETAIL PANEL ─── */
  .cp-detail-wrap { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; overflow: hidden; }

  .cp-detail-top {
    background: #1B5E20;
    padding: 28px 32px;
    display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;
  }
  @media (max-width: 600px) { .cp-detail-top { padding: 20px 16px; } }
  .cp-detail-inv { font-size: 1.6rem; font-weight: 700; color: #FFFFFF; margin: 0 0 6px; }
  .cp-detail-date { font-size: 0.9rem; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 6px; }
  .cp-detail-total-label { font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .cp-detail-total-amt { font-size: 2rem; font-weight: 700; color: #FFFFFF; line-height: 1; }

  .cp-status-bar { background: #F5F5F5; border-bottom: 1px solid #e0e0e0; padding: 14px 32px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cp-status-lbl { font-size: 0.85rem; color: #757575; margin-right: 2px; }

  .cp-body { padding: 32px; }
  @media (max-width: 600px) { .cp-body { padding: 16px; } }

  .cp-section { margin-bottom: 32px; }
  .cp-section:last-child { margin-bottom: 0; }
  .cp-section-title { font-size: 0.8rem; font-weight: 700; color: #228B22; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #F5F5F5; }

  .cp-info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #F5F5F5; gap: 16px; }
  .cp-info-row:last-child { border-bottom: none; }
  .cp-info-label { font-size: 0.9rem; color: #757575; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .cp-info-value { font-size: 0.95rem; font-weight: 600; color: #424242; text-align: right; }

  /* two-col grid for sections side by side */
  .cp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  @media (max-width: 760px) { .cp-two-col { grid-template-columns: 1fr; } }

  /* drug image */
  .cp-drug-image-wrap { width: 100%; height: 220px; border-radius: 10px; overflow: hidden; background: #F5F5F5; border: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; padding: 12px; }
  .cp-drug-image { width: 100%; height: 100%; object-fit: contain; }

  /* prescription image */
  .cp-rx-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #F5F5F5; border: 1px dashed #8D6E63; border-radius: 10px; min-height: 220px; padding: 24px; text-align: center; }
  .cp-rx-img { width: 100%; max-height: 400px; object-fit: contain; cursor: zoom-in; border-radius: 8px; transition: transform 0.15s ease; }
  .cp-rx-img:hover { transform: scale(1.02); }

  /* totals rows */
  .cp-total-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F5F5; font-size: 0.95rem; }
  .cp-total-line.grand { border-bottom: none; border-top: 2px solid #1B5E20; margin-top: 4px; padding-top: 14px; font-size: 1.1rem; font-weight: 700; color: #1B5E20; }

  /* action forms */
  .cp-action-section { background: #F5F5F5; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; }
  .cp-input { padding: 10px 12px; border: 1px solid #8D6E63; border-radius: 6px; font-family: inherit; font-size: 0.95rem; width: 100%; box-sizing: border-box; transition: all 0.15s ease; background: #FFFFFF; color: #424242; }
  .cp-input:focus { border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.15); outline: none; }

  /* badge */
  .cp-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

  /* divider */
  .cp-divider { border: none; border-top: 1px solid #F5F5F5; margin: 24px 0; }

  /* buttons */
  .cp-btn-primary   { background: #2E8B57; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
  .cp-btn-primary:hover:not(:disabled)   { background: #267347; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .cp-btn-secondary { background: #6B8E23; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
  .cp-btn-secondary:hover:not(:disabled) { background: #55721c; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cp-btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
  .cp-btn-danger    { background: #F44336; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
  .cp-btn-danger:hover:not(:disabled)    { background: #d32f2f; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cp-btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }
  
  /* toast */
  .cp-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; border-radius: 10px; color: #FFFFFF; padding: 16px 24px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.18); animation: cpSlide 0.3s ease-out forwards; }
  .cp-toast.success { background: #4CAF50; }
  .cp-toast.error   { background: #F44336; }
  .cp-toast.warning { background: #FF9800; }

  /* modal */
  .cp-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 32px; }
  .cp-modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; cursor: pointer; }
  .cp-modal-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }

  .cp-spin { animation: cpSpin 1s linear infinite; }
  @keyframes cpSpin  { 100% { transform: rotate(360deg); } }
  @keyframes cpSlide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;

export default function CustomerPrescriptions() {
  const navigate = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotif]    = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  
  const [imgError, setImgError]     = useState(false);
  const [lightbox, setLightbox]     = useState(null);

  // action states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const fileRef = useRef(null);

  const toast = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4500);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/pharmacy/requests/my-requests');
      const list = res.data?.data || res.data || [];
      setRequests(Array.isArray(list) ? list : []);
      if (selectedOrder) {
        const updated = (Array.isArray(list) ? list : []).find(r => r.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('Failed to load prescription requests', err);
      toast('Failed to load prescription requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOrder]);

  useEffect(() => { fetchRequests(); }, []); // eslint-disable-line

  const handleHideRequest = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideRequest = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/pharmacy/requests/${id}/hide`);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast('Order removed from your dashboard.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to remove order.', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/pharmacy/requests/my-requests');
      const list = res.data?.data || res.data || [];
      setRequests(Array.isArray(list) ? list : []);
      if (selectedOrder) {
        const updated = (Array.isArray(list) ? list : []).find(r => r.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      toast('Orders refreshed.');
    } catch {
      toast('Failed to refresh.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    try {
      await axios.delete(`/pharmacy/requests/${selectedOrder.id}/cancel`);
      toast('Request cancelled successfully.');
      setCancelOpen(false);
      fetchRequests();
      setSelectedOrder(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel request.';
      toast(msg, 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedOrder) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('prescription_image', selectedFile);
      const res = await axios.post(`/pharmacy/requests/${selectedOrder.id}/upload`, formData);
      toast('Prescription image uploaded!');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload image.';
      toast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const openDetail = (req) => {
    setSelectedOrder(req);
    setImgError(false);
    setCancelOpen(false);
    setSelectedFile(null);
  };

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — single full page
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    
    const medImgSrc = getImageUrl(o.medication_image);
    const rxImgSrc = getImageUrl(o.prescription_image);
    
    const canCancel = o.status === 'pending';
    const canUpload = o.status === 'pending' || o.status === 'approved';

    return (
      <div className="cp-page">
        <style>{STYLES}</style>
        {notification && <div className={`cp-toast ${notification.type}`}>{notification.msg}</div>}

        {/* top nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button className="cp-btn-secondary" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to Orders
          </button>
          {canCancel && !cancelOpen && (
            <button className="cp-btn-danger" onClick={() => setCancelOpen(true)}>
              <XSquare size={16} /> Cancel Order
            </button>
          )}
        </div>

        <div className="cp-detail-wrap">
          {/* ── dark green top strip ── */}
          <div className="cp-detail-top">
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Pharmacy Order</div>
              <h1 className="cp-detail-inv">#{o.request_number || o.id}</h1>
              <div className="cp-detail-date"><Calendar size={14} /> Requested on {fmtDateTime(o.requested_at)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="cp-detail-total-label">Total Amount</div>
              <div className="cp-detail-total-amt">{fmtMoney(o.total_amount)} ETB</div>
            </div>
          </div>

          {/* status bar */}
          <div className="cp-status-bar">
            <span className="cp-status-lbl">Order Status:</span>
            <span className="cp-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>

          {/* ── body ── */}
          <div className="cp-body">
            
            {/* SECTION 1 — Medication Details */}
            <div className="cp-section">
              <div className="cp-section-title"><Package size={16} /> Medication Details</div>
              <div className="cp-two-col">
                {/* left: image + name */}
                <div>
                  <div className="cp-drug-image-wrap">
                    {medImgSrc ? (
                      <img src={medImgSrc} alt={o.medication_name} className="cp-drug-image" />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#8D6E63' }}>
                        <ImageIcon size={40} />
                        <span style={{ fontSize: '0.85rem' }}>No Image Available</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1B5E20', marginBottom: '4px' }}>{o.medication_name || '—'}</div>
                </div>
                {/* right: info rows */}
                <div>
                  <div className="cp-info-row">
                    <span className="cp-info-label">Quantity</span>
                    <span className="cp-info-value">{o.quantity} unit(s)</span>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-label">Unit Price</span>
                    <span className="cp-info-value">{fmtMoney(o.price_per_unit)} ETB</span>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-label"><Truck size={14} /> Delivery Option</span>
                    <span className="cp-info-value" style={{ textTransform: 'capitalize' }}>
                      {o.delivery_option || 'Pickup'}
                    </span>
                  </div>
                  {o.delivery_address && (
                    <div className="cp-info-row">
                      <span className="cp-info-label"><MapPin size={14} /> Delivery Address</span>
                      <span className="cp-info-value" style={{ maxWidth: '220px', textAlign: 'right' }}>{o.delivery_address}</span>
                    </div>
                  )}
                  
                  {/* Payment Summary */}
                  <div style={{ marginTop: '24px' }}>
                    <div className="cp-total-line">
                      <span>Subtotal ({o.quantity} units)</span>
                      <span>{fmtMoney(o.quantity * (o.price_per_unit || 0))} ETB</span>
                    </div>
                    {(o.delivery_fee > 0) && (
                      <div className="cp-total-line">
                        <span>Delivery Fee</span>
                        <span>{fmtMoney(o.delivery_fee)} ETB</span>
                      </div>
                    )}
                    <div className="cp-total-line grand">
                      <span>Total Due</span>
                      <span>{fmtMoney(o.total_amount)} ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="cp-divider" />

            {/* SECTION 2 — Customer & Prescription */}
            <div className="cp-two-col">
              
              {/* Customer Info */}
              <div className="cp-section">
                <div className="cp-section-title"><User size={16} /> Customer Information</div>
                <div className="cp-info-row">
                  <span className="cp-info-label"><User size={14} /> Name</span>
                  <span className="cp-info-value">{o.customer_name || '—'}</span>
                </div>
                <div className="cp-info-row">
                  <span className="cp-info-label"><Mail size={14} /> Email</span>
                  <span className="cp-info-value">{o.customer_email || '—'}</span>
                </div>
                <div className="cp-info-row">
                  <span className="cp-info-label"><Phone size={14} /> Phone</span>
                  <span className="cp-info-value">{o.customer_phone || '—'}</span>
                </div>

                {/* Rejection Reason if any */}
                {o.rejection_reason && (
                  <div style={{ marginTop: '24px' }}>
                    <div className="cp-section-title" style={{ color: '#F44336' }}><AlertCircle size={16} /> Rejection Reason</div>
                    <div style={{ background: '#FFEBEE', padding: '12px', borderRadius: '6px', color: '#C62828', fontSize: '0.95rem' }}>
                      {o.rejection_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Prescription Image */}
              <div className="cp-section">
                <div className="cp-section-title"><FileText size={16} /> Prescription Image</div>
                <div className="cp-rx-wrap" style={{ border: rxImgSrc ? '1px solid #e0e0e0' : '1px dashed #8D6E63' }}>
                  {!rxImgSrc ? (
                    <>
                      <FileText size={40} color="#8D6E63" style={{ marginBottom: '12px' }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#424242', marginBottom: '8px' }}>No Prescription Attached</div>
                      <div style={{ fontSize: '0.9rem', color: '#757575', maxWidth: '240px' }}>
                        If a physical prescription is required, you can upload it here or present it upon pickup.
                      </div>
                    </>
                  ) : imgError ? (
                    <>
                      <AlertCircle size={40} color="#F44336" style={{ marginBottom: '12px' }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#424242', marginBottom: '8px' }}>Image Failed to Load</div>
                      <a href={rxImgSrc} target="_blank" rel="noreferrer" style={{ color: '#2E8B57', fontSize: '0.9rem', textDecoration: 'underline' }}>Open Image Directly</a>
                    </>
                  ) : (
                    <img 
                      src={rxImgSrc} 
                      alt="Prescription" 
                      className="cp-rx-img"
                      onError={() => setImgError(true)}
                      onClick={() => setLightbox(rxImgSrc)}
                    />
                  )}
                </div>

                {/* Upload action directly under image */}
                {canUpload && (
                  <div style={{ marginTop: '16px' }}>
                    <input
                      type="file"
                      ref={fileRef}
                      accept="image/*,.pdf"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      className="cp-input"
                      style={{ padding: '8px 12px', cursor: 'pointer', marginBottom: '12px' }}
                    />
                    <button
                      className="cp-btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                    >
                      <Upload size={15} /> {uploading ? 'Uploading…' : (rxImgSrc ? 'Update Prescription' : 'Upload Prescription')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── ACTIONS ── */}
            {canCancel && cancelOpen && (
              <>
                <hr className="cp-divider" />
                <div className="cp-action-section" style={{ border: '1px solid #F44336' }}>
                  <div className="cp-section-title" style={{ marginBottom: '14px', color: '#F44336' }}><XSquare size={16} /> Cancel Order</div>
                  <div style={{ fontSize: '0.95rem', color: '#424242', marginBottom: '16px' }}>Are you sure you want to cancel this pharmacy order? This action cannot be undone.</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="cp-btn-danger" onClick={handleCancel}>Confirm Cancellation</button>
                    <button className="cp-btn-secondary" onClick={() => setCancelOpen(false)}>Back</button>
                  </div>
                </div>
              </>
            )}

          </div>{/* /cp-body */}
        </div>{/* /cp-detail-wrap */}

        {/* lightbox */}
        {lightbox && (
          <div className="cp-modal" onClick={() => setLightbox(null)}>
            <button className="cp-modal-close" onClick={() => setLightbox(null)}><XSquare size={32} /></button>
            <img src={lightbox} alt="Full view" className="cp-modal-img" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
    <div className="cp-page">
      <style>{STYLES}</style>
      {notification && <div className={`cp-toast ${notification.type}`}>{notification.msg}</div>}

      {/* header */}
      <div className="cp-page-header">
        <div>
          <h1 className="cp-page-title">Pharmacy Orders</h1>
          <p className="cp-page-sub">Track and manage your medication requests</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="cp-btn-primary" onClick={() => navigate('/services/pharmacy')}>
            Browse Medications
          </button>
          <button className="cp-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <SegmentedSpinner size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="cp-tabs">
        {STATUS_TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`cp-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#757575' }}>Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="cp-empty">
          <ClipboardList size={48} color="#A5D6A7" />
          <h2 style={{ fontSize: '1.4rem', color: '#1B5E20', margin: 0 }}>No Orders Found</h2>
          <p style={{ color: '#757575', margin: 0 }}>You don't have any pharmacy requests in this category.</p>
          <button className="cp-btn-primary" onClick={() => navigate('/services/pharmacy')}>Browse Medications</button>
        </div>
      ) : (
        <div className="cp-list">
          {filtered.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            return (
              <div key={req.id} className="cp-card" onClick={() => openDetail(req)}>
                {/* Left: order number + status */}
                <div className="cp-card-header">
                  <span className="cp-order-num">#{req.request_number || req.id}</span>
                  <span className="cp-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>
                
                {/* Medication name — grows */}
                <h3 className="cp-card-title">{req.medication_name || 'Prescription'}</h3>
                
                {/* Quantity & Delivery mode */}
                <div style={{ fontSize: '0.8125rem', color: '#424242', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Package size={13} color="#6B8E23" /> Qty: {req.quantity || 1} • {req.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}
                </div>

                {/* Amount + Booked date */}
                <div className="cp-card-meta">
                  <span><DollarSign size={13} /> {fmtMoney(req.total_amount)} ETB</span>
                  <span><Calendar size={13} /> {fmtDate(req.requested_at)}</span>
                </div>

                {/* View link */}
                <div className="cp-card-footer" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {['delivered', 'picked_up', 'completed', 'ready_for_pickup'].includes((req.status || '').toLowerCase()) && (
                    <button 
                      onClick={(e) => handleHideRequest(e, req.id, req.tracking_number || `Request #${req.id}`)}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                      title="Delete from dashboard"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <span className="cp-view-link">View →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── In-app confirmation dialog ── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Remove Order?</h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              <strong>{confirmDelete.label}</strong> will be removed from your dashboard.<br />
              This only hides it for you — the pharmacy still has your request record.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmHideRequest}
                style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
