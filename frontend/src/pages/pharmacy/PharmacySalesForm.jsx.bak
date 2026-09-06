import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import pharmacyService from '../../services/pharmacyService';
import { loadVatSafe, getVatForItem } from '../../services/vatService';
import { useToast } from '../../components/Toast';

import {
  ShoppingCart, DollarSign, CreditCard, Smartphone, Banknote,
  CheckCircle, Plus, Trash2, RefreshCw, List, Eye,
  History, Search, User, Phone, Package, AlertCircle, Printer, X
} from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PharmacySalesForm.module.css';

const SALE_TYPES = [
  { value: 'WALK-IN', label: 'Walk-In', icon: <ShoppingCart size={16} /> },
  { value: 'ONLINE', label: 'Online', icon: <Smartphone size={16} /> },
];

export default function PharmacySalesForm() {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();

  const [tab, setTab] = useState('walkin'); // walkin | list
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [saleType, setSaleType] = useState('WALK-IN');
  const [branchId, setBranchId] = useState('');
  const [workerName, setWorkerName] = useState('');

  // POS State
  const [posStep, setPosStep] = useState(1);
  const [posCart, setPosCart] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [telbirNumber, setTelbirNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  const [navSearch, setNavSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Pending Online Orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);

  const [vatCtx, setVatCtx] = useState(null);

  const fileRef = useRef(null);

  // Computed Payment Methods based on SALE_TYPE
  // "fix when online order is come the payment is only by bank or wallet but the order at after payment it says cash only recive branch"
  // "for walk in fix the order similar like online form but order payment have cash addationally"
  const getPaymentMethods = () => {
    const baseMethods = [
      { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard size={24} /> },
      { value: 'TELBIR', label: 'Telbir Wallet', icon: <Smartphone size={24} /> },
    ];
    if (saleType === 'WALK-IN') {
      return [{ value: 'CASH', label: 'Cash', icon: <Banknote size={24} /> }, ...baseMethods];
    }
    return baseMethods;
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
          if (me) setWorkerName(me.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await pharmacyService.getInventory(1, 1000);
      setProducts(res.data?.inventory || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadPendingOrders = useCallback(async () => {
    try {
      const res = await apiClient.get('/pharmacy/requests?status=Pending');
      setPendingOrders(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadVatSafe().then(setVatCtx).catch(() => {});
    loadData();
    loadProducts();
    loadPendingOrders();
  }, [loadData, loadProducts, loadPendingOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingOrders();
    await loadProducts();
    setRefreshing(false);
  };

  const processOnlineOrder = (order) => {
    // Convert online order items to POS Cart
    const newCart = (order.items || []).map(item => ({
      id: item.drug_id,
      name: item.drug_name,
      price: parseFloat(item.unit_price) || 0,
      qty: parseInt(item.quantity) || 1,
      stock: 9999, // Bypass local stock check for pre-approved orders
      vat_rate: item.vat_rate || 0,
    }));

    setPosCart(newCart);
    setSaleType('ONLINE');
    setPrescriptionRequestId(order.id);

    // Auto-fill form fields
    setPayerName(order.customer_name || '');
    setPayerPhone(order.customer_phone || '');
    setPaymentAmount(parseFloat(order.total_amount || 0).toFixed(2));

    if (order.branch_id) {
      setBranchId(String(order.branch_id));
    } else if (branches.length > 0) {
      setBranchId(String(branches[0].id));
    }

    // "then move to sales avoid again chose payment use i fill at online like customer dashbord"
    const pmMap = {
      'Bank': 'BANK_TRANSFER',
      'Mobile Wallet': 'TELBIR',
      'Cash': 'CASH'
    };
    // if Online, and somehow mapped to CASH, fall back to BANK_TRANSFER since Online doesn't allow Cash.
    let method = pmMap[order.payment_method] || 'BANK_TRANSFER';
    if (method === 'CASH') method = 'BANK_TRANSFER'; 
    
    setPosPaymentMethod(method);
    setPaymentReference(order.payment_reference || '');

    setTab('walkin');
    setShowCart(true);
    // Skip straight to Step 3 (Payment Confirmation) since they already bought it online
    setPosStep(3); 
    setSelectedOrderDetail(null);
  };

  const addToCart = (prod) => {
    if (saleType === 'ONLINE') {
      showToast('Cannot add items to an online order checkout.', 'warning');
      return;
    }
    setPosCart(prev => {
      const ex = prev.find(p => p.id === prod.id);
      if (ex) {
        if (ex.qty >= prod.stock) {
          showToast(`Only ${prod.stock} in stock`, 'warning');
          return prev;
        }
        return prev.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p);
      }
      const pVat = getVatForItem(vatCtx, prod.category);
      return [...prev, { id: prod.id, name: prod.name, price: parseFloat(prod.price), stock: prod.stock, qty: 1, vat_rate: pVat.rate }];
    });
    setShowCart(true);
  };

  const updateCartQty = (id, delta) => {
    setPosCart(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const nq = p.qty + delta;
          if (nq > p.stock && saleType === 'WALK-IN') {
            showToast(`Only ${p.stock} in stock`, 'warning');
            return p;
          }
          return { ...p, qty: Math.max(1, nq) };
        }
        return p;
      });
    });
  };

  const removeFromCart = (id) => {
    setPosCart(prev => prev.filter(p => p.id !== id));
  };

  const posCartTotal = posCart.reduce((sum, p) => sum + (p.price * p.qty), 0).toFixed(2);

  const resetForm = () => {
    setPosCart([]);
    setPosPaymentMethod('');
    setPaymentReference('');
    setPaymentAmount('');
    setPayerName('');
    setPayerPhone('');
    setPaymentScreenshot(null);
    setPrescriptionRequestId(null);
    setSaleType('WALK-IN');
    setPosStep(1);
    setShowCart(false);
  };

  const submitPOS = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) return showToast('Cart is empty', 'warning');
    if (!posPaymentMethod) return showToast('Please select a payment method', 'warning');
    if (!branchId) return showToast('Please select a branch', 'warning');

    const selectedBranch = branches.find(b => b.id === parseInt(branchId) || b.branch_id === parseInt(branchId));

    const payloadObj = {
      branch_id: branchId ? parseInt(branchId) : (branches[0]?.id || 1),
      worker_id: workers[0]?.id || null,
      sale_type: saleType,
      items: posCart,
      payment: {
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
      },
      skip_stock_deduction: !!prescriptionRequestId
    };

    const fd = new FormData();
    fd.append('branch_id', payloadObj.branch_id);
    if (payloadObj.worker_id) fd.append('worker_id', payloadObj.worker_id);
    fd.append('sale_type', payloadObj.sale_type);
    fd.append('items', JSON.stringify(payloadObj.items));
    fd.append('payment', JSON.stringify(payloadObj.payment));
    fd.append('skip_stock_deduction', payloadObj.skip_stock_deduction);
    if (paymentScreenshot) fd.append('paymentScreenshot', paymentScreenshot);

    setLoading(true);
    try {
      const res = await apiClient.post('/pharmacy/sales', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.status === 'success' || res.data) {
        if (prescriptionRequestId) {
          try {
            await apiClient.post(`/pharmacy/requests/${prescriptionRequestId}/approve`, {});
            await apiClient.put(`/pharmacy/requests/${prescriptionRequestId}/ready`, {});
          } catch (approveErr) {
            console.warn('Could not mark prescription request as complete:', approveErr.message);
          }
          setPendingOrders(prev => prev.filter(o => o.id !== prescriptionRequestId));
        }

        setCompletedSale({
          receipt_no: res.data?.receipt_no || `REC-${Date.now()}`,
          date: new Date().toLocaleString(),
          branch: selectedBranch?.name || 'N/A',
          worker: workerName || 'N/A',
          items: posCart,
          total: posCartTotal,
          payment_method: posPaymentMethod
        });

        loadProducts();
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
    win.document.write(`
      <!DOCTYPE html><html><head><title>Receipt ${completedSale.receipt_no}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 320px; margin: 0 auto; }
        h2 { text-align: center; font-size: 16px; margin-bottom: 4px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .total { font-weight: bold; font-size: 14px; }
      </style></head>
      <body>
        <h2>SUTANA PHARMACY</h2>
        <div class="center">Receipt: ${completedSale.receipt_no}</div>
        <div class="center">${completedSale.date}</div>
        <div class="divider"></div>
        ${completedSale.items.map(it => `
          <div class="row">
            <span>${it.name} (x${it.qty})</span>
            <span>${(it.price * it.qty).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row total">
          <span>TOTAL</span>
          <span>${completedSale.total} ETB</span>
        </div>
        <div class="divider"></div>
        <div class="center">Method: ${completedSale.payment_method}</div>
        <div class="center" style="margin-top: 12px; color: #555;">Thank you for your business!</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()));

  return (
    <div className={styles.page}>
      <ToastContainer />
      <div className={styles.wrap}>
        
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Pharmacy POS</h1>
            <p className={styles.subtitle}>Process sales & online orders</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? styles.spin : ''} /> Refresh
            </button>
            <button className={styles.btnPrimary} onClick={() => { resetForm(); setTab('walkin'); }}>
              <Plus size={16} /> New Sale
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'walkin' ? styles.tabActive : ''}`} onClick={() => setTab('walkin')}>
            <ShoppingCart size={16} /> Sales POS
          </button>
          <button className={`${styles.tab} ${tab === 'list' ? styles.tabActive : ''}`} onClick={() => setTab('list')}>
            <Smartphone size={16} /> Online Orders
            {pendingOrders.length > 0 && <span className={styles.badgePill}>{pendingOrders.length}</span>}
          </button>
        </div>

        {/* ─── TAB: SALES POS (WALK-IN / CHECKOUT) ─── */}
        {tab === 'walkin' && (
          <div className={styles.posLayout}>
            
            {/* LEFT: Products Grid (hidden on mobile if cart is showing, or if in step 2+) */}
            {posStep === 1 ? (
              <div style={{ display: showCart && window.innerWidth < 1024 ? 'none' : 'block' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input 
                      type="text" 
                      placeholder="Search inventory..." 
                      className={styles.input} 
                      style={{ paddingLeft: '36px' }}
                      value={posSearch}
                      onChange={e => setPosSearch(e.target.value)}
                    />
                  </div>
                  <button className={styles.btnPrimary} onClick={() => setShowCart(true)} style={{ display: window.innerWidth < 1024 ? 'flex' : 'none' }}>
                    View Cart ({posCart.length})
                  </button>
                </div>

                <div className={styles.productGrid}>
                  {filteredProducts.map(p => (
                    <div key={p.id} className={styles.productCard} onClick={() => addToCart(p)}>
                      <div className={styles.prodName} title={p.name}>{p.name}</div>
                      <div className={styles.prodCat}>{p.category}</div>
                      <div className={styles.prodPrice}>{parseFloat(p.price).toFixed(2)} ETB</div>
                      <div className={styles.prodStock}>{p.stock} in stock</div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                      No products found.
                    </div>
                  )}
                </div>
              </div>
            ) : posStep === 4 ? (
              // Success Screen Left
              <div className={styles.successScreen}>
                <CheckCircle size={64} color="hsl(var(--success))" style={{ marginBottom: '1rem' }} />
                <h2 className={styles.successTitle}>Transaction Complete!</h2>
                <p className={styles.successDesc}>The sale has been recorded successfully.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className={styles.btnPrimary} onClick={printReceipt}><Printer size={16} /> Print Receipt</button>
                  <button className={styles.btnSecondary} onClick={resetForm}>New Transaction</button>
                </div>
              </div>
            ) : (
              // Step 2 & 3: Checkout Forms
              <div className={styles.stepContainer}>
                
                {posStep === 2 && (
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}><User size={18} /> Customer Details</h2>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.formLabel}>Customer Name</label>
                      <input type="text" className={styles.input} value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Walk-in Customer" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.formLabel}>Phone Number</label>
                      <input type="text" className={styles.input} value={payerPhone} onChange={e => setPayerPhone(e.target.value)} placeholder="09..." />
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <button className={styles.btnPrimary} onClick={() => setPosStep(3)}>Continue to Payment</button>
                      <button className={styles.btnSecondary} onClick={() => setPosStep(1)}>Back</button>
                    </div>
                  </div>
                )}

                {posStep === 3 && (
                  <form className={styles.card} onSubmit={submitPOS}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}><CreditCard size={18} /> Payment Details</h2>
                    </div>

                    <div className={styles.paymentMethodsGrid}>
                      {getPaymentMethods().map(pm => (
                        <div 
                          key={pm.value} 
                          className={`${styles.paymentMethodCard} ${posPaymentMethod === pm.value ? styles.active : ''}`}
                          onClick={() => setPosPaymentMethod(pm.value)}
                        >
                          <div className={styles.pmIcon}>{pm.icon}</div>
                          <div className={styles.pmLabel}>{pm.label}</div>
                        </div>
                      ))}
                    </div>

                    {posPaymentMethod !== 'CASH' && posPaymentMethod !== '' && (
                      <div style={{ background: 'hsl(var(--muted)/0.5)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                        <div className={styles.inputGroup}>
                          <label className={styles.formLabel}>Transaction Reference No.</label>
                          <input required type="text" className={styles.input} value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.formLabel}>Payment Screenshot (Optional)</label>
                          <input type="file" ref={fileRef} accept="image/*,.pdf" className={styles.input} onChange={e => setPaymentScreenshot(e.target.files[0])} />
                        </div>
                      </div>
                    )}

                    <div className={styles.checkoutTotalBox}>
                      <div className={styles.checkoutTotalLabel}>Total Amount Due</div>
                      <div className={styles.checkoutTotalAmt}>{posCartTotal} ETB</div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className={styles.btnSuccess} disabled={loading} style={{ flex: 1, padding: '0.75rem' }}>
                        {loading ? 'Processing...' : 'Confirm Payment'}
                      </button>
                      <button type="button" className={styles.btnSecondary} onClick={() => setPosStep(saleType === 'ONLINE' ? 1 : 2)}>Back</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* RIGHT: Cart Panel */}
            <div className={styles.cartPanel} style={{ display: (!showCart && window.innerWidth < 1024) ? 'none' : 'flex' }}>
              <div className={styles.cartHeader}>
                <div className={styles.cartTitle}><ShoppingCart size={18} /> Order Summary</div>
                {window.innerWidth < 1024 && posStep === 1 && (
                  <button className={styles.btnIcon} onClick={() => setShowCart(false)}><X size={16}/></button>
                )}
              </div>
              
              <div className={styles.cartBody}>
                {posCart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', marginTop: '2rem' }}>
                    Cart is empty
                  </div>
                ) : (
                  posCart.map(p => (
                    <div key={p.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <div className={styles.cartItemName}>{p.name}</div>
                        <div className={styles.cartItemPrice}>{parseFloat(p.price).toFixed(2)} ETB</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {posStep === 1 ? (
                          <div className={styles.qtyControl}>
                            <button className={styles.qtyBtn} onClick={() => p.qty > 1 ? updateCartQty(p.id, -1) : removeFromCart(p.id)}>-</button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, width: '20px', textAlign: 'center' }}>{p.qty}</span>
                            <button className={styles.qtyBtn} onClick={() => updateCartQty(p.id, 1)}>+</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>x{p.qty}</span>
                        )}
                        <div className={styles.cartItemTotal}>{(p.price * p.qty).toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.cartFooter}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{posCartTotal} ETB</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>{posCartTotal} ETB</span>
                </div>
                
                {posStep === 1 && posCart.length > 0 && (
                  <button className={styles.btnPrimary} onClick={() => setPosStep(2)} style={{ width: '100%', padding: '0.75rem' }}>
                    Proceed to Checkout
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: ONLINE ORDERS LIST ─── */}
        {tab === 'list' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Pending Online Orders</h2>
            </div>
            
            {pendingOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyIcon} />
                <h2 className={styles.emptyTitle}>No Pending Orders</h2>
                <p className={styles.emptyDesc}>All online orders have been processed.</p>
              </div>
            ) : (
              <div className={styles.ordersGrid}>
                {pendingOrders.map(order => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderCardHeader}>
                      <div>
                        <div className={styles.orderCardId}>{order.sale_code || `ORD-${order.id}`}</div>
                        <div className={styles.orderCardDate}>{new Date(order.created_at).toLocaleString()}</div>
                      </div>
                      <span className={`${styles.badge} ${
                        order.finance_payment_status === 'Approved' ? styles.badgeGreen :
                        order.finance_payment_status === 'Rejected' ? styles.badgeRed : styles.badgeGray
                      }`}>
                        Finance: {order.finance_payment_status || 'Pending'}
                      </span>
                    </div>

                    <div>
                      <div className={styles.orderCardCustomer}>{order.customer_name || 'Guest'}</div>
                      <div className={styles.orderCardPhone}>{order.customer_phone}</div>
                    </div>

                    <div className={styles.orderCardItems}>
                      {order.items?.length || 0} items &middot; Payment: {order.payment_method}
                    </div>

                    <div className={styles.orderCardTotal}>
                      <span>{parseFloat(order.total_amount).toFixed(2)} ETB</span>
                    </div>

                    <div className={styles.orderCardActions}>
                      <button className={styles.btnSecondary} onClick={() => setSelectedOrderDetail(order)} style={{ flex: 1 }}>
                        <Eye size={16} /> View
                      </button>
                      <button 
                        className={styles.btnPrimary} 
                        onClick={() => processOnlineOrder(order)}
                        disabled={order.finance_payment_status !== 'Approved' && order.finance_payment_status !== null}
                        title={order.finance_payment_status !== 'Approved' ? 'Awaiting Finance Approval' : 'Move to POS'}
                        style={{ flex: 1 }}
                      >
                        {order.finance_payment_status !== 'Approved' && order.finance_payment_status !== null ? 'Locked' : 'Move to POS'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Online Order Detail Modal */}
      {selectedOrderDetail && (
        <div className={styles.overlay} onClick={() => setSelectedOrderDetail(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Package size={20} color="hsl(var(--primary))" /> Order Details
            </div>
            
            <div style={{ marginBottom: '1.5rem', background: 'hsl(var(--muted)/0.3)', padding: '1rem', borderRadius: 'var(--radius)' }}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Order ID</span>
                <span className={styles.detailValue}>{selectedOrderDetail.sale_code || `ORD-${selectedOrderDetail.id}`}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Customer</span>
                <span className={styles.detailValue}>{selectedOrderDetail.customer_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Payment Method</span>
                <span className={styles.detailValue}>{selectedOrderDetail.payment_method}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reference No.</span>
                <span className={styles.detailValue}>{selectedOrderDetail.payment_reference || 'N/A'}</span>
              </div>
              <div className={styles.detailRow} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className={styles.detailLabel}>Total Amount</span>
                <span className={styles.detailValue} style={{ color: 'hsl(var(--primary))', fontSize: '1.125rem', fontWeight: 700 }}>
                  {parseFloat(selectedOrderDetail.total_amount).toFixed(2)} ETB
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Items</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Drug</th>
                    <th className={styles.th}>Qty</th>
                    <th className={styles.th}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrderDetail.items || []).map((it, idx) => (
                    <tr key={idx} className={styles.tr}>
                      <td className={styles.td}>{it.drug_name}</td>
                      <td className={styles.td}>{it.quantity}</td>
                      <td className={styles.td}>{parseFloat(it.unit_price).toFixed(2)} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrderDetail(null)} style={{ flex: 1 }}>Close</button>
              <button 
                className={styles.btnPrimary} 
                onClick={() => { const o = selectedOrderDetail; setSelectedOrderDetail(null); processOnlineOrder(o); }}
                disabled={selectedOrderDetail.finance_payment_status !== 'Approved' && selectedOrderDetail.finance_payment_status !== null}
                style={{ flex: 1 }}
              >
                Move to POS Form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
