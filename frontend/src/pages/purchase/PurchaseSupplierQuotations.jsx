import React, { useState, useEffect } from 'react';
import { Plus, X, Search, CheckCircle, FileText, ShoppingCart, Trash2, Clock, Building2, MinusCircle } from 'lucide-react';
import api from '../../services/apiClient';

const C = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  text: '#111827',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

const PQ_STYLES = `
  .pq-wrapper { padding: 24px; max-width: 1536px; margin: 10px auto; font-family: 'Inter', 'Segoe UI', 'Roboto', -apple-system, sans-serif; background: #F5F6FA; min-height: calc(100vh - 60px); color: #111827; box-sizing: border-box; }
  @media (max-width: 1024px) { .pq-wrapper { padding: 16px; margin: 6px auto; } }
  .pq-wrapper h1 { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; display: flex; align-items: center; gap: 10px; }
  .pq-wrapper p { margin: 0; color: #6B7280; font-size: 14px; }
  .pq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .pq-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .pq-filter { display: flex; gap: 12px; align-items: center; }
  .pq-search-wrap { position: relative; flex: 1; max-width: 360px; }
  .pq-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
  .pq-search { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; outline: none; }
  .pq-search:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .pq-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; }
  .pq-btn-primary { background: #2563EB; color: #fff; }
  .pq-btn-primary:hover { background: #1D4ED8; }
  .pq-btn-success { background: #16A34A; color: #fff; }
  .pq-btn-success:hover { background: #15803D; }
  .pq-btn-danger { background: #fff; color: #DC2626; border: 2px solid #DC2626; }
  .pq-btn-danger:hover { background: #FEE2E2; }
  .pq-btn-ghost { background: #F3F4F6; color: #374151; }
  .pq-btn-ghost:hover { background: #E5E7EB; }
  .pq-btn-sm { padding: 6px 12px; font-size: 12px; height: 32px; }
  .pq-table-wrap { overflow-x: auto; }
  .pq-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .pq-table th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; white-space: nowrap; }
  .pq-table td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; }
  .pq-table tr:hover td { background: #F9FAFB; }
  .pq-amount { text-align: right; font-variant-numeric: tabular-nums; }
  .right { text-align: right; }
  .pq-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .pq-badge-recorded { background: #E0F2FE; color: #0369A1; }
  .pq-badge-converted { background: #DCFCE7; color: #15803D; }
  .pq-badge-cancelled { background: #FEE2E2; color: #B91C1C; }
  .pq-badge-pending { background: #FEF3C7; color: #92400E; }
  .pq-badge-default { background: #F1F5F9; color: #475569; }
  .pq-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
  .pq-modal { background: #fff; border-radius: 16px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .pq-modal-sm { width: 560px; }
  .pq-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
  .pq-modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; }
  .pq-close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 4px; border-radius: 6px; }
  .pq-close-btn:hover { background: #F3F4F6; color: #374151; }
  .pq-modal-body { padding: 24px; }
  .pq-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #E5E7EB; }
  .pq-input { width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
  .pq-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .pq-input-static { background: #F9FAFB; color: #374151; font-weight: 600; border-color: #E5E7EB; }
  .pq-textarea { resize: vertical; min-height: 60px; }
  label { display: block; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
  .pq-detail-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
  .pq-detail-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF; margin-bottom: 4px; }
  .pq-detail-val { font-size: 15px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px; }
  .pq-total-label { font-weight: 700; font-size: 14px; color: #111827; padding-top: 8px; border-top: 2px solid #E5E7EB; }
  .pq-total-val { font-weight: 800; font-size: 16px; color: #2563EB; text-align: right; padding-top: 8px; border-top: 2px solid #E5E7EB; }
  .pq-spinner-wrap { display: flex; justify-content: center; padding: 40px; }
  .pq-spinner { width: 36px; height: 36px; border: 4px solid #E5E7EB; border-top-color: #2563EB; border-right-color: #2563EB; border-radius: 50%; animation: pq-spin 1s cubic-bezier(0.5,0,0.5,1) infinite; }
  @keyframes pq-spin { to { transform: rotate(360deg); } }
  .pq-toast { position: fixed; bottom: 24px; right: 24px; z-index: 99999; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); animation: pq-slide-in 0.3s ease-out; }
  .pq-toast-success { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
  .pq-toast-error { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
  @keyframes pq-slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .pq-line-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; margin-bottom: 10px; position: relative; }
  .pq-line-num { position: absolute; top: -8px; left: -8px; width: 24px; height: 24px; background: #2563EB; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .pq-line-remove { position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; color: #DC2626; padding: 2px; border-radius: 4px; }
  .pq-line-remove:hover { background: #FEE2E2; }
  @media (max-width: 768px) { .pq-header { flex-direction: column; align-items: flex-start; } .pq-filter { flex-direction: column; align-items: stretch; } .pq-search-wrap { max-width: 100%; } .pq-modal { max-height: 95vh; } }
`;

const emptyItem = () => ({ item_description: '', quantity: '1', unit: '', unit_price: '' });

const PurchaseSupplierQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    date_agreed: new Date().toISOString().split('T')[0],
    agreed_via: 'Phone',
    notes: '',
    vat_rate: '15'
  });
  const [lineItems, setLineItems] = useState([emptyItem()]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        api.get('/purchase/quotations'),
        api.get('/suppliers')
      ]);
      setQuotations(qRes.data?.data || []);
      if (Array.isArray(sRes.data.data)) setSuppliers(sRes.data.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSupplierChange = (e) => {
    const val = e.target.value;
    const found = suppliers.find(s => s.id.toString() === val || s.full_name === val || s.company_name === val);
    if (found) {
      setFormData({ ...formData, supplier_id: found.id, supplier_name: found.company_name || found.full_name });
    } else {
      setFormData({ ...formData, supplier_id: '', supplier_name: val });
    }
  };

  const updateLineItem = (idx, field, value) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => setLineItems([...lineItems, emptyItem()]);

  const removeLineItem = (idx) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const lineSubtotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const calcTotals = () => {
    const subtotal = lineItems.reduce((s, item) => s + lineSubtotal(item), 0);
    const vatPct = parseFloat(formData.vat_rate || 0);
    const vatAmt = subtotal * (vatPct / 100);
    return { subtotal, vatAmt, vatPct, total: subtotal + vatAmt };
  };

  const { subtotal, vatAmt, vatPct, total } = calcTotals();

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validItems = lineItems.filter(it => it.item_description && parseFloat(it.unit_price) > 0);
    if (validItems.length === 0) {
      showToast('Add at least one item with a cost price', 'error');
      return;
    }
    try {
      await api.post('/purchase/quotations', {
        ...formData,
        items: validItems
      });
      showToast('Quotation recorded successfully');
      setShowAddModal(false);
      setFormData({ supplier_id: '', supplier_name: '', date_agreed: new Date().toISOString().split('T')[0], agreed_via: 'Phone', notes: '', vat_rate: '15' });
      setLineItems([emptyItem()]);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save quotation', 'error');
    }
  };

  const handleViewQuote = async (q) => {
    setSelectedQuote(q);
    setShowViewModal(true);
    try {
      const res = await api.get(`/purchase/quotations/${q.id}/items`);
      setSelectedItems(res.data?.data || []);
    } catch { setSelectedItems([]); }
  };

  const handleAction = async (action, id) => {
    if (!window.confirm(`Are you sure you want to ${action} this quotation?`)) return;
    try {
      if (action === 'convert') {
        await api.post(`/purchase/quotations/${id}/convert`);
        showToast('Converted to Purchase Order successfully!');
      } else if (action === 'cancel') {
        await api.put(`/purchase/quotations/${id}/cancel`);
        showToast('Quotation cancelled successfully');
      }
      setShowViewModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${action}`, 'error');
    }
  };

  const filteredQuotes = (quotations || []).filter(q =>
    q.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.item_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Badge = ({ status }) => {
    const s = {
      Recorded: { bg: '#e0f2fe', color: '#0369a1' },
      Converted: { bg: '#dcfce7', color: '#15803d' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
      'Pending CEO Approval': { bg: '#fef3c7', color: '#92400e' }
    }[status] || { bg: '#f1f5f9', color: '#475569' };
    return <span className="pq-badge" style={{ background: s.bg, color: s.color }}>{status}</span>;
  };

  return (
    <div className="pq-wrapper">
      <style>{PQ_STYLES}</style>

      {/* Header */}
      <div className="pq-header">
        <div>
          <h1><FileText size={24} color="#2563EB" /> Quotations</h1>
          <p>Record routine prices agreed offline with trusted suppliers.</p>
        </div>
        <button className="pq-btn pq-btn-primary" onClick={() => { setShowAddModal(true); setLineItems([emptyItem()]); }}>
          <Plus size={16} /> Record New Quotation
        </button>
      </div>

      {/* Filter */}
      <div className="pq-card" style={{ marginBottom: 20 }}>
        <div className="pq-filter">
          <div className="pq-search-wrap">
            <Search size={16} />
            <input className="pq-search" placeholder="Search by quotation no, supplier, or item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="pq-card">
        <div className="pq-table-wrap">
          <table className="pq-table">
            <thead>
              <tr>
                <th>Quotation No</th>
                <th>Supplier</th>
                <th>Items</th>
                <th className="right">Subtotal</th>
                <th className="right">VAT</th>
                <th className="right">Total</th>
                <th>Date</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="pq-spinner-wrap"><div className="pq-spinner"></div></div></td></tr>
              ) : filteredQuotes.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>No quotations found.</td></tr>
              ) : (
                filteredQuotes.map(q => {
                  const status = q.status || 'Recorded';
                  const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : status === 'Pending CEO Approval' ? 'pq-badge-pending' : 'pq-badge-default';
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#2563EB', fontFamily: 'monospace', fontSize: 13 }}>{q.quotation_no}</td>
                      <td>{q.supplier_name}</td>
                      <td><span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{q.item_count || 1} item{(q.item_count || 1) !== 1 ? 's' : ''}</span></td>
                      <td className="right pq-amount" style={{ color: '#6B7280' }}>ETB {parseFloat(q.total_amount - (q.vat_amount || 0)).toLocaleString()}</td>
                      <td className="right pq-amount" style={{ color: '#6B7280' }}>{parseFloat(q.vat_rate) > 0 ? `ETB ${parseFloat(q.vat_amount || 0).toLocaleString()}` : '—'}</td>
                      <td className="right pq-amount" style={{ fontWeight: 600 }}>ETB {parseFloat(q.total_amount).toLocaleString()}</td>
                      <td style={{ color: '#6B7280' }}>{q.date_agreed ? new Date(q.date_agreed).toLocaleDateString() : '—'}</td>
                      <td><span className={`pq-badge ${badgeCls}`}>{status}</span></td>
                      <td className="right">
                        <button className="pq-btn pq-btn-sm" style={{ background: '#F3F4F6', color: '#374151' }} onClick={() => handleViewQuote(q)}>View</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="pq-modal-overlay">
          <div className="pq-modal">
            <div className="pq-modal-header">
              <h2><Plus size={18} color="#2563EB" style={{ verticalAlign: 'middle', marginRight: 8 }} />Record Quotation</h2>
              <button className="pq-close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="pq-modal-body">
                {/* Supplier & Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Supplier</label>
                    <input list="supplier-list" required className="pq-input" value={formData.supplier_name} onChange={handleSupplierChange} placeholder="Select or type a supplier..." />
                    <datalist id="supplier-list">
                      {suppliers.map(s => <option key={s.id} value={s.company_name || s.full_name}>{s.company_name || s.full_name}</option>)}
                    </datalist>
                  </div>
                  <div>
                    <label>Date Agreed</label>
                    <input required type="date" className="pq-input" value={formData.date_agreed} onChange={e => setFormData({ ...formData, date_agreed: e.target.value })} />
                  </div>
                  <div>
                    <label>Agreed Via</label>
                    <select className="pq-input" value={formData.agreed_via} onChange={e => setFormData({ ...formData, agreed_via: e.target.value })}>
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>
                  <div>
                    <label>VAT Rate</label>
                    <select className="pq-input" value={formData.vat_rate} onChange={e => setFormData({ ...formData, vat_rate: e.target.value })}>
                      <option value="15">15% (Standard)</option>
                      <option value="0">0% (Exempt / Zero Rated)</option>
                    </select>
                  </div>
                  <div>
                    <label>Notes</label>
                    <input className="pq-input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional..." />
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ margin: 0, fontSize: 13 }}>Line Items</label>
                    <button type="button" className="pq-btn pq-btn-primary pq-btn-sm" onClick={addLineItem}>
                      <Plus size={14} /> New Line
                    </button>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div key={idx} className="pq-line-item">
                      <div className="pq-line-num">{idx + 1}</div>
                      {lineItems.length > 1 && (
                        <button type="button" className="pq-line-remove" onClick={() => removeLineItem(idx)} title="Remove line">
                          <MinusCircle size={18} />
                        </button>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.5fr 1fr 1fr', gap: 10, paddingTop: 6 }}>
                        <div>
                          <label>Item Description</label>
                          <input required className="pq-input" value={item.item_description} onChange={e => updateLineItem(idx, 'item_description', e.target.value)} placeholder="e.g. Paracetamol 500mg box" />
                        </div>
                        <div>
                          <label>Qty</label>
                          <input required type="number" min="1" step="1" className="pq-input" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                        </div>
                        <div>
                          <label>Unit</label>
                          <input className="pq-input" value={item.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} placeholder="pcs" />
                        </div>
                        <div>
                          <label>Cost Price (ETB)</label>
                          <input required type="number" min="0" step="0.01" className="pq-input" value={item.unit_price} onChange={e => updateLineItem(idx, 'unit_price', e.target.value)} />
                        </div>
                        <div>
                          <label>Line Total</label>
                          <div className="pq-input pq-input-static" style={{ display: 'flex', alignItems: 'center', height: 42 }}>ETB {lineSubtotal(item).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="pq-btn pq-btn-ghost pq-btn-sm" style={{ width: '100%', marginTop: 4, border: '2px dashed #D1D5DB' }} onClick={addLineItem}>
                    <Plus size={14} /> Add Another Item
                  </button>
                </div>

                {/* Summary */}
                <div style={{ marginTop: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#6B7280' }}>Subtotal ({lineItems.filter(i => i.item_description).length} item{(lineItems.filter(i => i.item_description).length) !== 1 ? 's' : ''})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>ETB {subtotal.toLocaleString()}</td>
                      </tr>
                      {vatPct > 0 && (
                        <tr>
                          <td style={{ padding: '6px 0', color: '#6B7280' }}>VAT ({vatPct}%)</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>ETB {vatAmt.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 0 0 0', fontWeight: 700, fontSize: 16, color: '#111827' }}>Total Amount</td>
                        <td style={{ padding: '10px 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: 18, color: '#2563EB' }}>ETB {total.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pq-modal-footer">
                <button type="button" className="pq-btn pq-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="pq-btn pq-btn-primary">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedQuote && (() => {
        const status = selectedQuote.status || 'Recorded';
        const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : status === 'Pending CEO Approval' ? 'pq-badge-pending' : 'pq-badge-default';
        const viewSubtotal = selectedItems.reduce((s, i) => s + parseFloat(i.line_total || 0), 0);
        const viewVat = parseFloat(selectedQuote.vat_amount || 0);
        return (
          <div className="pq-modal-overlay">
            <div className="pq-modal pq-modal-sm">
              <div className="pq-modal-header">
                <h2>Quotation {selectedQuote.quotation_no}</h2>
                <button className="pq-close-btn" onClick={() => setShowViewModal(false)}><X size={20} /></button>
              </div>
              <div className="pq-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className={`pq-badge ${badgeCls}`}>{status}</span>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Agreed on {selectedQuote.date_agreed ? new Date(selectedQuote.date_agreed).toLocaleDateString() : '—'} via {selectedQuote.agreed_via}</span>
                </div>
                <div className="pq-detail-box">
                  <div className="pq-detail-label">Supplier</div>
                  <div className="pq-detail-val"><Building2 size={16} /> {selectedQuote.supplier_name}</div>
                </div>

                {/* Items Table */}
                {selectedItems.length > 0 ? (
                  <table className="pq-table" style={{ marginBottom: 16, fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>#</th>
                        <th>Item</th>
                        <th className="right">Qty</th>
                        <th className="right">Cost Price</th>
                        <th className="right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: '#2563EB' }}>{item.line_no}</td>
                          <td>{item.item_description}</td>
                          <td className="right">{item.quantity} {item.unit}</td>
                          <td className="right">ETB {parseFloat(item.unit_price).toLocaleString()}</td>
                          <td className="right" style={{ fontWeight: 600 }}>ETB {parseFloat(item.line_total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="pq-info-table" style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr><td>Item</td><td>{selectedQuote.item_description}</td></tr>
                      <tr><td>Quantity</td><td>{selectedQuote.quantity} {selectedQuote.unit}</td></tr>
                      <tr><td>Cost Price</td><td>ETB {parseFloat(selectedQuote.unit_price).toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                )}

                {/* Totals */}
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>Subtotal</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {(viewSubtotal || parseFloat(selectedQuote.total_amount) - viewVat).toLocaleString()}</td></tr>
                      {parseFloat(selectedQuote.vat_rate) > 0 && (
                        <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>VAT ({parseFloat(selectedQuote.vat_rate)}%)</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {viewVat.toLocaleString()}</td></tr>
                      )}
                      <tr><td style={{ padding: '8px 0 0 0', fontWeight: 700, borderTop: '2px solid #E5E7EB' }}>Total Amount</td><td style={{ padding: '8px 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#2563EB', borderTop: '2px solid #E5E7EB' }}>ETB {parseFloat(selectedQuote.total_amount).toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>

                {selectedQuote.notes && (
                  <div style={{ marginBottom: 16, background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>
                    {selectedQuote.notes}
                  </div>
                )}

                {selectedQuote.status === 'Pending CEO Approval' && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ textAlign: 'center', padding: 14, background: '#FEF3C7', color: '#92400E', fontWeight: 600, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                      <Clock size={16} /> Waiting for CEO approval before conversion.
                    </div>
                    <button className="pq-btn pq-btn-danger" style={{ height: 44, width: '100%' }} onClick={() => handleAction('cancel', selectedQuote.id)}>
                      <Trash2 size={16} /> Cancel Quotation
                    </button>
                  </div>
                )}
                {selectedQuote.status === 'Recorded' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                    <button className="pq-btn pq-btn-success" style={{ height: 44 }} onClick={() => handleAction('convert', selectedQuote.id)}>
                      <ShoppingCart size={16} /> Convert to Purchase
                    </button>
                    <button className="pq-btn pq-btn-danger" style={{ height: 44 }} onClick={() => handleAction('cancel', selectedQuote.id)}>
                      <Trash2 size={16} /> Cancel Quotation
                    </button>
                  </div>
                )}
                {selectedQuote.status === 'Converted' && (
                  <div style={{ textAlign: 'center', padding: 14, background: '#DCFCE7', color: '#16A34A', fontWeight: 600, borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                    <CheckCircle size={16} /> Converted to Purchase Order.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className={`pq-toast pq-toast-${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PurchaseSupplierQuotations;
