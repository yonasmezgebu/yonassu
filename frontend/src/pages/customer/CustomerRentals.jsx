import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Clock, CheckSquare, XSquare, PlaySquare, RefreshCw, 
  ArrowLeft, Calendar, DollarSign, Image as ImageIcon, 
  ChevronRight, Activity, Upload, AlertCircle, Plus
} from 'lucide-react';
import carService from '../../services/carService';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Pending',     color: '#FFFFFF', bg: '#8D6E63', border: '#5D4037' }, // Earth Brown
  APPROVED:         { label: 'Approved',    color: '#FFFFFF', bg: '#8BC34A', border: '#558B2F' }, // Lime Green
  CONFIRMED:        { label: 'Confirmed',   color: '#FFFFFF', bg: '#2E8B57', border: '#1B5E20' }, // Emerald
  ACTIVE:           { label: 'Active',      color: '#FFFFFF', bg: '#87CEEB', border: '#0288D1' }, // Sky Blue
  COMPLETED:        { label: 'Completed',   color: '#FFFFFF', bg: '#228B22', border: '#006400' }, // Forest Green
  REJECTED:         { label: 'Rejected',    color: '#FFFFFF', bg: '#F44336', border: '#B71C1C' }, // Red
  CANCELLED:        { label: 'Cancelled',   color: '#FFFFFF', bg: '#F44336', border: '#B71C1C' }, // Red
};

const STATUS_TABS = [
  { key: 'ALL',              label: 'ALL RENTALS', Icon: Car },
  { key: 'PENDING_APPROVAL', label: 'PENDING',     Icon: Clock },
  { key: 'APPROVED',         label: 'APPROVED',    Icon: CheckSquare },
  { key: 'ACTIVE',           label: 'ACTIVE',      Icon: PlaySquare },
  { key: 'COMPLETED',        label: 'COMPLETED',   Icon: CheckSquare },
];

export default function CustomerRentals() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [imgError, setImgError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Action states
  const [uploadingFor, setUploadingFor] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendPrompt, setExtendPrompt] = useState(false);
  const [extendDays, setExtendDays] = useState(1);
  const fileRef = useRef(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await carService.getMyRentalOrders();
      if (res.status === 'success') {
        setOrders(res.data || []);
        if (selectedOrder) {
          const updated = (res.data || []).find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load car rentals', err);
      showNotification('Failed to load rentals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await carService.getMyRentalOrders();
      if (res.status === 'success') {
        setOrders(res.data || []);
        if (selectedOrder) {
          const updated = (res.data || []).find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to refresh', err);
      showNotification('Failed to refresh rentals.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUploadProof = async () => {
    if (!selectedFile || !selectedOrder) return;
    try {
      setUploadingFor(true);
      const formData = new FormData();
      formData.append('proof', selectedFile);
      await carService.uploadPaymentProof(selectedOrder.id, formData);
      showNotification('Payment proof uploaded successfully!', 'success');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchOrders();
    } catch (e) {
      showNotification('Failed to upload payment proof', 'error');
    } finally {
      setUploadingFor(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) return showNotification('Cancellation reason is required.', 'error');
    try {
      await carService.cancelRentalOrder(selectedOrder.id, cancelReason);
      showNotification('Rental cancelled successfully.', 'success');
      setCancelPrompt(false);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      showNotification('Failed to cancel rental.', 'error');
    }
  };

  const handleExtend = async () => {
    try {
      await carService.extendRentalOrder(selectedOrder.id, extendDays);
      showNotification('Extension requested successfully.', 'success');
      setExtendPrompt(false);
      setExtendDays(1);
      fetchOrders();
    } catch (e) {
      showNotification('Failed to request extension.', 'error');
    }
  };

  const filtered = activeTab === 'ALL' ? orders : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING_APPROVAL;
    const carImgPath = o.carImage || o.car?.images?.[0] || null;
    const carImg = getImageUrl(carImgPath);

    const paymentStatusColor = 
      ['PAID', 'Confirmed'].includes(o.paymentStatus) ? { bg: '#228B22', text: '#FFF', label: '✅ CONFIRMED — Recorded in Finance' } :
      ['REJECTED', 'Rejected'].includes(o.paymentStatus) ? { bg: '#F44336', text: '#FFF', label: '❌ REJECTED — Contact Support' } :
                                                           { bg: '#FF8F00', text: '#FFF', label: '⏳ PENDING — Awaiting Finance Verification' };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: notification.type === 'error' ? '#F44336' : '#4CAF50', color: '#FFF', padding: '16px 24px', fontWeight: 600, fontSize: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', borderRadius: 0 }}>
            {notification.msg}
          </div>
        )}

        {/* ── BACK BUTTON + ORDER HEADER ── */}
        <div style={{ background: '#228B22', borderBottom: '4px solid #1B5E20', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => { setSelectedOrder(null); setCancelPrompt(false); setExtendPrompt(false); setSelectedFile(null); }} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1B5E20', color: '#FFF', border: 'none', padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '4px 4px 0px #0A3A10', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: 0 }} 
              onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0A3A10'; }} 
              onMouseUp={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0A3A10'; }}>
              <ArrowLeft size={16} /> BACK
            </button>
            <div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.8rem)', color: '#FFF', margin: 0, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                RENTAL #{o.orderNumber}
              </h1>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', padding: '6px 14px', background: cfg.bg, border: `2px solid ${cfg.border}`, color: cfg.color, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', borderRadius: 0 }}>
                  {cfg.label}
                </span>
                <span style={{ color: '#A5D6A7', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {new Date(o.createdAt || o.created_at || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFF', border: '3px solid #1B5E20', padding: '16px 28px', textAlign: 'right', boxShadow: '6px 6px 0px #1B5E20', borderRadius: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#424242', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Total Amount</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#228B22', lineHeight: 1.1 }}>{parseFloat(o.totalAmount || 0).toFixed(2)} ETB</div>
          </div>
        </div>

        {/* ── PAYMENT STATUS BANNER ── */}
        <div style={{ background: paymentStatusColor.bg, padding: '16px 48px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Activity size={20} color={paymentStatusColor.text} />
          <span style={{ color: paymentStatusColor.text, fontWeight: 900, fontSize: 'clamp(0.9rem, 2vw, 1rem)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            FINANCE PAYMENT STATUS: {paymentStatusColor.label}
          </span>
          {['PAID', 'Confirmed'].includes(o.paymentStatus) && (
            <span style={{ marginLeft: 'auto', color: '#A5D6A7', fontSize: '0.85rem', fontWeight: 600 }}>
              Payment recorded in Finance Receivables Book
            </span>
          )}
        </div>

        {/* ── CAR IMAGE — CENTERED ── */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '24px 0', background: '#F5F5F5' }}>
          {carImg && !imgError ? (
            <div style={{ position: 'relative', cursor: 'zoom-in', width: '40%', maxWidth: '400px', borderRadius: 0, overflow: 'hidden', boxShadow: '8px 8px 0px rgba(0,0,0,0.1)', border: '4px solid #1B5E20' }} onClick={() => setSelectedImage(carImg)}>
              <img
                src={carImg}
                alt={o.car?.name || o.carName || 'Vehicle'}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(27,94,32,0.95))', padding: '24px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#A5D6A7', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle</div>
                <div style={{ color: '#FFF', fontSize: 'clamp(1rem, 4vw, 1.4rem)', fontWeight: 900, textTransform: 'uppercase' }}>{o.car?.name || o.carName || 'N/A'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid #A5D6A7', padding: '6px 12px', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: 0 }}>
                  🔍 Zoom
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '40%', maxWidth: '400px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '4px dashed #A5D6A7', borderRadius: 0, background: '#FFF' }}>
              <ImageIcon size={64} color="#A5D6A7" />
              <div style={{ color: '#A5D6A7', fontSize: '1.2rem', fontWeight: 700 }}>{o.car?.name || o.carName || 'No Image Available'}</div>
            </div>
          )}
        </div>

        {/* ── FLAT INFO ROWS ── */}
        <div style={{ background: '#FFFFFF', borderBottom: '4px solid #E0E0E0' }}>
          
          {/* ROW 1: Rental Dates */}
          <div style={{ padding: '32px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <Calendar size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Rental Schedule</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0', borderTop: '3px solid #A5D6A7' }}>
              {[
                { label: 'Pickup Date',    value: new Date(o.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Return Date',    value: new Date(o.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Duration',       value: `${o.totalDays} Days` },
                { label: 'Daily Rate',     value: `${parseFloat(o.car?.dailyRate || o.dailyRate || 0).toFixed(2)} ETB/day` },
              ].map((item, i) => (
                <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '2px solid #F5F5F5' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: Payment Details */}
          <div style={{ padding: '0 48px 32px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <DollarSign size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Summary</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', borderTop: '3px solid #87CEEB' }}>
              {[
                { label: 'Rental Amount',    value: `${parseFloat(o.rentalAmount || 0).toFixed(2)} ETB` },
                { label: 'Security Deposit', value: `${parseFloat(o.securityDeposit || 0).toFixed(2)} ETB` },
                ...(parseFloat(o.extensionFee || 0) > 0 ? [{ label: 'Extension Fee', value: `${parseFloat(o.extensionFee).toFixed(2)} ETB`, valueColor: '#FF9800' }] : []),
                { label: 'Total Due',        value: `${parseFloat(o.totalAmount || 0).toFixed(2)} ETB`, valueColor: '#228B22' },
              ].map((item, i, arr) => (
                <div key={i} style={{ padding: '20px 24px', borderRight: i < arr.length - 1 ? '2px solid #F5F5F5' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#0288D1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: item.valueColor || '#424242' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS & UPLOADS */}
          <div style={{ padding: '0 48px 48px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <Activity size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Manage Rental</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              {/* Payment Upload */}
              {o.status === 'APPROVED' && (
                <div style={{ flex: '1 1 250px', minWidth: 0, background: '#FFF', border: '3px solid #A5D6A7', padding: '24px', borderRadius: 0 }}>
                  <div style={{ fontWeight: 800, color: '#228B22', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Upload Payment Proof</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input type="file" ref={fileRef} onChange={e => setSelectedFile(e.target.files[0])} style={{ padding: '12px', border: '2px dashed #A5D6A7', background: '#F5F5F5', color: '#424242', cursor: 'pointer', borderRadius: 0 }} />
                    <button onClick={handleUploadProof} disabled={!selectedFile || uploadingFor} style={{ 
                      background: '#2E8B57', border: '3px solid #1B5E20', color: '#FFF', padding: '12px 24px', 
                      fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                      cursor: selectedFile ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: selectedFile ? '4px 4px 0px #1B5E20' : 'none', transition: 'all 0.1s', borderRadius: 0
                    }}
                    onMouseDown={e => { if(selectedFile) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #1B5E20'; } }} 
                    onMouseUp={e => { if(selectedFile) { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #1B5E20'; } }}>
                      <Upload size={18} /> {uploadingFor ? 'UPLOADING...' : 'SUBMIT PROOF'}
                    </button>
                  </div>
                </div>
              )}

              {/* Extension */}
              {o.status === 'ACTIVE' && (
                <div style={{ flex: '1 1 250px', minWidth: 0, background: '#FFF', border: '3px solid #87CEEB', padding: '24px', borderRadius: 0 }}>
                  <div style={{ fontWeight: 800, color: '#0288D1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Extend Rental</div>
                  {!extendPrompt ? (
                    <button onClick={() => setExtendPrompt(true)} style={{ 
                      width: '100%', background: '#FFF', border: '3px solid #0288D1', color: '#0288D1', padding: '12px 24px', 
                      fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '4px 4px 0px #0288D1', transition: 'all 0.1s', borderRadius: 0
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0288D1'; }} 
                    onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0288D1'; }}>
                      <Plus size={18} /> REQUEST EXTENSION
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#424242', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>How many days?</div>
                        <input type="number" min="1" value={extendDays} onChange={e => setExtendDays(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '2px solid #87CEEB', borderRadius: 0, fontWeight: 700, color: '#424242' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <button onClick={handleExtend} style={{ flex: 1, background: '#87CEEB', color: '#0288D1', border: '3px solid #0288D1', padding: '12px', fontWeight: 900, cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' }}>SUBMIT</button>
                         <button onClick={() => setExtendPrompt(false)} style={{ flex: 1, background: 'transparent', color: '#424242', border: '3px solid #E0E0E0', padding: '12px', fontWeight: 900, cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' }}>CANCEL</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation */}
              {['PENDING_APPROVAL', 'APPROVED'].includes(o.status) && (
                <div style={{ flex: '1 1 250px', minWidth: 0, background: '#FFF', border: '3px solid #F44336', padding: '24px', borderRadius: 0 }}>
                  <div style={{ fontWeight: 800, color: '#B71C1C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Cancel Rental</div>
                  {!cancelPrompt ? (
                    <button onClick={() => setCancelPrompt(true)} style={{ 
                      width: '100%', background: '#F44336', border: '3px solid #B71C1C', color: '#FFF', padding: '12px 24px', 
                      fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '4px 4px 0px #B71C1C', transition: 'all 0.1s', borderRadius: 0
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #B71C1C'; }} 
                    onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #B71C1C'; }}>
                      <XSquare size={18} /> CANCEL RENTAL
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#B71C1C', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Reason for cancellation:</div>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '2px solid #F44336', borderRadius: 0, minHeight: '80px', fontFamily: 'inherit', color: '#424242', fontWeight: 600 }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <button onClick={handleCancel} style={{ flex: 1, background: '#F44336', color: '#FFF', border: '3px solid #B71C1C', padding: '12px', fontWeight: 900, cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' }}>CONFIRM</button>
                         <button onClick={() => setCancelPrompt(false)} style={{ flex: 1, background: 'transparent', color: '#B71C1C', border: '3px solid #F44336', padding: '12px', fontWeight: 900, cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase' }}>BACK</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }} onClick={() => setSelectedImage(null)}>
            <button style={{ position: 'absolute', top: 20, right: 20, background: '#F44336', border: '4px solid #B71C1C', color: '#fff', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '4px 4px 0px #000', fontSize: '1.5rem', fontWeight: 900, borderRadius: 0 }} onClick={() => setSelectedImage(null)}>✕</button>
            <img src={selectedImage} alt="Full View" style={{ maxWidth: '96%', maxHeight: '92vh', objectFit: 'contain', border: '4px solid #228B22', boxShadow: '0 0 60px rgba(0,0,0,0.8)', background: '#FFF' }} onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' }}>
      
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: notification.type === 'error' ? '#F44336' : '#4CAF50',
          color: '#FFF', padding: '16px 24px', fontWeight: 600, fontSize: '1rem',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)', borderRadius: 0,
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {notification.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ width: '100%', background: '#1B5E20', borderBottom: '4px solid #0A3A10' }}>
        <div style={{ padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: '#FFF', border: '4px solid #228B22', padding: '16px', boxShadow: '6px 6px 0px #0A3A10', borderRadius: 0 }}>
              <Car size={48} color="#228B22" />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, color: '#FFF', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Car Rentals</h1>
              <div style={{ fontSize: '1.1rem', color: '#A5D6A7', fontWeight: 700, marginTop: '8px' }}>Manage your vehicle reservations</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            
            {/* Stat Box */}
            <div style={{ background: '#2E8B57', border: '4px solid #0A3A10', padding: '16px 32px', textAlign: 'center', boxShadow: '6px 6px 0px #0A3A10', borderRadius: 0 }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{orders.length}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#A5D6A7', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => navigate('/services/car-renting')} style={{ 
                flex: '1 1 auto', minWidth: '140px',
                background: '#8BC34A', border: '4px solid #558B2F', color: '#1B5E20', 
                padding: '14px 16px', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '5px 5px 0px #558B2F', transition: 'all 0.1s', whiteSpace: 'nowrap', borderRadius: 0
              }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #558B2F'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '5px 5px 0px #558B2F'; }}>
                <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>+</span> NEW RENTAL
              </button>
              
              <button onClick={handleRefresh} disabled={refreshing} style={{ 
                flex: '1 1 auto', minWidth: '140px',
                background: '#FFF', border: '4px solid #1B5E20', color: '#1B5E20', 
                padding: '14px 16px', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                boxShadow: '5px 5px 0px #0A3A10', transition: 'all 0.1s', whiteSpace: 'nowrap', borderRadius: 0
              }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0A3A10'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '5px 5px 0px #0A3A10'; }}>
                <RefreshCw size={18} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> REFRESH
              </button>
            </div>

          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', background: '#228B22', flexWrap: 'wrap', borderBottom: '4px solid #E0E0E0' }}>
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const TabIcon = tab.Icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: '1 1 auto', minWidth: '120px', justifyContent: 'center',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1B5E20' : '#A5D6A7',
                border: 'none', borderTop: active ? '4px solid #8BC34A' : '4px solid transparent',
                padding: '18px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: 900, fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'all 0.2s', whiteSpace: 'nowrap', borderRadius: 0
              }}>
                <TabIcon size={20} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '48px', background: '#F5F5F5', minHeight: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 160, background: '#E0E0E0', border: '3px solid #BDBDBD', boxShadow: '6px 6px 0px #BDBDBD', animation: 'pulse 1.5s infinite', borderRadius: 0 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFF', border: '4px solid #228B22', boxShadow: '8px 8px 0px #228B22', borderRadius: 0 }}>
            <Car size={80} color="#A5D6A7" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2rem', color: '#1B5E20', margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>No Rentals Found</h2>
            <p style={{ fontSize: '1.2rem', color: '#424242', marginTop: '12px' }}>You don't have any car rentals in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_APPROVAL;
              
              return (
                <div key={order.id} onClick={() => setSelectedOrder(order)} style={{
                  background: '#FFF',
                  border: '3px solid #1B5E20',
                  borderLeft: `12px solid ${cfg.bg}`,
                  boxShadow: '6px 6px 0px #1B5E20',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: 'all 0.1s',
                  borderRadius: 0
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translate(-4px, -4px)'; e.currentTarget.style.boxShadow = '10px 10px 0px #1B5E20'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1B5E20'; }}>
                  
                  {/* Info Section */}
                  <div style={{ flex: 1, minWidth: 0, padding: 'clamp(16px, 3vw, 32px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '1rem', color: '#6B8E23', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Rental #{order.orderNumber}</div>
                        <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#1B5E20', fontWeight: 900, marginTop: '8px', textTransform: 'uppercase', overflowWrap: 'break-word' }}>{order.car?.name || order.carName || 'Vehicle'}</div>
                      </div>
                      
                      <div style={{ background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}`, padding: '8px 16px', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', borderRadius: 0 }}>
                        {cfg.label}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', background: '#F5F5F5', padding: '16px', border: '2px solid #A5D6A7' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Total Amount</div>
                        <div style={{ fontSize: '1.2rem', color: '#228B22', fontWeight: 900 }}>{parseFloat(order.totalAmount || 0).toFixed(2)} ETB</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Pickup Date</div>
                        <div style={{ fontSize: '1.1rem', color: '#424242', fontWeight: 700 }}>{new Date(order.pickupDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Duration</div>
                        <div style={{ fontSize: '1.1rem', color: '#424242', fontWeight: 700 }}>{order.totalDays} Days</div>
                      </div>
                    </div>

                  </div>

                  {/* Action arrow */}
                  <div style={{ width: 'clamp(40px, 8vw, 80px)', flexShrink: 0, background: '#F5F5F5', borderLeft: '3px solid #1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={36} color="#1B5E20" style={{ maxWidth: '100%' }} />
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
