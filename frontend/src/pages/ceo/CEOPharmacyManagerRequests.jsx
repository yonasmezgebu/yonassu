import React, { useState } from 'react';
import { submitNotification, receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { ClipboardList, CheckCircle, XCircle, Clock, Download, AlertTriangle, Info } from 'lucide-react';

const CEOPharmacyManagerRequests = () => {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-6001', type: 'Flow 1 (Store Transfer)', drug: 'Paracetamol 500mg', 
      storeQty: 5000, storeVal: 2500, pharmQty: 100, pharmVal: 50, reorder: 500,
      reqQty: 1000, urgency: 'High', date: '2026-07-01', status: 'PENDING'
    },
    {
      id: 'REQ-6002', type: 'Flow 2 (Drug Procurement)', drug: 'Amoxicillin 500mg', category: 'Antibiotic', classification: 'Class A',
      storeQty: 100, storeVal: 200, pharmQty: 50, pharmVal: 100, reorder: 500,
      reqQty: 1000, urgency: 'High', purpose: 'Restock due to low levels', date: '2026-07-01', status: 'PENDING'
    },
    {
      id: 'REQ-6003', type: 'Flow 3 (New Drug)', drug: 'Novelix 200mg', category: 'Antiviral', classification: 'Class B', therapeuticUse: 'Viral Infections',
      reqQty: 500, urgency: 'Critical', requestReason: 'New outbreak demands this specific antiviral not currently in formulary.', date: '2026-07-01', status: 'PENDING'
    }
  ]);

  const [viewDetail, setViewDetail] = useState(null);
  
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [waitId, setWaitId] = useState(null);
  const [waitDoc, setWaitDoc] = useState('');
  const [waitInstructions, setWaitInstructions] = useState('');

  const handleApprove = (req) => {
    setRequests(requests.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
    submitNotification('Request Approved', `Request ${req.id} (${req.type}) approved. Relevant departments notified.`);
    setViewDetail(null);
  };

  const handleReject = () => {
    if (!rejectReason) return alert('Reason is required');
    setRequests(requests.map(r => r.id === rejectId ? { ...r, status: 'REJECTED' } : r));
    receiveNotification('Request Rejected', `Request ${rejectId} rejected: ${rejectReason}`);
    setRejectId(null);
    setRejectReason('');
    setViewDetail(null);
  };

  const handleWait = () => {
    if (!waitDoc || !waitInstructions) return alert('Document upload and instructions are required for WAIT action.');
    setRequests(requests.map(r => r.id === waitId ? { ...r, status: 'WAIT (Market Research)' } : r));
    receiveNotification('Request Set to WAIT', `Request ${waitId} placed on WAIT. Task assigned to Market Team.`);
    setWaitId(null);
    setWaitDoc('');
    setWaitInstructions('');
    setViewDetail(null);
  };

  const handleExport = () => {
    triggerNotification('Export Started', 'Exporting Pharmacy Manager Requests as PDF...');
  };

  const getTypeStyle = (type) => {
    if (type.includes('Flow 1')) return { bg: '#e0e7ff', col: '#4338ca' };
    if (type.includes('Flow 2')) return { bg: '#dcfce7', col: '#15803d' };
    return { bg: '#fef3c7', col: '#b45309' };
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList color="#6366f1"/> PHARMACY MANAGER REQUESTS
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>🔗 Unified View of All Flow 1, 2, and 3 Requests</p>
        </div>
        <button onClick={handleExport} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Download size={16}/> Export Report
        </button>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: 12 }}>Req Number</th>
              <th style={{ padding: 12 }}>Request Type</th>
              <th style={{ padding: 12 }}>Drug Name</th>
              <th style={{ padding: 12 }}>Store Stock</th>
              <th style={{ padding: 12 }}>Pharm Stock</th>
              <th style={{ padding: 12 }}>Req Qty</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{r.id}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ background: getTypeStyle(r.type).bg, color: getTypeStyle(r.type).col, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>{r.type}</span>
                </td>
                <td style={{ padding: 12 }}>{r.drug}</td>
                <td style={{ padding: 12 }}>{r.type.includes('Flow 3') ? 'NOT AVAILABLE' : r.storeQty}</td>
                <td style={{ padding: 12 }}>{r.type.includes('Flow 3') ? 'NOT AVAILABLE' : r.pharmQty}</td>
                <td style={{ padding: 12, fontWeight: 'bold' }}>{r.reqQty}</td>
                <td style={{ padding: 12 }}>{r.date}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: r.status === 'APPROVED' ? '#dcfce7' : r.status.includes('REJECT') ? '#fee2e2' : '#f1f5f9', color: r.status === 'APPROVED' ? '#166534' : r.status.includes('REJECT') ? '#991b1b' : '#334155' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setViewDetail(r)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                Review Request: {viewDetail.id}
                <span style={{ background: getTypeStyle(viewDetail.type).bg, color: getTypeStyle(viewDetail.type).col, padding: '4px 8px', borderRadius: 4, fontSize: 14, fontWeight: 'bold' }}>{viewDetail.type}</span>
              </h2>
              <button onClick={() => setViewDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <div><strong>Drug Name:</strong> {viewDetail.drug}</div>
              {viewDetail.type.includes('Flow 1') && (
                <>
                  <div><strong>Requested Transfer Qty:</strong> {viewDetail.reqQty}</div>
                  <div><strong>Urgency Level:</strong> {viewDetail.urgency}</div>
                </>
              )}
              {viewDetail.type.includes('Flow 2') && (
                <>
                  <div><strong>Category:</strong> {viewDetail.category}</div>
                  <div><strong>Classification:</strong> {viewDetail.classification}</div>
                  <div><strong>Requested Quantity:</strong> {viewDetail.reqQty}</div>
                  <div><strong>Urgency Level:</strong> {viewDetail.urgency}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Purpose:</strong> {viewDetail.purpose}</div>
                </>
              )}
              {viewDetail.type.includes('Flow 3') && (
                <>
                  <div><strong>Category:</strong> {viewDetail.category}</div>
                  <div><strong>Classification:</strong> {viewDetail.classification}</div>
                  <div><strong>Therapeutic Use:</strong> {viewDetail.therapeuticUse}</div>
                  <div><strong>Requested Quantity:</strong> {viewDetail.reqQty}</div>
                  <div><strong>Urgency Level:</strong> {viewDetail.urgency}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Request Reason:</strong> {viewDetail.requestReason}</div>
                </>
              )}
            </div>

            {/* STOCK BLOCKS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>STORE DATA</h4>
                {viewDetail.type.includes('Flow 3') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', background: '#fef3c7', padding: 12, borderRadius: 4, fontWeight: 'bold' }}>
                    <AlertTriangle size={18}/> ⚠️ NOT AVAILABLE / No stock records found / This is a NEW DRUG
                  </div>
                ) : (
                  <div>
                    <p><strong>Quantity:</strong> {viewDetail.storeQty}</p>
                    <p><strong>Total Value:</strong> ${viewDetail.storeVal}</p>
                    <p><strong>Reorder Level:</strong> {viewDetail.reorder}</p>
                  </div>
                )}
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>PHARMACY DATA</h4>
                {viewDetail.type.includes('Flow 3') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', background: '#fef3c7', padding: 12, borderRadius: 4, fontWeight: 'bold' }}>
                    <AlertTriangle size={18}/> ⚠️ NOT AVAILABLE / No stock records found / This is a NEW DRUG
                  </div>
                ) : (
                  <div>
                    <p><strong>Quantity:</strong> {viewDetail.pharmQty}</p>
                    <p><strong>Total Value:</strong> ${viewDetail.pharmVal}</p>
                    <p><strong>Reorder Level:</strong> {viewDetail.reorder}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CEO DECISION BUTTONS */}
            {viewDetail.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                {!viewDetail.type.includes('Flow 1') && (
                  <button onClick={() => setWaitId(viewDetail.id)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                    <Clock size={16}/> WAIT (Assign Market Team)
                  </button>
                )}
                <button onClick={() => setRejectId(viewDetail.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <XCircle size={16}/> REJECT
                </button>
                <button onClick={() => handleApprove(viewDetail)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16}/> APPROVE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Reject Request {rejectId}</h3>
            <textarea placeholder="Enter rejection reason (required)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '100%', height: 100, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* WAIT MODAL */}
      {waitId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 450 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309' }}><Clock size={20}/> WAIT Decision - Market Research</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>This will assign a research task to the Market Team before final approval.</p>
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>Upload Document (Required)</label>
            <input type="file" onChange={e => setWaitDoc(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }} />
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>Additional Instructions (Required)</label>
            <textarea placeholder="Instructions for Market Team..." value={waitInstructions} onChange={e => setWaitInstructions(e.target.value)} style={{ width: '100%', height: 80, padding: 8, marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 4 }}></textarea>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setWaitId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleWait} style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm WAIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPharmacyManagerRequests;
