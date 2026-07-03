import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { Truck, CheckCircle, AlertTriangle, Download, Info } from 'lucide-react';

const CEODirectDelivery = () => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 'DD-5001', supplier: 'PharmaCorp', drug: 'Amoxicillin 500mg', batch: 'B-1122', expiry: '2028-05-01', 
      qty: 2000, date: '2026-07-01', by: 'Pharm Manager', ref: 'INV-0099', status: 'PENDING CEO CONFIRMATION'
    },
    {
      id: 'DD-5002', supplier: 'HealthPlus', drug: 'Novelix 200mg', batch: 'NX-998', expiry: '2027-11-15', 
      qty: 500, date: '2026-07-02', by: 'Pharm Manager', ref: 'INV-0100', status: 'PENDING CEO CONFIRMATION'
    }
  ]);

  const [viewDetail, setViewDetail] = useState(null);
  
  const [issueId, setIssueId] = useState(null);
  const [issueDesc, setIssueDesc] = useState('');

  const handleConfirm = (req) => {
    setDeliveries(deliveries.map(d => d.id === req.id ? { ...d, status: 'CONFIRMED' } : d));
    submitNotification('Direct Delivery Confirmed', `Delivery ${req.id} confirmed. Finance Manager notified to process payment. Inventory updated.`);
    setViewDetail(null);
  };

  const handleReportIssue = () => {
    if (!issueDesc) return alert('Issue description is required');
    setDeliveries(deliveries.map(d => d.id === issueId ? { ...d, status: 'ISSUE REPORTED' } : d));
    receiveNotification('Delivery Issue Reported', `Issue reported for ${issueId}: ${issueDesc}. Pharmacy and Finance notified.`);
    setIssueId(null);
    setIssueDesc('');
    setViewDetail(null);
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Direct Delivery Confirmations as PDF...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck color="#14b8a6"/> CONFIRM DIRECT DELIVERY
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Confirm Supplier Deliveries Made Directly to Pharmacy (Bypassing Store)</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Delivery Ref</th>
              <th style={{ padding: 12 }}>Supplier</th>
              <th style={{ padding: 12 }}>Drug Name</th>
              <th style={{ padding: 12 }}>Qty Received</th>
              <th style={{ padding: 12 }}>Received Date</th>
              <th style={{ padding: 12 }}>Recorded By</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{d.id}</td>
                <td style={{ padding: 12 }}>{d.supplier}</td>
                <td style={{ padding: 12 }}>{d.drug}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{d.qty}</td>
                <td style={{ padding: 12 }}>{d.date}</td>
                <td style={{ padding: 12 }}>{d.by}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: d.status === 'CONFIRMED' ? '#dcfce7' : d.status === 'ISSUE REPORTED' ? '#fee2e2' : '#fef3c7', color: d.status === 'CONFIRMED' ? '#166534' : d.status === 'ISSUE REPORTED' ? '#991b1b' : '#b45309' }}>
                    {d.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDetail(d)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={14}/> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REVIEW DETAILS MODAL */}
      {viewDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Review Delivery: {viewDetail.id}</h2>
              <button onClick={() => setViewDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #cbd5e1', paddingBottom: 8, marginBottom: 8, fontWeight: 'bold', color: '#334155' }}>Supplier Details</div>
              <div><strong>Supplier Name:</strong> {viewDetail.supplier}</div>
              <div><strong>Invoice/Ref:</strong> {viewDetail.ref}</div>
              
              <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #cbd5e1', paddingBottom: 8, marginBottom: 8, marginTop: 8, fontWeight: 'bold', color: '#334155' }}>Drug Details</div>
              <div><strong>Drug Name:</strong> {viewDetail.drug}</div>
              <div><strong>Batch Number:</strong> {viewDetail.batch}</div>
              <div><strong>Expiry Date:</strong> {viewDetail.expiry}</div>
              <div><strong>Quantity Received:</strong> <span style={{ fontSize: 18, fontWeight: 'bold', color: '#14b8a6' }}>{viewDetail.qty}</span></div>
            </div>

            {viewDetail.status === 'PENDING CEO CONFIRMATION' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                <button onClick={() => setIssueId(viewDetail.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <AlertTriangle size={16}/> REPORT ISSUE
                </button>
                <button onClick={() => handleConfirm(viewDetail)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16}/> CONFIRM RECEIVED
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {issueId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 450 }}>
            <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle/> Report Delivery Issue</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>This will cancel the pending inventory update and notify the Pharmacy Manager and Finance Manager.</p>
            <textarea placeholder="Describe the issue (e.g., incorrect quantity, damaged goods)..." value={issueDesc} onChange={e => setIssueDesc(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setIssueId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReportIssue} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEODirectDelivery;
