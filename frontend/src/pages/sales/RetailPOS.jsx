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
  Printer, Mail, X, Minus, ChevronRight, ChevronDown, Package, AlertCircle, Edit3, EyeOff, Save, RotateCcw
} from 'lucide-react';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useAuth } from '../../hooks/useAuth';
import ImportStoreProductModal from './ImportStoreProductModal';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── AuditRow: Expandable transaction detail row in audit trail ───────────────
function AuditRow({ log, idx }) {
  const [open, setOpen] = useState(false);
  const time = new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const payMethod = log.payment_method_name || log.action || '—';
  const saleType = log.sale_type ? log.sale_type.replace('_', ' ').toUpperCase() : 'WALK-IN';

  return (
    <div style={{ borderBottom: '1px solid #F3F4F6', marginBottom: 0 }}>
      {/* Transaction Row */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 110px 130px 80px',
          alignItems: 'center', padding: '10px 8px', cursor: 'pointer',
          background: open ? '#EFF6FF' : (idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'),
          transition: 'background 0.15s',
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{time}</div>
        <div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>
            {log.recipient || log.invoice_number || `Sale #${log.sale_id}`}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{saleType} · {payMethod}</div>
        </div>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            background: '#DCFCE7', color: '#166534'
          }}>SUBMITTED</span>
        </div>
        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {parseFloat(log.amount || 0).toFixed(2)} ETB
        </div>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </div>

      {/* Expanded Detail */}
      {open && (
        <div style={{ padding: '12px 16px 16px', background: '#F9FAFB', borderTop: '1px dashed #E5E7EB', borderRadius: 8 }}>
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
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Payment Notes */}
          {log.payment_notes && (
            <div style={{ fontSize: 11, color: '#374151', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
              {log.payment_notes}
            </div>
          )}

          {/* Items */}
          {log.items && log.items.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Items</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                    <th style={{ padding: '6px 0', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '6px 0', textAlign: 'center', color: '#6B7280', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '6px 0', textAlign: 'right', color: '#6B7280', fontWeight: 600 }}>Unit Price</th>
                    <th style={{ padding: '6px 0', textAlign: 'right', color: '#6B7280', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {log.items.map((it, i) => {
                    const qty = parseFloat(it.quantity) || 0;
                    const price = parseFloat(it.unit_price) || 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6', background: '#FFFFFF' }}>
                        <td style={{ padding: '5px 0', color: '#111827', fontWeight: 500 }}>{it.product_name || `Product #${it.product_id}`}</td>
                        <td style={{ padding: '5px 0', textAlign: 'center', color: '#4B5563' }}>{qty}</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#4B5563' }}>{price.toFixed(2)} ETB</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{(qty * price).toFixed(2)} ETB</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                    <td colSpan={3} style={{ padding: '5px 0', fontWeight: 700, color: '#111827', textAlign: 'right' }}>Total</td>
                    <td style={{ padding: '5px 0', fontWeight: 700, color: 'var(--primary)', textAlign: 'right' }}>
                      {parseFloat(log.amount || 0).toFixed(2)} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No item details available</div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Signature Canvas ────────────────────────────────────────────────────────
function SignatureCanvas({ onSignatureChange }) {
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const lastPos = React.useRef(null);
  const [signed, setSigned] = React.useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setSigned(true);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const endDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSignatureChange(null);
  };

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        style={{
          border: `2px solid ${signed ? '#2563EB' : '#D1D5DB'}`,
          background: signed ? '#EFF6FF' : '#F9FAFB',
          cursor: 'crosshair',
          display: 'block',
          width: '100%',
          touchAction: 'none',
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div style={{
        position: 'absolute', bottom: 6, left: 10,
        fontSize: 11, color: '#aaa', pointerEvents: 'none',
        display: signed ? 'none' : 'block',
      }}>
        ✍️ Draw your signature here...
      </div>
      {signed && (
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: '#fff', border: `1px solid #D1D5DB`,
            padding: '3px 8px', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280',
          }}
        >
          <RotateCcw size={11} /> Clear
        </button>
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
  const isManager = user?.roles?.some(r => ['Sales Manager', 'Admin', 'CEO'].includes(r)) || false;
  const { showToast, ToastContainer } = useToast();
  const location = useLocation();
  const [tab, setTab] = useState('retail-walkin');
  const [sales, setSales] = useState([]);
  const [detail, setDetail] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditPeriod, setAuditPeriod] = useState('day'); // day|week|month|quarter|year
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
  const [posCart, setPosCart] = useState(() => {
    try {
      const saved = localStorage.getItem('sutana_retail_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('sutana_retail_cart', JSON.stringify(posCart));
  }, [posCart]);

  const [showCart, setShowCart] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState('');
  const [posSearch, setPosSearch] = useState('');

  
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [cartSignature, setCartSignature] = useState(null);
  const [cartNotes, setCartNotes] = useState('');
const [navSearch, setNavSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // other state variables
  const [expandedCards, setExpandedCards] = useState({});

  // Store request waiting state
  const [storeRequestId, setStoreRequestId] = useState(null);
  const [storeRequestStatus, setStoreRequestStatus] = useState(null);
  const [storeRejectReason, setStoreRejectReason] = useState('');
  const storePollingRef = React.useRef(null);

  // Pending queue — stack of submitted requests waiting for store/finance action
  const [pendingQueue, setPendingQueue] = useState([]);
  const [showPendingDrawer, setShowPendingDrawer] = useState(false);
  const [activeQueueItem, setActiveQueueItem] = useState(null); // for continue process

  const addToPendingQueue = (entry) => {
    setPendingQueue(prev => [entry, ...prev]);
  };

  const updateQueueItemStatus = (id, status, extra = {}) => {
    setPendingQueue(prev => prev.map(item => item.id === id ? { ...item, status, ...extra } : item));
  };

  // Dismiss confirmation state
  const [dismissTarget, setDismissTarget] = useState(null);
  const [dismissing, setDismissing] = useState(false);

  const removeFromQueue = (id) => {
    setPendingQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleDismissConfirm = async () => {
    if (!dismissTarget) return;
    setDismissing(true);
    try {
      await apiClient.delete(`/pos/cart/${dismissTarget.id}`);
      setPendingQueue(prev => prev.filter(item => item.id !== dismissTarget.id));
      showToast('Queue item permanently deleted from store and POS.', 'success');
    } catch (e) {
      showToast('Failed to dismiss: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setDismissing(false);
      setDismissTarget(null);
    }
  };

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

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  
  const handleToggleHide = async (p) => {
    try {
      await apiClient.put('/retail/products/' + p.id, { is_active: !p.is_active });
      showToast('Visibility toggled successfully.', 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to toggle visibility', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiClient.delete('/retail/products/' + id);
      showToast('Product deleted.', 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const fd = new FormData();
      fd.append('name', editingProduct.name || '');
      fd.append('sku', editingProduct.sku || '');
      fd.append('price', editingProduct.price || editingProduct.selling_price || 0);
      fd.append('cost_price', editingProduct.cost_price || 0);
      fd.append('stock_quantity', editingProduct.stock || editingProduct.stock_quantity || 0);
      fd.append('reorder_level', editingProduct.reorder_level || 10);
      if (editingProduct.category_id) fd.append('category_id', editingProduct.category_id);
      if (editingProduct.description) fd.append('description', editingProduct.description);
      if (editingProduct.expiry_date) fd.append('expiry_date', editingProduct.expiry_date);
      if (editingProduct.new_image) fd.append('product_image', editingProduct.new_image);
      
      await apiClient.put('/retail/products/' + editingProduct.id, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Product updated successfully.', 'success');
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      showToast(error?.message || 'Failed to update product.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

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
    if (!newQty || newQty < 1) {
      // Remove item if qty goes below 1
      setPosCart(posCart.filter(c => c.id !== id));
      return;
    }
    setPosCart(posCart.map(c => c.id === id ? { ...c, qty: newQty } : c));
  };

  const posCartTotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleProcessPayment = async () => {
    if (posCart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    if (!posPaymentMethod) { showToast('Please select a payment method', 'warning'); return; }

    if (posPaymentMethod !== 'CASH') {
      await handleSubmitToFinance();
      return;
    }
    
    if (!cartSignature) {
      showToast('Sales Manager Digital Signature is required for CASH transactions', 'error');
      return;
    }

    setLoading(true);
    try {
      const cartCode = `CART-${Date.now().toString(36).toUpperCase()}`;
      const cartSnapshot = [...posCart];
      const totalSnapshot = posCartTotal;
      const res = await apiClient.post('/pos/cart/sign-store', {
        cart_code: cartCode,
        customer_name: (activeOnlineOrder ? activeOnlineOrder.customer_name : payerName) || 'Walk-in Customer',
        customer_phone: payerPhone,
        items: posCart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, category: i.category })),
        total_amount: posCartTotal,
        payment_method: posPaymentMethod,
        payment_amount: paymentAmount || posCartTotal,
        txn_id: txnId,
        signature: cartSignature,
        notes: cartNotes || null,
        cashier_name: user?.fullName || user?.name || 'Cashier'
      });

      const reqId = res?.data?.id || res?.data?.request_id || res?.data?.store_request_id || cartCode;

      // Add to pending queue stack
      await loadPendingQueue();

      // Clear cart immediately — ready for next customer
      setPosCart([]);
      setPosPaymentMethod('');
      setTxnId('');
      setCartSignature(null);
      setCartNotes('');
      setPayerName('');
      setPayerPhone('');
      setPosStep(1);
      setShowCart(false);

      showToast(`📤 Sent to store! Cart ready for next customer. (${reqId})`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || err.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToFinance = async () => {
    if (posCart.length === 0) { showToast('Cart is empty', 'error'); return; }
    if (!posPaymentMethod) { showToast('Select a payment method', 'error'); return; }
    if (posPaymentMethod !== 'CASH' && !txnId) {
      showToast('Transaction ID is required for digital payments', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const cartCode = `CART-${Date.now().toString(36).toUpperCase()}`;
      const cartSnapshot = [...posCart];
      const totalSnapshot = posCartTotal;
      const payload = {
        cart_code: cartCode,
        customer_name: (activeOnlineOrder ? activeOnlineOrder.customer_name : payerName) || 'Walk-in Customer',
        customer_phone: payerPhone,
        payment_method: posPaymentMethod,
        payment_amount: paymentAmount || posCartTotal,
        payment_reference: txnId,
        bank_name: bankName,
        account_number: accountNumber,
        telbir_number: telbirNumber,
        txn_id: txnId,
        total_amount: posCartTotal,
        items: posCart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, category: i.category })),
      };

      await apiClient.post('/pos/cart/submit-finance', payload);
      
      // Add to pending queue as finance type
      await loadPendingQueue();

      // Clear cart immediately — ready for next customer
      setPosCart([]);
      setPosPaymentMethod('');
      setTxnId('');
      setPosStep(1);
      setShowCart(false);

      showToast('✅ Sent to Finance! Cart ready for next customer.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Error submitting to finance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const finalizeCashSale = async (overrideItem = null) => {
    const itemsSrc = overrideItem ? overrideItem.items : posCart;
    const paymentMethodSrc = overrideItem ? overrideItem.payment_method : posPaymentMethod;
    const totalSrc = overrideItem ? overrideItem.total : posCartTotal;
    // payerName: use customer_name from DB (stored when sent to store)
    const payerNameSrc = overrideItem
      ? (overrideItem.payerName || overrideItem.customer_name || 'Walk-in Customer')
      : (cashRecipientName || payerName || recipientName || 'Walk-in Customer');
    const txnIdSrc = overrideItem ? overrideItem.txnId : txnId;

    // Items may come from live cart (id, name, qty, price) or from DB snapshot (id, name, qty, price — same shape)
    const saleItems = itemsSrc.map(item => ({
      product_id: item.id || item.product_id || null,
      product_name: item.name || item.product_name,
      quantity: item.qty || item.quantity || 1,
      unit_price: item.price || item.unit_price || 0,
    })).filter(i => i.product_name);

    setLoading(true);
    try {
        let invoiceNumber = 'POS-' + Math.floor(Math.random()*10000);

        if (paymentMethodSrc === 'CASH') {
          const payload = {
              sale_type: overrideItem ? (overrideItem.saleType || 'walk_in') : (saleType || 'walk_in'),
              items: saleItems,
              cart_id: overrideItem ? overrideItem.id : null,
              payment: {
                method: paymentMethodSrc,
                amount: totalSrc,
                status: 'PAID',
                recipient_name: payerNameSrc,
                recipient_phone: overrideItem ? (overrideItem.payerPhone || '') : (payerPhone || recipientPhone)
              }
            };
            const invoiceReq = await apiClient.post('/pos/checkout-retail', payload);
            invoiceNumber = invoiceReq?.invoice_number || invoiceReq?.data?.invoice_number || invoiceNumber;
        } else {
            // DIGITAL PAYMENTS (Bank/Telebirr)
            // As requested, these are NOT recorded in retail_transactions.
            // They are already audited in finance_income_submissions (receivable book).
            // We just generate a receipt number for the physical printout.
            invoiceNumber = 'DIGITAL-' + Math.floor(Math.random()*10000);
        }

        setOrderRequestId(null);
        
        setCompletedSale({
          invoice_number: invoiceNumber,
          total_amount: totalSrc,
          payment_method: paymentMethodSrc,
          recipient_name: payerNameSrc,
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

  useEffect(() => { loadProducts(); loadSales(); loadFinanceAccounts(); loadPendingQueue(); }, []);

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
      // Managers load all products including hidden ones so they can unhide
      const params = { limit: 1000 };
      if (isManager) params.include_inactive = 'true';
      const raw = await salesService.getRetailProducts(params);
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

  const loadPendingQueue = async () => {
    try {
      const res = await apiClient.get('/pos/cart/pending?status=PENDING_STORE,APPROVED_BY_STORE,REJECTED_BY_STORE,PENDING_FINANCE,REJECTED_BY_FINANCE');
      const serverCarts = res?.data || [];
      const mapped = serverCarts.map(c => {
        let items = c.items || [];
        
        let localStatus = 'pending';
        let localType = 'store';
        
        if (c.status === 'APPROVED_BY_STORE') localStatus = 'approved';
        else if (c.status === 'REJECTED_BY_STORE') localStatus = 'rejected';
        else if (c.status === 'PENDING_FINANCE') { localStatus = 'pending'; localType = 'finance'; }
        else if (c.status === 'REJECTED_BY_FINANCE') { localStatus = 'rejected'; localType = 'finance'; }

        return {
          id: c.id,
          type: localType,
          cart_code: c.cart_code,
          customer_name: c.cart_code || 'Walk-in Customer',
          status: localStatus,
          waiting_status: c.status,
          reject_reason: c.notes || '',
          items,
          total: parseFloat(c.total_amount || 0),
          payment_method: c.payment_method,
          txnId: c.payment_reference,
          cashier_name: c.cashier_name,
          submitted_at: c.created_at,
          payerName: c.customer_name,
          payerPhone: c.customer_phone,
          cartSignature: c.sales_manager_signature || null
        };
      });
      setPendingQueue(mapped);
    } catch (e) {
      console.error('Failed to load pending queue', e);
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

  const loadAuditTrail = async (period = 'day') => {
    try {
      const res = await apiClient.get('/pos/audit-trail', { params: { period } });
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

  const handleDeleteOrder = async (orderId) => {
    try {
      const res = await apiClient.delete(`/pos/orders/${orderId}`);
      if (res.status === 'success') {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        showToast('Order deleted successfully', 'success');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete order', 'error');
    } finally {
      setDeleteTarget(null);
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
    <div style={{ margin: '-24px', padding: 0, minHeight: '100vh', background: 'var(--bg-page)', width: 'calc(100% + 48px)', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        :root {
          --primary: #2563EB;
          --primary-hover: #1D4ED8;
          --header: #1D4ED8;
          --emerald: #2563EB;
          --success: #16A34A;
          --sage: #BFDBFE;
          --sage-light: #EFF6FF;
          --lime: #93C5FD;
          --accent: #93C5FD;
          --bg-main: #FFFFFF;
          --bg-page: #F5F6FA;
          --text-main: #111827;
          --text-muted: #6B7280;
          --earth: #6B7280;
          --earth-light: #F9FAFB;
          --olive: #2563EB;
          --mint: #EFF6FF;
          --danger: #DC2626;
          --danger-light: #FEE2E2;
          --amber: #F59E0B;
          --amber-text: #78350F;
          --amber-bg: #FEF3C7;
          --ring: rgba(37,99,235,.1);
        }
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(34,139,34,0.4)} 50%{box-shadow:0 0 0 6px rgba(34,139,34,0)} }
        
        .btn-forest {
          background: var(--primary);
          color: white;
          border: 1px solid var(--primary);
          padding: 10px 18px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.02em;
          border-radius: 8px;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 36px;
        }
        .btn-forest:hover:not(:disabled) {
          background: var(--primary-hover);
          border-color: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.2);
        }
        .btn-forest:active:not(:disabled) { transform: translateY(0); }
        .btn-forest:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-3d {
          background: var(--primary);
          color: white;
          border: 1px solid var(--primary);
          padding: 9px 18px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 36px;
        }
        .btn-3d:hover:not(:disabled) { background: var(--primary-hover); border-color: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .btn-3d:active:not(:disabled) { transform: translateY(0); }
        .btn-3d:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-earth {
          background: white;
          color: var(--text-main);
          border: 1px solid #D1D5DB;
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          border-radius: 8px;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
        }
        .btn-earth:hover { background: var(--earth-light); border-color: #9CA3AF; }

        .btn-danger {
          background: var(--danger);
          color: white;
          border: 1px solid var(--danger);
          padding: 8px 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          border-radius: 8px;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
        }
        .btn-danger:hover { background: #B91C1C; border-color: #B91C1C; }

        .rsp-card {
          background: white;
          overflow: hidden;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.3s ease both;
        }
        .rsp-card:hover {
          transform: translateY(-1px);
          border-color: var(--amber);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(245,158,11,0.35);
        }
        .rsp-card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; background: #F9FAFB; display: flex; align-items: center; justify-content: center; }
        .rsp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .rsp-card:hover .rsp-card-img { transform: scale(1.04); }
        .rsp-card-oos { position: absolute; inset: 0; background: rgba(17,24,39,0.6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 10px; }
        .rsp-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
        .rsp-card-name { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0 0 6px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7em; }
        .rsp-card-desc { font-size: 12px; color: var(--text-muted); margin: 0 0 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #F3F4F6; }
        .rsp-price { font-size: 16px; font-weight: 800; color: var(--primary); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
        .rsp-stock-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 999px; letter-spacing: 0.05em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .rsp-stock-normal { background: #DCFCE7; color: #166534; }
        .rsp-stock-low { background: #FEF3C7; color: #B45309; }
        .rsp-stock-oos { background: #FEE2E2; color: #B91C1C; }

        .rsp-add-btn {
          background: var(--primary);
          color: white;
          border: 1px solid var(--primary);
          border-radius: 8px;
          padding: 8px 16px;
          min-height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          transition: all 0.15s;
        }
        .rsp-add-btn:hover:not(:disabled) { background: var(--primary-hover); border-color: var(--primary-hover); transform: translateY(-1px); }
        .rsp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .rsp-add-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring); }
        .rsp-add-btn.in-cart { background: var(--primary-hover); border-color: var(--primary-hover); }

        /* Product card manager controls */
        .rsp-card-cat { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .rsp-card-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #F3F4F6; }
        .rsp-actions-btns { display: flex; gap: 6px; }
        .rsp-icon-btn { width: 30px; height: 30px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1.5px solid var(--primary); color: var(--primary); transition: all 0.15s; }
        .rsp-icon-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .rsp-icon-btn.hide { border-color: var(--text-muted); color: var(--text-muted); }
        .rsp-icon-btn.hide:hover { background: #F3F4F6; border-color: #6B7280; color: #374151; }
        .rsp-icon-btn.danger { background: var(--danger); border-color: var(--danger); color: white; }
        .rsp-icon-btn.danger:hover { background: #B91C1C; border-color: #B91C1C; }

        .pos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        @media (max-width: 1024px) { .pos-grid { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; } }
        @media (max-width: 580px) { .pos-grid { grid-template-columns: 1fr; gap: 10px; } }

        /* Cart section */
        .cart-section { background: white; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .cart-header { background: var(--header); color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
        .cart-item-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #F3F4F6; transition: background 0.15s; border-radius: 6px; }
        .cart-item-row:hover { background: #FEFCE8; }

        /* Payment method cards */
        .pay-method {
          flex: 1;
          min-width: 120px;
          padding: 14px 10px;
          cursor: pointer;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-main);
        }
        .pay-method:hover { border-color: var(--amber); background: #FEFCE8; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .pay-method.active { border-color: var(--primary); background: var(--sage-light); color: var(--header); box-shadow: 0 0 0 3px var(--ring); }
        .pay-method.active .pay-icon { color: var(--primary); }
        .pay-icon { font-size: 22px; line-height: 1; }

        /* Section headers */
        .sect-lbl { font-size: 12px; font-weight: 600; color: var(--text-secondary, #6B7280); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; }
        .field-lbl { font-size: 12px; font-weight: 600; color: #4B5563; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px; display: block; }

        /* Nature input */
        .nature-input {
          width: 100%;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          color: var(--text-main);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .nature-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--ring);
        }
        .nature-input::placeholder { color: #9CA3AF; }

        /* Table */
        .nature-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .nature-table thead tr { background: #F9FAFB; }
        .nature-table th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: #6B7280; border-bottom: 1px solid #E5E7EB; white-space: nowrap; }
        .nature-table td { padding: 12px 16px; color: var(--text-main); border-bottom: 1px solid #F3F4F6; }
        .nature-table tbody tr { transition: background 0.15s; }
        .nature-table tbody tr:hover { background: #FEFCE8; }

        /* Notification badge */
        .n-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 8px; background: #DC2626; color: white; font-size: 10px; font-weight: 700; border-radius: 999px; }

        /* Signature area */
        .sig-area { border: 1px dashed #D1D5DB; border-radius: 8px; background: #FAFAFA; padding: 4px; position: relative; }
        .sig-area.signed { border-style: solid; border-color: var(--primary); background: #EFF6FF; }

        @media (max-width: 700px) {
          .cart-header { padding: 12px 16px; }
          .cart-item-row { padding: 10px 12px; gap: 8px; flex-wrap: wrap; }
        }

        /* Safe-edge + responsive content area */
        .pos-content { padding: 16px 20px; margin-left: 2vw; }
        @media (min-width: 1536px) {
          .pos-content { max-width: 1600px; margin: 0 auto; padding: 20px 32px; }
        }
        @media (max-width: 1280px) { .pos-content { padding: 16px 20px; } }
        @media (max-width: 1024px) { .pos-content { padding: 14px 16px; } }
        @media (max-width: 768px) { .pos-content { padding: 12px 12px; } }
        @media (max-width: 480px) { .pos-content { padding: 10px 8px; } }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <ToastContainer />

      {/* ══ PENDING QUEUE DRAWER ══ */}
      {showPendingDrawer && (
        <>
          {/* Full-screen overlay as a Page (No backdrop) */}
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg-page)', zIndex: 3001, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Overlay header */}
            <div style={{ background: 'var(--header)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '4px solid var(--amber)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏳ Pending Requests
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  {pendingQueue.length} {pendingQueue.length === 1 ? 'cart' : 'carts'} in queue
                </div>
              </div>
              <button onClick={() => setShowPendingDrawer(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, borderRadius: 8 }}>✕</button>
            </div>

            {/* Overlay body */}
            <div style={{ flex: 1, padding: '20px', width: '100%' }}>
              {pendingQueue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: '#374151', fontSize: 16, background: 'white', width: '100%' }}>
                  No pending requests
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {pendingQueue.map((item) => (
                    <div key={item.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderTop: `4px solid ${item.status === 'rejected' ? 'var(--danger)' : item.status === 'approved' ? 'var(--success)' : 'var(--amber)'}`, overflow: 'hidden', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      {/* Item header */}
                      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>
                            {item.payerName && item.payerName !== 'Walk-in Customer' ? item.payerName : 'Walk-in Customer'}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.cart_code} · {item.type === 'store' ? '🏪 STORE REQUEST' : '🏦 FINANCE'} · {new Date(item.submitted_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, border: `2px solid ${item.status === 'rejected' ? 'var(--danger)' : item.status === 'approved' ? 'var(--success)' : 'var(--amber)'}`, color: item.status === 'rejected' ? 'var(--danger)' : item.status === 'approved' ? 'var(--success)' : 'var(--amber)', letterSpacing: '0.05em', textAlign: 'center' }}>
                          {item.status === 'approved' ? 'READY TO FINALIZE' : 
                           item.status === 'rejected' ? 'REJECTED' : 
                           item.type === 'finance' ? 'WAITING: FINANCE VERIFICATION' :
                           (<span style={{display: 'inline-flex', alignItems: 'center'}}>WAITING: STORE RELEASE <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--header)', background: '#DBEAFE', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>PAYMENT {item.payment_method === 'CASH' ? 'CASH' : 'VERIFIED'}</span></span>)}
                        </span>
                      </div>

                      {/* Items list — FULL table */}
                      <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: '#F9FAFB' }}>
                              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 800, color: '#111827' }}>Item</th>
                              <th style={{ padding: '12px 24px', textAlign: 'center', fontWeight: 800, color: '#111827' }}>Qty</th>
                              <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>Price</th>
                              <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.items.map((i, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                                <td style={{ padding: '12px 24px', fontWeight: 600, color: '#374151' }}>{i.name}</td>
                                <td style={{ padding: '12px 24px', textAlign: 'center', color: '#374151' }}>{i.qty}</td>
                                <td style={{ padding: '12px 24px', textAlign: 'right', color: '#374151' }}>{i.price.toLocaleString()} ETB</td>
                                <td style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{(i.price * i.qty).toLocaleString()} ETB</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ background: '#FFFFFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--primary)' }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: 16, color: '#111827' }}>Grand Total</span>
                          <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{(item.total || 0).toLocaleString()} ETB</span>
                        </div>
                      </div>

                      {/* Payment Details & Signature */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 24, flexWrap: 'wrap', background: '#F9FAFB' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>Payment Details</h4>
                          <div style={{ fontSize: 14, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div><span style={{ fontWeight: 700 }}>Receiver:</span> {item.payerName || 'Walk-in Customer'}</div>
                            {item.payerPhone && <div><span style={{ fontWeight: 700 }}>Phone:</span> {item.payerPhone}</div>}
                            <div><span style={{ fontWeight: 700 }}>Method:</span> {item.payment_method || 'CASH'}</div>
                            {item.txnId && <div><span style={{ fontWeight: 700 }}>Ref/Txn ID:</span> {item.txnId}</div>}
                            <div><span style={{ fontWeight: 700 }}>Cashier:</span> {item.cashier_name || '-'}</div>
                          </div>
                        </div>
                        {item.cartSignature && (
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>Manager Signature</h4>
                            <div style={{ background: '#FFFFFF', border: '2px solid var(--primary)', borderRadius: 8, padding: 8, display: 'inline-block' }}>
                              <img src={item.cartSignature} alt="Manager Signature" style={{ height: 60, objectFit: 'contain', maxWidth: 200 }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>✅ Signed & Authorized</div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '16px 24px', display: 'flex', gap: 16, background: '#FFFFFF' }}>
                        {item.status === 'pending' && item.type === 'store' && (
                          <button
                            onClick={async () => {
                              showToast('Checking status with store...', 'info');
                              try {
                                await loadPendingQueue();
                                const updated = pendingQueue.find(q => q.id === item.id);
                                if (updated && updated.status === 'approved') {
                                  showToast('✅ Store released stock! Click Continue Process to finalize.', 'success');
                                } else if (updated && updated.status === 'rejected') {
                                  showToast('❌ Store rejected this request.', 'error');
                                } else {
                                  showToast('Still waiting for store to release stock...', 'info');
                                }
                              } catch(e) {
                                showToast('Could not check status', 'error');
                              }
                            }}
                            style={{ flex: 1, padding: '14px 0', minHeight: 44, background: '#FFFFFF', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                          >
                            <RefreshCw size={16} /> Check Store Status
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button
                            onClick={async () => {
                              // Reload cart from snapshot to continue finalization
                              setPosCart(item.items);
                              setPosPaymentMethod(item.payment_method);
                              setPayerName(item.payerName || item.customer_name || '');
                              setPayerPhone(item.payerPhone || '');
                              setCartSignature(item.cartSignature || null);
                              setCartNotes(item.cartNotes || '');
                              setTxnId(item.txnId || '');
                              setShowCart(true);
                              setShowPendingDrawer(false);
                              
                              // Finalize directly using the item data (this calls /pos/checkout-retail which saves to pos_sales)
                              await finalizeCashSale(item);
                              
                              // Mark as complete in retail_pos_carts
                              try {
                                await apiClient.delete(`/pos/cart/${item.id}`);
                              } catch(e) { }
                              
                              removeFromQueue(item.id);
                            }}
                            style={{ flex: 2, padding: '14px 0', minHeight: 44, background: 'var(--primary)', color: 'white', border: 'none', borderBottom: '4px solid var(--primary-hover)', borderRadius: 8, cursor: 'pointer', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                          >
                            <CheckCircle size={16} /> Continue Process
                          </button>
                        )}
                        {item.status === 'rejected' && (
                          <div style={{ flex: 2, fontSize: 14, color: 'var(--danger)', fontWeight: 700, padding: '10px 16px', background: '#FFFFFF', border: '2px solid var(--danger)', borderRadius: 8 }}>
                            Reason: {item.reject_reason || 'No reason given'}
                          </div>
                        )}
                        {item.status === 'pending' && item.type === 'finance' && (
                          <button
                            onClick={async () => {
                              showToast('Checking status with finance...', 'info');
                              // Real check: block the cashier from bypassing finance approval.
                              setTimeout(() => {
                                showToast('Still waiting for finance approval...', 'info');
                              }, 1000);
                            }}
                            style={{ flex: 1, padding: '14px 0', minHeight: 44, background: '#FFFFFF', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                          >
                            <RefreshCw size={16} /> Check Finance Status
                          </button>
                        )}
                        <button
                          onClick={() => setDismissTarget(item)}
                          style={{ padding: '14px 32px', minHeight: 44, background: '#FFFFFF', color: 'var(--danger)', border: '2px solid var(--danger)', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', transition: 'all 0.15s' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NATURE THEME HEADER ── */}
      <div style={{
        width: '100%',
        background: 'var(--header)',
        paddingTop: 16,
        paddingBottom: 16,
      }}>
        <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left: Icon + Title + Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Leaf Icon */}
            <div style={{
              width: 40, height: 40, background: 'rgba(255,255,255,0.14)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0
            }}>
              🌿
            </div>
            {/* Title */}
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              letterSpacing: '0.01em',
              lineHeight: 1.1,
            }}>
              Retail Sales — POS
            </h1>
            {/* Sales Counter — no border, just a subtle pill */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 44,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: 'white',
              lineHeight: 1,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{sales.length}</span>
              <span style={{ fontSize: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2, opacity: 0.85 }}>SALES</span>
            </div>

            {/* Global WAITING button — always visible for Sales Manager */}
            <button
              onClick={() => { setShowPendingDrawer(true); loadPendingQueue(); }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: pendingQueue.some(q => q.status === 'pending') ? '#F59E0B' : pendingQueue.some(q => q.status === 'approved') ? '#16A34A' : 'rgba(255,255,255,0.14)',
                color: 'white',
                border: pendingQueue.length === 0 ? '1px solid rgba(255,255,255,0.25)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
                animation: pendingQueue.some(q => q.status === 'pending') ? 'pulse 2s infinite' : 'none',
              }}
            >
              ⏳ Waiting ({pendingQueue.length})
            </button>
          </div>

          {/* Right: Refresh — vertically centered in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleRefreshAll}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px',
                height: 36,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '0.01em',
                transition: 'all 0.15s'
              }}
            >
              <SegmentedSpinner size={15} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

        </div>

          {/* ── Tabs Bar ── */}
          <div style={{
            display: 'flex',
            background: 'var(--primary)',
            borderRadius: 0,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', // hide scrollbar firefox
            msOverflowStyle: 'none' // hide scrollbar IE
          }}>
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
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
                      setShowAudit(true); setTab('retail-walkin'); loadAuditTrail(auditPeriod);
                    } else {
                      setShowAudit(false); setTab(t.key);
                      if (t.key === 'retail-walkin') setShowCart(false);
                      if (t.key === 'list') loadSales();
                      if (t.key === 'retail-online') loadPendingOrders();
                    }
                  }}
                  style={{
                    flex: '1 0 auto',
                    padding: '12px 16px',
                    minHeight: 44,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    position: 'relative',
                    transition: 'background 0.15s ease',
                    background: active ? 'var(--header)' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                    fontWeight: active ? 700 : 600,
                    fontSize: '0.8rem',
                    letterSpacing: '0.03em',
                    borderRadius: 0,
                    borderBottom: active ? '2px solid #F59E0B' : '2px solid transparent',
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <TabIcon
                    size={16}
                    color={active ? '#FDE68A' : 'rgba(255,255,255,0.8)'}
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
                        background: posCart.length > 0 ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
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
                        background: '#F59E0B',
                        color: '#fff',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
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
                        color: 'rgba(255,255,255,0.75)',
                        borderRadius: 999,
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
      <div className="pos-content" style={{ padding: '16px 20px', background: 'var(--bg-page)', width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 200px)' }}>

      {tab === 'retail-walkin' && !showAudit && (
        <div style={{ background: 'var(--bg-page)', minHeight: '60vh' }}>
          {!showCart ? (
              <>
                {/* Products toolbar */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'var(--sage-light)', borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={15} color="var(--primary)" strokeWidth={2} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--header)' }}>{products.length} Products</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="btn-3d"
                      style={{ fontSize: 12, padding: '9px 16px' }}
                    >
                      <Package size={14} />
                      Import from Store
                    </button>
                  </div>
                </div>

                <div style={{ padding: '16px 0' }}>
                  <div className="pos-grid">
                  {/* Product Grid */}
                  {(() => {
                    const visibleProducts = products.filter(i => {
                      if (!isManager && i.is_active === false) return false;
                      if (navSearch && !(i.name && i.name.toLowerCase().includes(navSearch.toLowerCase()))) return false;
                      return true;
                    });

                    if (visibleProducts.length === 0) {
                      return (
                        <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', background: 'white', border: '1px dashed #D1D5DB', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Package size={26} color="var(--primary)" />
                          </div>
                          <h3 style={{ margin: '0 0 8px', color: 'var(--header)', fontSize: 17, fontWeight: 700 }}>No Retail Products Found</h3>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, maxWidth: 380, lineHeight: 1.5 }}>
                            {navSearch ? `No products match "${navSearch}".` : 'Import products from the General Store to start selling.'}
                          </p>
                        </div>
                      );
                    }

                    return visibleProducts.map((item, idx) => {
                      const inCart = posCart.find(c => c.id === item.id);
                      const stockVal = item.stock !== undefined ? item.stock : (item.quantity || 0);
                      const stockLabel = stockVal <= 0 ? 'oos' : stockVal <= (item.reorder_level || 10) ? 'low' : 'normal';
                      const stockText = stockVal <= 0 ? 'Out of Stock' : stockVal <= (item.reorder_level || 10) ? `${stockVal} Low Stock` : `${stockVal} In Stock`;
                      const priceVal = item.price || item.selling_price || item.unit_price || 0;
                      const imgSrc = (url) => !url ? null : (url.startsWith('http') ? url : 'http://localhost:5000' + url);

                      return (
                        <div key={item.id} className="rsp-card" style={{ animationDelay: idx * 0.03 + 's', opacity: item.is_active === false ? 0.55 : 1, position: 'relative' }}>
                          {isManager && item.is_active === false && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, background: 'var(--danger)', color: 'white', textAlign: 'center', fontSize: 10, fontWeight: 900, letterSpacing: '.08em', padding: '3px 0', textTransform: 'uppercase' }}>
                              🔒 Hidden from Public
                            </div>
                          )}
                          <div className="rsp-card-img-wrap">
                            {(() => {
                              const imgs = [item.product_image, item.cover_image].filter(Boolean);
                              const uniqueImgs = [...new Set(imgs)];
                              if (uniqueImgs.length === 0) return <Package size={40} color="#BDBDBD" />;
                              return <img src={imgSrc(uniqueImgs[0])} className="rsp-card-img" alt={item.name} />;
                            })()}
                            {stockVal <= 0 && <div className="rsp-card-oos">Out of Stock</div>}
                          </div>
                          <div className="rsp-card-body">
                            <h3 className="rsp-card-name">{item.name}</h3>
                            <span className={`rsp-stock-badge rsp-stock-${stockLabel}`}>
                              📦 {stockText}
                            </span>
                            {item.description && (
                              <p className="rsp-card-desc">{item.description}</p>
                            )}
                            <div className="rsp-card-footer">
                              <div className="rsp-price">{parseFloat(priceVal).toLocaleString()} ETB</div>
                              <button
                                type="button"
                                className={`rsp-add-btn${inCart ? ' in-cart' : ''}`}
                                disabled={stockVal <= 0}
                                onClick={(e) => { e.stopPropagation(); addToCart({...item, price: priceVal, stock: stockVal}); }}
                              >
                                <ShoppingCart size={12} />
                                {inCart ? `${inCart.qty}×` : 'Add'}
                              </button>
                            </div>
                            {isManager && (
                              <div className="rsp-card-actions">
                                <span className="rsp-card-cat">
                                  {item.category || 'Uncategorized'}
                                </span>
                                <div className="rsp-actions-btns">
                                  <button type="button" className="rsp-icon-btn hide" onClick={(e) => { e.stopPropagation(); handleToggleHide(item); }}
                                    title={item.is_active === false ? 'Show' : 'Hide'}>
                                    {item.is_active === false ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button type="button" className="rsp-icon-btn" onClick={(e) => { e.stopPropagation(); setEditingProduct({...item, price: priceVal, stock: stockVal}); }}
                                    title="Edit">
                                    <Edit3 size={13} />
                                  </button>
                                  <button type="button" className="rsp-icon-btn danger" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }}
                                    title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  </div>
                </div>

              </>
          ) : (
            /* ══════════════ CART & CHECKOUT ══════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeUp 0.2s ease' }}>

               {/* Cart top bar */}
               <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--sage-light)', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <ShoppingCart size={18} color="var(--primary)" />
                   </div>
                   <div>
                     <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--header)', letterSpacing: '0.01em' }}>Cart & Checkout</div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{posCart.length} item{posCart.length !== 1 ? 's' : ''} · {posCartTotal.toLocaleString()} ETB total</div>
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* WAITING button — always visible */}
                    <button
                      onClick={() => { setShowPendingDrawer(true); loadPendingQueue(); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: pendingQueue.some(q => q.status === 'pending') ? '#F59E0B' : pendingQueue.some(q => q.status === 'approved') ? '#16A34A' : '#F3F4F6',
                        color: pendingQueue.length === 0 ? '#4B5563' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s',
                        animation: pendingQueue.some(q => q.status === 'pending') ? 'pulse 2s infinite' : 'none',
                      }}
                    >
                      ⏳ Waiting ({pendingQueue.length})
                    </button>
                   <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }}
                     style={{ padding: '9px 16px', height: 36, borderRadius: 8, background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                     ← Back to Products
                   </button>
                 </div>
               </div>

               {/* ── Online Order Banner ── */}
               {activeOnlineOrder && (
                 <div style={{
                   background: '#EFF6FF',
                   border: '1px solid #BFDBFE',
                   borderRadius: 10,
                   padding: '16px 20px',
                   marginBottom: 16,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   gap: 20,
                   boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                   flexWrap: 'wrap',
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                     <div style={{
                       width: 44, height: 44, borderRadius: 8,
                       background: 'var(--primary)',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       fontSize: 20, flexShrink: 0
                     }}>📦</div>
                     <div>
                       <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                         🌐 Online Order — Auto-Filled
                       </div>
                       <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                         {activeOnlineOrder.sale_code || `Order #${activeOnlineOrder.id}`}
                       </div>
                       <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                         👤 {activeOnlineOrder.customer_name || 'Guest'} &nbsp;·&nbsp; 📱 {activeOnlineOrder.customer_phone || '—'}
                       </div>
                     </div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total</div>
                     <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                       {parseFloat(activeOnlineOrder.total_amount || 0).toFixed(2)} ETB
                     </div>
                     <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>All fields pre-filled ✓</div>
                   </div>
                 </div>
               )}

                   {posStep === 1 || posStep === 2 || posStep === 3 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* ── Cart Items Table ── */}
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div style={{ padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--header)', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ShoppingCart size={15} /> Cart Items ({posCart.length})
                        </span>
                        {posCart.length > 0 && (
                          <button onClick={() => setPosCart([])}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '5px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6, transition: 'background 0.15s' }}>
                            <X size={13}/> Clear All
                          </button>
                        )}
                      </div>

                      {posCart.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <ShoppingCart size={32} color="#D1D5DB" style={{ marginBottom: 10 }} />
                          <div style={{ fontSize: 14, fontWeight: 600 }}>Your cart is empty</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>Go back to products to add items</div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                          {posCart.map((item, ci) => (
                            <div key={item.id} className="cart-item-row">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{parseFloat(item.price).toLocaleString()} ETB / unit</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                {/* Qty controls */}
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                                  <button onClick={() => updateQty(item.id, item.qty - 1)}
                                    style={{ width: 32, height: 34, border: 'none', background: '#F3F4F6', color: 'var(--header)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, transition: 'background 0.15s' }}>
                                    <Minus size={12}/>
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={e => {
                                      const v = parseInt(e.target.value, 10);
                                      if (!isNaN(v) && v > 0) updateQty(item.id, v);
                                    }}
                                    onBlur={e => {
                                      const v = parseInt(e.target.value, 10);
                                      if (isNaN(v) || v < 1) updateQty(item.id, 1);
                                    }}
                                    style={{ width: 46, height: 34, border: 'none', textAlign: 'center', fontWeight: 700, fontSize: 14, color: 'var(--text-main)', background: 'white', outline: 'none', padding: 0 }}
                                  />
                                  <button onClick={() => updateQty(item.id, item.qty + 1)}
                                    style={{ width: 32, height: 34, border: 'none', background: '#F3F4F6', color: 'var(--header)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, transition: 'background 0.15s' }}>
                                    <Plus size={12}/>
                                  </button>
                                </div>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', width: 96, textAlign: 'right', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{(item.price * item.qty).toLocaleString()} ETB</div>
                                <button onClick={() => setPosCart(posCart.filter(c => c.id !== item.id))}
                                  style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--danger-light)', border: '1px solid #FECACA', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cart Total Bar */}
                      {posCart.length > 0 && (
                        <div style={{ padding: '12px 16px', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{posCart.length} item{posCart.length !== 1 ? 's' : ''}</span>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--header)', fontVariantNumeric: 'tabular-nums' }}>
                            Total: <span style={{ color: 'var(--primary)' }}>{posCartTotal.toLocaleString()} ETB</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Payment Section ── */}
                    {posCart.length > 0 && (
                      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                        {/* Payment Method Selection with flow labels */}
                        <div>
                          <span className="sect-lbl">💳 Select Payment Method</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                              { value: 'CASH', label: 'Cash', icon: '💵', route: '→ Store Direct', routeColor: '#1D4ED8' },
                              { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', route: '→ Finance First', routeColor: '#1565C0' },
                              { value: 'TELBIR', label: 'Telebirr', icon: '📱', route: '→ Finance First', routeColor: '#7B1FA2' },
                            ].map((pm, idx) => (
                              <button
                                key={pm.value}
                                type="button"
                                onClick={() => setPosPaymentMethod(pm.value)}
                                className={`pay-method${posPaymentMethod === pm.value ? ' active' : ''}`}
                                style={{
                                  flex: 1, minWidth: 110,
                                  background: posPaymentMethod === pm.value
                                    ? (pm.value === 'CASH' ? '#EFF6FF' : pm.value === 'BANK_TRANSFER' ? '#E3F2FD' : '#F3E5F5')
                                    : 'white',
                                  border: posPaymentMethod === pm.value
                                    ? `1.5px solid ${pm.value === 'CASH' ? '#2563EB' : pm.value === 'BANK_TRANSFER' ? '#1565C0' : '#7B1FA2'}`
                                    : '1px solid #D1D5DB',
                                  boxShadow: posPaymentMethod === pm.value ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
                                }}
                              >
                                <span style={{ fontSize: 20 }}>{pm.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: 13, color: posPaymentMethod === pm.value ? pm.routeColor : '#374151' }}>{pm.label}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: pm.routeColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{pm.route}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── CASH FLOW ── */}
                        {posPaymentMethod === 'CASH' && (
                          <div>
                            {/* Info banner */}
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 16 }}>💵</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Cash Flow: Direct to Store</div>
                                <div style={{ fontSize: 11, color: '#374151' }}>Sales Manager signs → Request goes directly to Store Keeper for release → Cash sale recorded in transactions</div>
                              </div>
                            </div>
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                <div>
                                  <label className="field-lbl">Amount Received (ETB) *</label>
                                  <input className="nature-input" type="number" step="0.01" min="0" value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)} placeholder={posCartTotal.toFixed(2)} />
                                </div>
                                <div>
                                  <label className="field-lbl">Recipient Name *</label>
                                  <input className="nature-input" type="text" value={cashRecipientName}
                                    onChange={e => setCashRecipientName(e.target.value)}
                                    placeholder="Full name" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── BANK TRANSFER FLOW ── */}
                        {posPaymentMethod === 'BANK_TRANSFER' && (
                          <div>
                            {/* Info banner */}
                            <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 16 }}>🏦</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Bank Transfer Flow: Finance Verification Required</div>
                                <div style={{ fontSize: 11, color: '#374151' }}>Submit → Finance verifies bank transfer → Writes to Receivable Book → Sends to Store → Store releases → Audit record only (not in cash transactions)</div>
                              </div>
                            </div>
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                <div>
                                  <label className="field-lbl">Amount (ETB) *</label>
                                  <input className="nature-input" type="number" step="0.01" min="0" value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)} />
                                </div>
                                <div>
                                  <label className="field-lbl">Select Finance Account</label>
                                  <select className="nature-input" onChange={(e) => {
                                    const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                    if (acc) { setBankName(acc.bank_provider || ''); setAccountHolder(acc.account_name || ''); setAccountNumber(acc.account_number || ''); }
                                  }}>
                                    <option value="">— Select —</option>
                                    {financeAccounts.filter(a => a.account_type === 'Bank').map(a => (
                                      <option key={a.id} value={a.id}>{a.account_name} ({a.bank_provider})</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="field-lbl">Bank Name *</label>
                                  <input className="nature-input" type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. CBE" />
                                </div>
                                <div>
                                  <label className="field-lbl">Account Holder *</label>
                                  <input className="nature-input" type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Full name" />
                                </div>
                                <div>
                                  <label className="field-lbl">Account Number *</label>
                                  <input className="nature-input" type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account No." />
                                </div>
                                <div>
                                  <label className="field-lbl">Transaction ID / Reference *</label>
                                  <input className="nature-input" type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Bank Ref ID" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label className="field-lbl">Payment Proof Screenshot (Recommended)</label>
                                  <input className="nature-input" type="file" accept="image/*"
                                    onChange={e => setTxnScreenshot(e.target.files[0])}
                                    style={{ padding: '8px 12px', cursor: 'pointer' }} />
                                  {txnScreenshot && <div style={{ fontSize: 11, color: '#1565C0', marginTop: 4, fontWeight: 600 }}>✓ {txnScreenshot.name}</div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── TELEBIRR FLOW ── */}
                        {posPaymentMethod === 'TELBIR' && (
                          <div>
                            {/* Info banner */}
                            <div style={{ background: '#F3E5F5', border: '1px solid #CE93D8', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 16 }}>📱</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#7B1FA2', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Telebirr Flow: Finance Verification Required</div>
                                <div style={{ fontSize: 11, color: '#374151' }}>Submit → Finance verifies Telebirr transfer → Writes to Receivable Book → Sends to Store → Store releases → Audit record only (not in cash transactions)</div>
                              </div>
                            </div>
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                <div>
                                  <label className="field-lbl">Amount (ETB) *</label>
                                  <input className="nature-input" type="number" step="0.01" min="0" value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)} />
                                </div>
                                <div>
                                  <label className="field-lbl">Select Telebirr Account</label>
                                  <select className="nature-input" onChange={(e) => {
                                    const acc = financeAccounts.find(a => String(a.id) === String(e.target.value));
                                    if (acc) { setTelbirNumber(acc.account_number || ''); setPayerName(acc.account_name || ''); }
                                  }}>
                                    <option value="">— Select —</option>
                                    {financeAccounts.filter(a => a.bank_provider === 'telebirr' || a.account_type === 'Mobile Wallet').map(a => (
                                      <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="field-lbl">Telebirr Number *</label>
                                  <input className="nature-input" type="text" value={telbirNumber} onChange={e => setTelbirNumber(e.target.value)} placeholder="09XXXXXXXX" />
                                </div>
                                <div>
                                  <label className="field-lbl">Sender Full Name *</label>
                                  <input className="nature-input" type="text" value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Sender name" />
                                </div>
                                <div>
                                  <label className="field-lbl">Transaction ID / Reference *</label>
                                  <input className="nature-input" type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Telebirr Ref ID" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label className="field-lbl">Payment Screenshot (Recommended)</label>
                                  <input className="nature-input" type="file" accept="image/*"
                                    onChange={e => setTxnScreenshot(e.target.files[0])}
                                    style={{ padding: '8px 12px', cursor: 'pointer' }} />
                                  {txnScreenshot && <div style={{ fontSize: 11, color: '#7B1FA2', marginTop: 4, fontWeight: 600 }}>✓ {txnScreenshot.name}</div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Payment Confirmation Checkbox — only for CASH */}
                        {posPaymentMethod === 'CASH' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: paymentStatus === 'PAID' ? '#EFF6FF' : '#FEF3C7', border: `1px solid ${paymentStatus === 'PAID' ? '#BFDBFE' : '#FCD34D'}` }}>
                            <input
                              type="checkbox"
                              id="paidCheckboxPOS"
                              checked={paymentStatus === 'PAID'}
                              onChange={e => setPaymentStatus(e.target.checked ? 'PAID' : 'PENDING')}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                            />
                            <label htmlFor="paidCheckboxPOS" style={{ fontWeight: 600, fontSize: 14, color: paymentStatus === 'PAID' ? 'var(--header)' : '#92400E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                              <CheckCircle size={16} color={paymentStatus === 'PAID' ? 'var(--primary)' : '#F59E0B'} />
                              {paymentStatus === 'PAID' ? 'Cash Received & Confirmed' : 'Confirm Cash Received'}
                            </label>
                          </div>
                        )}

                        {/* For Bank/Telebirr — auto-confirm checkbox */}
                        {(posPaymentMethod === 'BANK_TRANSFER' || posPaymentMethod === 'TELBIR') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: '#E3F2FD', border: '1px solid #90CAF9' }}>
                            <input
                              type="checkbox"
                              id="digitalPayConfirm"
                              checked={paymentStatus === 'PAID'}
                              onChange={e => setPaymentStatus(e.target.checked ? 'PAID' : 'PENDING')}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: posPaymentMethod === 'TELBIR' ? '#7B1FA2' : '#1565C0', flexShrink: 0 }}
                            />
                            <label htmlFor="digitalPayConfirm" style={{ fontWeight: 600, fontSize: 14, color: '#1565C0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                              <CheckCircle size={16} color={paymentStatus === 'PAID' ? '#1565C0' : '#F59E0B'} />
                              {paymentStatus === 'PAID' ? 'Payment details confirmed — ready to submit for Finance' : 'Confirm payment details are correct'}
                            </label>
                          </div>
                        )}

                        {/* Signature — CASH only */}
                        {posPaymentMethod === 'CASH' && (
                          <div>
                            <span className="sect-lbl">✍️ Sales Manager Signature (Required for Cash)</span>
                            <div style={{ fontSize: 11, color: 'var(--earth)', marginBottom: 8 }}>
                              By signing, you authorize release of the following items from the General Store.
                            </div>
                            <div className={`sig-area${cartSignature ? ' signed' : ''}`}>
                              <SignatureCanvas onSignatureChange={setCartSignature} />
                            </div>
                            {cartSignature && (
                              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={12} /> Signature captured successfully
                              </div>
                            )}
                            <div style={{ marginTop: 14 }}>
                              <label className="field-lbl">Notes for Store Keeper (Optional)</label>
                              <textarea
                                className="nature-input"
                                value={cartNotes}
                                onChange={e => setCartNotes(e.target.value)}
                                rows={2}
                                placeholder="Special delivery instructions or notes..."
                                style={{ resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* ── Submit Button ── */}
                        {posPaymentMethod && (
                          <button
                            type="button"
                            disabled={loading || !paymentStatus || (posPaymentMethod === 'CASH' && !cartSignature)}
                            onClick={handleProcessPayment}
                            style={{
                              width: '100%',
                              padding: '14px 24px',
                              minHeight: 48,
                              background: posPaymentMethod === 'CASH'
                                ? 'var(--primary)'
                                : posPaymentMethod === 'BANK_TRANSFER' ? '#1565C0' : '#7B1FA2',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: (loading || !paymentStatus || (posPaymentMethod === 'CASH' && !cartSignature)) ? 0.55 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              transition: 'all 0.15s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                          >
                            {loading ? (
                              <><SegmentedSpinner size={18} /> Processing...</>
                            ) : posPaymentMethod === 'CASH' ? (
                              <><Package size={18} /> Send to Store (Cash) — {posCartTotal > 0 ? posCartTotal.toLocaleString() : '0'} ETB</>
                            ) : posPaymentMethod === 'BANK_TRANSFER' ? (
                              <><CreditCard size={18} /> Submit to Finance for Bank Verification — {posCartTotal > 0 ? posCartTotal.toLocaleString() : '0'} ETB</>
                            ) : (
                              <><Smartphone size={18} /> Submit to Finance for Telebirr Verification — {posCartTotal > 0 ? posCartTotal.toLocaleString() : '0'} ETB</>
                            )}
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                ) : posStep === 5 ? (
                  /* ── WAITING FOR STORE APPROVAL ── */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: 400 }}>
                    
                    {storeRequestStatus === 'rejected' ? (
                      /* REJECTED */
                      <>
                        <div style={{ width: 72, height: 72, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid #FECACA' }}>
                          <X size={40} color="#DC2626" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.01em' }}>Store Rejected</h3>
                        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 16, textAlign: 'center', maxWidth: 360 }}>
                          The store has rejected this request.
                        </p>
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 20px', marginBottom: 24, width: '100%', maxWidth: 400 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C', marginBottom: 4, textTransform: 'uppercase' }}>Rejection Reason</div>
                          <div style={{ fontSize: 13, color: '#7F1D1D' }}>{storeRejectReason}</div>
                        </div>
                        <button onClick={() => {
                          setPosStep(3);
                          setStoreRequestStatus(null);
                          setStoreRequestId(null);
                          setStoreRejectReason('');
                        }} style={{ padding: '12px 32px', minHeight: 44, borderRadius: 8, background: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                          Edit & Resubmit
                        </button>
                      </>
                    ) : storeRequestStatus === 'approved' ? (
                      /* APPROVED — transitioning */
                      <>
                        <div style={{ width: 72, height: 72, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid #BFDBFE', animation: 'pulse 1s infinite' }}>
                          <CheckCircle size={40} color="var(--primary)" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: 'var(--header)' }}>Store Approved!</h3>
                        <p style={{ color: '#6B7280', fontSize: 13 }}>Finalizing transaction...</p>
                      </>
                    ) : (
                      /* PENDING */
                      <>
                        {/* Animated waiting indicator */}
                        <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
                          <SegmentedSpinner size={24} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={28} color="var(--primary)" />
                          </div>
                        </div>
                        
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--header)', letterSpacing: '0.01em' }}>Waiting for Store Approval</h3>
                        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24, textAlign: 'center', maxWidth: 340 }}>
                          Your cart has been sent to the store. This page will update automatically when the store approves or rejects the request.
                        </p>

                        {/* Cart summary — locked/read-only */}
                        <div style={{ width: '100%', maxWidth: 480, border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', marginBottom: 20, overflow: 'hidden' }}>
                          <div style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🛒 Cart — Pending Release</span>
                            <span style={{ background: '#F59E0B', color: 'white', padding: '2px 10px', fontSize: 11, fontWeight: 600, borderRadius: 999 }}>PENDING</span>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F3F4F6' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Item</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Qty</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {posCart.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 600 }}>{item.name}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.qty}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{(item.price * item.qty).toLocaleString()} ETB</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                                <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--header)', fontSize: 13 }}>Total</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{posCartTotal.toLocaleString()} ETB</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 480 }}>
                          <button
                            onClick={async () => {
                              // Manual refresh to check status now
                              if (storeRequestId) {
                                try {
                                  const res = await apiClient.get(`/pos/cart/store-request/${storeRequestId}`);
                                  const status = res?.data?.status || res?.status_text;
                                  if (status === 'approved') {
                                    setStoreRequestStatus('approved');
                                    showToast('✅ Store approved! Finalizing...', 'success');
                                    if (storePollingRef.current) clearInterval(storePollingRef.current);
                                    setTimeout(() => finalizeCashSale(), 1500);
                                  } else if (status === 'rejected') {
                                    setStoreRequestStatus('rejected');
                                    setStoreRejectReason(res?.data?.reject_reason || 'No reason provided');
                                    if (storePollingRef.current) clearInterval(storePollingRef.current);
                                  } else {
                                    showToast('Still waiting for store approval...', 'info');
                                  }
                                } catch(e) { showToast('Could not check status', 'error'); }
                              }
                            }}
                            style={{ flex: 1, minHeight: 44, padding: '12px 0', borderRadius: 8, background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                          >
                            <RefreshCw size={14} /> Check Status
                          </button>
                          <button
                            onClick={() => {
                              if (storePollingRef.current) clearInterval(storePollingRef.current);
                              setPosStep(3);
                              setStoreRequestStatus(null);
                              setStoreRequestId(null);
                            }}
                            style={{ flex: 1, minHeight: 44, padding: '12px 0', borderRadius: 8, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                          >
                            ↩ Cancel & Go Back
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                ) : posStep === 4 ? (
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                     <div style={{ width: 72, height: 72, borderRadius: 10, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid #BFDBFE' }}>
                       <CheckCircle size={40} color="var(--primary)" />
                     </div>
                     <h3 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 700, color: 'var(--header)', letterSpacing: '0.01em' }}>Transaction Complete!</h3>
                     <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Inventory updated. CRV and Model 22 generated.</p>
                     {completedSale && (
                       <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '16px 28px', marginBottom: 24, width: '100%', maxWidth: 420 }}>
                         <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15, marginBottom: 6 }}>Receipt: {completedSale.invoice_number}</div>
                         <div style={{ fontSize: 13, color: 'var(--text-main)' }}>Customer: <strong>{completedSale.recipient_name || 'Walk-In'}</strong></div>
                         <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--header)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>Total: {(completedSale.total_amount || 0).toLocaleString()} ETB</div>
                       </div>
                     )}
                     <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 420, marginBottom: 12 }}>
                       <button type='button' onClick={printReceipt}
                         style={{ flex: 1, minHeight: 44, padding: '12px 0', borderRadius: 8, background: '#1565C0', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                         <Printer size={16} /> Print Receipt
                       </button>
                       <button type='button' onClick={() => { setTab('list'); setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); }}
                         style={{ flex: 1, minHeight: 44, padding: '12px 0', borderRadius: 8, background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                         <List size={16} /> View Sales
                       </button>
                     </div>
                     <button type='button'
                       onClick={() => { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); setCompletedSale(null); resetForm(); }}
                       style={{ width: '100%', maxWidth: 420, minHeight: 44, padding: '12px 0', borderRadius: 8, background: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: 14, letterSpacing: '0.01em', transition: 'all 0.15s' }}
                     >🔄 Start New Transaction</button>
                   </div>
                ) : null}
            </div>
          )}
        </div>
      )}

      {/* SALES LIST TAB */}
      {tab === 'list' && !showAudit && (
        <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
             <div>
               <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                 <List size={22} color="var(--primary)" /> Unsubmitted Sales
               </h2>
               <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Sales waiting to be submitted to Finance for the audit log.</p>
             </div>
             {sales.length > 0 && (
               <button
                 onClick={() => setShowSubmitConfirm(true)}
                 style={{
                   minHeight: 44, padding: '10px 20px', background: 'var(--primary)',
                   color: 'white', border: '1px solid var(--primary)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                 }}
               >
                 <CheckCircle size={18} /> Submit to Finance ({sales.length})
               </button>
             )}
          </div>
          
          <div style={{ padding: '20px 24px' }}>
             {sales.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 24px', background: '#FAFAFA', borderRadius: 10 }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontWeight: 700, color: '#1E293B', marginBottom: 8, fontSize: 19 }}>All Caught Up!</h3>
                  <p style={{ color: '#6B7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                    There are no unsubmitted sales. Any completed sales have already been moved to the Audit Log.
                  </p>
               </div>
             ) : (
               <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800, background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        <th style={{...thStyle, color: '#6B7280'}}>Receipt No</th>
                        <th style={{...thStyle, color: '#6B7280'}}>Date</th>
                        <th style={{...thStyle, color: '#6B7280'}}>Type</th>
                        <th style={{...thStyle, color: '#6B7280'}}>Customer</th>
                        <th style={{...thStyle, color: '#6B7280'}}>Cashier</th>
                        <th style={{...thStyle, color: '#6B7280'}}>Payment</th>
                        <th style={{...thStyle, color: '#6B7280', textAlign: 'right'}}>Total Amount</th>
                        <th style={{...thStyle, color: '#6B7280', textAlign: 'center'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => {
                        const dateStr = sale.sale_date ? new Date(sale.sale_date).toLocaleString() : 'N/A';
                        
                        return (
                        <tr key={sale.id} style={{ background: '#FFFFFF', transition: 'background 0.15s' }}>
                           <td style={tdStyle}><strong style={{ color: '#111827', fontWeight: 700 }}>{sale.invoice_number || `REC-${sale.id}`}</strong></td>
                           <td style={{...tdStyle, color: '#475569'}}>{dateStr}</td>
                           <td style={tdStyle}>
                             <span style={{
                               background: sale.sale_type === 'ONLINE' ? '#F3E8FF' : '#DBEAFE',
                               color: sale.sale_type === 'ONLINE' ? '#7E22CE' : '#1D4ED8',
                               padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
                             }}>
                               {sale.sale_type === 'ONLINE' ? <><Smartphone size={12}/> ONLINE</> : <><ShoppingCart size={12}/> WALK-IN</>}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <div style={{ fontWeight: 600, color: '#374151' }}>{sale.customer_name || 'Walk-in Customer'}</div>
                             {sale.customer_phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sale.customer_phone}</div>}
                           </td>
                           <td style={tdStyle}>
                             <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: '#4B5563', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                               <User size={12} /> {sale.cashier_name || 'Retail Staff'}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{
                               background: '#F9FAFB', color: '#374151', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                             }}>
                               {sale.payment_method_name || 'CASH'}
                             </span>
                           </td>
                           <td style={{...tdStyle, textAlign: 'right'}}>
                             <strong style={{ color: 'var(--primary)', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(sale.total_amount || 0).toLocaleString()} ETB</strong>
                           </td>
                           <td style={{...tdStyle, textAlign: 'center'}}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  onClick={() => viewSaleDetail(sale)}
                                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.15s' }}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleVoidSaleInit(sale)}
                                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.15s' }}
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
               <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', flexWrap: 'wrap', gap: 12 }}>
                 <div style={{ fontSize: 13, color: '#6B7280' }}>
                    <strong style={{ color: '#111827' }}>{sales.length}</strong> transactions · <strong style={{ color: 'var(--primary)' }}>{sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB</strong> total
                 </div>
                 <button 
                   onClick={() => setShowSubmitConfirm(true)}
                   disabled={loading}
                   style={{
                     minHeight: 44, padding: '10px 20px', background: 'var(--primary)',
                     color: 'white', border: '1px solid var(--primary)', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                     fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
                     transition: 'all 0.15s', opacity: loading ? 0.7 : 1
                   }}
                 >
                   <CheckCircle size={18} />
                   <span style={{ fontSize: 13, fontWeight: 600 }}>
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
        <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>📦 Pending Online Orders</h2>
              <button onClick={loadPendingOrders} disabled={loadingPendingOrders} style={{ minHeight: 36, padding: '8px 16px', background: '#F3F4F6', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', fontWeight: 600, color: '#4B5563', transition: 'all 0.15s' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {pendingOrders.map(order => (
                  <div key={order.id} style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', padding: 16, transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 15, fontFamily: 'monospace' }}>{order.sale_code || `ORD-${order.id}`}</span>
                      <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, }}>ONLINE</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      👤 <strong>{order.customer_name || 'Guest Customer'}</strong>
                      {order.customer_phone && <span style={{ color: '#6b7280', marginLeft: 6 }}>· {order.customer_phone}</span>}
                    </div>
                    {order.order_ref && (
                      <div style={{ fontSize: 12, color: '#7c3aed', marginBottom: 8 }}>📋 Rx: {order.order_ref}</div>
                    )}
                    <div style={{ marginBottom: 12, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px' }}>
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
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{parseFloat(order.total_amount).toFixed(2)} ETB</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => setDeleteTarget(order.id)} 
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}
                          title="Delete Order Permanently"
                        >
                          🗑️
                        </button>
                        <button 
                          onClick={() => processOnlineOrder(order)} 
                          style={{ background: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}
                        >
                          Process Payment →
                        </button>
                      </div>
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

        const AUDIT_PERIOD_LABELS = { day:'Day', week:'Week', month:'Month', quarter:'Quarter', year:'Year' };
        const AUDIT_PERIOD_FULL   = { day:'Today', week:'This Week', month:'This Month', quarter:'This Quarter', year:'This Year' };
        return (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                📜 Retail Audit Trail
                <span style={{ fontSize: 12, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 10px', borderRadius: 999 }}>
                  {auditTrail.length} records &mdash; {AUDIT_PERIOD_FULL[auditPeriod]}
                </span>
              </h2>
              <button onClick={() => setShowAudit(false)} style={{ minHeight: 32, padding: '6px 16px', background: 'white', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid #E5E7EB', transition: 'all 0.15s' }}>
                ✕ Close
              </button>
            </div>

            {/* ── Period Filter Bar — above records ───────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 20px', borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB', flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 6 }}>Filter:</span>
              {Object.entries(AUDIT_PERIOD_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setAuditPeriod(key); loadAuditTrail(key); }}
                  style={{
                    minHeight: 32, padding: '6px 16px', fontSize: 11, fontWeight: 700, border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.03em',
                    background: auditPeriod === key ? 'var(--primary)' : '#fff',
                    color:      auditPeriod === key ? '#fff'    : '#374151',
                    transition: 'all .15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Records */}
            <div style={{ padding: '16px 20px' }}>
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
                  <div key={day} style={{ marginBottom: 24 }}>
                    {/* Date Group Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: 4 }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{day}</span>
                        <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 999 }}>
                          {txCount} transaction{txCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Accumulated Total</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{dayTotal.toFixed(2)} ETB</div>
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
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Eye size={16} color="var(--primary)" /> Sale Detail — {detail.invoice_number || `#${detail.id}`}
            </h3>
            <button className="btn-3d" onClick={() => setTab('list')}>← Back to List</button>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Top summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Invoice', value: detail.invoice_number || `#${detail.id}` },
                { label: 'Sale Type', value: (detail.sale_type || '—').replace('_', ' ').toUpperCase() },
                { label: 'Cashier', value: detail.cashier_name || '—' },
                { label: 'Total Amount', value: `${parseFloat(detail.total_amount || 0).toFixed(2)} ETB`, green: true },
              ].map((card, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: card.green ? 'var(--primary)' : '#111827', wordBreak: 'break-all', fontVariantNumeric: card.green ? 'tabular-nums' : 'normal' }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment + Recipient */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Recipient */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <User size={14} color="var(--primary)" /> Recipient / Customer
                </h4>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {detail.customer_name || (detail.notes && detail.notes.match(/Recipient: ([^|]+)/)?.[1]?.trim()) || 'Walk-In Customer'}
                </div>
                <div style={{ fontSize: 12, color: '#374151' }}>
                  {detail.customer_phone || ''}
                </div>
                {detail.notes && detail.notes.includes('Recipient:') && (
                  <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                    {detail.notes}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <DollarSign size={14} color="#2563EB" /> Payment Info
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 13, color: '#111827' }}>
                    <strong>Method:</strong> {detail.payment_method_name || '—'}
                  </div>
                  <div style={{ fontSize: 13, color: '#111827' }}>
                    <strong>Amount Paid:</strong> {parseFloat(detail.amount_paid || detail.total_amount || 0).toFixed(2)} ETB
                  </div>
                  {detail.payment_reference && (
                    <div style={{ fontSize: 12, color: '#374151' }}>
                      <strong>Ref / TxnID:</strong> {detail.payment_reference}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      background: detail.status_name === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                      color: detail.status_name === 'Completed' ? '#166534' : '#92400E',
                      padding: '2px 10px', fontSize: 11, fontWeight: 600, borderRadius: 999
                    }}>{detail.status_name || 'Completed'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#111827' }}>Items Purchased</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Product</th>
                    <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Qty</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Unit Price</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#6B7280', fontSize: 12 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items && detail.items.length > 0) ? detail.items.map((it, idx) => {
                    const qty = parseFloat(it.quantity) || 0;
                    const price = parseFloat(it.unit_price) || 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6', background: '#FFFFFF' }}>
                        <td style={{ padding: '10px 0', color: '#111827', fontWeight: 500 }}>{it.product_name || `Product #${it.product_id}`}</td>
                        <td style={{ padding: '10px 0', textAlign: 'center', color: '#4B5563' }}>{qty}</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#4B5563' }}>{price.toFixed(2)} ETB</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{(qty * price).toFixed(2)} ETB</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#9ca3af' }}>No items found</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                    <td colSpan={3} style={{ padding: '10px 0', fontWeight: 700, color: '#111827', textAlign: 'right' }}>Grand Total</td>
                    <td style={{ padding: '10px 0', fontWeight: 700, color: 'var(--primary)', textAlign: 'right', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 12, maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={30} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Submit Daily Sales?</h3>
            <p style={{ color: '#4B5563', marginBottom: 8, fontSize: 14 }}>
              You are about to submit <strong style={{ color: '#111827' }}>{sales.length} transaction{sales.length !== 1 ? 's' : ''}</strong> totalling
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
              {sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toFixed(2)} ETB
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 24 }}>
              This will be recorded in the audit log and sent to the Sales Manager. The sales list will be cleared after submission.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
                style={{ flex: 1, minHeight: 44, padding: '12px 0', background: 'white', color: '#4B5563', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
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
                    await loadAuditTrail(auditPeriod);
                  } catch (err) {
                    setShowSubmitConfirm(false);
                    showToast(err.message || 'Failed to submit data', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ flex: 1, minHeight: 44, padding: '12px 0', background: 'var(--primary)', color: 'white', border: '1px solid var(--primary)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
              >
                <CheckCircle size={18} />
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 12, maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={30} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Delete Order?</h3>
            <p style={{ color: '#4B5563', marginBottom: 24, fontSize: 14 }}>
              Are you sure you want to completely delete this online order? It will be removed permanently from the customer page as well.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, minHeight: 44, padding: '12px 0', background: 'white', color: '#4B5563', border: '1px solid #E5E7EB', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteTarget)}
                style={{ flex: 1, minHeight: 44, padding: '12px 0', background: '#DC2626', color: 'white', border: '1px solid #DC2626', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
              >
                <Trash2 size={18} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Full Page Overlay */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: '#F5F6FA', zIndex: 9999, display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', height: '100%' }}>
          
          {/* Header */}
          <div style={{ background: 'var(--header)', color: '#FFFFFF', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 12, color: '#FFFFFF' }}>
                <Edit3 size={26} color="#FFFFFF" /> Update Retail Product
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Edit all product details. Form fields support sharp focus.</p>
            </div>
            <button onClick={() => setEditingProduct(null)} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
              <X size={22}/>
            </button>
          </div>
          
          {/* Body */}
          <div style={{ flex: 1, padding: '24px', width: '100%', boxSizing: 'border-box' }}>
            <form id="update-prod-form" onSubmit={handleUpdateProductSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 28, boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              
              {/* Column 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Product Name</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>SKU (Stock Keeping Unit)</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Category ID</label>
                  <input
                    type="text"
                    value={editingProduct.category_id || ''}
                    onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Description</label>
                  <textarea
                    rows={4}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', resize: 'vertical', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                
              </div>

              {/* Column 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Selling Price (ETB)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''}
                      onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Cost Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || ''}
                      onChange={e => setEditingProduct({...editingProduct, cost_price: e.target.value})}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Stock Quantity</label>
                    <input
                      disabled
                      type="number"
                      value={editingProduct.stock || ''}
                      title="Stock cannot be manually edited here. It is synced from the main store inventory."
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#F9FAFB', outline: 'none', cursor: 'not-allowed', color: '#9CA3AF', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Syncs from store inventory</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Reorder Level</label>
                    <input
                      required
                      type="number"
                      value={editingProduct.reorder_level || ''}
                      onChange={e => setEditingProduct({...editingProduct, reorder_level: e.target.value})}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={editingProduct.expiry_date ? editingProduct.expiry_date.split('T')[0] : ''}
                    onChange={e => setEditingProduct({...editingProduct, expiry_date: e.target.value})}
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>New Product Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditingProduct({...editingProduct, new_image: e.target.files[0]})}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: '#FFFFFF', outline: 'none', color: '#111827', boxSizing: 'border-box', cursor: 'pointer' }}
                    onFocus={(e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #D1D5DB'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div style={{ gridColumn: '1 / -1', marginTop: 16, paddingTop: 24, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ minHeight: 44, padding: '12px 28px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  style={{ minHeight: 44, padding: '12px 28px', border: '1px solid var(--primary)', borderRadius: 8, background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: 14, cursor: savingProduct ? 'not-allowed' : 'pointer', opacity: savingProduct ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                >
                  <CheckCircle size={18} />
                  {savingProduct ? 'Saving...' : 'Save Product Updates'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', border: 'none', width: 400, borderRadius: 12, padding: 0, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '14px 20px', background: 'var(--header)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><XCircle size={18} /> Void Transaction</h3>
              <button onClick={() => setShowVoidModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-main)', fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to void transaction <strong>{voidSaleTarget?.invoice_number || voidSaleTarget?.id}</strong>?
                <br/><br/>
                Stock will be returned. This action cannot be undone.
              </p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Reason for Voiding *</label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter void reason..."
                style={{ width: '100%', height: 80, padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setShowVoidModal(false)} style={{ flex: 1, minHeight: 44, padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#374151', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>Cancel</button>
                <button onClick={confirmVoidSale} disabled={loading} style={{ flex: 1, minHeight: 44, padding: 12, border: '1px solid #DC2626', borderRadius: 8, background: '#DC2626', color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.15s' }}>
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

      {/* ── DISMISS CONFIRMATION MODAL ── */}
      {dismissTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: '#FFFFFF', width: 440, maxWidth: '95vw',
            borderRadius: 12,
            border: '1px solid #FECACA',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ background: 'var(--danger)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Permanently Dismiss Queue?
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: '24px 24px 8px' }}>
              <p style={{ margin: '0 0 12px', color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
                You are about to <strong style={{ color: 'var(--danger)' }}>permanently delete</strong> this store request from{' '}
                <strong>both the Store queue and the Sales Manager queue</strong>.
              </p>
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Items to be deleted:
                </div>
                {(dismissTarget.items || []).map((it, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#374151', padding: '2px 0' }}>
                    • {it.name || it.product_name} × {it.qty || it.quantity}
                  </div>
                ))}
                {(!dismissTarget.items || dismissTarget.items.length === 0) && (
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    Cart: {dismissTarget.cart_code || dismissTarget.request_code || '#' + dismissTarget.id}
                  </div>
                )}
              </div>
              <p style={{ margin: '8px 0 20px', color: '#6B7280', fontSize: 12 }}>
                This action <strong>cannot be undone</strong>. The data will be completely removed from the database.
              </p>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', borderTop: '1px solid #FECACA' }}>
              <button
                onClick={() => setDismissTarget(null)}
                disabled={dismissing}
                style={{
                  flex: 1, padding: '16px', minHeight: 44, background: '#FFFFFF', color: '#374151',
                  border: 'none', borderRight: '1px solid #FECACA',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14, textTransform: 'uppercase',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDismissConfirm}
                disabled={dismissing}
                style={{
                  flex: 1, padding: '16px', minHeight: 44,
                  background: dismissing ? '#F87171' : 'var(--danger)',
                  color: '#FFFFFF', border: 'none',
                  cursor: dismissing ? 'not-allowed' : 'pointer',
                  fontWeight: 900, fontSize: 14, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {dismissing ? '⏳ Deleting...' : '🗑️ Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inputStyle = () => ({ width: '100%', padding: '10px 13px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#111827', fontFamily: 'inherit' });
const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderRight: '1px solid #E5E7EB' };
const tdStyle = { padding: '12px 16px', color: '#374151', borderBottom: '1px solid #E5E7EB' };
const tabBtn = (active) => ({
  background: active ? 'var(--primary)' : 'white',
  color: active ? 'white' : '#374151',
  border: active ? 'none' : '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 700 : 500,
});
