import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Fuel, Check, Clock, X, Eye, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const GlobalStyles = () => (
  <style>{`
    .crm-wrapper {
      padding: 24px;
      box-sizing: border-box;
      background: var(--color-bg-page, #F5F6FA);
      font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
      color: #111827;
      width: 100%;
    }
    .crm-container { max-width: 1200px; margin: 0 auto; }

    .crm-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; flex-wrap: wrap; gap: 16px;
    }
    .crm-title { font-size: 26px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .crm-subtitle { font-size: 14px; color: #6B7280; margin: 0; }

    .crm-section-title {
      font-size: 18px; font-weight: 700; margin: 32px 0 12px 0;
      padding-bottom: 8px; border-bottom: 2px solid #E5E7EB;
    }

    .crm-card {
      background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px;
      padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px;
      transition: all 150ms ease-in-out;
    }
    .crm-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }

    .crm-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .crm-item-name { margin: 0 0 4px 0; font-size: 17px; font-weight: 700; }
    .crm-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .crm-badge {
      font-size: 12px; font-weight: 500; background: #F3F4F6;
      padding: 2px 10px; border-radius: 4px; color: #6B7280;
    }
    .crm-cost { font-size: 20px; font-weight: 700; color: #16A34A; white-space: nowrap; }

    .crm-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px; background: #F9FAFB; padding: 14px 16px;
      border-radius: 8px; border: 1px solid #E5E7EB;
    }
    .crm-label {
      display: block; font-size: 11px; font-weight: 600; color: #9CA3AF;
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px;
    }
    .crm-value { font-size: 14px; color: #111827; line-height: 1.5; }

    .crm-actions {
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
      padding-top: 8px; border-top: 1px solid #E5E7EB;
    }
    .crm-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 34px; padding: 0 14px; border-radius: 7px; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 150ms ease-in-out; color: #fff; font-family: inherit;
    }
    .crm-btn:hover:not(:disabled) { background: #F59E0B !important; color: #111827; transform: translateY(-1px); }
    .crm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .crm-btn-approve { background: #16A34A; }
    .crm-btn-reject  { background: #DC2626; }
    .crm-btn-view    { background: #2563EB; }
    .crm-btn-secondary { background: #FFFFFF; color: #111827; border: 1px solid #E5E7EB; }

    .crm-status-pill { display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }

    .crm-empty {
      padding: 40px; background: #FFFFFF; border-radius: 10px; text-align: center;
      color: #9CA3AF; border: 1px solid #E5E7EB;
    }

    .crm-table-wrap { overflow-x: auto; background: #FFFFFF; border-radius: 10px; border: 1px solid #E5E7EB; }
    .crm-table { width: 100%; border-collapse: collapse; text-align: left; }
    .crm-table th {
      padding: 11px 16px; font-size: 11px; font-weight: 600; color: #9CA3AF;
      text-transform: uppercase; letter-spacing: 0.04em; background: #F9FAFB;
      border-bottom: 1px solid #E5E7EB;
    }
    .crm-table td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #E5E7EB; }

    .crm-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;
    }
    .crm-modal {
      background: #FFFFFF; padding: 28px; border-radius: 14px; width: 100%;
      max-width: 560px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .crm-modal-title { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; }
    .crm-modal-sub { margin: 0 0 20px 0; font-size: 14px; color: #6B7280; line-height: 1.5; }
    .crm-input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #E5E7EB;
      background: #FFFFFF; color: #111827; font-size: 14px; font-family: inherit;
      box-sizing: border-box; transition: all 150ms ease;
    }
    textarea.crm-input { padding: 12px; }
    .crm-input:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

    .crm-toast {
      position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 14px 20px;
      border-radius: 10px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    }
    .crm-toast-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; }
    .crm-toast-error   { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }

    @media (max-width: 768px) {
      .crm-wrapper { padding: 12px; }
      .crm-card { padding: 16px; }
      .crm-card-header { flex-direction: column; }
    }
  `}</style>
);

const STATUS_MAP = {
  PENDING_CEO:      { label: 'Awaiting CEO',       bg: '#FEF3C7', color: '#D97706' },
  PENDING_FINANCE:  { label: 'Awaiting Finance',   bg: '#FEF3C7', color: '#D97706' },
  FINANCE_READY:    { label: 'Finance Ready',      bg: '#E0F2FE', color: '#0284C7' },
  FINANCE_APPROVED: { label: 'Finance Approved',   bg: '#E0F2FE', color: '#0284C7' },
  PAYMENT_RELEASED: { label: 'Payment Released',   bg: '#EFF6FF', color: '#2563EB' },
  COMPLETED:        { label: 'Completed',          bg: '#DCFCE7', color: '#16A34A' },
  REJECTED:         { label: 'Rejected',           bg: '#FEE2E2', color: '#DC2626' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' };
  return <span className="crm-status-pill" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
};

const norm = (r, kind) => ({
  key: kind === 'fuel' ? `fs-${r.id}` : `mnt-${r.id}`,
  id: r.id,
  kind,
  source: kind === 'fuel' ? 'Fuel & Service' : 'Fleet Maintenance',
  asset: r.asset_name || '—',
  assetType: r.asset_type,
  title: kind === 'fuel' ? (r.request_type || 'Service') : (r.type || 'Maintenance'),
  description: r.description,
  cost: r.estimated_cost_cents != null ? r.estimated_cost_cents / 100 : 0,
  status: r.status,
  date: r.scheduled_date || r.requested_date || r.created_at,
  created_at: r.created_at,
  priority: r.priority,
  person: r.mechanic_name || r.driver_name || '',
  personPhone: r.mechanic_phone || '',
  location: r.location,
  mileage: r.current_mileage,
  notes: r.notes,
  reported_by: r.reported_by,
  images: r.images,
});

const DetailModal = ({ item, onClose }) => (
  <div className="crm-modal-overlay" onClick={onClose}>
    <div className="crm-modal" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 className="crm-modal-title">{item.title} — {item.asset}</h2>
          <div className="crm-meta" style={{ marginTop: 6 }}>
            <span className="crm-badge">{item.source}</span>
            <span className="crm-badge">#{String(item.id).padStart(4, '0')}</span>
            <StatusPill status={item.status} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
          <X size={22} />
        </button>
      </div>

      <div className="crm-grid" style={{ marginBottom: 16 }}>
        <div><span className="crm-label">Asset</span><div className="crm-value">{item.asset}</div></div>
        <div><span className="crm-label">Cost</span><div className="crm-value">ETB {item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></div>
        <div><span className="crm-label">Priority</span><div className="crm-value">{item.priority || '—'}</div></div>
        <div><span className="crm-label">Date</span><div className="crm-value">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</div></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <span className="crm-label">Description</span>
        <p className="crm-value" style={{ margin: 0, background: '#F9FAFB', padding: 10, borderRadius: 6 }}>{item.description || 'N/A'}</p>
      </div>

      <div className="crm-grid" style={{ marginBottom: 14 }}>
        <div><span className="crm-label">{item.kind === 'fuel' ? 'Driver' : 'Mechanic'}</span><div className="crm-value">{item.person || '—'}</div></div>
        <div><span className="crm-label">Contact</span><div className="crm-value">{item.personPhone || '—'}</div></div>
        <div><span className="crm-label">Location</span><div className="crm-value">{item.location || '—'}</div></div>
        <div><span className="crm-label">Reported By</span><div className="crm-value">{item.reported_by || '—'}</div></div>
      </div>

      {item.notes && (
        <div style={{ marginBottom: 14 }}>
          <span className="crm-label">Notes</span>
          <p className="crm-value" style={{ margin: 0, background: '#F9FAFB', padding: 10, borderRadius: 6 }}>{item.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} className="crm-btn crm-btn-secondary">Close</button>
      </div>
    </div>
  </div>
);

const CEOCarRentalMaintenanceApprovals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [actionId, setActionId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [maintRes, fuelRes] = await Promise.all([
        apiClient.get('/car-renting/maintenance'),
        apiClient.get('/car-renting/fuel-service'),
      ]);
      const maint = Array.isArray(maintRes?.data) ? maintRes.data : (Array.isArray(maintRes) ? maintRes : []);
      const fuel  = Array.isArray(fuelRes?.data)  ? fuelRes.data  : (Array.isArray(fuelRes)  ? fuelRes  : []);
      setItems([...maint.map(m => norm(m, 'maint')), ...fuel.map(f => norm(f, 'fuel'))]);
    } catch (e) {
      showToast('Failed to load requests', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (item) => {
    setActionId(item.key);
    try {
      const path = item.kind === 'fuel'
        ? `/car-renting/fuel-service/${item.id}/ceo-approve`
        : `/car-renting/maintenance/${item.id}/ceo-approve`;
      await apiClient.patch(path);
      showToast(`${item.title} for ${item.asset} approved and sent to Finance.`);
      setConfirmApprove(null);
      await load();
    } catch (e) {
      showToast(e?.message || 'Failed to approve request', 'error');
    } finally {
      setActionId(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionId(rejectTarget.key);
    try {
      const path = rejectTarget.kind === 'fuel'
        ? `/car-renting/fuel-service/${rejectTarget.id}/ceo-reject`
        : `/car-renting/maintenance/${rejectTarget.id}/ceo-reject`;
      await apiClient.patch(path, { reason: rejectReason });
      showToast(`${rejectTarget.title} for ${rejectTarget.asset} rejected.`, 'error');
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (e) {
      showToast(e?.message || 'Failed to reject request', 'error');
    } finally {
      setActionId(null);
    }
  };

  const pending = items.filter(i => i.status === 'PENDING_CEO');
  const history = items.filter(i => i.status !== 'PENDING_CEO')
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

  return (
    <div className="crm-wrapper">
      <GlobalStyles />

      {toast && <div className={`crm-toast crm-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="crm-container">
        <div className="crm-header">
          <div>
            <h1 className="crm-title">Maintenance &amp; Fuel/Service Approvals</h1>
            <p className="crm-subtitle">Review fleet maintenance and fuel/service requests. Approved requests are forwarded to Finance for payment.</p>
          </div>
          <button onClick={load} className="crm-btn crm-btn-secondary" disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="crm-section-title">Pending CEO Approval ({loading ? '…' : pending.length})</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <SegmentedSpinner size={32} />
            <div style={{ marginTop: 14, color: '#9CA3AF', fontSize: 14 }}>Loading requests…</div>
          </div>
        ) : pending.length === 0 ? (
          <div className="crm-empty">
            <Check size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No maintenance or fuel/service requests awaiting your approval.</p>
          </div>
        ) : (
          pending.map(item => (
            <div key={item.key} className="crm-card" style={{ borderLeft: '4px solid #2563EB' }}>
              <div className="crm-card-header">
                <div>
                  <h3 className="crm-item-name">
                    {item.kind === 'fuel' ? <Fuel size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} /> : <Wrench size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />}
                    {item.title} — {item.asset}
                  </h3>
                  <div className="crm-meta">
                    <span className="crm-badge">{item.source}</span>
                    <span className="crm-badge">#{String(item.id).padStart(4, '0')}</span>
                    <span className="crm-badge">{item.priority || 'Normal'}</span>
                    <StatusPill status={item.status} />
                  </div>
                </div>
                <div className="crm-cost">ETB {item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="crm-grid">
                <div><span className="crm-label">Description</span><div className="crm-value">{item.description}</div></div>
                <div><span className="crm-label">Requested For</span><div className="crm-value">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</div></div>
                <div><span className="crm-label">{item.kind === 'fuel' ? 'Driver' : 'Mechanic'}</span><div className="crm-value">{item.person || '—'}</div></div>
                <div><span className="crm-label">Reported By</span><div className="crm-value">{item.reported_by || '—'}</div></div>
              </div>

              <div className="crm-actions">
                <button onClick={() => setDetail(item)} className="crm-btn crm-btn-view">
                  <Eye size={14} /> View Detail
                </button>
                <button onClick={() => setConfirmApprove(item)} disabled={actionId === item.key} className="crm-btn crm-btn-approve">
                  {actionId === item.key ? <SegmentedSpinner size={14} /> : <Check size={14} />} Approve
                </button>
                <button onClick={() => { setRejectTarget(item); setRejectReason(''); }} disabled={actionId === item.key} className="crm-btn crm-btn-reject">
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))
        )}

        <div className="crm-section-title">History ({loading ? '…' : history.length})</div>

        {history.length === 0 ? (
          <div className="crm-empty" style={{ padding: 32 }}>No history yet.</div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  {['Type', 'Asset', 'Cost', 'Requested', 'Status', 'Detail'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.key}>
                    <td style={{ fontWeight: 600 }}>{item.source}</td>
                    <td>{item.asset}</td>
                    <td>ETB {item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: '#6B7280' }}>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                    <td><StatusPill status={item.status} /></td>
                    <td>
                      <button onClick={() => setDetail(item)} className="crm-btn crm-btn-view" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>
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

      {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}

      {confirmApprove && (
        <div className="crm-modal-overlay">
          <div className="crm-modal" style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Check size={52} color="#16A34A" />
            </div>
            <h3 className="crm-modal-title">Confirm Approval</h3>
            <p className="crm-modal-sub">
              Approve <b>{confirmApprove.title}</b> for <b>{confirmApprove.asset}</b> (ETB {confirmApprove.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })})? It will be forwarded to Finance for payment.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmApprove(null)} className="crm-btn crm-btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={() => approve(confirmApprove)} disabled={actionId === confirmApprove.key} className="crm-btn crm-btn-approve" style={{ flex: 1 }}>
                {actionId === confirmApprove.key ? <SegmentedSpinner size={14} /> : <Check size={15} />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="crm-modal-overlay">
          <div className="crm-modal" style={{ maxWidth: 460 }}>
            <h3 className="crm-modal-title">Reject Request</h3>
            <p className="crm-modal-sub">
              Reject <b>{rejectTarget.title}</b> for <b>{rejectTarget.asset}</b>? Please provide a reason for the requester.
            </p>
            <textarea
              autoFocus
              rows={4}
              className="crm-input"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)…"
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="crm-btn crm-btn-secondary">Cancel</button>
              <button onClick={reject} disabled={!rejectReason.trim() || actionId === rejectTarget.key} className="crm-btn crm-btn-reject">
                {actionId === rejectTarget.key ? <SegmentedSpinner size={14} /> : <X size={15} />} Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOCarRentalMaintenanceApprovals;
