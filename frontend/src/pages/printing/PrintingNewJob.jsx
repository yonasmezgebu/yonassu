import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, UserPlus, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { printingState, createJob, convertOrderToJob } from '../../utils/printingTransactionService';
import { playSound } from '../../utils/printingSound';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';

const PRODUCT_TYPES = ['Book', 'Module', 'Exam Paper', 'Brochure', 'Tax Receipt'];
const PAPER_TYPES = ['A4', 'A3', 'A5'];
const BINDING_TYPES = ['None', 'Spiral', 'Thermal'];
const PRIORITIES = ['Normal', 'Urgent', 'Rush'];

const PrintingNewJob = () => {
  const navigate = useNavigate();
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', productType: 'Book', paperType: 'A4',
    pagesPerCopy: 1, quantity: 1, colorPrinting: false, bindingType: 'None',
    priority: 'Normal', dueDate: ''
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState(null);

  useEffect(() => {
    setOnlineOrders(printingState.orders.filter(o => o.type === 'Online' && !o.jobId));
  }, []);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerName) { setError('Customer name is required for a manual order.'); return; }
    if (!form.dueDate) { setError('Due date is required.'); return; }
    setCreating(true);
    try {
      createJob({
        customerName: form.customerName,
        customerPhone: form.customerPhone || '-',
        jobType: `${form.productType} (${form.paperType})`,
        quantity: parseInt(form.quantity, 10) || 1,
        pagesCopies: parseInt(form.pagesPerCopy, 10) || 1,
        color: form.colorPrinting ? 'Full Color' : 'B&W',
        bindingType: form.bindingType,
        priority: form.priority,
        deadline: form.dueDate,
        totalCost: 0,
        depositPaid: 0
      });
      playSound('success');
      navigate('/printing-manager/jobs/queue');
    } catch (err) {
      setError(err.message || 'Failed to create job.');
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = (orderId) => {
    setError('');
    setConverting(orderId);
    try {
      convertOrderToJob(orderId);
      playSound('success');
      setOnlineOrders(printingState.orders.filter(o => o.type === 'Online' && !o.jobId));
      navigate('/printing-manager/jobs/queue');
    } catch (err) {
      setError(err.message || 'Failed to accept order.');
    } finally {
      setConverting(null);
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
        <p className="stg-sub">Enter manual (walk-in) orders or accept online orders — both enter the Job Process queue.</p>
      </div>

      {error && <div className="stg-alert">{error}</div>}

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
                <ArrowRight size={15} /> {creating ? 'Creating Job...' : 'Create Job → Queue'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Online Orders ── */}
        <div className="stg-card">
          <div className="stg-card-head">
            <span className="stg-card-icon"><Globe color="#0284C7" size={18} /></span>
            <h3 className="stg-card-title">Online Orders</h3>
          </div>
          {onlineOrders.length === 0 ? (
            <div className="stg-empty">No pending online orders. All accepted orders are already in the queue.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {onlineOrders.map(o => (
                <div key={o.id} className="stg-order-row">
                  <div className="stg-order-main">
                    <div className="stg-order-id">{o.id} · {o.customerName}</div>
                    <div className="stg-order-sub">
                      {o.items} · ETB {(o.totalAmount || 0).toLocaleString()} · Due {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <span className="stg-pill" style={{ background: '#E0F2FE', color: '#0284C7' }}>Online</span>
                  <button
                    type="button"
                    onClick={() => handleAccept(o.id)}
                    disabled={converting === o.id}
                    className="stg-btn stg-btn--soft-blue stg-btn--sm"
                  >
                    <CheckCircle size={14} /> {converting === o.id ? 'Accepting...' : 'Accept → Queue'}
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
