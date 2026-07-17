import React, { useState, useEffect } from 'react';
import { Clock, Filter, CheckCircle, XCircle, Package } from 'lucide-react';
import { getRequisitions, updateRequisitionStatus } from '../../utils/storeApi';

const StorePendingRequests = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState([]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequisitions({ status: 'Approved' });
      setRequests(res.data.map(item => ({
        id: item.requisition_no,
        dept: item.department,
        items: item.items?.[0]?.item_name || '-',
        qty: item.items?.[0]?.quantity || 0,
        daysPending: Math.ceil((Date.now() - new Date(item.created_at)) / 86400000),
        priority: item.priority,
        _apiId: item.id,
      })));
    } catch (e) {
      setError(e.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirm = async (id) => {
    const item = requests.find(r => r.id === id);
    if (!item) return;
    try {
      await updateRequisitionStatus(item._apiId, { status: 'Issued' });
      setConfirmed(a => [...a, id]);
      setRequests(r => r.filter(x => x.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to confirm fulfillment');
    }
  };

  const handleReject = async (id) => {
    const item = requests.find(r => r.id === id);
    if (!item) return;
    try {
      await updateRequisitionStatus(item._apiId, { status: 'Rejected' });
      setRequests(r => r.filter(x => x.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to reject');
    }
  };

  const filtered = requests
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => filterPriority === 'All' || r.priority === filterPriority);

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
            <Clock color="#22c55e" size={28} /> PENDING FULFILLMENT
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>CEO-Approved Requests Awaiting Store Confirmation</p>
        </div>
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#166534' }}>
          {filtered.length} Awaiting Fulfillment
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
        These requests have been <strong>approved by CEO</strong>. Store can confirm fulfillment (issue stock) or mark as cannot fulfill.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Priorities</option>
          <option>Emergency</option>
          <option>Urgent</option>
          <option>Normal</option>
        </select>
      </div>

      {confirmed.length > 0 && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#166534' }}>
          {confirmed.length} request(s) confirmed fulfilled. Stock has been issued.
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Request #', 'Requesting Dept', 'Items Requested', 'Qty', 'Days Since Approval', 'Priority', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No CEO-approved requests awaiting fulfillment.</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: r.priority === 'Emergency' ? '#fff5f5' : r.priority === 'Urgent' ? '#fffbf0' : 'white' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                <td style={{ padding: '12px 14px' }}>{r.items}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qty}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 700, color: r.daysPending >= 3 ? '#b91c1c' : '#475569' }}>{r.daysPending}d</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: r.priority === 'Emergency' ? '#fee2e2' : r.priority === 'Urgent' ? '#fef3c7' : '#f1f5f9', color: r.priority === 'Emergency' ? '#991b1b' : r.priority === 'Urgent' ? '#92400e' : '#475569' }}>{r.priority}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleConfirm(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                      <CheckCircle size={13} /> Confirm Fulfillment
                    </button>
                    <button onClick={() => handleReject(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                      <XCircle size={13} /> Cannot Fulfill
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorePendingRequests;
