import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadVatSafe, getVatForItem } from '../../services/vatService';

const API = '/api/pharmacy-sales';
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'Inter', sans-serif",
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
  },
  topbar: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  logoText: { fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
  tabBar: { display: 'flex', gap: 4, marginLeft: 'auto' },
  tab: (active) => ({
    padding: '7px 18px', border: '1px solid', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 700 : 500,
    background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
    borderColor: active ? '#2563eb' : '#e5e7eb',
    color: active ? '#2563eb' : '#6b7280',
    transition: 'all 0.15s',
  }),
  posGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 420px',
    height: 'calc(100vh - 60px)',
  },
  left: {
    padding: 24,
    overflowY: 'auto',
    borderRight: '1px solid #e5e7eb',
  },
  right: {
    background: '#ffffff',
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    fontSize: 13, fontWeight: 700, color: '#374151',
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
  },
  searchInput: {
    width: '100%', padding: '11px 16px',
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
    outline: 'none', background: '#f8fafc',
    transition: 'border-color 0.18s',
    marginBottom: 16,
  },
  configRow: {
    display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap',
  },
  select: {
    padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit', color: '#374151',
    background: '#fff', outline: 'none', cursor: 'pointer', flex: 1,
  },
  input: {
    padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit', color: '#0f172a',
    background: '#fff', outline: 'none', width: '100%',
  },
  drugGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
    gap: 12,
  },
  drugCard: {
    background: '#ffffff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 14, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  drugName: { fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4, lineHeight: 1.3 },
  drugSub: { fontSize: 11, color: '#6b7280', marginBottom: 8 },
  drugPrice: { fontWeight: 800, color: '#2563eb', fontSize: 14 },
  rxBadge: {
    background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
    fontSize: 9, fontWeight: 700, padding: '2px 7px',
    borderRadius: 20, border: '1px solid rgba(124,58,237,0.2)',
  },
  cartItem: {
    background: '#f8fafc', borderRadius: 10, padding: '12px 14px',
    border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8,
  },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 7, border: '1px solid #e5e7eb',
    background: '#f1f5f9', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', color: '#374151', transition: 'all 0.15s',
  },
  totalsCard: {
    background: '#f8fafc', borderRadius: 12, padding: 16,
    border: '1px solid #e5e7eb',
  },
  totalsRow: {
    display: 'flex', justifyContent: 'space-between', padding: '5px 0',
    fontSize: 13, color: '#6b7280',
  },
  payMethodBtn: (active) => ({
    flex: 1, padding: '9px 4px', borderRadius: 8, border: '1.5px solid',
    cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 500,
    background: active ? 'rgba(37,99,235,0.07)' : '#ffffff',
    borderColor: active ? '#2563eb' : '#e5e7eb',
    color: active ? '#2563eb' : '#6b7280',
    transition: 'all 0.15s',
  }),
  btnPrimary: {
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    color: 'white', border: 'none', padding: '13px 20px',
    borderRadius: 10, cursor: 'pointer', fontWeight: 700,
    fontFamily: 'inherit', fontSize: 15, width: '100%',
    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
    transition: 'all 0.18s',
  },
  btnSuccess: {
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: 'white', border: 'none', padding: '13px 20px',
    borderRadius: 10, cursor: 'pointer', fontWeight: 700,
    fontFamily: 'inherit', fontSize: 15, width: '100%',
    boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
    transition: 'all 0.18s',
  },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: `rgba(${color},0.1)`, color: `rgb(${color})`,
    fontSize: 10, fontWeight: 700, padding: '3px 9px',
    borderRadius: 20, border: `1px solid rgba(${color},0.2)`,
  }),
  pendingCard: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: 16, cursor: 'pointer',
    transition: 'all 0.18s',
  },
};

// ── Play Audio ────────────────────────────────────────────────────────────────
const playAudio = (src) => {
  try {
    const a = new Audio(src);
    a.volume = 0.85;
    a.play().catch(() => {});
  } catch {}
};

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ receipt, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 36, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginBottom: 6 }}>Sale Complete!</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Transaction has been recorded.</p>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #e5e7eb', textAlign: 'left' }}>
          {[
            ['Sale Code', receipt.sale_code, '#2563eb'],
            ['Receipt', receipt.receipt_code, '#7c3aed'],
            ['Subtotal', fmt(receipt.subtotal), null],
            ['VAT', fmt(receipt.vat_amount), null],
          ].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#374151' }}>
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ fontWeight: 700, color: color || '#111827' }}>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: 20, fontWeight: 800 }}>
            <span>Total</span><span style={{ color: '#059669' }}>{fmt(receipt.total_amount)}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ ...styles.btnPrimary }}>New Sale</button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PharmacySalesPOS() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // State
  const [view, setView] = useState('pos'); // pos | pending | sales | handover
  const [drugs, setDrugs] = useState([]);
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  const [branches, setBranches] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [saleType, setSaleType] = useState('WALK_IN');
  const [customerId, setCustomerId] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [payment, setPayment] = useState({ method: 'CASH', telebirr_number: '', telebirr_transaction_ref: '', bank_name: '', account_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  // Sales history
  const [recentSales, setRecentSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Pending online orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Handover
  const [handover, setHandover] = useState({ amount: '', handed_to: '' });
  const [handovers, setHandovers] = useState([]);

  useEffect(() => {
    loadDrugs();
    loadBranches();
    loadPrescriptions();
  }, []);

  const loadDrugs = async (q = '') => {
    try {
      const res = await axios.get(`${API}/drugs`, { params: { search: q }, headers });
      setDrugs(res.data.data || []);
    } catch { }
  };

  const loadBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches`, { headers });
      setBranches(res.data.data || []);
    } catch { }
  };

  const loadPrescriptions = async () => {
    try {
      const res = await axios.get(`${API}/prescriptions?status=SUBMITTED`, { headers });
      setPrescriptions(res.data.data || []);
    } catch { }
  };

  const loadRecentSales = async () => {
    setLoadingSales(true);
    try {
      const res = await axios.get(`${API}/sales?limit=50`, { headers });
      setRecentSales(res.data.data || []);
    } catch { }
    setLoadingSales(false);
  };

  const loadPendingOrders = async () => {
    setLoadingPending(true);
    try {
      const res = await axios.get(`${API}/sales/pending`, { headers });
      setPendingOrders(res.data.data || []);
    } catch { }
    setLoadingPending(false);
  };

  const loadHandovers = async () => {
    try {
      const res = await axios.get(`${API}/handovers`, { headers });
      setHandovers(res.data.data || []);
    } catch { }
  };

  // Cart
  const addToCart = (drug) => {
    setCart(c => {
      const ex = c.find(i => i.drug_id === drug.id);
      if (ex) return c.map(i => i.drug_id === drug.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { drug_id: drug.id, name: drug.name, unit_price: drug.unit_price, vat_rate: drug.vat_rate || 0, quantity: 1, requires_prescription: drug.requires_prescription }];
    });
  };

  const updateQty = (drug_id, qty) => {
    if (qty < 1) return;
    setCart(c => c.map(i => i.drug_id === drug_id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (drug_id) => setCart(c => c.filter(i => i.drug_id !== drug_id));

  const totals = vatCtx
    ? cart.reduce((acc, item) => {
        const r = getVatForItem(vatCtx, 'pharmacy', item.drug_id, item.unit_price * item.quantity);
        return { subtotal: acc.subtotal + r.sub, vat: acc.vat + r.vat, total: acc.total + r.total };
      }, { subtotal: 0, vat: 0, total: 0 })
    : cart.reduce((acc, item) => {
        const sub = item.unit_price * item.quantity;
        const vat = (sub * item.vat_rate) / 100;
        return { subtotal: acc.subtotal + sub, vat: acc.vat + vat, total: acc.total + sub + vat };
      }, { subtotal: 0, vat: 0, total: 0 });

  const needsRx = cart.some(i => i.requires_prescription);

  // Load pending order into cart
  const loadPendingIntoCart = (order) => {
    setSelectedPending(order);
    const newCart = (order.items || []).map(item => ({
      drug_id: item.drug_id,
      name: item.drug_name,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate || 0,
      quantity: item.quantity,
      requires_prescription: false,
    }));
    setCart(newCart);
    if (order.branch_id) setBranchId(String(order.branch_id));
    setCustomerId(order.customer_id ? String(order.customer_id) : '');
    setSaleType('ONLINE');
    setView('pos');
  };

  // Complete sale
  const handleSale = async () => {
    if (!branchId || !workerId) { setError('Branch and Worker ID are required.'); return; }
    if (cart.length === 0) { setError('Cart is empty.'); return; }
    if (needsRx && !prescriptionId) { setError('Rx-only drugs require a linked prescription.'); return; }
    setSubmitting(true);
    setError('');

    try {
      let res;
      if (selectedPending) {
        // Process pending online order
        res = await axios.patch(`${API}/sales/${selectedPending.id}/process`, {
          worker_id: parseInt(workerId),
          payment,
        }, { headers });
        // Build a receipt-like object
        res = { data: { data: { ...selectedPending, ...res.data.data, sale_code: selectedPending.sale_code, subtotal: selectedPending.subtotal, vat_amount: selectedPending.vat_amount, total_amount: selectedPending.total_amount } } };
      } else {
        res = await axios.post(`${API}/sales`, {
          branch_id: branchId, worker_id: workerId,
          sale_type: saleType, customer_id: customerId || undefined,
          prescription_id: prescriptionId || undefined,
          items: cart.map(i => ({ drug_id: i.drug_id, quantity: i.quantity })),
          payment,
        }, { headers });
      }

      setReceipt(res.data.data);
      setCart([]);
      setSelectedPending(null);
      setCustomerId('');
      setPrescriptionId('');
      // 🔊 Play cash_out sound
      playAudio(cashOutSound);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale');
      // play error sound
    }
    setSubmitting(false);
  };

  const handleHandover = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/handovers`, { worker_id: workerId, branch_id: branchId, ...handover }, { headers });
      setHandover({ amount: '', handed_to: '' });
      loadHandovers();
      playAudio(successSound);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record handover');
    }
  };

  return (
    <div style={styles.page}>
      {/* Receipt Modal */}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>💊</div>
          <span style={styles.logoText}>Pharmacy POS</span>
        </div>
        {selectedPending && (
          <div style={{ ...styles.badge('124,58,237'), fontSize: 12, padding: '5px 12px' }}>
            📦 Processing Order: {selectedPending.sale_code}
          </div>
        )}
        <div style={styles.tabBar}>
          {[
            { id: 'pos', label: '🛒 POS Checkout' },
            { id: 'pending', label: `📦 Online Orders${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ''}` },
            { id: 'sales', label: '📊 Sales History' },
            { id: 'handover', label: '💰 Cash Handover' },
          ].map(({ id, label }) => (
            <button key={id} style={styles.tab(view === id)}
              onClick={() => {
                setView(id);
                if (id === 'sales') loadRecentSales();
                if (id === 'pending') loadPendingOrders();
                if (id === 'handover') loadHandovers();
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── POS VIEW ── */}
      {view === 'pos' && (
        <div style={styles.posGrid}>
          {/* Left — Drug Catalog */}
          <div style={styles.left}>
            {/* Config */}
            <div style={styles.configRow}>
              <select value={branchId} onChange={e => setBranchId(e.target.value)} style={styles.select}>
                <option value="">Select Branch *</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input placeholder="Worker ID *" value={workerId} onChange={e => setWorkerId(e.target.value)}
                style={{ ...styles.input, width: 130, flex: 'none' }} />
              <select value={saleType} onChange={e => setSaleType(e.target.value)} style={{ ...styles.select, flex: 'none', width: 130 }}>
                <option value="WALK_IN">Walk-In</option>
                <option value="ONLINE">Online</option>
              </select>
              <input placeholder="Customer ID (auto)" value={customerId} onChange={e => setCustomerId(e.target.value)}
                style={{ ...styles.input, width: 140, flex: 'none' }} />
              <select value={prescriptionId} onChange={e => setPrescriptionId(e.target.value)}
                style={{ ...styles.select, flex: 'none', minWidth: 200 }}>
                <option value="">No Prescription</option>
                {prescriptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reference_code} — {p.customer_name || 'Guest'}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <input
              style={styles.searchInput}
              placeholder="🔍  Search drugs by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); loadDrugs(e.target.value); }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />

            {/* Drug Grid */}
            <div style={styles.drugGrid}>
              {drugs.map(d => (
                <div key={d.id}
                  style={styles.drugCard}
                  onClick={() => addToCart(d)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>💊</span>
                    {d.requires_prescription && <span style={styles.rxBadge}>Rx</span>}
                  </div>
                  <div style={styles.drugName}>{d.name}</div>
                  <div style={styles.drugSub}>{d.strength} · {d.unit}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.drugPrice}>{fmt(d.unit_price)}</span>
                    {d.vat_rate > 0 && <span style={{ fontSize: 9, color: '#9ca3af' }}>+{d.vat_rate}% VAT</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Cart */}
          <div style={styles.right}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🛒 Cart ({cart.length} items)</span>
              {cart.length > 0 && (
                <button onClick={() => { setCart([]); setSelectedPending(null); }}
                  style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p style={{ fontSize: 13 }}>Click a drug to add it to the cart</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cart.map(item => (
                  <div key={item.drug_id} style={styles.cartItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{item.name}</span>
                      <button onClick={() => removeItem(item.drug_id)}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.drug_id, item.quantity - 1)}>−</button>
                      <span style={{ fontWeight: 800, fontSize: 14, minWidth: 28, textAlign: 'center', color: '#111827' }}>{item.quantity}</span>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.drug_id, item.quantity + 1)}>+</button>
                      <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#2563eb', fontSize: 14 }}>
                        {fmt(item.unit_price * item.quantity)}
                      </span>
                    </div>
                    {item.vat_rate > 0 && (
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>VAT {item.vat_rate}% = {fmt(item.unit_price * item.quantity * item.vat_rate / 100)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {cart.length > 0 && (
              <div style={styles.totalsCard}>
                <div style={styles.totalsRow}><span>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
                <div style={styles.totalsRow}><span>VAT</span><span>{fmt(totals.vat)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontWeight: 800, fontSize: 18, borderTop: '1.5px solid #e5e7eb', marginTop: 6 }}>
                  <span>Total</span><span style={{ color: '#059669' }}>{fmt(totals.total)}</span>
                </div>
              </div>
            )}

            {/* Payment */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>💳 Payment Method</div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                {['CASH', 'BANK_TRANSFER', 'TELEBIRR'].map(m => (
                  <button key={m} onClick={() => setPayment(p => ({ ...p, method: m }))} style={styles.payMethodBtn(payment.method === m)}>
                    {m === 'CASH' ? '💵 Cash' : m === 'BANK_TRANSFER' ? '🏦 Bank' : '📱 Telebirr'}
                  </button>
                ))}
              </div>
              {payment.method === 'TELEBIRR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Telebirr Number" value={payment.telebirr_number}
                    onChange={e => setPayment(p => ({ ...p, telebirr_number: e.target.value }))} style={styles.input} />
                  <input placeholder="Transaction Reference" value={payment.telebirr_transaction_ref}
                    onChange={e => setPayment(p => ({ ...p, telebirr_transaction_ref: e.target.value }))} style={styles.input} />
                </div>
              )}
              {payment.method === 'BANK_TRANSFER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Bank Name" value={payment.bank_name}
                    onChange={e => setPayment(p => ({ ...p, bank_name: e.target.value }))} style={styles.input} />
                  <input placeholder="Account Number" value={payment.account_number}
                    onChange={e => setPayment(p => ({ ...p, account_number: e.target.value }))} style={styles.input} />
                </div>
              )}
            </div>

            {needsRx && !prescriptionId && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '10px 14px', color: '#7c3aed', fontSize: 12 }}>
                ⚠️ Cart contains Rx-only drugs. Select a prescription above.
              </div>
            )}
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 12 }}>{error}</div>}

            <button onClick={handleSale} disabled={submitting || cart.length === 0}
              style={{ ...styles.btnSuccess, opacity: submitting || cart.length === 0 ? 0.5 : 1, cursor: submitting || cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              {submitting ? '⏳ Processing…' : `✅ Complete Sale — ${fmt(totals.total)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── PENDING ONLINE ORDERS ── */}
      {view === 'pending' && (
        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>📦 Pending Online Orders</h2>
            <button onClick={loadPendingOrders} style={{ ...styles.btnPrimary, width: 'auto', padding: '9px 20px', fontSize: 13 }}>🔄 Refresh</button>
          </div>
          {loadingPending && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>Loading…</p>}
          {!loadingPending && pendingOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
              <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No pending orders</h3>
              <p style={{ fontSize: 13 }}>All online orders have been processed.</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {pendingOrders.map(order => (
              <div key={order.id} style={styles.pendingCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 15, fontFamily: 'monospace' }}>{order.sale_code}</span>
                  <span style={{ ...styles.badge('124,58,237'), fontSize: 11 }}>ONLINE</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  👤 <strong>{order.customer_name || 'Guest Customer'}</strong>
                  {order.customer_phone && <span style={{ color: '#6b7280', marginLeft: 6 }}>· {order.customer_phone}</span>}
                </div>
                {order.prescription_ref && (
                  <div style={{ fontSize: 12, color: '#7c3aed', marginBottom: 4 }}>📋 Rx: {order.prescription_ref}</div>
                )}
                <div style={{ marginBottom: 12 }}>
                  {(order.items || []).map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', padding: '3px 0' }}>
                      <span>💊 {item.drug_name} × {item.quantity}</span>
                      <span>{fmt(item.line_total)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(order.created_at).toLocaleString()}</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#059669', marginTop: 2 }}>{fmt(order.total_amount)}</div>
                  </div>
                  <button onClick={() => loadPendingIntoCart(order)} style={{ ...styles.btnPrimary, width: 'auto', padding: '9px 20px', fontSize: 13 }}>
                    Process →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SALES HISTORY ── */}
      {view === 'sales' && (
        <div style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 24 }}>📊 Sales History</h2>
          {loadingSales && <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>Loading…</p>}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  {['Sale Code', 'Branch', 'Worker', 'Customer', 'Type', 'Total (ETB)', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: 12 }}>{s.sale_code}</td>
                    <td style={{ padding: '11px 16px', color: '#374151' }}>{s.branch_name}</td>
                    <td style={{ padding: '11px 16px', color: '#6b7280' }}>{s.worker_name || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#6b7280' }}>{s.customer_name || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ background: s.sale_type === 'WALK_IN' ? '#ecfdf5' : '#eff6ff', color: s.sale_type === 'WALK_IN' ? '#059669' : '#2563eb', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {s.sale_type}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 800, color: '#059669', fontSize: 14 }}>{parseFloat(s.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ color: s.status === 'COMPLETED' ? '#059669' : s.status === 'VOIDED' ? '#dc2626' : '#f59e0b', fontWeight: 700, fontSize: 12 }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#9ca3af', fontSize: 11 }}>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && !loadingSales && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No sales recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CASH HANDOVER ── */}
      {view === 'handover' && (
        <div style={{ padding: 28, maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 24 }}>💰 Cash Handover</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ ...styles.card }}>
              <div style={styles.cardHeader}>Record New Handover</div>
              <form onSubmit={handleHandover} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Worker ID', value: workerId, readOnly: true, placeholder: 'Set in POS first' },
                  { label: 'Branch ID', value: branchId, readOnly: true, placeholder: 'Set in POS first' },
                ].map(({ label, value, readOnly, placeholder }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                    <input value={value} readOnly={readOnly} placeholder={placeholder} style={{ ...styles.input, background: '#f8fafc', color: '#6b7280' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Amount (ETB) *</label>
                  <input type="number" step="0.01" required value={handover.amount}
                    onChange={e => setHandover(h => ({ ...h, amount: e.target.value }))} style={styles.input} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Handed To (User ID) *</label>
                  <input required value={handover.handed_to}
                    onChange={e => setHandover(h => ({ ...h, handed_to: e.target.value }))} style={styles.input} placeholder="User ID of receiver" />
                </div>
                <button type="submit" style={styles.btnPrimary}>Record Handover</button>
              </form>
            </div>
            <div style={{ ...styles.card }}>
              <div style={styles.cardHeader}>Recent Handovers</div>
              {handovers.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No handovers recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {handovers.map(h => (
                    <div key={h.id} style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>{fmt(h.amount)}</span>
                        <span style={{ fontSize: 11, color: h.status === 'SETTLED' ? '#059669' : '#f59e0b', fontWeight: 700 }}>{h.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Worker: {h.worker_name || h.worker_id}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>To: {h.received_by || h.handed_to}</div>
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
