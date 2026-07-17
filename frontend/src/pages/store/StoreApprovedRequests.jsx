import React, { useState, useEffect } from 'react';
import { CheckCircle, Filter, Download, Eye } from 'lucide-react';
import { getApprovedRequests } from '../../utils/storeApi';

const StoreApprovedRequests = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [viewDoc, setViewDoc] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovedRequests();
      setRequests(res.data.map(item => ({
        id: item.requisition_id || item.id,
        m21: item.approval_no,
        dept: item.department,
        items: item.items?.[0]?.item_name || '-',
        qtyApproved: item.items?.[0]?.quantity_approved || 0,
        approvedBy: item.approved_by,
        approvalDate: item.approval_date,
        stampId: item.stamp_id || '—',
        status: item.status,
      })));
    } catch (e) {
      setError(e.message || 'Failed to load approved requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = requests
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => !filterDate || r.approvalDate === filterDate);

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 16 }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: '#991b1b', fontSize: 16 }}>Error: {error}</p>
        <button onClick={fetchRequests} style={{ padding: '8px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle color="#22c55e" size={28} /> FULFILLED / ISSUED REQUESTS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Requests that have been issued stock by the Store</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <Download size={15} /> Export List
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Approval Date:</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }} />
        </div>
        {filterDate && <button onClick={() => setFilterDate('')} style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Clear Date</button>}
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Request #', 'M21 #', 'Requesting Dept', 'Items Approved', 'Qty Approved', 'Approved By', 'Approval Date', 'Digital Stamp', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0284c7' }}>{r.m21}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                <td style={{ padding: '12px 14px' }}>{r.items}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qtyApproved}</td>
                <td style={{ padding: '12px 14px' }}>{r.approvedBy}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.approvalDate}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>{r.stampId}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: r.status === 'Completed' ? '#dcfce7' : '#eff6ff', color: r.status === 'Completed' ? '#166534' : '#1d4ed8' }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => setViewDoc(r)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      {viewDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 560, border: '2px solid #22c55e' }}>
            <h3 style={{ margin: '0 0 16px', color: '#166534' }}>M21 Approval Document: {viewDoc.id}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 20 }}>
              <div><strong>M20 Req #:</strong> {viewDoc.id}</div>
              <div><strong>M21 Approval #:</strong> {viewDoc.m21}</div>
              <div><strong>Department:</strong> {viewDoc.dept}</div>
              <div><strong>Items:</strong> {viewDoc.items}</div>
              <div><strong>Qty Approved:</strong> {viewDoc.qtyApproved}</div>
              <div><strong>Approved By:</strong> {viewDoc.approvedBy}</div>
              <div><strong>Approval Date:</strong> {viewDoc.approvalDate}</div>
              <div><strong>Status:</strong> {viewDoc.status}</div>
            </div>
            <div style={{ padding: 16, background: '#dcfce7', border: '2px solid #22c55e', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#166534', marginBottom: 20 }}>
              ✅ OFFICIAL DIGITAL STAMP: {viewDoc.stampId}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewDoc(null)} style={{ padding: '8px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreApprovedRequests;
