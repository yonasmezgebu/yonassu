import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download } from 'lucide-react';
import { getRequisitions } from '../../utils/storeApi';

const StoreRequisitions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const statusColors = { Pending: { bg: '#fef3c7', c: '#92400e' }, Approved: { bg: '#dcfce7', c: '#166534' }, Issued: { bg: '#eff6ff', c: '#1d4ed8' }, Rejected: { bg: '#fee2e2', c: '#991b1b' } };
  const priorityColors = { Low: { bg: '#f1f5f9', c: '#475569' }, Normal: { bg: '#f1f5f9', c: '#475569' }, High: { bg: '#fef3c7', c: '#92400e' }, Urgent: { bg: '#fef3c7', c: '#92400e' }, Emergency: { bg: '#fee2e2', c: '#991b1b' } };

  const fetchReqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequisitions();
      setData(res.data.map(item => ({
        id: item.requisition_no,
        dept: item.department || '-',
        items: item.items?.[0]?.item_name || '-',
        qty: item.items?.reduce((s, i) => s + Number(i.quantity), 0) || 0,
        priority: item.priority || 'Normal',
        date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '-',
        status: item.status,
        _apiId: item.id,
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReqs(); }, []);

  const filtered = data
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => filterStatus === 'All' || r.status === filterStatus);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText color="#6366f1" size={28} /> ALL REQUISITIONS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Read-Only View — Requests managed by Department Managers and CEO</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <Download size={15} /> Export
        </button>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#475569' }}>
        Requisitions are created by Department Managers. Approval/rejection is handled by the CEO. Store can view all requests and confirm fulfillment of CEO-approved ones.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Issued</option>
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1', borderRadius: '50%', width: 36, height: 36, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b' }}>Loading requisitions...</p>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#991b1b', marginBottom: 12 }}>Failed to load requisitions: {error}</p>
          <button onClick={fetchReqs} style={{ padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Requisition #', 'Requesting Dept', 'Items Requested', 'Qty', 'Priority', 'Request Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                  <td style={{ padding: '12px 14px' }}>{r.items}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qty}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: (priorityColors[r.priority] || priorityColors.Normal).bg, color: (priorityColors[r.priority] || priorityColors.Normal).c }}>{r.priority}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: (statusColors[r.status] || statusColors.Pending).bg, color: (statusColors[r.status] || statusColors.Pending).c }}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No requisitions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoreRequisitions;
