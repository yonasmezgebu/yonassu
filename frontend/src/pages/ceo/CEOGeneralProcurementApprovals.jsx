import React, { useState, useEffect } from 'react';
import { Truck, Check, Clock, X, Eye, Search } from 'lucide-react';
import apiClient from '../../services/apiClient';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :root {
      --color-primary: #2563EB;
      --color-bg-page: #F5F6FA;
      --color-bg-card: #FFFFFF;
      --color-border: #E5E7EB;
      --color-text-primary: #111827;
      --color-text-secondary: #6B7280;
      --color-text-muted: #9CA3AF;
      --color-success: #16A34A;
      --color-success-bg: #DCFCE7;
      --color-danger: #DC2626;
      --color-danger-bg: #FEE2E2;
      --color-warning: #D97706;
      --color-warning-bg: #FEF3C7;
      --color-info: #0284C7;
      --color-info-bg: #E0F2FE;
      --font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    }

    .ceo-appr-wrapper {
      padding: 24px;
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      color: var(--color-text-primary);
      width: 100%;
    }
    .ceo-appr-container { max-width: 1200px; margin: 0 auto; }

    .ceo-appr-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .ceo-appr-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 4px 0;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .ceo-appr-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .ceo-appr-section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 40px 0 12px 0;
      color: var(--color-text-primary);
      padding-bottom: 8px;
      border-bottom: 2px solid var(--color-border);
    }

    .ceo-appr-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 150ms ease-in-out;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 14px;
    }
    .ceo-appr-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }

    .ceo-appr-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .ceo-appr-item-name {
      margin: 0 0 4px 0;
      font-size: 17px;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .ceo-appr-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .ceo-appr-badge {
      font-size: 12px;
      font-weight: 500;
      background: #F3F4F6;
      padding: 2px 10px;
      border-radius: 4px;
      color: var(--color-text-secondary);
    }
    .ceo-appr-cost {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-success);
      white-space: nowrap;
    }

    .ceo-appr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      background: #F9FAFB;
      padding: 14px 16px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }
    .ceo-appr-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .ceo-appr-value {
      font-size: 14px;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .ceo-appr-note-box {
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .ceo-appr-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }

    .ceo-appr-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 34px;
      padding: 0 14px;
      border-radius: 7px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      color: #fff;
    }
    .ceo-appr-btn:hover:not(:disabled) {
      background: #F59E0B !important;
      color: #111827;
      box-shadow: 0 4px 10px rgba(245,158,11,0.35);
      transform: translateY(-1px);
    }
    .ceo-appr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ceo-appr-btn-approve { background: var(--color-success); }
    .ceo-appr-btn-wait    { background: var(--color-warning); }
    .ceo-appr-btn-reject  { background: var(--color-danger); }
    .ceo-appr-btn-secondary {
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }
    .ceo-appr-btn-view {
      background: var(--color-primary);
    }

    /* Modal */
    .ceo-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 16px;
    }
    .ceo-modal-content {
      background: var(--color-bg-card);
      padding: 28px;
      border-radius: 14px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .ceo-modal-title {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .ceo-modal-sub {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .ceo-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-size: 14px;
      font-family: var(--font-family);
      transition: all 150ms ease;
      box-sizing: border-box;
    }
    textarea.ceo-input { padding: 12px; }
    .ceo-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    /* Status pill */
    .status-pill {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
    }

    /* Segmented Spinner */
    .segmented-spinner {
      width: 28px; height: 28px;
      border: 3px dashed var(--color-primary);
      border-radius: 50%;
      animation: ceo-spin 1.5s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes ceo-spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .ceo-appr-wrapper { padding: 12px; }
      .ceo-appr-card { padding: 16px; }
      .ceo-appr-card-header { flex-direction: column; }
    }
  `}</style>
);

/* ─── Shared Status Map ─────────────────────────────────────────────────── */
const STATUS_MAP = {
  PENDING:           { label: '⏳ Waiting CEO Approval',              bg: 'var(--color-info-bg)',    color: 'var(--color-info)' },
  WAIT:              { label: '⏸ On Hold — Awaiting Final Decision',  bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  APPROVED:          { label: '✅ CEO Approved',                       bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  REJECTED:          { label: '❌ Rejected by CEO',                    bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)' },
  ACCEPTED:          { label: '✔ Accepted by Purchase',                bg: '#EDE9FE',                 color: '#6D28D9' },
  PAYMENT_REQUESTED: { label: '💳 Payment Requested — Finance Review',  bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  FINANCE_CHECKED:   { label: '🔎 Finance Checked — Awaiting CEO',     bg: 'var(--color-info-bg)',    color: 'var(--color-info)' },
  PAYMENT_APPROVED:  { label: '✅ Final Payment Approved',              bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  PAYMENT_REJECTED:  { label: '❌ Payment Rejected',                    bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' };
  return <span className="status-pill" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
};

/* ─── Detail Modal ──────────────────────────────────────────────────────── */
const DetailModal = ({ req, onClose }) => (
  <div className="ceo-modal-overlay" onClick={onClose}>
    <div className="ceo-modal-content" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 className="ceo-modal-title">{req.item_name}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <span className="ceo-appr-badge">{req.request_code}</span>
            <span className="ceo-appr-badge">{req.module}</span>
            <StatusPill status={req.status} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
          <X size={22} />
        </button>
      </div>

      <div className="ceo-appr-grid" style={{ marginBottom: '16px' }}>
        <div><span className="ceo-appr-label">Quantity</span><div className="ceo-appr-value">{req.quantity}</div></div>
        <div><span className="ceo-appr-label">Urgency</span><div className="ceo-appr-value">{req.urgency}</div></div>
        <div><span className="ceo-appr-label">Estimated Cost</span><div className="ceo-appr-value">{req.estimated_cost ? `${Number(req.estimated_cost).toLocaleString()} ETB` : 'TBD'}</div></div>
        <div><span className="ceo-appr-label">Submitted</span><div className="ceo-appr-value">{new Date(req.created_at).toLocaleString()}</div></div>
      </div>

      {req.item_description && (
        <div style={{ marginBottom: '14px' }}>
          <span className="ceo-appr-label" style={{ marginBottom: '4px' }}>Item Description / Specs</span>
          <p className="ceo-appr-value" style={{ margin: 0, background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>{req.item_description}</p>
        </div>
      )}

      <div style={{ marginBottom: '14px' }}>
        <span className="ceo-appr-label" style={{ marginBottom: '4px' }}>Justification</span>
        <p className="ceo-appr-value" style={{ margin: 0, background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>{req.justification || 'N/A'}</p>
      </div>

      {req.requester_signature && (
        <div style={{ marginBottom: '14px' }}>
          <span className="ceo-appr-label" style={{ marginBottom: '4px' }}>Manager Signature</span>
          <p className="ceo-appr-value" style={{ margin: 0, fontFamily: 'cursive', fontSize: '18px' }}>{req.requester_signature}</p>
        </div>
      )}

      {req.ceo_decision_reason && (
        <div className="ceo-appr-note-box" style={{ background: req.status === 'REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', borderColor: req.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-warning)', marginBottom: '14px' }}>
          <span className="ceo-appr-label" style={{ color: req.status === 'REJECTED' ? 'var(--color-danger)' : '#92400E', marginBottom: '4px' }}>
            {req.status === 'REJECTED' ? 'Rejection Reason' : req.status === 'WAIT' ? 'Hold Reason / Note' : 'CEO Approval Note'}
          </span>
          <p className="ceo-appr-value" style={{ margin: 0, color: req.status === 'REJECTED' ? '#991B1B' : '#B45309' }}>{req.ceo_decision_reason}</p>
        </div>
      )}

      {req.finance_note && (
        <div className="ceo-appr-note-box" style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)', marginBottom: '14px' }}>
          <span className="ceo-appr-label" style={{ color: '#92400E', marginBottom: '4px' }}>Finance Department Note</span>
          <p className="ceo-appr-value" style={{ margin: 0, color: '#B45309' }}>{req.finance_note}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button onClick={onClose} className="ceo-appr-btn ceo-appr-btn-secondary">Close</button>
      </div>
    </div>
  </div>
);

/* ─── Action Modal ──────────────────────────────────────────────────────── */
const ActionModal = ({ modal, reason, setReason, decideError, onConfirm, onClose }) => {
  const actionLabel = { APPROVE: 'Approve', WAIT: 'Put On Hold', REJECT: 'Reject' }[modal.action];
  const confirmLabel = { APPROVE: 'Confirm Approval', WAIT: 'Put On Hold', REJECT: 'Confirm Rejection' }[modal.action];
  const needsReason = modal.action === 'REJECT' || modal.action === 'WAIT';

  return (
    <div className="ceo-modal-overlay">
      <div className="ceo-modal-content">
        <h3 className="ceo-modal-title">{actionLabel}: {modal.request?.item_name}</h3>
        <p className="ceo-modal-sub">
          {modal.action === 'APPROVE' && 'This will mark the request as approved and forward it to the Purchase department.'}
          {modal.action === 'WAIT' && 'This will put the request on hold. A reason is required so the manager understands the delay.'}
          {modal.action === 'REJECT' && 'This will permanently reject the request. A reason is required.'}
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label className="ceo-appr-label" style={{ marginBottom: '6px' }}>
            {modal.action === 'APPROVE' ? 'Approval Note (Optional)' : 'Reason (Required)'}
          </label>
          <textarea
            autoFocus
            rows={4}
            className="ceo-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={
              modal.action === 'APPROVE' ? 'Add any instructions for the Purchase department...' :
              modal.action === 'WAIT'    ? 'Why is this request on hold?' :
              'Why is this request being rejected?'
            }
          />
        </div>

        {decideError && (
          <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
            {decideError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="ceo-appr-btn ceo-appr-btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={needsReason && !reason.trim()}
            className={`ceo-appr-btn ceo-appr-btn-${modal.action.toLowerCase()}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
const CEOGeneralProcurementApprovals = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({ open: false, request: null, action: null });
  const [detailModal, setDetailModal] = useState({ open: false, request: null });
  const [reason, setReason] = useState('');
  const [decideError, setDecideError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/general-procurement/requests/my');
      const all = res.data || [];
      setPendingRequests(all.filter(r => r.status === 'PENDING' || r.status === 'WAIT'));
      setHistoryRequests(all.filter(r => r.status !== 'PENDING' && r.status !== 'WAIT'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const openAction = (req, action) => {
    setReason('');
    setDecideError('');
    setModal({ open: true, request: req, action });
  };

  const handleDecide = async () => {
    setDecideError('');
    try {
      await apiClient.put(`/general-procurement/requests/${modal.request.id}/decide`, {
        decision: modal.action,
        reason
      });
      setModal({ open: false, request: null, action: null });
      setReason('');
      fetchRequests();
    } catch (e) {
      setDecideError(e.message || 'Failed to submit decision.');
    }
  };

  return (
    <div className="ceo-appr-wrapper">
      <GlobalStyles />
      <div className="ceo-appr-container">

        {/* ── Page Header ── */}
        <div className="ceo-appr-page-header">
          <div>
            <h1 className="ceo-appr-title">Agri &amp; Car Rental Procurement Approvals</h1>
            <p className="ceo-appr-subtitle">Review, approve, hold, or reject procurement requests for new cars, tractors, or machinery.</p>
          </div>
          <button onClick={fetchRequests} className="ceo-appr-btn ceo-appr-btn-secondary" style={{ color: 'var(--color-text-primary)', gap: '6px' }}>
            <Search size={15} /> Refresh
          </button>
        </div>

        {/* ── Pending ── */}
        <div className="ceo-appr-section-title">Pending Decisions ({loading ? '…' : pendingRequests.length})</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div className="segmented-spinner" />
            <div style={{ color: 'var(--color-text-muted)' }}>Loading requests...</div>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div style={{ padding: '40px', background: 'var(--color-bg-card)', borderRadius: '10px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <Truck size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No pending procurement requests.</p>
          </div>
        ) : (
          pendingRequests.map(req => (
            <div key={req.id} className="ceo-appr-card" style={{ borderLeft: `4px solid ${req.status === 'WAIT' ? 'var(--color-warning)' : 'var(--color-primary)'}` }}>

              {/* Card Header */}
              <div className="ceo-appr-card-header">
                <div>
                  <h3 className="ceo-appr-item-name">{req.item_name}</h3>
                  <div className="ceo-appr-meta">
                    <span className="ceo-appr-badge">{req.request_code}</span>
                    <span className="ceo-appr-badge">{req.module}</span>
                    <StatusPill status={req.status} />
                  </div>
                </div>
                <div className="ceo-appr-cost">
                  {req.estimated_cost ? `${Number(req.estimated_cost).toLocaleString()} ETB` : 'Cost TBD'}
                </div>
              </div>

              {/* Details Grid */}
              <div className="ceo-appr-grid">
                <div><span className="ceo-appr-label">Quantity</span><div className="ceo-appr-value">{req.quantity}</div></div>
                <div><span className="ceo-appr-label">Urgency</span><div className="ceo-appr-value">{req.urgency}</div></div>
                <div><span className="ceo-appr-label">Submitted</span><div className="ceo-appr-value">{new Date(req.created_at).toLocaleDateString()}</div></div>
                <div><span className="ceo-appr-label">Signature</span><div className="ceo-appr-value" style={{ fontFamily: 'cursive' }}>{req.requester_signature}</div></div>
              </div>

              {/* Justification */}
              <div>
                <span className="ceo-appr-label">Justification</span>
                <p className="ceo-appr-value" style={{ margin: '4px 0 0 0' }}>{req.justification}</p>
              </div>

              {/* Hold Reason (if WAIT) */}
              {req.status === 'WAIT' && req.ceo_decision_reason && (
                <div className="ceo-appr-note-box" style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)' }}>
                  <span className="ceo-appr-label" style={{ color: '#92400E' }}>Your Hold Reason</span>
                  <p className="ceo-appr-value" style={{ margin: '4px 0 0 0', color: '#B45309' }}>{req.ceo_decision_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="ceo-appr-actions">
                <button onClick={() => setDetailModal({ open: true, request: req })} className="ceo-appr-btn ceo-appr-btn-view">
                  <Eye size={14} /> View Detail
                </button>
                <button onClick={() => openAction(req, 'APPROVE')} className="ceo-appr-btn ceo-appr-btn-approve">
                  <Check size={14} /> {req.status === 'WAIT' ? 'Approve Now' : 'Approve'}
                </button>
                <button onClick={() => openAction(req, 'WAIT')} className="ceo-appr-btn ceo-appr-btn-wait">
                  <Clock size={14} /> {req.status === 'WAIT' ? 'Update Hold' : 'Wait'}
                </button>
                <button onClick={() => openAction(req, 'REJECT')} className="ceo-appr-btn ceo-appr-btn-reject">
                  <X size={14} /> Reject
                </button>
              </div>

            </div>
          ))
        )}

        {/* ── History ── */}
        <div className="ceo-appr-section-title">Approval History ({loading ? '…' : historyRequests.length})</div>

        {historyRequests.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--color-bg-card)', borderRadius: '10px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            No history yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--color-bg-card)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  {['Request Code', 'Item Name', 'Module', 'Qty', 'Submitted', 'Status', 'Detail'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 100ms' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseOut={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{req.request_code}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{req.item_name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{req.module}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{req.quantity}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}><StatusPill status={req.status} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setDetailModal({ open: true, request: req })} className="ceo-appr-btn ceo-appr-btn-view" style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}>
                        <Eye size={13} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Detail Modal ── */}
      {detailModal.open && detailModal.request && (
        <DetailModal req={detailModal.request} onClose={() => setDetailModal({ open: false, request: null })} />
      )}

      {/* ── Action Modal ── */}
      {modal.open && modal.request && (
        <ActionModal
          modal={modal}
          reason={reason}
          setReason={setReason}
          decideError={decideError}
          onConfirm={handleDecide}
          onClose={() => { setModal({ open: false, request: null, action: null }); setDecideError(''); }}
        />
      )}

    </div>
  );
};

export default CEOGeneralProcurementApprovals;
