import React, { useState } from 'react';
import { AlertTriangle, Download, Printer, ShieldAlert, Trash2 } from 'lucide-react';
import { triggerNotification } from '../../utils/pharmacyNotifications';

const PharmacyExpiryReport = () => {
  const [activeTab, setActiveTab] = useState('soon');
  const [filters, setFilters] = useState({ dateRange: '', branch: 'All', category: 'All' });

  const mockExpiringSoon = [
    { id: 1, name: 'Paracetamol 500mg', batch: 'B-101', expiry: '2026-07-20', qty: 15, value: 750, branch: 'Branch A', daysUntil: 19 },
    { id: 2, name: 'Vitamin C', batch: 'B-99', expiry: '2026-07-25', qty: 200, value: 6000, branch: 'Branch A', daysUntil: 24 },
  ];

  const mockExpired = [
    { id: 3, name: 'Amoxicillin 250mg', batch: 'B-88', expiry: '2026-06-15', qty: 10, value: 3500, branch: 'Branch B', daysExpired: 16, ceoStatus: 'APPROVED' },
    { id: 4, name: 'Ibuprofen 400mg', batch: 'B-77', expiry: '2026-05-10', qty: 5, value: 1250, branch: 'Branch A', daysExpired: 52, ceoStatus: 'PENDING' },
  ];

  const handleExport = (format) => {
    triggerNotification('Export Successful', `Expiry Report exported as ${format}`, 'success');
  };

  const handleReportCEO = (item) => {
    triggerNotification('Reported to CEO', `Expired drug ${item.name} reported to CEO for disposal approval.`, 'info');
  };

  const handleInitiateDisposal = (item) => {
    triggerNotification('Disposal Initiated', `Disposal of ${item.name} executed and recorded as LOSS.`, 'success');
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={24} color="#ef4444" /> EXPIRY REPORT
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 View Expiring and Expired Drugs (Manager Only)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('PDF')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button onClick={() => setActiveTab('soon')} style={{ padding: '8px 16px', border: 'none', background: activeTab === 'soon' ? '#ef4444' : 'transparent', color: activeTab === 'soon' ? 'white' : '#64748b', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Expiring Soon (Next 30 Days)</button>
        <button onClick={() => setActiveTab('expired')} style={{ padding: '8px 16px', border: 'none', background: activeTab === 'expired' ? '#ef4444' : 'transparent', color: activeTab === 'expired' ? 'white' : '#64748b', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Already Expired</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Expiry Date Range</label>
          <input type="date" value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Branch</label>
          <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Branch A</option><option>Branch B</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Drug Category</label>
          <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <option>All</option><option>Painkillers</option><option>Antibiotics</option><option>Supplements</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: 12, color: '#475569' }}>Drug Name</th>
              <th style={{ padding: 12, color: '#475569' }}>Batch & Branch</th>
              <th style={{ padding: 12, color: '#475569' }}>Expiry Date</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Qty at Risk</th>
              <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Total Value</th>
              <th style={{ padding: 12, color: '#475569' }}>{activeTab === 'soon' ? 'Days Until' : 'Days Expired'}</th>
              {activeTab === 'expired' && <th style={{ padding: 12, color: '#475569', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'soon' ? mockExpiringSoon : mockExpired).map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{item.name}</td>
                <td style={{ padding: 12 }}>
                  <div>{item.batch}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{item.branch}</div>
                </td>
                <td style={{ padding: 12, color: '#ef4444', fontWeight: 'bold' }}>{item.expiry}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>{item.qty}</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>${item.value.toFixed(2)}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: activeTab === 'soon' ? '#fef3c7' : '#fee2e2', color: activeTab === 'soon' ? '#b45309' : '#991b1b' }}>
                    {activeTab === 'soon' ? `${item.daysUntil} days left` : `${item.daysExpired} days ago`}
                  </span>
                </td>
                {activeTab === 'expired' && (
                  <td style={{ padding: 12, textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleReportCEO(item)} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={16} /> Report to CEO
                    </button>
                    <button 
                      onClick={() => handleInitiateDisposal(item)}
                      disabled={item.ceoStatus !== 'APPROVED'}
                      style={{ padding: '6px 12px', background: item.ceoStatus === 'APPROVED' ? '#ef4444' : '#f1f5f9', color: item.ceoStatus === 'APPROVED' ? 'white' : '#cbd5e1', border: 'none', borderRadius: 6, cursor: item.ceoStatus === 'APPROVED' ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={16} /> Initiate Disposal
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {((activeTab === 'soon' ? mockExpiringSoon : mockExpired).length === 0) && (
              <tr>
                <td colSpan={activeTab === 'expired' ? 7 : 6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                  No records found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacyExpiryReport;
