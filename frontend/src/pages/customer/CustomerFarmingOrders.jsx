import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Tractor, Clock, CheckSquare, PlaySquare, RefreshCw,
  ArrowLeft, Calendar, MapPin, DollarSign, Image as ImageIcon,
  Activity, Eye
} from 'lucide-react';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: '#FFFFFF', bg: '#8D6E63' }, // Earth Brown
  approved:  { label: 'Approved',    color: '#FFFFFF', bg: '#8BC34A' }, // Lime Green
  confirmed: { label: 'Confirmed',   color: '#FFFFFF', bg: '#2E8B57' }, // Emerald
  active:    { label: 'Active',      color: '#FFFFFF', bg: '#87CEEB' }, // Sky Blue
  completed: { label: 'Completed',   color: '#FFFFFF', bg: '#228B22' }, // Forest Green
  cancelled: { label: 'Cancelled',   color: '#FFFFFF', bg: '#F44336' }, // Red
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders', Icon: Tractor },
  { key: 'pending',   label: 'Pending',    Icon: Clock },
  { key: 'active',    label: 'Active',     Icon: PlaySquare },
  { key: 'completed', label: 'Completed',  Icon: CheckSquare },
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

    return (
      <div className="page-container">
        
        {notification && (
          <div className={`toast ${notification.type}`}>
            {notification.msg}
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <h1 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>Order #{o.order_number}</h1>
              <div style={{ color: '#424242', fontSize: '0.95rem', marginTop: '4px' }}>
                Placed on {new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              background: cfg.bg, color: cfg.color, padding: '6px 12px', 
              borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 
            }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          
          {/* Tractor Details Card */}
          <div className="card">
            <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Machine Information</h2>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div className="image-container" onClick={() => setSelectedImage(tractorImg)} style={{ cursor: tractorImg && !imgError ? 'zoom-in' : 'default', height: '200px', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F5F5F5' }}>
                  {tractorImg && !imgError ? (
                    <img src={tractorImg} alt={o.tractor_name} onError={() => setImgError(true)} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8D6E63' }}>
                      <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '8px' }} />
                      <div>No Image Available</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1B5E20' }}>{o.tractor_name || 'AgriRent Machine'}</div>
                <div style={{ fontSize: '1rem', color: '#424242', marginTop: '8px' }}>{o.tractor_type_label || 'Tractor'}</div>
                <div style={{ fontSize: '1rem', color: '#424242', marginTop: '16px' }}>
                  <strong>Field Purpose:</strong> {o.farming_purpose || 'N/A'}
                </div>
                <div style={{ fontSize: '1rem', color: '#424242', marginTop: '8px' }}>
                  <strong>Field Location:</strong> {o.field_location || 'N/A'}
                </div>
                <div style={{ fontSize: '1rem', color: '#424242', marginTop: '8px' }}>
                  <strong>Field Size:</strong> {o.field_size_hectares ? `${o.field_size_hectares} ha` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Payment Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Rental Schedule */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calendar size={20} color="#228B22" />
                <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0 }}>Rental Schedule</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>Start Date</span>
                  <strong style={{ color: '#424242' }}>{new Date(o.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>End Date</span>
                  <strong style={{ color: '#424242' }}>{new Date(o.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>Duration</span>
                  <strong style={{ color: '#424242' }}>{o.total_days} Days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#424242' }}>Daily Rate</span>
                  <strong style={{ color: '#424242' }}>{parseFloat(o.daily_rate || 0).toFixed(2)} ETB/day</strong>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <DollarSign size={20} color="#228B22" />
                <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0 }}>Payment Details</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>Payment Method</span>
                  <strong style={{ color: '#424242' }}>{o.payment_method || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>Transaction Ref</span>
                  <strong style={{ color: '#424242' }}>{o.payment_reference || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                  <span style={{ color: '#424242' }}>Status</span>
                  <strong style={{ 
                    color: o.payment_status === 'Confirmed' ? '#4CAF50' : o.payment_status === 'Rejected' ? '#F44336' : '#FF9800' 
                  }}>
                    {o.payment_status || 'Pending'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#424242', fontWeight: 600 }}>Total Amount</span>
                  <strong style={{ color: '#2E8B57', fontSize: '1.1rem' }}>{parseFloat(o.total_amount || 0).toFixed(2)} ETB</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Special Instructions & Actions */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {o.special_instructions && (
              <div className="card" style={{ flex: '1 1 300px' }}>
                <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Special Instructions</h2>
                <p style={{ color: '#424242', lineHeight: '1.5', margin: 0 }}>{o.special_instructions}</p>
              </div>
            )}
            
            {['pending', 'approved'].includes(o.status) && (
              <div className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#F44336' }}>Danger Zone</h2>
                <p style={{ color: '#424242', marginBottom: '16px', fontSize: '0.9rem' }}>You can cancel this order before it is confirmed or active.</p>
                <button className="btn-danger" onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this order?')) {
                    handleCancel(o.id);
                  }
                }}>
                  Cancel Order
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', padding: '8px' }}>
              <img src={selectedImage} alt="Full View" style={{ width: '100%', height: 'auto', borderRadius: '10px' }} />
              <button className="btn-secondary" style={{ position: 'absolute', top: '-40px', right: '0' }} onClick={() => setSelectedImage(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        <style>{`
          .page-container { padding: 32px; background: #F5F5F5; min-height: calc(100vh - 60px); box-sizing: border-box; }
          .section-title { color: #1B5E20; font-weight: 700; margin-bottom: 16px; }
          .detail-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
          .card { background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px; padding: 24px; }
          .image-container { border-radius: 10px; overflow: hidden; transition: all 0.15s ease; }
          .image-container img { width: 100%; height: 100%; object-fit: cover; transition: all 0.15s ease; }
          .image-container:hover img { transform: scale(1.03); }
          .btn-secondary { background: #6B8E23; color: #FFFFFF; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
          .btn-secondary:hover { background: #55721c; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .btn-danger { background: #F44336; color: #FFFFFF; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
          .btn-danger:hover { background: #d32f2f; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .toast { position: fixed; top: 24px; right: 24px; z-index: 9999; border-radius: 10px; color: #FFFFFF; padding: 16px 24px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out forwards; }
          .toast.success { background: #4CAF50; }
          .toast.error { background: #F44336; }
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
          .modal-content { background: #FFF; border-radius: 14px; position: relative; }
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="page-container">
      
      {notification && (
        <div className={`toast ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <h1 className="section-title" style={{ fontSize: '2rem', margin: 0, textTransform: 'none' }}>AgriRent Orders</h1>
          <p style={{ color: '#424242', fontSize: '1rem', margin: '8px 0 0 0' }}>Manage your machine rentals & field services</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/services/farming')}>
            + New Rental
          </button>
          <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="tabs-container">
        {STATUS_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const TabIcon = tab.Icon;
          return (
            <button key={tab.key} className={`tab-btn ${active ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <TabIcon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT (TABLE) ── */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#424242' }}>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Tractor size={48} color="#A5D6A7" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#1B5E20', margin: '0 0 8px 0' }}>No Orders Found</h2>
          <p style={{ color: '#424242', margin: 0 }}>You don't have any farming orders in this category.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Tractor / Machine</th>
                <th>Start Date</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={order.id} className="table-row" onClick={() => setSelectedOrder(order)}>
                    <td>{order.order_number}</td>
                    <td style={{ fontWeight: 600 }}>{order.tractor_name || 'AgriRent Machine'}</td>
                    <td>{new Date(order.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{order.total_days} Days</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#2E8B57' }}>
                      {parseFloat(order.total_amount || 0).toFixed(2)} ETB
                    </td>
                    <td>
                      <span style={{ 
                        background: cfg.bg, color: cfg.color, padding: '4px 10px', 
                        borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 
                      }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .page-container {
          padding: 32px;
          background: #F5F5F5;
          min-height: calc(100vh - 60px);
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }
        .section-title { color: #1B5E20; font-weight: 700; }
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
        }
        
        .tabs-container {
          display: flex; gap: 8px; border-bottom: 1px solid #8D6E63; margin-bottom: 24px;
          overflow-x: auto;
        }
        .tab-btn {
          background: transparent; border: none; border-bottom: 2px solid transparent;
          padding: 12px 24px; color: #424242; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: all 0.15s ease;
          font-size: 0.95rem; white-space: nowrap;
        }
        .tab-btn.active { color: #228B22; border-bottom: 2px solid #228B22; }
        .tab-btn:hover:not(.active) { color: #228B22; }

        .btn-primary {
          background: #2E8B57; color: #FFFFFF; padding: 10px 20px; border-radius: 8px;
          border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600;
          display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease;
        }
        .btn-primary:hover { background: #267347; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        
        .btn-secondary {
          background: #6B8E23; color: #FFFFFF; padding: 10px 20px; border-radius: 8px;
          border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600;
          display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease;
        }
        .btn-secondary:hover { background: #55721c; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

        .btn-sm { padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; }

        .empty-state {
          background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 12px;
          padding: 64px 24px; text-align: center;
        }

        .table-container {
          background: #FFFFFF; border: 1px solid #8D6E63; border-radius: 10px;
          overflow-x: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th {
          background: #1B5E20; color: #FFFFFF; padding: 14px 20px; font-weight: 500;
          white-space: nowrap;
        }
        .data-table td { padding: 14px 20px; color: #424242; border-bottom: 1px solid #F5F5F5; }
        .table-row { transition: background 0.15s ease; cursor: pointer; }
        .table-row:nth-child(even) { background: #F5F5F5; }
        .table-row:hover { background: #A5D6A7 !important; }

        .toast {
          position: fixed; top: 24px; right: 24px; z-index: 9999; border-radius: 10px;
          color: #FFFFFF; padding: 16px 24px; font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out forwards;
        }
        .toast.success { background: #4CAF50; }
        .toast.error { background: #F44336; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

