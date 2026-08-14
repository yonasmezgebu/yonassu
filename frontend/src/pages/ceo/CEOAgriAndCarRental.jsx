import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Car, Tractor, CheckCircle, Clock, Wrench, Activity, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Enterprise Global Styles ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
    }

    .car-page {
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: var(--color-text-primary);
      background: var(--color-bg-page);
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
    }

    /* ── Cards ── */
    .car-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out;
      padding: 24px;
    }
    .car-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    /* ── Buttons ── */
    .car-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 150ms ease-in-out;
      white-space: nowrap;
      height: 36px;
      font-family: inherit;
    }
    .car-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .car-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .car-btn-primary {
      background: var(--color-primary);
      color: #fff;
    }
    .car-btn-primary:hover {
      background: #FFD700;
      color: #111827;
    }
    
    .car-btn-secondary {
      background: #fff;
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }
    .car-btn-secondary:hover {
      background: #FFD700;
      border-color: #FFD700;
      color: #111827;
    }

    /* ── Typography ── */
    .car-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .car-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .car-section-header {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── KPI Hero Card ── */
    .car-hero-card {
      background: linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%);
      color: #fff;
      position: relative;
      overflow: hidden;
      border: none;
    }
    .car-hero-card::after {
      content: '';
      position: absolute;
      right: -20px;
      top: -20px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      pointer-events: none;
    }
    
    /* ── Activity Feed Row ── */
    .car-activity-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--color-bg-page);
      border-radius: 8px;
      margin-bottom: 12px;
      transition: background 150ms ease-in-out, transform 150ms ease-in-out;
    }
    .car-activity-row:hover {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transform: translateX(2px);
    }

    /* ── Status Row ── */
    .car-status-row {
      display: grid;
      grid-template-columns: 140px 1fr 60px;
      gap: 16px;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      transition: background 150ms ease;
    }
    .car-status-row:hover {
      background: var(--color-bg-page);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .car-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
      .car-grid-main { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 640px) {
      .car-page { padding: 12px; }
      .car-grid-4 { grid-template-columns: 1fr !important; }
      .car-status-row { grid-template-columns: 1fr; gap: 8px; }
    }
  `}</style>
);

const CategoryBar = ({ value, max, color }) => (
  <div style={{ background: '#E5E7EB', borderRadius: 4, height: 8, overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%', borderRadius: 4, background: color,
      width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
      transition: 'width 1.2s ease-in-out'
    }} />
  </div>
);

export default function CEOAgriAndCarRental({ isApprovalMode = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
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
    try {
      const res = await apiClient.get('/car-renting/dashboard');
      const payload = res?.data?.data || res?.data || null;
      if (payload) {
        setData(payload);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}><SegmentedSpinner size={40} color="var(--color-primary)" /></div>;

  const fleetStats   = data.fleetStats   || { total: 0, cars: 0, agri: 0, available: 0, rented: 0, maintenance: 0, totalValue: 0 };
  const activeOrders = data.activeOrders || [];
  const maintenance  = data.maintenance  || [];

  const statuses = ['available', 'rented', 'maintenance'];
  const statusColors = { 'available': 'var(--color-success)', 'rented': 'var(--color-warning)', 'maintenance': 'var(--color-danger)' };
  const maxStatusCount = Math.max(...statuses.map(s => fleetStats[s] || 0), 1);

  const recentActivity = [
      ...activeOrders.map(o => ({ id: `ord-${o.id}`, type: 'Rental', title: o.order_number, sub: `Active order`, date: o.start_datetime })),
      ...maintenance.map(m => ({ id: `mnt-${m.id}`, type: 'Maintenance', title: m.description, sub: m.asset_name, date: m.scheduled_date }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (isApprovalMode) {
    return (
      <div className="car-page">
        <GlobalStyles />
        
        {/* Back bar */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/ceo/approvals')} className="car-btn car-btn-secondary">
            <ArrowLeft size={16} /> Back to Approvals Hub
          </button>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Administration / Approvals Hub / Agri & Car Rental Approvals</span>
        </div>
        
        <div style={{ marginBottom: 32 }}>
          <h1 className="car-title">Agri & Car Rental Approvals</h1>
          <p className="car-subtitle">Review agricultural equipment and vehicle requests</p>
        </div>
        
        <div className="car-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h2 style={{ fontSize: 18, color: 'var(--color-text-primary)', margin: '0 0 8px 0', fontWeight: 600 }}>No Pending Approvals</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 14 }}>All requests are currently resolved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="car-page">
      <GlobalStyles />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, background: 'var(--color-primary)', borderRadius: 4 }} />
            <h1 className="car-title">Agri & Car Rental Dashboard</h1>
          </div>
          <p className="car-subtitle" style={{ paddingLeft: 16 }}>
            Executive Overview · {timeString}
          </p>
        </div>
        <div>
          <button onClick={load} className="car-btn car-btn-secondary" disabled={refreshing}>
            {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={16} />}
            Sync Data
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI HERO CARDS ── */}
      <div className="car-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        
        {/* Fleet Value Hero */}
        <div className="car-card car-hero-card">
          <div style={{ position: 'absolute', right: 24, top: 24, background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12 }}>
            <Car size={24} color="#fff" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: 12 }}>
            Total Fleet Size
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>
            {fleetStats.total} <span style={{ fontSize: '16px', opacity: 0.8, fontWeight: 500 }}>Vehicles</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
            <Activity size={16} /> Across Car and AgriRent Lines
          </div>
        </div>

        {/* Cars */}
        <div className="car-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cars Fleet</span>
            <div style={{ background: 'var(--color-info-bg)', borderRadius: 8, padding: 10, color: 'var(--color-info)' }}>
              <Car size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '16px 0 8px' }}>
            {fleetStats.cars}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Standard vehicles</div>
        </div>

        {/* Agri Equipment */}
        <div className="car-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agri Equipment</span>
            <div style={{ background: 'var(--color-success-bg)', borderRadius: 8, padding: 10, color: 'var(--color-success)' }}>
              <Tractor size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '16px 0 8px' }}>
            {fleetStats.agri}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Tractors & Farming</div>
        </div>

        {/* Active Rentals */}
        <div className="car-card" style={{ background: activeOrders.length > 0 ? 'var(--color-warning-bg)' : undefined, borderColor: activeOrders.length > 0 ? '#FDE68A' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: activeOrders.length > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Rentals</span>
            <div style={{ background: activeOrders.length > 0 ? '#FEF3C7' : 'var(--color-bg-page)', borderRadius: 8, padding: 10, color: activeOrders.length > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: activeOrders.length > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)', margin: '16px 0 8px' }}>
            {activeOrders.length}
          </div>
          <div style={{ fontSize: 13, color: activeOrders.length > 0 ? '#B45309' : 'var(--color-text-muted)', fontWeight: 500 }}>Currently rented out</div>
        </div>
      </div>

      {/* ── ROW 2: FLEET STATUS BREAKDOWN + ACTIVITY FEED ── */}
      <div className="car-grid-main" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>

        {/* Fleet Status Breakdown */}
        <div className="car-card">
          <h2 className="car-section-header">
            <Activity size={18} color="var(--color-primary)" /> Fleet Status Breakdown
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-success)', fontWeight: 600, background: 'var(--color-success-bg)', padding: '2px 8px', borderRadius: 12 }}>Real-time</span>
          </h2>
          
          {/* Sub-KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Fleet',    val: fleetStats.total,       icon: <Car size={16}/>, c: 'var(--color-info)' },
              { label: 'Available Now',  val: fleetStats.available,   icon: <CheckCircle size={16}/>, c: 'var(--color-success)' },
              { label: 'Rented Out',     val: fleetStats.rented,      icon: <Clock size={16}/>, c: 'var(--color-warning)' },
              { label: 'Maintenance',    val: fleetStats.maintenance, icon: <Wrench size={16}/>, c: 'var(--color-danger)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--color-bg-page)', borderRadius: 8, padding: 16, border: '1px solid var(--color-border)' }}>
                <div style={{ color: k.c, marginBottom: 8 }}>{k.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>{k.val}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 16, padding: '0 16px 12px 16px' }}>
            {['Status', '', 'Count'].map(h => (
              <div key={h} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: h === 'Count' ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Bars */}
          <div style={{ display: 'grid', gap: 4 }}>
            {statuses.map(status => {
              const count = fleetStats[status];
              const c = statusColors[status];
              return (
                <div key={status} className="car-status-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{status}</span>
                  </div>
                  <CategoryBar value={count} max={maxStatusCount} color={c} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="car-card">
          <h2 className="car-section-header">
            <Clock size={18} color="var(--color-primary)" /> Recent Activity
          </h2>
          
          <div style={{ marginTop: 24 }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <AlertCircle size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>No recent activity</div>
              </div>
            ) : recentActivity.map((l) => {
              const isRental = l.type === 'Rental';
              const c = isRental ? 'var(--color-success)' : 'var(--color-warning)';
              const bg = isRental ? 'var(--color-success-bg)' : 'var(--color-warning-bg)';
              const IconComp = isRental ? Car : Wrench;
              
              return (
                <div key={l.id} className="car-activity-row">
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp size={20} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                      {l.type}: {l.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{l.sub}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {l.date ? new Date(l.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
