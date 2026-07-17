import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckCircle, XCircle, Package, RefreshCw,
  ArrowLeft, User, Mail, Phone, MapPin, Truck, Hash, Calendar,
  ShoppingBag, DollarSign, Image, AlertCircle, Trash2, FileText
} from 'lucide-react';

const BASE = 'http://localhost:5000';

const STATUS_CONFIG = {
  pending:          { label: 'Pending Review',   color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  approved:         { label: 'Approved',          color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  rejected:         { label: 'Rejected',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
  picked_up:        { label: 'Picked Up',         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#9ca3af' },
  delivered:        { label: 'Delivered',         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#9ca3af' },
};

const STATUS_TABS = [
  { key: 'all',       label: 'ALL ORDERS', Icon: ClipboardList },
  { key: 'pending',   label: 'PENDING',    Icon: Clock },
  { key: 'approved',  label: 'APPROVED',   Icon: CheckCircle },
  { key: 'delivered', label: 'DELIVERED',  Icon: Truck },
];

export default function CustomerPrescriptions() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');
  const [imgError, setImgError]     = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get('/pharmacy/requests/my-requests');
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load prescription requests', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/pharmacy/requests/my-requests');
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to refresh', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await axios.delete(`/pharmacy/requests/${id}/cancel`);
      fetchRequests();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e, id) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('prescription_image', file);
    
    try {
      setIsUploading(true);
      const res = await axios.post(`/pharmacy/requests/${id}/upload`, formData);
      fetchRequests();
      if (selectedOrder) {
        setSelectedOrder(prev => ({ ...prev, prescription_image: res.imageUrl }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW — full single-page layout
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o   = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    const imgSrc = o.prescription_image
      ? (o.prescription_image.startsWith('http') ? o.prescription_image : `${BASE}${o.prescription_image}`)
      : null;
    const medImgSrc = o.medication_image
      ? (o.medication_image.startsWith('http') ? o.medication_image : `${BASE}${o.medication_image}`)
      : null;

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#e2e8f0', // soft grey/blue background similar to marble look
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
        padding: '32px 24px 60px', 
        fontFamily: "'Inter', sans-serif" 
      }}>
        
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          {/* Back Button (moved outside the dark header for exact match) */}
          <button onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back to Orders
          </button>

          {/* Dark Header Card */}
          <div style={{ 
            background: '#11151c', 
            backgroundImage: 'radial-gradient(circle at top right, #1f2937 0%, #11151c 100%)',
            borderRadius: 16,
            padding: '36px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', color: '#fff', margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
                #{o.request_number}
              </h1>
              <div>
                <span style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.4)', borderRadius: 20, color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: '0.9rem' }}>
                <Calendar size={14} /> {new Date(o.requested_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(o.requested_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Right */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '24px 32px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Total Amount</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#5eead4', textShadow: '0 0 20px rgba(94, 234, 212, 0.25)', lineHeight: 1 }}>
                {parseFloat(o.total_amount || 0).toFixed(2)} ETB
              </div>
            </div>
          </div>

          {/* Main White Card */}
          <div style={{ background: '#f4f4f5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}>
            
            {/* Card Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: '#f4f4f5', borderBottom: '1px solid #d4d4d8' }}>
              <div style={{ padding: '24px 32px', borderRight: '1px solid #d4d4d8', fontSize: '1.4rem', fontWeight: 600, color: '#18181b' }}>
                Medication Details
              </div>
              <div style={{ padding: '24px 32px', fontSize: '1.4rem', fontWeight: 600, color: '#18181b' }}>
                Prescription
              </div>
            </div>

            {/* Card Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: '#f4f4f5' }}>
              
              {/* Left Column */}
              <div style={{ padding: '32px', borderRight: '1px solid #d4d4d8', display: 'flex', flexDirection: 'column', gap: 40 }}>
                
                {/* Drug Image + Info */}
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ width: 160, height: 160, borderRadius: 8, background: '#e4e4e7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                    {medImgSrc ? (
                      <img src={medImgSrc} alt={o.medication_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Image size={40} color="#a1a1aa" />
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1, alignContent: 'start' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Medication Name</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#09090b' }}>{o.medication_name}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Quantity</div>
                      <div style={{ fontSize: '1rem', fontWeight: 500, color: '#18181b' }}>{o.quantity} unit(s)</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Delivery Type</div>
                      <div style={{ fontSize: '1rem', fontWeight: 500, color: '#18181b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#059669' }}>{o.delivery_option === 'delivery' ? '🚚' : '🏥'}</span> 
                        {o.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                  
                  {/* Customer Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 16 }}>
                      <User size={16} /> CUSTOMER INFORMATION
                      <img src={`https://ui-avatars.com/api/?name=${o.customer_name}&background=d4d4d8&color=18181b`} alt={o.customer_name} style={{ width: 36, height: 36, borderRadius: 8, marginLeft: 'auto' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d4d4d8', paddingBottom: 16 }}>
                        <span style={{ fontSize: '0.9rem', color: '#52525b' }}>Full Name</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#09090b' }}>{o.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d4d4d8', paddingBottom: 16 }}>
                        <span style={{ fontSize: '0.9rem', color: '#52525b' }}>Email</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#09090b' }}>{o.customer_email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#52525b' }}>Phone</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#09090b' }}>{o.customer_phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      <Hash size={16} /> STATUS & ACTIONS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 600, color: '#09090b' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 0 3px rgba(0,0,0,0.05)` }} />
                      Currently {cfg.label}
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      {o.status === 'pending' && (
                        <button onClick={() => handleCancel(o.id)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)', border: 'none', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 0 #7f1d1d, 0 8px 15px rgba(0,0,0,0.2)' }}>
                          <XCircle size={18} /> CANCEL REQUEST
                        </button>
                      )}
                      {o.status === 'rejected' && (
                        <button onClick={() => navigate('/services/pharmacy')} style={{ width: '100%', padding: '16px', background: 'linear-gradient(180deg, #059669 0%, #047857 100%)', border: 'none', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 4px 0 #065f46, 0 8px 15px rgba(0,0,0,0.2)' }}>
                          SUBMIT NEW REQUEST
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ flex: 1, border: imgSrc ? 'none' : '2px dashed #a1a1aa', borderRadius: 12, background: imgSrc ? 'none' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', marginBottom: 24, minHeight: 360 }}>
                  {!imgSrc ? (
                    <>
                      <div style={{ border: '2px solid #a1a1aa', borderRadius: 16, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
                        <Image size={40} color="#a1a1aa" />
                        <div style={{ position: 'absolute', width: '110%', height: 2, background: '#a1a1aa', transform: 'rotate(-45deg)' }} />
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#18181b', marginBottom: 12 }}>No image<br/>attached</div>
                      <div style={{ fontSize: '0.9rem', color: '#52525b', lineHeight: 1.5, maxWidth: 260 }}>
                        No prescription image attached to this order. The patient may present a physical copy upon pickup.
                      </div>
                    </>
                  ) : imgError ? (
                    <>
                        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                        <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 8, fontSize: '1.1rem' }}>Failed to load image</div>
                        <a href={imgSrc} target="_blank" rel="noreferrer" style={{ color: '#09090b', fontSize: '0.9rem', textDecoration: 'underline' }}>Open Image Directly</a>
                    </>
                  ) : (
                    <div 
                      style={{ width: '100%', height: '100%', padding: 8, background: '#fff', border: '1px solid #d4d4d8', borderRadius: 12, cursor: 'zoom-in' }}
                      onClick={() => setSelectedImage(imgSrc)}
                    >
                      <img src={imgSrc} alt="Prescription" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    </div>
                  )}
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '16px', background: '#09090b', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: isUploading ? 'wait' : 'pointer', border: 'none' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e, o.id)} style={{ display: 'none' }} disabled={isUploading} />
                  <FileText size={18} /> {isUploading ? 'UPLOADING...' : 'UPLOAD MANUALLY'}
                </label>
              </div>

            </div>
          </div>
        </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '40px' }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => setSelectedImage(null)}
          >
            <XCircle size={28} />
          </button>
          <img 
            src={selectedImage} 
            alt="Prescription Full View" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#eeecea', fontFamily: "'Inter', sans-serif" }}>

      {/* ── PREMIUM HEADER ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(180deg, #f5f3ee 0%, #ece9e0 100%)',
        borderBottom: '1px solid #d6d0c4',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ padding: '32px 48px 0' }}>

          {/* ── Top Row: Title + Buttons ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>

            {/* Left: Title + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <h1 style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontSize: '3rem',
                fontWeight: 700,
                color: '#1a1a2e',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1
              }}>My Orders</h1>

              {/* Teal Counter Bubble */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 76, height: 76, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #a7f3d0, #2dd4bf)',
                boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.12), 0 8px 20px rgba(45,212,191,0.4)',
                border: '2px solid rgba(255,255,255,0.6)',
                color: '#065f46',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{requests.length}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>request</span>
              </div>
            </div>

            {/* Right: Refresh + New Request */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>

              {/* Metallic Refresh Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh orders"
                  style={{
                    width: 64, height: 64, borderRadius: '50%', border: 'none',
                    cursor: refreshing ? 'wait' : 'pointer', padding: 0,
                    background: 'conic-gradient(from 45deg, #c8c8cc, #f0f0f2, #9a9a9e, #f0f0f2, #c8c8cc)',
                    boxShadow: refreshing
                      ? 'inset 0 3px 8px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.15)'
                      : '0 6px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: refreshing ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: refreshing
                      ? 'linear-gradient(145deg, #a0a0a4 0%, #c8c8cc 100%)'
                      : 'linear-gradient(145deg, #e8e8ea 0%, #b0b0b4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(255,255,255,0.6)'
                  }}>
                    <RefreshCw
                      size={22}
                      color={refreshing ? '#059669' : '#3f3f46'}
                      strokeWidth={2.5}
                      style={refreshing ? { animation: 'spin 0.7s linear infinite' } : {}}
                    />
                  </div>
                </button>
                <span style={{
                  fontSize: '0.72rem',
                  color: refreshing ? '#059669' : '#71717a',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s'
                }}>
                  {refreshing ? 'Loading...' : 'Refresh'}
                </span>
              </div>

              {/* Glossy New Request Button */}
              <div style={{
                padding: 5, borderRadius: 14,
                background: 'rgba(255,255,255,0.35)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04), 0 10px 24px rgba(5,150,105,0.25)'
              }}>
                <button onClick={() => navigate('/services/pharmacy')} style={{
                  background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
                  border: '1px solid #047857',
                  borderRadius: 10,
                  padding: '14px 36px',
                  color: '#fff',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.45), 0 2px 4px rgba(0,0,0,0.12)',
                  letterSpacing: '0.01em'
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 300, lineHeight: 1 }}>+</span> New Request
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div style={{
            display: 'flex',
            background: 'linear-gradient(180deg, #e8e4da 0%, #f0ede4 100%)',
            borderRadius: '10px 10px 0 0',
            border: '1px solid #cbc6bb',
            borderBottom: 'none',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 6px rgba(0,0,0,0.02)',
            overflow: 'hidden'
          }}>
            {STATUS_TABS.map((tab, idx) => {
              const active = activeTab === tab.key;
              const TabIcon = tab.Icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    borderRight: idx < STATUS_TABS.length - 1 ? '1px solid #cbc6bb' : 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    position: 'relative',
                    transition: 'all 0.2s',
                    background: active
                      ? 'linear-gradient(180deg, rgba(253,230,138,0.35) 0%, rgba(255,255,255,0.5) 100%)'
                      : 'transparent',
                    color: active ? '#92400e' : '#78716c',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.06em'
                  }}>
                  {/* Gold glowing top-bar for active */}
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: '15%', right: '15%',
                      height: 4,
                      background: 'linear-gradient(90deg, transparent, #d97706, transparent)',
                      boxShadow: '0 2px 10px rgba(217,119,6,0.7)',
                      borderRadius: '0 0 4px 4px'
                    }} />
                  )}
                  <TabIcon size={18} color={active ? '#b45309' : '#a8a29e'} strokeWidth={2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 48px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 120, background: 'linear-gradient(110deg,#ececec 8%,#f5f5f5 18%,#ececec 33%)', backgroundSize: '200% 100%', animation: 'shine 1.4s linear infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '80px 20px', background: '#fff', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            <ClipboardList size={56} color="#e2e8f0" />
            <p style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>No orders found.</p>
            <button onClick={() => navigate('/services/pharmacy')}
              style={{ background: '#10b981', border: 'none', color: '#fff', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
              Browse Medications
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const dateStr = new Date(req.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={req.id} onClick={() => { setImgError(false); setSelectedOrder(req); }}
                  style={{ background: '#f6f3eb', borderRadius: 8, borderLeft: `4px solid ${cfg.dot}`, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'stretch' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
                  
                  {/* LEFT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ fontWeight: 600, color: '#18181b', fontSize: '0.95rem' }}>#{req.request_number}</div>
                    
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090b', letterSpacing: '0.02em' }}>{req.medication_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.85rem', color: '#18181b', marginTop: 10 }}>
                        <span>Qty: {req.quantity}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Package size={20} color="#5eead4" style={{ filter: 'drop-shadow(0 2px 4px rgba(45,212,191,0.5))' }} /> 
                          {req.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                        <span>{parseFloat(req.total_amount || 0).toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>

                  {/* CENTER COLUMN (Date) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 2 }}>
                    <span style={{ fontSize: '0.95rem', color: '#18181b' }}>{dateStr}</span>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: '0.95rem', color: '#18181b' }}>{dateStr}</span>
                      <span style={{ fontWeight: 600, color: '#18181b', fontSize: '0.95rem' }}>{cfg.label}</span>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 3, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => { e.stopPropagation(); setImgError(false); setSelectedOrder(req); }} style={{
                        background: 'linear-gradient(180deg, #5ce1e6 0%, #38bdf8 100%)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 6,
                        padding: '6px 16px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>Details &rarr;</button>
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: 3, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleCancel(req.id); }} style={{
                          background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          padding: '6px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          Cancel ✨
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

      <style>{`@keyframes shine { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}
