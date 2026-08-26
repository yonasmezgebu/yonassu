import React, { useState, useEffect } from 'react';
import { Plus, X, Search, CheckCircle, FileText, ShoppingCart, Trash2, Calendar, Phone, Edit, Building2, Clock } from 'lucide-react';
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
  .pq-wrapper {
    padding: 24px;
    max-width: 1536px;
    margin: 10px auto;
    font-family: 'Inter', 'Segoe UI', 'Roboto', -apple-system, sans-serif;
    background: #F5F6FA;
    min-height: calc(100vh - 60px);
    color: #111827;
    box-sizing: border-box;
  }
  @media (max-width: 1024px) { .pq-wrapper { padding: 16px; margin: 6px auto; } }
  @media (max-width: 768px)  { .pq-wrapper { padding: 12px; margin: 4px auto; } }

  /* Typography */
  .pq-wrapper h1 { font-size: 28px !important; font-weight: 700 !important; color: #111827 !important; margin: 0 0 4px 0 !important; line-height: 1.3 !important; }
  .pq-wrapper h2 { font-size: 18px !important; font-weight: 600 !important; color: #111827 !important; margin: 0 !important; line-height: 1.3 !important; }
  .pq-wrapper p  { font-size: 16px !important; color: #6B7280 !important; line-height: 1.5 !important; margin: 0 !important; }
  .pq-wrapper label { font-size: 12px !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF !important; display: block; margin-bottom: 6px; }

  /* Page header */
  .pq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }

  /* Cards */
  .pq-card {
    background: #FFFFFF;
    border-radius: 10px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
    margin-bottom: 20px;
    transition: box-shadow 150ms ease, transform 150ms ease;
  }
  .pq-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

  /* Filter bar */
  .pq-filter { padding: 16px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .pq-search-wrap { position: relative; flex: 1; max-width: 380px; }
  .pq-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
  .pq-search-input {
    width: 100%; padding: 0 14px 0 38px; height: 36px;
    border-radius: 8px; border: 1px solid #E5E7EB;
    font-size: 14px; font-family: inherit; outline: none;
    transition: border-color 150ms, box-shadow 150ms;
    box-sizing: border-box;
  }
  .pq-search-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

  /* Table */
  .pq-table-wrap { overflow-x: auto; width: 100%; }
  .pq-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 760px; }
  .pq-table thead tr { background: #F9FAFB; }
  .pq-table th {
    padding: 12px 16px; font-size: 12px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.03em;
    color: #9CA3AF; border-bottom: 1px solid #E5E7EB;
    text-align: left; white-space: nowrap;
  }
  .pq-table th.right, .pq-table td.right { text-align: right; }
  .pq-table td {
    padding: 14px 16px; color: #111827;
    border-bottom: 1px solid #E5E7EB;
    font-size: 14px;
    line-height: 1.5;
  }
  .pq-table tr { transition: background 150ms ease; }
  .pq-table tbody tr:hover td { background: #F9FAFB; }
  .pq-table tbody tr:last-child td { border-bottom: none; }
  .pq-amount { font-variant-numeric: tabular-nums; }

  /* Buttons */
  .pq-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 36px; padding: 0 16px;
    border-radius: 8px; border: none;
    font-size: 14px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: all 150ms ease-in-out;
    font-family: inherit;
  }
  .pq-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .pq-btn-primary { background: #2563EB; color: #FFFFFF; }
  .pq-btn-primary:hover:not(:disabled) { background: #1D4ED8; box-shadow: 0 4px 12px rgba(37,99,235,.25); transform: translateY(-1px); }
  .pq-btn-ghost  { background: #F5F6FA; color: #111827; border: 1px solid #E5E7EB; }
  .pq-btn-ghost:hover:not(:disabled)  { background: #D97706; color: #FFFFFF; border-color: #D97706; transform: translateY(-1px); }
  .pq-btn-success { background: #16A34A; color: #FFFFFF; }
  .pq-btn-success:hover:not(:disabled) { background: #15803D; box-shadow: 0 4px 12px rgba(22,163,74,.25); transform: translateY(-1px); }
  .pq-btn-danger { background: #FFFFFF; color: #DC2626; border: 1px solid #DC2626; }
  .pq-btn-danger:hover:not(:disabled) { background: #DC2626; color: #FFFFFF; transform: translateY(-1px); }
  .pq-btn-view { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
  .pq-btn-view:hover:not(:disabled) { background: #D97706; color: #FFFFFF; border-color: #D97706; transform: translateY(-1px); }
  .pq-btn-icon { width: 36px; padding: 0; justify-content: center; }

  /* Inputs in modals */
  .pq-input {
    width: 100%; height: 36px; padding: 0 12px;
    border-radius: 8px; border: 1px solid #E5E7EB;
    font-size: 14px; font-family: inherit; outline: none;
    box-sizing: border-box;
    transition: border-color 150ms, box-shadow 150ms;
    background: #FFFFFF; color: #111827;
  }
  .pq-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .pq-input-static { background: #F9FAFB; color: #6B7280; font-weight: 600; }
  .pq-textarea { height: auto; padding: 10px 12px; resize: vertical; }

  /* Badges */
  .pq-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .pq-badge-recorded  { background: #E0F2FE; color: #0369A1; }
  .pq-badge-converted { background: #DCFCE7; color: #15803D; }
  .pq-badge-cancelled { background: #FEE2E2; color: #B91C1C; }
  .pq-badge-pending   { background: #FEF3C7; color: #92400E; }
  .pq-badge-default   { background: #F1F5F9; color: #475569; }

  /* Modal */
  .pq-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 1000;
    overflow-y: auto;
    padding: 24px 16px;
  }
  .pq-modal {
    background: #FFFFFF; width: 100%; max-width: 600px;
    border-radius: 12px;
    box-shadow: 0 20px 48px rgba(0,0,0,0.2);
    display: flex; flex-direction: column;
    margin: 0 auto;
  }
  .pq-modal-sm { max-width: 500px; }
  .pq-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #E5E7EB;
    display: flex; justify-content: space-between; align-items: center;
    background: #F9FAFB; flex-shrink: 0;
    border-radius: 12px 12px 0 0;
    position: sticky; top: 0; z-index: 1;
  }
  .pq-modal-body { padding: 24px; overflow-y: visible; flex: 1; }
  .pq-modal-footer { padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 12px; background: #F9FAFB; border-radius: 0 0 12px 12px; position: sticky; bottom: 0; z-index: 1; }
  .pq-close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: all 150ms ease; }
  .pq-close-btn:hover { background: #F1F5F9; color: #111827; }

  /* Detail rows in modal */
  .pq-detail-box { background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #E5E7EB; }
  .pq-detail-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF; margin-bottom: 4px; }
  .pq-detail-val { font-size: 15px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px; }
  .pq-info-table td { padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
  .pq-info-table td:first-child { color: #6B7280; width: 45%; }
  .pq-info-table td:last-child { text-align: right; font-weight: 600; color: #111827; }
  .pq-info-table tr:last-child td { border-bottom: none; padding-top: 12px; }
  .pq-info-table .pq-total-label { font-size: 15px; font-weight: 600; }
  .pq-info-table .pq-total-val { font-size: 18px; font-weight: 700; color: #2563EB; }

  /* Toast */
  .pq-toast {
    position: fixed; bottom: 24px; right: 24px;
    padding: 12px 20px; border-radius: 8px;
    font-size: 14px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    z-index: 2000; min-width: 260px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    animation: pq-slide-in 200ms ease;
  }
  .pq-toast-success { background: #FFFFFF; color: #16A34A; border-left: 4px solid #16A34A; }
  .pq-toast-error   { background: #FFFFFF; color: #DC2626; border-left: 4px solid #DC2626; }
  @keyframes pq-slide-in { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }

  /* Spinner */
  .pq-spinner-wrap { display: flex; align-items: center; justify-content: center; padding: 48px; }
  .pq-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 4px solid #E5E7EB;
    border-top-color: #2563EB; border-right-color: #2563EB;
    animation: pq-spin 1s cubic-bezier(0.5,0,0.5,1) infinite;
  }
  @keyframes pq-spin { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 768px) {
    .pq-header { flex-direction: column; align-items: flex-start; }
    .pq-filter { flex-direction: column; align-items: stretch; }
    .pq-search-wrap { max-width: 100%; }
    .pq-modal { max-height: 95vh; }
    .pq-modal-body .pq-grid-2 { grid-template-columns: 1fr !important; }
  }
`;

const PurchaseSupplierQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    item_description: '',
    quantity: '',
    unit: '',
    unit_price: '',
    date_agreed: new Date().toISOString().split('T')[0],
    agreed_via: 'Phone',
    notes: '',
    vat_rate: '15'
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        api.get('/purchase/quotations'),
        api.get('/suppliers')  // self-registered supplier directory
      ]);
      setQuotations(qRes.data?.data || []);
      // /suppliers returns { status, data: [...] }
      if (Array.isArray(sRes.data.data)) {
        setSuppliers(sRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSupplierChange = (e) => {
    const val = e.target.value;
    // suppliers from /suppliers have full_name not name
    const found = suppliers.find(s => s.id.toString() === val || s.full_name === val || s.company_name === val);
    if (found) {
      setFormData({ ...formData, supplier_id: found.id, supplier_name: found.company_name || found.full_name });
    } else {
      setFormData({ ...formData, supplier_id: '', supplier_name: val });
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase/quotations', formData);
      showToast('Quotation recorded successfully');
      setShowAddModal(false);
      setFormData({
        supplier_id: '', supplier_name: '', item_description: '',
        quantity: '', unit: '', unit_price: '', date_agreed: new Date().toISOString().split('T')[0],
        agreed_via: 'Phone', notes: '', vat_rate: '15'
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save quotation', 'error');
    }
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

  const totalAmountCalc = (() => {
    if (!formData.quantity || !formData.unit_price) return '0';
    const subtotal = parseFloat(formData.quantity) * parseFloat(formData.unit_price);
    const vatPct = parseFloat(formData.vat_rate || 0);
    const vatAmt = subtotal * (vatPct / 100);
    return (subtotal + vatAmt).toLocaleString();
  })();

  const Badge = ({ status }) => {
    const s = {
      Recorded: { bg: '#e0f2fe', color: '#0369a1' },
      Converted: { bg: '#dcfce7', color: '#15803d' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
      'Pending CEO Approval': { bg: '#fef3c7', color: '#92400e' }
    }[status] || { bg: '#f1f5f9', color: '#475569' };
    
    return (
      <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div className="pq-wrapper">
      <style>{PQ_STYLES}</style>
      
      {/* Header */}
      <div className="pq-header">
        <div>
          <h1>
            <FileText size={24} color="#2563EB" style={{ verticalAlign: 'middle', marginRight: 10 }} />
            Quotations
          </h1>
          <p>Record routine prices agreed offline with trusted suppliers.</p>
        </div>
        <button className="pq-btn pq-btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Record New Quotation
        </button>
      </div>

      {/* Filter */}
      <div className="pq-card" style={{ marginBottom: 20 }}>
        <div className="pq-filter">
          <div className="pq-search-wrap">
            <Search size={16} />
            <input
              className="pq-search-input"
              placeholder="Search quotations, suppliers or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <th>Item</th>
                <th>Qty</th>
                <th className="right">Cost Price</th>
                <th className="right">Total</th>
                <th>Date Agreed</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}>
                  <div className="pq-spinner-wrap"><div className="pq-spinner"></div></div>
                </td></tr>
              ) : filteredQuotes.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: 14 }}>No quotations found.</td></tr>
              ) : (
                filteredQuotes.map(q => {
                  const status = q.status || 'Recorded';
                  const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : status === 'Pending CEO Approval' ? 'pq-badge-pending' : 'pq-badge-default';
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#2563EB', fontFamily: 'monospace', fontSize: 13 }}>{q.quotation_no}</td>
                      <td>{q.supplier_name}</td>
                      <td>{q.item_description}</td>
                      <td>{q.quantity} {q.unit}</td>
                      <td className="right pq-amount" style={{ color: '#6B7280' }}>ETB {parseFloat(q.unit_price).toLocaleString()}</td>
                      <td className="right pq-amount" style={{ fontWeight: 600 }}>ETB {parseFloat(q.total_amount).toLocaleString()}</td>
                      <td style={{ color: '#6B7280' }}>{new Date(q.date_agreed).toLocaleDateString()}</td>
                      <td><span className={`pq-badge ${badgeCls}`}>{status}</span></td>
                      <td className="right">
                        <button className="pq-btn pq-btn-view" style={{ height: 32, padding: '0 12px', fontSize: 13 }}
                          onClick={() => { setSelectedQuote(q); setShowViewModal(true); }}>
                          View
                        </button>
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
                <div className="pq-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Supplier</label>
                    <input list="supplier-list" required className="pq-input"
                      value={formData.supplier_name} onChange={handleSupplierChange}
                      placeholder="Select or type a supplier..." />
                    <datalist id="supplier-list">
                      {suppliers.map(s => <option key={s.id} value={s.company_name || s.full_name}>{s.company_name || s.full_name}</option>)}
                    </datalist>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Item Description</label>
                    <input required className="pq-input"
                      value={formData.item_description}
                      onChange={e => setFormData({...formData, item_description: e.target.value})}
                      placeholder="e.g. Paracetamol 500mg box" />
                  </div>
                  <div>
                    <label>Quantity</label>
                    <input required type="number" min="0.01" step="0.01" className="pq-input"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label>Unit (Optional)</label>
                    <input className="pq-input"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                      placeholder="e.g. pcs, box, kg" />
                  </div>
                  <div>
                    <label>Cost Price (ETB)</label>
                    <input required type="number" min="0" step="0.01" className="pq-input"
                      value={formData.unit_price}
                      onChange={e => setFormData({...formData, unit_price: e.target.value})} />
                  </div>
                  <div>
                    <label>Total Amount</label>
                    <div className="pq-input pq-input-static" style={{ display: 'flex', alignItems: 'center' }}>ETB {totalAmountCalc}</div>
                  </div>
                  <div>
                    <label>Date Agreed</label>
                    <input required type="date" className="pq-input"
                      value={formData.date_agreed}
                      onChange={e => setFormData({...formData, date_agreed: e.target.value})} />
                  </div>
                  <div>
                    <label>VAT Rate</label>
                    <select className="pq-input"
                      value={formData.vat_rate}
                      onChange={e => setFormData({...formData, vat_rate: e.target.value})}>
                      <option value="15">15% (Standard)</option>
                      <option value="0">0% (Zero Rated)</option>
                      <option value="exempt">Exempt</option>
                    </select>
                  </div>
                  <div>
                    <label>Agreed Via</label>
                    <select className="pq-input"
                      value={formData.agreed_via}
                      onChange={e => setFormData({...formData, agreed_via: e.target.value})}>
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Notes</label>
                    <textarea rows={2} className="pq-input pq-textarea"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Optional details about this quotation..." />
                  </div>
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
        const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : 'pq-badge-default';
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
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Agreed on {new Date(selectedQuote.date_agreed).toLocaleDateString()} via {selectedQuote.agreed_via}</span>
                </div>
                <div className="pq-detail-box">
                  <div className="pq-detail-label">Supplier</div>
                  <div className="pq-detail-val"><Building2 size={16} /> {selectedQuote.supplier_name}</div>
                </div>
                <table className="pq-info-table" style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td>Item</td><td>{selectedQuote.item_description}</td></tr>
                    <tr><td>Quantity</td><td>{selectedQuote.quantity} {selectedQuote.unit}</td></tr>
                    <tr><td>Cost Price</td><td>ETB {parseFloat(selectedQuote.unit_price).toLocaleString()}</td></tr>
                    {selectedQuote.vat_rate === 'exempt' ? (
                      <tr><td>VAT</td><td style={{ color: '#D97706', fontWeight: 600 }}>Exempt</td></tr>
                    ) : parseFloat(selectedQuote.vat_rate) > 0 ? (
                      <tr><td>VAT ({parseFloat(selectedQuote.vat_rate)}%)</td><td>ETB {parseFloat(selectedQuote.vat_amount || 0).toLocaleString()}</td></tr>
                    ) : null}
                    <tr>
                      <td className="pq-total-label">Total Amount</td>
                      <td className="pq-total-val">ETB {parseFloat(selectedQuote.total_amount).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                {selectedQuote.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#9CA3AF', marginBottom: 6 }}>Notes</div>
                    <div style={{ fontSize: 14, color: '#111827', fontStyle: 'italic', background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, border: '1px solid #FDE68A' }}>{selectedQuote.notes}</div>
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
                    <CheckCircle size={16} /> This quotation has been converted to a Purchase Order.
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
