import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, ListOrdered, Pencil, FileCheck, Printer, Scissors,
  PackageCheck, Archive, RefreshCw, ChevronRight, AlertCircle,
  Clock, User, Phone, Calendar, Layers, CheckCircle2, XCircle,
  ArrowRight, Loader2, FileText, DollarSign, Eye, X
} from 'lucide-react';
import axios from 'axios';

// ─── Green Palette ────────────────────────────────────────────────
const G = {
  forest:   '#228B22',
  dark:     '#1B5E20',
  emerald:  '#2E8B57',
  leaf:     '#4CAF50',
  sage:     '#A5D6A7',
  olive:    '#6B8E23',
  mint:     '#98FF98',
  lime:     '#8BC34A',
  brown:    '#8D6E63',
  sky:      '#87CEEB',
  white:    '#FFFFFF',
  lightGray:'#F5F5F5',
  darkGray: '#424242',
  orange:   '#FF9800',
  red:      '#F44336',
};

// ─── Status Config ────────────────────────────────────────────────
const STATUS_STEPS = [
  { code: 'received',    label: 'Received',          color: G.sky,    icon: FileText },
  { code: 'in_queue',    label: 'Job Queue',          color: G.lime,   icon: ListOrdered },
  { code: 'in_design',   label: 'In Design',          color: G.olive,  icon: Pencil },
  { code: 'file_check',  label: 'File Check',         color: G.orange, icon: FileCheck },
  { code: 'in_printing', label: 'In Printing',        color: G.emerald,icon: Printer },
  { code: 'finishing',   label: 'Finishing',          color: G.forest, icon: Scissors },
  { code: 'ready',       label: 'Ready for Delivery', color: G.leaf,   icon: PackageCheck },
  { code: 'delivered',   label: 'Delivered',          color: G.dark,   icon: CheckCircle2 },
];

const NEXT_STATUS = {
  received:    'in_queue',
  in_queue:    'in_design',
  in_design:   'file_check',
  file_check:  'in_printing',
  in_printing: 'finishing',
  finishing:   'ready',
  ready:       'delivered',
};

const API = '/api/v1/printing';

const api = axios.create({ baseURL: '' });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${G.lightGray} 0%, #E8F5E9 100%)`,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: '24px',
  },
  // Top buttons row
  newJobBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 32px',
    background: `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
    boxShadow: `0 8px 24px rgba(34,139,34,0.4), 0 2px 8px rgba(0,0,0,0.15)`,
    transform: 'translateY(0)',
    transition: 'all 0.2s ease',
  },
  queueBtn: (active, color) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, flex: 1, minWidth: 0,
    padding: '12px 8px',
    background: active
      ? `linear-gradient(135deg, ${color}, ${color}dd)`
      : `linear-gradient(135deg, #fff, #f9f9f9)`,
    color: active ? '#fff' : G.darkGray,
    border: `2px solid ${active ? color : '#ddd'}`,
    borderRadius: 12, cursor: 'pointer',
    fontSize: 12, fontWeight: 700,
    boxShadow: active
      ? `0 6px 20px ${color}55, 0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)`
      : '0 2px 8px rgba(0,0,0,0.08)',
    transform: active ? 'translateY(-2px)' : 'none',
    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    letterSpacing: 0.3,
    textAlign: 'center',
  }),
  card: {
    background: '#fff',
    borderRadius: 16,
    border: `1px solid ${G.sage}44`,
    boxShadow: '0 4px 24px rgba(34,139,34,0.08), 0 1px 4px rgba(0,0,0,0.05)',
    padding: 24, marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15, fontWeight: 700, color: G.dark,
    margin: '0 0 16px',
    paddingBottom: 12, borderBottom: `2px solid ${G.sage}66`,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: G.dark, marginBottom: 5, letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%', padding: '10px 14px',
    border: `1.5px solid ${G.sage}`,
    borderRadius: 8, fontSize: 14, color: G.darkGray,
    background: G.lightGray,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    width: '100%', padding: '10px 14px',
    border: `1.5px solid ${G.sage}`,
    borderRadius: 8, fontSize: 14, color: G.darkGray,
    background: G.lightGray,
    outline: 'none', cursor: 'pointer',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  actionBtn: (color, light = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 20px',
    background: light ? `${color}18` : `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: light ? color : '#fff',
    border: `1.5px solid ${color}`,
    borderRadius: 10, cursor: 'pointer', fontWeight: 700,
    fontSize: 13, transition: 'all 0.2s',
    boxShadow: light ? 'none' : `0 4px 12px ${color}44`,
  }),
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: `${color}22`, color: color,
    border: `1px solid ${color}44`,
  }),
  orderRow: {
    display: 'grid',
    gridTemplateColumns: '100px 1.5fr 90px 60px 80px 130px 100px 100px 140px',
    alignItems: 'center', gap: 10,
    padding: '12px 16px',
    borderBottom: `1px solid ${G.sage}33`,
    fontSize: 13, color: G.darkGray,
    transition: 'background 0.2s',
  },
  thead: {
    display: 'grid',
    gridTemplateColumns: '100px 1.5fr 90px 60px 80px 130px 100px 100px 140px',
    alignItems: 'center', gap: 10,
    padding: '10px 16px',
    fontSize: 11, fontWeight: 700, color: G.dark,
    textTransform: 'uppercase', letterSpacing: 0.5,
    background: `${G.sage}33`,
    borderRadius: '10px 10px 0 0',
  },
};

// ─── Sub-Components ───────────────────────────────────────────────

function OrdersTable({ orders, currentStatusCode, onMoveNext, moving }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const nextCode = NEXT_STATUS[currentStatusCode];
  const nextStep = STATUS_STEPS.find(s => s.code === nextCode);
  const daysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    return diff;
  };

  if (!orders.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: G.emerald }}>
        <CheckCircle2 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>No orders in this stage</p>
        <p style={{ fontSize: 13, color: '#aaa', margin: '4px 0 0' }}>Great job keeping up!</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={styles.thead}>
        <span>Order #</span><span>Customer</span><span>Type</span>
        <span>Qty</span><span>Paper</span><span>Payment</span><span>Due Date</span>
        <span>Days Left</span><span>Action</span>
      </div>
      {orders.map(o => {
        const days = daysRemaining(o.due_date);
        const isOverdue = days !== null && days < 0;
        const isUrgent = days !== null && days <= 1 && days >= 0;
        return (
          <div key={o.id || o.order_number} style={{ ...styles.orderRow, background: isOverdue ? '#fff5f5' : '#fff' }}>
            <span style={{ fontWeight: 700, color: G.forest, fontSize: 12 }}>{o.order_number}</span>
            <div>
              <div style={{ fontWeight: 600, color: G.darkGray }}>{o.customer_name || o.customerName}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{o.customer_phone || o.customerPhone}</div>
            </div>
            <span style={{ fontSize: 12 }}>{o.product_type || o.jobType}</span>
            <span style={{ fontWeight: 700, color: G.emerald }}>{o.quantity}</span>
            <span style={{ fontSize: 12 }}>{o.paper_type || o.paperType}</span>
            <span>
              <span style={{
                padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: o.payment_status === 'Confirmed' ? '#dcfce7' : o.payment_status === 'Rejected' ? '#fee2e2' : '#ffedd5',
                color: o.payment_status === 'Confirmed' ? '#16a34a' : o.payment_status === 'Rejected' ? '#ef4444' : '#ea580c',
                border: `1px solid ${o.payment_status === 'Confirmed' ? '#86efac' : o.payment_status === 'Rejected' ? '#fca5a5' : '#fdba74'}`
              }}>
                {o.payment_status === 'Confirmed' ? '✅ Confirmed' : o.payment_status === 'Rejected' ? '❌ Rejected' : '⏳ Pending'}
              </span>
            </span>
            <span style={{ fontSize: 12 }}>{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</span>
            <span style={{
              fontWeight: 700,
              color: isOverdue ? G.red : isUrgent ? G.orange : G.forest
            }}>
              {days === null ? '—' : isOverdue ? `${Math.abs(days)}d overdue` : `${days}d`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedOrder(o)}
                style={{
                  background: `${G.sage}33`, color: G.dark, border: `1px solid ${G.sage}`,
                  borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 11
                }}
              >
                <Eye size={14} /> Details
              </button>
              {nextStep && (
                <button
                  onClick={() => {
                    if (nextCode === 'in_printing' && o.payment_status !== 'Confirmed') {
                      alert('Payment must be confirmed by Finance before advancing this job to PRINTING.');
                      return;
                    }
                    if (o.payment_status === 'Rejected') {
                      alert('Payment was rejected. Please resolve with the customer.');
                      return;
                    }
                    onMoveNext(o.id || o.order_number, nextCode);
                  }}
                  disabled={moving === (o.id || o.order_number) || (nextCode === 'in_printing' && o.payment_status !== 'Confirmed') || o.payment_status === 'Rejected'}
                  style={{
                    ...styles.actionBtn(nextStep.color),
                    padding: '6px 12px', fontSize: 11,
                    opacity: moving === (o.id || o.order_number) || (nextCode === 'in_printing' && o.payment_status !== 'Confirmed') || o.payment_status === 'Rejected' ? 0.6 : 1,
                    cursor: moving === (o.id || o.order_number) || (nextCode === 'in_printing' && o.payment_status !== 'Confirmed') || o.payment_status === 'Rejected' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {moving === (o.id || o.order_number)
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : ((nextCode === 'in_printing' && o.payment_status !== 'Confirmed') || o.payment_status === 'Rejected' ? <AlertCircle size={12} /> : <ArrowRight size={12} />)
                  }
                  {nextCode === 'in_printing' && o.payment_status !== 'Confirmed' ? 'Wait for Pay' : nextStep.label}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 700,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden',
            animation: 'slideIn 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${G.dark}, ${G.forest})`,
              padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: '#fff'
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Order Details</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{selectedOrder.order_number}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', background: G.lightGray }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Customer Name</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.customer_name || selectedOrder.customerName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Customer Phone</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.customer_phone || selectedOrder.customerPhone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Product Type</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.product_type || selectedOrder.jobType || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Quantity</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.emerald }}>{selectedOrder.quantity?.toLocaleString() || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Paper & Pages</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.paper_type || selectedOrder.paperType} • {selectedOrder.pages_per_copy} pgs</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Color & Binding</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.color_printing ? 'Color' : 'B&W'} • {selectedOrder.binding_type || 'None'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Total Price</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.dark }}>ETB {parseFloat(selectedOrder.total_price || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Payment Status</div>
                <div style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: selectedOrder.payment_status === 'Confirmed' ? '#dcfce7' : selectedOrder.payment_status === 'Rejected' ? '#fee2e2' : '#ffedd5',
                  color: selectedOrder.payment_status === 'Confirmed' ? '#16a34a' : selectedOrder.payment_status === 'Rejected' ? '#ef4444' : '#ea580c',
                  border: `1px solid ${selectedOrder.payment_status === 'Confirmed' ? '#86efac' : selectedOrder.payment_status === 'Rejected' ? '#fca5a5' : '#fdba74'}`
                }}>
                  {selectedOrder.payment_status === 'Confirmed' ? '✅ Confirmed' : selectedOrder.payment_status === 'Rejected' ? '❌ Rejected' : '⏳ Pending'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: G.olive, textTransform: 'uppercase', marginBottom: 4 }}>Due Date</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.darkGray }}>{selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString() : '—'}</div>
              </div>
              
              {/* Full width notes */}
              {(selectedOrder.special_instructions || selectedOrder.notes) && (
                <div style={{ gridColumn: '1 / -1', background: '#fff', border: `1px solid ${G.sage}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: G.forest, textTransform: 'uppercase', marginBottom: 6 }}>Special Instructions</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: G.darkGray, lineHeight: 1.5 }}>{selectedOrder.special_instructions || selectedOrder.notes}</div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: 20, background: '#fff', borderTop: `1px solid ${G.sage}44`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} style={{ background: G.dark, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewJobForm({ onSuccess }) {
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerTypeId: '1',
    productType: 'Book', quantity: '', paperType: 'A4',
    pagesPerCopy: '1', colorPrinting: false, bindingType: 'None',
    dueDate: '', specialInstructions: '', totalCost: '', depositPaid: '',
    priority: 'Normal',
    paymentMethod: 'Telebirr', paymentReference: '',
    // Manual extras
    jobType: 'Book', paperSize: 'A4', color: 'Full Color',
    finishingOptions: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const check = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.checked }));

  const toggleFinishing = (opt) => {
    setForm(p => ({
      ...p,
      finishingOptions: p.finishingOptions.includes(opt)
        ? p.finishingOptions.filter(x => x !== opt)
        : [...p.finishingOptions, opt]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        customer: {
          name: form.customerName,
          phone: form.customerPhone,
          customerTypeId: parseInt(form.customerTypeId) || 1,
        },
        productType: form.productType,
        quantity: parseInt(form.quantity),
        paperType: form.paperType,
        pagesPerCopy: parseInt(form.pagesPerCopy) || 1,
        colorPrinting: form.colorPrinting,
        bindingType: form.bindingType,
        dueDate: form.dueDate,
        specialInstructions: form.specialInstructions,
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference
      };
      const { data } = await api.post(`${API}/orders`, payload);
      onSuccess(data.data.orderNumber);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { ...styles.input };

  return (
    <form onSubmit={handleSubmit}>
      <style>{`
        input:focus, select:focus, textarea:focus {
          border-color: ${G.emerald} !important;
          box-shadow: 0 0 0 3px ${G.emerald}22 !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .job-form { animation: slideIn 0.3s ease; }
        @keyframes pulse3d {
          0%,100% { box-shadow: 0 8px 24px rgba(34,139,34,0.4); transform: translateY(0); }
          50% { box-shadow: 0 12px 32px rgba(34,139,34,0.55); transform: translateY(-2px); }
        }
        .new-job-pulse:hover { animation: pulse3d 1.5s ease infinite; }
      `}</style>

      <div className="job-form">
        {error && (
          <div style={{ background: '#fff5f5', border: `1px solid ${G.red}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, color: G.red, fontSize: 14 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        {/* Customer & Job */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><User size={16} color={G.emerald} /> Customer & Job Details</h3>
          <div style={{ ...styles.grid3, marginBottom: 16 }}>
            <div>
              <label style={styles.label}>Customer Name *</label>
              <input style={inputStyle} value={form.customerName} onChange={set('customerName')} required placeholder="Full name" />
            </div>
            <div>
              <label style={styles.label}>Phone (09xxxxxxxx) *</label>
              <input style={inputStyle} value={form.customerPhone} onChange={set('customerPhone')} required placeholder="09xxxxxxxx" pattern="09[0-9]{8}" />
            </div>
            <div>
              <label style={styles.label}>Customer Type</label>
              <select style={styles.select} value={form.customerTypeId} onChange={set('customerTypeId')}>
                <option value="1">Individual</option>
                <option value="2">Staff</option>
                <option value="3">Department</option>
                <option value="4">External</option>
              </select>
            </div>
          </div>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Product Type *</label>
              <select style={styles.select} value={form.productType} onChange={set('productType')}>
                {['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Priority</label>
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                {[{ l: 'Normal', c: G.emerald }, { l: 'Urgent', c: G.orange }, { l: 'Rush', c: G.red }].map(p => (
                  <label key={p.l} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: p.c, fontSize: 14 }}>
                    <input type="radio" name="priority" checked={form.priority === p.l} onChange={() => setForm(prev => ({ ...prev, priority: p.l }))} />
                    {p.l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><Layers size={16} color={G.emerald} /> Print Specifications</h3>
          <div style={{ ...styles.grid4, marginBottom: 16 }}>
            <div>
              <label style={styles.label}>Paper Type *</label>
              <select style={styles.select} value={form.paperType} onChange={set('paperType')}>
                {['A3', 'A4', 'A5'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Quantity *</label>
              <input style={inputStyle} type="number" value={form.quantity} onChange={set('quantity')} required min="1" placeholder="e.g. 100" />
            </div>
            <div>
              <label style={styles.label}>Pages / Copy</label>
              <input style={inputStyle} type="number" value={form.pagesPerCopy} onChange={set('pagesPerCopy')} min="1" />
            </div>
            <div>
              <label style={styles.label}>Binding</label>
              <select style={styles.select} value={form.bindingType} onChange={set('bindingType')}>
                {['None', 'Spiral', 'Thermal'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.colorPrinting}
                onChange={check('colorPrinting')}
                style={{ width: 18, height: 18, accentColor: G.emerald }}
              />
              <span style={{ fontWeight: 600, color: G.darkGray, fontSize: 14 }}>Color Printing (2× price multiplier)</span>
            </label>
          </div>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Finishing Options</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {['Cutting', 'Folding', 'Laminating', 'Packaging', 'Stapling'].map(opt => (
                  <label key={opt} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                    background: form.finishingOptions.includes(opt) ? `${G.leaf}22` : '#f5f5f5',
                    border: `1px solid ${form.finishingOptions.includes(opt) ? G.leaf : '#ddd'}`,
                    color: form.finishingOptions.includes(opt) ? G.dark : G.darkGray,
                    fontWeight: form.finishingOptions.includes(opt) ? 700 : 400,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={form.finishingOptions.includes(opt)} onChange={() => toggleFinishing(opt)} style={{ margin: 0, accentColor: G.leaf }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={styles.label}>Special Instructions</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={form.specialInstructions} onChange={set('specialInstructions')} rows={2} placeholder="Any extra notes..." />
            </div>
          </div>
        </div>

        {/* Due Date & Financials */}
        <div style={styles.grid2}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><Calendar size={16} color={G.emerald} /> Deadline</h3>
            <div>
              <label style={styles.label}>Required By Date *</label>
              <input style={inputStyle} type="date" value={form.dueDate} onChange={set('dueDate')} required min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><DollarSign size={16} color={G.emerald} /> Financial Reference</h3>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>Total Cost (ETB)</label>
                <input style={inputStyle} type="number" value={form.totalCost} onChange={set('totalCost')} placeholder="Auto-calculated" />
              </div>
              <div>
                <label style={styles.label}>Deposit Paid</label>
                <input style={inputStyle} type="number" value={form.depositPaid} onChange={set('depositPaid')} placeholder="0" />
              </div>
            </div>
            {(form.totalCost || form.depositPaid) && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: `${G.leaf}18`, border: `1px solid ${G.leaf}44`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: G.dark }}>Balance Due:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: G.forest }}>
                  ETB {Math.max(0, (parseFloat(form.totalCost) || 0) - (parseFloat(form.depositPaid) || 0)).toLocaleString()}
                </span>
              </div>
            )}
            <div style={{ marginTop: 16, borderTop: `1px dashed ${G.sage}`, paddingTop: 16 }}>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Payment Method</label>
                  <select style={styles.select} value={form.paymentMethod} onChange={set('paymentMethod')}>
                    <option value="Telebirr">Telebirr</option>
                    <option value="CBE Bank">CBE Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Ref / Receipt No</label>
                  <input style={inputStyle} value={form.paymentReference} onChange={set('paymentReference')} placeholder="Transaction ID" />
                </div>
              </div>
              <div style={{ fontSize: 11, color: G.orange, marginTop: 8, fontWeight: 600 }}>
                ⚠️ Job will wait in queue until Finance confirms payment.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
          <button type="button" onClick={() => setForm(f => ({ ...f, customerName: '', customerPhone: '', quantity: '', dueDate: '', specialInstructions: '' }))}
            style={{ ...styles.actionBtn(G.olive, true), padding: '12px 24px' }}>
            Clear Form
          </button>
          <button type="submit" disabled={saving}
            style={{ ...styles.actionBtn(G.forest), padding: '12px 32px', fontSize: 15, opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <PlusCircle size={16} />}
            {saving ? 'Creating...' : 'Create Job & Send to Queue'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────
const PrintingNewJob = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [counts, setCounts] = useState({});

  const tabButtons = [
    { id: 'new',        label: 'New Job',           icon: PlusCircle,   color: G.forest   },
    { id: 'in_queue',   label: 'Job Queue',          icon: ListOrdered,  color: G.lime     },
    { id: 'in_design',  label: 'In Design',          icon: Pencil,       color: G.olive    },
    { id: 'file_check', label: 'File Check',         icon: FileCheck,    color: G.orange   },
    { id: 'in_printing',label: 'In Printing',        icon: Printer,      color: G.emerald  },
    { id: 'finishing',  label: 'Finishing',          icon: Scissors,     color: G.forest   },
    { id: 'ready',      label: 'Ready for Delivery', icon: PackageCheck, color: G.leaf     },
  ];

  const fetchOrders = useCallback(async (statusCode) => {
    if (statusCode === 'new') return;
    setLoading(true);
    try {
      const { data } = await api.get(`${API}/orders`, { params: { status: statusCode, limit: 100 } });
      setOrders(data.data?.orders || []);
      // Update counts
      const newCounts = { ...counts };
      newCounts[statusCode] = data.data?.orders?.length || 0;
      setCounts(newCounts);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);

  // Pre-fetch all counts on mount
  useEffect(() => {
    const fetchAllCounts = async () => {
      const statusCodes = ['in_queue', 'in_design', 'file_check', 'in_printing', 'finishing', 'ready'];
      const results = await Promise.allSettled(
        statusCodes.map(code => api.get(`${API}/orders`, { params: { status: code, limit: 1 } }))
      );
      const newCounts = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          newCounts[statusCodes[i]] = r.value.data?.data?.pagination?.total || 0;
        }
      });
      setCounts(newCounts);
    };
    fetchAllCounts();
  }, []);

  const handleMoveNext = async (orderId, nextStatusCode) => {
    setMoving(orderId);
    try {
      await api.put(`${API}/orders/${orderId}/status`, { status: nextStatusCode });
      // Optimistically remove from current list
      setOrders(prev => prev.filter(o => (o.id || o.order_number) !== orderId));
      // Update counts
      setCounts(prev => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 1) - 1),
        [nextStatusCode]: (prev[nextStatusCode] || 0) + 1,
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setMoving(null);
    }
  };

  const handleNewJobSuccess = (orderNumber) => {
    setSuccessMsg(`✅ Order ${orderNumber} created and sent to Job Queue!`);
    setActiveTab('in_queue');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const currentStatusStep = STATUS_STEPS.find(s => s.code === activeTab);
  const isNewTab = activeTab === 'new';

  // Split buttons: New Job separate, then 3 top + 3 bottom
  const queueTabs = tabButtons.filter(t => t.id !== 'new');
  const topRow = queueTabs.slice(0, 3);
  const bottomRow = queueTabs.slice(3, 6);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide { from { opacity:0;transform:translateY(-8px); } to { opacity:1;transform:translateY(0); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        .tab-btn:hover { filter: brightness(1.05); transform: translateY(-3px) !important; }
        .move-btn:hover { transform: scale(1.05); }
        .order-row:hover { background: ${G.sage}18 !important; }
        .btn-3d-refresh {
          background: linear-gradient(135deg, #2E8B57, #228B22);
          border: none;
          border-radius: 12px;
          padding: 10px 24px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 6px 0 #1B5E20, 0 10px 20px rgba(34,139,34,0.4);
          transition: all 0.1s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .btn-3d-refresh:active {
          transform: translateY(6px);
          box-shadow: 0 0 0 #1B5E20, 0 4px 10px rgba(34,139,34,0.4);
        }
        .btn-3d-refresh:hover {
          filter: brightness(1.1);
        }
      `}</style>

      {/* ── Success Banner ────────────────────── */}
      {successMsg && (
        <div style={{
          background: `linear-gradient(135deg, ${G.leaf}, ${G.emerald})`,
          color: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 4px 16px ${G.leaf}55`,
          animation: 'fadeSlide 0.4s ease',
        }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* ── Header ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: G.dark, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${G.forest}44`,
            }}>
              <Printer size={22} color="#fff" />
            </div>
            Job Processing Center
          </h1>
          <p style={{ margin: '4px 0 0 56px', color: G.olive, fontSize: 14 }}>
            Manage the complete printing workflow from intake to delivery
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => fetchOrders(activeTab)} className="btn-3d-refresh">
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
          <button onClick={() => navigate('/printing-manager/jobs/history')} style={{ ...styles.actionBtn(G.dark, true), padding: '10px 16px' }}>
            <Archive size={15} /> Job History
          </button>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        {/* New Job — separate prominent button */}
        <div style={{ marginBottom: 14 }}>
          <button
            className="new-job-pulse"
            onClick={() => setActiveTab('new')}
            style={{
              ...styles.newJobBtn,
              background: activeTab === 'new'
                ? `linear-gradient(135deg, ${G.dark}, ${G.forest})`
                : `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
              boxShadow: activeTab === 'new'
                ? `0 0 0 3px ${G.leaf}66, 0 8px 24px rgba(34,139,34,0.4)`
                : `0 8px 24px rgba(34,139,34,0.4)`,
            }}
          >
            <PlusCircle size={20} />
            NEW JOB
          </button>
        </div>

        {/* 3-Top queue buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
          {topRow.map(tab => {
            const Icon = tab.icon;
            const count = counts[tab.id];
            return (
              <button key={tab.id} className="tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={styles.queueBtn(activeTab === tab.id, tab.color)}
              >
                <Icon size={18} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{tab.label}</span>
                {count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : `${tab.color}22`,
                    color: activeTab === tab.id ? '#fff' : tab.color,
                    borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 800,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Bottom queue buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {bottomRow.map(tab => {
            const Icon = tab.icon;
            const count = counts[tab.id];
            return (
              <button key={tab.id} className="tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={styles.queueBtn(activeTab === tab.id, tab.color)}
              >
                <Icon size={18} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{tab.label}</span>
                {count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : `${tab.color}22`,
                    color: activeTab === tab.id ? '#fff' : tab.color,
                    borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 800,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stage Progress Bar ─────────────────── */}
      {!isNewTab && (
        <div style={{ ...styles.card, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            {STATUS_STEPS.filter(s => s.code !== 'delivered').map((step, idx) => {
              const stepDone = tabButtons.findIndex(t => t.id === activeTab) > tabButtons.findIndex(t => t.id === step.code) + 1;
              const stepActive = step.code === activeTab;
              const Icon = step.icon;
              return (
                <React.Fragment key={step.code}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minWidth: 80, flex: 1,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: stepActive
                        ? `linear-gradient(135deg, ${step.color}, ${step.color}bb)`
                        : stepDone ? `${G.sage}` : '#eee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: stepActive ? `3px solid ${step.color}` : `2px solid ${stepDone ? G.sage : '#ddd'}`,
                      boxShadow: stepActive ? `0 4px 12px ${step.color}55` : 'none',
                      transition: 'all 0.3s',
                    }}>
                      <Icon size={16} color={stepActive ? '#fff' : stepDone ? G.emerald : '#ccc'} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: stepActive ? 700 : 500, color: stepActive ? step.color : '#aaa', textAlign: 'center', lineHeight: 1.2 }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.filter(s => s.code !== 'delivered').length - 1 && (
                    <div style={{ height: 2, flex: 1, background: stepDone ? G.leaf : '#eee', transition: 'background 0.3s', marginBottom: 20 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content Area ───────────────────────── */}
      <div style={styles.card}>
        {isNewTab ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${G.forest}44`,
              }}>
                <PlusCircle size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: G.dark }}>New Manual Job Order</h2>
                <p style={{ margin: 0, fontSize: 13, color: G.olive }}>Walk-in customer or supervisor-created order · Auto-assigned to Job Queue</p>
              </div>
            </div>
            <NewJobForm onSuccess={handleNewJobSuccess} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${currentStatusStep?.color}, ${currentStatusStep?.color}bb)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${currentStatusStep?.color}55`,
                }}>
                  {currentStatusStep && React.createElement(currentStatusStep.icon, { size: 20, color: '#fff' })}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: G.dark }}>
                    {tabButtons.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: G.olive }}>
                    {orders.length} order{orders.length !== 1 ? 's' : ''} · Click "Move to Next Stage" to advance
                  </p>
                </div>
              </div>
              <span style={styles.badge(currentStatusStep?.color || G.emerald)}>
                {orders.length} Active
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Loader2 size={36} color={G.emerald} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ color: G.olive, fontWeight: 600 }}>Loading orders...</p>
              </div>
            ) : (
              <OrdersTable
                orders={orders}
                currentStatusCode={activeTab}
                onMoveNext={handleMoveNext}
                moving={moving}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrintingNewJob;
