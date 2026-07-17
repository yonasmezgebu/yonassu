import React, { useState, useEffect } from 'react';
import { Package, Download, Filter, DownloadCloud, XCircle, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDeliveries, updateDeliveryStatus } from '../../utils/storeApi';
import { storeInfo } from '../../utils/storeNotifications';
import api from '../../services/apiClient';

const statusColors = {
  Pending: { bg: '#fef3c7', c: '#92400e' },
  'In Transit': { bg: '#eff6ff', c: '#1d4ed8' },
  Received: { bg: '#dcfce7', c: '#166534' },
  Rejected: { bg: '#fee2e2', c: '#991b1b' },
};

const StoreDeliveries = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('internal');
  const [publicDeliveries, setPublicDeliveries] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [receivingId, setReceivingId] = useState(null);

  const load = () => getDeliveries().then(r => { setDeliveries(r.data || []); setLoading(false); }).catch(() => setLoading(false));

  const loadPublic = async () => {
    setLoadingPublic(true);
    try {
      const res = await api.get('/public-procurement/deliveries');
      setPublicDeliveries(res.data?.data || res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingPublic(false); }
  };

  useEffect(() => { load(); loadPublic(); }, []);

  const handleReceive = (del) => {
    navigate('/store-management/goods-receipt', { state: { prefill: del } });
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      try {
        await updateDeliveryStatus(id, { status: 'Rejected', rejection_reason: reason });
        load();
      } catch {}
    }
  };

  const handleReceivePublic = async (tenderId) => {
    setReceivingId(tenderId);
    try {
      await api.put(`/public-procurement/deliveries/${tenderId}/receive`);
      loadPublic();
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Delivery marked as received! Finance has been notified.');
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err.message));
    } finally { setReceivingId(null); }
  };

  const uniqueSuppliers = [...new Set(deliveries.map(d => d.supplier_name).filter(Boolean))];
  const filtered = deliveries.filter(d => {
    if (filterSupplier !== 'All' && d.supplier_name !== filterSupplier) return false;
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>Loading...</div>;

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#06b6d4" size={28} /> DELIVERIES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Inbound delivery tracking — internal &amp; public procurement.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('internal')}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', background: activeTab === 'internal' ? '#06b6d4' : 'white', color: activeTab === 'internal' ? 'white' : '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <Package size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} /> Internal Deliveries
        </button>
        <button
          onClick={() => setActiveTab('public')}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', background: activeTab === 'public' ? '#06b6d4' : 'white', color: activeTab === 'public' ? 'white' : '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShoppingCart size={15} /> Public Procurement
          {publicDeliveries.filter(d => d.status === 'PENDING').length > 0 && (
            <span style={{ background: '#ef4444', color: 'white', padding: '2px 7px', borderRadius: 12, fontSize: 11 }}>
              {publicDeliveries.filter(d => d.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>
      {/* Internal Deliveries Tab */}
      {activeTab === 'internal' && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
            <Filter size={15} color="#64748b" />
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
              <option value="All">All Suppliers</option>
              {uniqueSuppliers.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
              <option value="All">All Statuses</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Received</option>
              <option>Rejected</option>
            </select>
          </div>
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Delivery #', 'Supplier Name', 'Items Delivered', 'Quantities', 'Delivery Date', 'Ref PO #', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#06b6d4', fontWeight: 700 }}>{d.delivery_no}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{d.supplier_name}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{d.items_description}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>{d.quantity_summary}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{d.po_reference}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (statusColors[d.status] || statusColors.Pending).bg, color: (statusColors[d.status] || statusColors.Pending).c }}>{d.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {d.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleReceive(d)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            <DownloadCloud size={13} /> Receive (M19)
                          </button>
                          <button onClick={() => handleReject(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                      {d.status !== 'Pending' && (
                        <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No deliveries found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Public Procurement Deliveries Tab */}
      {activeTab === 'public' && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Tender', 'Tender No.', 'Status', 'Received At', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingPublic ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              ) : publicDeliveries.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No public procurement deliveries yet.</td></tr>
              ) : publicDeliveries.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{d.tender_title || '—'}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#06b6d4' }}>{d.tender_number || `TND-${d.public_tender_id}`}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: d.status === 'RECEIVED' ? '#dcfce7' : '#fef3c7', color: d.status === 'RECEIVED' ? '#166534' : '#92400e' }}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    {d.received_at ? new Date(d.received_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {d.status === 'PENDING' && (
                      <button
                        onClick={() => handleReceivePublic(d.public_tender_id)}
                        disabled={receivingId === d.public_tender_id}
                        style={{ padding: '7px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                      >
                        {receivingId === d.public_tender_id ? 'Receiving...' : '✅ Mark as Received'}
                      </button>
                    )}
                    {d.status === 'RECEIVED' && <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Completed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StoreDeliveries;