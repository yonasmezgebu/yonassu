import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { Plus, List, AlertCircle, Clock, CheckCircle, X, Truck } from 'lucide-react';
import './PharmacyTransferRequests.css';

const URGENCY_COLORS = { LOW: '#6B7280', MEDIUM: '#F59E0B', HIGH: '#EF4444' };
const STATUS_BADGES = {
  PENDING: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
  APPROVED: { bg: '#DBEAFE', color: '#1E40AF', text: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
  SHIPPED: { bg: '#F3E8FF', color: '#6B21A8', text: 'Shipped' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46', text: 'Completed' },
};

const PharmacyTransferRequests = () => {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('list');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ drugId: '', quantityRequested: '', urgency: 'MEDIUM', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadRequests();
    }, []);

  const loadProducts = async () => {
    try {
      const res = await apiClient.get('/pharmacy/products');
      if (res.status === 'success') setProducts(res.data || []);
    } catch (e) { console.error(e); }
  };

  const loadRequests = async () => {
    try {
      const res = await apiClient.get('/pharmacy/transfers');
      if (res.status === 'success') setRequests(res.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.drugId || !form.quantityRequested) { showToast('Please fill all required fields', 'warning'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post('/pharmacy/transfers', form);
      if (res.status === 'success') {
        showToast('Transfer request created and sent to CEO', 'success');
        setForm({ drugId: '', quantityRequested: '', urgency: 'MEDIUM', notes: '' });
        setTab('list');
        loadRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Failed to create request', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="ptr-root" style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('list')} style={{
          padding: '10px 20px', borderRadius: 8, border: tab === 'list' ? '2px solid #059669' : '1px solid #E2E8F0',
          background: tab === 'list' ? '#ECFDF5' : 'white', color: tab === 'list' ? '#065F46' : '#475569',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}><List size={16} /> My Requests</button>
        <button onClick={() => setTab('create')} style={{
          padding: '10px 20px', borderRadius: 8, border: tab === 'create' ? '2px solid #059669' : '1px solid #E2E8F0',
          background: tab === 'create' ? '#ECFDF5' : 'white', color: tab === 'create' ? '#065F46' : '#475569',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}><Plus size={16} /> New Transfer Request</button>
      </div>

      {tab === 'create' && (
        <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #E2E8F0', maxWidth: 600 }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: 18, color: '#1E293B' }}>New Store Transfer Request</h2>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drug *</label>
              <select value={form.drugId} onChange={(e) => setForm(f => ({ ...f, drugId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}>
                <option value="">Select a drug</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock_quantity || 0}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Quantity *</label>
              <input type="number" min="1" value={form.quantityRequested}
                onChange={(e) => setForm(f => ({ ...f, quantityRequested: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Urgency</label>
              <select value={form.urgency} onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
            }}>{loading ? 'Submitting...' : 'Submit Request'}</button>
          </form>
        </div>
      )}

      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B' }}>My Transfer Requests</h3>
            <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{requests.length}</span>
          </div>
          {requests.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No transfer requests yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Request #</th>
                  <th style={thStyle}>Drug</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Urgency</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const badge = STATUS_BADGES[r.status] || {};
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={tdStyle}><strong>{r.request_number}</strong></td>
                      <td style={tdStyle}>{r.drug_name}</td>
                      <td style={tdStyle}>{r.quantity_requested}</td>
                      <td style={tdStyle}>
                        <span style={{ color: URGENCY_COLORS[r.urgency] || '#6B7280', fontWeight: 600 }}>{r.urgency}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {badge.text || r.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <button onClick={() => navigate(`/pharmacy/receive-shipments/${r.id}`)} style={{ ...actionBtn, background: '#F3E8FF', color: '#6B21A8' }}>
                          <Truck size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const actionBtn = { padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 };

export default PharmacyTransferRequests;
