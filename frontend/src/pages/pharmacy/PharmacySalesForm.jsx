import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  ShoppingCart, DollarSign, CreditCard, Smartphone, Banknote,
  CheckCircle, XCircle, Plus, Trash2, RefreshCw, List, Eye,
  History, Search, User, Phone, Building2, Hash, Wallet
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: <DollarSign size={16} /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard size={16} /> },
  { value: 'TELBIR', label: 'Telbir', icon: <Smartphone size={16} /> },
];

const SALE_TYPES = [
  { value: 'WALK-IN', label: 'Walk-In', icon: <ShoppingCart size={16} /> },
  { value: 'ONLINE', label: 'Online', icon: <Smartphone size={16} /> },
];

const EMPTY_ITEM = { drug_name: '', quantity: '', unit_price: '' };

export default function PharmacySalesForm() {
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('create');
  const [sales, setSales] = useState([]);
  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [drugSuggestions, setDrugSuggestions] = useState([]);
  const [showDrugDropdown, setShowDrugDropdown] = useState(null);
  const [loading, setLoading] = useState(false);

  const [saleType, setSaleType] = useState('WALK-IN');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telbirNumber, setTelbirNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');

  const grandTotal = items.reduce((sum, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  useEffect(() => { setPaymentAmount(grandTotal > 0 ? grandTotal.toFixed(2) : ''); }, [grandTotal]);

  useEffect(() => { loadBranches(); loadWorkers(); loadProducts(); loadSales(); }, []);

  const loadBranches = async () => {
    try { const res = await apiClient.get('/pharmacy/branches'); if (res.status === 'success') setBranches(res.data || []); } catch (e) { console.error(e); }
  };

  const loadWorkers = async () => {
    try { const res = await apiClient.get('/pharmacy/workers'); if (res.status === 'success') setWorkers(res.data || []); } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try { const res = await apiClient.get('/pharmacy/products'); if (res.status === 'success') setProducts(res.data || []); } catch (e) { console.error(e); }
  };

  const loadSales = async () => {
    try { const res = await apiClient.get('/pharmacy/sales'); if (res.status === 'success') setSales(res.data || []); } catch (e) { console.error(e); }
  };

  const loadAuditTrail = async () => {
    try { const res = await apiClient.get('/pharmacy/audit-trail'); if (res.status === 'success') setAuditTrail(res.data || []); } catch (e) { console.error(e); }
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((row, i) => (i !== idx ? row : { ...row, [field]: value })));
  };

  const addRow = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const filterDrugs = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q)).slice(0, 8);
  };

  const selectDrug = (idx, name) => {
    updateItem(idx, 'drug_name', name);
    setShowDrugDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(row => row.drug_name.trim() && row.quantity && row.unit_price);
    if (validItems.length === 0) { showToast('Please add at least one item', 'warning'); return; }
    if (!recipientName.trim()) { showToast('Enter recipient name', 'warning'); return; }
    if (!recipientPhone.trim()) { showToast('Enter recipient phone', 'warning'); return; }
    if (!branchId) { showToast('Select a branch', 'warning'); return; }

    const selectedBranch = branches.find(b => b.id === parseInt(branchId) || b.branch_id === parseInt(branchId));
    const payload = {
      branch_id: parseInt(branchId),
      worker_id: workers[0]?.id || null,
      sale_type: saleType,
      items: validItems.map(row => ({
        drug_name: row.drug_name,
        quantity: parseFloat(row.quantity),
        unit_price: parseFloat(row.unit_price),
      })),
      payment: {
        method: paymentMethod,
        amount: parseFloat(paymentAmount) || grandTotal,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        branch_name: selectedBranch?.name || selectedBranch?.branch_name || '',
        worker_name: workerName,
        status: paymentStatus,
      },
    };

    if (paymentMethod === 'BANK_TRANSFER') {
      payload.payment.bank_name = bankName;
      payload.payment.account_holder = accountHolder;
      payload.payment.account_number = accountNumber;
    }
    if (paymentMethod === 'TELBIR') {
      payload.payment.telbir_number = telbirNumber;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/pharmacy/sales', payload);
      if (res.status === 'success') {
        showToast('Sale recorded successfully', 'success');
        playSound('success');
        resetForm();
        loadSales();
        setTab('list');
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to create sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setItems([{ ...EMPTY_ITEM }]);
    setRecipientName('');
    setRecipientPhone('');
    setPaymentAmount('');
    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setTelbirNumber('');
    setPayerName('');
    setPayerPhone('');
    setBranchId('');
    setWorkerName('');
    setPaymentStatus('PAID');
    setPaymentMethod('CASH');
    setSaleType('WALK-IN');
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={22} color="#059669" /> Pharmacy Sales
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Create and manage pharmacy sale transactions</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setTab('create'); resetForm(); }} style={tabBtn(tab === 'create')}>
          <Plus size={15} /> New Sale
        </button>
        <button onClick={() => { setTab('list'); loadSales(); }} style={tabBtn(tab === 'list')}>
          <List size={15} /> Sales ({sales.length})
        </button>
        <button onClick={() => {
          setShowAudit(!showAudit);
          if (!showAudit) loadAuditTrail();
        }} style={tabBtn(showAudit)}>
          <History size={15} /> Audit Trail
        </button>
        <button onClick={() => { loadBranches(); loadWorkers(); loadProducts(); loadSales(); }}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* CREATE TAB */}
      {tab === 'create' && (
        <form onSubmit={handleSubmit}>
          {/* Paper-style card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {/* Blue Header */}
            <div style={{ background: '#224f94', color: 'white', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 8 }}>SUTANA</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Sales Transaction</h2>
                  <p style={{ margin: 0, fontSize: 10, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Flow 4 — Worker Sale Entry (A2/A3)</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 150, height: 150, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.6 }}></div>
              <div style={{ position: 'absolute', bottom: -8, right: 80, width: 50, height: 50, background: '#1c3d70', borderRadius: '12px' }}></div>
              <div style={{ zIndex: 10, display: 'flex', gap: 6 }}>
                <Banknote size={20} color="#93c5fd" />
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Sale Type */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Sale Channel *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {SALE_TYPES.map(st => (
                    <label key={st.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                      border: `2px solid ${saleType === st.value ? '#059669' : '#E2E8F0'}`,
                      borderRadius: 8, cursor: 'pointer', background: saleType === st.value ? '#ECFDF5' : 'white',
                      fontWeight: 600, fontSize: 13, color: saleType === st.value ? '#065F46' : '#475569',
                    }}>
                      <input type="radio" name="saleType" value={st.value} checked={saleType === st.value}
                        onChange={() => setSaleType(st.value)} style={{ display: 'none' }} />
                      {st.icon} {st.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Drug Items *</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ ...thStyle, width: '40%' }}>Drug Name</th>
                        <th style={{ ...thStyle, textAlign: 'center', width: '20%' }}>Quantity</th>
                        <th style={{ ...thStyle, textAlign: 'center', width: '20%' }}>Unit Price (ETB)</th>
                        <th style={{ ...thStyle, textAlign: 'right', width: '15%' }}>Total</th>
                        <th style={{ ...thStyle, width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => {
                        const qty = parseFloat(row.quantity) || 0;
                        const price = parseFloat(row.unit_price) || 0;
                        const total = qty * price;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td style={{ padding: '8px 12px', position: 'relative' }}>
                              <input type="text" value={row.drug_name}
                                onChange={e => { updateItem(idx, 'drug_name', e.target.value); setShowDrugDropdown(idx); }}
                                onFocus={() => setShowDrugDropdown(idx)}
                                onBlur={() => setTimeout(() => setShowDrugDropdown(null), 200)}
                                placeholder="Search drug..." style={{ ...inputStyle(), fontSize: 12, padding: '8px 10px' }} />
                              {showDrugDropdown === idx && row.drug_name.trim() && filterDrugs(row.drug_name).length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 12, right: 12, zIndex: 50, background: 'white', border: '1px solid #E2E8F0', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflow: 'auto' }}>
                                  {filterDrugs(row.drug_name).map(p => (
                                    <div key={p.id} onMouseDown={() => selectDrug(idx, p.name)}
                                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>{p.name}</span>
                                      <span style={{ color: '#64748B', fontSize: 11 }}>{p.stock_quantity || 0} in stock</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input type="number" min="0" step="1" value={row.quantity}
                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                style={{ ...inputStyle(), width: 80, textAlign: 'center', padding: '8px' }} placeholder="0" />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input type="number" min="0" step="0.01" value={row.unit_price}
                                onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                style={{ ...inputStyle(), width: 100, textAlign: 'center', padding: '8px' }} placeholder="0.00" />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>
                              {total > 0 ? `${total.toFixed(2)} ETB` : '—'}
                            </td>
                            <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                              {items.length > 1 && (
                                <button type="button" onClick={() => removeRow(idx)}
                                  style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#F0FDF4', borderTop: '2px solid #E2E8F0' }}>
                        <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 700, color: '#065F46', fontSize: 13, textAlign: 'right' }}>
                          GRAND TOTAL:
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: 16 }}>
                          {grandTotal > 0 ? `${grandTotal.toFixed(2)} ETB` : '—'}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button type="button" onClick={addRow}
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#EFF6FF', color: '#1D4ED8', border: '1px dashed #93C5FD', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Plus size={14} /> Add Another Item
                </button>
              </div>

              {/* Customer Details */}
              <div style={{ marginBottom: 20, background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} color="#059669" /> Recipient Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                      placeholder="Recipient full name" style={inputStyle()} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input type="text" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+251..." style={inputStyle()} />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Payment Method *</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.map(pm => (
                    <label key={pm.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                      border: `2px solid ${paymentMethod === pm.value ? '#059669' : '#E2E8F0'}`,
                      borderRadius: 8, cursor: 'pointer', background: paymentMethod === pm.value ? '#ECFDF5' : 'white',
                      fontWeight: 600, fontSize: 13, color: paymentMethod === pm.value ? '#065F46' : '#475569',
                    }}>
                      <input type="radio" name="paymentMethod" value={pm.value} checked={paymentMethod === pm.value}
                        onChange={() => setPaymentMethod(pm.value)} style={{ display: 'none' }} />
                      {pm.icon} {pm.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Detail Fields — CASH */}
              {paymentMethod === 'CASH' && (
                <div style={{ marginBottom: 20, background: '#FFFBEB', borderRadius: 8, padding: 16, border: '1px solid #FDE68A' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={16} color="#D97706" /> Cash Payment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Amount Received *</label>
                      <input type="number" step="0.01" min="0" value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Recipient Full Name *</label>
                      <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                        placeholder="Who received cash" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Recipient Phone</label>
                      <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                        placeholder="Phone" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Branch *</label>
                      <select value={branchId} onChange={e => setBranchId(e.target.value)} style={inputStyle()}>
                        <option value="">— Select branch —</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Worker Name *</label>
                      <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                        placeholder="Your name" style={inputStyle()} />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Detail Fields — BANK TRANSFER */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div style={{ marginBottom: 20, background: '#EFF6FF', borderRadius: 8, padding: 16, border: '1px solid #BFDBFE' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={16} color="#2563EB" /> Bank Transfer Payment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Amount Received *</label>
                      <input type="number" step="0.01" min="0" value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Bank Name *</label>
                      <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. CBE" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Account Holder *</label>
                      <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                        placeholder="Full name on account" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Account Number *</label>
                      <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                        placeholder="Account number" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                        placeholder="Phone" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Branch *</label>
                      <select value={branchId} onChange={e => setBranchId(e.target.value)} style={inputStyle()}>
                        <option value="">— Select branch —</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Worker Name *</label>
                      <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                        placeholder="Your name" style={inputStyle()} />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Detail Fields — TELBIR */}
              {paymentMethod === 'TELBIR' && (
                <div style={{ marginBottom: 20, background: '#F5F3FF', borderRadius: 8, padding: 16, border: '1px solid #DDD6FE' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Smartphone size={16} color="#7C3AED" /> Telbir Payment
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Amount Received *</label>
                      <input type="number" step="0.01" min="0" value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Telbir Number *</label>
                      <input type="text" value={telbirNumber} onChange={e => setTelbirNumber(e.target.value)}
                        placeholder="Telbir number" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                        placeholder="Sender full name" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                        placeholder="Phone" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}>Branch *</label>
                      <select value={branchId} onChange={e => setBranchId(e.target.value)} style={inputStyle()}>
                        <option value="">— Select branch —</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Worker Name *</label>
                      <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                        placeholder="Your name" style={inputStyle()} />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status Buttons A14 */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Payment Status (A14) *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setPaymentStatus('PAID')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 24px', borderRadius: 8, border: `2px solid ${paymentStatus === 'PAID' ? '#059669' : '#E2E8F0'}`,
                      background: paymentStatus === 'PAID' ? '#D1FAE5' : 'white',
                      color: paymentStatus === 'PAID' ? '#065F46' : '#475569',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      boxShadow: paymentStatus === 'PAID' ? '0 2px 8px rgba(5,150,105,0.2)' : 'none',
                    }}>
                    <CheckCircle size={20} /> PAID
                  </button>
                  <button type="button" onClick={() => setPaymentStatus('CASHOUT')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 24px', borderRadius: 8, border: `2px solid ${paymentStatus === 'CASHOUT' ? '#D97706' : '#E2E8F0'}`,
                      background: paymentStatus === 'CASHOUT' ? '#FEF3C7' : 'white',
                      color: paymentStatus === 'CASHOUT' ? '#92400E' : '#475569',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      boxShadow: paymentStatus === 'CASHOUT' ? '0 2px 8px rgba(217,119,6,0.2)' : 'none',
                    }}>
                    <Banknote size={20} /> CASHOUT
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px 24px', background: '#059669', color: 'white', border: 'none',
                  borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}>
                <ShoppingCart size={18} /> {loading ? 'Processing...' : `Record Sale — ${grandTotal > 0 ? grandTotal.toFixed(2) : '0.00'} ETB`}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LIST TAB */}
      {tab === 'list' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <List size={16} color="#059669" /> Sales History
            </h3>
            <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{sales.length} records</span>
          </div>
          {sales.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No sales recorded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Recipient</th>
                  <th style={thStyle}>Items</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => {
                  const itemsList = s.items || [];
                  const itemCount = itemsList.length || (s.drug_name ? 1 : 0);
                  const amount = parseFloat(s.payment?.amount || s.total_amount || 0);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={tdStyle}>{s.sale_no || s.id}</td>
                      <td style={tdStyle}>
                        <span style={{ background: s.sale_type === 'WALK-IN' ? '#D1FAE5' : '#EFF6FF', color: s.sale_type === 'WALK-IN' ? '#065F46' : '#1E40AF', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {s.sale_type || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.payment?.recipient_name || s.recipient_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{s.payment?.recipient_phone || ''}</div>
                      </td>
                      <td style={tdStyle}>
                        {itemsList.length > 0 ? (
                          <div style={{ fontSize: 11, color: '#475569' }}>
                            {itemsList.slice(0, 2).map((it, idx) => (
                              <div key={idx}>{it.drug_name} × {it.quantity}</div>
                            ))}
                            {itemsList.length > 2 && <div style={{ color: '#64748B' }}>+{itemsList.length - 2} more</div>}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11 }}>{s.drug_name} × {s.quantity || 0}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#059669' }}>{amount.toFixed(2)} ETB</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, color: '#475569' }}>{s.payment?.method || '—'}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: s.payment?.status === 'PAID' ? '#D1FAE5' : s.payment?.status === 'CASHOUT' ? '#FEF3C7' : '#F1F5F9',
                          color: s.payment?.status === 'PAID' ? '#065F46' : s.payment?.status === 'CASHOUT' ? '#92400E' : '#475569',
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        }}>
                          {s.payment?.status || '—'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => { setDetail(s); setTab('detail'); }}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* AUDIT TRAIL */}
      {showAudit && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#8B5CF6" /> Audit Trail
            </h3>
            <button onClick={loadAuditTrail} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {auditTrail.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No audit trail entries.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}><Building2 size={13} /> Branch</th>
                  <th style={thStyle}><User size={13} /> Worker</th>
                  <th style={thStyle}><Hash size={13} /> Action</th>
                  <th style={thStyle}><User size={13} /> Recipient</th>
                  <th style={thStyle}><Wallet size={13} /> Amount</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((a, i) => (
                  <tr key={a.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}>{a.branch_name || a.branch || '—'}</td>
                    <td style={tdStyle}>{a.worker_name || a.worker || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                        {a.action || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{a.recipient_name || a.recipient || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {a.amount ? `${parseFloat(a.amount).toFixed(2)} ETB` : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* DETAIL TAB */}
      {tab === 'detail' && detail && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={16} color="#059669" /> Sale Detail
            </h3>
            <button onClick={() => setTab('list')}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Back to List
            </button>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Sale #</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{detail.sale_no || detail.id}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Type</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{detail.sale_type || '—'}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                  {parseFloat(detail.payment?.amount || detail.total_amount || 0).toFixed(2)} ETB
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} color="#059669" /> Recipient
                </h4>
                <div style={{ fontSize: 13, marginBottom: 4 }}><strong>{detail.payment?.recipient_name || detail.recipient_name || '—'}</strong></div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{detail.payment?.recipient_phone || ''}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={14} color="#059669" /> Payment
                </h4>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Method:</strong> {detail.payment?.method || '—'}
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    background: detail.payment?.status === 'PAID' ? '#D1FAE5' : '#FEF3C7',
                    color: detail.payment?.status === 'PAID' ? '#065F46' : '#92400E',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>{detail.payment?.status || '—'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {detail.payment?.bank_name && <div>Bank: {detail.payment.bank_name}</div>}
                  {detail.payment?.account_holder && <div>Account: {detail.payment.account_holder}</div>}
                  {detail.payment?.telbir_number && <div>Telbir: {detail.payment.telbir_number}</div>}
                  {detail.payment?.branch_name && <div>Branch: {detail.payment.branch_name}</div>}
                  {detail.payment?.worker_name && <div>Worker: {detail.payment.worker_name}</div>}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#1E293B' }}>Items</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ ...thStyle, width: '50%' }}>Drug</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Unit Price</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || [detail]).map((it, idx) => {
                    const itemQty = parseFloat(it.quantity) || 0;
                    const itemPrice = parseFloat(it.unit_price) || 0;
                    const itemTotal = itemQty * itemPrice;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={tdStyle}>{it.drug_name}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{itemQty}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{itemPrice.toFixed(2)} ETB</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{itemTotal.toFixed(2)} ETB</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
