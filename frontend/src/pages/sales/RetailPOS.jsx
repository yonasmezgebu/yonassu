import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import salesService from '../../services/salesService';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  ShoppingCart, DollarSign, CreditCard, Smartphone, Banknote,
  CheckCircle, XCircle, Plus, Trash2, RefreshCw, List, Eye,
  History, Search, User, Phone, Building2, Hash, Wallet,
  Printer, Mail, X, Minus, ChevronRight, ChevronDown, Package, AlertCircle
} from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useAuth } from '../../hooks/useAuth';
import ImportStoreProductModal from './ImportStoreProductModal';

// ─── AuditRow: Expandable transaction detail row in audit trail ───────────────
function AuditRow({ log, idx }) {
  const [open, setOpen] = useState(false);
  const time = new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const payMethod = log.payment_method_name || log.action || '—';
  const saleType = log.sale_type ? log.sale_type.replace('_', ' ').toUpperCase() : 'WALK-IN';

  return (
    <div style={{ borderBottom: '1px solid #F1F5F9', marginBottom: 0 }}>
      {/* Transaction Row */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 110px 130px 80px',
          alignItems: 'center', padding: '10px 4px', cursor: 'pointer',
          background: open ? '#F0FDF4' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'),
          transition: 'background 0.15s'
        }}
      >
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{time}</div>
        <div>
          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13 }}>
            {log.recipient || log.invoice_number || `Sale #${log.sale_id}`}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{saleType} · {payMethod}</div>
        </div>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            background: '#D1FAE5', color: '#065F46'
          }}>SUBMITTED</span>
        </div>
        <div style={{ fontWeight: 800, color: '#059669', fontSize: 14, textAlign: 'right' }}>
          {parseFloat(log.amount || 0).toFixed(2)} ETB
        </div>
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </div>

      {/* Expanded Detail */}
      {open && (
        <div style={{ padding: '12px 16px 16px', background: '#F8FAFC', borderTop: '1px dashed #E2E8F0' }}>
          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Invoice', value: log.invoice_number || `#${log.sale_id}` },
              { label: 'Payment Method', value: log.payment_method_name || '—' },
              { label: 'Cashier', value: log.cashier_name || '—' },
              { label: 'Sale Type', value: saleType },
              { label: 'Ref / TxnID', value: log.payment_reference || '—' },
              { label: 'Status', value: log.status_name || 'Completed' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Payment Notes */}
          {log.payment_notes && (
            <div style={{ fontSize: 11, color: '#475569', background: '#EFF6FF', padding: '6px 10px', marginBottom: 12, borderLeft: '3px solid #2563EB' }}>
              {log.payment_notes}
            </div>
          )}

          {/* Items */}
          {log.items && log.items.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Items</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '4px 0', textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '4px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '4px 0', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Unit Price</th>
                    <th style={{ padding: '4px 0', textAlign: 'right', color: '#64748B', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {log.items.map((it, i) => {
                    const qty = parseFloat(it.quantity) || 0;
                    const price = parseFloat(it.unit_price) || 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '5px 0', color: '#1E293B', fontWeight: 500 }}>{it.product_name || `Product #${it.product_id}`}</td>
                        <td style={{ padding: '5px 0', textAlign: 'center', color: '#475569' }}>{qty}</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#475569' }}>{price.toFixed(2)} ETB</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{(qty * price).toFixed(2)} ETB</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #E2E8F0' }}>
                    <td colSpan={3} style={{ padding: '5px 0', fontWeight: 700, color: '#1E293B', textAlign: 'right' }}>Total</td>
                    <td style={{ padding: '5px 0', fontWeight: 800, color: '#059669', textAlign: 'right' }}>
                      {parseFloat(log.amount || 0).toFixed(2)} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No item details available</div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: <DollarSign size={16} /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard size={16} /> },
  { value: 'TELBIR', label: 'Telbir', icon: <Smartphone size={16} /> },
];

const SALE_TYPES = [
  { value: 'WALK-IN', label: 'Walk-In', icon: <ShoppingCart size={16} /> },
  { value: 'ONLINE', label: 'Online', icon: <Smartphone size={16} /> },
];

const EMPTY_ITEM = { product_id: null, product_name: '', quantity: '', unit_price: '' };

export default function RetailPOS() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();
  const [tab, setTab] = useState('retail-walkin');
  const [sales, setSales] = useState([]);
  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSuggestions, setproductSuggestions] = useState([]);
  const [showproductDropdown, setShowproductDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [txnId, setTxnId] = useState('');
  const [txnScreenshot, setTxnScreenshot] = useState(null);
  const [cashRecipientName, setCashRecipientName] = useState('');

  const [financeAccounts, setFinanceAccounts] = useState([]);

  // POS State
  const [posStep, setPosStep] = useState(1);
  const [posCart, setPosCart] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('');

  const [navSearch, setNavSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Pending Online Orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingPendingOrders, setLoadingPendingOrders] = useState(false);

  // Submit confirmation modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [orderRequestId, setOrderRequestId] = useState(null);
  const [activeOnlineOrder, setActiveOnlineOrder] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Void modal state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidSaleTarget, setVoidSaleTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const addToCart = (item) => {
    const existing = posCart.find(c => c.id === item.id);
    if (existing) {
      if (existing.qty < item.stock) {
        setPosCart(posCart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
    } else {
      setPosCart([...posCart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id, newQty) => {
    // find item in posCart
    const existing = posCart.find(c => c.id === id);
    if (existing && newQty > 0 && newQty <= existing.stock) {
      setPosCart(posCart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const posCartTotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);


  const handleProcessPayment = async () => {
    if (!posPaymentMethod) { showToast('Please select a payment method', 'warning'); return; }
    if (posCart.length === 0) { showToast('Cart is empty', 'warning'); return; }

    const saleItems = posCart.map(item => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
    }));

    setLoading(true);
    try {
        const payload = {
            sale_type: saleType,
            items: saleItems,
            payment: {
              method: posPaymentMethod,
              amount: posCartTotal,
              status: 'PAID',
              recipient_name: cashRecipientName || payerName || recipientName,
              recipient_phone: payerPhone || recipientPhone,
              ...(posPaymentMethod === 'BANK_TRANSFER' && {
                bank_name: bankName,
                account_holder: accountHolder,
                account_number: accountNumber,
                transaction_id: txnId,
              }),
              ...(posPaymentMethod === 'TELBIR' && {
                telbir_number: telbirNumber,
                transaction_id: txnId,
              }),
            }
          };
          const invoiceReq = await apiClient.post('/pos/checkout-retail', payload);
          setOrderRequestId(null);
          
          setCompletedSale({
            invoice_number: invoiceReq.data?.data?.invoice_number || 'POS-' + Math.floor(Math.random()*10000),
            total_amount: posCartTotal,
            payment_method: posPaymentMethod,
            recipient_name: cashRecipientName || payerName || recipientName,
            items: saleItems.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.unit_price }))
          });
        
        if (orderRequestId) {
          try {
            await apiClient.post(`/sales/requests/${orderRequestId}/approve`, {});
            await apiClient.put(`/sales/requests/${orderRequestId}/ready`, {});
          } catch (approveErr) {
            console.warn('Could not mark order request as complete:', approveErr.message);
          }
          // Remove from pending orders list
          setPendingOrders(prev => prev.filter(o => o.id !== orderRequestId));
        }

        // Refresh sales list AND product stock in real-time
        loadSales();
        loadProducts();

        showToast('✅ Sale recorded successfully!', 'success');
        playSound('success');
        submitNotification('Payment Processed', 'Transaction completed successfully.');
        setPosStep(4);
        setPosCart([]);
        setPosPaymentMethod('');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to record sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!completedSale) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { showToast('Please allow popups to print receipt', 'warning'); return; }
    win.document.write(`
      <!DOCTYPE html><html><head><title>Receipt ${completedSale.invoice_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 320px; margin: 0 auto; }
        h2 { text-align: center; font-size: 16px; margin-bottom: 4px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total { font-weight: bold; font-size: 14px; }
        .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #555; }
      </style></head>
      <body>
        <h2>SUTANA POS</h2>
        <div class='divider'></div>
        <div class='row'><span>Invoice No:</span><span>${completedSale.invoice_number}</span></div>
        <div class='divider'></div>
        ${(completedSale.items || []).map(it => `
          <div class='row'>
            <span>${it.name} x${it.quantity}</span>
            <span>${(it.price * it.quantity).toFixed(2)} ETB</span>
          </div>`).join('')}
        <div class='divider'></div>
        <div class='row total'><span>TOTAL</span><span>${completedSale.total_amount.toFixed(2)} ETB</span></div>
        <div class='footer'>Thank you for your purchase!</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const grandTotal = items.reduce((sum, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  useEffect(() => { setPaymentAmount(grandTotal > 0 ? grandTotal.toFixed(2) : ''); }, [grandTotal]);

  useEffect(() => {
    if (posCartTotal > 0) {
      setPaymentAmount(posCartTotal);
    }
  }, [posCartTotal]);

  useEffect(() => {
    if (posPaymentMethod === 'BANK_TRANSFER') {
      const bankAcc = financeAccounts.find(a => a.account_type === 'Bank');
      if (bankAcc) {
        setBankName(bankAcc.bank_provider || '');
        setAccountHolder(bankAcc.account_name || '');
        setAccountNumber(bankAcc.account_number || '');
      }
    } else if (posPaymentMethod === 'TELBIR') {
      const telbirAcc = financeAccounts.find(a => a.account_type === 'Telbir');
      if (telbirAcc) {
        setTelbirNumber(telbirAcc.account_number || '');
        setAccountHolder(telbirAcc.account_name || '');
      }
    }
  }, [posPaymentMethod, financeAccounts]);

  useEffect(() => { loadProducts(); loadSales(); loadFinanceAccounts(); }, []);

  // Auto-switch to ONLINE tab when navigated from the bell notification
  useEffect(() => {
    if (location.state?.tab === 'online') {
      setTab('online');
      setShowAudit(false);
      loadPendingOrders();
    }
  }, [location.state?.bellTs]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadProducts(), loadSales(), loadAuditTrail(), loadPendingOrders(), loadFinanceAccounts()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleSearch = (e) => setNavSearch(e.detail || '');
    const handleRefresh = () => handleRefreshAll();
    window.addEventListener('dashboardSearch', handleSearch);
    window.addEventListener('dashboardRefresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboardSearch', handleSearch);
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }, []);

  const loadFinanceAccounts = async () => {
    try {
      const res = await apiClient.get('/finance-bank');
      if (res.status === 'success' || Array.isArray(res.data)) {
        setFinanceAccounts(res.data || []);
      } else if (Array.isArray(res)) {
         setFinanceAccounts(res);
      }
    } catch (e) { console.error('Failed to load finance accounts:', e); }
  };

  const loadProducts = async () => {
    try {
      const raw = await salesService.getRetailProducts({ limit: 1000 });
      const list = Array.isArray(raw) ? raw : raw?.data?.products || [];
      const mapped = list.map(p => ({
        ...p,
        id: p.id,
        name: p.name,
        category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.selling_price || p.price || 0),
        stock: parseInt(p.stock_quantity ?? 0),
        reorder: parseInt(p.reorder_level || 10),
        image: p.product_image || null
      }));
      setProducts(mapped);
    } catch (e) {
      console.error('Failed to load retail products', e);
    }
  };

  const loadSales = async () => {
    try {
      const res = await apiClient.get('/pos/sales');
      if (res.status === 'success') {
        const data = res.data;
        const txList = data?.sales || (Array.isArray(data) ? data : []);
        setSales(txList);
      }
    } catch (e) { console.error(e); }
  };

  const viewSaleDetail = async (sale) => {
    try {
      const res = await apiClient.get(`/pos/sales/${sale.id}`);
      if (res.status === 'success') {
        setDetail({ ...res.data.sale, items: res.data.items });
      } else {
        setDetail(sale);
      }
    } catch (e) {
      setDetail(sale);
    }
    setTab('detail');
  };

  const loadAuditTrail = async () => {
    try {
      const res = await apiClient.get('/pos/audit-trail');
      if (res.status === 'success') {
        const data = res.data;
        setAuditTrail(Array.isArray(data) ? data : (data?.audits || data?.items || []));
      }
    } catch (e) { console.error(e); }
  };

  const loadPendingOrders = async () => {
    setLoadingPendingOrders(true);
    try {
      const res = await apiClient.get('/pos/orders/pending');
      if (res.status === 'success') {
        const rawData = res.data?.orders || res.data || [];
        setPendingOrders(Array.isArray(rawData) ? rawData : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPendingOrders(false);
    }
  };

  const handleVoidSaleInit = (sale) => {
    setVoidSaleTarget(sale);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const confirmVoidSale = async () => {
    if (!voidReason.trim()) {
      showToast('A reason is required to void a transaction.', 'error');
      return;
    }
    try {
      setLoading(true);
      await salesService.voidSale(voidSaleTarget.id, { reason: voidReason });
      showToast(`Transaction ${voidSaleTarget.invoice_number || voidSaleTarget.id} voided. Stock returned.`, 'success');
      setShowVoidModal(false);
      setVoidSaleTarget(null);
      loadSales(); // refresh list
    } catch (e) {
      showToast('Failed to void transaction: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const processOnlineOrder = (order) => {
    const newCart = (order.items || []).map(item => ({
      id: item.product_id,
      name: item.product_name,
      price: parseFloat(item.unit_price) || 0,
      qty: parseInt(item.quantity) || 1,
      stock: 9999, // Bypass local stock check for pre-approved orders
      vat_rate: item.vat_rate || 0,
    }));

    // ── Auto-fill all form fields from the online order ──
    setPosCart(newCart);
    setSaleType('ONLINE');
    setActiveOnlineOrder(order);
    setOrderRequestId(order.id); // track the order_request id for later approval

    // Customer info
    setRecipientName(order.customer_name || '');
    setRecipientPhone(order.customer_phone || '');
    setPayerName(order.customer_name || '');
    setPayerPhone(order.customer_phone || '');
    setPaymentAmount(parseFloat(order.total_amount || 0).toFixed(2));
    setPaymentStatus('PAID');
    setPosPaymentMethod('CASH');
    setTab('retail-walkin');
    setShowCart(true);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((row, i) => (i !== idx ? row : { ...row, [field]: value })));
  };

  const addRow = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const filterproducts = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q)).slice(0, 8);
  };

  const selectproduct = (idx, product) => {
    // Accept either a product object or a plain name string
    const name = typeof product === 'string' ? product : (product?.name || product);
    const productId = typeof product === 'object' && product !== null ? (product.id || null) : null;
    setItems(prev => prev.map((row, i) => i !== idx ? row : { ...row, product_id: productId, product_name: name, unit_price: row.unit_price || (productId && typeof product === 'object' ? String(product.price || '') : row.unit_price) }));
    setShowproductDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(row => row.product_name.trim() && row.quantity && row.unit_price);
    if (validItems.length === 0) { showToast('Please add at least one item', 'warning'); return; }
    const payload = {
      sale_type: saleType,
      items: validItems.map(row => ({
        product_id: row.product_id || null,
        product_name: row.product_name,
        quantity: parseFloat(row.quantity),
        unit_price: parseFloat(row.unit_price),
      })),
      payment: {
        method: paymentMethod,
        amount: parseFloat(paymentAmount) || grandTotal,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        status: paymentStatus,
      }
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
      const res = await apiClient.post('/pos/checkout-retail', payload);
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
    setPaymentStatus('PAID');
    setPaymentMethod('CASH');
    setSaleType('WALK-IN');
    setActiveOnlineOrder(null);
    setOrderRequestId(null);
    setTxnId('');
    setTxnScreenshot(null);
    setCashRecipientName('');
    setPosPaymentMethod('');
  };

  return (
    <>
    <div style={{ margin: 0, padding: 0, minHeight: 'calc(100vh - 72px)', background: 'var(--bg-page)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root {
          --primary: #228B22;
          --header: #1B5E20;
          --emerald: #2E8B57;
          --success: #4CAF50;
          --sage: #A5D6A7;
          --accent: #87CEEB;
          --bg-main: #FFFFFF;
          --bg-page: #F5F5F5;
          --text-main: #424242;
          --earth: #8D6E63;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        
        .btn-3d {
          background-color: var(--emerald);
          color: white;
          border: none;
          border-bottom: 4px solid var(--header);
          padding: 10px 20px;
          border-radius: 0;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-3d:hover {
          background-color: var(--primary);
          transform: translateY(2px);
          border-bottom-width: 2px;
          margin-top: 2px;
        }
        .btn-3d:active {
          transform: translateY(4px);
          border-bottom-width: 0px;
          margin-top: 4px;
        }
        .btn-3d:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          border-bottom-width: 4px;
          margin-top: 0;
        }

        .rsp-card { background: var(--bg-main); border-radius: 0; overflow: hidden; border: none; box-shadow: 2px 2px 0px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; animation: fadeUp 0.4s both; }
        .rsp-card:hover { transform: translateY(-3px); box-shadow: 4px 4px 0px rgba(0,0,0,0.15); border-color: var(--primary); }
        .rsp-card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; background: var(--bg-page); display: flex; align-items: center; justify-content: center; }
        .rsp-card-img { width: 100%; height: 100%; object-fit: cover; }
        .rsp-card-badge { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 4px 10px; border-radius: 0; font-size: 11px; font-weight: 700; color: var(--text-main); border: 1px solid var(--earth); }
        .rsp-card-oos { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; }
        .rsp-card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
        .rsp-card-name { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0 0 4px; }
        .rsp-card-desc { font-size: 12px; color: #424242; margin: 0 0 8px; border-left: 3px solid var(--sage); padding-left: 6px; white-space: pre-wrap; overflow-wrap: break-word; display: block; }
        .rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
        .rsp-price { font-size: 16px; font-weight: 800; color: var(--primary); }
        
        .rsp-add-btn { background-color: var(--emerald); color: white; border: none; border-bottom: 3px solid var(--header); padding: 6px 12px; border-radius: 0; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 12px; transition: all 0.15s; }
        .rsp-add-btn:hover:not(:disabled) { transform: translateY(1px); border-bottom-width: 2px; margin-top: 1px; }
        .rsp-add-btn:active:not(:disabled) { transform: translateY(3px); border-bottom-width: 0px; margin-top: 3px; }
        

        table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border: none; }
        th { background: var(--header); color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border-bottom: 3px solid var(--primary); border-right: 1px solid var(--earth); }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; }
        th { background: var(--header); color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 14px; }
        td { padding: 12px; font-size: 14px; color: var(--text-main); }
        tr:nth-child(even) { background-color: var(--sage); color: var(--text-main); }
        tr:hover { background-color: var(--accent); color: var(--text-main); cursor: pointer; transition: background 0.2s; }
        
        /* Modern Inputs */
        input, select, textarea {
          border: 2px solid var(--earth);
          padding: 10px;
          border-radius: 0;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary);
          outline: none;
        }
        
        .pos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1400px) { .pos-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 1000px) { .pos-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @media (max-width: 600px) { .pos-grid { grid-template-columns: 1fr; gap: 10px; } }
      `}</style>
      <ToastContainer />

      {/* ── NATURE THEME HEADER ── */}
      <div style={{
        width: '100%',
        background: 'var(--header)',
      }}>
        <div style={{ padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left: Icon + Title + Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Leaf Icon */}
            <div style={{
              width: 44, height: 44, background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0
            }}>
              🌿
            </div>
            {/* Title */}
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.3rem',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}>
              Retail Sales — POS
            </h1>
            {/* Sales Counter — no border, just a subtle pill */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 52, height: 52,
              background: 'rgba(139,195,74,0.25)',
              color: 'white',
              lineHeight: 1,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>{sales.length}</span>
              <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2, opacity: 0.85 }}>SALES</span>
            </div>
          </div>

          {/* Right: Refresh + New Sale — vertically centered in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleRefreshAll}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 0,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '0.02em',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={15} strokeWidth={2.5} style={refreshing ? { animation: 'spin 0.7s linear infinite' } : {}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              className="btn-3d"
              onClick={() => { setShowAudit(false); setTab('retail-walkin'); resetForm(); }}
              style={{ fontSize: 13, padding: '9px 20px', letterSpacing: '0.02em' }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 300 }}>+</span> New Sale
            </button>
          </div>

        </div>

          {/* ── Tabs Bar ── */}
          <div style={{
            display: 'flex',
            background: 'var(--primary)',
            borderRadius: 0,
          }}>
            {[
              { key: 'retail-walkin',  icon: ShoppingCart, label: 'WALK-IN SALE' },
              { key: 'retail-online',  icon: Smartphone,   label: 'ONLINE ORDER' },
              { key: 'list',    icon: List,         label: 'TRANSACTIONS' },
              { key: 'audit',   icon: History,      label: 'AUDIT LOG' },
            ].map((t, idx, arr) => {
              const active = t.key === 'audit' ? showAudit : (tab === t.key && !showAudit);
              const TabIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === 'audit') {
                      setShowAudit(true); setTab('retail-walkin'); loadAuditTrail();
                    } else {
                      setShowAudit(false); setTab(t.key);
                      if (t.key === 'retail-walkin') setShowCart(false);
                      if (t.key === 'list') loadSales();
                      if (t.key === 'retail-online') loadPendingOrders();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    position: 'relative',
                    transition: 'background 0.2s',
                    background: active ? 'var(--header)' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.8rem',
                    letterSpacing: '0.06em',
                    borderRadius: 0,
                  }}
                >
                  <TabIcon
                    size={16}
                    color={active ? '#8BC34A' : 'rgba(255,255,255,0.75)'}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span>{t.label}</span>

                  {/* Cart badge on Walk-In tab */}
                  {t.key === 'retail-walkin' && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setShowCart(c => !c); }}
                      title="Open Cart"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginLeft: 6,
                        background: posCart.length > 0 ? '#8BC34A' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: 0,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <ShoppingCart size={12} strokeWidth={2.5} />
                      <span>{posCart.length}</span>
                    </div>
                  )}

                  {/* Notification badge on ONLINE tab */}
                  {t.key === 'retail-online' && pendingOrders.length > 0 && (
                    <div
                      title={`${pendingOrders.length} Pending Orders`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 6,
                        background: '#F44336',
                        color: '#fff',
                        borderRadius: 0,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {pendingOrders.length}
                    </div>
                  )}

                  {t.key === 'retail-online' && pendingOrders.length === 0 && (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 6,
                        background: 'rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: 0,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      No Order
                    </div>
                  )}
                </button>
              );
            })}
          </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', background: 'var(--bg-page)', width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 200px)' }}>

      {tab === 'retail-walkin' && !showAudit && (
        <div style={{ background: 'white', overflow: 'hidden', padding: 24, minHeight: '600px' }}>
          {!showCart ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Retail Products</h2>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="btn-3d"
                    style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Package size={16} />
                    Import from Store
                  </button>
                </div>
                <div className="pos-grid">
                {/* Product Grid */}
                {products
                  .filter(i => !navSearch || (i.name && i.name.toLowerCase().includes(navSearch.toLowerCase())))
                  .map((item, idx) => {
                    const inCart = posCart.find(c => c.id === item.id);
                    const stockVal = item.stock !== undefined ? item.stock : (item.quantity || 0);
                    const stockLabel = stockVal <= 0 ? 'oos' : stockVal <= (item.reorder_level || 10) ? 'low' : 'normal';
                    const stockText = stockVal <= 0 ? '0 Out of Stock' : stockVal <= (item.reorder_level || 10) ? `${stockVal} Low Stock` : `${stockVal} In Stock`;
                    const priceVal = item.price || item.selling_price || item.unit_price || 0;
                    
                    const imgSrc = (url) => {
                      if (!url) return null;
                      return url.startsWith('http') ? url : 'http://localhost:5000' + url;
                    };
                    
                    return (
                      <div key={item.id} className="rsp-card" style={{ animationDelay: idx * 0.04 + 's' }}>
                        <div className="rsp-card-img-wrap">
                          {(() => {
                            const imgs = [item.product_image, item.product_image, item.cover_image].filter(Boolean);
                            const uniqueImgs = [...new Set(imgs)];
                            if (uniqueImgs.length === 0) return <Package size={36} color="#cbd5e1" />;
                            if (uniqueImgs.length === 1) return <img src={imgSrc(uniqueImgs[0])} className="rsp-card-img" alt={item.name} />;
                            return (
                              <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                                <img src={imgSrc(uniqueImgs[0])} className="rsp-card-img" alt={item.name} style={{ width: '50%' }} />
                                <img src={imgSrc(uniqueImgs[1])} className="rsp-card-img" alt={item.name} style={{ width: '50%' }} />
                              </div>
                            );
                          })()}
                          {(item.category || item.category_name) && <div className="rsp-card-badge">{item.category || item.category_name}</div>}
                          {stockVal <= 0 && (
                            <div className="rsp-card-oos">OUT OF STOCK</div>
                          )}
                        </div>
                        <div className="rsp-card-body">
                          <h3 className="rsp-card-name">{item.name}</h3>
                          <span className={`rsp-stock-badge rsp-stock-${stockLabel}`}>
                            📦 {stockText}
                          </span>
                          
                          {item.description && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <p className="rsp-card-desc">
                                {item.description}
                              </p>
                            </div>
                          )}
                          
                          <div className="rsp-card-footer">
                            <div>
                              <div className="rsp-price">{parseFloat(priceVal).toLocaleString()} ETB</div>
                            </div>
                            <button
                              type="button"
                              className="btn-3d"
                              disabled={stockVal <= 0}
                              style={inCart ? { background: 'linear-gradient(135deg,#059669,#10b981)' } : {}}
                              onClick={(e) => { e.stopPropagation(); addToCart({...item, price: priceVal, stock: stockVal}); }}
                            >
                              <ShoppingCart size={13} /> {inCart ? `${inCart.qty} added` : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>🛍️ Cart & Checkout</h2>
                 <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }} style={{ padding: '10px 20px', borderRadius: 0, background: 'white', cursor: 'pointer', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                   ← Back to Products
                 </button>
               </div>

               {/* ── Online Order Banner ── */}
               {activeOnlineOrder && (
                 <div style={{
                   background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                   borderRadius: 0,
                   padding: '18px 24px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   gap: 20,
                   boxShadow: '0 8px 24px rgba(5,150,105,0.25)',
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                     <div style={{
                       width: 48, height: 48, borderRadius: 0,
                       background: 'linear-gradient(135deg, #059669, #10b981)',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       fontSize: 22, flexShrink: 0
                     }}>📦</div>
                     <div>
                       <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                         🌐 Online Order — Auto-Filled
                       </div>
                       <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
                         {activeOnlineOrder.sale_code || `Order #${activeOnlineOrder.id}`}
                       </div>
                       <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                         👤 {activeOnlineOrder.customer_name || 'Guest'} &nbsp;·&nbsp; 📱 {activeOnlineOrder.customer_phone || '—'}
                       </div>
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total</div>
                     <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399' }}>
                       {parseFloat(activeOnlineOrder.total_amount || 0).toFixed(2)} ETB
                     </div>
                     <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>All fields pre-filled ✓</div>
                   </div>
                 </div>
               )}

               {posStep === 1 || posStep === 2 || posStep === 3 ? (
                 <>
                   {/* Items List */}
                   <div style={{ borderRadius: 0, overflow: 'hidden' }}>
                     <div style={{ padding: '16px 20px', background: '#f8fafc', fontWeight: 700, color: '#1e293b' }}>Cart Items ({posCart.length})</div>
                     <div style={{ padding: '0 20px', maxHeight: '400px', overflowY: 'auto' }}>
                       {posCart.length === 0 ? (
                         <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Cart is empty</div>
                       ) : (
                         posCart.map(item => (
                           <div key={item.id} style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                               <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{item.name}</div>
                               <div style={{ fontSize: 12, color: '#64748b' }}>{item.price} ETB each</div>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 0, padding: 4 }}>
                                 <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ border: 'none', background: 'white', borderRadius: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Minus size={14}/></button>
                                 <span style={{ fontWeight: 700, width: 30, textAlign: 'center' }}>{item.qty}</span>
                                 <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ border: 'none', background: 'white', borderRadius: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Plus size={14}/></button>
                               </div>
                               <div style={{ fontWeight: 800, color: '#059669', width: 90, textAlign: 'right', fontSize: 15 }}>{(item.price * item.qty).toFixed(2)} ETB</div>
                               <button onClick={() => setPosCart(posCart.filter(c => c.id !== item.id))} style={{ background: '#FEE2E2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 0 }}><Trash2 size={16}/></button>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                     {posCart.length > 0 && (
                       <div style={{ padding: '16px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <button onClick={() => setPosCart([])} style={{ background: 'none', border: 'none', color: '#b91c1c', padding: '8px 16px', borderRadius: 0, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><X size={16}/> Clear Cart</button>
                         <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Total: <span style={{ color: '#059669' }}>{posCartTotal.toFixed(2)} ETB</span></div>
                       </div>
                     )}
                   </div>

                   {posCart.length > 0 && (
                     <>


                       {/* Payment Method */}
                       <div style={{ marginBottom: 20 }}>
                         <label style={labelStyle}>Payment Method *</label>
                         <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                           {PAYMENT_METHODS.map(pm => (
                             <label key={pm.value} style={{
                               display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                               borderRadius: 0, cursor: 'pointer', background: posPaymentMethod === pm.value ? '#ECFDF5' : 'white',
                               fontWeight: 600, fontSize: 13, color: posPaymentMethod === pm.value ? '#065F46' : '#475569',
                             }}>
                               <input type="radio" name="posPaymentMethod" value={pm.value} checked={posPaymentMethod === pm.value}
                                 onChange={() => setPosPaymentMethod(pm.value)} style={{ display: 'none' }} />
                               {pm.icon} {pm.label}
                             </label>
                           ))}
                         </div>
                       </div>

                       {/* Payment Detail Fields — CASH */}
                       {posPaymentMethod === 'CASH' && (
                         <div style={{ marginBottom: 20, background: '#FFFBEB', borderRadius: 0, padding: 16 }}>
                           <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <DollarSign size={16} color="#D97706" /> Cash Payment
                           </h3>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                             <div>
                               <label style={labelStyle}>Amount Received *</label>
                               <input type="number" step="0.01" min="0" value={paymentAmount}
                                 onChange={e => setPaymentAmount(e.target.value)} style={inputStyle()} />
                             </div>
                             <div>
                               <label style={labelStyle}>Recipient Name *</label>
                               <input type="text" value={cashRecipientName}
                                 onChange={e => setCashRecipientName(e.target.value)}
                                 placeholder="Name of person receiving cash" style={inputStyle()} />
                             </div>
                           </div>
                         </div>
                       )}

                       {/* Payment Detail Fields — BANK TRANSFER */}
                       {posPaymentMethod === 'BANK_TRANSFER' && (
                         <div style={{ marginBottom: 20, background: '#EFF6FF', borderRadius: 0, padding: 16 }}>
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
                               <label style={labelStyle}>Finance Account (Auto-fill)</label>
                               <select style={inputStyle()} onChange={(e) => {
                                 const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                 if (acc) {
                                   setBankName(acc.bank_provider || '');
                                   setAccountHolder(acc.account_name || '');
                                   setAccountNumber(acc.account_number || '');
                                 }
                               }}>
                                 <option value="">— Select Account —</option>
                                 {financeAccounts.filter(a => a.account_type === 'Bank').map(a => (
                                   <option key={a.id} value={a.id}>{a.account_name} ({a.bank_provider}) - {a.account_number}</option>
                                 ))}
                               </select>
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
                               <label style={labelStyle}>Transaction ID *</label>
                               <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)}
                                 placeholder="Bank transaction reference ID" style={inputStyle()} />
                             </div>
                             <div style={{ gridColumn: '1 / -1' }}>
                               <label style={labelStyle}>Screenshot / Payment Proof</label>
                               <input type="file" accept="image/*"
                                 onChange={e => setTxnScreenshot(e.target.files[0])}
                                 style={{ ...inputStyle(), padding: '6px 10px', cursor: 'pointer' }} />
                               {txnScreenshot && <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>✓ {txnScreenshot.name}</div>}
                             </div>
                           </div>
                         </div>
                       )}

                       {/* Payment Detail Fields — TELBIR */}
                       {posPaymentMethod === 'TELBIR' && (
                         <div style={{ marginBottom: 20, background: '#F5F3FF', borderRadius: 0, padding: 16 }}>
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
                               <label style={labelStyle}>Telebirr Account (Auto-fill)</label>
                               <select style={inputStyle()} onChange={(e) => {
                                 const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                 if (acc) {
                                   setTelbirNumber(acc.account_number || '');
                                   setPayerName(acc.account_name || '');
                                 }
                               }}>
                                 <option value="">— Select Telebirr —</option>
                                 {financeAccounts.filter(a => a.bank_provider === 'telebirr' || a.account_type === 'Mobile Wallet').map(a => (
                                   <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>
                                 ))}
                               </select>
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
                               <label style={labelStyle}>Transaction ID *</label>
                               <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)}
                                 placeholder="Telebirr transaction reference ID" style={inputStyle()} />
                             </div>
                             <div style={{ gridColumn: '1 / -1' }}>
                               <label style={labelStyle}>Screenshot / Payment Proof</label>
                               <input type="file" accept="image/*"
                                 onChange={e => setTxnScreenshot(e.target.files[0])}
                                 style={{ ...inputStyle(), padding: '6px 10px', cursor: 'pointer' }} />
                               {txnScreenshot && <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 4 }}>✓ {txnScreenshot.name}</div>}
                             </div>
                           </div>
                         </div>
                       )}

                       {/* Payment Status — Paid checkbox */}
                       <div style={{ marginBottom: 20, padding: '14px 18px', background: '#f0fdf4', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
                         <input
                           type="checkbox"
                           id="paidCheckbox"
                           checked={paymentStatus === 'PAID'}
                           onChange={e => setPaymentStatus(e.target.checked ? 'PAID' : 'PENDING')}
                           style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#059669' }}
                         />
                         <label htmlFor="paidCheckbox" style={{ fontWeight: 700, fontSize: 15, color: '#065f46', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                           <CheckCircle size={18} color={paymentStatus === 'PAID' ? '#059669' : '#94a3b8'} />
                           Mark as Paid
                         </label>
                         {paymentStatus !== 'PAID' && (
                           <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>⚠️ Please confirm payment before recording</span>
                         )}
                       </div>

                       {/* Submit */}
                       <button type="button" disabled={loading || !posPaymentMethod || !paymentStatus}
                         onClick={handleProcessPayment}
                         style={{
                           width: '100%', padding: '14px 24px', background: '#059669', color: 'white', border: 'none',
                           borderRadius: 0, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                           opacity: loading || !posPaymentMethod || !paymentStatus ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                           boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                         }}>
                         <ShoppingCart size={18} /> {loading ? 'Processing...' : `Record Sale — ${posCartTotal > 0 ? posCartTotal.toFixed(2) : '0.00'} ETB`}
                       </button>
                     </>
                   )}
                 </>
               ) : posStep === 4 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                    <CheckCircle size={80} color='#10b981' style={{ marginBottom: 20 }} />
                    <h3 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Transaction Complete!</h3>
                    {completedSale && (
                      <div style={{ background: '#f0fdf4', borderRadius: 0, padding: '12px 24px', marginBottom: 20, width: '100%', maxWidth: 400 }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: 16, marginBottom: 4 }}>Receipt: {completedSale.invoice_number}</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>Customer: <strong>{completedSale.recipient_name || 'Walk-In'}</strong></div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', marginTop: 8 }}>Total: {(completedSale.total_amount || 0).toFixed(2)} ETB</div>
                      </div>
                    )}
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Inventory updated. CRV and Model 22 generated.</p>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24, width: '100%', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                      <button type='button' onClick={printReceipt} style={{ flex: 1, padding: '14px 0', background: '#0284c7', color: 'white', border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        <Printer size={18} /> Print Receipt
                      </button>
                      <button type='button' onClick={() => { setTab('list'); setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); }} style={{ flex: 1, padding: '14px 0', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        <List size={18} /> View Sales
                      </button>
                    </div>
                    <button
                      type='button'
                      onClick={() => { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); setCompletedSale(null); resetForm(); }}
                      style={{ width: '100%', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', padding: '14px 0', background: 'transparent', color: '#059669', border: '2px solid #059669', borderRadius: 0, cursor: 'pointer', fontWeight: 800, fontSize: 15 }}
                    >Start New Transaction</button>
                  </div>
               ) : null}
            </div>
          )}
        </div>
      )}

      {/* SALES LIST TAB */}
      {tab === 'list' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div style={{ padding: '24px 32px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                 <List size={24} color="#059669" /> Unsubmitted Sales
               </h2>
               <p style={{ margin: 0, fontSize: 14, color: '#64748B' }}>Sales waiting to be submitted to Finance for the audit log.</p>
             </div>
             {sales.length > 0 && (
               <button
                 onClick={() => setShowSubmitConfirm(true)}
                 style={{
                   padding: '12px 24px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                   color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,0.25)'
                 }}
               >
                 <CheckCircle size={18} /> Submit to Finance ({sales.length})
               </button>
             )}
          </div>
          
          <div style={{ padding: '24px 32px' }}>
             {sales.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 24px', background: '#F8FAFC', borderRadius: '8px' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 8, fontSize: 20 }}>All Caught Up!</h3>
                  <p style={{ color: '#64748B', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                    There are no unsubmitted sales. Any completed sales have already been moved to the Audit Log.
                  </p>
               </div>
             ) : (
               <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800, background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9' }}>
                        <th style={{...thStyle, color: '#334155'}}>Receipt No</th>
                        <th style={{...thStyle, color: '#334155'}}>Date</th>
                        <th style={{...thStyle, color: '#334155'}}>Type</th>
                        <th style={{...thStyle, color: '#334155'}}>Customer</th>
                        <th style={{...thStyle, color: '#334155'}}>Cashier</th>
                        <th style={{...thStyle, color: '#334155'}}>Payment</th>
                        <th style={{...thStyle, color: '#334155', textAlign: 'right'}}>Total Amount</th>
                        <th style={{...thStyle, color: '#334155', textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale, idx) => {
                        const isEven = idx % 2 === 0;
                        const dateStr = sale.sale_date ? new Date(sale.sale_date).toLocaleString() : 'N/A';
                        
                        return (
                        <tr key={sale.id} style={{ background: isEven ? '#FFFFFF' : '#FAFAFA', transition: 'background 0.2s' }}>
                           <td style={tdStyle}><strong style={{ color: '#0F172A', fontWeight: 700 }}>{sale.invoice_number || `REC-${sale.id}`}</strong></td>
                           <td style={{...tdStyle, color: '#475569'}}>{dateStr}</td>
                           <td style={tdStyle}>
                             <span style={{
                               background: sale.sale_type === 'ONLINE' ? '#F3E8FF' : '#D1FAE5',
                               color: sale.sale_type === 'ONLINE' ? '#7E22CE' : '#047857',
                               padding: '4px 10px', borderRadius: '12px', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                             }}>
                               {sale.sale_type === 'ONLINE' ? <><Smartphone size={12}/> ONLINE</> : <><ShoppingCart size={12}/> WALK-IN</>}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <div style={{ fontWeight: 600, color: '#334155' }}>{sale.customer_name || 'Walk-in Customer'}</div>
                             {sale.customer_phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>{sale.customer_phone}</div>}
                           </td>
                           <td style={tdStyle}>
                             <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', color: '#475569', borderRadius: '4px', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                               <User size={12} /> {sale.cashier_name || 'Retail Staff'}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{
                               background: '#F8FAFC', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: 12, fontWeight: 700
                             }}>
                               {sale.payment_method_name || 'CASH'}
                             </span>
                           </td>
                           <td style={{...tdStyle, textAlign: 'right'}}>
                             <strong style={{ color: '#059669', fontSize: 14 }}>{parseFloat(sale.total_amount || 0).toLocaleString()} ETB</strong>
                           </td>
                           <td style={{...tdStyle, textAlign: 'center'}}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  onClick={() => viewSaleDetail(sale)}
                                  style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = '#DBEAFE'}
                                  onMouseOut={e => e.currentTarget.style.background = '#EFF6FF'}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleVoidSaleInit(sale)}
                                  style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
                                  onMouseOut={e => e.currentTarget.style.background = '#FEF2F2'}
                                >
                                  Cancel
                                </button>
                              </div>
                           </td>
                        </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>
             )}

             {sales.length > 0 && (
               <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: 0 }}>
                 <div style={{ fontSize: 13, color: '#64748b' }}>
                    <strong style={{ color: '#0f172a' }}>{sales.length}</strong> transactions · <strong style={{ color: '#059669' }}>{sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB</strong> total
                 </div>
                 <button 
                   onClick={() => setShowSubmitConfirm(true)}
                   disabled={loading}
                   style={{
                     padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                     color: 'white', border: 'none', borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer',
                     fontWeight: 800, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8,
                     boxShadow: '0 4px 12px rgba(5,150,105,0.3)', opacity: loading ? 0.7 : 1
                   }}
                 >
                   <CheckCircle size={18} />
                   <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {loading ? 'Submitting...' : 'Submit to Finance'}
                  </span>
                </button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* ONLINE TAB */}
      {tab === 'retail-online' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>📦 Pending Online Orders</h2>
              <button onClick={loadPendingOrders} disabled={loadingPendingOrders} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 0, cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                {loadingPendingOrders ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
            
            {loadingPendingOrders ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>Loading online orders...</p>
            ) : pendingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No pending orders</h3>
                <p style={{ fontSize: 13 }}>All online customer orders have been processed.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {pendingOrders.map(order => (
                  <div key={order.id} style={{ background: '#f8fafc', borderRadius: 0, padding: 16, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 15, fontFamily: 'monospace' }}>{order.sale_code || `ORD-${order.id}`}</span>
                      <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 0, }}>ONLINE</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      👤 <strong>{order.customer_name || 'Guest Customer'}</strong>
                      {order.customer_phone && <span style={{ color: '#6b7280', marginLeft: 6 }}>· {order.customer_phone}</span>}
                    </div>
                    {order.order_ref && (
                      <div style={{ fontSize: 12, color: '#7c3aed', marginBottom: 8 }}>📋 Rx: {order.order_ref}</div>
                    )}
                    <div style={{ marginBottom: 12, background: 'white', padding: '8px 12px', borderRadius: 0 }}>
                      {(order.items || []).map(item => (
                        <div key={item.id || item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
                          <span>💊 {item.product_name} × {item.quantity}</span>
                          <span style={{ fontWeight: 600 }}>{parseFloat(item.line_total || (item.quantity * item.unit_price)).toFixed(2)} ETB</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(order.created_at).toLocaleString()}</div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#059669', marginTop: 2 }}>{parseFloat(order.total_amount).toFixed(2)} ETB</div>
                      </div>
                      <button 
                        onClick={() => processOnlineOrder(order)} 
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}
                      >
                        Process Payment →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT TRAIL TAB */}
      {showAudit && (() => {
        // Group audit entries by date (day of submission)
        const grouped = auditTrail.reduce((acc, log) => {
          const day = new Date(log.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
          if (!acc[day]) acc[day] = [];
          acc[day].push(log);
          return acc;
        }, {});
        const days = Object.keys(grouped);

        return (
          <div style={{ background: 'white', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                📜 Retail Audit Trail
                <span style={{ fontSize: 12, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 10px', borderRadius: 20 }}>
                  {auditTrail.length} records
                </span>
              </h2>
              <button onClick={() => setShowAudit(false)} style={{ padding: '6px 16px', background: 'white', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {auditTrail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
                  <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No audit records yet</h3>
                  <p style={{ fontSize: 13 }}>Records appear here after submitting daily sales to Finance.</p>
                </div>
              ) : days.map((day) => {
                const entries = grouped[day];
                const dayTotal = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                const txCount = entries.length;
                return (
                  <div key={day} style={{ marginBottom: 28 }}>
                    {/* Date Group Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, background: '#059669', borderRadius: '50%' }} />
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#1E293B' }}>{day}</span>
                        <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 10 }}>
                          {txCount} transaction{txCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Accumulated Total</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#059669' }}>{dayTotal.toFixed(2)} ETB</div>
                      </div>
                    </div>

                    {/* Each Transaction */}
                    {entries.map((log, idx) => (
                      <AuditRow key={log.id} log={log} idx={idx} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}


      {/* DETAIL TAB */}
      {tab === 'detail' && detail && (
        <div style={{ background: 'white', borderRadius: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Eye size={16} color="#059669" /> Sale Detail — {detail.invoice_number || `#${detail.id}`}
            </h3>
            <button className="btn-3d" onClick={() => setTab('list')}>← Back to List</button>
          </div>

          <div style={{ padding: '1.25rem' }}>
            {/* Top summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Invoice', value: detail.invoice_number || `#${detail.id}` },
                { label: 'Sale Type', value: (detail.sale_type || '—').replace('_', ' ').toUpperCase() },
                { label: 'Cashier', value: detail.cashier_name || '—' },
                { label: 'Total Amount', value: `${parseFloat(detail.total_amount || 0).toFixed(2)} ETB`, green: true },
              ].map((card, i) => (
                <div key={i} style={{ background: '#F8FAFC', padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: card.green ? '#059669' : '#1E293B', wordBreak: 'break-all' }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment + Recipient */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Recipient */}
              <div style={{ background: '#F0FDF4', padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <User size={14} color="#059669" /> Recipient / Customer
                </h4>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                  {detail.customer_name || (detail.notes && detail.notes.match(/Recipient: ([^|]+)/)?.[1]?.trim()) || 'Walk-In Customer'}
                </div>
                <div style={{ fontSize: 12, color: '#374151' }}>
                  {detail.customer_phone || ''}
                </div>
                {detail.notes && detail.notes.includes('Recipient:') && (
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                    {detail.notes}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div style={{ background: '#EFF6FF', padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <DollarSign size={14} color="#2563EB" /> Payment Info
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>
                    <strong>Method:</strong> {detail.payment_method_name || '—'}
                  </div>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>
                    <strong>Amount Paid:</strong> {parseFloat(detail.amount_paid || detail.total_amount || 0).toFixed(2)} ETB
                  </div>
                  {detail.payment_reference && (
                    <div style={{ fontSize: 12, color: '#374151' }}>
                      <strong>Ref / TxnID:</strong> {detail.payment_reference}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      background: detail.status_name === 'Completed' ? '#D1FAE5' : '#FEF3C7',
                      color: detail.status_name === 'Completed' ? '#065F46' : '#92400E',
                      padding: '2px 10px', fontSize: 11, fontWeight: 700, borderRadius: 20
                    }}>{detail.status_name || 'Completed'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Items Purchased</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 12 }}>Product</th>
                    <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: 600, color: '#64748B', fontSize: 12 }}>Qty</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 12 }}>Unit Price</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 12 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items && detail.items.length > 0) ? detail.items.map((it, idx) => {
                    const qty = parseFloat(it.quantity) || 0;
                    const price = parseFloat(it.unit_price) || 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 0', color: '#1E293B', fontWeight: 500 }}>{it.product_name || `Product #${it.product_id}`}</td>
                        <td style={{ padding: '10px 0', textAlign: 'center', color: '#475569' }}>{qty}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#475569' }}>{price.toFixed(2)} ETB</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{(qty * price).toFixed(2)} ETB</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>No items found</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #E2E8F0' }}>
                    <td colSpan={3} style={{ padding: '10px 0', fontWeight: 700, color: '#1E293B', textAlign: 'right' }}>Grand Total</td>
                    <td style={{ padding: '10px 0', fontWeight: 800, color: '#059669', textAlign: 'right', fontSize: 15 }}>
                      {parseFloat(detail.total_amount || 0).toFixed(2)} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>

      {/* Submit to Manager Confirmation Modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 36, borderRadius: 0, maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.1)', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="#059669" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Submit Daily Sales?</h3>
            <p style={{ color: '#475569', marginBottom: 8, fontSize: 15 }}>
              You are about to submit <strong style={{ color: '#0f172a' }}>{sales.length} transaction{sales.length !== 1 ? 's' : ''}</strong> totalling
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginBottom: 8 }}>
              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 28 }}>
              This will be recorded in the audit log and sent to the Sales Manager. The sales list will be cleared after submission.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
                style={{ flex: 1, padding: '12px 0', background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await apiClient.post('/pos/sales/submit-daily', {});
                    setShowSubmitConfirm(false);
                    submitNotification('Sales Submitted to Finance', `${sales.length} transaction(s) totalling ${sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB submitted to Finance.`);
                    showToast('✅ Submitted to Finance — transactions moved to Audit', 'success');
                    // Clear the transactions list and reload audit trail
                    setSales([]);
                    await loadAuditTrail();
                  } catch (err) {
                    setShowSubmitConfirm(false);
                    showToast(err.message || 'Failed to submit data', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ flex: 1, padding: '12px 0', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <CheckCircle size={18} />
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', border: 'none', width: 400, borderRadius: 0, padding: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 24px', background: 'var(--header)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)' }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><XCircle size={18} /> Void Transaction</h3>
              <button onClick={() => setShowVoidModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-main)', fontSize: 14 }}>
                Are you sure you want to void transaction <strong>{voidSaleTarget?.invoice_number || voidSaleTarget?.id}</strong>?
                <br/><br/>
                Stock will be returned. This action cannot be undone.
              </p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>Reason for Voiding *</label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter void reason..."
                style={{ width: '100%', height: 80, padding: 10, border: '1px solid #E2E8F0', borderRadius: 0, fontSize: 13, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setShowVoidModal(false)} style={{ flex: 1, padding: 12, border: '1px solid #E2E8F0', background: '#F5F5F5', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={confirmVoidSale} disabled={loading} style={{ flex: 1, padding: 12, border: 'none', background: '#F44336', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportStoreProductModal 
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            setShowImportModal(false);
            showToast('Product successfully imported to retail POS!', 'success');
            loadProducts();
          }}
        />
      )}
    </>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#1B5E20', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 0, fontSize: 13, boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#424242' });
const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#1B5E20', borderRight: '1px solid #8D6E63' };
const tdStyle = { padding: '12px 14px', color: '#424242', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd' };
const tabBtn = (active) => ({
  background: active ? '#228B22' : 'white',
  color: active ? 'white' : '#424242',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 0, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 700 : 400,
});
