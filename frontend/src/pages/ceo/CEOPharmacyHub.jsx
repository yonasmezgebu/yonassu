import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Clipboard, Truck, CheckSquare, Package, Sliders, ClipboardCheck,
  CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp,
  X, Send, FileText
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { getPendingUpdateRequests, approveUpdateRequest, rejectUpdateRequest } from '../../utils/storeApi';

/* ─── Color Palette ─── */
const C = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf: '#4CAF50', sage: '#A5D6A7', mint: '#E8F5E9',
  white: '#FFFFFF', lightGray: '#F1F8F1', gray: '#6B7280',
  darkGray: '#374151', border: '#C8E6C9',
  warning: '#F59E0B', warningDark: '#D97706',
  error: '#EF4444', errorDark: '#DC2626',
  blue: '#3B82F6', blueDark: '#2563EB',
};

/* ─── Global Hub Styles ─── */
const HUB_STYLE = `
  @keyframes hubSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes hubSpin      { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .hub-item { animation: hubSlideDown 0.18s ease forwards; }
  .hub-btn:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-2px) !important; }
  .audit-table td { padding: 11px 14px; vertical-align: middle; color: #374151; }
  .audit-table tr:last-child td { border-bottom: none; }
  @media print {
    body * { visibility: hidden; }
    .print-area, .print-area * { visibility: visible; }
    .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
  }
`;

/* ─── Shared 3D Button ─── */
const Btn = ({ onClick, disabled, children, color = C.emerald, border = C.dark, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={disabled ? '' : 'hub-btn'}
    style={{
      background: disabled ? '#9CA3AF' : color,
      color: C.white,
      border: `2px solid ${disabled ? '#6B7280' : border}`,
      boxShadow: disabled ? 'none' : `0 5px 0 ${border}`,
      padding: '11px 22px',
      fontWeight: 800,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: disabled ? 'not-allowed' : 'pointer',
      borderRadius: 0,
      transition: 'transform 0.08s ease, box-shadow 0.08s ease, filter 0.08s ease',
      opacity: disabled ? 0.7 : 1,
      ...style,
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 7px 0 ${border}`; } }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = disabled ? 'none' : `0 5px 0 ${border}`; }}
    onMouseDown={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; } }}
    onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = disabled ? 'none' : `0 5px 0 ${border}`; }}
  >
    {children}
  </button>
);

/* ─── Filter / Toggle Button (3D pill-style) ─── */
const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={active ? '' : 'hub-btn'}
    style={{
      padding: '9px 20px',
      fontWeight: 800,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      cursor: 'pointer',
      borderRadius: 0,
      border: `2px solid ${active ? C.dark : C.border}`,
      background: active ? C.forest : C.white,
      color: active ? C.white : C.darkGray,
      boxShadow: active ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`,
      transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, color 0.12s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = active ? `0 6px 0 ${C.dark}` : `0 6px 0 ${C.border}`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = active ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`; }}
    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
    onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = active ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`; }}
  >
    {children}
  </button>
);

const Badge = ({ status }) => {
  const map = {
    PENDING: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B', text: 'PENDING' },
    APPROVED: { bg: '#D1FAE5', color: '#065F46', border: '#10B981', text: 'APPROVED' },
    REJECTED: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444', text: 'REJECTED' },
    SHIPPED: { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6', text: 'SHIPPED' },
    COMPLETED: { bg: '#D1FAE5', color: '#065F46', border: '#10B981', text: 'COMPLETED' },
    Pending: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B', text: 'PENDING' },
    Approved: { bg: '#D1FAE5', color: '#065F46', border: '#10B981', text: 'APPROVED' },
    Rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444', text: 'REJECTED' },
  };
  const s = map[status] || { bg: '#F3F4F6', color: '#374151', border: '#9CA3AF', text: status };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
      {s.text}
    </span>
  );
};

/* ─── Loading Spinner ─── */
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: C.gray }}>
    <style>{HUB_STYLE}</style>
    <RefreshCw size={24} style={{ animation: 'hubSpin 1s linear infinite' }} />
    <span style={{ fontWeight: 600 }}>Loading...</span>
  </div>
);

/* ─── Empty State ─── */
const Empty = ({ icon: Icon = Package, message = 'No records found.' }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray }}>
    <Icon size={48} color={C.sage} style={{ marginBottom: 12 }} />
    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{message}</p>
  </div>
);

/* ─── Toast ─── */
const ToastMsg = ({ msg, onClose }) => {
  const colors = { success: C.forest, error: C.error, info: C.blue, warning: C.warning };
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: C.white, border: `2px solid ${colors[msg.type] || C.forest}`,
      boxShadow: `0 6px 0 ${colors[msg.type] || C.forest}`,
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380,
    }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.darkGray }}>{msg.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}><X size={16} /></button>
    </div>
  );
};


const AnimatedEmpty = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: C.gray, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 20 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: `4px solid ${C.mint}`, borderRadius: '50%', animation: 'hubSpin 3s linear infinite' }} />
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, border: `4px dashed ${C.sage}`, borderRadius: '50%', animation: 'hubSpin 4s linear infinite reverse' }} />
      <Package size={32} color={C.forest} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'hubSlideDown 1.5s ease-in-out infinite alternate' }} />
    </div>
    <h3 style={{ margin: '0 0 8px', color: C.darkGray, fontSize: 18, fontWeight: 800 }}>All Caught Up!</h3>
    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>No pending procurement requests waiting for approval.</p>
  </div>
);

const TabProcurement = ({ toast }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/procurement/requests');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      // Filter only those pending CEO review, assume all are from pharmacy manager per flow
      setRequests(data.filter(r => r.status === 'PENDING_CEO' || r.status === 'PENDING_CEO_REVIEW'));
    } catch { setRequests([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, decision) => {
    setActing(id);
    try {
      let payload = { decision };
      if (decision === 'WAIT') {
        const instr = window.prompt("Enter wait instructions/notes for the market team:");
        if (instr === null) { setActing(null); return; } // cancelled
        payload.waitInstructions = instr || "Please hold and research market.";
        payload.waitDocument = "None attached"; 
      }
      
      try {
        await apiClient.patch(`/procurement/requests/${id}/ceo-decision`, payload);
      } catch (err) {
        // Fallback if route is named differently
        await apiClient.patch(`/procurement/requests/${id}/decision`, payload);
      }
      
      toast('Decision recorded successfully.', 'success');
      load();
    } catch { toast('Failed to process decision.', 'error'); }
    finally { setActing(null); }
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      {loading ? <Spinner /> : requests.length === 0 ? <AnimatedEmpty /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forest, color: C.white }}>
                {['Reference', 'Item / Purpose', 'Requested By', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? C.mint : C.white, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700 }}>{r.reference_number || r.pr_no || `#${r.id}`}</td>
                  <td style={{ padding: '10px 16px' }}>{r.item_name || r.drug_name || r.purpose || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{r.requested_by_name || r.requestedBy || '—'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: C.forest }}>ETB {parseFloat(r.amount || r.estimated_total || r.estimated_cost || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {(r.status === 'PENDING_CEO' || r.status === 'PENDING_CEO_REVIEW') && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => decide(r.id, 'APPROVED')} disabled={acting === r.id} color={C.forest} border={C.dark} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <CheckCircle size={13} /> Approve
                        </Btn>
                        <Btn onClick={() => decide(r.id, 'REJECTED')} disabled={acting === r.id} color={C.error} border={C.errorDark} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <XCircle size={13} /> Reject
                        </Btn>
                        <Btn onClick={() => decide(r.id, 'WAIT')} disabled={acting === r.id} color={C.warning} border={C.darkGray} style={{ padding: '6px 12px', fontSize: 11, color: C.dark }}>
                          Wait
                        </Btn>
                      </div>
                    )}
                    {(r.status !== 'PENDING_CEO' && r.status !== 'PENDING_CEO_REVIEW') && <Badge status={r.status} />}
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

/* ═══════════════════════════════════════════════════════════
   TAB 3 — DIRECT DELIVERY (Pharmacy Manager → CEO → Finance)
═══════════════════════════════════════════════════════════ */
const AnimatedDeliveryEmpty = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: C.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
    <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 24 }}>
      {/* Outer pulsing ring */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `${C.mint}`, animation: 'deliveryPulse 2s ease-in-out infinite' }} />
      {/* Truck icon */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Truck size={38} color={C.forest} style={{ animation: 'deliveryRide 2.5s ease-in-out infinite' }} />
      </div>
    </div>
    <h3 style={{ margin: '0 0 8px', color: C.darkGray, fontSize: 18, fontWeight: 800 }}>All Clear — No Pending Deliveries</h3>
    <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 14, color: C.gray }}>
      Pharmacy Manager has not submitted any deliveries requiring your confirmation.
    </p>
    <p style={{ margin: 0, fontSize: 12, color: C.sage }}>
      When goods arrive directly from a supplier to the pharmacy, you will be notified here.
    </p>
  </div>
);

const TabDelivery = ({ toast }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [showRejectFor, setShowRejectFor] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/procurement/direct-deliveries?status=PENDING_CEO');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setDeliveries(data);
    } catch { setDeliveries([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    setActing(id);
    try {
      const payload = { action };
      if (action === 'REJECT') {
        payload.ceoNotes = rejectNote || 'Rejected by CEO';
      }
      await apiClient.patch(`/procurement/direct-deliveries/${id}/ceo-confirm`, payload);
      toast(action === 'CONFIRM' ? 'Delivery confirmed. Finance has been notified.' : 'Delivery rejected.', action === 'CONFIRM' ? 'success' : 'info');
      setShowRejectFor(null);
      setRejectNote('');
      load();
    } catch { toast('Failed to process action.', 'error'); }
    finally { setActing(null); }
  };

  const EXTRA_STYLE = `
    @keyframes deliveryPulse {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.18); opacity: 0.15; }
    }
    @keyframes deliveryRide {
      0%, 100% { transform: translateX(-4px); }
      50% { transform: translateX(4px); }
    }
  `;

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '24px 30px' }}>
      <style>{EXTRA_STYLE}</style>

      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: C.dark, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={18} color={C.forest} />
          Direct Delivery Confirmations
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: C.gray }}>
          Goods received directly from supplier to pharmacy stock — awaiting CEO confirmation before Finance processes payment.
        </p>
      </div>

      {deliveries.length === 0 ? <AnimatedDeliveryEmpty /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.forest, color: C.white }}>
                {['Delivery No', 'Drug / Item', 'Supplier', 'Qty', 'Unit Price', 'Total (ETB)', 'Date', 'Received By', 'Invoice', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d, i) => (
                <React.Fragment key={d.id}>
                  <tr style={{ background: i % 2 === 0 ? C.mint : C.white, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: C.forest }}>{d.delivery_no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: C.dark }}>{d.drug_name}</td>
                    <td style={{ padding: '10px 14px', color: C.darkGray }}>{d.supplier_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>{d.quantity} {d.unit_of_measure}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>ETB {parseFloat(d.unit_price || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: C.forest }}>ETB {parseFloat(d.total_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.gray, fontSize: 12 }}>{d.received_by_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.gray, fontSize: 12 }}>{d.invoice_no || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => decide(d.id, 'CONFIRM')} disabled={acting === d.id} color={C.forest} border={C.dark} style={{ padding: '6px 11px', fontSize: 11 }}>
                          <CheckCircle size={12} /> Confirm
                        </Btn>
                        <Btn onClick={() => setShowRejectFor(d.id)} disabled={acting === d.id} color={C.error} border={C.errorDark} style={{ padding: '6px 11px', fontSize: 11 }}>
                          <XCircle size={12} /> Reject
                        </Btn>
                      </div>
                    </td>
                  </tr>
                  {/* Inline reject form */}
                  {showRejectFor === d.id && (
                    <tr style={{ background: '#fff8f8', borderBottom: `2px solid ${C.error}` }}>
                      <td colSpan={10} style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.error }}>Rejection reason:</span>
                          <input
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            style={{ flex: 1, minWidth: 200, padding: '7px 10px', border: `2px solid ${C.error}`, outline: 'none', fontSize: 12, borderRadius: 0 }}
                          />
                          <Btn onClick={() => decide(d.id, 'REJECT')} color={C.error} border={C.errorDark} style={{ padding: '7px 14px', fontSize: 12 }}>
                            Confirm Rejection
                          </Btn>
                          <Btn onClick={() => { setShowRejectFor(null); setRejectNote(''); }} color={C.gray} border={C.darkGray} style={{ padding: '7px 14px', fontSize: 12 }}>
                            Cancel
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Notes row if any */}
                  {d.notes && (
                    <tr style={{ background: i % 2 === 0 ? '#edf9f1' : '#f8fffb', borderBottom: `1px solid ${C.border}` }}>
                      <td colSpan={10} style={{ padding: '4px 14px 10px', fontSize: 11, color: C.gray }}>
                        📝 {d.notes}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Flow explanation card */}
      <div style={{ marginTop: 28, background: C.mint, border: `2px solid ${C.sage}`, padding: '14px 18px', fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: C.forest, marginBottom: 6 }}>📋 How This Flow Works</div>
        <div style={{ color: C.darkGray, lineHeight: 1.7 }}>
          <strong>1. Pharmacy Manager</strong> records goods received directly from supplier (bypasses general store) →
          <strong> 2. CEO</strong> reviews and confirms receipt here (stock is automatically updated in pharmacy) →
          <strong> 3. Finance</strong> receives notification to create a payable and pay the supplier.
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 4 — STOCK UPDATE APPROVALS  (main feature)
═══════════════════════════════════════════════════════════ */
const TabStockUpdates = ({ toast }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [showRejectFor, setShowRejectFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPendingUpdateRequests('Pending');
      if (res.success) setRequests(res.data || []);
      else setRequests([]);
    } catch { setRequests([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (r) => {
    setActing(r.id);
    try {
      const res = await approveUpdateRequest(r.id);
      if (res.success) {
        toast('Stock update approved and applied to inventory.', 'success');
        load();
      } else {
        toast(res.message || 'Approval failed.', 'error');
      }
    } catch { toast('Failed to approve.', 'error'); } finally { setActing(null); }
  };

  const reject = async (r) => {
    const reason = rejectReason[r.id];
    if (!reason?.trim()) { toast('Please enter a rejection reason.', 'warning'); return; }
    setActing(r.id);
    try {
      const res = await rejectUpdateRequest(r.id, reason);
      if (res.success) {
        toast('Stock update rejected.', 'info');
        setShowRejectFor(null);
        setRejectReason(prev => ({ ...prev, [r.id]: '' }));
        load();
      } else {
        toast(res.message || 'Rejection failed.', 'error');
      }
    } catch { toast('Failed to reject.', 'error'); } finally { setActing(null); }
  };
  return (
    <div style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.dark }}>
          Pending Stock Updates ({requests.length})
        </h3>
        <Btn onClick={load} color={C.emerald} border={C.dark} style={{ padding: '7px 14px', fontSize: 12 }}>
          <RefreshCw size={13} /> Refresh
        </Btn>
      </div>

      {loading ? <Spinner /> : requests.length === 0 ? <Empty icon={CheckCircle} message="No pending stock update requests!" /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {requests.map((r, idx) => {
            const parseJSON = (str) => { try { return typeof str === 'string' ? JSON.parse(str) : (str || {}); } catch { return {}; } };
            const oldData = parseJSON(r.old_data);
            const newData = parseJSON(r.new_data);
            
            const medicineName = r.medicine_name || r.drug_name || oldData.drug_name || newData.drug_name || '—';
            const currentQty = oldData.quantity ?? '—';
            const requestedQty = newData.quantity ?? r.new_quantity ?? '—';
            const reasonText = newData.reason || r.reason || '—';

            return (
              <div key={r.id || idx} style={{ background: C.white, border: `2px solid ${C.border}`, boxShadow: `0 3px 0 ${C.border}`, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 3 }}>{medicineName} (Request #{r.id})</div>
                    <div style={{ fontSize: 12, color: C.gray }}>
                      Before: <strong>{currentQty} units</strong> → After: <strong>{requestedQty} units</strong>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Requested by: {r.requested_by_name || '—'} &nbsp;|&nbsp; {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</div>
                    <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Reason: {reasonText}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge status={r.status || 'PENDING'} />
                    {(r.status === 'PENDING' || r.status === 'Pending') && (
                      <>
                        <Btn onClick={() => approve(r)} disabled={acting === r.id} color={C.forest} border={C.dark} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <CheckCircle size={12} /> Approve
                        </Btn>
                        <Btn onClick={() => setShowRejectFor(showRejectFor === r.id ? null : r.id)} disabled={acting === r.id} color={C.error} border={C.errorDark} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <XCircle size={12} /> Reject
                        </Btn>
                      </>
                    )}
                  </div>
                </div>

                {/* Reject Dropdown */}
                {showRejectFor === r.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGray, marginBottom: 6 }}>REJECTION REASON *</div>
                    <textarea
                      value={rejectReason[r.id] || ''}
                      onChange={e => setRejectReason(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: 10, fontSize: 13,
                        border: `2px solid ${C.error}`, borderRadius: 0, resize: 'vertical',
                        fontFamily: 'Inter, sans-serif', marginBottom: 10,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={() => reject(r)} disabled={acting === r.id} color={C.error} border={C.errorDark} style={{ padding: '6px 12px', fontSize: 12 }}>
                        <Send size={13} /> Confirm Reject
                      </Btn>
                      <Btn onClick={() => setShowRejectFor(null)} color={C.gray} border={C.darkGray} style={{ padding: '6px 12px', fontSize: 12 }}>
                        Cancel
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 5 — AUDIT LOG (Historical Records)
═══════════════════════════════════════════════════════════ */
const TabAuditLog = () => {
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('All');
  const [time, setTime] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const parseJSON = (str) => {
    if (!str) return {};
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch { return {}; }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let rows = [];

      const fetchEndpoint = async (cat, endpoint) => {
        try {
          const res = await apiClient.get(endpoint);
          const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
          return raw.map(r => ({ ...r, _cat: cat }));
        } catch { return []; }
      };

      if (category === 'all') {
        const results = await Promise.all([
          fetchEndpoint('procurement', '/procurement/requests?status=All'),
          fetchEndpoint('delivery', '/store-inventory/deliveries'),
          fetchEndpoint('updates', '/store-inventory/update-requests/pending?status=All'),
          fetchEndpoint('adjustments', '/store-inventory/adjustments/pending?status=All'),
          fetchEndpoint('counts', '/store-inventory/counts/pending?status=All')
        ]);
        rows = results.flat();
      } else {
        let endpoint = '';
        if (category === 'procurement') endpoint = '/procurement/requests?status=All';
        if (category === 'delivery') endpoint = '/store-inventory/deliveries';
        if (category === 'updates') endpoint = '/store-inventory/update-requests/pending?status=All';
        if (category === 'adjustments') endpoint = '/store-inventory/adjustments/pending?status=All';
        if (category === 'counts') endpoint = '/store-inventory/counts/pending?status=All';
        rows = await fetchEndpoint(category, endpoint);
      }
      
      let filtered = rows;
      if (status !== 'All') {
        const sMatch = status.toUpperCase();
        filtered = filtered.filter(r => {
          const rs = (r.status || '').toUpperCase();
          if (sMatch === 'APPROVED') return rs.includes('APPROVED') || rs === 'COMPLETED' || rs === 'RECEIVED';
          if (sMatch === 'REJECTED') return rs.includes('REJECTED');
          return rs === sMatch;
        });
      }

      if (time !== 'All') {
        const now = new Date();
        filtered = filtered.filter(r => {
          const dateStr = r.updated_at || r.created_at || r.delivery_date || r.count_date;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          const diffMs = now - d;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (time === 'Week') return diffDays <= 7;
          if (time === 'Month') return diffDays <= 30;
          if (time === 'Quarter') return diffDays <= 90;
          if (time === 'Year') return diffDays <= 365;
          return true;
        });
      }

      filtered.sort((a, b) => {
        const d1 = new Date(b.updated_at || b.created_at || b.delivery_date || b.count_date || 0);
        const d2 = new Date(a.updated_at || a.created_at || a.delivery_date || a.count_date || 0);
        return d1 - d2;
      });

      setData(filtered);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [category, status, time]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the report.");
      return;
    }

    const headers = renderTableHeaders();
    let rowsHtml = '';
    
    data.forEach(r => {
      const cat = category === 'all' ? r._cat : category;
      const u = getUnifiedRowData(r, cat);
      const s = r.status || 'UNKNOWN';
      const sColor = s.toUpperCase().includes('APPROVED') || s.toUpperCase() === 'COMPLETED' || s.toUpperCase() === 'RECEIVED' ? '#059669' : (s.toUpperCase().includes('REJECTED') ? '#DC2626' : '#D97706');
      
      let rowCells = '';
      if (category === 'all') {
        rowCells = `<td style="font-weight:800; color:#065F46;">${u.mod}</td><td>${u.id}</td><td>${u.details}</td><td style="font-weight:700;">${u.qty}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      } else if (category === 'procurement') {
        rowCells = `<td>${u.id}</td><td>${u.details}</td><td>${r.requested_by_name || r.requestedBy || '—'}</td><td style="font-weight:700;">${u.qty}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      } else if (category === 'delivery') {
        rowCells = `<td>${u.id}</td><td>${u.details}</td><td>${u.qty}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      } else if (category === 'updates') {
        rowCells = `<td>${u.id}</td><td>${u.details}</td><td>${r.update_type || '—'}</td><td>${u.qty}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      } else if (category === 'adjustments') {
        rowCells = `<td>${u.id}</td><td>${u.details}</td><td>${r.action || '—'}</td><td>${r.quantity || '—'}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      } else if (category === 'counts') {
        rowCells = `<td>${u.id}</td><td>${r.counted_by || '—'}</td><td>${u.qty}</td><td style="color:${sColor}; font-weight:800;">${u.s}</td><td>${u.date}</td>`;
      }
      
      rowsHtml += `<tr>${rowCells}</tr>`;
    });

    const reportTitle = category === 'all' ? 'FULL AUDIT LOG REPORT' : `${cats.find(c => c.id === category)?.label.toUpperCase()} REPORT`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Print Report - SUTANA EMS</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #111827; background: #fff; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 4px solid #065F46; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #065F46; letter-spacing: 1px; text-transform: uppercase; }
          .header p { margin: 8px 0 0; font-size: 14px; color: #4B5563; font-weight: 600; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; padding-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 40px; }
          th { background: #F3F4F6; padding: 14px; border-bottom: 3px solid #111827; color: #111827; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 12px 14px; border-bottom: 1px solid #D1D5DB; vertical-align: middle; color: #374151; }
          tr:nth-child(even) td { background-color: #F9FAFB; }
          .footer { text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 50px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; size: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌿 SUTANA EMS</h1>
          <p>${reportTitle}</p>
        </div>
        <div class="meta">
          <span><strong>FILTERS:</strong> ${filteredLabel(status, time)}</span>
          <span><strong>GENERATED:</strong> ${new Date().toLocaleString()}</span>
          <span><strong>TOTAL RECORDS:</strong> ${data.length}</span>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px; font-weight:600;">No records found matching criteria.</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          SUTANA Enterprise Management System &mdash; System Generated Document
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const cats = [
    { id: 'procurement', label: 'Procurement' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'updates', label: 'Stock Updates' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'counts', label: 'Physical Counts' },
    { id: 'all', label: 'ALL' }
  ];

  const filteredLabel = (s, t) => {
    return `[${s === 'All' ? 'ALL' : s.toUpperCase()} / ${t === 'All' ? 'ALL TIME' : t.toUpperCase()}]`;
  };

  const renderTableHeaders = () => {
    if (category === 'all') return ['Module', 'ID / Ref', 'Details', 'Action / Qty', 'Status', 'Date'];
    if (category === 'procurement') return ['Reference', 'Item / Purpose', 'Requested By', 'Amount', 'Status', 'Date'];
    if (category === 'delivery') return ['Delivery No', 'Supplier', 'Quantity', 'Status', 'Date'];
    if (category === 'updates') return ['Update ID', 'Drug', 'Type', 'Qty', 'Status', 'Date'];
    if (category === 'adjustments') return ['Adjustment ID', 'Drug', 'Action', 'Qty', 'Status', 'Date'];
    if (category === 'counts') return ['Count No', 'Counted By', 'Remarks', 'Status', 'Date'];
    return [];
  };

  const getUnifiedRowData = (r, cat) => {
    const oldData = parseJSON(r.old_data);
    const newData = parseJSON(r.new_data);
    
    let mod = ''; let id = ''; let details = ''; let qty = '';
    
    if (cat === 'procurement') {
      mod = 'Procurement';
      id = r.reference_number || `#${r.id}`;
      details = r.item_name || r.purpose || '—';
      qty = r.amount ? `ETB ${parseFloat(r.amount).toLocaleString()}` : (r.estimated_cost ? `ETB ${parseFloat(r.estimated_cost).toLocaleString()}` : '—');
    } else if (cat === 'delivery') {
      mod = 'Delivery';
      id = r.delivery_no || `#${r.id}`;
      details = r.supplier_name || '—';
      qty = r.quantity || r.quantity_summary || '—';
    } else if (cat === 'updates') {
      mod = 'Stock Update';
      id = r.id;
      details = r.medicine_name || r.drug_name || oldData.drug_name || newData.drug_name || '—';
      qty = `${r.update_type || 'Update'} (${oldData.quantity || 0} → ${newData.quantity ?? (r.new_quantity ?? 0)})`;
    } else if (cat === 'adjustments') {
      mod = 'Adjustment';
      id = r.id;
      details = r.drug_name || r.medicine_name || r.item_name || '—';
      qty = `${r.action || '—'} (${r.quantity || '—'})`;
    } else if (cat === 'counts') {
      mod = 'Physical Count';
      id = r.count_no || `#${r.id}`;
      details = `Counted by ${r.counted_by || '—'}`;
      qty = r.remarks || '—';
    }
    
    const dateStr = r.updated_at || r.created_at || r.delivery_date || r.count_date;
    const date = dateStr ? new Date(dateStr).toLocaleDateString() : '—';
    const s = r.status || 'UNKNOWN';

    return { mod, id, details, qty, date, s };
  };

  const renderTableRow = (r) => {
    const cat = category === 'all' ? r._cat : category;
    const u = getUnifiedRowData(r, cat);

    if (category === 'all') return (
      <tr key={`${cat}-${r.id}`}>
        <td style={{ fontWeight: 600, color: C.forest }}>{u.mod}</td>
        <td>{u.id}</td>
        <td>{u.details}</td>
        <td>{u.qty}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );

    if (category === 'procurement') return (
      <tr key={r.id}>
        <td>{u.id}</td>
        <td>{u.details}</td>
        <td>{r.requested_by_name || r.requestedBy || '—'}</td>
        <td style={{ fontWeight: 700 }}>{u.qty}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );
    if (category === 'delivery') return (
      <tr key={r.id}>
        <td>{u.id}</td>
        <td>{u.details}</td>
        <td>{u.qty}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );
    if (category === 'updates') return (
      <tr key={r.id}>
        <td>{u.id}</td>
        <td>{u.details}</td>
        <td>{r.update_type || '—'}</td>
        <td>{u.qty}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );
    if (category === 'adjustments') return (
      <tr key={r.id}>
        <td>{u.id}</td>
        <td>{u.details}</td>
        <td>{r.action || '—'}</td>
        <td>{r.quantity || '—'}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );
    if (category === 'counts') return (
      <tr key={r.id}>
        <td>{u.id}</td>
        <td>{r.counted_by || '—'}</td>
        <td>{u.qty}</td>
        <td><Badge status={u.s} /></td>
        <td>{u.date}</td>
      </tr>
    );
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, padding: '20px', background: C.white, border: `1px solid ${C.border}`, boxShadow: `0 4px 12px rgba(0,0,0,0.05)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cats.map(c => (
              <FilterBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</FilterBtn>
            ))}
          </div>
          <Btn onClick={handlePrint} color={C.darkGray} border="#1F2937" style={{ padding: '8px 16px', fontSize: 12 }}>
            <FileText size={14} /> Print Log
          </Btn>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginRight: 4 }}>STATUS:</span>
            {['Approved', 'Rejected', 'All'].map(s => (
              <button
                key={s} onClick={() => setStatus(s)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 700, border: `1px solid ${status === s ? C.forest : C.border}`,
                  background: status === s ? C.forest : C.white, color: status === s ? C.white : C.gray,
                  cursor: 'pointer', borderRadius: 4
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginRight: 4 }}>TIME:</span>
            {['Week', 'Month', 'Quarter', 'Year', 'All'].map(t => (
              <button
                key={t} onClick={() => setTime(t)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 700, border: `1px solid ${time === t ? C.forest : C.border}`,
                  background: time === t ? C.forest : C.white, color: time === t ? C.white : C.gray,
                  cursor: 'pointer', borderRadius: 4
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="print-area" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: C.dark }}>
          {category === 'all' ? 'FULL AUDIT LOG' : cats.find(c => c.id === category)?.label.toUpperCase() + ' LOG'} 
          <span style={{ fontSize: 13, color: C.gray, fontWeight: 500, marginLeft: 8 }}>— {filteredLabel(status, time)}</span>
        </h2>
        
        {loading ? <Spinner /> : data.length === 0 ? <Empty icon={FileText} message="No records match your filters." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="audit-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr>
                  {renderTableHeaders().map(h => (
                    <th key={h} style={{ padding: '12px 14px', borderBottom: `2px solid ${C.dark}`, color: C.dark, fontWeight: 800 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => {
                    const row = renderTableRow(r);
                    if (!row) return null;
                    return React.cloneElement(row, {
                      key: `${r.id || i}-${i}`,
                      style: { borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.lightGray : C.white }
                    });
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════
/* ═══════════════════════════════════════════════════════════
   TAB 6 — STORE ADJUSTMENTS
═══════════════════════════════════════════════════════════ */
const TabAdjustments = ({ toast }) => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/store-inventory/adjustments/pending?status=Pending');
      setAdjustments(Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []));
    } catch { setAdjustments([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    setActing(id);
    try {
      await apiClient.patch(`/store-inventory/adjustments/${id}/${action}`, action === 'reject' ? { reason: 'Rejected' } : undefined);
      toast(`Adjustment ${action}d.`, 'success');
      load();
    } catch { toast('Failed to process.', 'error'); } finally { setActing(null); }
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.dark }}>Pending Adjustments ({adjustments.length})</h3>
        <Btn onClick={load} color={C.emerald} border={C.dark} style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /> Refresh</Btn>
      </div>
      {loading ? <Spinner /> : adjustments.length === 0 ? <Empty icon={Sliders} message="No pending adjustments found." /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {adjustments.map((a, i) => (
            <div key={a.id || i} style={{ background: C.white, border: `2px solid ${C.border}`, boxShadow: `0 3px 0 ${C.border}`, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.dark, fontSize: 14, marginBottom: 3 }}>{a.drug_name || a.medicine_name || a.item_name || `Adjustment #${a.id}`}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>
                    Before: <strong>{a.quantity_before ?? a.old_quantity ?? '—'}</strong> → After: <strong>{a.quantity_after ?? a.new_quantity ?? '—'}</strong>
                    &nbsp;<span style={{ background: a.adjustment_type === 'REMOVE' ? '#fee2e2' : '#d1fae5', color: a.adjustment_type === 'REMOVE' ? '#b91c1c' : '#065f46', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                      {a.adjustment_type === 'REMOVE' ? '▼ REMOVE' : '▲ ADD'} {Math.abs(a.adjustment_qty ?? 0)}
                    </span>
                    &nbsp;| By: {a.adjusted_by_name || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Reason: {a.reason || '—'}&nbsp;{a.adjustment_no ? `| Ref: ${a.adjustment_no}` : ''}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge status={a.status || 'PENDING'} />
                  {(a.status === 'PENDING' || a.status === 'Pending') && (
                    <>
                      <Btn onClick={() => decide(a.id, 'approve')} disabled={acting === a.id} color={C.forest} border={C.dark} style={{ padding: '6px 12px', fontSize: 11 }}>
                        <CheckCircle size={12} /> Approve
                      </Btn>
                      <Btn onClick={() => decide(a.id, 'reject')} disabled={acting === a.id} color={C.error} border={C.errorDark} style={{ padding: '6px 12px', fontSize: 11 }}>
                        <XCircle size={12} /> Reject
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 7 — PHYSICAL COUNT APPROVALS
═══════════════════════════════════════════════════════════ */
const TabPhysicalCount = ({ toast }) => {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [rejectMap, setRejectMap] = useState({});
  const [showRejectFor, setShowRejectFor] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/store-inventory/counts/pending?status=Pending');
      setCounts(Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []));
    } catch { setCounts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleApprove = async (c) => {
    setActing(c.id);
    try {
      await apiClient.patch(`/store-inventory/counts/${c.id}/approve`);
      toast(`Count ${c.count_no} approved & inventory updated!`, 'success');
      load();
    } catch { toast('Approval failed.', 'error'); } finally { setActing(null); }
  };

  const handleReject = async (c) => {
    const reason = rejectMap[c.id];
    if (!reason?.trim()) { toast('Please enter a rejection reason', 'warning'); return; }
    setActing(c.id);
    try {
      await apiClient.patch(`/store-inventory/counts/${c.id}/reject`, { reason: reason.trim() });
      toast(`Count ${c.count_no} rejected.`, 'success');
      setShowRejectFor(null);
      load();
    } catch { toast('Rejection failed.', 'error'); } finally { setActing(null); }
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.dark }}>Pending Physical Counts ({counts.length})</h3>
        <Btn onClick={load} color={C.emerald} border={C.dark} style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /> Refresh</Btn>
      </div>
      {loading ? <Spinner /> : counts.length === 0 ? <Empty icon={ClipboardCheck} message="No pending physical counts found." /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {counts.map((c, i) => {
            const items = c.items || [];
            const hasVariance = items.some(l => Number(l.variance ?? (l.physical_quantity - l.system_quantity)) !== 0);
            const isExpanded = expanded[c.id] !== false;
            const busy = acting === c.id;
            return (
              <div key={c.id || i} style={{ background: C.white, border: `2px solid ${C.border}`, boxShadow: `0 3px 0 ${C.border}` }}>
                {/* Card Header */}
                <div
                  onClick={() => toggleExpand(c.id)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    background: isExpanded ? C.lightBase : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: C.dark, fontSize: 15, marginBottom: 4 }}>
                      {c.count_no} <span style={{ fontSize: 13, fontWeight: 600, color: C.gray, marginLeft: 8 }}>{c.count_date ? new Date(c.count_date).toLocaleDateString() : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray }}>
                      Items Counted: <strong>{items.length}</strong> &nbsp;|&nbsp; Variance Detected: <strong style={{ color: hasVariance ? C.error : C.emerald }}>{hasVariance ? 'YES' : 'NO'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>By User ID: {c.counted_by || '—'}&nbsp;{c.remarks ? `| Remarks: ${c.remarks}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Badge status={c.status || 'PENDING'} />
                    {isExpanded ? <ChevronUp size={18} color={C.gray} /> : <ChevronDown size={18} color={C.gray} />}
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div style={{ padding: 20, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ background: C.lightBase, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: C.white, borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
                            <th style={{ padding: '10px 14px', color: C.gray, fontWeight: 700 }}>Medicine</th>
                            <th style={{ padding: '10px 14px', color: C.gray, fontWeight: 700 }}>System Qty</th>
                            <th style={{ padding: '10px 14px', color: C.gray, fontWeight: 700 }}>Physical Qty</th>
                            <th style={{ padding: '10px 14px', color: C.gray, fontWeight: 700 }}>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => {
                            const diff = Number(it.variance ?? (it.physical_quantity - it.system_quantity));
                            return (
                              <tr key={idx} style={{ borderBottom: `1px solid ${C.border}`, background: diff !== 0 ? '#fff5f5' : C.white }}>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: C.dark }}>{it.drug_name || '—'} {it.strength || ''}</td>
                                <td style={{ padding: '10px 14px', color: C.darkGray }}>{it.system_quantity ?? '—'}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 700, color: C.dark }}>{it.physical_quantity ?? '—'}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 800, color: diff > 0 ? C.emerald : diff < 0 ? C.error : C.gray }}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {(c.status === 'PENDING' || c.status === 'Pending') && (
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {showRejectFor === c.id ? (
                          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 400 }}>
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectMap[c.id] || ''}
                              onChange={e => setRejectMap({ ...rejectMap, [c.id]: e.target.value })}
                              style={{ flex: 1, padding: '8px 12px', border: `2px solid ${C.error}`, fontSize: 13, fontFamily: 'inherit' }}
                            />
                            <Btn onClick={() => handleReject(c)} disabled={busy} color={C.error} border={C.errorDark} style={{ padding: '0 16px' }}>Confirm</Btn>
                            <Btn onClick={() => setShowRejectFor(null)} disabled={busy} color={C.gray} border={C.darkGray} style={{ padding: '0 16px' }}>Cancel</Btn>
                          </div>
                        ) : (
                          <>
                            <Btn onClick={() => handleApprove(c)} disabled={busy} color={C.forest} border={C.dark} style={{ padding: '8px 16px', fontSize: 13 }}>
                              <CheckCircle size={14} /> Approve & Update Inventory
                            </Btn>
                            <Btn onClick={() => setShowRejectFor(c.id)} disabled={busy} color={C.error} border={C.errorDark} style={{ padding: '8px 16px', fontSize: 13 }}>
                              <XCircle size={14} /> Reject
                            </Btn>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TABS = [
  { id: 'procurement',  label: 'Procurement',    icon: Clipboard,      component: TabProcurement },
  { id: 'delivery',     label: 'Direct Delivery', icon: Truck,          component: TabDelivery },
  { id: 'updates',      label: 'Stock Updates',  icon: CheckSquare,    component: TabStockUpdates },
  { id: 'adjustments',  label: 'Adjustments',    icon: Sliders,        component: TabAdjustments },
  { id: 'counts',       label: 'Physical Count', icon: ClipboardCheck, component: TabPhysicalCount },
  { id: 'audit_log',    label: 'Audit Log',      icon: FileText,       component: TabAuditLog },
];

const CEOPharmacyHub = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('procurement');
  const [toastMsg, setToastMsg] = useState(null);

  // Read ?tab= query param or location.state.tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && TABS.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else if (location.state?.tab && TABS.find(t => t.id === location.state.tab)) {
      setActiveTab(location.state.tab);
    }
  }, [location.search, location.state]);

  const toast = (text, type = 'info') => {
    setToastMsg({ text, type, id: Date.now() });
  };

  const ActiveTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = ActiveTab.component;

  return (
    <div style={{ minHeight: '100vh', background: C.lightGray, width: '100%', fontFamily: "'Inter', sans-serif" }}>
      <style>{HUB_STYLE + '* { box-sizing: border-box; }'}</style>

      {/* Header */}
      <div style={{ background: C.forest, padding: '18px 30px', borderBottom: `4px solid ${C.dark}` }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.white, letterSpacing: 1, textTransform: 'uppercase' }}>
          🌿 Pharmacy Hub — CEO Control Panel
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sage, fontWeight: 500 }}>
          Manage pharmacy operations, approvals, and finances from one place
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', background: C.white, borderBottom: `3px solid ${C.border}`, padding: '8px 20px', gap: 6 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', fontWeight: 800, fontSize: 12,
                background: isActive ? C.forest : C.white,
                color: isActive ? C.white : C.gray,
                border: `2px solid ${isActive ? C.dark : C.border}`,
                boxShadow: isActive ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`,
                cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: 0.6,
                borderRadius: 0,
                transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, color 0.12s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isActive ? `0 6px 0 ${C.dark}` : `0 6px 0 ${C.border}`;
                if (!isActive) e.currentTarget.style.color = C.forest;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = isActive ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`;
                if (!isActive) e.currentTarget.style.color = C.gray;
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isActive ? `0 4px 0 ${C.dark}` : `0 4px 0 ${C.border}`; }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div style={{ width: '100%', minHeight: 400 }}>
        <ActiveComponent toast={toast} />
      </div>

      {/* Toast Notification */}
      {toastMsg && <ToastMsg key={toastMsg.id} msg={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
};

export default CEOPharmacyHub;
