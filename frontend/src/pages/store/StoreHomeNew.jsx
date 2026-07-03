import React, { useEffect } from 'react';
import { Package, TrendingDown, Clock, Inbox, Truck, ArrowUpRight, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { notifyLowStock, notifyPendingRequests } from '../../utils/storeNotifications';

const StoreHomeNew = () => {
  useEffect(() => {
    // Simulate real-time low-stock check on mount
    notifyLowStock('Surgical Gloves (L)', 80);
    notifyPendingRequests(3);
  }, []);

  const summaryCards = [
    { label: 'Total Items in Stock', value: '8', icon: <Package size={24} color="#3b82f6" />, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    { label: 'Total Stock Value', value: '$4,901.50', icon: <TrendingDown size={24} color="#10b981" />, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    { label: 'Low Stock Alerts', value: '2', icon: <AlertTriangle size={24} color="#f59e0b" />, bg: '#fef3c7', border: '#fde68a', color: '#b45309' },
    { label: 'Pending Requests', value: '3', icon: <Clock size={24} color="#8b5cf6" />, bg: '#ede9fe', border: '#c4b5fd', color: '#6d28d9' },
    { label: 'Goods Received Today', value: '2', icon: <Inbox size={24} color="#22c55e" />, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    { label: 'Goods Issued Today', value: '3', icon: <ArrowUpRight size={24} color="#f97316" />, bg: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
    { label: 'Physical Count Status', value: 'Pending', icon: <ClipboardCheck size={24} color="#06b6d4" />, bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490' },
  ];

  const notifications = [
    { icon: '📥', msg: 'New Goods Received — ABC Pharma Distributors', type: 'success', time: '2 min ago' },
    { icon: '📤', msg: 'New Goods Request — Pharmacy Dept', type: 'info', time: '15 min ago' },
    { icon: '⚠️', msg: 'Low Stock Alert — Surgical Gloves (L)', type: 'warning', time: '30 min ago' },
    { icon: '⏳', msg: 'Pending Requests — 3 Awaiting Action', type: 'info', time: '1 hr ago' },
    { icon: '📋', msg: 'Physical Count Required — Full Store', type: 'info', time: '2 hr ago' },
  ];

  const notificationBg = { success: '#f0fdf4', info: '#eff6ff', warning: '#fef3c7' };
  const notificationBorder = { success: '#bbf7d0', info: '#bfdbfe', warning: '#fde68a' };

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
          <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: 18 }}>
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
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: notificationBg[n.type], border: `1px solid ${notificationBorder[n.type]}`, borderRadius: 8 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{n.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{n.msg}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
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
                  [1, 'Stock List', 'View', 'View Only'],
                  [2, 'Goods Receiving', 'Transaction', 'Model 19'],
                  [3, 'Goods Issue', 'Transaction', 'Model 22'],
                  [4, 'Stock Transfer', 'Transaction', 'Transfer Note'],
                  [5, 'Stock Adjustment', 'Transaction', 'Adjustment Note'],
                  [6, 'Physical Count', 'Audit', 'Count Report'],
                  [7, 'Stock Movement', 'Report', 'Movement Log'],
                  [8, 'Requisitions', 'Management', 'Model 20'],
                  [9, 'Pending Requests', 'Management', 'Model 20'],
                  [10, 'Approved Requests', 'Management', 'Model 21'],
                  [11, 'Request History', 'Report', 'Request Log'],
                  [12, 'Physical Count (History)', 'Report', 'Count History'],
                ].map(([num, name, type, doc]) => (
                  <tr key={num} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
