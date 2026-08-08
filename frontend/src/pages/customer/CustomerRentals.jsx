import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Clock, CheckSquare, XSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Image as ImageIcon,
  Upload, Plus, XCircle, User, Phone, Mail, CreditCard,
  FileText, MapPin, Hash, Wrench, AlertTriangle
} from 'lucide-react';
import carService from '../../services/carService';

/* ─── helpers ──────────────────────────────────────────────── */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB',  { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

/* ─── status maps ─────────────────────────────────────────── */
const ORDER_STATUS = {
  PENDING_APPROVAL: { label: 'Pending Approval', color: '#FFFFFF', bg: '#8D6E63' },
  APPROVED:         { label: 'Approved',          color: '#FFFFFF', bg: '#8BC34A' },
  CONFIRMED:        { label: 'Confirmed',          color: '#FFFFFF', bg: '#2E8B57' },
  ACTIVE:           { label: 'Active',             color: '#FFFFFF', bg: '#87CEEB' },
  COMPLETED:        { label: 'Completed',          color: '#FFFFFF', bg: '#228B22' },
  REJECTED:         { label: 'Rejected',           color: '#FFFFFF', bg: '#F44336' },
  CANCELLED:        { label: 'Cancelled',          color: '#FFFFFF', bg: '#F44336' },
};

const PAYMENT_STATUS = {
  UNPAID:  { label: 'Unpaid',  color: '#FFFFFF', bg: '#FF9800' },
  PAID:    { label: 'Paid',    color: '#FFFFFF', bg: '#228B22' },
  PARTIAL: { label: 'Partial', color: '#FFFFFF', bg: '#8BC34A' },
};

const STATUS_TABS = [
  { key: 'ALL',              label: 'All Rentals', Icon: Car },
  { key: 'PENDING_APPROVAL', label: 'Pending',     Icon: Clock },
  { key: 'APPROVED',         label: 'Approved',    Icon: CheckSquare },
  { key: 'ACTIVE',           label: 'Active',      Icon: PlaySquare },
  { key: 'COMPLETED',        label: 'Completed',   Icon: CheckSquare },
];

/* ─── shared CSS ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .cr-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #424242;
  }
  @media (max-width: 720px) { .cr-page { padding: 16px; } }

  /* header row */
  .cr-page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .cr-page-title  { font-size: 2rem; font-weight: 700; color: #1B5E20; margin: 0; }
  .cr-page-sub    { font-size: 0.95rem; color: #424242; margin: 6px 0 0; }

  /* tabs */
  .cr-tabs { display: flex; gap: 0; border-bottom: 1px solid #8D6E63; margin-bottom: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .cr-tab  { background: transparent; border: none; border-bottom: 3px solid transparent; padding: 12px 24px; color: #424242; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s ease; font-size: 0.95rem; white-space: nowrap; }
  .cr-tab.active { color: #228B22; border-bottom: 3px solid #228B22; }
  .cr-tab:hover:not(.active) { color: #228B22; }

  /* card list */
  .cr-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
  .cr-card { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.15s ease; }
  .cr-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
  .cr-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .cr-order-num { font-size: 0.8rem; font-weight: 700; color: #8D6E63; text-transform: uppercase; letter-spacing: 0.05em; }
  .cr-card-title { font-size: 1.1rem; font-weight: 700; color: #1B5E20; margin: 0 0 10px; }
  .cr-card-meta { display: flex; gap: 16px; font-size: 0.9rem; color: #424242; margin-bottom: 10px; flex-wrap: wrap; }
  .cr-card-meta span { display: flex; align-items: center; gap: 5px; }
  .cr-dates { background: #F5F5F5; border-radius: 6px; padding: 10px 12px; font-size: 0.9rem; color: #1B5E20; font-weight: 600; margin-bottom: 12px; }
  .cr-card-footer { border-top: 1px solid #F5F5F5; padding-top: 12px; text-align: right; }
  .cr-view-link { color: #2E8B57; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; }

  /* empty state */
  .cr-empty { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; padding: 64px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }

  /* ─── DETAIL PANEL ─── */
  .cr-detail-wrap { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; overflow: hidden; }

  .cr-detail-top {
    background: #1B5E20;
    padding: 28px 32px;
    display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;
  }
  @media (max-width: 600px) { .cr-detail-top { padding: 20px 16px; } }
  .cr-detail-inv { font-size: 1.6rem; font-weight: 700; color: #FFFFFF; margin: 0 0 6px; }
  .cr-detail-date { font-size: 0.9rem; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 6px; }
  .cr-detail-total-label { font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .cr-detail-total-amt { font-size: 2rem; font-weight: 700; color: #FFFFFF; line-height: 1; }

  .cr-status-bar { background: #F5F5F5; border-bottom: 1px solid #e0e0e0; padding: 14px 32px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cr-status-lbl { font-size: 0.85rem; color: #757575; margin-right: 2px; }

  .cr-body { padding: 32px; }
  @media (max-width: 600px) { .cr-body { padding: 16px; } }

  .cr-section { margin-bottom: 32px; }
  .cr-section:last-child { margin-bottom: 0; }
  .cr-section-title { font-size: 0.8rem; font-weight: 700; color: #228B22; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #F5F5F5; }

  .cr-info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #F5F5F5; gap: 16px; }
  .cr-info-row:last-child { border-bottom: none; }
  .cr-info-label { font-size: 0.9rem; color: #757575; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .cr-info-value { font-size: 0.95rem; font-weight: 600; color: #424242; text-align: right; }

  /* two-col grid for sections side by side */
  .cr-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  @media (max-width: 760px) { .cr-two-col { grid-template-columns: 1fr; } }

  /* car image */
  .cr-car-image-wrap { width: 100%; height: 220px; border-radius: 10px; overflow: hidden; background: #F5F5F5; border: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
  .cr-car-image { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform 0.15s ease; }
  .cr-car-image:hover { transform: scale(1.03); }

  /* payment proof image */
  .cr-proof-img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e0e0e0; cursor: zoom-in; transition: transform 0.15s ease; }
  .cr-proof-img:hover { transform: scale(1.03); }

  /* totals rows */
  .cr-total-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F5F5; font-size: 0.95rem; }
  .cr-total-line.grand { border-bottom: none; border-top: 2px solid #1B5E20; margin-top: 4px; padding-top: 14px; font-size: 1.1rem; font-weight: 700; color: #1B5E20; }

  /* action forms */
  .cr-action-section { background: #F5F5F5; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; }
  .cr-form-label { font-size: 0.9rem; font-weight: 600; color: #424242; margin-bottom: 8px; display: block; }
  .cr-input { padding: 10px 12px; border: 1px solid #8D6E63; border-radius: 6px; font-family: inherit; font-size: 0.95rem; width: 100%; box-sizing: border-box; transition: all 0.15s ease; background: #FFFFFF; color: #424242; }
  .cr-input:focus { border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.15); outline: none; }

  /* badge */
  .cr-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; }

  /* divider */
  .cr-divider { border: none; border-top: 1px solid #F5F5F5; margin: 24px 0; }

  /* buttons */
  .cr-btn-primary   { background: #2E8B57; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .cr-btn-primary:hover:not(:disabled)   { background: #267347; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cr-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .cr-btn-secondary { background: #6B8E23; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .cr-btn-secondary:hover:not(:disabled) { background: #55721c; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cr-btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
  .cr-btn-danger    { background: #F44336; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .cr-btn-danger:hover    { background: #d32f2f; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
  .cr-btn-sm { padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; }

  /* toast */
  .cr-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; border-radius: 10px; color: #FFFFFF; padding: 16px 24px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.18); animation: crSlide 0.3s ease-out forwards; }
  .cr-toast.success { background: #4CAF50; }
  .cr-toast.error   { background: #F44336; }
  .cr-toast.warning { background: #FF9800; }

  /* modal */
  .cr-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 32px; }
  .cr-modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; cursor: pointer; }
  .cr-modal-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }

  .cr-spin { animation: crSpin 1s linear infinite; }
  @keyframes crSpin  { 100% { transform: rotate(360deg); } }
  @keyframes crSlide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function CustomerRentals() {
  const navigate = useNavigate();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotif]    = useState(null);
  const [imgError, setImgError]     = useState(false);
  const [lightbox, setLightbox]     = useState(null);

  // action states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendOpen, setExtendOpen]     = useState(false);
  const [extendDays, setExtendDays]     = useState(1);
  const fileRef = useRef(null);

  const toast = (msg, type = 'success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4500);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // apiClient interceptor returns response.data so we get { status, data } directly
      const res = await carService.getMyRentalOrders();
      const list = res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      // update detail view if open
      if (selected) {
        const updated = (Array.isArray(list) ? list : []).find(o => o.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error('Failed to load rentals', err);
      toast('Failed to load rentals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchOrders(); }, []); // eslint-disable-line

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await carService.getMyRentalOrders();
      const list = res.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
      if (selected) {
        const updated = (Array.isArray(list) ? list : []).find(o => o.id === selected.id);
        if (updated) setSelected(updated);
      }
      toast('Rentals refreshed.');
    } catch { toast('Failed to refresh.', 'error'); }
    finally { setRefreshing(false); }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proof', selectedFile);
      await carService.uploadPaymentProof(selected.id, fd);
      toast('Payment proof uploaded!');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchOrders();
    } catch { toast('Failed to upload payment proof.', 'error'); }
    finally { setUploading(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast('Cancellation reason is required.', 'error');
    try {
      await carService.cancelRentalOrder(selected.id, cancelReason);
      toast('Rental cancelled successfully.');
      setCancelOpen(false);
      setCancelReason('');
      fetchOrders();
    } catch { toast('Failed to cancel rental.', 'error'); }
  };

  const handleExtend = async () => {
    try {
      await carService.extendRentalOrder(selected.id, extendDays);
      toast('Extension requested successfully.');
      setExtendOpen(false);
      setExtendDays(1);
      fetchOrders();
    } catch { toast('Failed to request extension.', 'error'); }
  };

  const openDetail = (order) => {
    setSelected(order);
    setImgError(false);
    setCancelOpen(false);
    setCancelReason('');
    setExtendOpen(false);
    setExtendDays(1);
    setSelectedFile(null);
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — single full page
  ═══════════════════════════════════════════════════════════ */
  if (selected) {
    const o    = selected;
    const ost  = ORDER_STATUS[o.status]        || ORDER_STATUS.PENDING_APPROVAL;
    const pst  = PAYMENT_STATUS[o.paymentStatus] || null;
    const imgUrl = getImageUrl(o.carImage);
    const proofUrl = getImageUrl(o.paymentProofUrl);
    const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(o.status);
    const canUpload  = o.status === 'APPROVED' && o.paymentStatus !== 'PAID';
    const canExtend  = o.status === 'ACTIVE';

    const hasFees = o.extensionFee > 0 || o.damageFee > 0 || o.fuelFee > 0 || o.lateFee > 0;

    return (
      <div className="cr-page">
        <style>{STYLES}</style>
        {notification && <div className={`cr-toast ${notification.type}`}>{notification.msg}</div>}

        {/* top nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button className="cr-btn-secondary" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} /> Back to Rentals
          </button>
          {canCancel && !cancelOpen && (
            <button className="cr-btn-danger" onClick={() => setCancelOpen(true)}>
              <XSquare size={16} /> Cancel Rental
            </button>
          )}
        </div>

        <div className="cr-detail-wrap">

          {/* ── dark green top strip ── */}
          <div className="cr-detail-top">
            <div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Car Rental</div>
              <h1 className="cr-detail-inv">#{o.orderNumber || o.id}</h1>
              <div className="cr-detail-date"><Calendar size={14} /> Booked {fmtDate(o.createdAt)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="cr-detail-total-label">Total Amount</div>
              <div className="cr-detail-total-amt">{fmtMoney(o.totalAmount)} ETB</div>
            </div>
          </div>

          {/* status bar */}
          <div className="cr-status-bar">
            <span className="cr-status-lbl">Order:</span>
            <span className="cr-badge" style={{ background: ost.bg, color: ost.color }}>{ost.label}</span>
            {pst && (
              <>
                <span className="cr-status-lbl" style={{ marginLeft: '10px' }}>Payment:</span>
                <span className="cr-badge" style={{ background: pst.bg, color: pst.color }}>{pst.label}</span>
              </>
            )}
            {o.isCancellationRequested && (
              <span className="cr-badge" style={{ background: '#FF9800', color: '#FFFFFF', marginLeft: '10px' }}>
                <AlertTriangle size={13} /> Cancellation Requested
              </span>
            )}
            {o.pendingExtensionDays && (
              <span className="cr-badge" style={{ background: '#87CEEB', color: '#424242', marginLeft: '10px' }}>
                Extension Pending ({o.pendingExtensionDays}d)
              </span>
            )}
          </div>

          {/* ── body ── */}
          <div className="cr-body">

            {/* SECTION 1 — Vehicle & Dates */}
            <div className="cr-section">
              <div className="cr-section-title"><Car size={16} /> Vehicle &amp; Rental Dates</div>
              <div className="cr-two-col">
                {/* left: image + car name */}
                <div>
                  <div className="cr-car-image-wrap">
                    {imgUrl && !imgError ? (
                      <img
                        src={imgUrl}
                        alt={o.carName}
                        className="cr-car-image"
                        onError={() => setImgError(true)}
                        onClick={() => setLightbox(imgUrl)}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#8D6E63' }}>
                        <ImageIcon size={40} />
                        <span style={{ fontSize: '0.85rem' }}>No Image</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1B5E20', marginBottom: '4px' }}>{o.carName || '—'}</div>
                  <div style={{ fontSize: '0.9rem', color: '#424242' }}>Daily Rate: <strong style={{ color: '#2E8B57' }}>{fmtMoney(o.dailyRate)} ETB/day</strong></div>
                </div>
                {/* right: date rows */}
                <div>
                  <div className="cr-info-row">
                    <span className="cr-info-label"><Calendar size={14} /> Pickup Date</span>
                    <span className="cr-info-value">{fmtDate(o.pickupDate)}</span>
                  </div>
                  <div className="cr-info-row">
                    <span className="cr-info-label"><Calendar size={14} /> Return Date</span>
                    <span className="cr-info-value">{fmtDate(o.returnDate)}</span>
                  </div>
                  {o.extendedReturnDate && (
                    <div className="cr-info-row">
                      <span className="cr-info-label"><Calendar size={14} /> Extended Return</span>
                      <span className="cr-info-value" style={{ color: '#FF9800' }}>{fmtDate(o.extendedReturnDate)}</span>
                    </div>
                  )}
                  <div className="cr-info-row">
                    <span className="cr-info-label"><Clock size={14} /> Duration</span>
                    <span className="cr-info-value">{o.totalDays} {o.totalDays === 1 ? 'day' : 'days'}</span>
                  </div>
                  {o.actualReturnTime && (
                    <div className="cr-info-row">
                      <span className="cr-info-label">Actual Return</span>
                      <span className="cr-info-value">{fmtDate(o.actualReturnTime)}</span>
                    </div>
                  )}
                  {o.specialRequests && (
                    <div className="cr-info-row">
                      <span className="cr-info-label"><FileText size={14} /> Special Requests</span>
                      <span className="cr-info-value" style={{ maxWidth: '220px', textAlign: 'right' }}>{o.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="cr-divider" />

            {/* SECTION 2 — Customer & Driver */}
            <div className="cr-two-col" style={{ marginBottom: '32px' }}>
              <div className="cr-section">
                <div className="cr-section-title"><User size={16} /> Customer Info</div>
                <div className="cr-info-row">
                  <span className="cr-info-label"><User size={14} /> Name</span>
                  <span className="cr-info-value">{o.customerName || '—'}</span>
                </div>
                <div className="cr-info-row">
                  <span className="cr-info-label"><Mail size={14} /> Email</span>
                  <span className="cr-info-value">{o.customerEmail || '—'}</span>
                </div>
                <div className="cr-info-row">
                  <span className="cr-info-label"><Phone size={14} /> Phone</span>
                  <span className="cr-info-value">{o.customerPhone || '—'}</span>
                </div>
              </div>
              <div className="cr-section">
                <div className="cr-section-title"><Wrench size={16} /> Driver Info</div>
                <div className="cr-info-row">
                  <span className="cr-info-label">Driver Name</span>
                  <span className="cr-info-value">{o.driverName || '—'}</span>
                </div>
                <div className="cr-info-row">
                  <span className="cr-info-label">License #</span>
                  <span className="cr-info-value">{o.driverLicense || '—'}</span>
                </div>
              </div>
            </div>

            <hr className="cr-divider" />

            {/* SECTION 3 — Payment Summary */}
            <div className="cr-section">
              <div className="cr-section-title"><CreditCard size={16} /> Payment Summary</div>
              <div style={{ maxWidth: '400px' }}>
                <div className="cr-total-line">
                  <span>Rental Amount</span>
                  <span>{fmtMoney(o.rentalAmount)} ETB</span>
                </div>
                <div className="cr-total-line">
                  <span>Security Deposit</span>
                  <span>{fmtMoney(o.securityDeposit)} ETB</span>
                </div>
                {hasFees && (
                  <>
                    {o.extensionFee > 0 && (
                      <div className="cr-total-line">
                        <span>Extension Fee</span>
                        <span style={{ color: '#FF9800' }}>{fmtMoney(o.extensionFee)} ETB</span>
                      </div>
                    )}
                    {o.damageFee > 0 && (
                      <div className="cr-total-line">
                        <span>Damage Fee</span>
                        <span style={{ color: '#F44336' }}>{fmtMoney(o.damageFee)} ETB</span>
                      </div>
                    )}
                    {o.fuelFee > 0 && (
                      <div className="cr-total-line">
                        <span>Fuel Fee</span>
                        <span style={{ color: '#F44336' }}>{fmtMoney(o.fuelFee)} ETB</span>
                      </div>
                    )}
                    {o.lateFee > 0 && (
                      <div className="cr-total-line">
                        <span>Late Return Fee</span>
                        <span style={{ color: '#F44336' }}>{fmtMoney(o.lateFee)} ETB</span>
                      </div>
                    )}
                  </>
                )}
                {o.refundAmount > 0 && (
                  <div className="cr-total-line">
                    <span>Refund</span>
                    <span style={{ color: '#4CAF50' }}>-{fmtMoney(o.refundAmount)} ETB</span>
                  </div>
                )}
                <div className="cr-total-line grand">
                  <span>Total Due</span>
                  <span>{fmtMoney(o.totalAmount)} ETB</span>
                </div>
              </div>

              {/* payment details */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#757575', marginBottom: '4px' }}>Payment Method</div>
                  <div style={{ fontWeight: 600, color: '#424242', textTransform: 'capitalize' }}>{o.paymentMethod || '—'}</div>
                </div>
                {o.paymentReference && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#757575', marginBottom: '4px' }}>Reference</div>
                    <div style={{ fontWeight: 600, color: '#424242' }}>{o.paymentReference}</div>
                  </div>
                )}
                {o.verifiedAmount && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#757575', marginBottom: '4px' }}>Verified Amount</div>
                    <div style={{ fontWeight: 600, color: '#228B22' }}>{fmtMoney(o.verifiedAmount)} ETB</div>
                  </div>
                )}
                {proofUrl && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#757575', marginBottom: '4px' }}>Payment Proof</div>
                    <img src={proofUrl} alt="Proof" className="cr-proof-img" onClick={() => setLightbox(proofUrl)} />
                  </div>
                )}
              </div>
            </div>

            {/* notes / remarks from manager */}
            {(o.managerNote || o.pickupRemarks || o.financeNotes || o.cancellationReason) && (
              <>
                <hr className="cr-divider" />
                <div className="cr-section">
                  <div className="cr-section-title"><FileText size={16} /> Notes &amp; Remarks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {o.managerNote && (
                      <div className="cr-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="cr-info-label">Manager Note</span>
                        <span style={{ color: '#424242', lineHeight: 1.6 }}>{o.managerNote}</span>
                      </div>
                    )}
                    {o.pickupRemarks && (
                      <div className="cr-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="cr-info-label">Pickup Remarks</span>
                        <span style={{ color: '#424242', lineHeight: 1.6 }}>{o.pickupRemarks}</span>
                      </div>
                    )}
                    {o.financeNotes && (
                      <div className="cr-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="cr-info-label">Finance Notes</span>
                        <span style={{ color: '#424242', lineHeight: 1.6 }}>{o.financeNotes}</span>
                      </div>
                    )}
                    {o.cancellationReason && (
                      <div className="cr-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="cr-info-label" style={{ color: '#F44336' }}>Cancellation Reason</span>
                        <span style={{ color: '#424242', lineHeight: 1.6 }}>{o.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── ACTIONS ── */}
            {(canUpload || canExtend || canCancel) && (
              <>
                <hr className="cr-divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Upload payment proof */}
                  {canUpload && (
                    <div className="cr-action-section">
                      <div className="cr-section-title" style={{ marginBottom: '14px' }}><Upload size={16} /> Upload Payment Proof</div>
                      <input
                        type="file"
                        ref={fileRef}
                        accept="image/*,.pdf"
                        onChange={e => setSelectedFile(e.target.files[0])}
                        className="cr-input"
                        style={{ padding: '8px 12px', cursor: 'pointer' }}
                      />
                      <button
                        className="cr-btn-primary"
                        style={{ marginTop: '12px' }}
                        onClick={handleUploadProof}
                        disabled={!selectedFile || uploading}
                      >
                        <Upload size={15} /> {uploading ? 'Uploading…' : 'Submit Proof'}
                      </button>
                    </div>
                  )}

                  {/* Extend rental */}
                  {canExtend && (
                    <div className="cr-action-section">
                      <div className="cr-section-title" style={{ marginBottom: '14px' }}><Plus size={16} /> Extend Rental</div>
                      {!extendOpen ? (
                        <button className="cr-btn-secondary" onClick={() => setExtendOpen(true)}>
                          <Plus size={15} /> Request Extension
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px' }}>
                          <label className="cr-form-label">Additional days:</label>
                          <input
                            type="number"
                            min="1"
                            value={extendDays}
                            onChange={e => setExtendDays(e.target.value)}
                            className="cr-input"
                          />
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="cr-btn-primary" onClick={handleExtend}>Submit</button>
                            <button className="cr-btn-secondary" onClick={() => setExtendOpen(false)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancel rental */}
                  {canCancel && cancelOpen && (
                    <div className="cr-action-section" style={{ border: '1px solid #F44336' }}>
                      <div className="cr-section-title" style={{ marginBottom: '14px', color: '#F44336' }}><XSquare size={16} /> Cancel Rental</div>
                      <label className="cr-form-label">Reason for cancellation <span style={{ color: '#F44336' }}>*</span></label>
                      <textarea
                        rows={3}
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        className="cr-input"
                        placeholder="Please describe why you are cancelling…"
                      />
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button className="cr-btn-danger" onClick={handleCancel}>Confirm Cancellation</button>
                        <button className="cr-btn-secondary" onClick={() => setCancelOpen(false)}>Back</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>{/* /cr-body */}
        </div>{/* /cr-detail-wrap */}

        {/* lightbox */}
        {lightbox && (
          <div className="cr-modal" onClick={() => setLightbox(null)}>
            <button className="cr-modal-close" onClick={() => setLightbox(null)}><XCircle size={32} /></button>
            <img src={lightbox} alt="Full view" className="cr-modal-img" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="cr-page">
      <style>{STYLES}</style>
      {notification && <div className={`cr-toast ${notification.type}`}>{notification.msg}</div>}

      {/* header */}
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Vehicle Rentals</h1>
          <p className="cr-page-sub">Track and manage your car rental bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="cr-btn-primary" onClick={() => navigate('/services/agrirent')}>
            <Plus size={16} /> New Rental
          </button>
          <button className="cr-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <SegmentedSpinner size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="cr-tabs">
        {STATUS_TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`cr-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#757575' }}>Loading rentals…</div>
      ) : filtered.length === 0 ? (
        <div className="cr-empty">
          <Car size={48} color="#A5D6A7" />
          <h2 style={{ fontSize: '1.4rem', color: '#1B5E20', margin: 0 }}>No Rentals Found</h2>
          <p style={{ color: '#757575', margin: 0 }}>You don't have any rentals in this category.</p>
          <button className="cr-btn-primary" onClick={() => navigate('/services/agrirent')}>Rent a Vehicle</button>
        </div>
      ) : (
        <div className="cr-list">
          {filtered.map(order => {
            const ost = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING_APPROVAL;
            return (
              <div key={order.id} className="cr-card" onClick={() => openDetail(order)}>
                <div className="cr-card-header">
                  <span className="cr-order-num">#{order.orderNumber}</span>
                  <span className="cr-badge" style={{ background: ost.bg, color: ost.color }}>{ost.label}</span>
                </div>
                <h3 className="cr-card-title">{order.carName || 'Vehicle'}</h3>
                <div className="cr-card-meta">
                  <span><Calendar size={14} /> {fmtDate(order.createdAt)}</span>
                  <span><DollarSign size={14} /> {fmtMoney(order.totalAmount)} ETB</span>
                </div>
                <div className="cr-dates">
                  {fmtDate(order.pickupDate)} → {fmtDate(order.returnDate)}
                  <span style={{ marginLeft: '8px', fontWeight: 400, color: '#6B8E23' }}>({order.totalDays}d)</span>
                </div>
                <div className="cr-card-footer">
                  <span className="cr-view-link">View Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
