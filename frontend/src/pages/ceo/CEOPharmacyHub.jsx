import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Clipboard, Truck, CheckSquare, Package, Sliders, ClipboardCheck,
  CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp,
  X, Send, FileText, ArrowLeft, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { getPendingUpdateRequests, approveUpdateRequest, rejectUpdateRequest } from '../../utils/storeApi';


/* ─── Enterprise Global Styles (25-Rule Pass) ─── */
const GlobalStyles = () => (
  <style>{`
    /* ─────────── Design Tokens (25-Rule Pass) ─────────── */
    :root {
      --color-primary: #2563EB;
      --color-primary-hover: #1D4ED8;
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

    h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 0; font-family: var(--font-family); }

    @keyframes phFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hubSpin {
      from { transform: rotate(0deg); } to { transform: rotate(360deg); }
    }
    @keyframes deliveryPulse {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.18); opacity: 0.15; }
    }
    @keyframes deliveryRide {
      0%, 100% { transform: translateX(-4px); }
      50% { transform: translateX(4px); }
    }

    .ph-page-wrapper {
      padding: 10px; /* Safe edge margin */
      min-height: calc(100vh - 60px);
      box-sizing: border-box;
      background: var(--color-bg-page);
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.5;
      color: var(--color-text-primary);
      animation: phFadeUp 0.3s ease;
    }

    /* Back Button */
    .ph-back-bar {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px; background: #FFFFFF;
      padding: 10px 16px; border-radius: 8px;
      border: 1px solid var(--color-border);
    }
    .ph-back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 500;
      border: 1px solid var(--color-border); background: #F9FAFB; color: var(--color-text-secondary);
      font-family: inherit; transition: all 150ms ease-in-out;
    }
    .ph-back-btn:hover {
      background: #F59E0B; color: #FFFFFF; border-color: #F59E0B;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }
    .ph-back-divider { width: 1px; height: 24px; background: var(--color-border); }
    .ph-back-label {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 6px;
      font-size: 13px; font-weight: 600;
      border: 1px solid var(--color-primary); background: #EFF6FF; color: #1E40AF;
    }

    .ph-page-content {
      background: var(--color-bg-page);
      padding: 24px;
      margin: 0 auto;
      max-width: 1536px;
      box-sizing: border-box;
    }

    .ph-btn {
      border-radius: 8px;
      height: 36px;
      padding: 0 16px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--color-border);
      transition: all 150ms ease-in-out;
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-family: var(--font-family);
      white-space: nowrap;
    }
    .ph-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ph-btn:hover:not(:disabled) {
      background: #FFD700 !important;
      color: #111827 !important;
      border-color: #FFD700 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(234,179,8,0.25);
    }
    .ph-btn-primary { background: var(--color-primary); color: #FFF; border-color: var(--color-primary); }
    .ph-btn-danger { background: var(--color-danger-bg); color: var(--color-danger); border-color: #fca5a5; }
    .ph-btn-warning { background: var(--color-warning-bg); color: var(--color-warning); border-color: #fcd34d; }

    .ph-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out;
      margin-bottom: 16px;
    }
    .ph-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      transform: translateY(-1px);
    }

    .ph-table-wrap { overflow-x: auto; min-width: 100%; }
    .ph-table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; }
    .ph-table th {
      background: #F9FAFB;
      padding: 12px 16px;
      color: var(--color-text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .ph-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      vertical-align: middle;
    }
    .ph-table tr { transition: background 150ms ease-in-out; }
    .ph-table tr:last-child td { border-bottom: none; }
    .ph-table tbody tr:hover { background: #F9FAFB !important; }
    .ph-table tbody tr { background: var(--color-bg-card); }

    .ph-badge {
      display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px;
      font-size: 12px; font-weight: 500;
    }
    .ph-badge-warning { background: var(--color-warning-bg); color: var(--color-warning); }
    .ph-badge-success { background: var(--color-success-bg); color: var(--color-success); }
    .ph-badge-danger  { background: var(--color-danger-bg);  color: var(--color-danger); }
    .ph-badge-info    { background: var(--color-info-bg);    color: var(--color-info); }
    .ph-badge-default { background: #F3F4F6; color: var(--color-text-secondary); }

    .ph-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: var(--color-bg-card); border-radius: 8px;
      border-left: 4px solid var(--color-primary);
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      padding: 14px 20px; display: flex; align-items: center; gap: 10px; max-width: 380px;
      animation: phFadeUp 0.3s ease;
    }

    /* Tab navigation buttons */
    .ph-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; font-weight: 600; font-size: 14px;
      background: var(--color-bg-card); color: var(--color-text-secondary);
      border: 1px solid var(--color-border); border-radius: 8px;
      cursor: pointer; transition: all 150ms ease-in-out;
    }
    .ph-tab:hover { background: #F9FAFB; color: var(--color-text-primary); }
    .ph-tab.active {
      background: #EFF6FF; color: var(--color-primary);
      border-color: var(--color-primary);
      border-left: 3px solid var(--color-primary);
    }

    @media (max-width: 1024px) {
      .ph-page-wrapper { padding: 6px; }
      .ph-page-content { padding: 16px; }
    }
    @media (max-width: 768px) {
      .ph-page-wrapper { padding: 4px; }
      .ph-page-content { padding: 12px; }
      .ph-btn { min-height: 44px; }
      .ph-tab { min-height: 44px; flex: 1; justify-content: center; }
    }
    @media (max-width: 480px) {
      .ph-tab { flex: 100%; }
    }
  `}</style>
);


/* ─── Standardized Button ─── */
const Btn = ({ onClick, disabled, children, color, border, style = {} }) => {
  let btnClass = 'ph-btn';
  const c = String(color || '');
  if (c.includes('primary') || c.includes('2E8B57') || c.includes('228B22')) btnClass += ' ph-btn-primary';
  else if (c.includes('danger') || c.includes('EF4444')) btnClass += ' ph-btn-danger';
  else if (c.includes('warning') || c.includes('F59E0B')) btnClass += ' ph-btn-warning';
  
  return (
    <button onClick={onClick} disabled={disabled} className={btnClass} style={style}>
      {children}
    </button>
  );
};

/* ─── Standardized Filter Button ─── */
const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`ph-btn ${active ? 'ph-btn-primary' : ''}`}>
    {children}
  </button>
);

const Badge = ({ status }) => {
  const s = (status || '').toUpperCase();
  let bClass = 'ph-badge ph-badge-default';
  if (s.includes('PENDING') || s === 'WAIT') bClass = 'ph-badge ph-badge-warning';
  else if (s.includes('APPROVE') || s === 'COMPLETED' || s === 'SHIPPED') bClass = 'ph-badge ph-badge-success';
  else if (s.includes('REJECT')) bClass = 'ph-badge ph-badge-danger';
  return <span className={bClass}>{status}</span>;
};

/* ─── Loading Spinner ─── */
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: 'var(--color-text-secondary)' }}>
    
    <RefreshCw size={24} className="hub-spinner" />
    <span style={{ fontWeight: 600 }}>Loading...</span>
  </div>
);

/* ─── Empty State ─── */
const Empty = ({ icon: Icon = Package, message = 'No records found.' }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
    <Icon size={48} color={'var(--color-primary)'} style={{ marginBottom: 12 }} />
    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{message}</p>
  </div>
);

/* ─── Toast ─── */
const ToastMsg = ({ msg, onClose }) => {
  const colors = { success: 'var(--color-success)', error: 'var(--color-danger)', info: 'var(--color-info)', warning: 'var(--color-warning)' };
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div className="ph-toast" style={{ borderLeftColor: colors[msg.type] || 'var(--color-primary)' }}>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{msg.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}><X size={16} /></button>
    </div>
  );
};


const AnimatedEmpty = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 20 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: `4px solid ${'var(--color-primary)'}`, borderRadius: '50%', animation: 'hubSpin 3s linear infinite' }} />
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, border: `4px dashed ${'var(--color-primary)'}`, borderRadius: '50%', animation: 'hubSpin 4s linear infinite reverse' }} />
      <Package size={32} color={'var(--color-primary)'} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'hubSlideDown 1.5s ease-in-out infinite alternate' }} />
    </div>
    <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-secondary)', fontSize: 18, fontWeight: 800 }}>All Caught Up!</h3>
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
          <div className="ph-table-wrap"><table className="ph-table">
            <thead>
              <tr>
                {['Reference', 'Item / Purpose', 'Requested By', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} >
                  <td style={{ padding: '10px 16px', fontWeight: 700 }}>{r.reference_number || r.pr_no || `#${r.id}`}</td>
                  <td style={{ padding: '10px 16px' }}>{r.item_name || r.drug_name || r.purpose || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{r.requested_by_name || r.requestedBy || '—'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>ETB {parseFloat(r.amount || r.estimated_total || r.estimated_cost || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {(r.status === 'PENDING_CEO' || r.status === 'PENDING_CEO_REVIEW') && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => decide(r.id, 'APPROVED')} disabled={acting === r.id} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <CheckCircle size={13} /> Approve
                        </Btn>
                        <Btn onClick={() => decide(r.id, 'REJECTED')} disabled={acting === r.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <XCircle size={13} /> Reject
                        </Btn>
                        <Btn onClick={() => decide(r.id, 'WAIT')} disabled={acting === r.id} color={'var(--color-warning)'} border={'var(--color-border)'} style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-primary)' }}>
                          Wait
                        </Btn>
                      </div>
                    )}
                    {(r.status !== 'PENDING_CEO' && r.status !== 'PENDING_CEO_REVIEW') && <Badge status={r.status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div></div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 3 — DIRECT DELIVERY (Pharmacy Manager → CEO → Finance)
═══════════════════════════════════════════════════════════ */
const AnimatedDeliveryEmpty = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
    <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 24 }}>
      {/* Outer pulsing ring */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `${'var(--color-primary)'}`, animation: 'deliveryPulse 2s ease-in-out infinite' }} />
      {/* Truck icon */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Truck size={38} color={'var(--color-primary)'} style={{ animation: 'deliveryRide 2.5s ease-in-out infinite' }} />
      </div>
    </div>
    <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-secondary)', fontSize: 18, fontWeight: 800 }}>All Clear — No Pending Deliveries</h3>
    <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: 14, color: 'var(--color-text-secondary)' }}>
      Pharmacy Manager has not submitted any deliveries requiring your confirmation.
    </p>
    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-primary)' }}>
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

  return (
    <div style={{ padding: '24px 30px' }}>

      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={18} color={'var(--color-primary)'} />
          Direct Delivery Confirmations
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Goods received directly from supplier to pharmacy stock — awaiting CEO confirmation before Finance processes payment.
        </p>
      </div>

      {deliveries.length === 0 ? <AnimatedDeliveryEmpty /> : (
        <div style={{ overflowX: 'auto' }}>
          <div className="ph-table-wrap"><table className="ph-table">
            <thead>
              <tr>
                {['Delivery No', 'Drug / Item', 'Supplier', 'Qty', 'Cost Price', 'Total (ETB)', 'Date', 'Received By', 'Invoice', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d, i) => (
                <React.Fragment key={d.id}>
                  <tr >
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--color-primary)' }}>{d.delivery_no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-primary)' }}>{d.drug_name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{d.supplier_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>{d.quantity} {d.unit_of_measure}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>ETB {parseFloat(d.unit_price || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)' }}>ETB {parseFloat(d.total_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: 12 }}>{d.received_by_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: 12 }}>{d.invoice_no || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => decide(d.id, 'CONFIRM')} disabled={acting === d.id} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '6px 11px', fontSize: 11 }}>
                          <CheckCircle size={12} /> Confirm
                        </Btn>
                        <Btn onClick={() => setShowRejectFor(d.id)} disabled={acting === d.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 11px', fontSize: 11 }}>
                          <XCircle size={12} /> Reject
                        </Btn>
                      </div>
                    </td>
                  </tr>
                  {/* Inline reject form */}
                  {showRejectFor === d.id && (
                    <tr style={{ background: '#fff8f8', borderBottom: `2px solid ${'var(--color-danger)'}` }}>
                      <td colSpan={10} style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)' }}>Rejection reason:</span>
                          <input
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            style={{ flex: 1, minWidth: 200, padding: '7px 10px', border: `2px solid ${'var(--color-danger)'}`, outline: 'none', fontSize: 12, borderRadius: 0 }}
                          />
                          <Btn onClick={() => decide(d.id, 'REJECT')} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '7px 14px', fontSize: 12 }}>
                            Confirm Rejection
                          </Btn>
                          <Btn onClick={() => { setShowRejectFor(null); setRejectNote(''); }} color={'var(--color-text-secondary)'} border={'var(--color-border)'} style={{ padding: '7px 14px', fontSize: 12 }}>
                            Cancel
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Notes row if any */}
                  {d.notes && (
                    <tr style={{ background: i % 2 === 0 ? '#edf9f1' : '#f8fffb', borderBottom: `1px solid ${'var(--color-border)'}` }}>
                      <td colSpan={10} style={{ padding: '4px 14px 10px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        📝 {d.notes}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table></div></div>
      )}

      {/* Flow explanation card */}
      <div style={{ marginTop: 28, background: 'var(--color-primary)', border: `2px solid ${'var(--color-primary)'}`, padding: '14px 18px', fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>📋 How This Flow Works</div>
        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
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
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
          Pending Stock Updates ({requests.length})
        </h3>
        <Btn onClick={load} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '7px 14px', fontSize: 12 }}>
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
              <div key={r.id || idx} className="ph-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-primary)', marginBottom: 8 }}>{medicineName} (Request #{r.id})</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Update Details</div>
                      {Object.keys(newData).map(key => {
                        if (key === 'reason') return null;
                        const oldVal = oldData[key] !== undefined ? String(oldData[key]) : '—';
                        const newVal = newData[key] !== undefined ? String(newData[key]) : '—';
                        if (oldVal === newVal && key !== 'quantity') return null; // hide unchanged fields except quantity which might be the only thing explicitly requested sometimes
                        
                        return (
                          <div key={key} style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                            <span style={{ width: '120px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span>
                            <span style={{ color: '#64748b' }}><span style={{ textDecoration: 'line-through' }}>{oldVal}</span> <strong style={{ color: '#0f172a', marginLeft: '4px' }}>→ {newVal}</strong></span>
                          </div>
                        );
                      })}
                      {(!newData || Object.keys(newData).length === 0) && r.new_quantity && (
                         <div style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                            <span style={{ width: '120px', fontWeight: 600, color: '#334155' }}>Quantity:</span>
                            <span style={{ color: '#64748b' }}><span style={{ textDecoration: 'line-through' }}>{currentQty}</span> <strong style={{ color: '#0f172a', marginLeft: '4px' }}>→ {requestedQty}</strong></span>
                         </div>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}><strong>Requested by:</strong> {r.requested_by_name || '—'} &nbsp;|&nbsp; {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}><strong>Reason:</strong> {reasonText}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge status={r.status || 'PENDING'} />
                    {(r.status === 'PENDING' || r.status === 'Pending') && (
                      <>
                        <Btn onClick={() => approve(r)} disabled={acting === r.id} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <CheckCircle size={12} /> Approve
                        </Btn>
                        <Btn onClick={() => setShowRejectFor(showRejectFor === r.id ? null : r.id)} disabled={acting === r.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                          <XCircle size={12} /> Reject
                        </Btn>
                      </>
                    )}
                  </div>
                </div>

                {/* Reject Dropdown */}
                {showRejectFor === r.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${'var(--color-border)'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>REJECTION REASON *</div>
                    <textarea
                      value={rejectReason[r.id] || ''}
                      onChange={e => setRejectReason(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: 10, fontSize: 13,
                        border: `2px solid ${'var(--color-danger)'}`, borderRadius: 0, resize: 'vertical',
                        fontFamily: 'Inter, sans-serif', marginBottom: 10,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={() => reject(r)} disabled={acting === r.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 12px', fontSize: 12 }}>
                        <Send size={13} /> Confirm Reject
                      </Btn>
                      <Btn onClick={() => setShowRejectFor(null)} color={'var(--color-text-secondary)'} border={'var(--color-border)'} style={{ padding: '6px 12px', fontSize: 12 }}>
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
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>Pending Adjustments ({adjustments.length})</h3>
        <Btn onClick={load} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /> Refresh</Btn>
      </div>
      {loading ? <Spinner /> : adjustments.length === 0 ? <Empty icon={Sliders} message="No pending adjustments found." /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {adjustments.map((a, i) => (
            <div key={a.id || i} className="ph-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 14, marginBottom: 3 }}>{a.drug_name || a.medicine_name || a.item_name || `Adjustment #${a.id}`}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Before: <strong>{a.quantity_before ?? a.old_quantity ?? '—'}</strong> → After: <strong>{a.quantity_after ?? a.new_quantity ?? '—'}</strong>
                    &nbsp;<span style={{ background: a.adjustment_type === 'REMOVE' ? '#fee2e2' : '#d1fae5', color: a.adjustment_type === 'REMOVE' ? '#b91c1c' : '#065f46', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                      {a.adjustment_type === 'REMOVE' ? '▼ REMOVE' : '▲ ADD'} {Math.abs(a.adjustment_qty ?? 0)}
                    </span>
                    &nbsp;| By: {a.adjusted_by_name || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Reason: {a.reason || '—'}&nbsp;{a.adjustment_no ? `| Ref: ${a.adjustment_no}` : ''}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge status={a.status || 'PENDING'} />
                  {(a.status === 'PENDING' || a.status === 'Pending') && (
                    <>
                      <Btn onClick={() => decide(a.id, 'approve')} disabled={acting === a.id} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                        <CheckCircle size={12} /> Approve
                      </Btn>
                      <Btn onClick={() => decide(a.id, 'reject')} disabled={acting === a.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 12px', fontSize: 11 }}>
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
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>Pending Physical Counts ({counts.length})</h3>
        <Btn onClick={load} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /> Refresh</Btn>
      </div>
      {loading ? <Spinner /> : counts.length === 0 ? <Empty icon={ClipboardCheck} message="No pending physical counts found." /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {counts.map((c, i) => {
            const items = c.items || [];
            const hasVariance = items.some(l => Number(l.variance ?? (l.physical_quantity - l.system_quantity)) !== 0);
            const isExpanded = expanded[c.id] !== false;
            const busy = acting === c.id;
            return (
              <div key={c.id || i} className="ph-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card Header */}
                <div
                  onClick={() => toggleExpand(c.id)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    background: isExpanded ? 'var(--color-bg-page)' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 15, marginBottom: 4 }}>
                      {c.count_no} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{c.count_date ? new Date(c.count_date).toLocaleDateString() : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Items Counted: <strong>{items.length}</strong> &nbsp;|&nbsp; Variance Detected: <strong style={{ color: hasVariance ? 'var(--color-danger)' : 'var(--color-primary)' }}>{hasVariance ? 'YES' : 'NO'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>By User ID: {c.counted_by || '—'}&nbsp;{c.remarks ? `| Remarks: ${c.remarks}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Badge status={c.status || 'PENDING'} />
                    {isExpanded ? <ChevronUp size={18} color={'var(--color-text-secondary)'} /> : <ChevronDown size={18} color={'var(--color-text-secondary)'} />}
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded && (
                  <div style={{ padding: 20, borderTop: `1px solid ${'var(--color-border)'}` }}>
                    <div style={{ background: 'var(--color-bg-page)', border: `1px solid var(--color-border)`, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                      <div className="ph-table-wrap"><table className="ph-table">
                        <thead>
                          <tr style={{ background: 'var(--color-bg-card)', borderBottom: `2px solid ${'var(--color-border)'}`, textAlign: 'left' }}>
                            <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Medicine</th>
                            <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>System Qty</th>
                            <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Physical Qty</th>
                            <th style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Variance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => {
                            const diff = Number(it.variance ?? (it.physical_quantity - it.system_quantity));
                            return (
                              <tr key={idx} style={{ borderBottom: `1px solid ${'var(--color-border)'}`, background: diff !== 0 ? '#fff5f5' : 'var(--color-bg-card)' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-primary)' }}>{it.drug_name || '—'} {it.strength || ''}</td>
                                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{it.system_quantity ?? '—'}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-primary)' }}>{it.physical_quantity ?? '—'}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 800, color: diff > 0 ? 'var(--color-primary)' : diff < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>{/* end ph-table-wrap */}
                    </div>{/* end bg-page div */}

                    {(c.status === 'PENDING' || c.status === 'Pending') && (
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {showRejectFor === c.id ? (
                          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 400 }}>
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectMap[c.id] || ''}
                              onChange={e => setRejectMap({ ...rejectMap, [c.id]: e.target.value })}
                              style={{ flex: 1, padding: '8px 12px', border: `2px solid ${'var(--color-danger)'}`, fontSize: 13, fontFamily: 'inherit' }}
                            />
                            <Btn onClick={() => handleReject(c)} disabled={busy} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '0 16px' }}>Confirm</Btn>
                            <Btn onClick={() => setShowRejectFor(null)} disabled={busy} color={'var(--color-text-secondary)'} border={'var(--color-border)'} style={{ padding: '0 16px' }}>Cancel</Btn>
                          </div>
                        ) : (
                          <>
                            <Btn onClick={() => handleApprove(c)} disabled={busy} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '8px 16px', fontSize: 13 }}>
                              <CheckCircle size={14} /> Approve & Update Inventory
                            </Btn>
                            <Btn onClick={() => setShowRejectFor(c.id)} disabled={busy} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '8px 16px', fontSize: 13 }}>
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

const TabExpiredDrugs = ({ toast }) => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [showRejectFor, setShowRejectFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/expired-drugs');
      setDrugs(res.data?.data?.filter(d => d.status === 'PENDING') || []);
    } catch (e) {
      toast('Failed to load expired drugs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDecision = async (id, decision) => {
    if (decision === 'REJECTED' && !rejectReason[id]?.trim()) {
      return toast('Please enter a rejection reason.', 'error');
    }
    setActing(id);
    try {
      await apiClient.patch(`/pharmacy/expired-drugs/${id}/ceo-decision`, {
        decision,
        ceo_notes: decision === 'REJECTED' ? rejectReason[id] : ''
      });
      toast(`Drug successfully ${decision.toLowerCase()}.`, 'success');
      setShowRejectFor(null);
      setRejectReason(prev => ({ ...prev, [id]: '' }));
      load();
    } catch (e) {
      toast(`Failed to process decision.`, 'error');
    } finally {
      setActing(null);
    }
  };

  return (
    <div style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
          Pending Expired Drugs ({drugs.length})
        </h3>
        <Btn onClick={load} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '7px 14px', fontSize: 12 }}>
          <RefreshCw size={13} /> Refresh
        </Btn>
      </div>

      {loading ? <Spinner /> : drugs.length === 0 ? <Empty icon={CheckCircle} message="No pending expired drugs to review!" /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          {drugs.map(d => (
            <div key={d.id} className="ph-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-primary)', marginBottom: 3 }}>{d.drug_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Quantity: <strong>{d.quantity}</strong> | Expired: <strong>{new Date(d.expiry_date).toLocaleDateString()}</strong></div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Requested Action: {d.action_required || 'DISPOSE'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Reported on: {new Date(d.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Btn onClick={() => handleDecision(d.id, 'APPROVED')} disabled={acting === d.id} color={'var(--color-primary)'} border={'var(--color-primary)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                    <CheckCircle size={12} /> Approve
                  </Btn>
                  <Btn onClick={() => setShowRejectFor(showRejectFor === d.id ? null : d.id)} disabled={acting === d.id} color={'var(--color-danger)'} border={'var(--color-danger)'} style={{ padding: '6px 12px', fontSize: 11 }}>
                    <XCircle size={12} /> Reject
                  </Btn>
                </div>
              </div>

              {showRejectFor === d.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed var(--color-border)` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>REJECTION REASON *</div>
                  <textarea
                    value={rejectReason[d.id] || ''}
                    onChange={e => setRejectReason(prev => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="Enter reason for rejection..."
                    rows={2}
                    style={{ width: '100%', boxSizing: 'border-box', padding: 10, fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 6, outline: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <Btn onClick={() => handleDecision(d.id, 'REJECTED')} disabled={acting === d.id || !(rejectReason[d.id]||'').trim()} color={'white'} border={'var(--color-danger)'} style={{ background: 'var(--color-danger)', padding: '6px 16px', fontSize: 12 }}>
                      {acting === d.id ? 'Processing...' : 'Confirm Reject'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
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
  { id: 'expired',      label: 'Expired Drugs',  icon: AlertTriangle,  component: TabExpiredDrugs },
];

const CEOPharmacyHub = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    <div className="ph-page-wrapper">
      <div className="ph-page-content">
      <GlobalStyles />

      {/* ── Back Bar ── */}
      <div className="ph-back-bar">
        <button className="ph-back-btn" onClick={() => navigate('/ceo/approvals')}>
          <ArrowLeft size={14} /> Back to Approvals Hub
        </button>
        <div className="ph-back-divider" />
        <span className="ph-back-label">
          <Package size={15} /> Pharmacy Hub
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          🌿 Pharmacy Hub
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>
          Manage pharmacy operations, approvals, and finances from one place
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ph-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
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
    </div>
  );
};

export default CEOPharmacyHub;
