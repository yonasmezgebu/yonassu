import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingDown, Clock, Inbox, Truck, ArrowUpRight, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { getDashboardStats } from '../../utils/storeApi';

const StoreHomeNew = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDashboardStats();
        setStats(res.data || res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 18, color: '#dc2626' }}>{error}</div>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            getDashboardStats()
              .then(res => setStats(res.data || res))
              .catch(err => setError(err.message || 'Failed to load dashboard'))
              .finally(() => setLoading(false));
          }}
          style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Items in Stock', value: String(stats.totalItems), icon: <Package size={24} color="#3b82f6" />, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', path: '/store/stock-list' },
    { label: 'Total Stock Value', value: 'ETB ' + Number(stats.totalValue).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}), icon: <TrendingDown size={24} color="#10b981" />, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', path: '/store/stock-list' },
    { label: 'Low Stock Alerts', value: String(stats.lowStockCount), icon: <AlertTriangle size={24} color="#f59e0b" />, bg: '#fef3c7', border: '#fde68a', color: '#b45309', path: '/store/stock-list' },
    { label: 'Pending Requisitions', value: String(stats.pendingRequisitions), icon: <Clock size={24} color="#8b5cf6" />, bg: '#ede9fe', border: '#c4b5fd', color: '#6d28d9', path: '/store/pending-requests' },
    { label: 'Goods Received Today', value: String(stats.todayReceipts), icon: <Inbox size={24} color="#22c55e" />, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', path: '/store/goods-received-today' },
    { label: 'Goods Issued Today', value: String(stats.todayIssues), icon: <ArrowUpRight size={24} color="#f97316" />, bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', path: '/store/goods-issued-today' },
    { label: 'Pending Transfers', value: String(stats.pendingTransfers), icon: <ClipboardCheck size={24} color="#06b6d4" />, bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490', path: '/store/stock-transfer' },
  ];

  const notifications = [];
  const now = new Date();

  if (stats.recentReceipts && stats.recentReceipts.length > 0) {
    stats.recentReceipts.slice(0, 2).forEach(item => {
      notifications.push({ icon: '📥', msg: 'Goods Received - ' + item.receipt_no, type: 'success', time: 'Just now' });
    });
  }
  if (stats.recentIssues && stats.recentIssues.length > 0) {
    stats.recentIssues.slice(0, 2).forEach(item => {
      notifications.push({ icon: '📤', msg: 'Goods Issued - ' + item.issue_no, type: 'info', time: 'Just now' });
    });
  }
  if (stats.recentTransfers && stats.recentTransfers.length > 0) {
    stats.recentTransfers.slice(0, 2).forEach(item => {
      notifications.push({ icon: '🔄', msg: 'Transfer - ' + item.transfer_no, type: 'info', time: 'Just now' });
    });
  }
  if (stats.lowStockItems && stats.lowStockItems.length > 0) {
    stats.lowStockItems.slice(0, 3).forEach(item => {
      notifications.push({ icon: '⚠️', msg: 'Low Stock Alert - ' + item.drug_name + ' (' + item.quantity + ')', type: 'warning', time: 'Just now' });
    });
  }
  if (stats.pendingRequisitions > 0) {
    notifications.push({ icon: '⏳', msg: 'Pending Requisitions - ' + stats.pendingRequisitions + ' awaiting action', type: 'info', time: 'Just now' });
  }

  const notificationBg = { success: '#f0fdf4', info: '#eff6ff', warning: '#fef3c7' };
  const notificationBorder = { success: '#bbf7d0', info: '#bfdbfe', warning: '#fde68a' };

  const getNotifPath = (icon, msg) => {
    if (icon === '📥') return '/store/goods-received-today';
    if (icon === '📤') return '/store/goods-issued-today';
    if (icon === '🔄') return '/store/transfers-list';
    if (icon === '⚠️') return '/store/stock-list';
    if (icon === '⏳') return '/store/pending-requests';
    return '/store/overview';
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
              📦 Inventory (Store) Dashboard
            </h1>
            <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 15 }}>
              Welcome, <strong>Store Manager</strong> — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ background: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
            📍 Store Location: HQ Main Warehouse
          </div>
        </div>
      </div>

      {/* QUICK STORE SUMMARY WIDGET */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>📊 Quick Store Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {summaryCards.map(card => (
          <div key={card.label} onClick={() => navigate(card.path)} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: 18, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: card.color }}>{card.label.toUpperCase()}</div>
              {card.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 'bold', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* REAL-TIME NOTIFICATIONS WIDGET */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>🔔 Real-Time Notifications</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n, i) => (
              <div key={i} onClick={() => navigate(getNotifPath(n.icon, n.msg))} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: notificationBg[n.type], border: `1px solid ${notificationBorder[n.type]}`, borderRadius: 8, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{n.msg}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '12px 14px' }}>No recent notifications</div>
            )}
          </div>
        </div>

        {/* QUICK ACCESS TABLE */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>⚡ Quick Access — 12 Menu Items</h2>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Menu Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Document Model</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [1, 'Stock List', 'View', 'View Only', '/store/stock-list'],
                  [2, 'Goods Receiving', 'Transaction', 'Model 19', '/store/goods-receiving'],
                  [3, 'Goods Issue', 'Transaction', 'Model 22', '/store/goods-issue'],
                  [4, 'Stock Transfer', 'Transaction', 'Transfer Note', '/store/stock-transfer'],
                  [5, 'Stock Adjustment', 'Transaction', 'Adjustment Note', '/store/stock-adjustment'],
                  [6, 'Physical Count', 'Audit', 'Count Report', '/store/physical-count'],
                  [7, 'Stock Movement', 'Report', 'Movement Log', '/store/stock-movement'],
                  [8, 'Requisitions (From Managers)', 'Management', 'Model 20', '/store/requisitions'],
                  [9, 'Pending (Awaiting Fulfillment)', 'Management', 'Model 20', '/store/pending-requests'],
                  [10, 'Issued / Fulfilled', 'Management', 'Model 21', '/store/approved-requests'],
                  [11, 'Request History', 'Report', 'Request Log', '/store/request-history'],
                  [12, 'Physical Count (History)', 'Report', 'Count History', '/store/count-history'],
                ].map(([num, name, type, doc, path]) => (
                  <tr key={num} onClick={() => navigate(path)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                    <td style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 700 }}>{num}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{name}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: type === 'Transaction' ? '#dcfce7' : type === 'Report' ? '#eff6ff' : type === 'Audit' ? '#fef3c7' : '#f1f5f9', color: type === 'Transaction' ? '#166534' : type === 'Report' ? '#1d4ed8' : type === 'Audit' ? '#92400e' : '#475569' }}>{type}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b', fontSize: 11 }}>{doc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHomeNew;
