import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import carService from '../../services/carService';
import {
  Package, Printer, Leaf, Car, Pill, Award, AlertCircle, ShoppingBag,
  RefreshCw, CheckCircle, Clock, ChevronRight, Activity, Calendar
} from 'lucide-react';

/* ─── shared CSS ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .dash-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #424242;
  }
  @media (max-width: 720px) { .dash-page { padding: 16px; } }

  /* Header */
  .dash-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
  .dash-title { font-size: 2.2rem; font-weight: 800; color: #1B5E20; margin: 0; letter-spacing: -0.02em; }
  .dash-sub { font-size: 1rem; color: #6B8E23; margin: 4px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .dash-time { font-size: 0.9rem; color: #757575; display: flex; align-items: center; gap: 6px; }

  /* Grid Layouts */
  .dash-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
  .dash-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; margin-bottom: 32px; }
  @media (max-width: 960px) {
    .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-main-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .dash-kpi-grid { grid-template-columns: 1fr; }
  }

  /* Cards */
  .dash-card { background: #FFFFFF; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; transition: all 0.2s ease; display: flex; flex-direction: column; }
  .dash-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #8D6E63; }
  
  .dash-hero-card { background: #1B5E20; color: #FFFFFF; border: none; position: relative; overflow: hidden; }
  .dash-hero-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(27,94,32,0.25); }
  .dash-hero-bg { position: absolute; right: -20px; top: -20px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,0.06); pointer-events: none; }

  .dash-card-title { font-size: 0.85rem; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
  .dash-section-title { font-size: 1.1rem; font-weight: 800; color: #1B5E20; margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }

  /* KPI values */
  .dash-kpi-val { font-size: 2.5rem; font-weight: 800; color: #424242; line-height: 1; margin-bottom: 8px; letter-spacing: -0.02em; }
  .dash-kpi-sub { font-size: 0.9rem; color: #757575; font-weight: 500; }

  /* Activity List */
  .dash-list { display: flex; flex-direction: column; gap: 12px; }
  .dash-list-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: #F5F5F5; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; border: 1px solid transparent; }
  .dash-list-item:hover { background: #FFFFFF; border-color: #8D6E63; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateX(2px); }
  .dash-icon-box { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  
  /* Quick Actions */
  .dash-qa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
  .dash-qa-item { background: #F5F5F5; border: 1px solid transparent; border-radius: 10px; padding: 16px 12px; text-align: center; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .dash-qa-item:hover { background: #FFFFFF; border-color: #2E8B57; box-shadow: 0 4px 12px rgba(46,139,87,0.1); transform: translateY(-2px); }
  .dash-qa-icon { color: #1B5E20; }
  .dash-qa-label { font-size: 0.85rem; font-weight: 700; color: #424242; }

  /* Buttons */
  .dash-btn-sync { background: #FFFFFF; color: #1B5E20; border: 1px solid #1B5E20; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .dash-btn-sync:hover:not(:disabled) { background: #F5F5F5; box-shadow: 0 4px 8px rgba(0,0,0,0.08); }
  .dash-btn-sync:disabled { opacity: 0.6; cursor: wait; }

  /* Status Badges */
  .dash-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

  .dash-spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default function CustomerAllOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeString(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const results = [];

      const printingP = apiClient.get('/printing/customer/orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data?.orders || []).forEach(o => results.push({
              id: `prt-${o.id}`, type: 'printing', typeLabel: 'Printing',
              orderNumber: o.order_number, date: o.created_at, status: o.status_name || o.status_code,
              amount: o.total_price, description: `${o.product_type || ''}`,
              navPath: '/customer/printing-orders', icon: Printer, color: '#6B8E23', bg: '#F1F8E9'
            }));
          }
        }).catch(() => {});

      const farmingP = apiClient.get('/agrirent-orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `farm-${o.id}`, type: 'farming', typeLabel: 'AgriRent',
              orderNumber: o.order_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: `${o.tractor_name || ''}`,
              navPath: '/customer/farming-orders', icon: Leaf, color: '#2E8B57', bg: '#E8F5E9'
            }));
          }
        }).catch(() => {});

      const retailP = apiClient.get('/retail/orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `ret-${o.id}`, type: 'retail', typeLabel: 'Retail',
              orderNumber: o.invoice_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: o.items?.map(i => i.product_name).join(', ')?.slice(0, 80) || '',
              navPath: '/customer/retail-orders', icon: ShoppingBag, color: '#FF9800', bg: '#FFF3E0'
            }));
          }
        }).catch(() => {});

      const rentalP = carService.getMyRentalOrders()
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `rent-${o.id}`, type: 'rental', typeLabel: 'Car Rental',
              orderNumber: o.orderNumber, date: o.createdAt || o.created_at, status: o.status,
              amount: o.totalAmount, description: `${o.carName || ''}`,
              navPath: '/customer/rentals', icon: Car, color: '#1976D2', bg: '#E3F2FD'
            }));
          }
        }).catch(() => {});

      const prescriptionP = apiClient.get('/pharmacy/requests/my-requests')
        .then(r => {
          if (r.status === 'success') {
            const data = r.data?.data || r.data || [];
            (data).forEach(o => results.push({
              id: `rx-${o.id}`, type: 'prescription', typeLabel: 'Pharmacy',
              orderNumber: o.request_number || `RX-${o.id}`, date: o.requested_at, status: o.status,
              amount: o.total_amount, description: o.medication_name,
              navPath: '/customer/prescriptions', icon: Pill, color: '#9C27B0', bg: '#F3E5F5'
            }));
          }
        }).catch(() => {});

      const tenderP = apiClient.get('/tenders/my-bids')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `bid-${o.id}`, type: 'tenders', typeLabel: 'Tender Bid',
              orderNumber: `BID-${o.id}`, date: o.created_at, status: o.status,
              amount: o.bid_amount, description: o.tender_title || 'Tender Bid',
              navPath: '/customer/bids', icon: Award, color: '#F44336', bg: '#FFEBEE'
            }));
          }
        }).catch(() => {});

      await Promise.all([printingP, farmingP, retailP, rentalP, prescriptionP, tenderP]);
      results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setOrders(results);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const firstName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Customer';

  // Stats
  const totalCount = orders.length;
  const pendingOrders = orders.filter(o => {
    const s = (o.status || '').toUpperCase();
    return ['PROCESSING', 'PENDING', 'SHIPPED', 'APPROVED', 'ACTIVE'].some(x => s.includes(x));
  });
  const completedOrders = orders.filter(o => {
    const s = (o.status || '').toUpperCase();
    return ['COMPLETED', 'DELIVERED', 'PAID', 'PICKED_UP'].some(x => s.includes(x));
  });
  
  const pendingCount = pendingOrders.length;
  const completedCount = completedOrders.length;
  const recentActivities = orders.slice(0, 5);

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    let bg = '#E0E0E0', color = '#424242';
    if (['PENDING', 'PROCESSING'].some(x => s.includes(x))) { bg = '#FFF3E0'; color = '#E65100'; }
    if (['APPROVED', 'CONFIRMED', 'ACTIVE'].some(x => s.includes(x))) { bg = '#E8F5E9'; color = '#1B5E20'; }
    if (['COMPLETED', 'DELIVERED', 'PAID'].some(x => s.includes(x))) { bg = '#E8F5E9'; color = '#2E8B57'; }
    if (['REJECTED', 'CANCELLED'].some(x => s.includes(x))) { bg = '#FFEBEE'; color = '#C62828'; }
    return <span className="dash-badge" style={{ background: bg, color }}>{status}</span>;
  };

  return (
    <div className="dash-page">
      <style>{STYLES}</style>
      
      {/* ── HEADER ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {firstName}</h1>
          <p className="dash-sub">Customer Dashboard</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="dash-time"><Clock size={16} /> {timeString}</div>
          <button onClick={load} className="dash-btn-sync" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'dash-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="dash-kpi-grid">
        <div className="dash-card dash-hero-card">
          <div className="dash-hero-bg" />
          <div className="dash-card-title" style={{ color: 'rgba(255,255,255,0.8)' }}><ShoppingBag size={16} /> Total Activity</div>
          <div className="dash-kpi-val" style={{ color: '#FFFFFF' }}>{totalCount}</div>
          <div className="dash-kpi-sub" style={{ color: 'rgba(255,255,255,0.8)' }}>Lifetime orders & requests</div>
        </div>

        <div className="dash-card">
          <div className="dash-card-title" style={{ color: '#2E8B57' }}><CheckCircle size={16} /> Completed</div>
          <div className="dash-kpi-val" style={{ color: '#2E8B57' }}>{completedCount}</div>
          <div className="dash-kpi-sub">Successfully fulfilled</div>
        </div>

        <div className="dash-card">
          <div className="dash-card-title" style={{ color: '#FF9800' }}><Clock size={16} /> In Progress</div>
          <div className="dash-kpi-val" style={{ color: pendingCount > 0 ? '#FF9800' : '#424242' }}>{pendingCount}</div>
          <div className="dash-kpi-sub">Currently active or pending</div>
        </div>

        <div className="dash-card">
          <div className="dash-card-title" style={{ color: '#1B5E20' }}><Activity size={16} /> Services Used</div>
          <div className="dash-kpi-val">{new Set(orders.map(o => o.type)).size}</div>
          <div className="dash-kpi-sub">Across all departments</div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="dash-main-grid">
        
        {/* Left Col: Recent Activity */}
        <div>
          <h2 className="dash-section-title"><Clock size={20} /> Recent Activity</h2>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#757575', background: '#FFFFFF', borderRadius: '12px' }}>Loading...</div>
          ) : recentActivities.length === 0 ? (
            <div className="dash-card" style={{ alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag size={48} color="#A5D6A7" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1B5E20' }}>No Activity Yet</div>
              <p style={{ color: '#757575', margin: '8px 0 0' }}>Your recent orders and requests will appear here.</p>
            </div>
          ) : (
            <div className="dash-list">
              {recentActivities.map(l => {
                const Icon = l.icon;
                return (
                  <div key={l.id} className="dash-list-item" onClick={() => l.navPath && navigate(l.navPath)}>
                    <div className="dash-icon-box" style={{ background: l.bg, color: l.color }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1B5E20' }}>{l.typeLabel}</div>
                        <div style={{ fontSize: '0.85rem', color: '#757575', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(l.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#424242', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.description || `Order #${l.orderNumber}`}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(l.status)}
                    </div>
                    <ChevronRight size={18} color="#BDBDBD" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Actions */}
          <div>
            <h2 className="dash-section-title"><ShoppingBag size={20} /> Quick Links</h2>
            <div className="dash-card">
              <div className="dash-qa-grid">
                {[
                  { label: 'Retail',    icon: ShoppingBag, path: '/customer/retail-orders' },
                  { label: 'AgriRent',  icon: Leaf,        path: '/customer/farming-orders' },
                  { label: 'Pharmacy',  icon: Pill,        path: '/customer/prescriptions' },
                  { label: 'Rentals',   icon: Car,         path: '/customer/rentals' },
                  { label: 'Printing',  icon: Printer,     path: '/customer/printing-orders' },
                  { label: 'Support',   icon: AlertCircle, path: '/customer/support' },
                ].map(a => (
                  <div key={a.label} className="dash-qa-item" onClick={() => navigate(a.path)}>
                    <a.icon size={24} className="dash-qa-icon" />
                    <span className="dash-qa-label">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Needed */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="dash-section-title" style={{ color: '#E65100' }}><AlertCircle size={20} /> Action Needed</h2>
              <div className="dash-list">
                {pendingOrders.slice(0, 3).map(o => (
                  <div key={o.id} className="dash-list-item" onClick={() => o.navPath && navigate(o.navPath)} style={{ borderLeft: `4px solid ${o.color}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#424242' }}>{o.typeLabel}</div>
                      <div style={{ fontSize: '0.8rem', color: '#757575', marginTop: '2px' }}>Order #{o.orderNumber}</div>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
