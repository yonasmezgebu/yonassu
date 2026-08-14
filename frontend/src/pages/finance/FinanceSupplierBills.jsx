import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, CheckCircle, Paperclip, Loader2 } from 'lucide-react';
import api from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';

const fmtETB = (n) => 'ETB ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FinanceSupplierBills = () => {
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [billNo, setBillNo] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [poRef, setPoRef] = useState('');

  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0.15);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [billRes, supRes] = await Promise.all([
        api.get('/finance-supplier/bills'),
        api.get('/finance-supplier/suppliers'),
      ]);
      setBills(Array.isArray(billRes.data) ? billRes.data : []);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
    } catch (err) {
      console.error('Failed to load supplier bills:', err);
      setBills([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.unitPrice) || 0)), 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleSupplierSelect = (value) => {
    setSupplierId(value);
    const sup = suppliers.find(s => String(s.id) === String(value));
    setSupplierName(sup ? sup.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName) return alert("Please select a supplier.");
    setSaving(true);
    try {
      await api.post('/finance-supplier/bills', {
        supplierId: supplierId || null,
        supplierName,
        billNo,
        dateReceived,
        dueDate: dueDate || dateReceived,
        poRef,
        subtotal,
        taxAmount,
        totalAmount,
        items,
      });
      submitNotification('📄 Supplier Bill Received', '📄 New Bill - Click to View');
      setShowForm(false);
      setSupplierId(''); setSupplierName(''); setBillNo(''); setPoRef(''); setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to record bill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c' }}>
            <FileText color="#f97316" size={28} /> SUPPLIER BILLS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Record incoming bills and invoices from suppliers. Persisted to the database.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={16} /> Record Bill
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>New Supplier Bill</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier *</label>
                <select required value={supplierId} onChange={e => handleSupplierSelect(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supplier Bill # *</label><input required value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. INV-2026-001" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date Received *</label><input required type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Due Date *</label><input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>PO Reference</label><input value={poRef} onChange={e => setPoRef(e.target.value)} placeholder="e.g. PO-1234" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} /></div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Attachments</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: 6, color: '#64748b', cursor: 'pointer' }}><Paperclip size={16}/> Upload Invoice File</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Items/Services</h4>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <input required placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <input required type="number" step="0.01" placeholder="Unit Price" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }} />
                  <div style={{ padding: '8px', background: '#e2e8f0', borderRadius: 6, textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                     {fmtETB(item.quantity * (parseFloat(item.unitPrice) || 0))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddItem} style={{ fontSize: 12, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Another Item</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
               <div style={{ width: 300, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}><span>Subtotal:</span> <span>{fmtETB(subtotal)}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#475569' }}><span>Tax (15%):</span> <span>{fmtETB(taxAmount)}</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}><span>Total:</span> <span>{fmtETB(totalAmount)}</span></div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '8px 24px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving && <Loader2 size={14} className="spin" />} {saving ? 'Saving...' : 'Record Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Bill #', 'Date Recvd', 'Supplier', 'Due Date', 'Total', 'Amount Paid', 'Balance', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Actions' || col.includes('Amount') || col === 'Total' || col === 'Balance' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading bills...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No supplier bills yet — record your first bill.</td></tr>
            ) : bills.map(bill => {
              const balance = (Number(bill.total_amount) || 0) - (Number(bill.amount_paid) || 0);
              return (
                <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ea580c', fontFamily: 'monospace' }}>{bill.bill_number}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(bill.date_received).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{bill.supplier_name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>{fmtETB(bill.total_amount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#16a34a' }}>{fmtETB(bill.amount_paid)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: balance > 0 ? '#dc2626' : '#16a34a' }}>{fmtETB(balance)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: bill.status === 'Paid' ? '#dcfce7' : bill.status === 'Overdue' ? '#fee2e2' : '#fef3c7',
                      color: bill.status === 'Paid' ? '#16a34a' : bill.status === 'Overdue' ? '#dc2626' : '#d97706'
                    }}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {balance > 0 && (
                      <a
                        href={`/finance/supplier-payments?billRef=${bill.bill_number}&supplier=${encodeURIComponent(bill.supplier_name)}`}
                        style={{ padding: '4px 10px', background: '#f59e0b', color: 'white', borderRadius: 4, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                      >
                        Pay
                      </a>
                    )}
                    <button style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="View Attachment"><CheckCircle size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default FinanceSupplierBills;
