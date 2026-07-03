import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  ClipboardList, Clock, CheckCircle, XCircle, Package, RefreshCw,
  Eye, User, Phone, Pill, Building2, AlertCircle, MapPin
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending', icon: <Clock size={16} />, color: '#f59e0b' },
  { key: 'PREPARED', label: 'Prepared', icon: <Package size={16} />, color: '#3b82f6' },
  { key: 'PICKED_UP', label: 'Picked Up', icon: <CheckCircle size={16} />, color: '#10b981' },
];

export default function PharmacyWorkerPrescriptions() {
  const { showToast, ToastContainer } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [branchModal, setBranchModal] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const fetchPrescriptions = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/pharmacy/prescriptions?status=${status}`);
      setPrescriptions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions(activeTab);
  }, [activeTab, fetchPrescriptions]);

  const openBranchModal = async (prescription) => {
    setSelectedBranch('');
    try {
      const res = await apiClient.get('/pharmacy/branches');
      setBranches(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setBranchModal(prescription);
  };

  const handlePrepare = async () => {
    if (!branchModal || !selectedBranch) { showToast('Please select a pickup branch', 'warning'); return; }
    setActionLoading(true);
    try {
      await apiClient.patch(`/pharmacy/prescriptions/${branchModal.id}/status`, {
        status: 'PREPARED',
        pickup_branch_id: selectedBranch,
      });
      showToast('Prescription marked as PREPARED', 'success');
      playSound('success');
      setBranchModal(null);
      fetchPrescriptions(activeTab);
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickUp = async (prescription) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/pharmacy/prescriptions/${prescription.id}/status`, {
        status: 'PICKED_UP',
      });
      showToast('Prescription marked as PICKED_UP', 'success');
      playSound('success');
      fetchPrescriptions(activeTab);
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={22} color="#059669" /> Incoming Prescriptions (B9)
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>View and manage incoming prescription requests</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.key}
            style={{
              ...tabBtn(activeTab === tab.key),
              borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
              color: activeTab === tab.key ? tab.color : '#475569',
            }}
            onClick={() => setActiveTab(tab.key)}>
            {tab.icon} {tab.label}
          </button>
        ))}
        <button onClick={() => fetchPrescriptions(activeTab)}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          <ClipboardList size={48} color="#d1d5db" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>No {activeTab.toLowerCase()} prescriptions</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>Reference #</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Drug</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>#{p.reference_number || p.id}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.customer_name}</div>
                    {p.customer_phone && <div style={{ fontSize: 11, color: '#64748B' }}>{p.customer_phone}</div>}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pill size={13} color="#64748B" /> {p.drug_name}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{p.quantity}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, color: '#475569' }}>{p.source || '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadge(p.status)}>{p.status}</span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.status === 'PENDING' && (
                        <button onClick={() => openBranchModal(p)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Package size={12} /> Prepare
                        </button>
                      )}
                      {p.status === 'PREPARED' && (
                        <button onClick={() => handlePickUp(p)} disabled={actionLoading}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Pick Up
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {branchModal && (
        <div style={overlayStyle} onClick={() => setBranchModal(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#059669" /> Branch Availability
              </h3>
              <button onClick={() => setBranchModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginBottom: 16, background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{branchModal.drug_name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Customer: {branchModal.customer_name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Quantity: {branchModal.quantity}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Pickup Branch *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {branches.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No branches available</div>
                ) : (
                  branches.map(b => {
                    const stock = b.stock_quantity != null ? parseInt(b.stock_quantity) : null;
                    const isAvailable = stock !== null && stock > 0;
                    return (
                      <label key={b.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        border: `2px solid ${selectedBranch === String(b.id) ? '#059669' : '#E2E8F0'}`,
                        borderRadius: 8, cursor: 'pointer', background: selectedBranch === String(b.id) ? '#ECFDF5' : 'white',
                      }}>
                        <input type="radio" name="branch" value={b.id}
                          checked={selectedBranch === String(b.id)}
                          onChange={() => setSelectedBranch(String(b.id))}
                          style={{ display: 'none' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>{b.name || b.branch_name}</div>
                          <div style={{ fontSize: 12, color: isAvailable ? '#065F46' : '#EF4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            {isAvailable ? '✅ AVAILABLE' : '❌ OUT OF STOCK'}
                            {isAvailable && <span style={{ color: '#64748B' }}>({stock} units)</span>}
                          </div>
                        </div>
                        {selectedBranch === String(b.id) && <CheckCircle size={18} color="#059669" />}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setBranchModal(null)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handlePrepare} disabled={actionLoading || !selectedBranch}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none', background: !selectedBranch ? '#94A3B8' : '#059669',
                  color: 'white', fontSize: 13, fontWeight: 600, cursor: actionLoading || !selectedBranch ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {actionLoading ? 'Processing...' : 'Confirm Prepare'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#F1F5F9' : 'transparent',
  border: 'none',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const modalStyle = { background: 'white', borderRadius: 12, padding: 24, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'Inter, sans-serif' };
const statusBadge = (status) => ({
  background: status === 'PENDING' ? '#FEF3C7' : status === 'PREPARED' ? '#DBEAFE' : status === 'PICKED_UP' ? '#D1FAE5' : '#F1F5F9',
  color: status === 'PENDING' ? '#92400E' : status === 'PREPARED' ? '#1E40AF' : status === 'PICKED_UP' ? '#065F46' : '#475569',
  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
});
