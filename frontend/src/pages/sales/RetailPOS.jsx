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
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 0,
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
    ctx.strokeStyle = '#1B5E20';
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
          border: `2px solid ${signed ? '#228B22' : '#8D6E63'}`,
          background: signed ? '#F0FFF0' : '#FAFFF8',
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
            background: '#fff', border: `1px solid #8D6E63`,
            padding: '3px 8px', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, color: '#8D6E63',
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

  const removeFromQueue = (id) => {
    setPendingQueue(prev => prev.filter(item => item.id !== id));
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
    // find item in posCart
    const existing = posCart.find(c => c.id === id);
    if (existing && newQty > 0 && newQty <= existing.stock) {
      setPosCart(posCart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
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
      addToPendingQueue({
        id: reqId,
        cart_code: cartCode,
        customer_name: (activeOnlineOrder ? activeOnlineOrder.customer_name : payerName) || 'Walk-in Customer',
        items: cartSnapshot,
        total: totalSnapshot,
        payment_method: posPaymentMethod,
        type: 'store',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        // Store snapshot of payment info for finalization
        payerName, payerPhone, paymentAmount, txnId, cartSignature, cartNotes,
        saleType,
      });

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
      addToPendingQueue({
        id: cartCode,
        cart_code: cartCode,
        customer_name: payload.customer_name,
        items: cartSnapshot,
        total: totalSnapshot,
        payment_method: posPaymentMethod,
        type: 'finance',
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });

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

  const finalizeCashSale = async () => {
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
          --primary: #228B22;
          --header: #1B5E20;
          --emerald: #2E8B57;
          --success: #4CAF50;
          --sage: #A5D6A7;
          --sage-light: #E8F5E9;
          --lime: #8BC34A;
          --accent: #87CEEB;
          --bg-main: #FFFFFF;
          --bg-page: #F1F8F1;
          --text-main: #424242;
          --text-muted: #757575;
          --earth: #8D6E63;
          --earth-light: #EFEBE9;
          --olive: #6B8E23;
          --mint: #F1FFF1;
          --danger: #C62828;
          --danger-light: #FFEBEE;
        }
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(34,139,34,0.4)} 50%{box-shadow:0 0 0 6px rgba(34,139,34,0)} }
        
        .btn-forest {
          background: var(--header);
          color: white;
          border: none;
          border-bottom: 4px solid #0d3d0d;
          padding: 11px 22px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: all 0.12s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-forest:hover:not(:disabled) {
          background: #153d15;
          transform: translateY(2px);
          border-bottom-width: 2px;
        }
        .btn-forest:active:not(:disabled) { transform: translateY(4px); border-bottom-width: 0; }
        .btn-forest:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .btn-3d {
          background: var(--emerald);
          color: white;
          border: none;
          border-bottom: 4px solid var(--header);
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          transition: all 0.12s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-3d:hover:not(:disabled) { background: var(--primary); transform: translateY(2px); border-bottom-width: 2px; }
        .btn-3d:active:not(:disabled) { transform: translateY(4px); border-bottom-width: 0; }
        .btn-3d:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-earth {
          background: white;
          color: var(--earth);
          border: 2px solid var(--earth);
          padding: 9px 18px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.12s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-earth:hover { background: var(--earth-light); }

        .btn-danger {
          background: var(--danger);
          color: white;
          border: none;
          border-bottom: 3px solid #8B0000;
          padding: 9px 18px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          transition: all 0.12s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-danger:hover { background: #B71C1C; transform: translateY(1px); border-bottom-width: 2px; }

        .rsp-card {
          background: white;
          overflow: hidden;
          border-left: 4px solid transparent;
          box-shadow: 0 2px 0 rgba(27,94,32,0.12), 0 1px 4px rgba(0,0,0,0.06);
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.3s ease both;
        }
        .rsp-card:hover {
          transform: translateY(-4px);
          border-left-color: var(--primary);
          box-shadow: 0 6px 0 rgba(27,94,32,0.25), 0 4px 16px rgba(0,0,0,0.1);
        }
        .rsp-card-img-wrap { position: relative; overflow: hidden; aspect-ratio: 4/3; background: var(--bg-page); display: flex; align-items: center; justify-content: center; }
        .rsp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .rsp-card:hover .rsp-card-img { transform: scale(1.04); }
        .rsp-card-oos { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; letter-spacing: 0.08em; text-transform: uppercase; }
        .rsp-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
        .rsp-card-name { font-size: 14px; font-weight: 800; color: var(--text-main); margin: 0 0 6px; line-height: 1.3; }
        .rsp-card-desc { font-size: 12px; color: var(--text-muted); margin: 0 0 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--sage-light); }
        .rsp-price { font-size: 17px; font-weight: 900; color: var(--primary); letter-spacing: -0.02em; }
        .rsp-stock-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; letter-spacing: 0.05em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .rsp-stock-normal { background: #E8F5E9; color: #1B5E20; }
        .rsp-stock-low { background: #FFF8E1; color: #F57F17; }
        .rsp-stock-oos { background: #FFEBEE; color: #C62828; }

        .rsp-add-btn {
          background: var(--emerald);
          color: white;
          border: none;
          border-bottom: 3px solid var(--header);
          padding: 7px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.12s;
        }
        .rsp-add-btn:hover:not(:disabled) { transform: translateY(1px); border-bottom-width: 2px; }
        .rsp-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .rsp-add-btn.in-cart { background: var(--primary); }

        .pos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        @media (max-width: 900px) { .pos-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @media (max-width: 580px) { .pos-grid { grid-template-columns: 1fr; gap: 10px; } }

        /* Cart section */
        .cart-section { background: white; border-top: 5px solid var(--primary); box-shadow: 0 4px 0 rgba(27,94,32,0.15); }
        .cart-header { background: var(--header); color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .cart-item-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid var(--sage-light); transition: background 0.15s; }
        .cart-item-row:hover { background: var(--mint); }

        /* Payment method cards */
        .pay-method {
          flex: 1;
          min-width: 120px;
          padding: 14px 10px;
          cursor: pointer;
          border: 2px solid #E0E0E0;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-main);
        }
        .pay-method:hover { border-color: var(--emerald); background: var(--mint); }
        .pay-method.active { border-color: var(--primary); border-width: 2px; background: var(--sage-light); color: var(--header); }
        .pay-method.active .pay-icon { color: var(--primary); }
        .pay-icon { font-size: 22px; line-height: 1; }

        /* Section headers */
        .sect-lbl { font-size: 10px; font-weight: 800; color: var(--earth); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
        .field-lbl { font-size: 11px; font-weight: 700; color: var(--header); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; display: block; }

        /* Nature input */
        .nature-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #BDBDBD;
          background: white;
          font-size: 14px;
          color: var(--text-main);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .nature-input:focus {
          border-color: var(--primary);
          border-width: 2px;
          box-shadow: inset 0 0 0 1px rgba(34,139,34,0.2);
        }
        .nature-input::placeholder { color: #BDBDBD; }

        /* Table */
        .nature-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .nature-table thead tr { background: var(--header); }
        .nature-table th { padding: 12px 16px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: white; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap; }
        .nature-table td { padding: 12px 16px; color: var(--text-main); border-bottom: 1px solid var(--sage-light); }
        .nature-table tbody tr:nth-child(even) { background: var(--mint); }
        .nature-table tbody tr:hover { background: var(--sage-light); }

        /* Notification badge */
        .n-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: #F44336; color: white; font-size: 10px; font-weight: 800; }

        /* Signature area */
        .sig-area { border: 2px dashed var(--earth); background: #FAFFF8; padding: 4px; position: relative; }
        .sig-area.signed { border-style: solid; border-color: var(--primary); background: #F1FFF1; }

        @media (max-width: 700px) {
          .cart-header { padding: 12px 16px; }
          .cart-item-row { padding: 12px 16px; }
        }

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
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#F5F5F5', zIndex: 3001, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Overlay header */}
            <div style={{ background: '#1B5E20', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '4px solid #2E8B57' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏳ Pending Requests
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  {pendingQueue.filter(q => q.status === 'pending').length} waiting · {pendingQueue.length} total
                </div>
              </div>
              <button onClick={() => setShowPendingDrawer(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, borderRadius: 0 }}>✕</button>
            </div>

            {/* Overlay body */}
            <div style={{ flex: 1, padding: '20px', width: '100%' }}>
              {pendingQueue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: '#424242', fontSize: 16, background: 'white', width: '100%' }}>
                  No pending requests
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {pendingQueue.map((item) => (
                    <div key={item.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderTop: `4px solid ${item.status === 'rejected' ? '#F44336' : item.status === 'approved' ? '#4CAF50' : '#FF9800'}`, overflow: 'hidden' }}>
                      {/* Item header (Clean, no blocky background) */}
                      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 18, color: '#424242', textTransform: 'uppercase' }}>
                            {item.customer_name}
                          </div>
                          <div style={{ fontSize: 13, color: '#8D6E63', marginTop: 4, fontWeight: 700 }}>
                            {item.type === 'store' ? '🏪 STORE REQUEST' : '🏦 FINANCE VERIFICATION'} · {new Date(item.submitted_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', padding: '6px 16px', border: `2px solid ${item.status === 'rejected' ? '#F44336' : item.status === 'approved' ? '#4CAF50' : '#FF9800'}`, color: item.status === 'rejected' ? '#F44336' : item.status === 'approved' ? '#4CAF50' : '#FF9800', letterSpacing: '0.05em' }}>
                          {item.status}
                        </span>
                      </div>

                      {/* Items list — FULL table */}
                      <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: '#A5D6A7' }}>
                              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 800, color: '#1B5E20' }}>Item</th>
                              <th style={{ padding: '12px 24px', textAlign: 'center', fontWeight: 800, color: '#1B5E20' }}>Qty</th>
                              <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 800, color: '#1B5E20' }}>Price</th>
                              <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 800, color: '#1B5E20' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.items.map((i, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB', background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                                <td style={{ padding: '12px 24px', fontWeight: 600, color: '#424242' }}>{i.name}</td>
                                <td style={{ padding: '12px 24px', textAlign: 'center', color: '#424242' }}>{i.qty}</td>
                                <td style={{ padding: '12px 24px', textAlign: 'right', color: '#424242' }}>{i.price.toLocaleString()} ETB</td>
                                <td style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 700, color: '#424242' }}>{(i.price * i.qty).toLocaleString()} ETB</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ background: '#FFFFFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #2E8B57' }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: 16, color: '#424242' }}>Grand Total</span>
                          <span style={{ fontWeight: 900, fontSize: 22, color: '#1B5E20' }}>{(item.total || 0).toLocaleString()} ETB</span>
                        </div>
                      </div>

                      {/* Payment Details & Signature */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 24, flexWrap: 'wrap', background: '#F9FAFB' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', color: '#8D6E63', fontWeight: 800 }}>Payment Details</h4>
                          <div style={{ fontSize: 14, color: '#424242', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div><span style={{ fontWeight: 700 }}>Method:</span> {item.payment_method || 'Not Set'}</div>
                            {item.txnId && <div><span style={{ fontWeight: 700 }}>Ref/Txn ID:</span> {item.txnId}</div>}
                            {item.payerPhone && <div><span style={{ fontWeight: 700 }}>Phone:</span> {item.payerPhone}</div>}
                          </div>
                        </div>
                        {item.cartSignature && (
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', color: '#8D6E63', fontWeight: 800 }}>Customer Signature</h4>
                            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: 8, display: 'inline-block' }}>
                              <img src={item.cartSignature} alt="Signature" style={{ height: 60, objectFit: 'contain' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '16px 24px', display: 'flex', gap: 16, background: '#FFFFFF' }}>
                        {item.status === 'pending' && item.type === 'store' && (
                          <button
                            onClick={async () => {
                              showToast('Checking status with store...', 'info');
                              // Real check: in a real system, we'd query the backend for the store's approval status.
                              // Since the store hasn't approved it yet in this demo, it remains pending.
                              setTimeout(() => {
                                showToast('Still waiting for store approval...', 'info');
                              }, 1000);
                            }}
                            style={{ flex: 1, padding: '14px 0', background: '#FFFFFF', color: '#1B5E20', border: '2px solid #1B5E20', cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 0 }}
                          >
                            <RefreshCw size={16} /> Check Status
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button
                            onClick={() => {
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
                              // Finalize directly
                              finalizeCashSale();
                              removeFromQueue(item.id);
                            }}
                            style={{ flex: 2, padding: '14px 0', background: '#2E8B57', color: 'white', border: 'none', borderBottom: '4px solid #1B5E20', cursor: 'pointer', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 0 }}
                          >
                            <CheckCircle size={16} /> Continue Process
                          </button>
                        )}
                        {item.status === 'rejected' && (
                          <div style={{ flex: 2, fontSize: 14, color: '#F44336', fontWeight: 700, padding: '10px 16px', background: '#FFFFFF', border: '2px solid #F44336', borderRadius: 0 }}>
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
                            style={{ flex: 1, padding: '14px 0', background: '#FFFFFF', color: '#1B5E20', border: '2px solid #1B5E20', cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 0 }}
                          >
                            <RefreshCw size={16} /> Check Finance Status
                          </button>
                        )}
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          style={{ padding: '14px 32px', background: '#FFFFFF', color: '#424242', border: '2px solid #424242', cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', borderRadius: 0 }}
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

            {/* Global WAITING badge for pending queue */}
            {pendingQueue.length > 0 && (
              <button
                onClick={() => setShowPendingDrawer(true)}
                style={{
                  padding: '8px 16px',
                  background: pendingQueue.some(q => q.status === 'pending') ? '#F59E0B' : '#10B981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  animation: pendingQueue.some(q => q.status === 'pending') ? 'pulse 2s infinite' : 'none',
                }}
              >
                ⏳ Waiting ({pendingQueue.filter(q => q.status === 'pending').length})
              </button>
            )}
          </div>

          {/* Right: Refresh — vertically centered in header */}
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
                      setShowAudit(true); setTab('retail-walkin'); loadAuditTrail();
                    } else {
                      setShowAudit(false); setTab(t.key);
                      if (t.key === 'retail-walkin') setShowCart(false);
                      if (t.key === 'list') loadSales();
                      if (t.key === 'retail-online') loadPendingOrders();
                    }
                  }}
                  style={{
                    flex: '1 0 auto',
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
        <div style={{ background: 'var(--bg-page)', minHeight: '60vh' }}>
          {!showCart ? (
              <>
                {/* Products toolbar */}
                <div style={{ background: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--primary)', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'var(--sage-light)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={15} color="var(--header)" strokeWidth={2.5} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--header)' }}>{products.length} Products</span>
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

                <div style={{ padding: '20px 24px' }}>
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
                        <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', background: 'white', border: '2px dashed var(--sage)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 64, height: 64, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Package size={28} color="var(--emerald)" />
                          </div>
                          <h3 style={{ margin: '0 0 8px', color: 'var(--header)', fontSize: 18, fontWeight: 800 }}>No Retail Products Found</h3>
                          <p style={{ margin: 0, color: 'var(--earth)', fontSize: 13, maxWidth: 380, lineHeight: 1.5 }}>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sage-light)' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--earth)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                  {item.category || 'Uncategorized'}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleHide(item); }}
                                    style={{ width: 26, height: 26, border: '1.5px solid var(--earth)', background: 'white', color: 'var(--earth)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title={item.is_active === false ? 'Show' : 'Hide'}>
                                    {item.is_active === false ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setEditingProduct({...item, price: priceVal, stock: stockVal}); }}
                                    style={{ width: 26, height: 26, border: '1.5px solid var(--emerald)', background: 'white', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Edit">
                                    <Edit3 size={13} />
                                  </button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }}
                                    style={{ width: 26, height: 26, border: '1.5px solid var(--danger)', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
               <div style={{ background: 'white', borderBottom: '2px solid var(--sage)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 36, height: 36, background: 'var(--sage-light)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <ShoppingCart size={18} color="var(--primary)" />
                   </div>
                   <div>
                     <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--header)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cart & Checkout</div>
                     <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{posCart.length} item{posCart.length !== 1 ? 's' : ''} · {posCartTotal.toLocaleString()} ETB total</div>
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                   {/* WAITING badge — shows pending queue */}
                   {pendingQueue.length > 0 && (
                     <button
                       onClick={() => setShowPendingDrawer(true)}
                       style={{
                         padding: '8px 14px',
                         background: pendingQueue.some(q => q.status === 'pending') ? '#F59E0B' : '#10B981',
                         color: 'white',
                         border: 'none',
                         cursor: 'pointer',
                         fontWeight: 800,
                         fontSize: 12,
                         textTransform: 'uppercase',
                         letterSpacing: '0.05em',
                         display: 'flex',
                         alignItems: 'center',
                         gap: 6,
                         animation: pendingQueue.some(q => q.status === 'pending') ? 'pulse 2s infinite' : 'none',
                       }}
                     >
                       ⏳ Waiting ({pendingQueue.filter(q => q.status === 'pending').length})
                     </button>
                   )}
                   <button onClick={() => { setShowCart(false); if (posStep === 4) { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); } }}
                     style={{ padding: '9px 18px', background: 'white', color: 'var(--header)', border: '2px solid var(--header)', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                     ← Back to Products
                   </button>
                 </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* ── Cart Items Table ── */}
                    <div style={{ background: 'white', borderBottom: '2px solid var(--sage-light)' }}>
                      <div style={{ padding: '14px 24px', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--header)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ShoppingCart size={15} /> Cart Items ({posCart.length})
                        </span>
                        {posCart.length > 0 && (
                          <button onClick={() => setPosCart([])}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '5px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <X size={13}/> Clear All
                          </button>
                        )}
                      </div>

                      {posCart.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <ShoppingCart size={32} color="#BDBDBD" style={{ marginBottom: 10 }} />
                          <div style={{ fontSize: 14, fontWeight: 600 }}>Your cart is empty</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>Go back to products to add items</div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                          {posCart.map((item, ci) => (
                            <div key={item.id} className="cart-item-row">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{parseFloat(item.price).toLocaleString()} ETB / unit</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                {/* Qty controls */}
                                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--sage)', overflow: 'hidden' }}>
                                  <button onClick={() => updateQty(item.id, item.qty - 1)}
                                    style={{ width: 30, height: 30, border: 'none', background: 'var(--sage-light)', color: 'var(--header)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <Minus size={12}/>
                                  </button>
                                  <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 14, color: 'var(--text-main)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 30 }}>{item.qty}</span>
                                  <button onClick={() => updateQty(item.id, item.qty + 1)}
                                    style={{ width: 30, height: 30, border: 'none', background: 'var(--sage-light)', color: 'var(--header)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <Plus size={12}/>
                                  </button>
                                </div>
                                <div style={{ fontWeight: 900, color: 'var(--primary)', width: 96, textAlign: 'right', fontSize: 15, letterSpacing: '-0.02em' }}>{(item.price * item.qty).toLocaleString()} ETB</div>
                                <button onClick={() => setPosCart(posCart.filter(c => c.id !== item.id))}
                                  style={{ width: 30, height: 30, background: 'var(--danger-light)', border: '1.5px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cart Total Bar */}
                      {posCart.length > 0 && (
                        <div style={{ padding: '14px 24px', background: 'var(--sage-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--primary)' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{posCart.length} item{posCart.length !== 1 ? 's' : ''}</span>
                          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--header)', letterSpacing: '-0.02em' }}>
                            Total: <span style={{ color: 'var(--primary)' }}>{posCartTotal.toLocaleString()} ETB</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Payment Section ── */}
                    {posCart.length > 0 && (
                      <div style={{ background: 'white', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Payment Method Selection */}
                        <div>
                          <span className="sect-lbl">💳 Select Payment Method</span>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {[
                              { value: 'CASH', label: 'Cash', icon: '💵' },
                              { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
                              { value: 'TELBIR', label: 'Telebirr', icon: '📱' },
                            ].map(pm => (
                              <button
                                key={pm.value}
                                type="button"
                                className={`pay-method${posPaymentMethod === pm.value ? ' active' : ''}`}
                                onClick={() => setPosPaymentMethod(pm.value)}
                              >
                                <span className="pay-icon">{pm.icon}</span>
                                {pm.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cash Fields */}
                        {posPaymentMethod === 'CASH' && (
                          <div style={{ background: 'var(--mint)', border: '2px solid var(--success)', padding: 18 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--header)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <DollarSign size={15} color="var(--primary)" /> Cash Payment Details
                            </div>
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
                        )}

                        {/* Bank Transfer Fields */}
                        {posPaymentMethod === 'BANK_TRANSFER' && (
                          <div style={{ background: '#EFF6FF', border: '2px solid #1565C0', padding: 18 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#1565C0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <CreditCard size={15} color="#1565C0" /> Bank Transfer Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                              <div>
                                <label className="field-lbl">Amount *</label>
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
                                <label className="field-lbl">Transaction ID *</label>
                                <input className="nature-input" type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Bank Ref ID" />
                              </div>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label className="field-lbl">Payment Proof (Screenshot)</label>
                                <input className="nature-input" type="file" accept="image/*"
                                  onChange={e => setTxnScreenshot(e.target.files[0])}
                                  style={{ padding: '8px 12px', cursor: 'pointer' }} />
                                {txnScreenshot && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>✓ {txnScreenshot.name}</div>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Telebirr Fields */}
                        {posPaymentMethod === 'TELBIR' && (
                          <div style={{ background: '#F3E5F5', border: '2px solid #7B1FA2', padding: 18 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#7B1FA2', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <Smartphone size={15} color="#7B1FA2" /> Telebirr Payment Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                              <div>
                                <label className="field-lbl">Amount *</label>
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
                                <label className="field-lbl">Transaction ID *</label>
                                <input className="nature-input" type="text" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Telebirr Ref ID" />
                              </div>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label className="field-lbl">Payment Screenshot</label>
                                <input className="nature-input" type="file" accept="image/*"
                                  onChange={e => setTxnScreenshot(e.target.files[0])}
                                  style={{ padding: '8px 12px', cursor: 'pointer' }} />
                                {txnScreenshot && <div style={{ fontSize: 11, color: '#7B1FA2', marginTop: 4, fontWeight: 600 }}>✓ {txnScreenshot.name}</div>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Payment Confirmation Checkbox */}
                        {posPaymentMethod && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: paymentStatus === 'PAID' ? 'var(--sage-light)' : '#FFF8E1', border: `2px solid ${paymentStatus === 'PAID' ? 'var(--success)' : '#FFB300'}` }}>
                            <input
                              type="checkbox"
                              id="paidCheckboxPOS"
                              checked={paymentStatus === 'PAID'}
                              onChange={e => setPaymentStatus(e.target.checked ? 'PAID' : 'PENDING')}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                            />
                            <label htmlFor="paidCheckboxPOS" style={{ fontWeight: 700, fontSize: 14, color: paymentStatus === 'PAID' ? 'var(--header)' : '#E65100', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                              <CheckCircle size={16} color={paymentStatus === 'PAID' ? 'var(--primary)' : '#FFC107'} />
                              {paymentStatus === 'PAID' ? 'Payment Confirmed' : 'Mark as Payment Received'}
                            </label>
                          </div>
                        )}

                        {/* Signature for CASH */}
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
                              padding: '16px 24px',
                              background: posPaymentMethod === 'CASH' ? 'var(--header)' : 'var(--emerald)',
                              color: 'white',
                              border: 'none',
                              borderBottom: `5px solid ${posPaymentMethod === 'CASH' ? '#0d3d0d' : 'var(--header)'}`,
                              fontWeight: 900,
                              fontSize: 15,
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: (loading || !paymentStatus || (posPaymentMethod === 'CASH' && !cartSignature)) ? 0.55 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              transition: 'all 0.15s',
                            }}
                          >
                            {loading ? (
                              <><RefreshCw size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Processing...</>
                            ) : posPaymentMethod === 'CASH' ? (
                              <><Package size={18} /> Send to Store — {posCartTotal > 0 ? posCartTotal.toLocaleString() : '0'} ETB</>
                            ) : (
                              <><CheckCircle size={18} /> Send to Finance for Verification — {posCartTotal > 0 ? posCartTotal.toLocaleString() : '0'} ETB</>
                            )}
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                ) : posStep === 5 ? (
                  /* ── WAITING FOR STORE APPROVAL ── */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', background: 'white', minHeight: 400 }}>
                    
                    {storeRequestStatus === 'rejected' ? (
                      /* REJECTED */
                      <>
                        <div style={{ width: 80, height: 80, background: '#FFF3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '4px solid #EF4444' }}>
                          <X size={44} color="#EF4444" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Store Rejected</h3>
                        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 16, textAlign: 'center', maxWidth: 360 }}>
                          The store has rejected this request.
                        </p>
                        <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', padding: '12px 20px', marginBottom: 24, width: '100%', maxWidth: 400 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 4, textTransform: 'uppercase' }}>Rejection Reason</div>
                          <div style={{ fontSize: 13, color: '#7F1D1D' }}>{storeRejectReason}</div>
                        </div>
                        <button onClick={() => {
                          setPosStep(3);
                          setStoreRequestStatus(null);
                          setStoreRequestId(null);
                          setStoreRejectReason('');
                        }} style={{ padding: '13px 32px', background: 'var(--primary)', color: 'white', border: 'none', borderBottom: '4px solid var(--header)', cursor: 'pointer', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Edit & Resubmit
                        </button>
                      </>
                    ) : storeRequestStatus === 'approved' ? (
                      /* APPROVED — transitioning */
                      <>
                        <div style={{ width: 80, height: 80, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '4px solid var(--success)', animation: 'pulse 1s infinite' }}>
                          <CheckCircle size={44} color="var(--primary)" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: 'var(--header)', textTransform: 'uppercase' }}>Store Approved!</h3>
                        <p style={{ color: '#6B7280', fontSize: 13 }}>Finalizing transaction...</p>
                      </>
                    ) : (
                      /* PENDING */
                      <>
                        {/* Animated waiting indicator */}
                        <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
                          <div style={{ width: 80, height: 80, border: '4px solid var(--sage-light)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1.2s linear infinite' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={28} color="var(--primary)" />
                          </div>
                        </div>
                        
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: 'var(--header)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waiting for Store Approval</h3>
                        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24, textAlign: 'center', maxWidth: 340 }}>
                          Your cart has been sent to the store. This page will update automatically when the store approves or rejects the request.
                        </p>

                        {/* Cart summary — locked/read-only */}
                        <div style={{ width: '100%', maxWidth: 480, border: '2px solid var(--sage)', background: 'var(--sage-light)', marginBottom: 20 }}>
                          <div style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🛒 Cart — Pending Release</span>
                            <span style={{ background: '#F59E0B', color: 'white', padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>PENDING</span>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: 'rgba(34,139,34,0.08)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--header)' }}>Item</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--header)' }}>Qty</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--header)' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {posCart.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--sage)' }}>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 600 }}>{item.name}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.qty}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{(item.price * item.qty).toLocaleString()} ETB</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: '2px solid var(--primary)' }}>
                                <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--header)', textTransform: 'uppercase', fontSize: 13 }}>Total</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: 16 }}>{posCartTotal.toLocaleString()} ETB</td>
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
                            style={{ flex: 1, padding: '12px 0', background: 'white', color: 'var(--header)', border: '2px solid var(--header)', cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
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
                            style={{ flex: 1, padding: '12px 0', background: '#FEF3C7', color: '#92400E', border: '2px solid #F59E0B', cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            ↩ Cancel & Go Back
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                ) : posStep === 4 ? (
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', background: 'white' }}>
                     <div style={{ width: 80, height: 80, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '4px solid var(--success)' }}>
                       <CheckCircle size={44} color="var(--primary)" />
                     </div>
                     <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--header)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaction Complete!</h3>
                     <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Inventory updated. CRV and Model 22 generated.</p>
                     {completedSale && (
                       <div style={{ background: 'var(--sage-light)', border: '2px solid var(--success)', padding: '16px 28px', marginBottom: 24, width: '100%', maxWidth: 420 }}>
                         <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15, marginBottom: 6 }}>Receipt: {completedSale.invoice_number}</div>
                         <div style={{ fontSize: 13, color: 'var(--text-main)' }}>Customer: <strong>{completedSale.recipient_name || 'Walk-In'}</strong></div>
                         <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--header)', marginTop: 8, letterSpacing: '-0.02em' }}>Total: {(completedSale.total_amount || 0).toLocaleString()} ETB</div>
                       </div>
                     )}
                     <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 420, marginBottom: 12 }}>
                       <button type='button' onClick={printReceipt}
                         style={{ flex: 1, padding: '13px 0', background: '#1565C0', color: 'white', border: 'none', borderBottom: '4px solid #0D47A1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>
                         <Printer size={16} /> Print Receipt
                       </button>
                       <button type='button' onClick={() => { setTab('list'); setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); }}
                         style={{ flex: 1, padding: '13px 0', background: 'white', color: 'var(--header)', border: '2px solid var(--header)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>
                         <List size={16} /> View Sales
                       </button>
                     </div>
                     <button type='button'
                       onClick={() => { setPosStep(1); setPosCart([]); setPosPaymentMethod(''); setShowCart(false); setCompletedSale(null); resetForm(); }}
                       style={{ width: '100%', maxWidth: 420, padding: '13px 0', background: 'var(--primary)', color: 'white', border: 'none', borderBottom: '4px solid var(--header)', cursor: 'pointer', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                     >🔄 Start New Transaction</button>
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
                   color: 'white', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(5,150,105,0.25)'
                 }}
               >
                 <CheckCircle size={18} /> Submit to Finance ({sales.length})
               </button>
             )}
          </div>
          
          <div style={{ padding: '24px 32px' }}>
             {sales.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 24px', background: '#F8FAFC', borderRadius: 0 }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 8, fontSize: 20 }}>All Caught Up!</h3>
                  <p style={{ color: '#64748B', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                    There are no unsubmitted sales. Any completed sales have already been moved to the Audit Log.
                  </p>
               </div>
             ) : (
               <div style={{ overflowX: 'auto', borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
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
                               padding: '4px 10px', borderRadius: 0, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                             }}>
                               {sale.sale_type === 'ONLINE' ? <><Smartphone size={12}/> ONLINE</> : <><ShoppingCart size={12}/> WALK-IN</>}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <div style={{ fontWeight: 600, color: '#334155' }}>{sale.customer_name || 'Walk-in Customer'}</div>
                             {sale.customer_phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>{sale.customer_phone}</div>}
                           </td>
                           <td style={tdStyle}>
                             <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', color: '#475569', borderRadius: 0, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                               <User size={12} /> {sale.cashier_name || 'Retail Staff'}
                             </span>
                           </td>
                           <td style={tdStyle}>
                             <span style={{
                               background: '#F8FAFC', color: '#334155', padding: '4px 10px', borderRadius: 0, fontSize: 12, fontWeight: 700
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
                                  style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', padding: '6px 14px', borderRadius: 0, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = '#DBEAFE'}
                                  onMouseOut={e => e.currentTarget.style.background = '#EFF6FF'}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleVoidSaleInit(sale)}
                                  style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '6px 14px', borderRadius: 0, cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}
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
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => setDeleteTarget(order.id)} 
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '10px 14px', borderRadius: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(220,38,38,0.15)' }}
                          title="Delete Order Permanently"
                        >
                          🗑️
                        </button>
                        <button 
                          onClick={() => processOnlineOrder(order)} 
                          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 0, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}
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

        return (
          <div style={{ background: 'white', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '2px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                📜 Retail Audit Trail
                <span style={{ fontSize: 12, fontWeight: 600, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 10px', borderRadius: 0 }}>
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
                        <div style={{ width: 8, height: 8, background: '#059669', borderRadius: 0 }} />
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#1E293B' }}>{day}</span>
                        <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 0 }}>
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
                      padding: '2px 10px', fontSize: 11, fontWeight: 700, borderRadius: 0
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 36, borderRadius: 0, maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(220,38,38,0.1)', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={32} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Delete Order?</h3>
            <p style={{ color: '#475569', marginBottom: 28, fontSize: 15 }}>
              Are you sure you want to completely delete this online order? It will be removed permanently from the customer page as well.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '12px 0', background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteTarget)}
                style={{ flex: 1, padding: '12px 0', background: '#dc2626', color: 'white', border: 'none', borderRadius: 0, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Trash2 size={18} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Full Page Overlay */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: '#F5F5F5', zIndex: 9999, display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', height: '100%' }}>
          
          {/* Header */}
          <div style={{ background: '#1B5E20', color: '#FFFFFF', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 16, color: '#FFFFFF' }}>
                <Edit3 size={32} color="#FFFFFF" /> Update Retail Product
              </h2>
              <p style={{ margin: '8px 0 0 0', color: '#A5D6A7', fontSize: 16 }}>Edit all product details. Form fields support sharp focus.</p>
            </div>
            <button onClick={() => setEditingProduct(null)} style={{ background: '#2E8B57', border: 'none', color: 'white', cursor: 'pointer', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
              <X size={28}/>
            </button>
          </div>
          
          {/* Body */}
          <div style={{ flex: 1, padding: '40px', width: '100%', boxSizing: 'border-box' }}>
            <form id="update-prod-form" onSubmit={handleUpdateProductSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, background: 'white', padding: 40, borderTop: '6px solid #228B22', boxSizing: 'border-box' }}>
              
              {/* Column 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Product Name</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>SKU (Stock Keeping Unit)</label>
                  <input
                    required
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                    style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Category ID</label>
                  <input
                    type="text"
                    value={editingProduct.category_id || ''}
                    onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}
                    style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Description</label>
                  <textarea
                    rows={4}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', resize: 'vertical', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>
                
              </div>

              {/* Column 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Selling Price (ETB)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''}
                      onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                      style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Cost Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || ''}
                      onChange={e => setEditingProduct({...editingProduct, cost_price: e.target.value})}
                      style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Stock Quantity</label>
                    <input
                      disabled
                      type="number"
                      value={editingProduct.stock || ''}
                      title="Stock cannot be manually edited here. It is synced from the main store inventory."
                      style={{ width: '100%', padding: '16px', border: '1px solid #ccc', borderRadius: 0, fontSize: 16, background: '#F5F5F5', outline: 'none', cursor: 'not-allowed', color: '#888', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: 11, color: '#8D6E63', marginTop: 4 }}>Syncs from store inventory</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Reorder Level</label>
                    <input
                      required
                      type="number"
                      value={editingProduct.reorder_level || ''}
                      onChange={e => setEditingProduct({...editingProduct, reorder_level: e.target.value})}
                      style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                      onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={editingProduct.expiry_date ? editingProduct.expiry_date.split('T')[0] : ''}
                    onChange={e => setEditingProduct({...editingProduct, expiry_date: e.target.value})}
                    style={{ width: '100%', padding: '16px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#424242', marginBottom: 8, textTransform: 'uppercase' }}>New Product Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEditingProduct({...editingProduct, new_image: e.target.files[0]})}
                    style={{ width: '100%', padding: '12px', border: '1px solid #8D6E63', borderRadius: 0, fontSize: 16, background: '#FFFFFF', outline: 'none', color: '#424242', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #228B22'; e.target.style.fontWeight = 'bold'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #8D6E63'; e.target.style.fontWeight = 'normal'; }}
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div style={{ gridColumn: '1 / -1', marginTop: 16, paddingTop: 32, borderTop: '2px solid #8D6E63', display: 'flex', gap: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: '16px 40px', border: '2px solid #8D6E63', background: '#FFFFFF', color: '#424242', fontWeight: 900, fontSize: 16, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  style={{ padding: '16px 40px', border: 'none', background: '#228B22', color: 'white', fontWeight: 900, fontSize: 16, textTransform: 'uppercase', cursor: savingProduct ? 'not-allowed' : 'pointer', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '4px 4px 0 #1B5E20' }}
                >
                  <CheckCircle size={20} />
                  {savingProduct ? 'Saving...' : 'Save Product Updates'}
                </button>
              </div>

            </form>
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

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#1B5E20', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inputStyle = () => ({ width: '100%', padding: '10px 13px', border: '1.5px solid #BDBDBD', fontSize: 13, boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#424242' });
const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#FFFFFF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#1B5E20', borderRight: '1px solid rgba(255,255,255,0.1)' };
const tdStyle = { padding: '12px 16px', color: '#424242', borderBottom: '1px solid #E8F5E9' };
const tabBtn = (active) => ({
  background: active ? '#228B22' : 'white',
  color: active ? 'white' : '#424242',
  border: active ? 'none' : '1px solid #E0E0E0',
  padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 700 : 500,
});
