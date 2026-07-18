import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, Eye, X } from 'lucide-react';
import { getTransfers } from '../../utils/storeApi';

const StoreTransfersList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchData = () => {
    setLoading(true);
    getTransfers()
      .then(r => { setTransfers(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const statusStyle = (s) => {
    const m = { 'Pending': { bg: '#fef3c7', color: '#92400e' }, 'Approved': { bg: '#dcfce7', color: '#166534' }, 'In Transit': { bg: '#eff6ff', color: '#1d4ed8' }, 'Received': { bg: '#f0fdf4', color: '#15803d' }, 'Cancelled': { bg: '#fee2e2', color: '#991b1b' } };
    return m[s] || { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9' }}>
            <ArrowLeftRight color="#8b5cf6" size={28} /> STOCK TRANSFERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>All stock transfers across locations</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      ) : transfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No stock transfers found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All stock transfers between locations will appear here</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3e8ff' }}>
                {['Transfer No', 'From', 'To', 'Items', 'Total Qty', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#6d28d9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.transfer_no}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.from_location || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.to_location || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>{(t.items || []).length} item(s)</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{(t.items || []).reduce((s, i) => s + Number(i.quantity), 0)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusStyle(t.status).bg, color: statusStyle(t.status).color }}>{t.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{new Date(t.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setDetail(t)} title="View" style={{ padding: '5px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', color: '#1d4ed8' }}><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{detail.transfer_no}</h2>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: 13 }}>
              <div><strong>From:</strong> {detail.from_location || '—'}</div>
              <div><strong>To:</strong> {detail.to_location || '—'}</div>
              <div><strong>Type:</strong> {detail.transfer_type || '—'}</div>
              <div><strong>Authorized By:</strong> {detail.authorized_by || '—'}</div>
              <div><strong>Status:</strong> <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: statusStyle(detail.status).bg, color: statusStyle(detail.status).color }}>{detail.status}</span></div>
              <div><strong>Date:</strong> {new Date(detail.created_at).toLocaleString()}</div>
            </div>
            {detail.remarks && <div style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}><strong>Remarks:</strong> {detail.remarks}</div>}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Drug</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Batch</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((item, i) => (
                  <tr key={item.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px' }}>Drug #{item.drug_id}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px' }}>{item.batch_no || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTransfersList;
