import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, Banknote, Building, Smartphone, Clock,
  User, FileText, PenTool, Eye, ChevronDown, ChevronUp, RefreshCw, Bell
} from 'lucide-react';
import api from '../../services/apiClient';

/* ─── Signature Preview ─── */
const SigPreview = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{
      height: 70, border: '1px solid #e2e8f0', borderRadius: 8,
      overflow: 'hidden', background: '#fafafa',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4
    }}>
      {sig
        ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
        : <span style={{ color: '#cbd5e1', fontSize: 11 }}>No signature</span>
      }
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
  </div>
);

/* ─── PCV Detail Expander ─── */
const PCVDetailPanel = ({ pcv }) => {
  const pm = pcv.payment_method;
  return (
    <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: 28 }}>
      {/* Info Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Date', value: new Date(pcv.date).toLocaleDateString('en-GB') },
          { label: 'Amount', value: `ETB ${parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Payment Method', value: pm },
          { label: 'Reference #', value: pcv.reference_no || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ background: '#fefce8', border: '1px dashed #fde047', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713f12', marginBottom: 6 }}>{pcv.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350f' }}>{pcv.description}</div>
      </div>

      {/* Payment Detail */}
      {pm === 'Bank' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={14} /> Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Bank: <b>{pcv.bank_name}</b></div>
            <div>A/C Name: <b>{pcv.account_holder}</b></div>
            <div>A/C No: <b>{pcv.account_number}</b></div>
            {pcv.cheque_no && <div>Cheque #: <b>{pcv.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Telebirr Details</div>
          <div style={{ fontSize: 13 }}>
            <div>Mobile: <b>{pcv.telebirr_number}</b></div>
            <div>Name: <b>{pcv.telebirr_name}</b></div>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div style={{ display: 'flex', gap: 16 }}>
        <SigPreview label="Prepared By" name={pcv.prepared_by} sig={pcv.prepared_signature} />
        <SigPreview label="Checked By" name={pcv.checked_by} sig={pcv.checked_signature} />
        <SigPreview label="Payee's Signature" name={pcv.receiver_name} sig={pcv.receiver_signature} />
      </div>
    </div>
  );
};

/* ─── Reject Modal ─── */
const RejectModal = ({ pcv, onClose, onReject }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onReject(pcv.id, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Reject PCV</h3>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
          You are rejecting <b style={{ color: '#dc2626' }}>{pcv.pcv_number}</b>. Please provide a reason.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter rejection reason (required)..."
          rows={4}
          style={{ width: '100%', padding: '12px 14px', border: '2px solid #fca5a5', borderRadius: 10, boxSizing: 'border-box', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={submit} disabled={!reason.trim() || loading}
            style={{ padding: '10px 20px', background: loading || !reason.trim() ? '#fca5a5' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: !reason.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={16} />}
            Reject PCV
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─── CEO Finance Approvals Page ─── */
const CEOFinanceApprovals = () => {
  const [pcvs, setPcvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || res || [];
      setPcvs(Array.isArray(data) ? data.filter(p => p.status === 'pending_ceo') : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (pcv) => {
    setActionLoading(pcv.id);
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/approve`);
      showToast(`✅ ${pcv.pcv_number} approved and sent to Finance!`, 'success');
      load();
    } catch (e) {
      showToast('Failed to approve PCV', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await api.put(`/finance-cash/pcv/${id}/reject`, { reason });
      showToast('PCV rejected. Finance has been notified.', 'error');
      load();
    } catch (e) {
      showToast('Failed to reject PCV', 'error');
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending_ceo: { label: 'Awaiting CEO', bg: '#fef9c3', color: '#a16207' },
      approved_finance: { label: 'Approved', bg: '#dcfce7', color: '#15803d' },
      rejected: { label: 'Rejected', bg: '#fee2e2', color: '#dc2626' },
      completed: { label: 'Completed', bg: '#e0f2fe', color: '#0369a1' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: 32, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#991b1b' : '#15803d',
          padding: '14px 20px', borderRadius: 10, fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#eab308,#a16207)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(234,179,8,.3)' }}>
              <Banknote color="white" size={22} />
            </span>
            PCV Approval Queue
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Review and approve or reject petty cash vouchers submitted by Finance.</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <div>Loading pending PCVs...</div>
        </div>
      ) : pcvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>All Clear!</h3>
          <p style={{ color: '#64748b', margin: 0 }}>No PCV vouchers are awaiting your approval.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pcvs.map(pcv => (
            <div key={pcv.id} style={{
              background: 'white', borderRadius: 16,
              border: `2px solid ${expanded === pcv.id ? '#eab308' : '#e2e8f0'}`,
              boxShadow: expanded === pcv.id ? '0 8px 20px rgba(234,179,8,.12)' : '0 2px 6px rgba(0,0,0,.04)',
              overflow: 'hidden', transition: 'all .2s'
            }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 16 }}>
                <div style={{ flexShrink: 0, background: '#fefce8', padding: 10, borderRadius: 10, border: '1px solid #fde047' }}>
                  <Banknote size={22} color="#eab308" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{pcv.pcv_number}</span>
                    {statusBadge(pcv.status)}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                    <span><b style={{ color: '#0f172a' }}>To:</b> {pcv.paid_to}</span>
                    <span>·</span>
                    <span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
                    <span>·</span>
                    <span style={{ fontWeight: 700, color: '#a16207' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === pcv.id ? null : pcv.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#475569' }}>
                    <Eye size={14} /> {expanded === pcv.id ? 'Hide' : 'View'}
                    {expanded === pcv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => setRejectTarget(pcv)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => handleApprove(pcv)}
                    disabled={actionLoading === pcv.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'white', boxShadow: '0 2px 8px rgba(34,197,94,.3)', opacity: actionLoading === pcv.id ? 0.7 : 1 }}>
                    {actionLoading === pcv.id ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                </div>
              </div>

              {/* Detail Panel */}
              {expanded === pcv.id && <PCVDetailPanel pcv={pcv} />}
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          pcv={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onReject={handleReject}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CEOFinanceApprovals;
