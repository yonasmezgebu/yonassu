import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Package, TrendingUp, AlertTriangle, Activity, FileText, Download, Printer } from 'lucide-react';
import { triggerNotification } from '../../utils/pharmacyNotifications';

const PharmacyReportsHub = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ dateRange: '', branch: 'All' });

  const reports = [
    { title: 'Inventory Report', desc: 'Current stock levels and valuation', path: '/pharmacy/inventory-report', icon: <Package size={24} />, color: '#3b82f6', updated: 'Today, 08:00 AM' },
    { title: 'Sales Report', desc: 'Comprehensive sales metrics and finance submission', path: '/pharmacy/sales-report', icon: <TrendingUp size={24} />, color: '#10b981', updated: 'Today, 12:30 PM' },
    { title: 'Expiry Report', desc: 'Monitor expiring and expired batches', path: '/pharmacy/expiry-report', icon: <AlertTriangle size={24} />, color: '#ef4444', updated: 'Yesterday, 17:00' },
    { title: 'Stock Movement', desc: 'Chronological log of all inventory events', path: '/pharmacy/stock-movement', icon: <Activity size={24} />, color: '#06b6d4', updated: 'Today, 10:15 AM' },
    { title: 'Daily Summary', desc: 'Real-time operational recap', path: '/pharmacy/daily-summary', icon: <FileText size={24} />, color: '#8b5cf6', updated: 'Live' },
  ];

  const handleExport = (e, title) => {
    e.stopPropagation();
    triggerNotification('Export Successful', `${title} exported to PDF`, 'success');
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    triggerNotification('Printing', 'Sending report to printer...', 'info');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={24} color="#0284c7" /> REPORTS HUB
        </h2>
        <p style={{ color: '#64748b', margin: 0 }}>🔗 Central access for all pharmacy reports</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Global Date Range</label>
          <input type="date" value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Global Branch Filter</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {reports.map((r, i) => (
          <div key={i} onClick={() => navigate(r.path)} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, cursor: 'pointer', transition: 'transform 0.15s', ':hover': { transform: 'translateY(-2px)' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ background: `${r.color}15`, color: r.color, padding: 12, borderRadius: 8 }}>
                {r.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>{r.title}</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Last Updated: {r.updated}</div>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 20, minHeight: 40 }}>{r.desc}</p>
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <button onClick={(e) => handleExport(e, r.title)} style={{ flex: 1, padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Download size={16} /> Export
              </button>
              <button onClick={handlePrint} style={{ flex: 1, padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PharmacyReportsHub;
