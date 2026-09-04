import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, UserPlus, Globe, ArrowRight, CheckCircle, RefreshCw, Wallet, Landmark, Banknote, Calculator, AlignLeft, UploadCloud } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { StageStyles } from './printingStageStyles';
import StageNav from './StageNav';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';

const PRODUCT_TYPES = ['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt'];
const PAPER_TYPES = [
  { code: 'A4', name: 'A4 (210×297mm)', price: 0.50 },
  { code: 'A5', name: 'A5 (148×210mm)', price: 0.75 },
  { code: 'A3', name: 'A3 (297×420mm)', price: 1.00 },
];
const BINDING_TYPES = [
  { code: 'None',    name: 'No Binding',      price: 0 },
  { code: 'Spiral',  name: 'Spiral Binding',  price: 500 },
  { code: 'Thermal', name: 'Thermal Binding', price: 300 },
];
const PRIORITIES = ['Normal', 'Urgent', 'Rush'];

const calcPrice = ({ paperType, pagesPerCopy, quantity, colorPrinting, bindingType, vatCtx }) => {
  const basePrice = PAPER_TYPES.find(p => p.code === paperType)?.price ?? 0.50;
  const multiplier = colorPrinting ? 2.0 : 1.0;
  const pricePerUnit = (parseInt(pagesPerCopy) || 1) * basePrice * multiplier;
  const bindingCost = (BINDING_TYPES.find(b => b.code === bindingType)?.price ?? 0) * (parseInt(quantity) || 1);
  const subtotal = pricePerUnit * (parseInt(quantity) || 1);
  const r = getVatForItem(vatCtx, 'printing', null, subtotal + bindingCost);
  return {
    pricePerUnit: parseFloat(pricePerUnit.toFixed(2)),
    bindingCost: parseFloat(bindingCost.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    vat: r.vat,
    rate: r.rate,
    totalPrice: parseFloat((subtotal + bindingCost + r.vat).toFixed(2)),
  };
};

const PrintingNewJob = () => {
  const navigate = useNavigate();
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', productType: 'Book', paperType: 'A4',
    pagesPerCopy: 1, quantity: 1, colorPrinting: false, bindingType: 'None',
    priority: 'Normal', dueDate: '', specialInstructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [vatCtx, setVatCtx] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const pricing = calcPrice({ paperType: form.paperType, pagesPerCopy: form.pagesPerCopy, quantity: form.quantity, colorPrinting: form.colorPrinting, bindingType: form.bindingType, vatCtx });
  const selAcc = financeAccounts.find(a => String(a.id) === String(paymentMethod));
  const isCash = !!selAcc && selAcc.account_type === 'Cash';

  const loadFinanceAccounts = useCallback(async () => {
    try {
      const res = await apiClient.get('/finance-bank');
      const data = res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setFinanceAccounts(data);
    } catch (e) {
      console.error('Failed to load finance accounts', e);
    }
  }, []);

  useEffect(() => {
    loadVatSafe().then(setVatCtx).catch(() => {});
    loadFinanceAccounts();
  }, [loadFinanceAccounts]);

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
    if (!paymentMethod) { setError('Please select a payment method.'); return; }

    const selectedAccount = financeAccounts.find(a => String(a.id) === String(paymentMethod));
    const isCashPayment = selectedAccount && selectedAccount.account_type === 'Cash';
    if (!isCashPayment) {
      if (!paymentReference.trim() && !paymentScreenshot) {
        setError('For Bank or Mobile Wallet payments, you must provide either a Transaction Reference or a Payment Screenshot.');
        return;
      }
      if (paymentReference.trim() && paymentScreenshot) {
        setError('Please provide either a Transaction Reference OR a Payment Screenshot, but not both.');
        return;
      }
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('productType', form.productType);
      formData.append('paperType', form.paperType);
      formData.append('pagesPerCopy', parseInt(form.pagesPerCopy, 10) || 1);
      formData.append('quantity', parseInt(form.quantity, 10) || 1);
      formData.append('colorPrinting', form.colorPrinting ? 'true' : 'false');
      formData.append('bindingType', form.bindingType);
      formData.append('dueDate', form.dueDate);
      formData.append('priority', form.priority);
      formData.append('specialInstructions', form.specialInstructions || '');
      formData.append('customer', JSON.stringify({ name: form.customerName, phone: form.customerPhone || '0900000000', customerTypeId: 1 }));
      // Cash is collected at the counter and skips finance verification; the
      // backend detects it by the 'Cash' method string. Bank/Mobile Wallet
      // carry the resolved account name + transaction reference/screenshot.
      formData.append('paymentMethod', isCashPayment ? 'Cash' : (selectedAccount ? selectedAccount.account_name : paymentMethod));
      if (paymentReference.trim()) formData.append('paymentReference', paymentReference.trim());
      if (paymentScreenshot) formData.append('paymentScreenshot', paymentScreenshot);

      const res = await apiClient.post('/printing/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`Order ${res.data?.orderNumber || ''} created and added to the queue.`);
      setForm(f => ({ ...f, customerName: '', customerPhone: '', quantity: 1, pagesPerCopy: 1, dueDate: '', specialInstructions: '' }));
      setPaymentMethod(''); setPaymentReference(''); setPaymentScreenshot(null);
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
                  {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name} — ETB {p.price}/page</option>)}
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
                  {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.code}{b.price > 0 ? ` — ETB ${b.price}` : ' (free)'}</option>)}
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
                <label className="stg-label">Color Printing</label>
                <label className="stg-check" style={{ height: 36 }}>
                  <input type="checkbox" checked={form.colorPrinting} onChange={e => set('colorPrinting', e.target.checked)} />
                  Color Printing
                </label>
              </div>
              <div className="stg-form-field" style={{ gridColumn: '1 / -1' }}>
                <label className="stg-label">Special Instructions</label>
                <textarea className="stg-textarea" rows={2} value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} placeholder="Optional notes for the production team..." />
              </div>
            </div>

            {/* Price Summary */}
            <div style={{ marginTop: 14, border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: '#1E293B', marginBottom: 8 }}>
                <Calculator size={14} color="#2563EB" /> Price Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', lineHeight: 1.9 }}>
                <span>Unit price</span><span>ETB {pricing.pricePerUnit.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', lineHeight: 1.9 }}>
                <span>Subtotal</span><span>ETB {pricing.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', lineHeight: 1.9 }}>
                <span>Bound copies add-on</span><span>ETB {pricing.bindingCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', lineHeight: 1.9 }}>
                <span>VAT ({fmtPct(pricing.rate)})</span><span>ETB {pricing.vat.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#0F172A', borderTop: '1px dashed #CBD5E1', marginTop: 6, paddingTop: 6 }}>
                <span>Total Payable</span><span>ETB {pricing.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ marginTop: 16 }}>
              <label className="stg-label">Payment Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                {financeAccounts.filter(a => a.status === 'Active').map(acc => {
                  const selected = String(paymentMethod) === String(acc.id);
                  const isCashAcc = acc.account_type === 'Cash';
                  const Icon = acc.account_type === 'Mobile Wallet' ? Wallet : (isCashAcc ? Banknote : Landmark);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => { setPaymentMethod(String(acc.id)); setPaymentReference(''); setPaymentScreenshot(null); }}
                      style={{
                        cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
                        background: selected ? '#EFF6FF' : '#FFFFFF',
                        borderRadius: 10,
                        padding: '10px 12px',
                        transition: 'all .15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: '#1E293B' }}>
                        <Icon size={16} color={isCashAcc ? '#16A34A' : '#2563EB'} />
                        {acc.account_type}
                        {selected && <CheckCircle size={14} color="#2563EB" style={{ marginLeft: 'auto' }} />}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                        {isCashAcc ? 'At the counter' : `${acc.bank_provider || 'Account'} · ${acc.account_number || '—'}`}
                      </div>
                    </div>
                  );
                })}
                {financeAccounts.filter(a => a.status === 'Active').length === 0 && (
                  <div style={{ fontSize: 12.5, color: '#94A3B8', padding: '8px 4px' }}>No payment accounts available.</div>
                )}
              </div>

              {paymentMethod && (() => {
                const acc = selAcc;
                if (!acc) return null;
                return (
                  <div style={{ marginTop: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#1E293B', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Wallet size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: '#1D4ED8' }}>{isCash ? 'Pay in Cash at Counter:' : 'Transfer Payment To:'}</div>
                      <div><strong>Account Name:</strong> {acc.account_name}</div>
                      {acc.account_number && <div><strong>Account Number:</strong> {acc.account_number}</div>}
                      {acc.bank_provider && <div><strong>Bank / Provider:</strong> {acc.bank_provider}</div>}
                      {acc.branch && <div><strong>Branch:</strong> {acc.branch}</div>}
                      {!isCash && <div style={{ marginTop: 4, fontSize: 11, color: '#64748B' }}>After payment, enter the transaction reference above or upload a screenshot below.</div>}
                    </div>
                  </div>
                );
              })()}

              {paymentMethod && !isCash && (
                <>
                  <div className="stg-form-field" style={{ marginTop: 12 }}>
                    <label className="stg-label">Transaction Reference</label>
                    <input className="stg-input" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder={`Paste the ${selAcc?.bank_provider || ''} transaction reference (or use the screenshot below)...`} />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label className="stg-label"><UploadCloud size={13} style={{ display: 'inline', verticalAlign: -2 }} /> Payment Screenshot <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional if Transaction Reference is provided)</span></label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <div style={{
                        border: `1.5px dashed ${paymentScreenshot ? '#16A34A' : '#CBD5E1'}`,
                        background: paymentScreenshot ? '#F0FDF4' : '#F8FAFC',
                        borderRadius: 10, padding: '14px 12px', textAlign: 'center',
                        transition: 'all .15s'
                      }}>
                        <UploadCloud size={22} color={paymentScreenshot ? '#16A34A' : '#94A3B8'} style={{ marginBottom: 4 }} />
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: paymentScreenshot ? '#166534' : '#334155' }}>
                          {paymentScreenshot ? paymentScreenshot.name : 'Click to upload payment screenshot'}
                        </p>
                        {paymentScreenshot && (
                          <button
                            type="button"
                            onClick={(ev) => { ev.preventDefault(); setPaymentScreenshot(null); }}
                            style={{ marginTop: 8, padding: '2px 8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                          >
                            Remove Screenshot
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => setPaymentScreenshot(e.target.files[0] || null)}
                      />
                    </label>
                  </div>
                </>
              )}
              {paymentMethod && isCash && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, fontWeight: 500 }}>
                  <CheckCircle size={15} color="#16A34A" />
                  Cash collected at the counter — this order is fully PAID and skips finance verification. It goes straight into the job queue.
                </div>
              )}
            </div>

            <div className="stg-actions-col" style={{ marginTop: 16 }}>
              <button type="submit" className="stg-btn stg-btn--primary stg-btn--block" disabled={creating}>
                <ArrowRight size={15} /> {creating ? 'Creating Order...' : (isCash ? 'Create Order → Queue (Paid · Cash)' : 'Create Order → Queue')}
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