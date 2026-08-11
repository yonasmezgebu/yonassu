import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, RefreshCw, CheckCircle, XCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

const STATUS_BADGES = {
  PENDING_CEO: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', text: '⏳ Awaiting CEO' },
  CEO_CONFIRMED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', text: '✅ CEO Confirmed' },
  CEO_REJECTED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', text: '❌ CEO Rejected' },
  FINANCE_PAID: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', text: '💳 Finance Paid' },
};

/* ── Toast ── */
const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'var(--color-bg-card)', borderLeft: `4px solid ${msg?.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)'}`, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '14px 20px', minWidth: 280, animation: 'slideIn 0.2s ease', display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
      {msg?.type === 'success' ? <CheckCircle size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-danger)" />}
      <span style={{ flex: 1 }}>{msg?.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
    </div>
  );
};

const PharmacyDirectDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    supplierName: '', drugName: '', quantity: '', unitOfMeasure: 'Pcs',
    unitPrice: '', deliveryDate: new Date().toISOString().split('T')[0],
    invoiceNo: '', notes: '',
  });

  const showToast = (text, type = 'success') => setToast({ text, type, id: Date.now() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/procurement/direct-deliveries');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setDeliveries(data);
    } catch { setDeliveries([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalAmount = form.quantity && form.unitPrice
    ? (parseFloat(form.quantity) * parseFloat(form.unitPrice)).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierName || !form.drugName || !form.quantity || !form.unitPrice || !form.deliveryDate) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/procurement/direct-deliveries', {
        supplierName: form.supplierName,
        drugName: form.drugName,
        quantity: parseInt(form.quantity),
        unitOfMeasure: form.unitOfMeasure,
        unitPrice: parseFloat(form.unitPrice),
        deliveryDate: form.deliveryDate,
        invoiceNo: form.invoiceNo || undefined,
        notes: form.notes || undefined,
      });
      showToast('Delivery recorded successfully! CEO has been notified.', 'success');
      setForm({ supplierName: '', drugName: '', quantity: '', unitOfMeasure: 'Pcs', unitPrice: '', deliveryDate: new Date().toISOString().split('T')[0], invoiceNo: '', notes: '' });
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit delivery.', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="pso-root">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* TOP HEADER */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Truck size={20} />
          </div>
          <div>
            <h1 className="pso-title">Direct Delivery Records</h1>
            <p className="pso-subtitle">Record goods received directly from supplier — bypasses general store</p>
          </div>
        </div>
        <div className="pso-header-right">
          <button onClick={load} className="pso-btn-refresh" disabled={loading}>
            <SegmentedSpinner size={15} spinning={loading} />
            Refresh
          </button>
          <button onClick={() => setShowForm(f => !f)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Record New Delivery'}
          </button>
        </div>
      </div>

      <div className="pso-content">
        <div className="card-container" style={{ padding: 24, margin: '20px auto', maxWidth: 1100 }}>
          
          {/* New Delivery Form */}
          {showForm && (
            <div style={{ background: 'var(--color-bg-card)', borderTop: '4px solid var(--color-primary)', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} color="var(--color-primary)" /> Record Supplier Delivery
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label className="pso-label">Supplier Name <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <input className="pso-input" value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} placeholder="e.g. ABC Pharma Ltd" required />
                  </div>
                  <div>
                    <label className="pso-label">Drug / Item Name <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <input className="pso-input" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} placeholder="e.g. Amoxicillin 500mg" required />
                  </div>
                  <div>
                    <label className="pso-label">Quantity <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <input className="pso-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 500" required />
                  </div>
                  <div>
                    <label className="pso-label">Unit of Measure</label>
                    <select className="pso-input" value={form.unitOfMeasure} onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))}>
                      {['Pcs', 'Tabs', 'Boxes', 'Bottles', 'Vials', 'Ampoules', 'Sachets', 'Units', 'Kg', 'Litres'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="pso-label">Unit Price (ETB) <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <input className="pso-input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="e.g. 25.50" required />
                  </div>
                  <div>
                    <label className="pso-label">Total Amount</label>
                    <div className="pso-input" style={{ background: 'var(--color-bg-page)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      ETB {parseFloat(totalAmount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="pso-label">Delivery Date <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <input className="pso-input" type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="pso-label">Invoice / Ref No.</label>
                    <input className="pso-input" value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="e.g. INV-2026-1234" />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label className="pso-label">Notes (optional)</label>
                  <textarea className="pso-input" style={{ height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes about this delivery..." />
                </div>

                {/* Info alert */}
                <div style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-info)', marginBottom: 24 }}>
                  ℹ️ <strong>Submitting this form will notify the CEO</strong> to confirm this delivery. Once confirmed, the stock will be automatically added to pharmacy inventory and Finance will be notified to create the payable.
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? <SegmentedSpinner size={16} spinning={true} /> : <Truck size={16} />}
                    {submitting ? 'Submitting...' : 'Submit Delivery for CEO Confirmation'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Deliveries Table */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <SegmentedSpinner size={24} spinning={true} />
              <div style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Loading records...</div>
            </div>
          ) : deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <Truck size={48} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>No Deliveries Recorded Yet</h3>
              <p style={{ margin: 0, fontSize: 14 }}>Click "Record New Delivery" to submit goods received directly from a supplier.</p>
            </div>
          ) : (
            <div>
              <div className="toolbar" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--color-border)', marginBottom: 16, background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 600 }}>📦 Your Direct Delivery Records</h3>
                  <span className="pso-badge">{deliveries.length} Records</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="pso-table">
                  <thead>
                    <tr>
                      {['Delivery No', 'Drug / Item', 'Supplier', 'Qty', 'Total (ETB)', 'Date', 'Status', ''].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 4 ? 'right' : i === 7 ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => {
                      const badge = STATUS_BADGES[d.status] || { bg: '#F1F5F9', color: '#475569', text: d.status };
                      return (
                        <React.Fragment key={d.id}>
                          <tr style={{ cursor: 'pointer', background: expandedId === d.id ? 'var(--color-bg-page)' : 'transparent' }} onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                            <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.delivery_no}</td>
                            <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{d.drug_name}</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{d.supplier_name}</td>
                            <td>{d.quantity} <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{d.unit_of_measure}</span></td>
                            <td style={{ fontWeight: 600, textAlign: 'right' }}>{parseFloat(d.total_amount || 0).toFixed(2)}</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '—'}</td>
                            <td>
                              <span className="pso-badge" style={{ background: badge.bg, color: badge.color }}>
                                {badge.text}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                              {expandedId === d.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                          </tr>
                          {expandedId === d.id && (
                            <tr style={{ background: 'var(--color-bg-page)' }}>
                              <td colSpan={8} style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, fontSize: 13, color: 'var(--color-text-primary)' }}>
                                  <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Unit Price</strong> ETB {parseFloat(d.unit_price || 0).toLocaleString()}</div>
                                  <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Invoice No</strong> {d.invoice_no || '—'}</div>
                                  <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>CEO Notes</strong> {d.ceo_notes || '—'}</div>
                                  <div><strong style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Confirmed At</strong> {d.ceo_confirmed_at ? new Date(d.ceo_confirmed_at).toLocaleString() : '—'}</div>
                                  {d.notes && <div style={{ gridColumn: '1/-1' }}><strong style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Notes</strong> {d.notes}</div>}
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
            </div>
          )}

          {/* Flow info */}
          <div style={{ marginTop: 24, background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color="var(--color-primary)" /> Direct Delivery Flow
            </div>
            <div style={{ lineHeight: 1.6 }}>
              <strong style={{color: 'var(--color-text-primary)'}}>You (Pharmacy Manager)</strong> record goods received directly from supplier →
              <strong style={{color: 'var(--color-text-primary)'}}> CEO</strong> confirms the delivery (stock is auto-added to pharmacy) →
              <strong style={{color: 'var(--color-text-primary)'}}> Finance</strong> creates accounts payable and pays the supplier.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PharmacyDirectDeliveries;
