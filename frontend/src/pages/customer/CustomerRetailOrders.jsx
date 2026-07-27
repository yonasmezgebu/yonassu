import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckCircle, XCircle, Store, RefreshCw,
  ArrowLeft, Calendar, DollarSign, Truck, Package, Hash,
  ShoppingCart
} from 'lucide-react';

const BASE = 'http://localhost:5000';

const STATUS_CONFIG = {
  PROCESSING:       { label: 'Processing',        color: '#3f6212', bg: '#f7fee7', border: '#d9f99d', dot: '#84cc16' }, 
  SHIPPED:          { label: 'Shipped',           color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' }, 
  DELIVERED:        { label: 'Delivered',         color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' }, 
  CANCELLED:        { label: 'Cancelled',         color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' }, 
  AWAITING_PAYMENT: { label: 'Awaiting Payment',  color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
  AWAITING_PICKUP:  { label: 'Awaiting Pickup',   color: '#064e3b', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
};

const STATUS_TABS = [
  { key: 'ALL',              label: 'ALL ORDERS', Icon: ClipboardList },
  { key: 'PROCESSING',       label: 'PROCESSING', Icon: Clock },
  { key: 'SHIPPED',          label: 'SHIPPED',    Icon: Truck },
  { key: 'DELIVERED',        label: 'DELIVERED',  Icon: CheckCircle },
];

export default function CustomerRetailOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/retail/orders/my-orders');
      if (res.status === 'success') setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load retail orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/retail/orders/my-orders');
      if (res.status === 'success') setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to refresh', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this retail order?')) return;
    try {
      await axios.put(`/retail/orders/${id}/status`, { status: 'CANCELLED' });
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation requires contacting support.');
    }
  };

  const filtered = activeTab === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — 3D Green Theme
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.PROCESSING;
    
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#e6f2e8', 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        padding: '32px 24px 60px', 
        fontFamily: "'Inter', sans-serif" 
      }}>
        
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          <button onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#166534', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', marginBottom: 16, transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
            <ArrowLeft size={16} /> Back to Retail Orders
          </button>

          {/* Dark Forest Green 3D Header Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #064e3b 0%, #14532d 100%)', 
            borderRadius: 16,
            padding: '36px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            boxShadow: '0 20px 25px -5px rgba(6, 78, 59, 0.4), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -4px 0 rgba(0,0,0,0.2)'
          }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', color: '#ecfdf5', margin: 0, fontWeight: 700, letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                #{o.invoice_number}
              </h1>
              <div>
                <span style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: 20, color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(52,211,153,0.2)' }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a7f3d0', fontSize: '0.9rem' }}>
                <Calendar size={14} /> {new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(o.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Right Price Card 3D */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '24px 32px', textAlign: 'right', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 16px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Total Amount</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#34d399', textShadow: '0 0 20px rgba(52, 211, 153, 0.4)', lineHeight: 1 }}>
                {parseFloat(o.total_amount || 0).toFixed(2)} ETB
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 15px 35px -5px rgba(22, 101, 52, 0.15), 0 4px 6px -2px rgba(22, 101, 52, 0.05)' }}>
            
            {/* Card Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', background: 'linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%)', borderBottom: '2px solid #d1fae5' }}>
              <div style={{ padding: '24px 32px', fontSize: '1.4rem', fontWeight: 700, color: '#064e3b' }}>
                Order Items & Details
              </div>
            </div>

            {/* Card Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: '#ffffff' }}>
              
              {/* Left Column - Details */}
              <div style={{ padding: '32px', borderRight: '2px solid #d1fae5', display: 'flex', flexDirection: 'column', gap: 40 }}>
                
                {/* Product Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {o.items && o.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 24, paddingBottom: 16, borderBottom: idx < o.items.length -1 ? '1px dashed #d1fae5' : 'none' }}>
                      <div style={{ width: 100, height: 100, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 0 #fff, 0 8px 16px rgba(0, 0, 0, 0.05)' }}>
                        {item.product_image ? (
                           <img src={item.product_image.startsWith('http') ? item.product_image : `${BASE}${item.product_image.startsWith('/') ? '' : '/'}${item.product_image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                        ) : (
                           <Package size={40} color="#cbd5e1" />
                        )}
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064e3b', marginBottom: 8 }}>{item.product_name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Quantity</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#14532d' }}>{item.quantity} x {parseFloat(item.price || (item.subtotal / item.quantity)).toFixed(2)} ETB</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Subtotal</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#059669' }}>{parseFloat(item.subtotal).toFixed(2)} ETB</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Status & Info */}
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', background: '#f7fee7' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    <Hash size={16} /> CURRENT STATUS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.2rem', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '12px 16px', borderRadius: 8, border: `1px solid ${cfg.border}` }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 0 3px rgba(34, 197, 94, 0.2)` }} />
                    {cfg.label}
                  </div>

                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 24, border: '1px solid #d1fae5', boxShadow: 'inset 0 1px 0 #fff', marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 16 }}>
                      <ClipboardList size={16} /> CONTACT INFO
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #a7f3d0', paddingBottom: 12 }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Full Name</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>
                          {o.customer_name || 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #a7f3d0', paddingBottom: 12 }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Email</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>
                          {o.customer_email || 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Phone</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>
                          {o.customer_phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {o.status === 'PROCESSING' && (
                      <button onClick={() => handleCancel(o.id)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)', border: 'none', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 0 #7f1d1d, 0 10px 20px rgba(0,0,0,0.2)', transition: 'transform 0.1s, box-shadow 0.1s' }} onMouseDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 0 #7f1d1d, 0 4px 10px rgba(0,0,0,0.2)'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 0 #7f1d1d, 0 10px 20px rgba(0,0,0,0.2)'; }}>
                        <XCircle size={18} /> CANCEL RETAIL ORDER
                      </button>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW — Emerald & Leaf Green 3D Theme
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#ecfdf5', fontFamily: "'Inter', sans-serif" }}>

      {/* ── PREMIUM EMERALD HEADER ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(180deg, #dcfce7 0%, #a7f3d0 100%)',
        borderBottom: '2px solid #6ee7b7',
        boxShadow: '0 10px 25px rgba(5, 150, 105, 0.1)'
      }}>
        <div style={{ padding: '32px 48px 0' }}>

          {/* ── Top Row: Title + Buttons ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>

            {/* Left: Title + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', padding: 12, borderRadius: 16, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), 0 8px 16px rgba(4, 120, 87, 0.3)' }}>
                  <Store size={36} color="#fff" />
                </div>
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  color: '#064e3b',
                  margin: 0,
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 4px rgba(255,255,255,0.8)'
                }}>Retail Orders</h1>
              </div>

              {/* Moss Green Counter Bubble */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 80, height: 80, borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #4ade80, #16a34a)',
                boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.6), inset 0 -4px 8px rgba(0,0,0,0.2), 0 10px 20px rgba(22, 163, 74, 0.4)',
                border: '3px solid #bbf7d0',
                color: '#fff',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{orders.length}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>orders</span>
              </div>
            </div>

            {/* Right: Refresh + New Request */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>

              {/* 3D Glass Refresh Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh orders"
                  style={{
                    width: 68, height: 68, borderRadius: '50%', border: 'none',
                    cursor: refreshing ? 'wait' : 'pointer', padding: 0,
                    background: 'conic-gradient(from 45deg, #a7f3d0, #ecfdf5, #6ee7b7, #ecfdf5, #a7f3d0)',
                    boxShadow: refreshing
                      ? 'inset 0 4px 10px rgba(5, 150, 105, 0.3), 0 2px 4px rgba(5, 150, 105, 0.1)'
                      : '0 8px 16px rgba(5, 150, 105, 0.25), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(5, 150, 105, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: refreshing ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: refreshing
                      ? 'linear-gradient(145deg, #6ee7b7 0%, #a7f3d0 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #dcfce7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 6px rgba(5, 150, 105, 0.2), 0 1px 2px rgba(255,255,255,0.8)'
                  }}>
                    <RefreshCw
                      size={24}
                      color={refreshing ? '#047857' : '#059669'}
                      strokeWidth={2.5}
                      style={refreshing ? { animation: 'spin 0.7s linear infinite' } : {}}
                    />
                  </div>
                </button>
                <span style={{
                  fontSize: '0.75rem',
                  color: refreshing ? '#047857' : '#059669',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s'
                }}>
                  {refreshing ? 'Loading...' : 'Refresh'}
                </span>
              </div>

              {/* Glossy Forest Green New Request Button */}
              <div style={{
                padding: 6, borderRadius: 16,
                background: 'rgba(255,255,255,0.4)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 12px 24px rgba(6, 78, 59, 0.2)'
              }}>
                <button onClick={() => navigate('/services/retail')} style={{
                  background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                  border: '1px solid #064e3b',
                  borderRadius: 12,
                  padding: '16px 40px',
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)',
                  letterSpacing: '0.02em',
                  transition: 'all 0.15s ease'
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = 'inset 0 2px 2px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.2)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 2px 2px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)'; }}
                >
                  <span style={{ fontSize: '1.6rem', fontWeight: 400, lineHeight: 1 }}>+</span> New Order
                </button>
              </div>
            </div>
          </div>

          {/* ── Sage Green Tabs Bar ── */}
          <div style={{
            display: 'flex',
            background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
            borderRadius: '12px 12px 0 0',
            border: '2px solid #6ee7b7',
            borderBottom: 'none',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 10px rgba(5, 150, 105, 0.05)',
            overflow: 'hidden'
          }}>
            {STATUS_TABS.map((tab, idx) => {
              const active = activeTab === tab.key;
              const TabIcon = tab.Icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '18px 20px',
                    border: 'none',
                    borderRight: idx < STATUS_TABS.length - 1 ? '2px solid #6ee7b7' : 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    position: 'relative',
                    transition: 'all 0.2s',
                    background: active
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,1) 100%)'
                      : 'transparent',
                    color: active ? '#064e3b' : '#059669',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    letterSpacing: '0.08em'
                  }}>
                  {/* Emerald glowing top-bar for active */}
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: '10%', right: '10%',
                      height: 5,
                      background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                      boxShadow: '0 2px 12px rgba(16, 185, 129, 0.8)',
                      borderRadius: '0 0 4px 4px'
                    }} />
                  )}
                  <TabIcon size={20} color={active ? '#047857' : '#34d399'} strokeWidth={2.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '24px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 130, borderRadius: 12, background: 'linear-gradient(110deg, #dcfce7 8%, #ecfdf5 18%, #dcfce7 33%)', backgroundSize: '200% 100%', animation: 'shine 1.4s linear infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '100px 20px', background: '#ffffff', borderRadius: 16, border: '2px solid #dcfce7', boxShadow: '0 10px 25px rgba(5, 150, 105, 0.05)', color: '#059669' }}>
            <div style={{ padding: 24, background: '#ecfdf5', borderRadius: '50%', border: '2px dashed #6ee7b7' }}>
              <ShoppingCart size={64} color="#34d399" />
            </div>
            <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#047857' }}>No retail orders found for this status.</p>
            <button onClick={() => navigate('/services/retail')}
              style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', marginTop: 10 }}>
              Shop Retail Store
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PROCESSING;
              const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={order.id} onClick={() => { setSelectedOrder(order); }}
                  style={{ 
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', 
                    borderRadius: 12, 
                    border: '1px solid #d1fae5',
                    borderLeft: `6px solid ${cfg.dot}`, 
                    cursor: 'pointer', 
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)', 
                    boxShadow: '0 8px 15px -3px rgba(6, 78, 59, 0.08), 0 4px 6px -2px rgba(6, 78, 59, 0.04)', 
                    padding: '20px 32px', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'stretch' 
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(6, 78, 59, 0.12), 0 10px 10px -5px rgba(6, 78, 59, 0.08)'; e.currentTarget.style.border = '1px solid #6ee7b7'; e.currentTarget.style.borderLeft = `6px solid ${cfg.dot}`; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(6, 78, 59, 0.08), 0 4px 6px -2px rgba(6, 78, 59, 0.04)'; e.currentTarget.style.border = '1px solid #d1fae5'; e.currentTarget.style.borderLeft = `6px solid ${cfg.dot}`; }}>
                  
                  {/* LEFT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem', letterSpacing: '0.05em' }}>ORDER #{order.invoice_number}</div>
                    
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#064e3b', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {order.items && order.items.length > 0 ? (
                           <span>{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</span>
                        ) : (
                           <span>Order Items</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.95rem', color: '#14532d', marginTop: 12, fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                          <DollarSign size={16} /> 
                          {parseFloat(order.total_amount || 0).toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CENTER COLUMN (Date) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={16} /> {dateStr}
                    </span>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: cfg.bg, padding: '6px 14px', borderRadius: 20, border: `1px solid ${cfg.border}` }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}` }} />
                      <span style={{ fontWeight: 800, color: cfg.color, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</span>
                    </div>
                    
                    <div style={{ background: 'rgba(5, 150, 105, 0.1)', borderRadius: 10, padding: 4, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} style={{
                        background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                        color: '#fff',
                        border: '1px solid #064e3b',
                        borderRadius: 8,
                        padding: '8px 20px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 10px rgba(4, 120, 87, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>View Order &rarr;</button>
                    </div>

                    {order.status === 'PROCESSING' && (
                      <div style={{ marginTop: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }} style={{
                          background: 'transparent',
                          color: '#ef4444',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <XCircle size={14} /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes shine { to { background-position-x: -200%; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
