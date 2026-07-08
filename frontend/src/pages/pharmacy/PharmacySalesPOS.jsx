import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = '/api/pharmacy-sales';
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PharmacySalesPOS() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [drugs, setDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState('WALK_IN');
  const [customerId, setCustomerId] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [payment, setPayment] = useState({ method: 'CASH', telebirr_number: '', telebirr_transaction_ref: '', bank_name: '', account_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [recentSales, setRecentSales] = useState([]);
  const [view, setView] = useState('pos'); // pos | sales | handover

  // Handover form
  const [handover, setHandover] = useState({ amount: '', handed_to: '' });
  const [handovers, setHandovers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadDrugs();
    loadBranches();
    loadRecentSales();
    loadPrescriptions();
  }, []);

  const loadDrugs = async (q = '') => {
    const res = await axios.get(`${API}/drugs`, { params: { search: q }, headers });
    setDrugs(res.data.data || []);
  };

  const loadBranches = async () => {
    const res = await axios.get(`${API}/branches`, { headers });
    setBranches(res.data.data || []);
  };

  const loadRecentSales = async () => {
    try {
      const res = await axios.get(`${API}/sales?limit=20`, { headers });
      setRecentSales(res.data.data || []);
    } catch { }
  };

  const loadPrescriptions = async () => {
    try {
      const res = await axios.get(`${API}/prescriptions?status=SUBMITTED`, { headers });
      setPrescriptions(res.data.data || []);
    } catch { }
  };

  const loadHandovers = async () => {
    const res = await axios.get(`${API}/handovers`, { headers });
    setHandovers(res.data.data || []);
  };

  const addToCart = (drug) => {
    setCart(c => {
      const ex = c.find(i => i.drug_id === drug.id);
      if (ex) return c.map(i => i.drug_id === drug.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { drug_id: drug.id, name: drug.name, unit_price: drug.unit_price, vat_rate: drug.vat_rate || 0, quantity: 1, requires_prescription: drug.requires_prescription }];
    });
  };

  const updateCartQty = (drug_id, qty) => {
    if (qty < 1) return;
    setCart(c => c.map(i => i.drug_id === drug_id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (drug_id) => setCart(c => c.filter(i => i.drug_id !== drug_id));

  const totals = cart.reduce((acc, item) => {
    const sub = item.unit_price * item.quantity;
    const vat = (sub * item.vat_rate) / 100;
    return { subtotal: acc.subtotal + sub, vat: acc.vat + vat, total: acc.total + sub + vat };
  }, { subtotal: 0, vat: 0, total: 0 });

  const needsRx = cart.some(i => i.requires_prescription);

  const handleSale = async () => {
    if (!branchId || !workerId) { setError('Branch and Worker ID are required.'); return; }
    if (cart.length === 0) { setError('Cart is empty.'); return; }
    if (needsRx && !prescriptionId) { setError('One or more items require a prescription. Please link a prescription first.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(`${API}/sales`, {
        branch_id: branchId, worker_id: workerId,
        sale_type: saleType, customer_id: customerId || undefined,
        prescription_id: prescriptionId || undefined,
        items: cart.map(i => ({ drug_id: i.drug_id, quantity: i.quantity })),
        payment,
      }, { headers });
      setReceipt(res.data.data);
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale');
    }
    setSubmitting(false);
  };

  const handleHandover = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/handovers`, { worker_id: workerId, branch_id: branchId, ...handover }, { headers });
      setHandover({ amount: '', handed_to: '' });
      loadHandovers();
      alert('Cash handover recorded.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record handover');
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Top bar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 22 }}>💊</span>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>Pharmacy POS — Flow 4</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['pos', 'sales', 'handover'].map(v => (
            <button key={v} onClick={() => { setView(v); if (v === 'sales') loadRecentSales(); if (v === 'handover') loadHandovers(); }}
              style={{ background: view === v ? 'rgba(56,189,248,0.15)' : 'transparent', border: '1px solid', borderColor: view === v ? '#38bdf8' : '#334155', color: view === v ? '#38bdf8' : '#94a3b8', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {v === 'pos' ? '🛒 POS' : v === 'sales' ? '📊 Sales History' : '💰 Cash Handover'}
            </button>
          ))}
        </div>
      </div>

      {/* POS VIEW */}
      {view === 'pos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 0, height: 'calc(100vh - 57px)' }}>
          {/* Left: Drug search */}
          <div style={{ padding: 24, overflowY: 'auto', borderRight: '1px solid #1e3a5f' }}>
            {/* Config row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <select value={branchId} onChange={e => setBranchId(e.target.value)}
                style={selectStyle}>
                <option value="">Select Branch *</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input placeholder="Worker ID *" value={workerId} onChange={e => setWorkerId(e.target.value)}
                style={{ ...inputStyle, width: 120 }} />
              <select value={saleType} onChange={e => setSaleType(e.target.value)} style={selectStyle}>
                <option value="WALK_IN">Walk-In</option>
                <option value="ONLINE">Online</option>
              </select>
              <input placeholder="Customer ID (optional)" value={customerId} onChange={e => setCustomerId(e.target.value)}
                style={{ ...inputStyle, width: 160 }} />
              <select value={prescriptionId} onChange={e => setPrescriptionId(e.target.value)}
                style={{ ...selectStyle, width: 220 }}>
                <option value="">No Prescription</option>
                {prescriptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reference_code} - {p.customer_name || 'Guest'} ({p.drug_name || p.drug_name_text || 'Rx'})
                  </option>
                ))}
              </select>
            </div>

            {/* Drug search */}
            <input
              style={{ ...inputStyle, width: '100%', marginBottom: 20, fontSize: 15, padding: '12px 16px' }}
              placeholder="🔍 Search drug by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); loadDrugs(e.target.value); }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {drugs.map(d => (
                <div key={d.id} onClick={() => addToCart(d)}
                  style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>💊</span>
                    {d.requires_prescription && <span style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 9, padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>Rx</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{d.strength} · {d.unit}</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: 14 }}>ETB {parseFloat(d.unit_price || 0).toFixed(2)}</div>
                  {d.vat_rate > 0 && <div style={{ fontSize: 10, color: '#64748b' }}>+{d.vat_rate}% VAT</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart + Payment */}
          <div style={{ background: '#0f172a', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {receipt ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ color: '#10b981', fontSize: 20, marginBottom: 8 }}>Sale Complete!</h3>
                <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'left' }}>
                  <div style={receiptRow}><span>Sale Code</span><span style={{ color: '#38bdf8', fontWeight: 700 }}>{receipt.sale_code}</span></div>
                  <div style={receiptRow}><span>Receipt</span><span style={{ color: '#a78bfa' }}>{receipt.receipt_code}</span></div>
                  <div style={receiptRow}><span>Subtotal</span><span>{fmt(receipt.subtotal)}</span></div>
                  <div style={receiptRow}><span>VAT</span><span>{fmt(receipt.vat_amount)}</span></div>
                  <div style={{ ...receiptRow, borderTop: '1px solid #334155', paddingTop: 10, marginTop: 10 }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#10b981' }}>{fmt(receipt.total_amount)}</span>
                  </div>
                </div>
                <button onClick={() => setReceipt(null)} style={{ ...btnPrimary, width: '100%' }}>New Sale</button>
              </div>
            ) : (
              <>
                <h3 style={{ color: '#f1f5f9', fontWeight: 700 }}>🛒 Cart ({cart.length} items)</h3>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                    <p>Click a drug to add to cart</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {cart.map(item => (
                      <div key={item.drug_id} style={{ background: '#1e293b', borderRadius: 10, padding: 14, border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                          <button onClick={() => removeFromCart(item.drug_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button onClick={() => updateCartQty(item.drug_id, item.quantity - 1)} style={qtyBtn}>−</button>
                          <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.drug_id, item.quantity + 1)} style={qtyBtn}>+</button>
                          <span style={{ marginLeft: 'auto', color: '#38bdf8', fontWeight: 700 }}>
                            {fmt(item.unit_price * item.quantity)}
                          </span>
                        </div>
                        {item.vat_rate > 0 && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>VAT {item.vat_rate}% = {fmt(item.unit_price * item.quantity * item.vat_rate / 100)}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {cart.length > 0 && (
                  <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
                    <div style={receiptRow}><span style={{ color: '#94a3b8' }}>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
                    <div style={receiptRow}><span style={{ color: '#94a3b8' }}>VAT</span><span>{fmt(totals.vat)}</span></div>
                    <div style={{ ...receiptRow, fontSize: 18, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid #334155' }}>
                      <span>Total</span><span style={{ color: '#10b981' }}>{fmt(totals.total)}</span>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>💳 Payment Method</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {['CASH', 'BANK_TRANSFER', 'TELEBIRR'].map(m => (
                      <button key={m} onClick={() => setPayment(p => ({ ...p, method: m }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: payment.method === m ? 700 : 400, background: payment.method === m ? 'rgba(56,189,248,0.15)' : 'transparent', borderColor: payment.method === m ? '#38bdf8' : '#334155', color: payment.method === m ? '#38bdf8' : '#94a3b8' }}>
                        {m === 'CASH' ? '💵 Cash' : m === 'BANK_TRANSFER' ? '🏦 Bank' : '📱 Telebirr'}
                      </button>
                    ))}
                  </div>
                  {payment.method === 'TELEBIRR' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input placeholder="Telebirr Number" value={payment.telebirr_number} onChange={e => setPayment(p => ({ ...p, telebirr_number: e.target.value }))} style={inputStyle} />
                      <input placeholder="Transaction Reference" value={payment.telebirr_transaction_ref} onChange={e => setPayment(p => ({ ...p, telebirr_transaction_ref: e.target.value }))} style={inputStyle} />
                    </div>
                  )}
                  {payment.method === 'BANK_TRANSFER' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input placeholder="Bank Name" value={payment.bank_name} onChange={e => setPayment(p => ({ ...p, bank_name: e.target.value }))} style={inputStyle} />
                      <input placeholder="Account Number" value={payment.account_number} onChange={e => setPayment(p => ({ ...p, account_number: e.target.value }))} style={inputStyle} />
                    </div>
                  )}
                </div>

                {needsRx && !prescriptionId && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: 12, color: '#fca5a5', fontSize: 13 }}>
                    ⚠️ Cart contains Rx-only drugs. Enter the prescription ID above.
                  </div>
                )}
                {error && <div style={{ color: '#fca5a5', fontSize: 13, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}
                <button onClick={handleSale} disabled={submitting || cart.length === 0}
                  style={{ ...btnPrimary, opacity: submitting || cart.length === 0 ? 0.5 : 1, fontSize: 16, padding: '14px' }}>
                  {submitting ? 'Processing…' : `✅ Complete Sale — ${fmt(totals.total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SALES HISTORY VIEW */}
      {view === 'sales' && (
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>📊 Recent Sales</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                  {['Sale Code', 'Branch', 'Worker', 'Customer', 'Type', 'Total (ETB)', 'VAT', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b', borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 600 }}>{s.sale_code}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.branch_name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.worker_name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.customer_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: s.sale_type === 'WALK_IN' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: s.sale_type === 'WALK_IN' ? '#34d399' : '#60a5fa', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {s.sale_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>{parseFloat(s.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{parseFloat(s.vat_amount).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: s.status === 'COMPLETED' ? '#10b981' : s.status === 'VOIDED' ? '#ef4444' : '#f59e0b', fontWeight: 600, fontSize: 12 }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASH HANDOVER VIEW */}
      {view === 'handover' && (
        <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>💰 Cash Handover</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: 20, color: '#f1f5f9' }}>Record Handover</h3>
              <form onSubmit={handleHandover} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={labelStyle}>Worker ID<input value={workerId} readOnly style={inputStyle} placeholder="Set Worker ID in POS first" /></label>
                <label style={labelStyle}>Branch ID<input value={branchId} readOnly style={inputStyle} placeholder="Set Branch in POS first" /></label>
                <label style={labelStyle}>Amount (ETB) *<input type="number" step="0.01" required value={handover.amount} onChange={e => setHandover(h => ({ ...h, amount: e.target.value }))} style={inputStyle} /></label>
                <label style={labelStyle}>Handed To (User ID) *<input required value={handover.handed_to} onChange={e => setHandover(h => ({ ...h, handed_to: e.target.value }))} style={inputStyle} /></label>
                <button type="submit" style={{ ...btnPrimary, marginTop: 8 }}>Record Handover</button>
              </form>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: 20, color: '#f1f5f9' }}>Recent Handovers</h3>
              {handovers.length === 0 ? <p style={{ color: '#475569' }}>No handovers recorded yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {handovers.map(h => (
                    <div key={h.id} style={{ background: '#0f172a', borderRadius: 10, padding: 14, border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>ETB {parseFloat(h.amount).toFixed(2)}</span>
                        <span style={{ fontSize: 11, color: h.status === 'SETTLED' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{h.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Worker: {h.worker_name || h.worker_id}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>To: {h.received_by || h.handed_to}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '9px 13px', borderRadius: 8, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', width: '100%' };
const selectStyle = { ...inputStyle };
const btnPrimary = { background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 14 };
const qtyBtn = { background: '#334155', border: 'none', color: '#e2e8f0', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const receiptRow = { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14, color: '#94a3b8' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#94a3b8', fontWeight: 500 };
