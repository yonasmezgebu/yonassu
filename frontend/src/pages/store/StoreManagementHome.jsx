import React from 'react';
import { Package, DollarSign, AlertTriangle, TrendingUp, Clock, Inbox, ArrowUpRight, Users, CheckCircle } from 'lucide-react';

const StoreManagementHome = () => {
  const summaryCards = [
    { label: 'Total Items in Stock', value: '8', icon: <Package size={22} color="#3b82f6" />, bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Total Stock Value', value: '$4,901.50', icon: <DollarSign size={22} color="#10b981" />, bg: '#f0fdf4', color: '#15803d' },
    { label: 'Low Stock Items', value: '2', icon: <AlertTriangle size={22} color="#f59e0b" />, bg: '#fef3c7', color: '#b45309' },
    { label: 'Overstock Items', value: '1', icon: <TrendingUp size={22} color="#f97316" />, bg: '#fff7ed', color: '#9a3412' },
    { label: 'Pending Requisitions', value: '3', icon: <Clock size={22} color="#8b5cf6" />, bg: '#ede9fe', color: '#6d28d9' },
    { label: 'Received Today', value: '2', icon: <Inbox size={22} color="#22c55e" />, bg: '#f0fdf4', color: '#15803d' },
    { label: 'Issued Today', value: '3', icon: <ArrowUpRight size={22} color="#06b6d4" />, bg: '#ecfeff', color: '#0e7490' },
    { label: 'Staff (Total)', value: '12', icon: <Users size={22} color="#64748b" />, bg: '#f1f5f9', color: '#334155' },
    { label: 'Present Today', value: '11', icon: <CheckCircle size={22} color="#14b8a6" />, bg: '#f0fdfa', color: '#0f766e' },
  ];

  const menuTableData = [
    [1, 'Suppliers', 'Management', 'Supplier Record'],
    [2, 'Deliveries', 'Management', 'M12'],
    [3, 'Goods Receipt', 'Transaction', 'M19'],
    [4, 'Stock Report', 'Report', 'Inventory'],
    [5, 'Stock Movement Report', 'Report', 'Movement Log'],
    [6, 'Low Stock Report', 'Report', 'Reorder Alert'],
    [7, 'Overstock Report', 'Report', 'Excess Alert'],
    [8, 'Inventory Valuation', 'Report', 'Valuation'],
    [9, 'Physical Count Report', 'Report', 'Count History'],
    [10, 'Staff List', 'Management', 'Staff Record'],
    [11, 'Assign Tasks', 'Management', 'Task Log'],
    [12, 'Attendance', 'Management', 'Attendance Record'],
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
            📋 Store (Inventory) Dashboard
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 15 }}>
            Welcome <strong>Store Manager</strong> — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ background: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          📍 Location: Main Store
        </div>
      </div>

      {/* QUICK STORE SUMMARY WIDGET */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>📊 Quick Store Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        {summaryCards.map((card, i) => (
          <div key={i} style={{ background: card.bg, borderRadius: 10, padding: 18, border: `1px solid ${card.bg.replace('f', 'e')}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: card.color }}>{card.label.toUpperCase()}</div>
              {card.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 'bold', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* QUICK ACCESS SUMMARY TABLE */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>⚡ Quick Access Summary</h2>
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569' }}># Menu Item</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569' }}>Type</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#475569' }}>Document Model</th>
              </tr>
            </thead>
            <tbody>
              {menuTableData.map(([num, name, type, doc], idx) => (
                <tr key={num} style={{ borderBottom: idx === menuTableData.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>{num}.</span> {name}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: type === 'Transaction' ? '#dcfce7' : type === 'Report' ? '#eff6ff' : type === 'Management' ? '#f3e8ff' : '#f1f5f9', color: type === 'Transaction' ? '#166534' : type === 'Report' ? '#1d4ed8' : type === 'Management' ? '#7e22ce' : '#475569' }}>
                      {type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748b' }}>{doc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreManagementHome;
