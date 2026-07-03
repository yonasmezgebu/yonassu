import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText
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
      <div className={styles.header}>
        <h2>Strategic Executive Summary</h2>
        <p>High-level insights, enterprise financials, and governance activities.</p>
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
