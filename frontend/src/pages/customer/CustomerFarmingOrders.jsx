import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Tractor, Clock, CheckSquare, XSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, MapPin, DollarSign, Image as ImageIcon,
  AlertCircle, ChevronRight, FileText, Activity
} from 'lucide-react';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: '#FFFFFF', bg: '#8D6E63', border: '#5D4037' }, // Earth Brown
  approved:  { label: 'Approved',    color: '#FFFFFF', bg: '#8BC34A', border: '#558B2F' }, // Lime Green
  confirmed: { label: 'Confirmed',   color: '#FFFFFF', bg: '#2E8B57', border: '#1B5E20' }, // Emerald
  active:    { label: 'Active',      color: '#FFFFFF', bg: '#87CEEB', border: '#0288D1' }, // Sky Blue
  completed: { label: 'Completed',   color: '#FFFFFF', bg: '#228B22', border: '#006400' }, // Forest Green
  cancelled: { label: 'Cancelled',   color: '#FFFFFF', bg: '#F44336', border: '#B71C1C' }, // Red
};

const STATUS_TABS = [
  { key: 'all',       label: 'ALL ORDERS', Icon: Tractor },
  { key: 'pending',   label: 'PENDING',    Icon: Clock },
  { key: 'active',    label: 'ACTIVE',     Icon: PlaySquare },
  { key: 'completed', label: 'COMPLETED',  Icon: CheckSquare },
];

export default function CustomerFarmingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [imgError, setImgError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load farming orders', err);
      showNotification('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/agrirent-orders/my-orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to refresh', err);
      showNotification('Failed to refresh orders.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this AgriRent order?')) return;
    try {
      await axios.patch(`/agrirent-orders/${id}/status`, { status: 'cancelled' });
      showNotification('Order cancelled successfully.', 'success');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const filtered = activeTab === 'all' 
    ? orders 
    : orders.filter(o => {
        if (activeTab === 'pending') return ['pending', 'approved'].includes(o.status);
        if (activeTab === 'active') return ['confirmed', 'active'].includes(o.status);
        if (activeTab === 'completed') return o.status === 'completed';
        return true;
      });

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    
    const tractorImg = getImageUrl(o.tractor_image);

    const paymentStatusColor = 
      o.payment_status === 'Confirmed' ? { bg: '#228B22', text: '#FFF', label: '✅ CONFIRMED — Recorded in Finance' } :
      o.payment_status === 'Rejected'  ? { bg: '#F44336', text: '#FFF', label: '❌ REJECTED — Contact Support' } :
                                         { bg: '#FF8F00', text: '#FFF', label: '⏳ PENDING — Awaiting Finance Verification' };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: notification.type === 'error' ? '#F44336' : '#4CAF50', color: '#FFF', padding: '16px 24px', fontWeight: 600, fontSize: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
            {notification.msg}
          </div>
        )}

        {/* ── BACK BUTTON + ORDER HEADER ── */}
        <div style={{ background: '#228B22', borderBottom: '4px solid #1B5E20', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedOrder(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1B5E20', color: '#FFF', border: 'none', padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '4px 4px 0px #0A3A10', textTransform: 'uppercase', letterSpacing: '1px' }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0A3A10'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0A3A10'; }}>
              <ArrowLeft size={16} /> BACK
            </button>
            <div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.8rem)', color: '#FFF', margin: 0, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                ORDER #{o.order_number}
              </h1>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', padding: '6px 14px', background: cfg.bg, border: `2px solid ${cfg.border}`, color: cfg.color, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {cfg.label}
                </span>
                <span style={{ color: '#A5D6A7', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFF', border: '3px solid #1B5E20', padding: '16px 28px', textAlign: 'right', boxShadow: '6px 6px 0px #1B5E20' }}>
            <div style={{ fontSize: '0.75rem', color: '#424242', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Total Amount</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#228B22', lineHeight: 1.1 }}>{parseFloat(o.total_amount || 0).toFixed(2)} ETB</div>
          </div>
        </div>

        {/* ── PAYMENT STATUS BANNER ── */}
        <div style={{ background: paymentStatusColor.bg, padding: '16px 48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Activity size={20} color={paymentStatusColor.text} />
          <span style={{ color: paymentStatusColor.text, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            FINANCE PAYMENT STATUS: {paymentStatusColor.label}
          </span>
          {o.payment_status === 'Confirmed' && (
            <span style={{ marginLeft: 'auto', color: '#A5D6A7', fontSize: '0.85rem', fontWeight: 600 }}>
              Payment recorded in Finance Receivables Book
            </span>
          )}
        </div>

        {/* ── TRACTOR IMAGE — CENTERED ── */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 0', background: '#F5F5F5' }}>
          {tractorImg && !imgError ? (
            <div style={{ position: 'relative', cursor: 'zoom-in', width: '40%', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '3px solid #1B5E20' }} onClick={() => setSelectedImage(tractorImg)}>
              <img
                src={tractorImg}
                alt={o.tractor_name || 'Tractor'}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(27,94,32,0.95))', padding: '24px 32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#A5D6A7', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Machine</div>
                  <div style={{ color: '#FFF', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{o.tractor_name || 'N/A'}</div>
                  <div style={{ color: '#A5D6A7', fontSize: '0.9rem', fontWeight: 600 }}>{o.tractor_type_label || 'Tractor'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid #A5D6A7', padding: '6px 12px', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px' }}>
                  🔍 Zoom
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '40%', maxWidth: '400px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '3px dashed #A5D6A7', borderRadius: '8px', background: '#FFF' }}>
              <ImageIcon size={64} color="#A5D6A7" />
              <div style={{ color: '#A5D6A7', fontSize: '1.2rem', fontWeight: 700 }}>{o.tractor_name || 'No Image Available'}</div>
              <div style={{ color: '#6B8E23', fontSize: '1rem' }}>{o.tractor_type_label || 'Tractor'}</div>
            </div>
          )}
        </div>

        {/* ── FLAT INFO ROWS ── */}
        <div style={{ background: '#FFFFFF', borderBottom: '3px solid #E0E0E0' }}>
          
          {/* ROW 1: Rental Dates */}
          <div style={{ padding: '32px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <Calendar size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Rental Schedule</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0', borderTop: '2px solid #A5D6A7' }}>
              {[
                { label: 'Start Date',     value: new Date(o.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'End Date',       value: new Date(o.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Duration',       value: `${o.total_days} Days` },
                { label: 'Daily Rate',     value: `${parseFloat(o.daily_rate || 0).toFixed(2)} ETB/day` },
              ].map((item, i) => (
                <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '2px solid #F5F5F5' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: Field Information */}
          <div style={{ padding: '0 48px 32px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <MapPin size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Field Information</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', borderTop: '2px solid #BCAAA4' }}>
              {[
                { label: 'Field Location', value: o.field_location || 'N/A' },
                { label: 'Size (Hectares)', value: o.field_size_hectares ? `${o.field_size_hectares} ha` : 'N/A' },
                { label: 'Purpose',         value: o.farming_purpose || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '20px 24px', borderRight: i < 2 ? '2px solid #F5F5F5' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8D6E63', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#424242' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {o.special_instructions && (
              <div style={{ padding: '0 0 20px 0', borderTop: '2px solid #F5F5F5' }}>
                <div style={{ fontSize: '0.75rem', color: '#8D6E63', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6, paddingTop: 16 }}>Special Instructions</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, color: '#424242', background: '#FFF8F5', padding: '14px', border: '2px solid #BCAAA4' }}>{o.special_instructions}</div>
              </div>
            )}
          </div>

          {/* ROW 3: Payment Details */}
          <div style={{ padding: '0 48px 48px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
              <DollarSign size={24} color="#1B5E20" />
              <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Details</h2>
              <div style={{ flex: 1, height: '3px', background: '#1B5E20', marginLeft: '16px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', borderTop: '2px solid #B3E5FC' }}>
              {[
                { label: 'Payment Method',    value: o.payment_method || 'N/A' },
                { label: 'Transaction Ref',   value: o.payment_reference || 'Not provided' },
                { label: 'Finance Verification', value: o.payment_status || 'Pending',
                  valueColor: o.payment_status === 'Confirmed' ? '#228B22' : o.payment_status === 'Rejected' ? '#F44336' : '#FF8F00' },
                { label: 'Total Amount',      value: `${parseFloat(o.total_amount || 0).toFixed(2)} ETB`, valueColor: '#228B22' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '2px solid #F5F5F5' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: '#0288D1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.valueColor || '#424242' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Cancel action */}
            {['pending', 'approved'].includes(o.status) && (
              <div style={{ padding: '24px 0', borderTop: '2px solid #F5F5F5' }}>
                <button onClick={() => handleCancel(o.id)} style={{ padding: '14px 32px', background: '#F44336', border: '3px solid #B71C1C', color: '#FFF', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '4px 4px 0px #B71C1C', transition: 'all 0.1s' }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #B71C1C'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #B71C1C'; }}>
                  <XSquare size={20} /> CANCEL RENTAL
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }} onClick={() => setSelectedImage(null)}>
            <button style={{ position: 'absolute', top: 20, right: 20, background: '#F44336', border: '4px solid #B71C1C', color: '#fff', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '4px 4px 0px #000', fontSize: '1.5rem', fontWeight: 900 }} onClick={() => setSelectedImage(null)}>✕</button>
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
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {notification.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ width: '100%', background: '#228B22', borderBottom: '4px solid #1B5E20' }}>
        <div style={{ padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: '#FFF', border: '4px solid #1B5E20', padding: '16px', boxShadow: '6px 6px 0px #1B5E20' }}>
              <Tractor size={48} color="#228B22" />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, color: '#FFF', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>AgriRent Orders</h1>
              <div style={{ fontSize: '1.1rem', color: '#A5D6A7', fontWeight: 700, marginTop: '8px' }}>Manage your machine rentals & field services</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            
            {/* Stat Box */}
            <div style={{ background: '#2E8B57', border: '4px solid #1B5E20', padding: '16px 32px', textAlign: 'center', boxShadow: '6px 6px 0px #1B5E20' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{orders.length}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#A5D6A7', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => navigate('/services/farming')} style={{ 
                background: '#8BC34A', border: '4px solid #558B2F', color: '#1B5E20', 
                padding: '14px 28px', fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '5px 5px 0px #558B2F', transition: 'all 0.1s', whiteSpace: 'nowrap'
              }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #558B2F'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '5px 5px 0px #558B2F'; }}>
                <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>+</span> NEW RENTAL
              </button>
              
              <button onClick={handleRefresh} disabled={refreshing} style={{ 
                background: '#FFF', border: '4px solid #1B5E20', color: '#1B5E20', 
                padding: '14px 28px', fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', 
                cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center',
                boxShadow: '5px 5px 0px #1B5E20', transition: 'all 0.1s', whiteSpace: 'nowrap'
              }} onMouseDown={e => { e.currentTarget.style.transform = 'translate(3px, 3px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #1B5E20'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1B5E20'; }}>
                <RefreshCw size={18} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> REFRESH
              </button>
            </div>

          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', background: '#1B5E20', overflowX: 'auto', overflowY: 'hidden' }}>
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const TabIcon = tab.Icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1B5E20' : '#A5D6A7',
                border: 'none', borderTop: active ? '4px solid #8BC34A' : '4px solid transparent',
                padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
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
              <div key={i} style={{ height: 160, background: '#E0E0E0', border: '2px solid #BDBDBD', boxShadow: '6px 6px 0px #BDBDBD', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFF', border: '4px solid #228B22', boxShadow: '8px 8px 0px #228B22' }}>
            <Tractor size={80} color="#A5D6A7" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2rem', color: '#1B5E20', margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>No Orders Found</h2>
            <p style={{ fontSize: '1.2rem', color: '#424242', marginTop: '12px' }}>You don't have any farming orders in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              
              return (
                <div key={order.id} onClick={() => setSelectedOrder(order)} style={{
                  background: '#FFF',
                  border: '2px solid #228B22',
                  borderLeft: `12px solid ${cfg.bg}`,
                  boxShadow: '6px 6px 0px #228B22',
                  cursor: 'pointer',
                  display: 'flex',
                  transition: 'all 0.1s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translate(-4px, -4px)'; e.currentTarget.style.boxShadow = '10px 10px 0px #228B22'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translate(0, 0)'; e.currentTarget.style.boxShadow = '6px 6px 0px #228B22'; }}>
                  
                  {/* Info Section */}
                  <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1rem', color: '#6B8E23', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Order #{order.order_number}</div>
                        <div style={{ fontSize: '2rem', color: '#1B5E20', fontWeight: 900, marginTop: '8px', textTransform: 'uppercase' }}>{order.tractor_name || 'AgriRent Machine'}</div>
                        <div style={{ fontSize: '1.1rem', color: '#424242', fontWeight: 700, marginTop: '4px' }}>{order.farming_purpose || 'General Farming'}</div>
                      </div>
                      
                      <div style={{ background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.border}`, padding: '8px 16px', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cfg.label}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#F5F5F5', padding: '16px', border: '2px solid #A5D6A7' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Total Amount</div>
                        <div style={{ fontSize: '1.2rem', color: '#228B22', fontWeight: 900 }}>{parseFloat(order.total_amount || 0).toFixed(2)} ETB</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Start Date</div>
                        <div style={{ fontSize: '1.1rem', color: '#424242', fontWeight: 700 }}>{new Date(order.start_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Duration</div>
                        <div style={{ fontSize: '1.1rem', color: '#424242', fontWeight: 700 }}>{order.total_days} Days</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B8E23', fontWeight: 800, textTransform: 'uppercase' }}>Payment</div>
                        <div style={{ fontSize: '1.1rem', color: order.payment_status === 'Confirmed' ? '#228B22' : '#F59E0B', fontWeight: 700 }}>{order.payment_status}</div>
                      </div>
                    </div>

                  </div>

                  {/* Action arrow */}
                  <div style={{ width: '80px', background: '#F5F5F5', borderLeft: '2px solid #228B22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={36} color="#228B22" />
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
