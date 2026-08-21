import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';
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
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PharmacySalesForm.module.css';
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: <DollarSign size={16} /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard size={16} /> },
  { value: 'TELBIR', label: 'Telbir', icon: <Smartphone size={16} /> },
];

const SALE_TYPES = [
  { value: 'WALK-IN', label: 'Walk-In', icon: <ShoppingCart size={16} /> },
  { value: 'ONLINE', label: 'Online', icon: <Smartphone size={16} /> },
];

const EMPTY_ITEM = { drug_id: null, drug_name: '', quantity: '', unit_price: '' };

export default function PharmacySalesForm() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();
  const [tab, setTab] = useState('walkin');
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
  const [autoFilledWorker, setAutoFilledWorker] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PAID');

  const [financeAccounts, setFinanceAccounts] = useState([]);

  // Central VAT config (CEO Tax & VAT service)
  const [vatCtx, setVatCtx] = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

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
  const [prescriptionRequestId, setPrescriptionRequestId] = useState(null);
  const [activeOnlineOrder, setActiveOnlineOrder] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const mockInventory = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Painkillers', price: 50, stock: 100 },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 350, stock: 45 },
    { id: 3, name: 'Vitamin C', category: 'Supplements', price: 30, stock: 200 },
  ];

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

  const posCartSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const posCartVat = vatCtx
    ? posCart.reduce((sum, item) => sum + getVatForItem(vatCtx, 'pharmacy', item.id, item.price * item.qty).vat, 0)
    : 0;
  const posCartTotal = posCartSubtotal + posCartVat;


  const handleProcessPayment = async () => {
    if (!posPaymentMethod) { showToast('Please select a payment method', 'warning'); return; }
    if (posCart.length === 0) { showToast('Cart is empty', 'warning'); return; }

    const selectedBranch = branches.find(b => String(b.id) === String(branchId));

    // Build items list — include drug_id so backend can reliably find the medication
    const saleItems = posCart.map(item => ({
      drug_id: item.id,
      drug_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
    }));

    const payload = {
      branch_id: branchId ? parseInt(branchId) : (branches[0]?.id || 1),
      worker_id: workers[0]?.id || null,
      sale_type: saleType,
      items: saleItems,
      payment: {
        method: posPaymentMethod,
        amount: posCartTotal,
        recipient_name: payerName || recipientName,
        recipient_phone: payerPhone || recipientPhone,
        branch_name: selectedBranch?.name || selectedBranch?.branch_name || '',
        worker_name: workerName,
        status: paymentStatus || 'PAID',
        ...(posPaymentMethod === 'BANK_TRANSFER' && { bank_name: bankName, account_holder: accountHolder, account_number: accountNumber }),
        ...(posPaymentMethod === 'TELBIR' && { telbir_number: telbirNumber }),
      },
    };

    setLoading(true);
    try {
      const res = await apiClient.post('/pharmacy/sales', payload);
      if (res.status === 'success' || res.data) {
        // If this came from an online order, mark prescription request as approved & ready
        if (prescriptionRequestId) {
          try {
            await apiClient.post(`/pharmacy/requests/${prescriptionRequestId}/approve`, {});
            await apiClient.put(`/pharmacy/requests/${prescriptionRequestId}/ready`, {});
          } catch (approveErr) {
            console.warn('Could not mark prescription request as complete:', approveErr.message);
          }
          // Remove from pending orders list
          setPendingOrders(prev => prev.filter(o => o.id !== prescriptionRequestId));
        }

        // Save completed sale info for receipt
        const selectedBranchObj = branches.find(b => String(b.id) === String(branchId)) || branches[0];
        const selectedWorkerObj = workers[0];
        setCompletedSale({
          receipt_no: res.data?.receipt_no || `REC-${Date.now()}`,
          date: new Date().toLocaleString(),
          branch: selectedBranchObj?.name || selectedBranchObj?.branch_name || 'N/A',
          worker: selectedWorkerObj?.name || workerName || 'N/A',
          items: posCart,
          total: posCartTotal,
          payment_method: posPaymentMethod,
          payment_status: paymentStatus || 'PAID',
          recipient_name: payerName || recipientName || 'N/A',
          recipient_phone: payerPhone || recipientPhone || '',
          bank_name: bankName,
          telbir_number: telbirNumber,
        });

        // Refresh sales list AND product stock in real-time
        loadSales();
        loadProducts();

        showToast('✅ Sale recorded successfully!', 'success');
        playSound('success');
        submitNotification('Payment Processed', 'Transaction completed successfully. Model 22 Generated.');
        setPosStep(4);
        setPosCart([]);
        setPosPaymentMethod('');
      }
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
      <!DOCTYPE html><html><head><title>Receipt ${completedSale.receipt_no}</title>
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
        <h2>SUTANA PHARMACY</h2>
        <div class='center' style='font-size:11px; margin-bottom:8px;'>Official Receipt</div>
        <div class='divider'></div>
        <div class='row'><span>Receipt No:</span><span>${completedSale.receipt_no}</span></div>
        <div class='row'><span>Date:</span><span>${completedSale.date}</span></div>
        <div class='row'><span>Branch:</span><span>${completedSale.branch}</span></div>
        <div class='row'><span>Cashier:</span><span>${completedSale.worker}</span></div>
        <div class='row'><span>Customer:</span><span>${completedSale.recipient_name}</span></div>
        ${completedSale.recipient_phone ? `<div class='row'><span>Phone:</span><span>${completedSale.recipient_phone}</span></div>` : ''}
        <div class='divider'></div>
        <div style='font-weight:bold; margin-bottom:4px;'>ITEMS</div>
        ${(completedSale.items || []).map(it => `
          <div class='row'>
            <span>${it.name} x${it.qty}</span>
            <span>${(it.price * it.qty).toFixed(2)} ETB</span>
          </div>`).join('')}
        <div class='divider'></div>
        <div class='row total'><span>TOTAL</span><span>${completedSale.total.toFixed(2)} ETB</span></div>
        <div class='row'><span>Payment:</span><span>${completedSale.payment_method}</span></div>
        <div class='row'><span>Status:</span><span>${completedSale.payment_status}</span></div>
        ${completedSale.bank_name ? `<div class='row'><span>Bank:</span><span>${completedSale.bank_name}</span></div>` : ''}
        ${completedSale.telbir_number ? `<div class='row'><span>Telebirr:</span><span>${completedSale.telbir_number}</span></div>` : ''}
        <div class='divider'></div>
        <div class='footer'>Thank you for your purchase!<br/>Sutana Pharmacy &mdash; Your Health Partner</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };


  const grandTotal = items.reduce((sum, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    const r = vatCtx ? getVatForItem(vatCtx, 'pharmacy', row.drug_id, qty * price) : { vat: 0 };
    return sum + (qty * price) + r.vat;
  }, 0);

  useEffect(() => { setPaymentAmount(grandTotal > 0 ? grandTotal.toFixed(2) : ''); }, [grandTotal]);

  useEffect(() => {
    if (posCartTotal > 0) {
      setPaymentAmount(posCartTotal);
    }
  }, [posCartTotal]);

  useEffect(() => {
    // When branch changes, auto-fill the worker assigned to that branch
    if (branchId && workers.length > 0) {
      const bId = parseInt(branchId);
      const branchWorker = workers.find(w => parseInt(w.branch_id) === bId);
      if (branchWorker) {
        setWorkerName(branchWorker.full_name || '');
        setAutoFilledWorker(branchWorker);
      } else {
        setWorkerName('');
        setAutoFilledWorker(null);
      }
    } else {
      setAutoFilledWorker(null);
      if (!branchId) setWorkerName('');
    }
  }, [branchId, workers]);

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

  useEffect(() => { loadBranches(); loadWorkers(); loadProducts(); loadSales(); loadFinanceAccounts(); }, []);

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
      await Promise.all([loadBranches(), loadWorkers(), loadProducts(), loadSales(), loadAuditTrail(), loadPendingOrders(), loadFinanceAccounts()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleSearch = (e) => setNavSearch(e.detail || '');
    const handleRefresh = () => handleRefreshAll();
    
    const handleSelect = (e) => {
      const selected = e.detail;
      if (!selected) return;
      if (selected.type === 'product') {
        setTab('walkin');
        if (selected.item.stock > 0) {
          addToCart(selected.item);
          setShowCart(true);
        } else {
          alert('This item is out of stock.');
        }
      } else if (selected.type === 'online_order') {
        setTab('online');
      }
    };

    window.addEventListener('dashboardSearch', handleSearch);
    window.addEventListener('dashboardSearchSelect', handleSelect);
    window.addEventListener('dashboardRefresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboardSearch', handleSearch);
      window.removeEventListener('dashboardSearchSelect', handleSelect);
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }, [posCart]);

  const loadBranches = async () => {
    try { const res = await apiClient.get('/pharmacy/branches'); if (res.status === 'success') setBranches(res.data || []); } catch (e) { console.error(e); }
  };

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

  const loadWorkers = async () => {
    try {
      // Use /users/pharmacy-workers which includes branch_id and sub_role
      const res = await apiClient.get('/users/pharmacy-workers');
      const data = Array.isArray(res?.data) ? res.data :
                   Array.isArray(res?.data?.data) ? res.data.data :
                   Array.isArray(res) ? res : [];
      setWorkers(data);
    } catch (e) {
      // Fallback to pharmacy/workers route
      try {
        const res2 = await apiClient.get('/pharmacy/workers');
        const data2 = Array.isArray(res2?.data) ? res2.data : [];
        setWorkers(data2);
      } catch (e2) { console.error(e2); }
    }
  };


  const loadProducts = async () => {
    try {
      const raw = await pharmacyService.getAllProducts();
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.products || [];
      const mapped = list.map(p => ({
        ...p,
        id: p.id,
        name: p.name,
        category: p.category_name || p.category || 'Uncategorized',
        price: parseFloat(p.price || p.selling_price || p.unit_price || 0),
        stock: parseInt(p.stock_quantity ?? 0),          // ← from pharmacy_medications.stock_quantity
        reorder: parseInt(p.reorder_level || 10),
        image: p.drug_image || p.cover_image || null,
        strength: p.strength,
        unit: p.unit
      }));
      setProducts(mapped);
    } catch (e) {
      console.error('pharmacy inventory fetch failed, falling back to products', e);
      try {
        const res2 = await apiClient.get('/pharmacy/products');
        const list2 = Array.isArray(res2?.data) ? res2.data : (res2?.data?.data || []);
        const mapped2 = list2.map(p => ({
          ...p,
          id: p.id,
          name: p.name,
          category: p.category_name || p.category || 'Uncategorized',
          price: parseFloat(p.price || p.selling_price || p.unit_price || 0),
          stock: parseInt(p.stock_quantity ?? 0),        // ← same field from pharmacy_medications
          reorder: parseInt(p.reorder_level || 10),
          image: p.drug_image || p.cover_image || null,
          strength: p.strength,
          unit: p.unit
        }));
        setProducts(mapped2);
      } catch (e2) { console.error(e2); }
    }
  };

  const loadSales = async () => {
    try { const res = await apiClient.get('/pharmacy/sales'); if (res.status === 'success') setSales(res.data || []); } catch (e) { console.error(e); }
  };

  const viewSaleDetail = async (sale) => {
    try {
      const res = await apiClient.get(`/pharmacy/sales/${sale.id}`);
      if (res.status === 'success' && res.data) {
        setDetail(res.data);
      } else {
        setDetail(sale);
      }
    } catch (e) {
      console.error(e);
      setDetail(sale);
    }
    setTab('detail');
  };

  const loadAuditTrail = async () => {
    try { const res = await apiClient.get('/pharmacy/audit-trail'); if (res.status === 'success') setAuditTrail(res.data || []); } catch (e) { console.error(e); }
  };

  const loadPendingOrders = async () => {
    setLoadingPendingOrders(true);
    try {
      const res = await apiClient.get('/pharmacy/requests/pending');
      const rawData = res.data?.data || res.data || [];
      const mappedOrders = rawData.map(req => ({
        id: req.id,
        sale_code: req.request_number,
        customer_name: req.customer_name,
        customer_phone: req.customer_phone,
        prescription_ref: req.request_number,
        created_at: req.requested_at,
        total_amount: req.total_amount,
        items: [{
          drug_id: req.medication_id,
          drug_name: req.medication_name,
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
      id: item.drug_id,
      name: item.drug_name,
      price: parseFloat(item.unit_price) || 0,
      qty: parseInt(item.quantity) || 1,
      stock: 9999, // Bypass local stock check for pre-approved orders
      vat_rate: item.vat_rate || 0,
    }));

    // ── Auto-fill all form fields from the online order ──
    setPosCart(newCart);
    setSaleType('ONLINE');
    setActiveOnlineOrder(order);
    setPrescriptionRequestId(order.id); // track the prescription_request id for later approval

    // Customer info
    setRecipientName(order.customer_name || '');
    setRecipientPhone(order.customer_phone || '');
    setPayerName(order.customer_name || '');
    setPayerPhone(order.customer_phone || '');

    // Payment amount pre-filled with order total
    setPaymentAmount(parseFloat(order.total_amount || 0).toFixed(2));
    setPaymentStatus('PAID');

    // Auto-select first available branch if not set
    if (order.branch_id) {
      setBranchId(String(order.branch_id));
    } else if (branches.length > 0) {
      setBranchId(String(branches[0].id));
    }

    // Auto-select CASH as default payment method
    setPosPaymentMethod('CASH');

    setTab('walkin');
    setShowCart(true);
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

  const selectDrug = (idx, product) => {
    // Accept either a product object or a plain name string
    const name = typeof product === 'string' ? product : (product?.name || product);
    const drugId = typeof product === 'object' && product !== null ? (product.id || null) : null;
    setItems(prev => prev.map((row, i) => i !== idx ? row : { ...row, drug_id: drugId, drug_name: name, unit_price: row.unit_price || (drugId && typeof product === 'object' ? String(product.price || '') : row.unit_price) }));
    setShowDrugDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(row => row.drug_name.trim() && row.quantity && row.unit_price);
    if (validItems.length === 0) { showToast('Please add at least one item', 'warning'); return; }
    if (!branchId) { showToast('Select a branch', 'warning'); return; }

    const selectedBranch = branches.find(b => b.id === parseInt(branchId) || b.branch_id === parseInt(branchId));
    const payload = {
      branch_id: parseInt(branchId),
      worker_id: workers[0]?.id || null,
      sale_type: saleType,
      items: validItems.map(row => ({
        drug_id: row.drug_id || undefined,
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
      skip_stock_deduction: !!prescriptionRequestId
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
    setActiveOnlineOrder(null);
    setPrescriptionRequestId(null);
  };

  return (
    <>
      <div className={styles.pageWrapper}>
        <ToastContainer />

        {/* ── PREMIUM HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            {/* Left: Title + Badge */}
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>Pharmacy Sales</h1>
              <div className={styles.salesBubble}>
                <span className={styles.salesBubbleCount}>{sales.length}</span>
                <span className={styles.salesBubbleLabel}>sales</span>
              </div>
            </div>

            {/* Right: Refresh + New Sale */}
            <div className={styles.headerRight}>
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                title="Refresh sales"
                className={styles.refreshBtn}
              >
                {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={14} />}
                {refreshing ? 'Loading...' : 'Refresh'}
              </button>

              <button
                onClick={() => { setShowAudit(false); setTab('walkin'); resetForm(); }}
                className={styles.newSaleBtn}
              >
                <Plus size={18} /> New Sale
              </button>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div className={styles.tabBar}>
            {[
              { key: 'walkin',  icon: ShoppingCart, label: 'WALK-IN' },
              { key: 'online',  icon: Smartphone,   label: 'ONLINE' },
              { key: 'list',    icon: List,         label: 'SALES' },
              { key: 'audit',   icon: History,      label: 'AUDIT TRAIL' },
            ].map((t) => {
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
                  className={active ? styles.tabActive : styles.tab}
                >
                  <TabIcon size={16} />
                  {t.label}

                  {/* Cart badge on Walk-In tab */}
                  {t.key === 'walkin' && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setShowCart(c => !c); }}
                      title="Open Cart"
                      className={posCart.length > 0 ? styles.cartBadgeActive : styles.cartBadge}
                    >
                      <ShoppingCart size={12} />
                      {posCart.length}
                    </div>
                  )}

                  {/* Notification badge on ONLINE tab */}
                  {t.key === 'online' && pendingOrders.length > 0 && (
                    <div
                      title={`${pendingOrders.length} Pending Orders`}
                      className={styles.pendingBadge}
                    >
                      {pendingOrders.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>

          {/* WALK-IN TAB */}
          {tab === 'walkin' && !showAudit && (
            <div className={styles.card}>
              {!showCart ? (
                <div className={styles.cardBody}>
                  <div className={styles.productGrid}>
                    {/* Product Grid */}
                    {products
                      .filter(i => !navSearch || (i.name && i.name.toLowerCase().includes(navSearch.toLowerCase())))
                      .map((item, idx) => {
                        const inCart = posCart.find(c => c.id === item.id);
                        const stockVal = item.stock !== undefined ? item.stock : (item.quantity || 0);
                        const stockLabel = stockVal <= 0 ? 'Oos' : stockVal <= (item.reorder_level || 10) ? 'Low' : 'Normal';
                        const stockText = stockVal <= 0 ? '0 Out of Stock' : stockVal <= (item.reorder_level || 10) ? `${stockVal} Low Stock` : `${stockVal} In Stock`;
                        const priceVal = item.price || item.selling_price || item.unit_price || 0;
                        
                        const imgSrc = (url) => {
                          if (!url) return null;
                          return url.startsWith('http') ? url : 'http://localhost:5000' + url;
                        };
                        
                        return (
                          <div key={item.id} className={inCart ? styles.productCardInCart : styles.productCard}>
                            <div className={styles.productImgWrap}>
                              {(() => {
                                const imgs = [item.product_image, item.drug_image, item.cover_image].filter(Boolean);
                                const uniqueImgs = [...new Set(imgs)];
                                if (uniqueImgs.length === 0) return <Package size={36} color="#cbd5e1" />;
                                if (uniqueImgs.length === 1) return <img src={imgSrc(uniqueImgs[0])} className={styles.productImg} alt={item.name} />;
                                return (
                                  <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                                    <img src={imgSrc(uniqueImgs[0])} className={styles.productImg} alt={item.name} style={{ width: '50%', borderRight: '1px solid #E5E7EB' }} />
                                    <img src={imgSrc(uniqueImgs[1])} className={styles.productImg} alt={item.name} style={{ width: '50%' }} />
                                  </div>
                                );
                              })()}
                              {(item.category || item.category_name) && <div className={styles.productCategoryBadge}>{item.category || item.category_name}</div>}
                              {stockVal <= 0 && <div className={styles.oosOverlay}>OUT OF STOCK</div>}
                            </div>
                            <div className={styles.productBody}>
                              <h3 className={styles.productName}>{item.name}</h3>
                              <span className={styles['stock' + stockLabel]}>
                                📦 {stockText}
                              </span>
                              
                              {item.description && (
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <p className={expandedCards[item.id] ? styles.productDescExpanded : styles.productDesc}>
                                    {item.description}
                                  </p>
                                  {item.description.length > 80 && (
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setExpandedCards(prev => ({...prev, [item.id]: !prev[item.id]})); }}
                                      className={styles.expandBtn}
                                    >
                                      <ChevronDown size={14} style={{ transform: expandedCards[item.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              <div className={styles.productFooter}>
                                <div className={styles.productPrice}>{parseFloat(priceVal).toLocaleString()} ETB</div>
                                <button
                                  type="button"
                                  className={inCart ? styles.addBtnInCart : styles.addBtn}
                                  disabled={stockVal <= 0}
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
                </div>
              ) : (
                <div className={styles.cardBody}>
                   <div className={styles.cartHeader}>
                     <h2 className={styles.cartTitle}>🛍️ Cart & Checkout</h2>
                     <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }} className={styles.btnSecondary}>
                       ← Back to Products
                     </button>
                   </div>

                   {/* ── Online Order Banner ── */}
                   {activeOnlineOrder && (
                     <div className={styles.onlineBanner}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <div className={styles.onlineBannerIcon}>📦</div>
                         <div>
                           <div className={styles.onlineBannerLabel}>🌐 Online Order — Auto-Filled</div>
                           <div className={styles.onlineBannerCode}>{activeOnlineOrder.sale_code || `Order #${activeOnlineOrder.id}`}</div>
                           <div className={styles.onlineBannerSub}>👤 {activeOnlineOrder.customer_name || 'Guest'} &nbsp;·&nbsp; 📱 {activeOnlineOrder.customer_phone || '—'}</div>
                         </div>
                       </div>
                       <div className={styles.onlineBannerTotal}>
                         <div className={styles.onlineBannerTotalLabel}>Total</div>
                         <div className={styles.onlineBannerTotalValue}>{parseFloat(activeOnlineOrder.total_amount || 0).toFixed(2)} ETB</div>
                       </div>
                     </div>
                   )}

                   {posStep === 1 || posStep === 2 || posStep === 3 ? (
                     <>
                       {/* Items List */}
                       <div className={styles.cartItemsCard}>
                         <div className={styles.cartItemsHead}>Cart Items ({posCart.length})</div>
                         <div className={styles.cartItemsBody}>
                           {posCart.length === 0 ? (
                             <div className={styles.cartEmpty}>Cart is empty</div>
                           ) : (
                             posCart.map(item => (
                               <div key={item.id} className={styles.cartItem}>
                                 <div>
                                   <div className={styles.cartItemName}>{item.name}</div>
                                   <div className={styles.cartItemSub}>{item.price} ETB each</div>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                   <div className={styles.qtyControl}>
                                     <button onClick={() => updateQty(item.id, item.qty - 1)} className={styles.qtyBtn}><Minus size={14}/></button>
                                     <span className={styles.qtyNum}>{item.qty}</span>
                                     <button onClick={() => updateQty(item.id, item.qty + 1)} className={styles.qtyBtn}><Plus size={14}/></button>
                                   </div>
                                   <div className={styles.cartItemTotal}>{(item.price * item.qty).toFixed(2)} ETB</div>
                                   <button onClick={() => setPosCart(posCart.filter(c => c.id !== item.id))} className={styles.btnDanger} style={{ padding: '8px' }}><Trash2 size={16}/></button>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                         {posCart.length > 0 && (
                           <div className={styles.cartFooter}>
                             <button onClick={() => setPosCart([])} className={styles.btnDanger}><X size={16}/> Clear Cart</button>
                             {posCartVat > 0 && <div className={styles.cartTotal} style={{ fontSize: 11, opacity: 0.85 }}>VAT (incl.): <span className={styles.cartTotalAmount}>{posCartVat.toFixed(2)} ETB</span></div>}
                             <div className={styles.cartTotal}>Total: <span className={styles.cartTotalAmount}>{posCartTotal.toFixed(2)} ETB</span></div>
                           </div>
                         )}
                       </div>

                       {posCart.length > 0 && (
                         <>
                           {/* Payment Method */}
                           <div className={styles.mb20}>
                             <label className={styles.sectionLabel}>Payment Method *</label>
                             <div className={styles.paymentMethods}>
                               {PAYMENT_METHODS.map(pm => (
                                 <label key={pm.value} className={posPaymentMethod === pm.value ? styles.paymentMethodOptActive : styles.paymentMethodOpt}>
                                   <input type="radio" name="posPaymentMethod" value={pm.value} checked={posPaymentMethod === pm.value}
                                     onChange={() => setPosPaymentMethod(pm.value)} style={{ display: 'none' }} />
                                   {pm.icon} {pm.label}
                                 </label>
                               ))}
                             </div>
                           </div>

                           {/* Payment Detail Fields — CASH */}
                           {posPaymentMethod === 'CASH' && (
                             <div className={styles.payPanelCash}>
                               <h3 className={styles.payPanelTitle}>
                                 <DollarSign size={16} color="#D97706" /> Cash Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Recipient Full Name *</label>
                                   <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                                     placeholder="Who received cash" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Recipient Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? `(${autoFilledWorker.sub_role})` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Detail Fields — BANK TRANSFER */}
                           {posPaymentMethod === 'BANK_TRANSFER' && (
                             <div className={styles.payPanelBank}>
                               <h3 className={styles.payPanelTitle}>
                                 <CreditCard size={16} color="#2563EB" /> Bank Transfer Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Finance Account (Auto-fill)</label>
                                   <select className={styles.formInput} onChange={(e) => {
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
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Bank Name *</label>
                                   <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                                     placeholder="e.g. CBE" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Account Holder *</label>
                                   <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                                     placeholder="Full name on account" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Account Number *</label>
                                   <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                                     placeholder="Account number" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? `(${autoFilledWorker.sub_role})` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Detail Fields — TELBIR */}
                           {posPaymentMethod === 'TELBIR' && (
                             <div className={styles.payPanelTelbir}>
                               <h3 className={styles.payPanelTitle}>
                                 <Smartphone size={16} color="#7C3AED" /> Telbir Payment
                               </h3>
                               <div className={styles.formGrid3}>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Amount Received *</label>
                                   <input type="number" step="0.01" min="0" value={paymentAmount}
                                     onChange={e => setPaymentAmount(e.target.value)} className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Telebirr Account (Auto-fill)</label>
                                   <select className={styles.formInput} onChange={(e) => {
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
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Telbir Number *</label>
                                   <input type="text" value={telbirNumber} onChange={e => setTelbirNumber(e.target.value)}
                                     placeholder="Telbir number" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Full Name *</label>
                                   <input type="text" value={payerName} onChange={e => setPayerName(e.target.value)}
                                     placeholder="Sender full name" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Phone</label>
                                   <input type="text" value={payerPhone} onChange={e => setPayerPhone(e.target.value)}
                                     placeholder="Phone" className={styles.formInput} />
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Branch *</label>
                                   <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.formInput}>
                                     <option value="">— Select branch —</option>
                                     {branches.map(b => (
                                       <option key={b.id} value={b.id}>{b.name || b.branch_name}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <div className={styles.formGroup}>
                                   <label className={styles.formLabel}>Worker Name *</label>
                                   {autoFilledWorker ? (
                                     <div>
                                       <input type="text" value={workerName} readOnly className={styles.formInputReadonly} />
                                       <div className={styles.autofillNote}>&#10003; Auto-filled {autoFilledWorker.sub_role ? `(${autoFilledWorker.sub_role})` : ''}</div>
                                     </div>
                                   ) : (
                                     <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                       placeholder="Select a branch to auto-fill" className={styles.formInput} />
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Payment Status Checkbox */}
                           <div className={styles.mb20}>
                             <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', color: '#16A34A', background: '#F0FDF4', padding: '12px 16px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                               <input 
                                 type="checkbox" 
                                 checked={paymentStatus === 'PAID'} 
                                 onChange={(e) => setPaymentStatus(e.target.checked ? 'PAID' : '')} 
                                 style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16A34A' }}
                               />
                               <CheckCircle size={20} /> Transaction is PAID
                             </label>
                           </div>

                           {/* Submit */}
                           <button type="button" disabled={loading || !posPaymentMethod || !paymentStatus}
                             onClick={handleProcessPayment}
                             className={styles.recordSaleBtn}>
                             <ShoppingCart size={18} /> {loading ? 'Processing...' : `Record Sale — ${posCartTotal > 0 ? posCartTotal.toFixed(2) : '0.00'} ETB`}
                           </button>
                         </>
                       )}
                     </>
                   ) : posStep === 4 ? (
                      <div className={styles.successScreen}>
                        <CheckCircle size={64} color='#16A34A' style={{ marginBottom: 16 }} />
                        <h3 className={styles.successTitle}>Transaction Complete!</h3>
                        {completedSale && (
                          <div className={styles.successReceipt}>
                            <div className={styles.receiptNo}>Receipt: {completedSale.receipt_no}</div>
                            <div className={styles.receiptRow}>Branch: <strong>{completedSale.branch}</strong></div>
                            <div className={styles.receiptRow}>Cashier: <strong>{completedSale.worker}</strong></div>
                            <div className={styles.receiptRow}>Customer: <strong>{completedSale.recipient_name}</strong></div>
                            <div className={styles.receiptTotal}>Total: {completedSale.total.toFixed(2)} ETB</div>
                          </div>
                        )}
                        <p className={styles.successSub}>Inventory updated. CRV and Model 22 generated.</p>
                        <div className={styles.successActions}>
                          <button type='button' onClick={printReceipt} className={styles.btnSecondary} style={{ flex: 1, height: '44px' }}>
                            <Printer size={18} /> Print Receipt
                          </button>
                          <button type='button' onClick={() => { setTab('list'); setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); }} className={styles.btnSecondary} style={{ flex: 1, height: '44px' }}>
                            <List size={18} /> View Sales
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); setCompletedSale(null); resetForm(); }}
                          className={styles.btnPrimary} style={{ width: '100%', maxWidth: '400px', height: '44px', background: 'transparent', border: '2px solid #2563EB', color: '#2563EB' }}
                        >Start New Transaction</button>
                      </div>
                   ) : null}
                </div>
              )}
            </div>
          )}

          {/* SALES LIST TAB */}
          {tab === 'list' && !showAudit && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                 <h2 className={styles.cardHeaderTitle}><List size={18} color="#2563EB"/> All Sales</h2>
              </div>
              <div className={styles.cardBody}>
                 {sales.filter(s => !navSearch || s.receipt_no?.toLowerCase().includes(navSearch.toLowerCase()) || String(s.id).includes(navSearch) || s.branch_name?.toLowerCase().includes(navSearch.toLowerCase()) || s.worker_name?.toLowerCase().includes(navSearch.toLowerCase()) || s.recipient_name?.toLowerCase().includes(navSearch.toLowerCase())).length === 0 ? (
                   <div className={styles.emptyState}>
                      <span className={styles.emptyEmoji}>📋</span>
                      <h3 className={styles.emptyTitle}>No sales match your search</h3>
                   </div>
                 ) : (
                   <div className={styles.tableWrap}>
                     <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Receipt No</th>
                            <th className={styles.th}>Date</th>
                            <th className={styles.th}>Type</th>
                            <th className={styles.th}>Branch</th>
                            <th className={styles.th}>Worker</th>
                            <th className={styles.th}>Payment</th>
                            <th className={styles.th} style={{ textAlign: 'right' }}>Total Amount</th>
                            <th className={styles.th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales
                            .filter(s => !navSearch || s.receipt_no?.toLowerCase().includes(navSearch.toLowerCase()) || String(s.id).includes(navSearch) || s.branch_name?.toLowerCase().includes(navSearch.toLowerCase()) || s.worker_name?.toLowerCase().includes(navSearch.toLowerCase()) || s.recipient_name?.toLowerCase().includes(navSearch.toLowerCase()))
                            .map(sale => {
                            const resolvedBranch = sale.branch_name ||
                              branches.find(b => String(b.id) === String(sale.branch_id))?.name ||
                              (sale.branch_id ? `Branch #${sale.branch_id}` : '—');
                            const resolvedWorker = sale.worker_name ||
                              workers.find(w => String(w.id) === String(sale.worker_id))?.name ||
                              (sale.worker_id ? `Worker #${sale.worker_id}` : '—');
                            return (
                            <tr key={sale.id} className={styles.tr}>
                               <td className={styles.tdMono}>{sale.receipt_no || sale.sale_no || `REC-${sale.id}`}</td>
                               <td className={styles.td}>{new Date(sale.created_at).toLocaleString()}</td>
                               <td className={styles.td}>
                                 <span className={sale.sale_type === 'ONLINE' ? styles.badgeOnline : styles.badgeWalkin}>
                                   {sale.sale_type === 'ONLINE' ? '🌐 ONLINE' : '🛒 WALK-IN'}
                                 </span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeBranch}>{resolvedBranch}</span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeWorker}>{resolvedWorker}</span>
                               </td>
                               <td className={styles.td}>
                                 <span className={styles.badgeMethod}>{sale.payment_method || 'CASH'}</span>
                               </td>
                               <td className={styles.tdAmount}>{parseFloat(sale.total_amount || 0).toFixed(2)} ETB</td>
                               <td className={styles.td}>
                                 <button onClick={() => viewSaleDetail(sale)} className={styles.viewBtn}>View</button>
                               </td>
                            </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className={styles.tfoot}>
                          <tr>
                            <td colSpan="6" className={styles.tfootTd} style={{ textAlign: 'right' }}>TOTAL TRANSACTIONS: {sales.length}</td>
                            <td colSpan="2" className={styles.tfootAmount}>
                              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
                            </td>
                          </tr>
                        </tfoot>
                     </table>
                   </div>
                 )}

                 {sales.length > 0 && (
                   <div className={styles.summaryRow}>
                     <div className={styles.summaryText}>
                        <strong className={styles.summaryStrong}>{sales.length}</strong> transactions · <strong className={styles.summaryGreen}>{sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB</strong> total
                     </div>
                     <button 
                       onClick={() => setShowSubmitConfirm(true)}
                       disabled={loading}
                       className={styles.btnSuccess}
                     >
                       <CheckCircle size={16} />
                       {loading ? 'Submitting...' : 'Submit to Finance'}
                     </button>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* ONLINE TAB */}
          {tab === 'online' && !showAudit && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}><Package size={18} color="#2563EB" /> Pending Online Orders</h2>
                <button onClick={loadPendingOrders} disabled={loadingPendingOrders} className={styles.btnSecondary}>
                  {loadingPendingOrders ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>
              <div className={styles.cardBody}>
                {loadingPendingOrders ? (
                  <div className={styles.loadingCenter}><SegmentedSpinner size={24} /> Loading online orders...</div>
                ) : pendingOrders.filter(o => !navSearch || o.customer_name?.toLowerCase().includes(navSearch.toLowerCase()) || o.patient_name?.toLowerCase().includes(navSearch.toLowerCase()) || String(o.id).includes(navSearch) || o.sale_code?.toLowerCase().includes(navSearch.toLowerCase())).length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📦</span>
                    <h3 className={styles.emptyTitle}>No pending orders match your search</h3>
                  </div>
                ) : (
                  <div className={styles.ordersGrid}>
                    {pendingOrders
                      .filter(o => !navSearch || o.customer_name?.toLowerCase().includes(navSearch.toLowerCase()) || o.patient_name?.toLowerCase().includes(navSearch.toLowerCase()) || String(o.id).includes(navSearch) || o.sale_code?.toLowerCase().includes(navSearch.toLowerCase()))
                      .map(order => (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderCardTop}>
                          <span className={styles.orderCode}>{order.sale_code || `ORD-${order.id}`}</span>
                          <span className={styles.badgeOnline}>ONLINE</span>
                        </div>
                        <div className={styles.orderCustomer}>
                          👤 <strong>{order.customer_name || 'Guest Customer'}</strong>
                          {order.customer_phone && <span className={styles.orderPhone}>· {order.customer_phone}</span>}
                        </div>
                        {order.prescription_ref && (
                          <div className={styles.orderRx}>📋 Rx: {order.prescription_ref}</div>
                        )}
                        <div className={styles.orderItems}>
                          {(order.items || []).map(item => (
                            <div key={item.id || item.drug_id} className={styles.orderItemRow}>
                              <span>💊 {item.drug_name} × {item.quantity}</span>
                              <span className={styles.orderItemAmt}>{parseFloat(item.line_total || (item.quantity * item.unit_price)).toFixed(2)} ETB</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderFooter}>
                          <div>
                            <div className={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</div>
                            <div className={styles.orderTotal}>{parseFloat(order.total_amount).toFixed(2)} ETB</div>
                          </div>
                          <button onClick={() => processOnlineOrder(order)} className={styles.processBtn}>
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
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}><History size={18} color="#2563EB" /> Audit Trail</h2>
                <button onClick={() => setShowAudit(false)} className={styles.btnSecondary}>
                  Close Audit Trail
                </button>
              </div>
              <div className={styles.cardBody}>
                {auditTrail.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📭</span>
                    <h3 className={styles.emptyTitle}>No pending audit logs</h3>
                    <p className={styles.emptyText}>All audit logs have been submitted or none exist.</p>
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.auditTable}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Date</th>
                          <th className={styles.th}>Action</th>
                          <th className={styles.th}>Details</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditTrail.map((log) => (
                          <tr key={log.id} className={styles.tr}>
                            <td className={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                            <td className={styles.td} style={{ fontWeight: 700, color: log.action === 'RETURN' ? '#DC2626' : '#16A34A' }}>
                              {log.action}
                            </td>
                            <td className={styles.td}>{log.recipient}</td>
                            <td className={styles.tdAmount} style={{ color: parseFloat(log.amount) < 0 ? '#DC2626' : '#16A34A' }}>
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
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardHeaderTitle}>
                  <Eye size={18} color="#2563EB" /> Sale Detail
                </h3>
                <button onClick={() => setTab('list')} className={styles.btnSecondary}>
                  Back to List
                </button>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.detailGrid3}>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Sale #</div>
                    <div className={styles.detailCellValue}>{detail.sale_no || detail.id}</div>
                  </div>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Type</div>
                    <div className={styles.detailCellValue}>{detail.sale_type || '—'}</div>
                  </div>
                  <div className={styles.detailCell}>
                    <div className={styles.detailCellLabel}>Total Amount</div>
                    <div className={styles.detailCellGreen}>
                      {parseFloat(detail.payment?.amount || detail.total_amount || 0).toFixed(2)} ETB
                    </div>
                  </div>
                </div>

                <div className={styles.detailGrid2}>
                  <div className={styles.detailPanel}>
                    <h4 className={styles.detailPanelTitle}>
                      <User size={16} color="#2563EB" /> Recipient
                    </h4>
                    <div className={styles.detailRow}><strong>{detail.payment?.recipient_name || detail.recipient_name || '—'}</strong></div>
                    <div className={styles.detailRowMuted}>{detail.payment?.recipient_phone || ''}</div>
                  </div>
                  <div className={styles.detailPanel}>
                    <h4 className={styles.detailPanelTitle}>
                      <DollarSign size={16} color="#2563EB" /> Payment
                    </h4>
                    <div className={styles.detailRow}>
                      <strong>Method:</strong> {detail.payment?.method || '—'}
                    </div>
                    <div className={styles.detailRow}>
                      <strong>Status:</strong>{' '}
                      <span className={detail.payment?.status === 'PAID' ? styles.badgePaid : styles.badgeCashout}>
                        {detail.payment?.status || '—'}
                      </span>
                    </div>
                    <div className={styles.detailRowMuted}>
                      {detail.payment?.bank_name && <div>Bank: {detail.payment.bank_name}</div>}
                      {detail.payment?.account_holder && <div>Account: {detail.payment.account_holder}</div>}
                      {detail.payment?.telbir_number && <div>Telbir: {detail.payment.telbir_number}</div>}
                      {detail.payment?.branch_name && <div>Branch: {detail.payment.branch_name}</div>}
                      {detail.payment?.worker_name && <div>Worker: {detail.payment.worker_name}</div>}
                    </div>
                  </div>
                </div>

                <div className={styles.mb20}>
                  <h4 className={styles.detailPanelTitle}>Items</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th} style={{ width: '50%' }}>Drug</th>
                          <th className={styles.th} style={{ textAlign: 'center' }}>Qty</th>
                          <th className={styles.th} style={{ textAlign: 'center' }}>Unit Price</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.items || [detail]).map((it, idx) => {
                          const itemQty = parseFloat(it.quantity) || 0;
                          const itemPrice = parseFloat(it.unit_price) || 0;
                          const itemTotal = itemQty * itemPrice;
                          return (
                            <tr key={idx} className={styles.tr}>
                              <td className={styles.td}>{it.drug_name}</td>
                              <td className={styles.td} style={{ textAlign: 'center' }}>{itemQty}</td>
                              <td className={styles.td} style={{ textAlign: 'center' }}>{itemPrice.toFixed(2)} ETB</td>
                              <td className={styles.tdAmount}>{itemTotal.toFixed(2)} ETB</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit to Finance Confirmation Modal */}
      {showSubmitConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <CheckCircle size={32} color="#16A34A" />
            </div>
            <h3 className={styles.modalTitle}>Submit Daily Sales?</h3>
            <p className={styles.modalBody}>
              You are about to submit <strong style={{ color: '#111827' }}>{sales.length} transaction{sales.length !== 1 ? 's' : ''}</strong> totalling
            </p>
            <p className={styles.modalAmount}>
              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
            </p>
            <p className={styles.modalNote}>
              This will be recorded in the audit log and sent to Finance. The sales list will be cleared after submission.
            </p>
            <div className={styles.modalBtns}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
                className={styles.btnSecondary}
                style={{ flex: 1, height: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await apiClient.post('/pharmacy/sales/submit-daily', {});
                    setShowSubmitConfirm(false);
                    submitNotification('Sales Submitted', `${sales.length} transaction(s) totalling ${sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB submitted to Finance.`);
                    showToast('✅ Full day data submitted to Finance', 'success');
                    loadSales();
                  } catch (err) {
                    setShowSubmitConfirm(false);
                    showToast(err.message || 'Failed to submit data', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={styles.btnSuccess}
                style={{ flex: 1, height: '44px' }}
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
