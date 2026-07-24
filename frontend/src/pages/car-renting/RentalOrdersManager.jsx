import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Mail, AlertTriangle, Car, Search, RefreshCw, ChevronRight } from 'lucide-react';
import carService from '../../services/carService';
import { useNavigate } from 'react-router-dom';

/* ─────────────── CONSTANTS & THEME ─────────────── */
const C = {
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  border: '#E0E0E0',
  darkGray: '#333333',
  darkGreen: '#1B5E20',
  forestGreen: '#2E8B57',
  emerald: '#10B981',
  sage: '#81C784',
  earthBrown: '#8D6E63',
  red: '#E53935',
  orange: '#FB8C00'
};

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

const STATUS_COLORS = {
  PENDING_APPROVAL: '#F57C00',
  APPROVED: '#1976D2',
  CONFIRMED: '#0288D1',
  ACTIVE: '#388E3C',
  COMPLETED: '#757575',
  REJECTED: '#D32F2F',
  CANCELLED: '#D32F2F'
};

const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map(t => {
      const bg = t.type === 'error' ? '#F44336' : (t.type === 'success' ? '#4CAF50' : '#2196F3');
      return (
        <div key={t.id} style={{ background: bg, color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, minWidth: 250, fontSize: 14, fontWeight: 600, animation: 'slideIn 0.3s ease-out' }}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      );
    })}
    <style>{`@keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
  </div>
);

const S = {
  page: {
    width: '100%', minHeight: '100vh',
    background: C.white, fontFamily: '"Inter", system-ui, sans-serif',
    color: C.darkGray, boxSizing: 'border-box',
  },
  banner: {
    background: C.darkGreen,
    borderBottom: `3px solid ${C.earthBrown}`,
    padding: '0 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '0.75rem',
    minHeight: 70,
  },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  bannerTitle: {
    color: '#fff', fontSize: '1.35rem', fontWeight: 800,
    letterSpacing: '0.01em', margin: 0,
  },
  bannerSub: { color: C.sage, fontSize: '0.8rem', margin: '2px 0 0', fontWeight: 500 },
  btnRefresh: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    cursor: 'pointer',
    boxShadow: '0 3px 0 rgba(0,0,0,0.3)',
    transition: 'all 0.12s',
  },
  filterBar: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderTop: 'none',
    padding: '12px 1.5rem',
    display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
  },
  searchWrap: { position: 'relative', width: 280, maxWidth: '100%' },
  searchInput: {
    width: '100%', padding: '8px 12px 8px 34px',
    border: `1.5px solid ${C.border}`, borderRadius: 4,
    fontSize: 13, color: C.darkGray, outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '8px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 4, fontSize: 13, color: C.darkGray,
    background: '#fff', cursor: 'pointer', outline: 'none',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 0, borderBottom: `1px solid ${C.border}`,
    background: '#FAFAFA',
  },
  statCard: (color, isActive) => ({
    padding: '20px 24px', cursor: 'pointer',
    borderRight: `1px solid ${C.border}`,
    borderBottom: isActive ? `3px solid ${color}` : '3px solid transparent',
    background: isActive ? `${color}0D` : 'transparent',
    transition: 'all 0.15s',
  }),
  statNum: (color) => ({
    fontSize: '2rem', fontWeight: 900,
    color: color, lineHeight: 1, marginBottom: 6,
  }),
  statLabel: {
    fontSize: '0.75rem', fontWeight: 700,
    color: '#757575', letterSpacing: '0.05em',
  },
  tableWrap: {
    padding: '1.5rem', overflowX: 'auto',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: 13, textAlign: 'left',
  },
  th: {
    padding: '12px 16px', background: C.lightGray,
    color: '#757575', fontWeight: 700, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: `2px solid ${C.border}`,
  },
  td: {
    padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
    color: C.darkGray, verticalAlign: 'middle',
  },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', borderRadius: 12,
    fontSize: 11, fontWeight: 700,
    background: `${color}1A`, color: color,
  }),
  btnAction: {
    padding: '6px 12px', background: C.forestGreen, color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  empty: {
    padding: '4rem 2rem', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
};

const RentalOrdersManager = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', paymentStatus: '', search: '' });
  const [toasts, setToasts] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [actionPrompt, setActionPrompt] = useState({ orderId: null, action: null, note: '' });
  const [returnForm, setReturnForm] = useState({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' });

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await carService.getAllRentalOrders();
      if (res.status === 'success') {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load rental orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setSpinning(true);
    await load();
    setTimeout(() => setSpinning(false), 600);
    toast('Orders refreshed successfully.', 'success');
  };

  const confirmAction = async (orderId, newStatus, note) => {
    try {
      await carService.updateRentalOrderStatus(orderId, { status: newStatus, managerNote: note });
      toast(`Order ${newStatus.toLowerCase()} successfully.`, 'success');
      load();
    } catch (error) {
      toast('Failed to update order status.', 'error');
    } finally {
      setActionPrompt({ orderId: null, action: null, note: '' });
    }
  };

  const handleStartRental = async (orderId) => {
    try {
      await carService.updateRentalOrderStatus(orderId, { status: 'ACTIVE' });
      toast('Rental started successfully.', 'success');
      load();
    } catch (e) {
      toast('Failed to start rental.', 'error');
    }
  };

  const submitProcessReturn = async () => {
    try {
      await carService.processReturn(returnForm.orderId, returnForm);
      toast('Return processed successfully.', 'success');
      setReturnForm({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' });
      load();
    } catch (e) {
      toast('Failed to process return.', 'error');
    }
  };

  // Compute stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING_APPROVAL').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
    payPending: orders.filter(o => o.paymentStatus === 'PENDING_VERIFICATION' || o.paymentStatus === 'UNPAID').length,
  };

  const filteredOrders = orders.filter(o => {
    if (filter.status && o.status !== filter.status) return false;
    if (filter.paymentStatus === 'Pending' && !['PENDING_VERIFICATION', 'UNPAID'].includes(o.paymentStatus)) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!o.orderNumber?.toLowerCase().includes(q) && !o.customerName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={S.page}>
      <Toast toasts={toasts} remove={removeToast} />
      
      <div style={S.banner}>
        <div style={S.bannerLeft}>
          <Car size={26} color={C.sage} />
          <div>
            <h1 style={S.bannerTitle}>Car Rental Orders</h1>
            <p style={S.bannerSub}>Manage your vehicle fleet reservations seamlessly</p>
          </div>
        </div>
        <div>
          <button
            style={S.btnRefresh}
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw size={17} style={{ animation: spinning ? 'spin 0.6s linear' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={S.statsRow}>
        {[
          { label: 'TOTAL RENTALS',   val: stats.total,      accent: C.darkGreen, filterKey: null,            filterVal: '' },
          { label: 'PENDING APPROVAL',val: stats.pending,    accent: '#E65100',   filterKey: 'status',        filterVal: 'PENDING_APPROVAL' },
          { label: 'ACTIVE RENTALS',  val: stats.active,     accent: '#0288D1',   filterKey: 'status',        filterVal: 'ACTIVE' },
          { label: 'AWAITING PAYMENT',val: stats.payPending, accent: C.red,       filterKey: 'paymentStatus', filterVal: 'Pending' },
        ].map(s => {
          const isActive = s.filterKey
            ? filter[s.filterKey] === s.filterVal
            : (filter.status === '' && filter.paymentStatus === '');
          return (
            <div
              key={s.label}
              style={S.statCard(s.accent, isActive)}
              onClick={() => {
                if (s.filterKey) {
                  setFilter({ status: '', paymentStatus: '', search: '', [s.filterKey]: s.filterVal });
                } else {
                  setFilter({ status: '', paymentStatus: '', search: '' });
                }
              }}
            >
              <div style={S.statNum(s.accent)}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div style={S.filterBar}>
        <div style={S.searchWrap}>
          <Search size={15} color={C.earthBrown} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search Order # or Customer..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            style={S.searchInput}
          />
        </div>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={S.select}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.empty}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={S.empty}>
            <Car size={40} style={S.emptyIcon} />
            <div style={S.emptyText}>No Car Rental Orders Found</div>
            <div style={S.emptySubText}>Try adjusting your filters or search query.</div>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Order #</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Vehicle</th>
                <th style={S.th}>Dates</th>
                <th style={S.th}>Amount</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td style={{ ...S.td, fontWeight: 700, color: C.darkGreen }}>{o.orderNumber}</td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: '#757575' }}>{o.customerPhone}</div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{o.carName || 'Unknown Vehicle'}</div>
                      <div style={{ fontSize: 11, color: '#757575' }}>{o.totalDays} Days</div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{new Date(o.pickupDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: '#757575' }}>To: {new Date(o.returnDate).toLocaleDateString()}</div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: C.darkGreen }}>ETB {Number(o.totalAmount).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#757575' }}>{o.paymentStatus}</div>
                    </td>
                    <td style={S.td}>
                      <div style={S.badge(STATUS_COLORS[o.status] || '#9E9E9E')}>
                        {STATUS_LABELS[o.status] || o.status}
                      </div>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {o.status === 'PENDING_APPROVAL' && actionPrompt.orderId !== o.id && (
                          <>
                            <button onClick={() => setActionPrompt({ orderId: o.id, action: 'APPROVED', note: '' })} style={S.btnAction}><CheckCircle2 size={13}/> Approve</button>
                            <button onClick={() => setActionPrompt({ orderId: o.id, action: 'REJECTED', note: '' })} style={{ ...S.btnAction, background: C.red }}><XCircle size={13}/> Reject</button>
                          </>
                        )}
                        {o.status === 'CONFIRMED' && (
                          <button onClick={() => handleStartRental(o.id)} style={{ ...S.btnAction, background: '#0288D1' }}>Start Rental</button>
                        )}
                        {o.status === 'ACTIVE' && returnForm.orderId !== o.id && (
                          <button onClick={() => setReturnForm({ orderId: o.id, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' })} style={{ ...S.btnAction, background: '#8E24AA' }}>Process Return</button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ACTION PROMPTS inline under the row */}
                  {actionPrompt.orderId === o.id && (
                    <tr>
                      <td colSpan="7" style={{ background: '#F3E5F5', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <strong style={{ fontSize: 13, color: '#4A148C' }}>{actionPrompt.action === 'APPROVED' ? 'Confirm Approval?' : 'Rejection Reason:'}</strong>
                          {actionPrompt.action === 'REJECTED' && (
                            <input 
                              type="text" value={actionPrompt.note} 
                              onChange={e => setActionPrompt({ ...actionPrompt, note: e.target.value })}
                              style={{ padding: '6px 10px', width: 250, border: '1px solid #CE93D8', borderRadius: 4 }}
                            />
                          )}
                          <button onClick={() => confirmAction(o.id, actionPrompt.action, actionPrompt.note)} style={{ ...S.btnAction, background: '#4A148C' }}>Submit</button>
                          <button onClick={() => setActionPrompt({ orderId: null, action: null, note: '' })} style={{ ...S.btnAction, background: 'transparent', color: '#4A148C', border: '1px solid #4A148C' }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {returnForm.orderId === o.id && (
                    <tr>
                      <td colSpan="7" style={{ background: '#F3E5F5', padding: '16px', borderBottom: `1px solid ${C.border}` }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#4A148C' }}>Process Car Return</h4>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <input type="number" placeholder="Damage Fee" value={returnForm.damageFee || ''} onChange={e => setReturnForm({...returnForm, damageFee: e.target.value})} style={{ padding: '6px 10px', width: 120, border: '1px solid #CE93D8', borderRadius: 4 }} />
                          <input type="number" placeholder="Fuel Fee" value={returnForm.fuelFee || ''} onChange={e => setReturnForm({...returnForm, fuelFee: e.target.value})} style={{ padding: '6px 10px', width: 120, border: '1px solid #CE93D8', borderRadius: 4 }} />
                          <input type="number" placeholder="Late Fee" value={returnForm.lateFee || ''} onChange={e => setReturnForm({...returnForm, lateFee: e.target.value})} style={{ padding: '6px 10px', width: 120, border: '1px solid #CE93D8', borderRadius: 4 }} />
                          <input type="number" placeholder="Odometer" value={returnForm.odometer || ''} onChange={e => setReturnForm({...returnForm, odometer: e.target.value})} style={{ padding: '6px 10px', width: 120, border: '1px solid #CE93D8', borderRadius: 4 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                           <input type="text" placeholder="Return Notes" value={returnForm.notes} onChange={e => setReturnForm({...returnForm, notes: e.target.value})} style={{ padding: '6px 10px', flex: 1, border: '1px solid #CE93D8', borderRadius: 4 }} />
                           <button onClick={submitProcessReturn} style={{ ...S.btnAction, background: '#4A148C' }}>Finalize Return</button>
                           <button onClick={() => setReturnForm({ orderId: null })} style={{ ...S.btnAction, background: 'transparent', color: '#4A148C', border: '1px solid #4A148C' }}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RentalOrdersManager;
