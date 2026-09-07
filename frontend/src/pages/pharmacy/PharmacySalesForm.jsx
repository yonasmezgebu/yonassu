import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import { loadVatSafe } from '../../services/vatService';
import { useToast } from '../../components/Toast';
import {
  ShoppingCart, DollarSign, CreditCard, Smartphone, Banknote,
  CheckCircle, Plus, RefreshCw, List, Eye,
  History, Search, Package, Printer, X,
  Building, ChevronRight, Minus
} from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import S from './PharmacySalesForm.module.css';

export default function PharmacySalesForm() {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();

  const [tab, setTab] = useState('walkin');
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [financeAccounts, setFinanceAccounts] = useState([]);

  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPeriod, setAuditPeriod] = useState('day');

  const [saleType, setSaleType] = useState('WALK-IN');
  const [branchId, setBranchId] = useState('');
  const [workerName, setWorkerName] = useState('');

  // POS State
  const [posStep, setPosStep] = useState(1); // 1=browse, 2=checkout, 4=success
  const [posCart, setPosCart] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telbirNumber, setTelbirNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState(null);
  const [selectedFinanceAccountId, setSelectedFinanceAccountId] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const [unsubmittedSales, setUnsubmittedSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const fileRef = useRef(null);

  const getPaymentMethods = () => {
    const base = [
      { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard size={22} />, desc: 'CBE, Awash, Dashen...' },
      { value: 'TELBIR', label: 'TeleBirr', icon: <Smartphone size={22} />, desc: 'Mobile wallet' },
    ];
    if (saleType === 'WALK-IN') {
      return [{ value: 'CASH', label: 'Cash', icon: <Banknote size={22} />, desc: 'Physical payment' }, ...base];
    }
    return base;
  };

  const loadData = useCallback(async () => {
    try {
      const bRes = await pharmacyService.getBranches();
      if (bRes.data) {
        setBranches(bRes.data);
        if (bRes.data.length > 0) setBranchId(String(bRes.data[0].id));
      }
      if (user?.id) {
        const wRes = await apiClient.get('/pharmacy/workers');
        if (wRes.data) {
          setWorkers(wRes.data);
          const me = wRes.data.find(w => w.user_id === user.id);
          if (me) {
            setWorkerName(me.name);
            if (me.branch_id) setBranchId(String(me.branch_id));
          }
        }
      }
      try {
        const fRes = await apiClient.get('/finance-bank');
        if (fRes.data) setFinanceAccounts(fRes.data);
      } catch (e) {
        console.error('Failed to load finance accounts:', e);
      }
    } catch (e) { console.error(e); }
  }, [user]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await pharmacyService.getProducts();
      const raw = res.data || [];
      const normalized = raw.map(p => ({
        ...p,
        price: parseFloat(p.price || p.unit_price || 0),
        stock: parseInt(p.stock_quantity || 0),
        category: p.category_name || p.category || '',
        requires_prescription: !!(p.is_prescription_required || p.requires_prescription),
        strength: p.strength || '',
        unit: p.unit || '',
        therapeutic_use: p.therapeutic_use || '',
        vat_rate: parseFloat(p.vat_rate || 0),
        image: p.drug_image || p.cover_image || null,
      }));
      setProducts(normalized);
    } catch (e) {
      console.error('loadProducts error:', e);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadPendingOrders = useCallback(async () => {
    try {
      const res = await apiClient.get('/pharmacy/requests?status=Pending');
      setPendingOrders(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const loadUnsubmittedSales = useCallback(async () => {
    try {
      const res = await apiClient.get('/pharmacy/sales?status=UNSUBMITTED');
      setUnsubmittedSales(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const loadAuditTrail = useCallback(async (period = 'day') => {
    setAuditLoading(true);
    try {
      const res = await apiClient.get(`/pharmacy/audit-trail?period=${period}`);
      setAuditTrail(res.data || []);
    } catch (e) {
      setAuditTrail([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVatSafe().catch(() => {});
    loadData();
    loadProducts();
    loadPendingOrders();
    loadUnsubmittedSales();
  }, [loadData, loadProducts, loadPendingOrders, loadUnsubmittedSales]);

  useEffect(() => {
    // When payment method changes, reset selected finance account ID so the user is forced to pick (or we can auto-pick the first if we want, but user asked for drop down)
    setSelectedFinanceAccountId('');
    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setTelbirNumber('');
  }, [posPaymentMethod]);

  const handleFinanceAccountSelect = (e) => {
    const accId = e.target.value;
    setSelectedFinanceAccountId(accId);
    if (!accId) {
      setBankName(''); setAccountHolder(''); setAccountNumber(''); setTelbirNumber('');
      return;
    }
    const acc = financeAccounts.find(a => String(a.id) === accId);
    if (acc) {
      if (posPaymentMethod === 'BANK_TRANSFER') {
        setBankName(acc.bank_provider || acc.account_name || '');
        setAccountHolder(acc.account_name || '');
        setAccountNumber(acc.account_number || '');
      } else if (posPaymentMethod === 'TELBIR') {
        setTelbirNumber(acc.account_number || '');
        setAccountHolder(acc.account_name || '');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingOrders();
    await loadProducts();
    if (tab === 'unsubmitted') await loadUnsubmittedSales();
    setRefreshing(false);
  };

  const submitDailySales = async () => {
    if (unsubmittedSales.length === 0) return showToast('No unsubmitted sales to send to Finance.', 'warning');
    setLoading(true);
    try {
      const res = await apiClient.post('/pharmacy/sales/submit-daily', {
        branch_id: branchId ? parseInt(branchId) : null,
        worker_name: workerName || user?.fullName || user?.email || 'Pharmacy Worker',
      });
      const msg = res?.data?.message || 'Daily sales submitted to Finance successfully!';
      showToast(msg, 'success');
      await loadUnsubmittedSales();
      setTab('audit');
      loadAuditTrail(auditPeriod);
    } catch (e) {
      showToast(e.message || 'Failed to submit sales', 'error');
    } finally {
      setLoading(false);
    }
  };


  const processOnlineOrder = (order) => {
    const newCart = (order.items || []).map(item => ({
      id: item.drug_id,
      name: item.drug_name,
      price: parseFloat(item.unit_price) || 0,
      qty: parseInt(item.quantity) || 1,
      stock: 9999,
      vat_rate: item.vat_rate || 0,
      image: null,
    }));
    setPosCart(newCart);
    setSaleType('ONLINE');
    setPrescriptionRequestId(order.id);
    setPayerName(order.customer_name || '');
    setPayerPhone(order.customer_phone || '');
    const pmMap = { 'Bank': 'BANK_TRANSFER', 'Mobile Wallet': 'TELBIR', 'Cash': 'BANK_TRANSFER' };
    let method = pmMap[order.payment_method] || 'BANK_TRANSFER';
    setPosPaymentMethod(method);
    setPaymentReference(order.payment_reference || '');
    if (order.branch_id) setBranchId(String(order.branch_id));
    setSelectedOrderDetail(null);
    setPosStep(2);
    setTab('walkin');
  };

  const addToCart = (prod) => {
    if (saleType === 'ONLINE') { showToast('Cannot add items to an online order.', 'warning'); return; }
    setPosCart(prev => {
      const ex = prev.find(i => i.id === prod.id);
      if (ex) return prev.map(i => i.id === prod.id ? { ...i, qty: Math.min(i.qty + 1, prod.stock) } : i);
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setPosCart(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nq = p.qty + delta;
      if (nq <= 0) return null;
      if (nq > p.stock && saleType === 'WALK-IN') { showToast(`Only ${p.stock} in stock`, 'warning'); return p; }
      return { ...p, qty: Math.max(1, nq) };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setPosCart(prev => prev.filter(p => p.id !== id));

  const posCartSubtotal = posCart.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const posCartTotal = posCartSubtotal.toFixed(2);

  const resetForm = () => {
    setPosCart([]); setPosPaymentMethod(''); setPaymentReference(''); setPayerName(''); setPayerPhone('');
    setBankName(''); setAccountHolder(''); setAccountNumber(''); setTelbirNumber('');
    setPaymentScreenshot(null); setPaymentScreenshotPreview(null);
    setSelectedFinanceAccountId('');
    setPrescriptionRequestId(null); setSaleType('WALK-IN'); setPosStep(1); setCompletedSale(null);
  };

  const submitPOS = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) return showToast('Cart is empty', 'warning');
    if (!posPaymentMethod) return showToast('Please select a payment method', 'warning');
    if (!branchId) return showToast('Please select a branch', 'warning');
    if (posPaymentMethod === 'BANK_TRANSFER') {
      if (!bankName.trim()) return showToast('Bank name is required', 'warning');
      if (!accountHolder.trim()) return showToast('Account holder name is required', 'warning');
    }
    if (posPaymentMethod === 'TELBIR' && !telbirNumber.trim()) return showToast('TeleBirr number is required', 'warning');

    const selectedBranch = branches.find(b => b.id === parseInt(branchId) || b.branch_id === parseInt(branchId));

    setLoading(true);
    try {
      let res;

      if (saleType === 'ONLINE' && prescriptionRequestId) {
        res = await apiClient.patch(`/pharmacy/sales/${prescriptionRequestId}/process`, {
          worker_id: workers.find(w => w.user_id === user?.id)?.id || null,
          payment: {
            method: posPaymentMethod,
            reference: paymentReference,
            bank_name: bankName,
            account_holder: accountHolder,
            account_number: accountNumber,
            telbir_number: telbirNumber,
            recipient_name: payerName,
            recipient_phone: payerPhone,
            branch_name: selectedBranch?.name || selectedBranch?.branch_name || '',
          }
        });
        try {
          await apiClient.post(`/pharmacy/requests/${prescriptionRequestId}/approve`, {});
          await apiClient.put(`/pharmacy/requests/${prescriptionRequestId}/ready`, {});
        } catch { }
        setPendingOrders(prev => prev.filter(o => o.id !== prescriptionRequestId));
      } else {
        const fd = new FormData();
        fd.append('branch_id', parseInt(branchId));
        const wid = workers.find(w => w.user_id === user?.id)?.id;
        if (wid) fd.append('worker_id', wid);
        fd.append('sale_type', saleType);
        
        const backendItems = posCart.map(item => ({
          drug_id: item.id,
          drug_name: item.name,
          quantity: item.qty,
          unit_price: item.price
        }));
        fd.append('items', JSON.stringify(backendItems));
        
        fd.append('is_unsubmitted', 'true');
        fd.append('payment', JSON.stringify({
          method: posPaymentMethod,
          amount: parseFloat(posCartTotal),
          recipient_name: payerName,
          recipient_phone: payerPhone,
          branch_name: selectedBranch?.name || selectedBranch?.branch_name || '',
          worker_name: workerName,
          status: 'PAID',
          reference_no: paymentReference,
          ...(posPaymentMethod === 'BANK_TRANSFER' && { bank_name: bankName, account_holder: accountHolder, account_number: accountNumber }),
          ...(posPaymentMethod === 'TELBIR' && { telbir_number: telbirNumber }),
        }));
        if (paymentScreenshot) fd.append('paymentScreenshot', paymentScreenshot);
        res = await apiClient.post('/pharmacy/sales', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      if (res.data) {
        setCompletedSale({
          receipt_no: res.data?.data?.receipt_code || res.data?.data?.sale_code || `REC-${Date.now()}`,
          date: new Date().toLocaleString(),
          branch: selectedBranch?.name || 'N/A',
          worker: workerName || 'N/A',
          items: posCart,
          total: posCartTotal,
          payment_method: posPaymentMethod,
          payerName, payerPhone,
        });
        loadProducts();
        if (saleType === 'WALK-IN') loadUnsubmittedSales();
        showToast('Sale recorded successfully!', 'success');
        submitNotification('Payment Processed', 'Transaction completed successfully.');
        setPosStep(4);
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
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${completedSale.receipt_no}</title>
      <style>body{font-family:'Courier New',monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto;}
      h2{text-align:center;font-size:16px;margin-bottom:4px;}.center{text-align:center;}.divider{border-top:1px dashed #000;margin:8px 0;}
      .row{display:flex;justify-content:space-between;margin:3px 0;}.total{font-weight:bold;font-size:14px;}</style></head>
      <body><h2>SUTANA PHARMACY</h2>
      <div class="center">Receipt: ${completedSale.receipt_no}</div>
      <div class="center">${completedSale.date}</div>
      <div class="divider"></div>
      ${completedSale.items.map(it => `<div class="row"><span>${it.name} (x${it.qty})</span><span>${(it.price * it.qty).toFixed(2)} ETB</span></div>`).join('')}
      <div class="divider"></div>
      <div class="row total"><span>TOTAL</span><span>${completedSale.total} ETB</span></div>
      <div class="divider"></div>
      <div class="center">Method: ${completedSale.payment_method}</div>
      ${completedSale.payerName ? `<div class="center">Customer: ${completedSale.payerName}</div>` : ''}
      <div class="center" style="margin-top:12px;color:#555;">Thank you for your business!</div>
      </body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const filteredProducts = products.filter(p => {
    if (!posSearch) return true;
    const s = posSearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(s) || (p.category || '').toLowerCase().includes(s) || (p.strength || '').toLowerCase().includes(s);
  });

  const selectedBranch = branches.find(b => String(b.id) === String(branchId));

  // ───────────────────────────────── RENDER ─────────────────────────────────
  return (
    <div className={S.page}>
      <ToastContainer />
      <div className={S.wrap}>

        {/* HEADER */}
        <div className={S.header}>
          <div>
            <h1 className={S.title}>💊 Pharmacy POS</h1>
            <p className={S.subtitle}>Process walk-in sales &amp; online orders</p>
          </div>
          <div className={S.headerActions}>
            <button className={S.btnSecondary} onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? S.spin : ''} /> Refresh
            </button>
            <button className={S.btnPrimary} onClick={() => { resetForm(); setTab('walkin'); }}>
              <Plus size={15} /> New Sale
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className={S.tabs}>
          {[
            { key: 'walkin', label: 'Sales POS', icon: <ShoppingCart size={15} /> },
            { key: 'list', label: 'Online Orders', icon: <Smartphone size={15} />, badge: pendingOrders.length },
            { key: 'unsubmitted', label: 'Unsubmitted', icon: <List size={15} />, badge: unsubmittedSales.length },
            { key: 'audit', label: 'Audit Trail', icon: <History size={15} /> },
          ].map(t => (
            <button
              key={t.key}
              className={`${S.tab} ${tab === t.key ? S.tabActive : ''}`}
              onClick={() => { setTab(t.key); if (t.key === 'unsubmitted') loadUnsubmittedSales(); if (t.key === 'audit') loadAuditTrail(auditPeriod); }}
            >
              {t.icon} {t.label}
              {t.badge > 0 && <span className={S.badgePill}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ═══════════════════ TAB: SALES POS ═══════════════════ */}
        {tab === 'walkin' && (
          <div>
            {/* ── STEP 1: Browse Products ── */}
            {posStep === 1 && (
              <div className={S.posLayout}>
                {/* LEFT: Product Grid */}
                <div className={S.productsPanel}>
                  {/* Search */}
                  <div className={S.searchBar}>
                    <Search size={16} className={S.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search medicines, categories..."
                      className={S.searchInput}
                      value={posSearch}
                      onChange={e => setPosSearch(e.target.value)}
                    />
                  </div>

                  {productsLoading ? (
                    <div className={S.loadingState}><SegmentedSpinner size={32} /><p>Loading inventory…</p></div>
                  ) : (
                    <div className={S.productGrid}>
                      {filteredProducts.map(p => {
                        const inCart = posCart.find(i => i.id === p.id);
                        const outOfStock = p.stock <= 0;
                        return (
                          <div key={p.id} className={`${S.productCard} ${outOfStock ? S.productCardDisabled : ''}`}>
                            {/* Image */}
                            <div className={S.productImageWrap}>
                              {p.image ? (
                                <img
                                  src={`http://localhost:5000${p.image}`}
                                  alt={p.name}
                                  className={S.productImage}
                                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div className={S.productImageFallback} style={{ display: p.image ? 'none' : 'flex' }}>💊</div>
                              {p.requires_prescription && <span className={S.rxBadge}>Rx</span>}
                              {outOfStock && <span className={S.outOfStockBadge}>Out of Stock</span>}
                            </div>

                            {/* Info */}
                            <div className={S.productBody}>
                              <div className={S.productName} title={p.name}>{p.name}</div>
                              {p.strength && <div className={S.productStrength}>{p.strength}{p.unit ? ` · ${p.unit}` : ''}</div>}
                              {p.category && <span className={S.productCategory}>{p.category}</span>}
                            </div>

                            {/* Footer */}
                            <div className={S.productFooter}>
                              <div>
                                <div className={S.productPrice}>{parseFloat(p.price).toFixed(2)} ETB</div>
                                <div className={S.productStock}>{p.stock} in stock</div>
                              </div>
                              {inCart ? (
                                <div className={S.qtyControls}>
                                  <button className={S.qtyBtn} onClick={() => updateCartQty(p.id, -1)}><Minus size={12} /></button>
                                  <span className={S.qtyNum}>{inCart.qty}</span>
                                  <button className={S.qtyBtn} onClick={() => updateCartQty(p.id, 1)}><Plus size={12} /></button>
                                </div>
                              ) : (
                                <button
                                  className={S.addBtn}
                                  onClick={() => !outOfStock && addToCart(p)}
                                  disabled={outOfStock}
                                >
                                  <Plus size={13} /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {filteredProducts.length === 0 && !productsLoading && (
                        <div className={S.noProducts}>
                          <Package size={40} />
                          <p>{products.length === 0 ? 'No products in inventory.' : 'No products match your search.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT: Cart */}
                <div className={S.cartPanel}>
                  <div className={S.cartHeader}>
                    <span className={S.cartTitle}><ShoppingCart size={17} /> Cart</span>
                    <span className={S.cartCount}>{posCart.reduce((a, c) => a + c.qty, 0)} items</span>
                  </div>

                  <div className={S.cartBody}>
                    {posCart.length === 0 ? (
                      <div className={S.cartEmpty}>
                        <div className={S.cartEmptyIcon}>🛒</div>
                        <p>Add medicines to begin</p>
                      </div>
                    ) : (
                      <div className={S.cartItems}>
                        {posCart.map(item => (
                          <div key={item.id} className={S.cartItem}>
                            <div className={S.cartItemMain}>
                              <div className={S.cartItemName}>{item.name}</div>
                              <div className={S.cartItemPrice}>{parseFloat(item.price).toFixed(2)} ETB × {item.qty}</div>
                            </div>
                            <div className={S.cartItemRight}>
                              <div className={S.cartItemTotal}>{(item.price * item.qty).toFixed(2)}</div>
                              <div className={S.cartItemQty}>
                                <button className={S.qtyBtn} onClick={() => updateCartQty(item.id, -1)}><Minus size={11} /></button>
                                <span>{item.qty}</span>
                                <button className={S.qtyBtn} onClick={() => updateCartQty(item.id, 1)}><Plus size={11} /></button>
                                <button className={S.removeBtn} onClick={() => removeFromCart(item.id)}><X size={12} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={S.cartFooter}>
                    <div className={S.cartTotalRow}>
                      <span>Total</span>
                      <span className={S.cartTotalAmt}>{posCartTotal} ETB</span>
                    </div>
                    <button
                      className={S.checkoutBtn}
                      disabled={posCart.length === 0}
                      onClick={() => setPosStep(2)}
                    >
                      Proceed to Checkout <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Checkout ── */}
            {posStep === 2 && (
              <div className={S.checkoutLayout}>
                {/* LEFT: Order Summary */}
                <div className={S.checkoutLeft}>
                  <div className={S.sectionCard}>
                    <h3 className={S.sectionTitle}><ShoppingCart size={16} /> Order Summary</h3>
                    {posCart.map(item => (
                      <div key={item.id} className={S.summaryItem}>
                        <div className={S.summaryItemName}>{item.name}</div>
                        <div className={S.summaryItemQtyPrice}>
                          <span>{item.qty} × {parseFloat(item.price).toFixed(2)} ETB</span>
                          <strong>{(item.price * item.qty).toFixed(2)} ETB</strong>
                        </div>
                      </div>
                    ))}
                    <div className={S.summaryDivider} />
                    <div className={S.summaryTotal}>
                      <span>Total Amount</span>
                      <span className={S.summaryTotalAmt}>{posCartTotal} ETB</span>
                    </div>
                    <button className={S.btnGhost} onClick={() => setPosStep(1)} style={{ marginTop: 12, fontSize: 13 }}>
                      ← Edit Cart
                    </button>
                  </div>
                </div>

                {/* RIGHT: Payment Form */}
                <div className={S.checkoutRight}>
                  <form onSubmit={submitPOS}>
                    {/* Branch */}
                    <div className={S.sectionCard}>
                      <h3 className={S.sectionTitle}><Building size={16} /> Branch &amp; Customer</h3>

                      <div className={S.formRow}>
                        <label className={S.formLabel}>Branch *</label>
                        <select className={S.formSelect} value={branchId} onChange={e => setBranchId(e.target.value)} required>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>

                      <div className={S.formRow}>
                        <label className={S.formLabel}>Customer Name</label>
                        <input className={S.formInput} placeholder="Walk-in customer name" value={payerName} onChange={e => setPayerName(e.target.value)} />
                      </div>

                      <div className={S.formRow}>
                        <label className={S.formLabel}>Phone Number</label>
                        <input className={S.formInput} placeholder="+251..." value={payerPhone} onChange={e => setPayerPhone(e.target.value)} />
                      </div>

                      <div className={S.formRow}>
                        <label className={S.formLabel}>Handled By (Worker)</label>
                        <input className={S.formInput} value={workerName} readOnly style={{ background: 'hsl(210 40% 97%)' }} />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className={S.sectionCard}>
                      <h3 className={S.sectionTitle}><DollarSign size={16} /> Payment Method</h3>
                      <div className={S.paymentMethodGrid}>
                        {getPaymentMethods().map(pm => (
                          <div
                            key={pm.value}
                            className={`${S.paymentMethodCard} ${posPaymentMethod === pm.value ? S.paymentMethodActive : ''}`}
                            onClick={() => setPosPaymentMethod(pm.value)}
                          >
                            <div className={S.pmIcon}>{pm.icon}</div>
                            <div className={S.pmLabel}>{pm.label}</div>
                            <div className={S.pmDesc}>{pm.desc}</div>
                          </div>
                        ))}
                      </div>

                      {/* CASH: Nothing extra needed */}

                      {/* BANK TRANSFER */}
                      {posPaymentMethod === 'BANK_TRANSFER' && (
                        <div className={S.paymentDetails}>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Select Bank Account</label>
                            <select 
                              className={S.formSelect} 
                              value={selectedFinanceAccountId} 
                              onChange={handleFinanceAccountSelect}
                            >
                              <option value="">-- Choose Account --</option>
                              {financeAccounts.filter(a => a.account_type === 'Bank' && a.status === 'Active').map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.bank_provider || a.account_name} - {a.account_number}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Bank Name *</label>
                            <input className={S.formInput} placeholder="e.g. CBE, Awash, Dashen..." value={bankName} onChange={e => setBankName(e.target.value)} required />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Account Holder Name *</label>
                            <input className={S.formInput} placeholder="Name on bank account" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} required />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Account Number</label>
                            <input className={S.formInput} placeholder="Bank account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Transaction Reference *</label>
                            <input className={S.formInput} placeholder="Transfer reference / TXN ID" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Payment Screenshot</label>
                            <div
                              className={S.uploadArea}
                              onClick={() => fileRef.current?.click()}
                            >
                              {paymentScreenshotPreview ? (
                                <img src={paymentScreenshotPreview} alt="screenshot" className={S.uploadPreview} />
                              ) : (
                                <div className={S.uploadPlaceholder}>📎 Click to upload screenshot</div>
                              )}
                            </div>
                            <input
                              type="file"
                              ref={fileRef}
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files[0];
                                if (f) {
                                  setPaymentScreenshot(f);
                                  setPaymentScreenshotPreview(URL.createObjectURL(f));
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* TELEBIRR */}
                      {posPaymentMethod === 'TELBIR' && (
                        <div className={S.paymentDetails}>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Select TeleBirr Account</label>
                            <select 
                              className={S.formSelect} 
                              value={selectedFinanceAccountId} 
                              onChange={handleFinanceAccountSelect}
                            >
                              <option value="">-- Choose Account --</option>
                              {financeAccounts.filter(a => a.account_type === 'Mobile Wallet' && a.status === 'Active').map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.account_name} - {a.account_number}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>TeleBirr Phone Number *</label>
                            <input className={S.formInput} placeholder="+2519..." value={telbirNumber} onChange={e => setTelbirNumber(e.target.value)} required />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Transaction Reference</label>
                            <input className={S.formInput} placeholder="TeleBirr transaction reference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
                          </div>
                          <div className={S.formRow}>
                            <label className={S.formLabel}>Payment Screenshot</label>
                            <div className={S.uploadArea} onClick={() => fileRef.current?.click()}>
                              {paymentScreenshotPreview
                                ? <img src={paymentScreenshotPreview} alt="screenshot" className={S.uploadPreview} />
                                : <div className={S.uploadPlaceholder}>📎 Click to upload screenshot</div>}
                            </div>
                            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files[0]; if (f) { setPaymentScreenshot(f); setPaymentScreenshotPreview(URL.createObjectURL(f)); } }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total & Submit */}
                    <div className={S.sectionCard}>
                      <div className={S.finalTotal}>
                        <span>Total Due</span>
                        <span className={S.finalTotalAmt}>{posCartTotal} ETB</span>
                      </div>
                      <button
                        type="submit"
                        className={S.submitBtn}
                        disabled={loading || !posPaymentMethod}
                      >
                        {loading ? <><SegmentedSpinner size={16} /> Processing…</> : <>✅ Complete Sale — {posCartTotal} ETB</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── STEP 4: Success ── */}
            {posStep === 4 && (
              <div className={S.successScreen}>
                <div className={S.successIcon}>✅</div>
                <h2 className={S.successTitle}>Transaction Complete!</h2>
                <p className={S.successDesc}>Receipt: <strong>{completedSale?.receipt_no}</strong></p>
                {completedSale?.payerName && <p className={S.successDesc}>Customer: {completedSale.payerName}</p>}
                <p className={S.successDesc}>Total: <strong>{completedSale?.total} ETB</strong> via {completedSale?.payment_method}</p>
                <div className={S.successActions}>
                  <button className={S.btnPrimary} onClick={printReceipt}><Printer size={15} /> Print Receipt</button>
                  <button className={S.btnSecondary} onClick={resetForm}>New Transaction</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: UNSUBMITTED SALES ═══════════════════ */}
        {tab === 'unsubmitted' && (
          <div className={S.card}>
            <div className={S.cardHeader}>
              <div>
                <h2 className={S.cardTitle}><List size={17} /> Unsubmitted Sales</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Sales pending manager submission for today</p>
              </div>
              <button className={S.btnPrimary} onClick={submitDailySales} disabled={unsubmittedSales.length === 0 || loading}>
                {loading ? 'Submitting...' : `Submit to Manager (${unsubmittedSales.length})`}
              </button>
            </div>
            {unsubmittedSales.length === 0 ? (
              <div className={S.emptyState}>
                <CheckCircle size={48} color="#16a34a" />
                <h2 className={S.emptyTitle} style={{ marginTop: 12 }}>All caught up!</h2>
                <p className={S.emptyDesc}>No unsubmitted sales for today.</p>
              </div>
            ) : (
              <div className={S.tableWrap}>
                <table className={S.table}>
                  <thead>
                    <tr>
                      <th className={S.th}>Receipt</th>
                      <th className={S.th}>Date / Time</th>
                      <th className={S.th}>Customer</th>
                      <th className={S.th}>Branch</th>
                      <th className={S.th}>Method</th>
                      <th className={S.th} style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unsubmittedSales.map(sale => (
                      <tr key={sale.id} className={S.tr}>
                        <td className={S.td} style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sale.receipt_code || sale.sale_code || `#${sale.id}`}</td>
                        <td className={S.td}>{new Date(sale.created_at).toLocaleString()}</td>
                        <td className={S.td}>{sale.recipient_name || sale.customer_name || 'Walk-in'}</td>
                        <td className={S.td}>{sale.branch_name || '—'}</td>
                        <td className={S.td}>
                          <span className={`${S.badge} ${sale.payment_method === 'CASH' ? S.badgeGreen : sale.payment_method === 'BANK_TRANSFER' ? S.badgeBlue : S.badgeGray}`}>
                            {sale.payment_method || 'CASH'}
                          </span>
                        </td>
                        <td className={S.td} style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(142.1 70% 30%)' }}>{parseFloat(sale.total_amount).toFixed(2)} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                      <td colSpan={5} className={S.td} style={{ fontWeight: 700 }}>{unsubmittedSales.length} sale{unsubmittedSales.length !== 1 ? 's' : ''}</td>
                      <td className={S.td} style={{ textAlign: 'right', fontWeight: 800, color: 'hsl(142.1 70% 30%)', fontSize: 15 }}>
                        {unsubmittedSales.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0).toFixed(2)} ETB
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: ONLINE ORDERS ═══════════════════ */}
        {tab === 'list' && (
          <div className={S.card}>
            <div className={S.cardHeader}>
              <h2 className={S.cardTitle}><Smartphone size={17} /> Pending Online Orders</h2>
            </div>
            {pendingOrders.length === 0 ? (
              <div className={S.emptyState}>
                <Package size={48} />
                <h2 className={S.emptyTitle} style={{ marginTop: 12 }}>No Pending Orders</h2>
                <p className={S.emptyDesc}>All online orders have been processed.</p>
              </div>
            ) : (
              <div className={S.tableWrap}>
                <table className={S.table} style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th className={S.th}>Order ID &amp; Date</th>
                      <th className={S.th}>Customer</th>
                      <th className={S.th}>Items &amp; Payment</th>
                      <th className={S.th}>Finance Status</th>
                      <th className={S.th} style={{ textAlign: 'right' }}>Total</th>
                      <th className={S.th} style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => {
                      const isUnlocked = ['Approved', 'Verified', 'PAID', 'Completed'].includes(order.finance_payment_status) || order.payment_status === 'PAID' || order.finance_payment_status === null;
                      return (
                        <tr key={order.id} className={S.tr}>
                          <td className={S.td}>
                            <div style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{order.sale_code || `ORD-${order.id}`}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(order.created_at).toLocaleString()}</div>
                          </td>
                          <td className={S.td}>
                            <div style={{ fontWeight: 600 }}>{order.customer_name || 'Guest'}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{order.customer_phone}</div>
                          </td>
                          <td className={S.td}>
                            <div style={{ color: '#374151' }}>{order.items?.length || 0} items</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{order.payment_method}</div>
                          </td>
                          <td className={S.td}>
                            <span className={`${S.badge} ${['Approved', 'Verified', 'PAID'].includes(order.finance_payment_status) || order.payment_status === 'PAID' ? S.badgeGreen : order.finance_payment_status === 'Rejected' ? S.badgeRed : S.badgeGray}`}>
                              {order.finance_payment_status || 'Pending'}
                            </span>
                          </td>
                          <td className={S.td} style={{ textAlign: 'right', fontWeight: 700 }}>{parseFloat(order.total_amount).toFixed(2)} ETB</td>
                          <td className={S.td} style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button className={S.btnSecondary} onClick={() => setSelectedOrderDetail(order)} style={{ padding: '5px 10px', fontSize: 12 }}>
                                <Eye size={13} /> View
                              </button>
                              <button className={S.btnPrimary} onClick={() => processOnlineOrder(order)} disabled={!isUnlocked} style={{ padding: '5px 10px', fontSize: 12, opacity: isUnlocked ? 1 : 0.5 }}>
                                {isUnlocked ? 'Process' : '🔒'}
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
          </div>
        )}

        {/* ═══════════════════ TAB: AUDIT TRAIL ═══════════════════ */}
        {tab === 'audit' && (
          <div className={S.card}>
            <div className={S.cardHeader} style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className={S.cardTitle}><History size={17} /> Pharmacy Audit Trail</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Completed pharmacy sales log</p>
              </div>
              <button onClick={() => loadAuditTrail(auditPeriod)} disabled={auditLoading} className={S.btnSecondary}>
                {auditLoading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
              {[['day', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['quarter', 'Quarter'], ['year', 'Year']].map(([key, label]) => (
                <button key={key} onClick={() => { setAuditPeriod(key); loadAuditTrail(key); }}
                  style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: '1px solid #D1D5DB', cursor: 'pointer', textTransform: 'uppercase', background: auditPeriod === key ? 'hsl(142.1 70% 30%)' : '#fff', color: auditPeriod === key ? '#fff' : '#374151', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
            {auditLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><SegmentedSpinner size={24} /></div>
            ) : auditTrail.length === 0 ? (
              <div className={S.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <h3 className={S.emptyTitle}>No audit records</h3>
                <p className={S.emptyDesc}>Sales appear here after they are completed.</p>
              </div>
            ) : (
              <div className={S.tableWrap}>
                <table className={S.table} style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th className={S.th}>Receipt / Date</th>
                      <th className={S.th}>Type</th>
                      <th className={S.th}>Customer</th>
                      <th className={S.th}>Worker</th>
                      <th className={S.th}>Payment</th>
                      <th className={S.th} style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditTrail.map((log, idx) => (
                      <tr key={log.id || idx} className={S.tr}>
                        <td className={S.td}>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{log.receipt_no || log.invoice_number || `#${log.id}`}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</div>
                        </td>
                        <td className={S.td}>
                          <span style={{ background: log.sale_type === 'ONLINE' ? '#F3E8FF' : '#DBEAFE', color: log.sale_type === 'ONLINE' ? '#7E22CE' : '#1D4ED8', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            {log.sale_type === 'ONLINE' ? '🌐 ONLINE' : '🛒 WALK-IN'}
                          </span>
                        </td>
                        <td className={S.td}>
                          <div style={{ fontWeight: 600 }}>{log.recipient_name || log.customer_name || 'Walk-in'}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{log.recipient_phone || log.customer_phone || ''}</div>
                        </td>
                        <td className={S.td}>{log.worker_name || '—'}</td>
                        <td className={S.td}>
                          <span style={{ background: '#F9FAFB', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{log.payment_method || '—'}</span>
                        </td>
                        <td className={S.td} style={{ textAlign: 'right', fontWeight: 700, color: 'hsl(142.1 70% 30%)', fontVariantNumeric: 'tabular-nums' }}>
                          {parseFloat(log.amount || log.total_amount || 0).toFixed(2)} ETB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
                      <td colSpan={5} className={S.td} style={{ fontWeight: 700 }}>{auditTrail.length} transaction{auditTrail.length !== 1 ? 's' : ''}</td>
                      <td className={S.td} style={{ textAlign: 'right', fontWeight: 800, color: 'hsl(142.1 70% 30%)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                        {auditTrail.reduce((s, l) => s + parseFloat(l.amount || l.total_amount || 0), 0).toFixed(2)} ETB
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Online Order Detail Modal ─── */}
        {selectedOrderDetail && (
          <div className={S.overlay} onClick={() => setSelectedOrderDetail(null)}>
            <div className={S.modal} onClick={e => e.stopPropagation()}>
              <div className={S.modalTitle}>
                <Package size={20} color="#2563eb" /> Order Details
                <button className={S.btnIcon} style={{ marginLeft: 'auto' }} onClick={() => setSelectedOrderDetail(null)}><X size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Order ID', value: selectedOrderDetail.sale_code || `ORD-${selectedOrderDetail.id}`, mono: true },
                  { label: 'Date', value: new Date(selectedOrderDetail.created_at).toLocaleString() },
                  { label: 'Customer', value: selectedOrderDetail.customer_name || 'Guest' },
                  { label: 'Phone', value: selectedOrderDetail.customer_phone || '—' },
                  { label: 'Payment Method', value: selectedOrderDetail.payment_method || '—' },
                  { label: 'Reference', value: selectedOrderDetail.payment_reference || '—', mono: true },
                  { label: 'Finance Status', value: selectedOrderDetail.finance_payment_status || 'Pending', badge: true },
                  { label: 'Total', value: `${parseFloat(selectedOrderDetail.total_amount || 0).toFixed(2)} ETB`, highlight: true },
                ].map(({ label, value, mono, badge, highlight }, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                    {badge
                      ? <span style={{ background: ['Approved', 'Verified', 'PAID'].includes(value) ? '#DCFCE7' : '#FEF3C7', color: ['Approved', 'Verified', 'PAID'].includes(value) ? '#166534' : '#92400E', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{value}</span>
                      : <div style={{ fontSize: highlight ? 15 : 14, fontWeight: highlight ? 800 : 600, color: highlight ? '#2563eb' : '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>}
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💊 Items</h3>
              <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Drug</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                  </tr></thead>
                  <tbody>
                    {(selectedOrderDetail.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.drug_name || it.name || `Drug #${it.drug_id}`}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{it.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{parseFloat(it.unit_price || 0).toFixed(2)} ETB</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{parseFloat((it.quantity || 0) * (it.unit_price || 0)).toFixed(2)} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={S.modalActions}>
                <button className={S.btnSecondary} onClick={() => setSelectedOrderDetail(null)} style={{ flex: 1 }}>Close</button>
                <button className={S.btnPrimary} style={{ flex: 1, opacity: (['Approved', 'Verified', 'PAID', 'Completed'].includes(selectedOrderDetail.finance_payment_status) || selectedOrderDetail.payment_status === 'PAID' || selectedOrderDetail.finance_payment_status === null) ? 1 : 0.5 }}
                  disabled={!(['Approved', 'Verified', 'PAID', 'Completed'].includes(selectedOrderDetail.finance_payment_status) || selectedOrderDetail.payment_status === 'PAID' || selectedOrderDetail.finance_payment_status === null)}
                  onClick={() => { const o = selectedOrderDetail; setSelectedOrderDetail(null); processOnlineOrder(o); }}>
                  {!(['Approved', 'Verified', 'PAID', 'Completed'].includes(selectedOrderDetail.finance_payment_status) || selectedOrderDetail.payment_status === 'PAID' || selectedOrderDetail.finance_payment_status === null) ? '🔒 Locked' : '✅ Process Order'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

