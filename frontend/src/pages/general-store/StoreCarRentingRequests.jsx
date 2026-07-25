import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Car, Package, Truck, CheckCircle, XCircle, Clock,
  ChevronRight, AlertCircle, ArrowLeft, RefreshCw, X
} from 'lucide-react';

/* ─── Axios instance ───────────────────────────────────────────────────────── */
const api = axios.create({ baseURL: '' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const C = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf: '#4CAF50', sage: '#A5D6A7', sky: '#87CEEB',
  orange: '#FF9800', red: '#F44336', midGray: '#E0E0E0',
  white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  textSec: '#757575', sageLight: '#E8F5E9',
};

const STATUS = {
  PENDING_STORE:    { label: 'Pending Store',  color: C.orange,  bg: '#FFF8E1' },
  FORWARDED_TO_CEO: { label: 'With CEO',       color: C.sky,     bg: '#E3F2FD' },
  APPROVED:         { label: 'CEO Approved',   color: C.leaf,    bg: '#F1F8E9' },
  REJECTED:         { label: 'Rejected',       color: C.red,     bg: '#FFEBEE' },
  SHIPPED:          { label: 'Shipped',        color: C.emerald, bg: '#E8F5E9' },
  RECEIVED:         { label: 'Received',       color: C.forest,  bg: '#E8F5E9' },
};

/* ─── Toast ─────────────────────────────────────────────────────────────── */
let _tid = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = 'info') => {
    const id = ++_tid;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, toast: add, remove };
}

const ToastUI = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: t.type === 'success' ? C.dark : t.type === 'error' ? '#B71C1C' : '#5C6BC0',
        color: '#fff', padding: '14px 18px', borderLeft: `5px solid ${t.type === 'success' ? C.leaf : t.type === 'error' ? C.red : C.sky}`,
        boxShadow: '4px 4px 0 rgba(0,0,0,0.3)', borderRadius: 0, minWidth: 300,
      }}>
        {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
      </div>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || { label: status, color: C.textSec, bg: C.light };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}`,
      padding: '4px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: 0.5, borderRadius: 0, display: 'inline-block',
    }}>{cfg.label}</span>
  );
};

const SectionHeader = ({ children }) => (
  <div style={{ borderLeft: `5px solid ${C.forest}`, paddingLeft: 12, marginBottom: 18 }}>
    <span style={{ fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function StoreCarRentingRequests() {
  const { toasts, toast, remove } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING_STORE');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  /* Ship modal state — qty per item */
  const [shipQtys, setShipQtys] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/car-renting/store-requests?status=${filterStatus}`);
      setRequests(res.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const loadDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/v1/car-renting/store-requests/${id}`);
      const data = res.data?.data || res.data;
      setDetail(data);
      // Pre-fill ship quantities with requested amounts
      const qtys = {};
      (data.items || []).forEach(it => { qtys[it.id] = it.quantity_requested; });
      setShipQtys(qtys);
    } catch {
      toast('Failed to load request detail', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleShip = async () => {
    if (!detail) return;
    const shippedItems = (detail.items || []).map(it => ({
      id: it.id,
      product_id: it.product_id,
      quantity_shipped: parseInt(shipQtys[it.id]) || 0,
    })).filter(it => it.quantity_shipped > 0);

    if (!shippedItems.length) {
      toast('Please set at least one shipped quantity', 'error');
      return;
    }
    try {
      await api.patch(`/api/v1/car-renting/store-requests/${detail.id}/status`, {
        status: 'SHIPPED',
        items: shippedItems,
      });
      toast('Items shipped successfully! Inventory updated.', 'success');
      setDetail(null);
      setConfirm(null);
      fetchRequests();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to ship', 'error');
    }
  };

  const statuses = ['PENDING_STORE', 'SHIPPED', 'RECEIVED', 'REJECTED'];

  return (
    <div style={{ minHeight: '100vh', background: C.light, fontFamily: '"Inter", system-ui, sans-serif', color: C.darkGray }}>
      <ToastUI toasts={toasts} remove={remove} />

      {/* Ship Confirm Modal */}
      {confirm === 'ship' && detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, maxWidth: 540, width: '100%', padding: 28, borderTop: `5px solid ${C.emerald}`, boxShadow: '6px 6px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: C.darkGray }}>Confirm Shipment</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSec }}>Enter the quantity to ship for each item. Inventory will be deducted automatically.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  {['Product', 'Requested', 'Ship Qty'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it, i) => (
                  <tr key={it.id} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{it.product_name}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 900, color: C.forest }}>{it.quantity_requested}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <input
                        type="number" min="0" max={it.quantity_requested}
                        value={shipQtys[it.id] || 0}
                        onChange={e => setShipQtys(prev => ({ ...prev, [it.id]: e.target.value }))}
                        style={{ width: 70, padding: '6px 8px', border: `2px solid ${C.sage}`, fontWeight: 800, fontSize: 14, outline: 'none', borderRadius: 0, textAlign: 'center' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '10px 20px', background: 'none', border: `2px solid ${C.textSec}`, fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0 }}>Cancel</button>
              <button onClick={handleShip} style={{ padding: '10px 20px', background: C.emerald, border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${C.dark}`, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={16} /> Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ background: C.dark, color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, borderBottom: `4px solid ${C.forest}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {detail && (
            <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: C.sage, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div style={{ background: C.forest, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {detail ? `Request: ${detail.request_number}` : 'Car Rental Store Requests'}
            </div>
            <div style={{ fontSize: 11, color: C.sage, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {detail ? 'Request Detail' : 'CEO-Approved Requests Awaiting Shipment'}
            </div>
          </div>
        </div>
        <button onClick={fetchRequests} style={{ background: 'none', border: `1.5px solid ${C.sage}`, color: C.sage, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 0 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* DETAIL VIEW */}
        {detail ? (
          <div>
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.textSec }}>Loading...</div>
            ) : (
              <>
                <div style={{ background: C.white, border: `2px solid ${C.midGray}`, borderTop: `4px solid ${C.emerald}`, padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                    {[
                      { label: 'Status', value: <StatusBadge status={detail.status} /> },
                      { label: 'Requested By', value: detail.requester_name || '—' },
                      { label: 'CEO Approved By', value: detail.approver_name || '—' },
                      { label: 'Date', value: detail.created_at ? new Date(detail.created_at).toLocaleDateString('en-GB') : '—' },
                    ].map(f => (
                      <div key={f.label} style={{ borderLeft: `3px solid ${C.sage}`, paddingLeft: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSec, textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {detail.notes && <p style={{ margin: 0, fontSize: 13, color: C.textSec }}><strong>Notes:</strong> {detail.notes}</p>}
                </div>

                <SectionHeader>Requested Items</SectionHeader>
                <div style={{ overflowX: 'auto', background: C.white, border: `2px solid ${C.midGray}`, marginBottom: 28 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.dark }}>
                        {['#', 'Product', 'Qty Requested', 'In Stock', 'Qty Shipped', 'Status'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items || []).map((it, i) => (
                        <tr key={it.id || i} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                          <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 800, color: C.darkGray }}>{it.product_name || '—'}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 900, color: C.forest, fontSize: 15 }}>{it.quantity_requested}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 800, color: it.stock_quantity > it.quantity_requested ? C.emerald : C.red }}>{it.stock_quantity ?? '—'}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 800, color: it.quantity_shipped ? C.emerald : C.textSec }}>{it.quantity_shipped ?? '—'}</td>
                          <td style={{ padding: '11px 14px' }}>
                            {it.quantity_shipped ? (
                              <span style={{ color: C.leaf, fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>✓ Shipped</span>
                            ) : (
                              <span style={{ color: C.orange, fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {detail.status === 'PENDING_STORE' && (
                  <button
                    onClick={() => setConfirm('ship')}
                    style={{ padding: '12px 28px', background: C.emerald, border: 'none', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${C.dark}`, borderRadius: 0, display: 'inline-flex', alignItems: 'center', gap: 10, letterSpacing: 0.5 }}
                  >
                    <Truck size={18} /> Ship Items to Car Rental
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          /* LIST VIEW */
          <>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
              {statuses.map(s => {
                const cfg = STATUS[s] || {};
                const isActive = filterStatus === s;
                return (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: '9px 20px', border: `2px solid ${isActive ? C.forest : C.midGray}`,
                    background: isActive ? C.dark : C.white,
                    color: isActive ? '#fff' : C.textSec,
                    fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase',
                    letterSpacing: 0.5, borderRadius: 0,
                  }}>
                    {cfg.label || s}
                  </button>
                );
              })}
            </div>

            <SectionHeader>
              {STATUS[filterStatus]?.label || filterStatus} Car Rental Requests
            </SectionHeader>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.textSec }}>
                <RefreshCw size={28} color={C.sage} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700 }}>Loading...</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: C.textSec, background: C.white, border: `2px dashed ${C.midGray}` }}>
                <Package size={42} color={C.sage} />
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800 }}>No {STATUS[filterStatus]?.label || filterStatus} requests</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', background: C.white, border: `2px solid ${C.midGray}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.dark }}>
                      {['#', 'Request #', 'Requested By', 'Date', 'Items', 'CEO Approved By', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => (
                      <tr key={r.id}
                        style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#E8F5E9'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : C.sageLight}
                      >
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 900, color: C.forest, fontFamily: 'monospace' }}>{r.request_number}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700 }}>{r.requester_name || '—'}</td>
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: C.sageLight, border: `1px solid ${C.sage}`, color: C.forest, padding: '3px 10px', fontWeight: 800, fontSize: 12 }}>{r.item_count ?? '—'}</span>
                        </td>
                        <td style={{ padding: '11px 14px', color: C.textSec }}>{r.approver_name || '—'}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              onClick={() => loadDetail(r.id)}
                              style={{ padding: '7px 14px', background: C.sky, border: 'none', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <ChevronRight size={13} /> View
                            </button>
                            {r.status === 'PENDING_STORE' && (
                              <button
                                onClick={() => { loadDetail(r.id); setTimeout(() => setConfirm('ship'), 600); }}
                                style={{ padding: '7px 14px', background: C.emerald, border: 'none', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${C.dark}`, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <Truck size={13} /> Ship
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
          </>
        )}
      </div>
    </div>
  );
}
