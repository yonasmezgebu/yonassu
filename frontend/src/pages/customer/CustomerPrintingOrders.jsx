import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckCircle, XCircle, Printer, RefreshCw,
  ArrowLeft, User, Hash, Calendar, DollarSign, Image, AlertCircle, FileText, Truck, BookOpen
} from 'lucide-react';

const BASE = 'http://localhost:5000';

const STATUS_CONFIG = {
  received:         { label: 'Received',          color: '#166534', bg: '#dcfce7', border: '#bbf7d0', dot: '#22c55e' }, // Emerald/Forest
  processing:       { label: 'Processing',        color: '#3f6212', bg: '#f7fee7', border: '#d9f99d', dot: '#84cc16' }, // Olive/Lime
  ready_for_pickup: { label: 'Ready for Pickup',  color: '#064e3b', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' }, // Emerald/Dark Moss
  completed:        { label: 'Completed',         color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' }, // Forest
  cancelled:        { label: 'Cancelled',         color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' }, // Red (for clear cancellation)
};

const STATUS_TABS = [
  { key: 'all',              label: 'ALL ORDERS', Icon: ClipboardList },
  { key: 'received',         label: 'RECEIVED',   Icon: Clock },
  { key: 'processing',       label: 'PROCESSING', Icon: RefreshCw },
  { key: 'ready_for_pickup', label: 'READY',      Icon: CheckCircle },
];

export default function CustomerPrintingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [imgError, setImgError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/printing/customer/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to load printing orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/printing/customer/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to refresh', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this printing order?')) return;
    try {
      // Assuming a generic cancel endpoint or you can implement one. 
      // For now, if no endpoint exists, it will catch and alert.
      await axios.delete(`/printing/orders/${id}/cancel`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation requires contacting support for printing orders.');
    }
  };

  const filtered = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status_code === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — 3D Green Theme
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status_code] || STATUS_CONFIG.received;
    
    // Parse attachments if it exists (JSON array)
    let attachment = null;
    if (o.attachments) {
      try {
        const atts = JSON.parse(o.attachments);
        if (atts && atts.length > 0) attachment = atts[0];
      } catch (e) { console.error("Could not parse attachments"); }
    }

    const docSrc = attachment?.path 
      ? (attachment.path.startsWith('http') ? attachment.path : `${BASE}/${attachment.path.replace(/\\/g, '/')}`)
      : null;

    // Check if attachment is an image
    const isImage = attachment && attachment.mimeType?.startsWith('image/');

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#e6f2e8', // Very light sage green background
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        padding: '32px 24px 60px', 
        fontFamily: "'Inter', sans-serif" 
      }}>
        
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          <button onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#166534', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', marginBottom: 16, transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
            <ArrowLeft size={16} /> Back to Printing Orders
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
                #{o.order_number}
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
                {parseFloat(o.total_price || 0).toFixed(2)} ETB
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 15px 35px -5px rgba(22, 101, 52, 0.15), 0 4px 6px -2px rgba(22, 101, 52, 0.05)' }}>
            
            {/* Card Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: 'linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%)', borderBottom: '2px solid #d1fae5' }}>
              <div style={{ padding: '24px 32px', borderRight: '2px solid #d1fae5', fontSize: '1.4rem', fontWeight: 700, color: '#064e3b' }}>
                Printing Details
              </div>
              <div style={{ padding: '24px 32px', fontSize: '1.4rem', fontWeight: 700, color: '#064e3b' }}>
                Document Attachment
              </div>
            </div>

            {/* Card Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: '#ffffff' }}>
              
              {/* Left Column - Details */}
              <div style={{ padding: '32px', borderRight: '2px solid #d1fae5', display: 'flex', flexDirection: 'column', gap: 40 }}>
                
                {/* Product Type & Basic Specs */}
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ width: 140, height: 140, borderRadius: 16, background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 0 #fff, 0 8px 16px rgba(34, 197, 94, 0.2)' }}>
                    <BookOpen size={64} color="#15803d" />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1, alignContent: 'start' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Service Type</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#064e3b' }}>{o.product_type}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Paper / Binding</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#14532d' }}>{o.paper_type} | {o.binding_type || 'None'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Quantity</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#14532d' }}>{o.quantity} Copy(s) <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 400 }}>({o.pages_per_copy} pgs each)</span></div>
                    </div>
                  </div>
                </div>

                {/* Additional Instructions & Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                  
                  {/* Info Box */}
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 24, border: '1px solid #d1fae5', boxShadow: 'inset 0 1px 0 #fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 16 }}>
                      <ClipboardList size={16} /> ORDER SPECIFICS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #a7f3d0', paddingBottom: 12 }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Color Printing</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: o.color_printing ? '#b91c1c' : '#047857' }}>
                          {o.color_printing ? 'YES (Color)' : 'NO (B&W)'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #a7f3d0', paddingBottom: 12 }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Due Date</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>
                          {o.due_date ? new Date(o.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>Special Instructions:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#064e3b', fontStyle: 'italic' }}>
                          {o.special_instructions || 'None provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      <Hash size={16} /> CURRENT STATUS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.2rem', fontWeight: 700, color: '#064e3b', background: '#ecfdf5', padding: '12px 16px', borderRadius: 8, border: `1px solid ${cfg.border}` }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 0 3px rgba(34, 197, 94, 0.2)` }} />
                      {cfg.label}
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      {o.status_code === 'received' && (
                        <button onClick={() => handleCancel(o.id)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)', border: 'none', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 0 #7f1d1d, 0 10px 20px rgba(0,0,0,0.2)', transition: 'transform 0.1s, box-shadow 0.1s' }} onMouseDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 0 #7f1d1d, 0 4px 10px rgba(0,0,0,0.2)'; }} onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 0 #7f1d1d, 0 10px 20px rgba(0,0,0,0.2)'; }}>
                          <XCircle size={18} /> CANCEL PRINTING ORDER
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Attachment */}
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', background: '#f7fee7' }}>
                
                <div style={{ flex: 1, border: docSrc ? 'none' : '3px dashed #bef264', borderRadius: 16, background: docSrc ? 'none' : 'rgba(217, 249, 157, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', marginBottom: 24, minHeight: 360, boxShadow: docSrc ? 'none' : 'inset 0 4px 20px rgba(132, 204, 22, 0.1)' }}>
                  {!docSrc ? (
                    <>
                      <div style={{ background: '#ecfccb', border: '2px solid #a3e635', borderRadius: 20, width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 16px rgba(132, 204, 22, 0.2)' }}>
                        <FileText size={44} color="#65a30d" />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3f6212', marginBottom: 12 }}>No document<br/>attached</div>
                      <div style={{ fontSize: '0.95rem', color: '#4d7c0f', lineHeight: 1.5, maxWidth: 280, fontWeight: 500 }}>
                        No file was attached to this order online. You must provide the document physically at the printing shop.
                      </div>
                    </>
                  ) : imgError || !isImage ? (
                    <div style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid #d1fae5', boxShadow: '0 10px 25px rgba(22, 101, 52, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FileText size={56} color="#059669" style={{ marginBottom: 20 }} />
                        <div style={{ fontWeight: 800, color: '#064e3b', marginBottom: 12, fontSize: '1.2rem' }}>Document Attached</div>
                        <div style={{ color: '#15803d', marginBottom: 24, fontSize: '0.9rem', fontWeight: 600 }}>{attachment?.originalName || 'File'}</div>
                        <a href={docSrc} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)', display: 'inline-block' }}>Download / View File</a>
                    </div>
                  ) : (
                    <div 
                      style={{ width: '100%', height: '100%', padding: 12, background: '#fff', border: '1px solid #bbf7d0', borderRadius: 16, cursor: 'zoom-in', boxShadow: '0 10px 30px rgba(22, 101, 52, 0.15)' }}
                      onClick={() => setSelectedImage(docSrc)}
                    >
                      <img src={docSrc} alt="Attached Document" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6, 78, 59, 0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '40px' }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            onClick={() => setSelectedImage(null)}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <XCircle size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Document Full View" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
                  <Printer size={36} color="#fff" />
                </div>
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  color: '#064e3b',
                  margin: 0,
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 4px rgba(255,255,255,0.8)'
                }}>Printing Orders</h1>
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
                <button onClick={() => navigate('/services/printing')} style={{
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
              <Printer size={64} color="#34d399" />
            </div>
            <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#047857' }}>No printing orders found for this status.</p>
            <button onClick={() => navigate('/services/printing')}
              style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', marginTop: 10 }}>
              Order Print Service
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status_code] || STATUS_CONFIG.received;
              const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={order.id} onClick={() => { setImgError(false); setSelectedOrder(order); }}
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
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem', letterSpacing: '0.05em' }}>ORDER #{order.order_number}</div>
                    
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#064e3b', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {order.product_type} 
                        {order.color_printing ? <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)', color: 'white', borderRadius: 10, textTransform: 'uppercase' }}>Color</span> : <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#e5e7eb', color: '#4b5563', borderRadius: 10, textTransform: 'uppercase' }}>B&W</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.95rem', color: '#14532d', marginTop: 12, fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={16} color="#059669"/> {order.paper_type}</span>
                        <span style={{ color: '#d1fae5' }}>|</span>
                        <span>Qty: {order.quantity} ({order.pages_per_copy} pgs)</span>
                        <span style={{ color: '#d1fae5' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                          <DollarSign size={16} /> 
                          {parseFloat(order.total_price || 0).toFixed(2)} ETB
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
                      <button onClick={(e) => { e.stopPropagation(); setImgError(false); setSelectedOrder(order); }} style={{
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

                    {order.status_code === 'received' && (
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
