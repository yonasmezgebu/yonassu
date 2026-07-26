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
  const [tab, setTab] = useState('walkin');
  const [sales, setSales] = useState([]);
  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSuggestions, setproductSuggestions] = useState([]);
  const [showproductDropdown, setShowproductDropdown] = useState(null);
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
  const [paymentStatus, setPaymentStatus] = useState('PAID');

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
              recipient_name: payerName || recipientName,
              recipient_phone: payerPhone || recipientPhone,
              status: paymentStatus || 'PAID',
              ...(posPaymentMethod === 'BANK_TRANSFER' && { bank_name: bankName, account_holder: accountHolder, account_number: accountNumber }),
              ...(posPaymentMethod === 'TELBIR' && { telbir_number: telbirNumber }),
            }
          };
          const invoiceReq = await apiClient.post('/pos/checkout', payload);
          setOrderRequestId(null);
          
          setCompletedSale({
            invoice_number: invoiceReq.data?.invoice_number || 'POS-' + Math.floor(Math.random()*10000),
            total_amount: posCartTotal,
            payment_method: posPaymentMethod,
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
    try { const res = await apiClient.get('/pos/transactions'); if (res.status === 'success') setSales(res.data || []); } catch (e) { console.error(e); }
  };

  const viewSaleDetail = async (sale) => {
    setDetail(sale);
    setTab('detail');
  };

  const loadAuditTrail = async () => {
    // POS might not have an audit trail route currently
    setAuditTrail([]);
  };

  const loadPendingOrders = async () => {
    setLoadingPendingOrders(true);
    try {
      const res = await apiClient.get('/sales/requests/pending');
      const rawData = res.data?.data || res.data || [];
      const mappedOrders = rawData.map(req => ({
        id: req.id,
        sale_code: req.request_number,
        customer_name: req.customer_name,
        customer_phone: req.customer_phone,
        order_ref: req.request_number,
        created_at: req.requested_at,
        total_amount: req.total_amount,
        items: [{
          product_id: req.medication_id,
          product_name: req.medication_name,
          unit_price: req.price_per_unit || (req.total_amount / (req.quantity || 1)),
          quantity: req.quantity,
          line_total: req.total_amount
        }]
      }));
      setPendingOrders(mappedOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPendingOrders(false);
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
    setTab('walkin');
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
        product_id: row.product_id || undefined,
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
      const res = await apiClient.post('/pos/checkout', payload);
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
  };

  return (
    <>
    <div style={{ margin: 0, padding: '24px', minHeight: 'calc(100vh - 72px)', background: 'var(--bg-page)', width: '100%', fontFamily: "'Inter', sans-serif" }}>
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

        .rsp-card { background: var(--bg-main); border-radius: 0; overflow: hidden; border: 1px solid var(--earth); box-shadow: 2px 2px 0px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; animation: fadeUp 0.4s both; }
        .rsp-card:hover { transform: translateY(-3px); box-shadow: 4px 4px 0px rgba(0,0,0,0.15); border-color: var(--primary); }
        .rsp-card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; background: var(--bg-page); display: flex; align-items: center; justify-content: center; }
        .rsp-card-img { width: 100%; height: 100%; object-fit: cover; }
        .rsp-card-badge { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.9); padding: 4px 10px; border-radius: 0; font-size: 11px; font-weight: 700; color: var(--text-main); border: 1px solid var(--earth); }
        .rsp-card-oos { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; }
        .rsp-card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
        .rsp-card-name { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0 0 4px; }
        .rsp-card-desc { font-size: 12px; color: #666; margin: 0 0 8px; border-left: 2px solid var(--sage); padding-left: 6px; }
        .rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
        .rsp-price { font-size: 16px; font-weight: 800; color: var(--primary); }
        
        .rsp-add-btn { background-color: var(--emerald); color: white; border: none; border-bottom: 3px solid var(--header); padding: 6px 12px; border-radius: 0; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 12px; transition: all 0.15s; }
        .rsp-add-btn:hover:not(:disabled) { transform: translateY(1px); border-bottom-width: 2px; margin-top: 1px; }
        .rsp-add-btn:active:not(:disabled) { transform: translateY(3px); border-bottom-width: 0px; margin-top: 3px; }
        

        table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border: 1px solid var(--earth); }
        th { background: var(--header); color: white; padding: 12px; text-align: left; font-weight: 600; font-size: 14px; border-bottom: 2px solid var(--earth); }
        td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; color: var(--text-main); }
        tr:nth-child(even) { background-color: #f9fdf9; }
        tr:hover { background-color: var(--sage); color: var(--header); cursor: pointer; transition: background 0.2s; }
        
        /* Modern Inputs */
        input, select, textarea {
          border: 1px solid var(--earth);
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

      {/* ── PREMIUM HEADER ── */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(180deg, #f5f3ee 0%, #ece9e0 100%)',
        borderBottom: '2px solid var(--earth)', background: 'var(--bg-main)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ padding: '32px 48px 0' }}>

          {/* ── Top Row: Title + Buttons ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            {/* Left: Title + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <h1 style={{
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontSize: '3rem',
                fontWeight: 700,
                color: '#1a1a2e',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1
              }}>
                Sales
              </h1>
              {/* Teal Counter Bubble */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 76, height: 76, borderRadius: 0,
                background: 'radial-gradient(circle at 35% 35%, #a7f3d0, #2dd4bf)',
                boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.12), 0 8px 20px rgba(45,212,191,0.4)',
                border: '2px solid rgba(255,255,255,0.6)',
                color: '#065f46',
                lineHeight: 1,
                flexShrink: 0
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{sales.length}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>sales</span>
              </div>
            </div>

            {/* Right: Refresh + New Sale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Metallic Refresh Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button className="btn-3d" onClick={handleRefreshAll} disabled={refreshing}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 0,
                    background: refreshing
                      ? 'linear-gradient(145deg, #a0a0a4 0%, #c8c8cc 100%)'
                      : 'linear-gradient(145deg, #e8e8ea 0%, #b0b0b4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(255,255,255,0.6)'
                  }}>
                    <RefreshCw
                      size={22}
                      color={refreshing ? '#059669' : '#3f3f46'}
                      strokeWidth={2.5}
                      style={refreshing ? { animation: 'spin 0.7s linear infinite' } : {}}
                    />
                  </div>
                </button>
                <span style={{
                  fontSize: '0.72rem',
                  color: refreshing ? '#059669' : '#71717a',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s'
                }}>
                  {refreshing ? 'Loading...' : 'Refresh'}
                </span>
              </div>

              {/* Glossy New Sale Button */}
              <div style={{
                padding: 0
              }}>
                <button className="btn-3d" onClick={() => { setShowAudit(false); setTab('walkin'); resetForm(); }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 300, lineHeight: 1 }}>+</span> New Sale
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div style={{
            display: 'flex',
            background: 'linear-gradient(180deg, #e8e4da 0%, #f0ede4 100%)',
            borderRadius: 0,
            border: '1px solid #cbc6bb',
            borderBottom: 'none',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 -2px 6px rgba(0,0,0,0.02)',
            overflow: 'hidden'
          }}>
            {[
              { key: 'walkin',  icon: ShoppingCart, label: 'WALK-IN' },
              { key: 'online',  icon: Smartphone,   label: 'ONLINE' },
              { key: 'list',    icon: List,         label: 'SALES' },
              { key: 'audit',   icon: History,      label: 'AUDIT TRAIL' },
            ].map((t, idx, arr) => {
              const active = t.key === 'audit' ? showAudit : (tab === t.key && !showAudit);
              const TabIcon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === 'audit') {
                      setShowAudit(true); setTab('walkin'); loadAuditTrail();
                    } else {
                      setShowAudit(false); setTab(t.key);
                      if (t.key === 'walkin') setShowCart(false);
                      if (t.key === 'list') loadSales();
                      if (t.key === 'online') loadPendingOrders();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    borderRight: idx < arr.length - 1 && !active ? '1px solid #cbc6bb' : 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))'
                      : 'transparent',
                    color: active ? '#047857' : '#78716c',
                    fontWeight: active ? 800 : 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.06em',
                    boxShadow: active 
                      ? 'inset 0 3px 0 #059669, 0 0 24px rgba(16,185,129,0.15)' 
                      : 'none',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                    zIndex: active ? 10 : 1,
                    borderRadius: 0,
                  }}
                >
                  {/* Glowing Top Line */}
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: '10%', right: '10%',
                      height: 4,
                      background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
                      boxShadow: '0 2px 14px rgba(52,211,153,0.9), 0 0 8px rgba(16,185,129,0.6)',
                      borderRadius: 0,
                    }} />
                  )}
                  
                  <TabIcon 
                    size={18} 
                    color={active ? '#059669' : '#a8a29e'} 
                    strokeWidth={active ? 2.5 : 2} 
                    style={{ 
                      transition: 'all 0.3s', 
                      transform: active ? 'scale(1.1)' : 'scale(1)',
                      filter: active ? 'drop-shadow(0 2px 4px rgba(5,150,105,0.4))' : 'none'
                    }} 
                  />
                  <span>{t.label}</span>

                  {/* Cart badge on Walk-In tab */}
                  {t.key === 'walkin' && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setShowCart(c => !c); }}
                      title="Open Cart"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginLeft: 8,
                        background: posCart.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
                        color: posCart.length > 0 ? '#fff' : '#78716c',
                        borderRadius: 0,
                        padding: '3px 10px 3px 7px',
                        fontSize: 12,
                        fontWeight: 800,
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor: 'pointer',
                        boxShadow: posCart.length > 0 ? '0 4px 12px rgba(5,150,105,0.4)' : 'none',
                        border: posCart.length > 0 ? '1px solid #047857' : '1px solid #cbd5e1',
                        transform: posCart.length > 0 && active ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <ShoppingCart size={13} strokeWidth={2.5} />
                      <span>{posCart.length}</span>
                    </div>
                  )}

                  {/* Notification badge on ONLINE tab */}
                  {t.key === 'online' && pendingOrders.length > 0 && (
                    <div
                      title={`${pendingOrders.length} Pending Orders`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: 8,
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        color: '#fff',
                        borderRadius: 0,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                        border: '1px solid #b91c1c',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      {pendingOrders.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 48px', background: 'var(--bg-page)', width: '100%', minHeight: 'calc(100vh - 230px)' }}>


      {/* WALK-IN TAB */}
      {tab === 'walkin' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 0, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: 24, minHeight: '600px' }}>
          {!showCart ? (
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
                      <div key={item.id} className="rsp-card" style={{ animationDelay: idx * 0.04 + 's', borderColor: inCart ? '#059669' : '', boxShadow: inCart ? '0 8px 24px rgba(5,150,105,0.2)' : '' }}>
                        <div className="rsp-card-img-wrap">
                          {(() => {
                            const imgs = [item.product_image, item.product_image, item.cover_image].filter(Boolean);
                            const uniqueImgs = [...new Set(imgs)];
                            if (uniqueImgs.length === 0) return <Package size={36} color="#cbd5e1" />;
                            if (uniqueImgs.length === 1) return <img src={imgSrc(uniqueImgs[0])} className="rsp-card-img" alt={item.name} />;
                            return (
                              <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                                <img src={imgSrc(uniqueImgs[0])} className="rsp-card-img" alt={item.name} style={{ width: '50%', borderRight: '1px solid #e4e6ea' }} />
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
                              <p className="rsp-card-desc" style={expandedCards[item.id] ? { WebkitLineClamp: 'unset' } : {}}>
                                {item.description}
                              </p>
                              {item.description.length > 80 && (
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setExpandedCards(prev => ({...prev, [item.id]: !prev[item.id]})); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px', display: 'flex', justifyContent: 'center', color: '#94a3b8' }}
                                >
                                  <ChevronDown size={14} style={{ transform: expandedCards[item.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </button>
                              )}
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>🛍️ Cart & Checkout</h2>
                 <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }} style={{ padding: '10px 20px', borderRadius: 0, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
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
                   border: '1px solid rgba(52,211,153,0.3)',
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
                   <div style={{ border: '1px solid #e2e8f0', borderRadius: 0, overflow: 'hidden' }}>
                     <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>Cart Items ({posCart.length})</div>
                     <div style={{ padding: '0 20px', maxHeight: '400px', overflowY: 'auto' }}>
                       {posCart.length === 0 ? (
                         <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Cart is empty</div>
                       ) : (
                         posCart.map(item => (
                           <div key={item.id} style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                               <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{item.name}</div>
                               <div style={{ fontSize: 12, color: '#64748b' }}>{item.price} ETB each</div>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0, padding: 4 }}>
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
                       <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <button onClick={() => setPosCart([])} style={{ background: 'none', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 16px', borderRadius: 0, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><X size={16}/> Clear Cart</button>
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
                               border: `2px solid ${posPaymentMethod === pm.value ? '#059669' : '#E2E8F0'}`,
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
                         <div style={{ marginBottom: 20, background: '#FFFBEB', borderRadius: 0, padding: 16, border: '1px solid #FDE68A' }}>
                           <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <DollarSign size={16} color="#D97706" /> Cash Payment
                           </h3>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                             <div>
                               <label style={labelStyle}>Amount Received *</label>
                               <input type="number" step="0.01" min="0" value={paymentAmount}
                                 onChange={e => setPaymentAmount(e.target.value)} style={inputStyle()} />
                              </div>
                            </div>
                          </div>
                       )}

                       {/* Payment Detail Fields — BANK TRANSFER */}
                       {posPaymentMethod === 'BANK_TRANSFER' && (
                         <div style={{ marginBottom: 20, background: '#EFF6FF', borderRadius: 0, padding: 16, border: '1px solid #BFDBFE' }}>
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
                          </div>
                         </div>
                       )}

                       {/* Payment Detail Fields — TELBIR */}
                       {posPaymentMethod === 'TELBIR' && (
                         <div style={{ marginBottom: 20, background: '#F5F3FF', borderRadius: 0, padding: 16, border: '1px solid #DDD6FE' }}>
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
                               padding: '14px 24px', borderRadius: 0, border: `2px solid ${paymentStatus === 'PAID' ? '#059669' : '#E2E8F0'}`,
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
                               padding: '14px 24px', borderRadius: 0, border: `2px solid ${paymentStatus === 'CASHOUT' ? '#D97706' : '#E2E8F0'}`,
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
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '12px 24px', marginBottom: 20, width: '100%', maxWidth: 400 }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: 16, marginBottom: 4 }}>Receipt: {completedSale.receipt_no}</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>Branch: <strong>{completedSale.branch}</strong></div>
                        <div style={{ fontSize: 13, color: '#374151' }}>Cashier: <strong>{completedSale.worker}</strong></div>
                        <div style={{ fontSize: 13, color: '#374151' }}>Customer: <strong>{completedSale.recipient_name}</strong></div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669', marginTop: 8 }}>Total: {completedSale.total.toFixed(2)} ETB</div>
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
        <div style={{ background: 'white', borderRadius: 0, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 28px' }}>
             <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>📋 All Sales</h2>
             {sales.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                  <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No sales recorded</h3>
               </div>
             ) : (
               <div style={{ overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 0, overflow: 'hidden', minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={thStyle}>Receipt No</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Branch</th>
                        <th style={thStyle}>Worker</th>
                        <th style={thStyle}>Payment</th>
                        <th style={thStyle}>Total Amount</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(sale => {
                        // Fallback: resolve branch and worker names from local state if join didn't return them
                        const resolvedBranch = sale.branch_name ||
                          branches.find(b => String(b.id) === String(sale.branch_id))?.name ||
                          (sale.branch_id ? `Branch #${sale.branch_id}` : '—');
                        const resolvedWorker = sale.worker_name ||
                          workers.find(w => String(w.id) === String(sale.worker_id))?.name ||
                          (sale.worker_id ? `Worker #${sale.worker_id}` : '—');
                        return (
                        <tr key={sale.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                           <td style={tdStyle}><strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{sale.receipt_no || sale.sale_no || `REC-${sale.id}`}</strong></td>
                           <td style={tdStyle}>{new Date(sale.created_at).toLocaleString()}</td>
                           <td style={tdStyle}>
                             <span style={{
                               background: sale.sale_type === 'ONLINE' ? 'rgba(124,58,237,0.1)' : 'rgba(5,150,105,0.1)',
                               color: sale.sale_type === 'ONLINE' ? '#7c3aed' : '#065f46',
                               padding: '3px 10px', borderRadius: 0, fontSize: 11, fontWeight: 800
                             }}>{sale.sale_type === 'ONLINE' ? '🌐 ONLINE' : '🛒 WALK-IN'}</span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 0, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{resolvedBranch}</span>
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               <span style={{ background: '#fef9c3', color: '#854d0e', borderRadius: 0, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{resolvedWorker}</span>
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{
                               background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 0, fontSize: 11, fontWeight: 600
                             }}>{sale.payment_method || 'CASH'}</span>
                           </td>
                           <td style={{ ...tdStyle, fontWeight: 700, color: '#059669' }}>{parseFloat(sale.total_amount || 0).toFixed(2)} ETB</td>
                           <td style={tdStyle}>
                             <button onClick={() => viewSaleDetail(sale)} style={{ padding: '6px 14px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View</button>
                           </td>
                        </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 800 }}>
                      <tr>
                        <td colSpan="6" style={{ ...tdStyle, textAlign: 'right', fontSize: 14 }}>TOTAL TRANSACTIONS: {sales.length}</td>
                        <td colSpan="2" style={{ ...tdStyle, fontSize: 15, color: '#059669' }}>
                          {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
                        </td>
                      </tr>
                    </tfoot>
                 </table>
               </div>
             )}

             {sales.length > 0 && (
               <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: 0, border: '1px solid #e2e8f0' }}>
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
                   {loading ? 'Submitting...' : 'Submit to Manager'}
                 </button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* ONLINE TAB */}
      {tab === 'online' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 0, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>📦 Pending Online Orders</h2>
              <button onClick={loadPendingOrders} disabled={loadingPendingOrders} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 0, cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
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
                  <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 0, padding: 16, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
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
                    <div style={{ marginBottom: 12, background: 'white', padding: '8px 12px', borderRadius: 0, border: '1px solid #f1f5f9' }}>
                      {(order.items || []).map(item => (
                        <div key={item.id || item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
                          <span>💊 {item.product_name} × {item.quantity}</span>
                          <span style={{ fontWeight: 600 }}>{parseFloat(item.line_total || (item.quantity * item.unit_price)).toFixed(2)} ETB</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
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
      {showAudit && (
        <div style={{ background: 'white', borderRadius: 0, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>📜 Audit Trail</h2>
              <button onClick={() => setShowAudit(false)} style={{ padding: '6px 14px', borderRadius: 0, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Close Audit Trail
              </button>
            </div>
            
            {auditTrail.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
                <h3 style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>No pending audit logs</h3>
                <p style={{ fontSize: 13 }}>All audit logs have been submitted or none exist.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 0, overflow: 'hidden', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Action</th>
                      <th style={thStyle}>Details</th>
                      <th style={thStyle}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditTrail.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                        <td style={tdStyle}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: log.action === 'RETURN' ? '#e11d48' : '#059669' }}>
                          {log.action}
                        </td>
                        <td style={tdStyle}>{log.recipient}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: parseFloat(log.amount) < 0 ? '#e11d48' : '#1E293B' }}>
                          {parseFloat(log.amount || 0).toFixed(2)} ETB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL TAB */}
      {tab === 'detail' && detail && (
        <div style={{ background: 'white', borderRadius: 0, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={16} color="#059669" /> Sale Detail
            </h3>
            <button className="btn-3d" onClick={() => setTab('list')}
              >
              Back to List
            </button>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 0, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Sale #</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{detail.sale_no || detail.id}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 0, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Type</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{detail.sale_type || '—'}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 0, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                  {parseFloat(detail.payment?.amount || detail.total_amount || 0).toFixed(2)} ETB
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 0, padding: 16, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} color="#059669" /> Recipient
                </h4>
                <div style={{ fontSize: 13, marginBottom: 4 }}><strong>{detail.payment?.recipient_name || detail.recipient_name || '—'}</strong></div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{detail.payment?.recipient_phone || ''}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 0, padding: 16, border: '1px solid #E2E8F0' }}>
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
                    padding: '2px 8px', borderRadius: 0, fontSize: 11, fontWeight: 600,
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #E2E8F0', borderRadius: 0, overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ ...thStyle, width: '50%' }}>product</th>
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
                        <td style={tdStyle}>{it.product_name}</td>
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
                    await apiClient.post('/sales/submit-daily', {});
                    setShowSubmitConfirm(false);
                    submitNotification('Sales Submitted', `${sales.length} transaction(s) totalling ${sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB submitted to the Sales Manager.`);
                    showToast('✅ Full day data submitted to Manager', 'success');
                    loadSales();
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
    </>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 0, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 0, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
