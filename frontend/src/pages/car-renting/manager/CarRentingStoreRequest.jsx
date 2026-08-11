import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Package, ShoppingCart, Plus, Minus, Search, RefreshCw,
  CheckCircle, XCircle, Clock, Truck, Eye, AlertCircle,
  ChevronDown, ChevronUp, Layers, X, Send, Edit2, Lock,
} from 'lucide-react';
import SegmentedSpinner from '../../../components/ui/SegmentedSpinner';
import './CarRentingStoreRequest.css';

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  forest:   '#228B22', dark:     '#1B5E20', emerald:  '#2E8B57',
  leaf:     '#4CAF50', sage:     '#A5D6A7', olive:    '#6B8E23',
  lime:     '#8BC34A', brown:    '#8D6E63', sky:      '#87CEEB',
  white:    '#FFFFFF', light:    '#F5F5F5', darkGray: '#424242',
  orange:   '#FF9800', red:      '#F44336', midGray:  '#E0E0E0',
  textSec:  '#757575', sageLight:'#E8F5E9',
};

/* ─── Axios instance ───────────────────────────────────────────────────────── */
const api = axios.create({ baseURL: '' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Statuses that block a new request ─────────────────────────────────────── */
// A request is "active" (blocking) if it's in one of these states
const BLOCKING_STATUSES = ['FORWARDED_TO_CEO', 'PENDING_STORE', 'APPROVED', 'SHIPPED'];
// A request can still be edited (items updated) only if in this state
const EDITABLE_STATUSES = ['FORWARDED_TO_CEO'];

/* ─── Status config ────────────────────────────────────────────────────────── */
const STATUS = {
  FORWARDED_TO_CEO:{ label: 'Pending CEO',    color: C.sky,     bg: '#E3F2FD', icon: Clock },
  PENDING_STORE:   { label: 'Pending Store',  color: C.orange,  bg: '#FFF8E1', icon: Clock },
  APPROVED:        { label: 'Approved',       color: C.leaf,    bg: '#F1F8E9', icon: CheckCircle },
  REJECTED:        { label: 'Rejected',       color: C.red,     bg: '#FFEBEE', icon: XCircle },
  SHIPPED:         { label: 'Shipped',        color: C.emerald, bg: '#E8F5E9', icon: Truck },
  RECEIVED:        { label: 'Received',       color: C.forest,  bg: '#E8F5E9', icon: CheckCircle },
};

/* ─── 3D Button ────────────────────────────────────────────────────────────── */
const Btn = ({ children, onClick, color = C.emerald, textColor = '#fff', outline = false, small = false, disabled = false, fullWidth = false, icon: Icon }) => {
  const [pressed, setPressed] = useState(false);
  const bg = outline ? 'transparent' : color;
  const border = `2px solid ${color}`;
  const shadow = pressed || disabled ? 'none' : `3px 3px 0 ${outline ? color : C.dark}`;
  const transform = pressed || disabled ? 'translate(2px,2px)' : 'none';
  const txt = outline ? color : textColor;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: small ? '7px 16px' : '10px 22px',
        background: bg, color: txt, border, borderRadius: 0,
        fontWeight: 800, fontSize: small ? 12 : 14, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: shadow, transform, transition: 'transform 0.05s, box-shadow 0.05s',
        opacity: disabled ? 0.55 : 1, textTransform: 'uppercase', letterSpacing: 0.5,
        width: fullWidth ? '100%' : undefined, justifyContent: fullWidth ? 'center' : undefined,
        userSelect: 'none',
      }}
    >
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
};

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS[status] || { label: status, color: C.textSec, bg: C.light, icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}`,
      padding: '4px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
      borderRadius: 0,
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
};

/* ─── In-App Toast ─────────────────────────────────────────────────────────── */
let _toastId = 0;
const ToastContainer = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: t.type === 'success' ? C.dark : t.type === 'error' ? '#B71C1C' : C.olive,
        color: '#fff', padding: '14px 18px', borderLeft: `5px solid ${t.type === 'success' ? C.lime : t.type === 'error' ? C.red : C.orange}`,
        boxShadow: '4px 4px 0 rgba(0,0,0,0.3)', animation: 'slideUp 0.25s ease', borderRadius: 0,
      }}>
        {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.7 }}><X size={14} /></button>
      </div>
    ))}
    <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast: add, remove };
}

/* ─── Section Header ───────────────────────────────────────────────────────── */
const SectionHeader = ({ children, accent = C.forest, action }) => (
  <div style={{ borderLeft: `5px solid ${accent}`, paddingLeft: 12, marginBottom: 18, marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</span>
    {action}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                           MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CarRentingStoreRequest() {
  const { toasts, toast, remove } = useToast();

  /* — Products — */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [prodSearch, setProdSearch] = useState('');
  const [prodDeptFilter, setProdDeptFilter] = useState('All');
  const [prodCatFilter, setProdCatFilter] = useState('All');

  /* — Requests — */
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);

  /* — Inline detail expansion: { [requestId]: boolean } — */
  const [expandedRows, setExpandedRows] = useState({});
  const [rowDetails, setRowDetails] = useState({});    // { [requestId]: detail }
  const [rowDetailLoading, setRowDetailLoading] = useState({});

  /* — Cart (hidden until first item added) — */
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* — Edit mode: for updating a FORWARDED_TO_CEO request — */
  const [editingRequest, setEditingRequest] = useState(null); // the request being updated

  /* ─── Confirm receipt ─── */
  const [confirmModal, setConfirmModal] = useState(null);
  const confirmLoading = useRef(false);

  /* ─── Waiting Products (Blocks those specific products) ───────────────────────────── */
  const activeRequests = requests.filter(r => BLOCKING_STATUSES.includes(r.status));
  const waitingProductIds = new Set();
  activeRequests.forEach(r => {
    if (r.product_ids) {
      r.product_ids.split(',').forEach(id => waitingProductIds.add(parseInt(id, 10)));
    }
  });

  // If we are editing, items in the editing request shouldn't be blocked from being selected (though they already are in the cart)
  if (editingRequest && editingRequest.product_ids) {
    editingRequest.product_ids.split(',').forEach(id => waitingProductIds.delete(parseInt(id, 10)));
  }

  /* ─── Fetch products ─── */
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/api/v1/printing-assets/store/materials', { params: { department: 'Car Rental' } }),
        api.get('/api/v1/printing-assets/store/materials', { params: { department: 'AgriRent' } }),
      ]);
      const d1 = Array.isArray(r1.data?.data) ? r1.data.data : Array.isArray(r1.data) ? r1.data : [];
      const d2 = Array.isArray(r2.data?.data) ? r2.data.data : Array.isArray(r2.data) ? r2.data : [];
      setProducts([...d1, ...d2]);
    } catch {
      toast('Failed to load store products', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  /* ─── Fetch requests ─── */
  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const r = await api.get('/api/v1/car-renting/store-requests');
      const data = r.data?.data || r.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchRequests();
  }, [fetchProducts, fetchRequests]);

  /* ─── Filtered products ─── */
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    if (prodDeptFilter !== 'All' && p.department !== prodDeptFilter) return false;
    if (prodCatFilter !== 'All' && p.category !== prodCatFilter) return false;
    if (prodSearch && !p.material_name?.toLowerCase().includes(prodSearch.toLowerCase()) &&
        !p.material_id?.toLowerCase().includes(prodSearch.toLowerCase())) return false;
    return true;
  });

  /* ─── Cart helpers ─── */
  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.product.id === product.id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = { ...n[idx], qty: n[idx].qty + 1 };
        return n;
      }
      return [...prev, { product, qty: 1 }];
    });
    setCartVisible(true); // reveal cart on first add
    toast(`${product.material_name} added to cart`, 'success');
  };

  const updateCartQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty } : c));
  };
  const removeFromCart = (id) => {
    setCart(prev => {
      const next = prev.filter(c => c.product.id !== id);
      if (next.length === 0) setCartVisible(false);
      return next;
    });
  };
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  /* ─── Start editing an existing (FORWARDED_TO_CEO) request ─── */
  const startEdit = async (requestId) => {
    try {
      const res = await api.get(`/api/v1/car-renting/store-requests/${requestId}`);
      const data = res.data?.data || res.data;
      setEditingRequest(data);
      // Pre-fill cart with existing items
      const preCart = (data.items || []).map(it => ({
        product: {
          id: it.product_id,
          material_name: it.product_name,
          unit: it.unit || '',
          quantity_in_store: it.stock_quantity || 0,
          department: it.department || '',
        },
        qty: it.quantity_requested,
      }));
      setCart(preCart);
      setNotes(data.notes || '');
      setCartVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('Editing request — make your changes then re-submit.', 'info');
    } catch {
      toast('Failed to load request for editing', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setCart([]);
    setNotes('');
    setCartVisible(false);
  };

  /* ─── Submit / Update request ─── */
  const handleSubmit = async () => {
    if (!cart.length) { toast('Add at least one product to the request', 'error'); return; }

    setSubmitting(true);
    try {
      // Determine department from the first cart item's product department (defaults to 'Car Rental')
      const reqDepartment = cart[0]?.product?.department || 'Car Rental';

      const payload = {
        items: cart.map(c => ({
          product_id: c.product.id,
          quantity_requested: c.qty,
          product_name: c.product.material_name,
        })),
        notes,
        department: reqDepartment
      };

      if (editingRequest) {
        // Update existing request
        await api.put(`/api/v1/car-renting/store-requests/${editingRequest.id}`, payload);
        toast('Request updated successfully!', 'success');
      } else {
        // Create new
        await api.post('/api/v1/car-renting/store-requests', payload);
        toast('Request sent to CEO for approval!', 'success');
      }

      setCart([]);
      setNotes('');
      setCartVisible(false);
      setEditingRequest(null);
      fetchRequests();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Toggle inline row detail ─── */
  const toggleRowDetail = async (id) => {
    const isOpen = !!expandedRows[id];
    if (isOpen) {
      setExpandedRows(prev => ({ ...prev, [id]: false }));
      return;
    }
    setExpandedRows(prev => ({ ...prev, [id]: true }));
    if (!rowDetails[id]) {
      setRowDetailLoading(prev => ({ ...prev, [id]: true }));
      try {
        const res = await api.get(`/api/v1/car-renting/store-requests/${id}`);
        setRowDetails(prev => ({ ...prev, [id]: res.data?.data || res.data }));
      } catch {
        toast('Failed to load detail', 'error');
        setExpandedRows(prev => ({ ...prev, [id]: false }));
      } finally {
        setRowDetailLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  /* ─── Confirm receipt ─── */
  const confirmReceived = async (id) => {
    if (confirmLoading.current) return;
    confirmLoading.current = true;
    try {
      await api.patch(`/api/v1/car-renting/store-requests/${id}/status`, { status: 'RECEIVED' });
      toast('Receipt confirmed!', 'success');
      setConfirmModal(null);
      setExpandedRows({});
      setRowDetails({});
      fetchRequests();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to confirm receipt', 'error');
    } finally {
      confirmLoading.current = false;
    }
  };

  /* ─── Stats ─── */
  const stats = {
    total:       requests.length,
    pendingCeo:  requests.filter(r => r.status === 'FORWARDED_TO_CEO').length,
    pendingStore:requests.filter(r => r.status === 'PENDING_STORE').length,
    shipped:     requests.filter(r => r.status === 'SHIPPED').length,
    received:    requests.filter(r => r.status === 'RECEIVED').length,
  };

  /* ─── Render ─── */
  return (
    <div className="crq-page" style={{ minHeight: '100vh', background: C.light, fontFamily: '"Inter", system-ui, sans-serif', color: C.darkGray }}>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* ── Confirm Receipt Modal ── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, maxWidth: 420, width: '100%', padding: 32, borderTop: `5px solid ${C.forest}`, boxShadow: '6px 6px 0 rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase' }}>Confirm Receipt?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>
              Confirm that all items in this request have been physically received and accounted for?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn outline color={C.textSec} onClick={() => setConfirmModal(null)}>Cancel</Btn>
              <Btn color={C.forest} icon={CheckCircle} onClick={() => confirmReceived(confirmModal)}>Confirm Receipt</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ background: C.dark, color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, borderBottom: `4px solid ${C.forest}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: C.forest, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.5, textTransform: 'uppercase' }}>Store Product Requests</div>
            <div style={{ fontSize: 11, color: C.sage, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Car Rental &amp; AgriRent Department</div>
          </div>
        </div>
        <button onClick={() => { fetchProducts(); fetchRequests(); }} style={{ background: 'none', border: `1.5px solid ${C.sage}`, color: C.sage, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 0 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: '100%' }}>

        {/* ══ STATS ══ */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            { label: 'Total Requests', value: stats.total,        accent: C.emerald },
            { label: 'Pending CEO',    value: stats.pendingCeo,   accent: C.sky },
            { label: 'Pending Store',  value: stats.pendingStore, accent: C.orange },
            { label: 'Shipped',        value: stats.shipped,      accent: C.leaf },
            { label: 'Received',       value: stats.received,     accent: C.forest },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, border: `2px solid ${C.midGray}`, borderTop: `4px solid ${s.accent}`, padding: '16px 20px', flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.darkGray }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ══ EDIT MODE BANNER ══ */}
        {editingRequest && (
          <div style={{
            background: '#E8F5E9', border: `2px solid ${C.forest}`, borderLeft: `6px solid ${C.forest}`,
            padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Edit2 size={20} color={C.forest} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: C.darkGray, textTransform: 'uppercase' }}>Editing Request: {editingRequest.request_number}</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Modify the items below and click "Update Request" to save.</div>
              </div>
            </div>
            <Btn small outline color={C.red} onClick={cancelEdit}>Cancel Edit</Btn>
          </div>
        )}

        {/* ══ CART (hidden until items added) ══ */}
        {cartVisible && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ borderLeft: `5px solid ${C.emerald}`, paddingLeft: 12, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={18} color={C.emerald} />
                {editingRequest ? 'Update Cart' : 'Current Cart'} — {cartCount} item{cartCount !== 1 ? 's' : ''}
              </span>
              <button onClick={() => setCartVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSec, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                <ChevronUp size={16} /> Hide Cart
              </button>
            </div>

            <div style={{ background: C.white, border: `2px solid ${C.midGray}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.dark }}>
                    {['#', 'Product', 'Dept', 'Unit', 'Available', 'Qty Requested', 'Remove'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c, i) => (
                    <tr key={c.product.id} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                      <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 800 }}>{c.product.material_name}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: c.product.department === 'Car Rental' ? '#E3F2FD' : '#F1F8E9', color: c.product.department === 'Car Rental' ? '#1565C0' : C.forest, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                          {c.product.department || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: C.textSec }}>{c.product.unit || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 800, color: C.forest }}>{c.product.quantity_in_store ?? '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateCartQty(c.product.id, c.qty - 1)} style={{ background: C.midGray, border: 'none', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}><Minus size={12} /></button>
                          <input type="number" min="1" value={c.qty}
                            onChange={e => updateCartQty(c.product.id, parseInt(e.target.value) || 1)}
                            style={{ width: 60, textAlign: 'center', padding: '6px 4px', border: `2px solid ${C.sage}`, fontSize: 14, fontWeight: 900, outline: 'none', borderRadius: 0 }} />
                          <button onClick={() => updateCartQty(c.product.id, c.qty + 1)} style={{ background: C.forest, border: 'none', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0 }}><Plus size={12} color="#fff" /></button>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={() => removeFromCart(c.product.id)} style={{ background: '#FFEBEE', border: `1.5px solid ${C.red}`, color: C.red, padding: '5px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 11, borderRadius: 0 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: '18px 20px', borderTop: `2px solid ${C.midGray}`, background: '#F9FAFB' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.olive, textTransform: 'uppercase', marginBottom: 8 }}>Notes / Reason</div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Add notes or reason for this request (Optional)..."
                      style={{ width: '100%', padding: '10px 12px', border: `2px solid ${C.midGray}`, fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', resize: 'vertical', boxSizing: 'border-box', borderRadius: 0 }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Btn color={C.forest} icon={editingRequest ? Edit2 : Send} onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Saving...' : editingRequest ? 'Update Request' : 'Send to CEO for Approval'}
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Cart toggle button when cart has items but is hidden */}
        {!cartVisible && cart.length > 0 && (
          <button onClick={() => setCartVisible(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
            padding: '10px 20px', background: C.orange, border: 'none', color: '#fff',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `3px 3px 0 ${C.dark}`, borderRadius: 0,
          }}>
            <ShoppingCart size={16} /> Show Cart ({cartCount} items)
          </button>
        )}

        {/* ══ PRODUCTS TABLE ══ */}
        <SectionHeader accent={C.forest}>General Store — Available Products</SectionHeader>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.white, border: `2px solid ${C.midGray}`, padding: '8px 14px', flex: '1 1 240px' }}>
            <Search size={15} color={C.textSec} />
            <input value={prodSearch} onChange={e => setProdSearch(e.target.value)} placeholder="Search products..."
              style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', fontFamily: 'Inter,sans-serif' }} />
          </div>
          <select value={prodDeptFilter} onChange={e => setProdDeptFilter(e.target.value)} style={{ padding: '10px 14px', border: `2px solid ${C.midGray}`, fontSize: 13, background: C.white, fontWeight: 700, cursor: 'pointer', outline: 'none', borderRadius: 0 }}>
            <option value="All">All Departments</option>
            <option value="Car Rental">Car Rental</option>
            <option value="AgriRent">AgriRent</option>
          </select>
          <select value={prodCatFilter} onChange={e => setProdCatFilter(e.target.value)} style={{ padding: '10px 14px', border: `2px solid ${C.midGray}`, fontSize: 13, background: C.white, fontWeight: 700, cursor: 'pointer', outline: 'none', borderRadius: 0 }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: C.textSec, fontWeight: 700 }}>{filteredProducts.length} products</span>
        </div>

        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.textSec }}>
            <SegmentedSpinner size={28} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: C.white, border: `2px dashed ${C.midGray}`, marginBottom: 32 }}>
            <Package size={42} color={C.sage} />
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800 }}>No products found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: C.white, border: `2px solid ${C.midGray}`, marginBottom: 40 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  {['#', 'Product ID', 'Product Name', 'Category', 'Dept', 'Unit', 'In Stock', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => {
                  const lowStock = (p.quantity_in_store || 0) <= (p.reorder_level || 0);
                  const inCart = cart.some(c => c.product.id === p.id);
                  const isWaiting = waitingProductIds.has(p.id);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}
                      onMouseEnter={e => e.currentTarget.style.background = '#E8F5E9'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : C.sageLight}
                    >
                      <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, color: C.olive, fontWeight: 800 }}>{p.material_id || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 800 }}>{p.material_name}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: C.sageLight, border: `1px solid ${C.sage}`, color: C.olive, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>{p.category || '—'}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: p.department === 'Car Rental' ? '#E3F2FD' : '#F1F8E9', color: p.department === 'Car Rental' ? '#1565C0' : C.forest, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>{p.department || '—'}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: C.textSec }}>{p.unit || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontWeight: 900, color: lowStock ? C.red : C.forest, fontSize: 14 }}>
                          {p.quantity_in_store ?? 0}
                          {lowStock && <span style={{ marginLeft: 6, fontSize: 10, color: C.red, fontWeight: 800 }}>LOW</span>}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {isWaiting ? (
                          <span style={{ fontSize: 11, color: C.orange, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Waiting
                          </span>
                        ) : (p.quantity_in_store || 0) > 0 ? (
                          <Btn small color={inCart ? C.olive : C.emerald} icon={inCart ? CheckCircle : Plus} onClick={() => addToCart(p)}>
                            {inCart ? 'Added' : 'Add to Cart'}
                          </Btn>
                        ) : (
                          <span style={{ fontSize: 11, color: C.red, fontWeight: 800, textTransform: 'uppercase' }}>Out of Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ PAST REQUESTS ══ */}
        <SectionHeader accent={C.sky}>Past Store Requests</SectionHeader>
        {reqLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.textSec }}>
            <SegmentedSpinner size={28} />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: C.white, border: `2px dashed ${C.midGray}` }}>
            <Layers size={42} color={C.sage} />
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800 }}>No requests yet</div>
          </div>
        ) : (
          <div style={{ background: C.white, border: `2px solid ${C.midGray}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  {['#', 'Request #', 'Date', 'Items', 'Notes', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', color: '#fff', fontWeight: 800, fontSize: 11, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const isOpen = !!expandedRows[r.id];
                  const det = rowDetails[r.id];
                  const loading = !!rowDetailLoading[r.id];
                  const canEdit = EDITABLE_STATUSES.includes(r.status);
                  const canConfirm = r.status === 'SHIPPED';

                  return (
                    <React.Fragment key={r.id}>
                      {/* Main Row */}
                      <tr style={{ borderBottom: isOpen ? 'none' : `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 900, color: C.forest, fontFamily: 'monospace' }}>{r.request_number}</td>
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: C.sageLight, border: `1px solid ${C.sage}`, color: C.forest, padding: '3px 10px', fontWeight: 800, fontSize: 12 }}>
                            {r.item_count || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: C.textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.notes || '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {/* View more / less toggle */}
                            <button onClick={() => toggleRowDetail(r.id)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '6px 14px', background: 'none',
                              border: `1.5px solid ${isOpen ? C.forest : C.sky}`,
                              color: isOpen ? C.forest : C.sky,
                              fontWeight: 800, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0,
                            }}>
                              {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {isOpen ? 'View Less' : 'View More'}
                            </button>

                            {canEdit && !editingRequest && (
                              <Btn small color={C.olive} icon={Edit2} onClick={() => startEdit(r.id)}>Update</Btn>
                            )}
                            {canConfirm && (
                              <Btn small color={C.forest} icon={CheckCircle} onClick={() => setConfirmModal(r.id)}>Confirm</Btn>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline Detail Row */}
                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, borderBottom: `2px solid ${C.forest}` }}>
                            <div style={{ background: '#F0F7F0', borderLeft: `5px solid ${C.forest}`, padding: '18px 28px' }}>
                              {loading ? (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: C.textSec, fontSize: 13, fontWeight: 700 }}>
                                  <SegmentedSpinner size={18} />
                                  Loading details...
                                </div>
                              ) : det ? (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
                                    {[
                                      { label: 'Requested By', value: det.requester_name || '—' },
                                      { label: 'CEO Approved By', value: det.approver_name || '—' },
                                      { label: 'Store Handler', value: det.store_handler_name || '—' },
                                      ...(det.rejection_reason ? [{ label: 'Rejection Reason', value: det.rejection_reason, accent: C.red }] : []),
                                    ].map(f => (
                                      <div key={f.label} style={{ borderLeft: `3px solid ${f.accent || C.sage}`, paddingLeft: 10 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSec, textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: f.accent || C.darkGray }}>{f.value}</div>
                                      </div>
                                    ))}
                                  </div>

                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: C.white, border: `1.5px solid ${C.midGray}` }}>
                                      <thead>
                                        <tr style={{ background: C.dark }}>
                                          {['#', 'Product', 'Qty Requested', 'Qty Shipped', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '9px 12px', color: '#fff', fontWeight: 800, fontSize: 10, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(det.items || []).map((it, idx) => (
                                          <tr key={it.id || idx} style={{ borderBottom: `1px solid ${C.midGray}`, background: idx % 2 === 0 ? C.white : C.sageLight }}>
                                            <td style={{ padding: '9px 12px', color: C.textSec }}>{idx + 1}</td>
                                            <td style={{ padding: '9px 12px', fontWeight: 800 }}>{it.product_name || '—'}</td>
                                            <td style={{ padding: '9px 12px', fontWeight: 900, color: C.forest, fontSize: 14 }}>{it.quantity_requested}</td>
                                            <td style={{ padding: '9px 12px', fontWeight: 800, color: it.quantity_shipped ? C.emerald : C.textSec }}>{it.quantity_shipped ?? '—'}</td>
                                            <td style={{ padding: '9px 12px' }}>
                                              {it.quantity_shipped
                                                ? <span style={{ color: C.leaf, fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>✓ Shipped</span>
                                                : <span style={{ color: C.orange, fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>Pending</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {det.status === 'SHIPPED' && (
                                    <div style={{ marginTop: 14 }}>
                                      <Btn color={C.forest} icon={CheckCircle} onClick={() => setConfirmModal(det.id)}>
                                        Confirm Receipt of All Items
                                      </Btn>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
