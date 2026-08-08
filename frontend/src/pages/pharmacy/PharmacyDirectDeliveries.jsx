import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, RefreshCw, CheckCircle, XCircle, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ── Design tokens ── */
const C = {
  forest: '#2d6a4f', dark: '#1b4332', mint: '#f0fdf4', sage: '#74c69d', white: '#fff',
  gray: '#6b7280', darkGray: '#374151', border: '#d1fae5', error: '#dc2626',
  errorDark: '#991b1b', warning: '#d97706', blue: '#2563eb', lightGray: '#f9fafb',
  info: '#0ea5e9',
};

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .dd-row:hover { background: #e6f7ef !important; }
`;

const STATUS_COLORS = {
  PENDING_CEO: { bg: '#fef3c7', color: '#92400e', label: '⏳ Awaiting CEO' },
  CEO_CONFIRMED: { bg: '#d1fae5', color: '#065f46', label: '✅ CEO Confirmed' },
  CEO_REJECTED: { bg: '#fee2e2', color: '#991b1b', label: '❌ CEO Rejected' },
  FINANCE_PAID: { bg: '#dbeafe', color: '#1e40af', label: '💳 Finance Paid' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4 }}>
      {s.label}
    </span>
  );
};

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, justifyContent: 'center', color: C.gray }}>
    <SegmentedSpinner size={20} />
    <span style={{ fontWeight: 600 }}>Loading...</span>
  </div>
);

/* ── Toast ── */
const Toast = ({ msg, onClose }) => {
  const colors = { success: C.forest, error: C.error, info: C.info };
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: C.white, border: `2px solid ${colors[msg?.type] || C.forest}`, boxShadow: `0 6px 0 ${colors[msg?.type] || C.forest}`, padding: '14px 20px', minWidth: 280, animation: 'slideIn 0.2s ease', display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
      {msg?.type === 'success' ? <CheckCircle size={18} color={C.forest} /> : <XCircle size={18} color={C.error} />}
      <span style={{ flex: 1 }}>{msg?.text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}>✕</button>
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

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: `2px solid ${C.border}`,
    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
    outline: 'none', background: C.white, color: C.darkGray, borderRadius: 0,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.lightGray, fontFamily: 'Inter, sans-serif' }}>
      <style>{STYLE}</style>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: C.forest, padding: '18px 28px', borderBottom: `4px solid ${C.dark}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={20} /> Direct Delivery Records
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sage }}>
            Record goods received directly from supplier to pharmacy — bypasses general store
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ background: 'transparent', border: `2px solid ${C.sage}`, color: C.sage, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowForm(f => !f)} style={{ background: showForm ? '#fff' : C.sage, border: `2px solid ${C.sage}`, color: showForm ? C.forest : C.dark, padding: '8px 16px', fontWeight: 800, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> {showForm ? 'Cancel' : 'Record New Delivery'}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {/* New Delivery Form */}
        {showForm && (
          <div style={{ background: C.white, border: `2px solid ${C.sage}`, boxShadow: `0 6px 0 ${C.forest}`, padding: 24, marginBottom: 24, animation: 'slideIn 0.2s ease' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 900, color: C.dark, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color={C.forest} /> Record Supplier Delivery — Directly to Pharmacy
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Supplier Name *</label>
                  <input style={inputStyle} value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} placeholder="e.g. ABC Pharma Ltd" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Drug / Item Name *</label>
                  <input style={inputStyle} value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} placeholder="e.g. Amoxicillin 500mg" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantity *</label>
                  <input style={inputStyle} type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 500" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unit of Measure</label>
                  <select style={{ ...inputStyle }} value={form.unitOfMeasure} onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))}>
                    {['Pcs', 'Tabs', 'Boxes', 'Bottles', 'Vials', 'Ampoules', 'Sachets', 'Units', 'Kg', 'Litres'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unit Price (ETB) *</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="e.g. 25.50" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Amount</label>
                  <div style={{ ...inputStyle, background: C.mint, fontWeight: 800, color: C.forest }}>
                    ETB {parseFloat(totalAmount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Date *</label>
                  <input style={inputStyle} type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Invoice / Ref No.</label>
                  <input style={inputStyle} value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="e.g. INV-2026-1234" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.darkGray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes (optional)</label>
                <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes about this delivery..." />
              </div>

              {/* Info alert */}
              <div style={{ background: '#eff6ff', border: '2px solid #93c5fd', padding: '10px 14px', fontSize: 12, color: '#1e40af', marginBottom: 16 }}>
                ℹ️ <strong>Submitting this form will notify the CEO</strong> to confirm this delivery. Once confirmed, the stock will be automatically added to pharmacy inventory and Finance will be notified to create the payable.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={submitting} style={{ background: C.forest, border: `2px solid ${C.dark}`, color: C.white, padding: '10px 22px', fontWeight: 800, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? <SegmentedSpinner size={14} /> : <Truck size={14} />}
                  {submitting ? 'Submitting...' : 'Submit Delivery for CEO Confirmation'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: C.white, border: `2px solid ${C.border}`, color: C.gray, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deliveries Table */}
        {loading ? <Spinner /> : deliveries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray, background: C.white, border: `2px solid ${C.border}` }}>
            <Truck size={48} color={C.sage} style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 8px', color: C.darkGray }}>No Deliveries Recorded Yet</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Click "Record New Delivery" to submit goods received directly from a supplier.</p>
          </div>
        ) : (
          <div style={{ background: C.white, border: `2px solid ${C.border}` }}>
            <div style={{ padding: '14px 18px', borderBottom: `2px solid ${C.border}`, fontWeight: 800, fontSize: 13, color: C.dark }}>
              📦 Your Direct Delivery Records ({deliveries.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.mint }}>
                    {['Delivery No', 'Drug / Item', 'Supplier', 'Qty', 'Total (ETB)', 'Date', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: C.dark, borderBottom: `2px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => (
                    <React.Fragment key={d.id}>
                      <tr className="dd-row" style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: C.forest }}>{d.delivery_no}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: C.dark }}>{d.drug_name}</td>
                        <td style={{ padding: '11px 14px', color: C.darkGray }}>{d.supplier_name}</td>
                        <td style={{ padding: '11px 14px' }}>{d.quantity} {d.unit_of_measure}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: C.forest }}>ETB {parseFloat(d.total_amount || 0).toLocaleString()}</td>
                        <td style={{ padding: '11px 14px', color: C.gray, fontSize: 12, whiteSpace: 'nowrap' }}>{d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={d.status} /></td>
                        <td style={{ padding: '11px 14px', color: C.gray }}>
                          {expandedId === d.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {expandedId === d.id && (
                        <tr style={{ background: C.mint }}>
                          <td colSpan={8} style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
                              <div><span style={{ color: C.gray, display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Unit Price</span> ETB {parseFloat(d.unit_price || 0).toLocaleString()}</div>
                              <div><span style={{ color: C.gray, display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Invoice No</span> {d.invoice_no || '—'}</div>
                              <div><span style={{ color: C.gray, display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>CEO Notes</span> {d.ceo_notes || '—'}</div>
                              <div><span style={{ color: C.gray, display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Confirmed At</span> {d.ceo_confirmed_at ? new Date(d.ceo_confirmed_at).toLocaleString() : '—'}</div>
                              {d.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: C.gray, display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Notes</span> {d.notes}</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flow info */}
        <div style={{ marginTop: 20, background: C.mint, border: `2px solid ${C.sage}`, padding: '14px 18px', fontSize: 12 }}>
          <div style={{ fontWeight: 800, color: C.forest, marginBottom: 6 }}>📋 Direct Delivery Flow</div>
          <div style={{ color: C.darkGray, lineHeight: 1.8 }}>
            <strong>You (Pharmacy Manager)</strong> record goods received directly from supplier →
            <strong> CEO</strong> confirms the delivery (stock is auto-added to pharmacy) →
            <strong> Finance</strong> creates accounts payable and pays the supplier.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDirectDeliveries;
