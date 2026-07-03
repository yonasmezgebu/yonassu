import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  ClipboardCheck, Clock, CheckCircle, XCircle, RefreshCw, FileText,
  User, Pill, DollarSign, Hash, AlertCircle, Eye, List, Package
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending', icon: <Clock size={16} />, color: '#f59e0b' },
  { key: 'APPROVED', label: 'Approved', icon: <CheckCircle size={16} />, color: '#10b981' },
  { key: 'REJECTED', label: 'Rejected', icon: <XCircle size={16} />, color: '#ef4444' },
];

export default function CEORequestApprovals() {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [ceoValue, setCeoValue] = useState('');
  const [result, setResult] = useState(null);

  const fetchRequests = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/pharmacy/manager-requests?status=${status}`);
      setRequests(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab, fetchRequests]);

  const openDetail = (req) => {
    setSelectedRequest(req);
    setCeoValue('');
    setResult(null);
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setCeoValue('');
    setResult(null);
  };

  const handleSubmitVerification = async () => {
    if (!selectedRequest) return;
    if (!ceoValue.trim() || isNaN(parseFloat(ceoValue))) {
      showToast('Please enter a valid numeric value', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.patch(`/pharmacy/manager-requests/${selectedRequest.id}/ceo-number`, {
        ceo_value: parseFloat(ceoValue),
      });
      if (res.status === 'success') {
        const data = res.data || {};
        const isMatch = data.match || data.approved || data.status === 'APPROVED';
        setResult({
          approved: isMatch,
          message: isMatch
            ? 'Update Approved!'
            : 'Update Rejected — Values did not match',
        });
        playSound(isMatch ? 'success' : 'error');
        fetchRequests(activeTab);
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Verification failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const requestTypeIcon = (type) => {
    if (type?.toLowerCase().includes('quantity') || type?.toLowerCase().includes('qty')) return <Package size={14} />;
    if (type?.toLowerCase().includes('price')) return <DollarSign size={14} />;
    return <FileText size={14} />;
  };
  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={22} color="#059669" /> CEO Request Approvals (B2)
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Review and verify manager requests for drug updates</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab.key}
            style={{
              ...tabBtn(activeTab === tab.key),
              borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
              color: activeTab === tab.key ? tab.color : '#475569',
            }}
            onClick={() => { setActiveTab(tab.key); setSelectedRequest(null); }}>
            {tab.icon} {tab.label}
          </button>
        ))}
        <button onClick={() => fetchRequests(activeTab)}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          <ClipboardCheck size={48} color="#d1d5db" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>No {activeTab.toLowerCase()} requests</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>Drug Name</th>
                <th style={thStyle}>Request Type</th>
                <th style={thStyle}>Current Value</th>
                <th style={thStyle}>Requested Value</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                  onClick={() => openDetail(req)}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Pill size={14} color="#64748B" /> {req.drug_name}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: req.request_type?.toLowerCase().includes('price') ? '#EFF6FF' : '#F0FDF4',
                      color: req.request_type?.toLowerCase().includes('price') ? '#1E40AF' : '#065F46',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {requestTypeIcon(req.request_type)} {req.request_type || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{req.current_value ?? '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: '#059669' }}>{req.requested_value ?? '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: '#64748B', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.reason || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadge(req.status)}>{req.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={(e) => { e.stopPropagation(); openDetail(req); }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <div style={overlayStyle} onClick={closeDetail}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardCheck size={18} color="#059669" /> Request Detail
              </h3>
              <button onClick={closeDetail} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18 }}>✕</button>
            </div>

            {result ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {result.approved ? '✅' : '❌'}
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, color: result.approved ? '#059669' : '#EF4444' }}>
                  {result.message}
                </h2>
                <button onClick={closeDetail}
                  style={{ marginTop: 16, padding: '10px 24px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B', fontWeight: 600 }}>
                    <Pill size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Manager requested to update: {selectedRequest.drug_name}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11 }}>Request Type</span>
                      <div style={{ fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{selectedRequest.request_type || '—'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11 }}>Reason</span>
                      <div style={{ fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{selectedRequest.reason || '—'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11 }}>Current Value</span>
                      <div style={{ fontWeight: 700, color: '#475569', marginTop: 2 }}>{selectedRequest.current_value ?? '—'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: 11 }}>Requested Value</span>
                      <div style={{ fontWeight: 700, color: '#059669', marginTop: 2 }}>{selectedRequest.requested_value ?? '—'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>CEO provides actual value *</label>
                  <input type="number" step="0.01" min="0" value={ceoValue}
                    onChange={e => setCeoValue(e.target.value)}
                    placeholder="Enter the verified value..."
                    style={inputStyle()} />
                </div>

                <button onClick={handleSubmitVerification} disabled={submitting || !ceoValue.trim()}
                  style={{
                    width: '100%', padding: '14px 24px', background: !ceoValue.trim() ? '#94A3B8' : '#059669', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: submitting || !ceoValue.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                  }}>
                  <ClipboardCheck size={18} /> {submitting ? 'Verifying...' : 'Submit Verification'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#F1F5F9' : 'transparent',
  border: 'none',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const modalStyle = { background: 'white', borderRadius: 12, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'Inter, sans-serif' };
const statusBadge = (status) => ({
  background: status === 'PENDING' ? '#FEF3C7' : status === 'APPROVED' ? '#D1FAE5' : status === 'REJECTED' ? '#FEE2E2' : '#F1F5F9',
  color: status === 'PENDING' ? '#92400E' : status === 'APPROVED' ? '#065F46' : status === 'REJECTED' ? '#991B1B' : '#475569',
  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
});
