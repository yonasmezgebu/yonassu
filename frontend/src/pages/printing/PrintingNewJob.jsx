import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, UserPlus, Globe, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PRODUCT_TYPES = ['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt'];
const PAPER_TYPES = ['A4', 'A3', 'A5'];
const BINDING_TYPES = ['None', 'Spiral', 'Thermal'];
const PRIORITIES = ['Normal', 'Urgent', 'Rush'];

const PrintingNewJob = () => {
  const navigate = useNavigate();
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', productType: 'Book', paperType: 'A4',
    pagesPerCopy: 1, quantity: 1, colorPrinting: false, bindingType: 'None',
    priority: 'Normal', dueDate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiClient.get('/printing/orders', { params: { limit: 200 } });
      const raw = res.data?.orders || res.data || [];
      // Online orders start in 'received' status. Show ones still awaiting intake into production.
      setOnlineOrders(raw.filter(o => o.status_code === 'received'));
    } catch (err) {
      console.error('Failed to load online orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.customerName) { setError('Customer name is required for a manual order.'); return; }
    if (!form.dueDate) { setError('Due date is required.'); return; }
    setCreating(true);
    try {
      const res = await apiClient.post('/printing/orders', {
        productType: form.productType,
        quantity: parseInt(form.quantity, 10) || 1,
        paperType: form.paperType,
        pagesPerCopy: parseInt(form.pagesPerCopy, 10) || 1,
        colorPrinting: form.colorPrinting,
        bindingType: form.bindingType,
        dueDate: form.dueDate,
        priority: form.priority,
        specialInstructions: undefined,
        customer: { name: form.customerName, phone: form.customerPhone || '0900000000', customerTypeId: 1 }
      });
      setSuccess(`Order ${res.data?.orderNumber || ''} created and added to the queue.`);
      setForm(f => ({ ...f, customerName: '', customerPhone: '', quantity: 1, pagesPerCopy: 1, dueDate: '' }));
      await loadOrders();
    } catch (err) {
      setError(err?.message || 'Failed to create order.');
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (order) => {
    setError(''); setSuccess('');
    setAccepting(order.id);
    try {
      // Accepting an online order = advancing it into production (queue → design).
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: 'in_design' });
      setSuccess(`Order ${order.order_number} accepted into production.`);
      await loadOrders();
    } catch (err) {
      setError(err?.message || 'Failed to accept order.');
    } finally {
      setAccepting(null);
    }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="stg-root" style={{ margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
      <StageStyles />
      <StageNav current="new" showNew={false} />
      <div className="stg-head">
        <h1 className="stg-title">
          <FilePlus color="#2563EB" /> NEW JOB / ORDER INTAKE
        </h1>
        <p className="stg-sub">Enter manual (walk-in) orders or accept online orders — both enter the production pipeline.</p>
      </div>

      {error && <div className="stg-alert">{error}</div>}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', fontWeight: 500, fontSize: 13, margin: '0 0 16px' }}>{success}</div>
      )}

      <div className="stg-intake-grid">

        {/* ── Manual Order (Walk-in) ── */}
        <div className="stg-card">
          <div className="stg-card-head">
            <span className="stg-card-icon"><UserPlus color="#2563EB" size={18} /></span>
            <h3 className="stg-card-title">Manual Order (Walk-in)</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="stg-form-grid">
              <div className="stg-form-field">
                <label className="stg-label">Customer Name *</label>
                <input className="stg-input" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full Name or Department" />
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Phone</label>
                <input className="stg-input" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="09XXXXXXXX" />
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Product Type</label>
                <select className="stg-select" value={form.productType} onChange={e => set('productType', e.target.value)}>
                  {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Paper Size</label>
                <select className="stg-select" value={form.paperType} onChange={e => set('paperType', e.target.value)}>
                  {PAPER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Pages per Copy</label>
                <input type="number" min="1" className="stg-input" value={form.pagesPerCopy} onChange={e => set('pagesPerCopy', Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Quantity</label>
                <input type="number" min="1" className="stg-input" value={form.quantity} onChange={e => set('quantity', Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Binding</label>
                <select className="stg-select" value={form.bindingType} onChange={e => set('bindingType', e.target.value)}>
                  {BINDING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Priority</label>
                <select className="stg-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="stg-form-field">
                <label className="stg-label">Due Date *</label>
                <input type="date" className="stg-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} min={tomorrow.toISOString().split('T')[0]} />
              </div>
              <div className="stg-form-field">
                <label className="stg-label" style={{ visibility: 'hidden' }}>.</label>
                <label className="stg-check" style={{ height: 36 }}>
                  <input type="checkbox" checked={form.colorPrinting} onChange={e => set('colorPrinting', e.target.checked)} />
                  Color Printing
                </label>
              </div>
            </div>
            <div className="stg-actions-col" style={{ marginTop: 16 }}>
              <button type="submit" className="stg-btn stg-btn--primary stg-btn--block" disabled={creating}>
                <ArrowRight size={15} /> {creating ? 'Creating Order...' : 'Create Order → Queue'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Online Orders ── */}
        <div className="stg-card">
          <div className="stg-card-head">
            <span className="stg-card-icon"><Globe color="#0284C7" size={18} /></span>
            <h3 className="stg-card-title">Online Orders</h3>
            <button className="stg-btn stg-btn--ghost stg-btn--sm" style={{ marginLeft: 'auto' }} onClick={() => { setRefreshing(true); loadOrders().finally(() => setRefreshing(false)); }} disabled={refreshing}>
              <RefreshCw size={14} /> {refreshing ? '...' : 'Refresh'}
            </button>
          </div>
          {loadingOrders ? (
            <div className="stg-empty">Loading orders...</div>
          ) : onlineOrders.length === 0 ? (
            <div className="stg-empty">No pending online orders awaiting intake.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {onlineOrders.map(o => (
                <div key={o.id} className="stg-order-row">
                  <div className="stg-order-main">
                    <div className="stg-order-id">{o.order_number} · {o.customer_name || 'Online Customer'}</div>
                    <div className="stg-order-sub">
                      {o.product_type || '—'} · ETB {(parseFloat(o.total_price || 0)).toLocaleString()} · Due {o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <span className="stg-pill" style={{ background: '#E0F2FE', color: '#0284C7' }}>{o.payment_status === 'Confirmed' ? 'Paid' : 'Pending Payment'}</span>
                  <button
                    type="button"
                    onClick={() => handleAccept(o)}
                    disabled={accepting === o.id || o.payment_status !== 'Confirmed'}
                    className="stg-btn stg-btn--soft-blue stg-btn--sm"
                  >
                    <CheckCircle size={14} /> {accepting === o.id ? 'Accepting...' : 'Accept → Production'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PrintingNewJob;