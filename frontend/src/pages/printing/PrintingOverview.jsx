import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RefreshCw, Package, Printer, Server, Clock, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  
  .print-dash {
    background-color: #F5F5F5; /* Light Gray */
    min-height: 100vh;
    padding: 2rem;
    font-family: 'Inter', sans-serif;
  }

  /* --- HEADER --- */
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    animation: fadeUp 0.4s ease-out;
  }
  
  .artistic-title {
    font-size: 3rem;
    font-weight: 900;
    color: #1B5E20; /* Dark Green */
    letter-spacing: -0.02em;
    text-shadow: 1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #2E8B57, 6px 6px 15px rgba(0,0,0,0.15);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .blink-leaf {
    animation: leafBlink 3s infinite ease-in-out;
    display: inline-block;
  }
  
  @keyframes leafBlink {
    0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 4px rgba(76,175,80,0.4)); }
    50% { transform: scale(1.15) rotate(12deg); filter: drop-shadow(0 0 12px rgba(139,195,74,0.8)); }
    100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 4px rgba(76,175,80,0.4)); }
  }

  .time-display {
    font-size: 0.9rem;
    font-weight: 800;
    color: #2E8B57; /* Emerald Green */
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* --- BORDER TRACKING ANIMATION BUTTON --- */
  .btn-sync {
    position: relative;
    background: #FFFFFF;
    color: #1B5E20; /* Dark Green */
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    z-index: 1;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    letter-spacing: 0.05em;
  }
  .btn-sync::before {
    content: '';
    position: absolute;
    top: -100%; left: -100%; width: 300%; height: 300%;
    background: conic-gradient(transparent, transparent, transparent, #4CAF50, #228B22);
    animation: rotate-border 2s linear infinite;
    z-index: -2;
  }
  .btn-sync::after {
    content: '';
    position: absolute;
    inset: 2px; /* border thickness */
    background: #FFFFFF;
    border-radius: 6px;
    z-index: -1;
  }
  .btn-sync:hover::after {
    background: #F5F5F5;
  }
  .btn-sync:active { transform: scale(0.97); }
  @keyframes rotate-border {
    100% { transform: rotate(360deg); }
  }

  /* --- STATS GRID --- */
  .stats-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    animation: fadeUp 0.5s ease-out backwards;
  }
  
  .stat-card.primary {
    background: #1B5E20; /* Dark Green */
    color: #FFFFFF;
    box-shadow: 0 10px 30px rgba(27, 94, 32, 0.2);
  }
  
  .stat-label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8D6E63; /* Earth Brown */
    margin-bottom: 0.5rem;
  }
  .primary .stat-label { color: #A5D6A7; /* Sage Green */ }
  
  .stat-val {
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
    color: #424242; /* Dark Gray */
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .primary .stat-val { color: #FFFFFF; }
  
  .stat-sub {
    font-size: 0.85rem;
    font-weight: 600;
    color: #424242; /* Dark Gray */
  }
  .primary .stat-sub { color: #FFFFFF; }
  
  .stat-desc {
    font-size: 0.8rem;
    color: #6B8E23; /* Olive Green */
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .primary .stat-desc { color: #98FF98; /* Mint Green */ }

  .stat-icon-bg {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F5;
  }
  .primary .stat-icon-bg {
    background: rgba(255,255,255,0.1);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    right: -20px;
    top: -20px;
  }

  /* --- BOTTOM SECTIONS --- */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1.5rem;
  }
  
  .section-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #1B5E20;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .real-time-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: #6B8E23;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .breakdown-box {
    border: 1px solid #E8F5E9;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    transition: transform 0.2s;
  }
  .breakdown-box:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .bd-val { font-size: 2rem; font-weight: 900; margin: 8px 0 4px; }
  .bd-lbl { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #8D6E63; }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .activity-item {
    background: #F9FAFB;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-left: 3px solid #2E8B57;
  }
  .act-title { font-size: 0.85rem; font-weight: 700; color: #424242; }
  .act-sub { font-size: 0.75rem; color: #6B8E23; margin-top: 2px; }
  .act-time { font-size: 0.75rem; font-weight: 600; color: #A5D6A7; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .spinner { animation: spin 1s linear infinite; }
`;

export default function PrintingOverview() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  
  const [orders, setOrders] = useState([]);
  const [storeMachines, setStoreMachines] = useState([]);
  const [prodMachines, setProdMachines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, sRes, pRes] = await Promise.all([
        apiClient.get('/printing/orders', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/store/machines').catch(() => ({ data: [] })),
        apiClient.get('/printing-assets/production/machines').catch(() => ({ data: [] }))
      ]);

      setOrders(Array.isArray(oRes) ? oRes : (oRes?.data?.orders || oRes?.data || []));
      setStoreMachines(Array.isArray(sRes) ? sRes : (sRes?.data || []));
      setProdMachines(Array.isArray(pRes) ? pRes : (pRes?.data || []));
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Stats
  const totalMachines = storeMachines.length + prodMachines.length;
  
  // Orders logic
  const pendingOrders = orders.filter(o => {
    const s = (o.status_name || '').toLowerCase();
    return s.includes('pend') || s.includes('received') || s.includes('progress');
  }).length;
  const completedOrders = orders.filter(o => (o.status_name || '').toLowerCase().includes('deliver')).length;
  const cancelledOrders = orders.filter(o => (o.status_name || '').toLowerCase().includes('cancel')).length;
  
  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="print-dash">
      <style>{CSS}</style>

      {/* --- HEADER --- */}
      <div className="dash-header">
        <h1 className="artistic-title">
          Welcome! <span className="blink-leaf">🌿</span>
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="time-display">
            PRINTING MANAGEMENT • IT'S {timeString}
          </div>
          
          <button className="btn-sync" onClick={loadData}>
            <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            SYNC
          </button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="stats-grid">
        {/* Primary Card */}
        <div className="stat-card primary" style={{ animationDelay: '0.1s' }}>
          <div>
            <div className="stat-label">Total Fleet Size</div>
            <div className="stat-val">{loading ? '…' : totalMachines} <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Machines</span></div>
          </div>
          <div className="stat-desc">
            <Server size={14} /> Across Store and Production Lines
          </div>
          <div className="stat-icon-bg">
            <Printer size={48} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
          </div>
        </div>

        {/* Prod Machines */}
        <div className="stat-card" style={{ animationDelay: '0.2s' }}>
          <div>
            <div className="stat-label" style={{ color: '#2E8B57' }}>Production Floor</div>
            <div className="stat-val" style={{ color: '#2E8B57' }}>{loading ? '…' : prodMachines.length}</div>
          </div>
          <div className="stat-desc" style={{ color: '#424242' }}>Active / Idle in production</div>
          <div className="stat-icon-bg">
            <PlayCircle size={22} color="#2E8B57" />
          </div>
        </div>

        {/* Store Machines */}
        <div className="stat-card" style={{ animationDelay: '0.3s' }}>
          <div>
            <div className="stat-label" style={{ color: '#8D6E63' }}>Store Inventory</div>
            <div className="stat-val" style={{ color: '#8D6E63' }}>{loading ? '…' : storeMachines.length}</div>
          </div>
          <div className="stat-desc" style={{ color: '#424242' }}>Waiting in store / Maint.</div>
          <div className="stat-icon-bg">
            <Package size={22} color="#8D6E63" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="stat-card" style={{ animationDelay: '0.4s' }}>
          <div>
            <div className="stat-label" style={{ color: '#FF9800' }}>Active Orders</div>
            <div className="stat-val" style={{ color: '#FF9800' }}>{loading ? '…' : pendingOrders}</div>
          </div>
          <div className="stat-desc" style={{ color: '#424242' }}>Currently processing</div>
          <div className="stat-icon-bg">
            <Clock size={22} color="#FF9800" />
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTIONS --- */}
      <div className="bottom-grid">
        
        {/* Left: Orders Breakdown */}
        <div className="section-card" style={{ animationDelay: '0.5s', animation: 'fadeUp 0.5s ease-out backwards' }}>
          <div className="section-header">
            <div className="section-title">
              <Printer size={18} color="#228B22" /> Order Status Breakdown
            </div>
            <div className="real-time-badge">Real-time</div>
          </div>
          
          <div className="breakdown-grid">
            <div className="breakdown-box" style={{ borderTop: '3px solid #87CEEB' }}>
              <div style={{ color: '#87CEEB' }}><Package size={20} /></div>
              <div className="bd-val" style={{ color: '#87CEEB' }}>{loading ? '…' : orders.length}</div>
              <div className="bd-lbl">Total Orders</div>
            </div>
            <div className="breakdown-box" style={{ borderTop: '3px solid #FF9800' }}>
              <div style={{ color: '#FF9800' }}><Clock size={20} /></div>
              <div className="bd-val" style={{ color: '#FF9800' }}>{loading ? '…' : pendingOrders}</div>
              <div className="bd-lbl">In Progress</div>
            </div>
            <div className="breakdown-box" style={{ borderTop: '3px solid #4CAF50' }}>
              <div style={{ color: '#4CAF50' }}><CheckCircle size={20} /></div>
              <div className="bd-val" style={{ color: '#4CAF50' }}>{loading ? '…' : completedOrders}</div>
              <div className="bd-lbl">Completed</div>
            </div>
            <div className="breakdown-box" style={{ borderTop: '3px solid #F44336' }}>
              <div style={{ color: '#F44336' }}><AlertTriangle size={20} /></div>
              <div className="bd-val" style={{ color: '#F44336' }}>{loading ? '…' : cancelledOrders}</div>
              <div className="bd-lbl">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="section-card" style={{ animationDelay: '0.6s', animation: 'fadeUp 0.5s ease-out backwards' }}>
          <div className="section-header">
            <div className="section-title">
              <RefreshCw size={18} color="#8D6E63" /> Recent Activity
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A5D6A7' }}>
              <RefreshCw size={24} className="spinner" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9E9E9E', fontSize: '0.9rem' }}>
              No recent orders found.
            </div>
          ) : (
            <div className="activity-list">
              {recentOrders.map(o => (
                <div key={o.id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/printing/orders/${o.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#E8F5E9', padding: '8px', borderRadius: '6px' }}>
                      <Package size={16} color="#2E8B57" />
                    </div>
                    <div>
                      <div className="act-title">Order: {o.order_number || o.id}</div>
                      <div className="act-sub">{o.product_type} • <span style={{ fontWeight: 600 }}>{o.status_name}</span></div>
                    </div>
                  </div>
                  <div className="act-time">
                    {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
