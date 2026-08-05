import React, { useState, useEffect } from 'react';
import { Plus, X, Search, CheckCircle, FileText, ShoppingCart, Trash2, Calendar, Phone, Edit, Building2 } from 'lucide-react';
import api from '../../services/apiClient';

const C = {
  primary: '#0ea5e9',
  primaryHover: '#0284c7',
  success: '#10b981',
  danger: '#ef4444',
  text: '#334155',
  textLight: '#64748b',
  bg: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
};

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
    notes: ''
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
        agreed_via: 'Phone', notes: ''
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

  const totalAmountCalc = (formData.quantity && formData.unit_price) 
    ? (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toLocaleString() 
    : '0';

  const Badge = ({ status }) => {
    const s = {
      Recorded: { bg: '#e0f2fe', color: '#0369a1' },
      Converted: { bg: '#dcfce7', color: '#15803d' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' }
    }[status] || { bg: '#f1f5f9', color: '#475569' };
    
    return (
      <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: 24, background: C.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} color={C.primary} /> Quotations (Manual)
          </h1>
          <p style={{ margin: 0, color: C.textLight, fontSize: 14 }}>Record routine prices agreed offline with trusted suppliers.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: C.white, border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px rgba(14, 165, 233, 0.2)' }}
        >
          <Plus size={18} /> Record New Quotation
        </button>
      </div>

      {/* Filter */}
      <div style={{ background: C.white, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} color={C.textLight} style={{ position: 'absolute', left: 14, top: 12 }} />
          <input 
            placeholder="Search quotations, suppliers or items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 40 }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Quotation No</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Supplier</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Item</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Qty</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Unit Price</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Total</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Date Agreed</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, color: C.textLight, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</td></tr>
            ) : filteredQuotes.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: C.textLight }}>No quotations found.</td></tr>
            ) : (
              filteredQuotes.map(q => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: C.text }}>{q.quotation_no}</td>
                  <td style={{ padding: '16px', color: C.text }}>{q.supplier_name}</td>
                  <td style={{ padding: '16px', color: C.text }}>{q.item_description}</td>
                  <td style={{ padding: '16px', color: C.text }}>{q.quantity} {q.unit}</td>
                  <td style={{ padding: '16px', color: C.textLight }}>ETB {parseFloat(q.unit_price).toLocaleString()}</td>
                  <td style={{ padding: '16px', fontWeight: 600, color: C.text }}>ETB {parseFloat(q.total_amount).toLocaleString()}</td>
                  <td style={{ padding: '16px', color: C.textLight }}>{new Date(q.date_agreed).toLocaleDateString()}</td>
                  <td style={{ padding: '16px' }}><Badge status={q.status} /></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setSelectedQuote(q); setShowViewModal(true); }}
                      style={{ padding: '6px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: C.white, width: '100%', maxWidth: 600, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color={C.primary} /> Record Quotation
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Supplier</label>
                  <input 
                    list="supplier-list"
                    required
                    value={formData.supplier_name}
                    onChange={handleSupplierChange}
                    placeholder="Select or type a supplier..."
                    style={inputStyle}
                  />
                  <datalist id="supplier-list">
                    {suppliers.map(s => <option key={s.id} value={s.company_name || s.full_name}>{s.company_name || s.full_name}</option>)}
                  </datalist>
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Item Description</label>
                  <input 
                    required
                    value={formData.item_description}
                    onChange={e => setFormData({...formData, item_description: e.target.value})}
                    placeholder="e.g. Paracetamol 500mg box"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Quantity</label>
                  <input 
                    required type="number" min="0.01" step="0.01"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Unit (Optional)</label>
                  <input 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    placeholder="e.g. pcs, box, kg"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Unit Price (ETB)</label>
                  <input 
                    required type="number" min="0" step="0.01"
                    value={formData.unit_price}
                    onChange={e => setFormData({...formData, unit_price: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Total Amount</label>
                  <div style={{ ...inputStyle, background: C.bg, fontWeight: 600 }}>ETB {totalAmountCalc}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Date Agreed</label>
                  <input 
                    required type="date"
                    value={formData.date_agreed}
                    onChange={e => setFormData({...formData, date_agreed: e.target.value})}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Agreed Via</label>
                  <select 
                    value={formData.agreed_via}
                    onChange={e => setFormData({...formData, agreed_via: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="Phone">Phone</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="In-person">In-person</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>Notes</label>
                  <textarea 
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Optional details about this quotation..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: 8, background: C.primary, color: C.white, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedQuote && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: C.white, width: '100%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg }}>
              <h2 style={{ margin: 0, fontSize: 18, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                Quotation {selectedQuote.quotation_no}
              </h2>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Badge status={selectedQuote.status} />
                <span style={{ fontSize: 13, color: C.textLight }}>Agreed on {new Date(selectedQuote.date_agreed).toLocaleDateString()} via {selectedQuote.agreed_via}</span>
              </div>

              <div style={{ background: C.bg, padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Supplier</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={16} /> {selectedQuote.supplier_name}</div>
              </div>

              <table style={{ width: '100%', fontSize: 14, marginBottom: 20 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', color: C.textLight }}>Item</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: C.text }}>{selectedQuote.item_description}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: C.textLight }}>Quantity</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: C.text }}>{selectedQuote.quantity} {selectedQuote.unit}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: C.textLight }}>Unit Price</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: C.text }}>ETB {parseFloat(selectedQuote.unit_price).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 0 0 0', fontWeight: 600, fontSize: 16, color: C.text }}>Total Amount</td>
                    <td style={{ padding: '12px 0 0 0', textAlign: 'right', fontWeight: 700, fontSize: 18, color: C.primary }}>ETB {parseFloat(selectedQuote.total_amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {selectedQuote.notes && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: C.textLight, fontWeight: 600, marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 14, color: C.text, fontStyle: 'italic', background: '#fef3c7', padding: '10px 14px', borderRadius: 6 }}>{selectedQuote.notes}</div>
                </div>
              )}

              {selectedQuote.status === 'Recorded' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 30 }}>
                  <button onClick={() => handleAction('convert', selectedQuote.id)} style={{ padding: '12px', borderRadius: 8, background: C.success, color: C.white, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ShoppingCart size={18} /> Convert to Purchase
                  </button>
                  <button onClick={() => handleAction('cancel', selectedQuote.id)} style={{ padding: '12px', borderRadius: 8, background: C.white, border: `1px solid ${C.danger}`, color: C.danger, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Trash2 size={18} /> Cancel Quotation
                  </button>
                </div>
              )}

              {selectedQuote.status === 'Converted' && (
                <div style={{ textAlign: 'center', padding: 14, background: C.success, color: C.white, fontWeight: 600, borderRadius: 8, marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle size={18} /> This quotation has been converted to a Purchase Order.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? C.danger : C.success, color: C.white, padding: '12px 20px', borderRadius: 8, fontWeight: 600, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'error' ? <X size={18} /> : <CheckCircle size={18} />}
          {toast.msg}
        </div>
      )}

    </div>
  );
};

export default PurchaseSupplierQuotations;
