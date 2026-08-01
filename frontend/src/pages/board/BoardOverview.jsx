import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Sprout
} from 'lucide-react';
import axios from '../../services/apiClient';
import styles from './BoardOverview.module.css';

const BoardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [finRes, kpiRes, overviewRes] = await Promise.all([
          axios.get('/board/financials'),
          axios.get('/board/kpis'),
          axios.get('/board/overview')
        ]);
        
        if (finRes.data?.status === 'success') setFinancials(finRes.data.data);
        if (kpiRes.data?.status === 'success') setKpis(kpiRes.data.data);
        if (overviewRes.data?.status === 'success') setOverview(overviewRes.data.data);
      } catch (err) {
        console.error('Failed to fetch board data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loader}>
        <Activity size={40} className="spin" />
        <p>Loading Strategic Insights...</p>
      </div>
    );
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div className={styles.container}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes colorBlink { 0% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } 25% { color:#8BC34A; filter:drop-shadow(0 0 10px #8BC34Acc); transform:scale(1.15) rotate(10deg); } 50% { color:#2E8B57; filter:drop-shadow(0 0 14px #2E8B57); transform:scale(1.3) rotate(-10deg); } 75% { color:#87CEEB; filter:drop-shadow(0 0 10px #87CEEBcc); transform:scale(1.15) rotate(5deg); } 100% { color:#228B22; filter:drop-shadow(0 0 6px #228B2288); transform:scale(1) rotate(0deg); } }
        .blink-star { animation: colorBlink 2.5s infinite ease-in-out; display:inline-block; }
        .artistic-3d-title { font-size:3rem; font-weight:900; color:#1B5E20; letter-spacing:-0.02em; text-shadow:1px 1px 0 #fff, 2px 2px 0 #fff, 3px 3px 0 #fff, 4px 4px 0 #228B22, 5px 5px 0 #228B22, 6px 6px 0 #2E8B57, 7px 7px 0 #2E8B57, 8px 8px 15px rgba(0,0,0,0.2); margin:0; display:flex; align-items:center; gap:12px; line-height:1.1; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Welcome! &nbsp;<span className="blink-star">🌿</span>
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            High-level insights, enterprise financials, and governance activities.
          </p>
        </div>
        <div style={{ justifySelf: 'end' }}></div>
      </div>

      {/* Primary Financial KPIs */}
      <div className={styles.grid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Total Revenue</h3>
            <p className={styles.kpiValue}>{formatMoney(financials?.totalRevenue)}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Net Profit</h3>
            <p className={styles.kpiValue}>{formatMoney(financials?.netProfit)}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
            <Users size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Active Workforce</h3>
            <p className={styles.kpiValue}>{kpis?.activeEmployees}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <h3>Pending Tenders / Orders</h3>
            <p className={styles.kpiValue}>{kpis?.pendingOrders}</p>
          </div>
        </div>
      </div>

      <div className={styles.secondaryGrid}>
        {/* Recent Governance Activities */}
        <div className={styles.panel}>
          <h3><FileText size={20} /> Recent Governance Activities</h3>
          <div className={styles.activityList}>
            {overview?.recentActivities?.length > 0 ? (
              overview.recentActivities.map((act) => (
                <div key={act.activity_id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <CheckCircle size={20} />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>{act.activity_type}</h4>
                    <p>{act.details}</p>
                    <div className={styles.activityMeta}>
                      <span className={styles.badge}>{act.board_name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {formatDate(act.activity_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b' }}>No recent board activities logged.</p>
            )}
          </div>
        </div>

        {/* Operational Compliance & Risks */}
        <div className={styles.panel}>
          <h3><AlertTriangle size={20} /> Risk & Compliance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
              <h4 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Low Stock Alerts
              </h4>
              <p style={{ margin: 0, color: '#7f1d1d', fontSize: '24px', fontWeight: '700' }}>
                {kpis?.lowStockAlerts || 0} <span style={{ fontSize: '13px', fontWeight: '500' }}>items require reordering</span>
              </p>
            </div>

            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
              <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Board Committees
              </h4>
              <p style={{ margin: 0, color: '#14532d', fontSize: '24px', fontWeight: '700' }}>
                {overview?.totalBoards || 0} <span style={{ fontSize: '13px', fontWeight: '500' }}>active governance bodies</span>
              </p>
            </div>
            
            <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
              <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Total Customers Reach
              </h4>
              <p style={{ margin: 0, color: '#1e3a8a', fontSize: '24px', fontWeight: '700' }}>
                {kpis?.totalCustomers || 0} <span style={{ fontSize: '13px', fontWeight: '500' }}>registered clients</span>
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default BoardOverview;
