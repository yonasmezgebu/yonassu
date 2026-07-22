import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  ClipboardList, Clock, Package, CheckCircle, XCircle, RefreshCw,
  Pill, User, Phone, Building2, AlertCircle, ChevronRight, Bell, Loader
} from 'lucide-react';

const KANBAN_COLS = [
  {
    key: 'PENDING',
    label: 'Pending',
    subtitle: 'Awaiting preparation',
    icon: <Clock size={16} />,
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bg: '#fffbeb',
    border: '#fde68a',
    badge: '#f59e0b',
    badgeText: 'white',
  },
  {
    key: 'PREPARED',
    label: 'Ready for Pickup',
    subtitle: 'Notified, waiting customer',
    icon: <Package size={16} />,
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: '#3b82f6',
    badgeText: 'white',
  },
];

export default function SalesOrders() {
  const { showToast, ToastContainer } = useToast();
  const [columns, setColumns] = useState({ PENDING: [], PREPARED: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [branchModal, setBranchModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const prevCounts = useRef({ PENDING: 0, PREPARED: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, preparedRes] = await Promise.all([
        apiClient.get('/sales/orders?status=PENDING'),
        apiClient.get('/sales/orders?status=PREPARED'),
      ]);
      const pending = pendingRes?.data || [];
      const prepared = preparedRes?.data || [];

      // New order arrived notification
      if (!loading && pending.length > prevCounts.current.PENDING) {
        playSound('notification');
      }
      prevCounts.current = { PENDING: pending.length, PREPARED: prepared.length };

      setColumns({ PENDING: pending, PREPARED: prepared });
    } catch (e) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAll]);

  const openPrepareModal = async (rx) => {
    setSelectedBranch('');
    setBranchModal(rx);
    try {
      const res = await apiClient.get('/sales/branches');
      setBranches(res.data || []);
    } catch (e) {
      setBranches([]);
    }
  };

  const handlePrepare = async () => {
    if (!selectedBranch) { showToast('Please select a pickup branch', 'warning'); return; }
    setActionLoading(branchModal.id + '-prepare');
    try {
      await apiClient.patch(`/sales/orders/${branchModal.id}/status`, {
        status: 'PREPARED',
        pickup_branch_id: selectedBranch,
      });
      showToast('✅ Order marked as Ready for Pickup', 'success');
      playSound('success');
      setBranchModal(null);
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickUp = async (rx) => {
    setActionLoading(rx.id + '-pickup');
    try {
      await apiClient.patch(`/sales/orders/${rx.id}/status`, { status: 'PICKED_UP' });
      showToast('✅ Order marked as Picked Up — moved to history', 'success');
      playSound('success');
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { showToast('Please provide a cancellation reason', 'warning'); return; }
    setActionLoading(cancelModal.id + '-cancel');
    try {
      await apiClient.patch(`/sales/orders/${cancelModal.id}/status`, { status: 'CANCELLED' });
      showToast('Order cancelled', 'info');
      setCancelModal(null);
      setCancelReason('');
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to cancel', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const totalActive = columns.PENDING.length + columns.PREPARED.length;

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
              <ClipboardList size={20} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Order Queue
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Live incoming orders from customers
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {totalActive > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#991b1b', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #fca5a5' }}>
              <Bell size={13} fill="#991b1b" /> {totalActive} Active
            </div>
          )}
          <button
            onClick={fetchAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 14 }}>
          <Loader size={32} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Loading orders...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {KANBAN_COLS.map(col => (
            <div key={col.key}>
              {/* Column Header */}
              <div style={{ background: col.gradient, borderRadius: '12px 12px 0 0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
                  {col.icon}
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{col.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.85 }}>— {col.subtitle}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.25)', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 800 }}>
                  {columns[col.key].length}
                </div>
              </div>

              {/* Cards */}
              <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', minHeight: 200, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {columns[col.key].length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <ClipboardList size={36} color="#d1d5db" />
                    <p style={{ margin: '8px 0 0', fontSize: 12 }}>No {col.label.toLowerCase()} orders</p>
                  </div>
                ) : (
                  columns[col.key].map(rx => (
                    <OrderCard
                      key={rx.id}
                      rx={rx}
                      colKey={col.key}
                      actionLoading={actionLoading}
                      onPrepare={() => openPrepareModal(rx)}
                      onPickUp={() => handlePickUp(rx)}
                      onCancel={() => { setCancelModal(rx); setCancelReason(''); }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prepare / Branch Modal */}
      {branchModal && (
        <Modal onClose={() => setBranchModal(null)} title="Select Pickup Branch">
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{branchModal.product_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Customer: <b>{branchModal.customer_name}</b></div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Qty: <b>{branchModal.quantity}</b></div>
            {branchModal.special_instructions && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#92400e', background: '#fffbeb', padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                📝 {branchModal.special_instructions}
              </div>
            )}
          </div>
          <label style={labelStyle}>Select Pickup Branch *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {branches.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No branches available</div>
            ) : branches.map(b => {
              const stock = b.stock_quantity != null ? parseInt(b.stock_quantity) : null;
              const isAvailable = stock !== null && stock > 0;
              const sel = selectedBranch === String(b.id);
              return (
                <label key={b.id} onClick={() => setSelectedBranch(String(b.id))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `2px solid ${sel ? '#059669' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', background: sel ? '#ecfdf5' : 'white', transition: 'all 0.15s' }}>
                  <input type="radio" hidden name="branch" value={b.id} checked={sel} onChange={() => setSelectedBranch(String(b.id))} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{b.name || b.branch_name}</div>
                    <div style={{ fontSize: 11, color: isAvailable ? '#065f46' : '#ef4444', marginTop: 2 }}>
                      {isAvailable ? `✅ ${stock} units in stock` : '❌ Out of stock'}
                    </div>
                  </div>
                  {sel && <CheckCircle size={18} color="#059669" />}
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button onClick={() => setBranchModal(null)} style={cancelBtnStyle}>Cancel</button>
            <button
              onClick={handlePrepare}
              disabled={!selectedBranch || actionLoading}
              style={{ ...confirmBtnStyle, opacity: !selectedBranch ? 0.5 : 1 }}
            >
              {actionLoading ? <Loader size={14} /> : <Package size={14} />}
              {actionLoading ? 'Processing...' : 'Confirm Prepare'}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <Modal onClose={() => setCancelModal(null)} title="Cancel Order">
          <div style={{ background: '#fff1f2', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid #fecdd3' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{cancelModal.product_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Customer: <b>{cancelModal.customer_name}</b></div>
          </div>
          <label style={labelStyle}>Reason for Cancellation *</label>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="E.g. product not available, order invalid..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={() => setCancelModal(null)} style={cancelBtnStyle}>Back</button>
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim() || actionLoading}
              style={{ ...confirmBtnStyle, background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 4px 12px rgba(225,29,72,0.3)', opacity: !cancelReason.trim() ? 0.5 : 1 }}
            >
              {actionLoading ? <Loader size={14} /> : <XCircle size={14} />}
              {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OrderCard({ rx, colKey, actionLoading, onPrepare, onPickUp, onCancel }) {
  const isPrepareLoading = actionLoading === rx.id + '-prepare';
  const isPickupLoading = actionLoading === rx.id + '-pickup';
  const isCancelLoading = actionLoading === rx.id + '-cancel';

  return (
    <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}>
      {/* Card top color strip */}
      <div style={{ height: 3, background: colKey === 'PENDING' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 1 }}>
              #{rx.reference_no || String(rx.id).padStart(5, '0')}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Pill size={13} color="#059669" /> {rx.product_name}
            </div>
          </div>
          <div style={{ background: colKey === 'PENDING' ? '#fef3c7' : '#dbeafe', color: colKey === 'PENDING' ? '#92400e' : '#1e40af', padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
            Qty: {rx.quantity}
          </div>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <User size={12} color="#94a3b8" /> {rx.customer_name}
          </div>
          {rx.customer_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <Phone size={12} color="#94a3b8" /> {rx.customer_phone}
            </div>
          )}
          {rx.branch_pickup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>
              <Building2 size={12} /> {rx.branch_pickup}
            </div>
          )}
          {rx.special_instructions && (
            <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', padding: '4px 8px', borderRadius: 5, border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
              <AlertCircle size={11} style={{ marginTop: 1, flexShrink: 0 }} /> {rx.special_instructions}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: 10 }}>
          {rx.created_at ? new Date(rx.created_at).toLocaleString() : '—'}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {colKey === 'PENDING' && (
            <button onClick={onPrepare} disabled={isPrepareLoading} style={{ flex: 1, padding: '8px 0', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 3px 8px rgba(59,130,246,0.3)' }}>
              {isPrepareLoading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Package size={12} />}
              Prepare
            </button>
          )}
          {colKey === 'PREPARED' && (
            <button onClick={onPickUp} disabled={isPickupLoading} style={{ flex: 1, padding: '8px 0', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: '0 3px 8px rgba(5,150,105,0.3)' }}>
              {isPickupLoading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />}
              Mark Picked Up
            </button>
          )}
          <button onClick={onCancel} disabled={isCancelLoading} style={{ padding: '8px 12px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <XCircle size={12} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 14, padding: 24, maxWidth: 500, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 };
const cancelBtnStyle = { padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const confirmBtnStyle = { padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' };
