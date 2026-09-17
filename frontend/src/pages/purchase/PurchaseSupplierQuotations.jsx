import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, CheckCircle, FileText, ShoppingCart, Trash2, Clock, Building2, MinusCircle, ChevronDown, Wallet, RefreshCw } from 'lucide-react';
import api from '../../services/apiClient';

const C = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  text: '#111827',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

const PQ_STYLES = `
  .pq-wrapper { padding: 24px; max-width: 1536px; margin: 10px auto; font-family: 'Inter', 'Segoe UI', 'Roboto', -apple-system, sans-serif; background: #F5F6FA; min-height: calc(100vh - 60px); color: #111827; box-sizing: border-box; }
  @media (max-width: 1024px) { .pq-wrapper { padding: 16px; margin: 6px auto; } }
  .pq-wrapper h1 { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; display: flex; align-items: center; gap: 10px; }
  .pq-wrapper p { margin: 0; color: #6B7280; font-size: 14px; }
  .pq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .pq-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .pq-filter { display: flex; gap: 12px; align-items: center; }
  .pq-search-wrap { position: relative; flex: 1; max-width: 360px; }
  .pq-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
  .pq-search { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; outline: none; }
  .pq-search:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .pq-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; }
  .pq-btn-primary { background: #2563EB; color: #fff; }
  .pq-btn-primary:hover { background: #1D4ED8; }
  .pq-btn-success { background: #16A34A; color: #fff; }
  .pq-btn-success:hover { background: #15803D; }
  .pq-btn-danger { background: #fff; color: #DC2626; border: 2px solid #DC2626; }
  .pq-btn-danger:hover { background: #FEE2E2; }
  .pq-btn-ghost { background: #F3F4F6; color: #374151; }
  .pq-btn-ghost:hover { background: #E5E7EB; }
  .pq-btn-sm { padding: 6px 12px; font-size: 12px; height: 32px; }
  .pq-table-wrap { overflow-x: auto; }
  .pq-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .pq-table th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; background: #F9FAFB; border-bottom: 2px solid #E5E7EB; white-space: nowrap; }
  .pq-table td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; }
  .pq-table tr:hover td { background: #F9FAFB; }
  .pq-amount { text-align: right; font-variant-numeric: tabular-nums; }
  .right { text-align: right; }
  .pq-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .pq-badge-recorded { background: #E0F2FE; color: #0369A1; }
  .pq-badge-converted { background: #DCFCE7; color: #15803D; }
  .pq-badge-cancelled { background: #FEE2E2; color: #B91C1C; }
  .pq-badge-pending { background: #FEF3C7; color: #92400E; }
  .pq-badge-default { background: #F1F5F9; color: #475569; }
  .pq-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
  .pq-modal { background: #fff; border-radius: 16px; width: 720px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .pq-modal-sm { width: 560px; }
  .pq-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
  .pq-modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; }
  .pq-close-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 4px; border-radius: 6px; }
  .pq-close-btn:hover { background: #F3F4F6; color: #374151; }
  .pq-modal-body { padding: 24px; }
  .pq-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #E5E7EB; }
  .pq-input { width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
  .pq-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .pq-input-static { background: #F9FAFB; color: #374151; font-weight: 600; border-color: #E5E7EB; }
  .pq-textarea { resize: vertical; min-height: 60px; }
  label { display: block; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
  .pq-detail-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
  .pq-detail-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF; margin-bottom: 4px; }
  .pq-detail-val { font-size: 15px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px; }
  .pq-total-label { font-weight: 700; font-size: 14px; color: #111827; padding-top: 8px; border-top: 2px solid #E5E7EB; }
  .pq-total-val { font-weight: 800; font-size: 16px; color: #2563EB; text-align: right; padding-top: 8px; border-top: 2px solid #E5E7EB; }
  .pq-spinner-wrap { display: flex; justify-content: center; padding: 40px; }
  .pq-spinner { width: 36px; height: 36px; border: 4px solid #E5E7EB; border-top-color: #2563EB; border-right-color: #2563EB; border-radius: 50%; animation: pq-spin 1s cubic-bezier(0.5,0,0.5,1) infinite; }
  @keyframes pq-spin { to { transform: rotate(360deg); } }
  .pq-toast { position: fixed; bottom: 24px; right: 24px; z-index: 99999; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); animation: pq-slide-in 0.3s ease-out; }
  .pq-toast-success { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
  .pq-toast-error { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
  @keyframes pq-slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .pq-line-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px; margin-bottom: 10px; position: relative; }
  .pq-line-num { position: absolute; top: -8px; left: -8px; width: 24px; height: 24px; background: #2563EB; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .pq-line-remove { position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; color: #DC2626; padding: 2px; border-radius: 4px; }
  .pq-line-remove:hover { background: #FEE2E2; }
  .pq-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .pq-stat-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.15s; }
  .pq-stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .pq-stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pq-stat-info { min-width: 0; }
  .pq-stat-val { font-size: 20px; font-weight: 800; color: #111827; line-height: 1.1; }
  .pq-stat-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }
  .pq-summary-row td { background: #F9FAFB !important; border-top: 2px solid #D1D5DB !important; font-weight: 700; padding: 12px 14px !important; font-size: 13px; color: #374151; }
  .pq-modal-lg { width: 900px; }
  .pq-detail-strip { border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .pq-detail-strip-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #F8FAFC; border-bottom: 1px solid #E5E7EB; flex-wrap: wrap; gap: 8px; }
  .pq-detail-qno { font-size: 15px; font-weight: 700; color: #2563EB; font-family: monospace; }
  .pq-detail-agreed { font-size: 12px; color: #6B7280; }
  .pq-detail-strip-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0; }
  .pq-detail-cell { padding: 14px 16px; border-right: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; min-width: 0; }
  .pq-detail-cell-total { background: #EFF6FF; border-bottom: 1px solid #DBEAFE; }
  .pq-detail-kv-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF; margin-bottom: 4px; }
  .pq-detail-val { font-size: 14px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px; word-break: break-word; }
  .pq-detail-total-val { font-size: 17px; font-weight: 800; color: #2563EB; }
  .pq-detail-section-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
  @media (max-width: 768px) { .pq-header { flex-direction: column; align-items: flex-start; } .pq-filter { flex-direction: column; align-items: stretch; } .pq-search-wrap { max-width: 100%; } .pq-modal { max-height: 95vh; } }
`;

const emptyItem = () => ({ item_description: '', quantity: '1', unit: '', unit_price: '' });

const PurchaseSupplierQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [askingFinance, setAskingFinance] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    date_agreed: new Date().toISOString().split('T')[0],
    agreed_via: 'Phone',
    notes: '',
    vat_rate: '15'
  });
  const [manualSupplier, setManualSupplier] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState('');
  const supplierWrapRef = useRef(null);
  const [lineItems, setLineItems] = useState([emptyItem()]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSuppliers = async () => {
    try {
      const sRes = await api.get('/suppliers');
      if (sRes && Array.isArray(sRes.data)) setSuppliers(sRes.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err.message);
    }
  };

  const fetchQuotations = async () => {
    try {
      const qRes = await api.get('/purchase/quotations');
      if (qRes && Array.isArray(qRes.data)) setQuotations(qRes.data);
    } catch (err) {
      console.error('Failed to load quotations:', err.message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSuppliers(), fetchQuotations()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchQuotations, 15000);
    return () => clearInterval(timer);
  }, []);

  const pickSupplier = (s) => {
    setFormData({ ...formData, supplier_id: s.id, supplier_name: s.company_name || s.full_name });
    setManualSupplier(false);
    setSupplierOpen(false);
  };

  const matchesQuery = (s) => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return true;
    return (s.company_name || '').toLowerCase().includes(q)
      || (s.full_name || '').toLowerCase().includes(q)
      || (s.category || '').toLowerCase().includes(q)
      || (s.email || '').toLowerCase().includes(q);
  };

  const internalSuppliers = suppliers.filter(s => !s.user_id);
  const selfSuppliers = suppliers.filter(s => s.user_id);
  const selectedSupplier = suppliers.find(s => String(s.id) === String(formData.supplier_id)) || null;

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (supplierWrapRef.current && !supplierWrapRef.current.contains(e.target)) setSupplierOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!showAddModal) setSupplierOpen(false);
  }, [showAddModal]);

  const updateLineItem = (idx, field, value) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => setLineItems([...lineItems, emptyItem()]);

  const removeLineItem = (idx) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const lineSubtotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return qty * price;
  };

  const calcTotals = () => {
    const subtotal = lineItems.reduce((s, item) => s + lineSubtotal(item), 0);
    const vatPct = parseFloat(formData.vat_rate || 0);
    const vatAmt = subtotal * (vatPct / 100);
    return { subtotal, vatAmt, vatPct, total: subtotal + vatAmt };
  };

  const { subtotal, vatAmt, vatPct, total } = calcTotals();

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validItems = lineItems.filter(it => it.item_description && parseFloat(it.unit_price) > 0);
    if (validItems.length === 0) {
      showToast('Add at least one item with a cost price', 'error');
      return;
    }
    try {
      await api.post('/purchase/quotations', {
        ...formData,
        items: validItems
      });
      showToast('Quotation recorded successfully');
      setShowAddModal(false);
      setFormData({ supplier_id: '', supplier_name: '', date_agreed: new Date().toISOString().split('T')[0], agreed_via: 'Phone', notes: '', vat_rate: '15' });
      setManualSupplier(false);
      setLineItems([emptyItem()]);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save quotation', 'error');
    }
  };

  const handleViewQuote = async (q) => {
    setSelectedQuote(q);
    setShowViewModal(true);
    try {
      const [itemsRes, listRes] = await Promise.all([
        api.get(`/purchase/quotations/${q.id}/items`),
        api.get('/purchase/quotations')
      ]);
      if (itemsRes && Array.isArray(itemsRes.data)) setSelectedItems(itemsRes.data);
      if (listRes && Array.isArray(listRes.data)) {
        const fresh = listRes.data.find(x => String(x.id) === String(q.id));
        if (fresh) setSelectedQuote(fresh);
      }
    } catch { setSelectedItems([]); }
  };

  const handleAction = async (action, id) => {
    if (!window.confirm(`Are you sure you want to ${action} this quotation?`)) return;
    try {
      if (action === 'cancel') {
        await api.put(`/purchase/quotations/${id}/cancel`);
        showToast('Quotation cancelled successfully');
      }
      setShowViewModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${action}`, 'error');
    }
  };

  const handleConvert = async (sendToStore) => {
    if (selectedQuote.finance_status !== 'ready') {
      showToast('Finance approval is required before converting this quotation', 'error');
      return;
    }
    setConverting(true);
    try {
      await api.post(`/purchase/quotations/${selectedQuote.id}/convert`, { send_to_general_store: sendToStore });
      showToast(sendToStore ? 'Converted to Purchase Order and forwarded to the General Store!' : 'Converted to Purchase Order successfully!');
      setShowConvertModal(false);
      setShowViewModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to convert quotation', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleAskFinance = async (qid) => {
    setAskingFinance(true);
    try {
      const res = await api.post(`/purchase/quotations/${qid}/ask-finance`);
      showToast(res.message || 'Finance budget requested');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to request finance budget', 'error');
    } finally {
      setAskingFinance(false);
    }
  };

  const filteredQuotes = (quotations || []).filter(q =>
    q.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.item_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCeoApproved = (q) => q.status === 'Recorded' && !!q.finance_ceo_approved;

  const statusLabel = (s, ceoApproved = false) => (s === 'Recorded' ? (ceoApproved ? 'Approved' : 'Recorded') : s);

  const Badge = ({ status, ceoApproved }) => {
    const s = {
      Recorded: { bg: '#e0f2fe', color: '#0369a1' },
      Converted: { bg: '#dcfce7', color: '#15803d' },
      Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
      'Pending CEO Approval': { bg: '#fef3c7', color: '#92400e' }
    }[status] || { bg: '#f1f5f9', color: '#475569' };
    return <span className="pq-badge" style={{ background: s.bg, color: s.color }}>{statusLabel(status, ceoApproved)}</span>;
  };

  const FinanceChip = ({ f, ceoApproved }) => {
    if (!f) return null;
    const map = {
      'awaiting ceo approval': ceoApproved
        ? { t: 'Finance: CEO Approved — Awaiting Release', bg: '#DCFCE7', c: '#15803D' }
        : { t: 'Finance: Awaiting CEO Approval', bg: '#FEF9C3', c: '#854D0E' },
      ready: { t: 'Finance: Ready', bg: '#DCFCE7', c: '#15803D' },
      paid: { t: 'Finance: Paid', bg: '#E0F2FE', c: '#0369A1' },
      cancelled: { t: 'Finance: Cancelled', bg: '#FEE2E2', c: '#B91C1C' }
    }[f] || { t: `Finance: ${f}`, bg: '#F3F4F6', c: '#4B5563' };
    return <span style={{ display: 'inline-block', marginLeft: 6, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: map.bg, color: map.c }}>{map.t}</span>;
  };

  const StoreChip = ({ s, showNotSent = false }) => {
    const st = s || (showNotSent ? 'not_sent' : null);
    if (!st) return null;
    const map = st === 'received'
      ? { t: 'General Store: Received', bg: '#DCFCE7', c: '#15803D' }
      : st === 'pending'
        ? { t: 'General Store: Waiting', bg: '#FEF9C3', c: '#854D0E' }
        : st === 'not_sent'
          ? { t: 'General Store: Not sent', bg: '#F3F4F6', c: '#6B7280' }
          : { t: `General Store: ${st}`, bg: '#F3F4F6', c: '#4B5563' };
    return <span style={{ display: 'inline-block', marginLeft: 6, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: map.bg, color: map.c }}>{map.t}</span>;
  };

  return (
    <div className="pq-wrapper">
      <style>{PQ_STYLES}</style>

      {/* Header */}
      <div className="pq-header">
        <div>
          <h1><FileText size={24} color="#2563EB" /> Quotations</h1>
          <p>Record routine prices agreed offline with trusted suppliers.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="pq-btn" style={{ background: '#F3F4F6', color: '#374151' }} onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="pq-btn pq-btn-primary" onClick={() => { setShowAddModal(true); setManualSupplier(false); setLineItems([emptyItem()]); }}>
            <Plus size={16} /> Record New Quotation
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {!loading && quotations.length > 0 && (() => {
        const totalQ = quotations.length;
        const pendingQ = quotations.filter(q => q.status === 'Pending CEO Approval' || (q.status === 'Recorded' && !q.finance_ceo_approved && q.finance_status === 'awaiting ceo approval')).length;
        const recordedQ = quotations.filter(q => q.status === 'Recorded' && q.finance_ceo_approved).length;
        const convertedQ = quotations.filter(q => q.status === 'Converted').length;
        const storeWaiting = quotations.filter(q => q.status === 'Converted' && q.store_status === 'pending').length;
        const storeReceived = quotations.filter(q => q.status === 'Converted' && q.store_status === 'received').length;
        const cancelledQ = quotations.filter(q => q.status === 'Cancelled').length;
        const totalValue = quotations.reduce((s, q) => s + parseFloat(q.total_amount || 0), 0);
        const cards = [
          { label: 'Total', val: totalQ, bg: '#EFF6FF', icon: <FileText size={20} color="#2563EB" /> },
          { label: 'Pending CEO', val: pendingQ, bg: '#FEF3C7', icon: <Clock size={20} color="#D97706" /> },
          { label: 'Approved', val: recordedQ, bg: '#E0F2FE', icon: <CheckCircle size={20} color="#0369A1" /> },
          { label: 'Store Waiting', val: storeWaiting, bg: '#FEF3C7', icon: <Clock size={20} color="#B45309" /> },
          { label: 'Store Received', val: storeReceived, bg: '#DCFCE7', icon: <CheckCircle size={20} color="#15803D" /> },
          { label: 'Converted', val: convertedQ, bg: '#DCFCE7', icon: <ShoppingCart size={20} color="#15803D" /> },
          { label: 'Cancelled', val: cancelledQ, bg: '#FEE2E2', icon: <Trash2 size={20} color="#DC2626" /> },
          { label: 'Total Value', val: `ETB ${totalValue.toLocaleString()}`, bg: '#F3E8FF', icon: <FileText size={20} color="#7C3AED" /> },
        ];
        return (
          <div className="pq-stat-row">
            {cards.map((c, i) => (
              <div className="pq-stat-card" key={i}>
                <div className="pq-stat-icon" style={{ background: c.bg }}>{c.icon}</div>
                <div className="pq-stat-info">
                  <div className="pq-stat-val">{c.val.toLocaleString?.() ?? c.val}</div>
                  <div className="pq-stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Filter */}
      <div className="pq-card" style={{ marginBottom: 20 }}>
        <div className="pq-filter">
          <div className="pq-search-wrap">
            <Search size={16} />
            <input className="pq-search" placeholder="Search by quotation no, supplier, or item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="pq-card">
        <div className="pq-table-wrap">
          <table className="pq-table">
            <thead>
              <tr>
                <th>Quotation No</th>
                <th>Supplier</th>
                <th>Items</th>
                <th className="right">Subtotal</th>
                <th className="right">Input VAT</th>
                <th className="right">Total</th>
                <th>Date</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="pq-spinner-wrap"><div className="pq-spinner"></div></div></td></tr>
              ) : filteredQuotes.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 14 }}>No quotations found.</td></tr>
              ) : (
                filteredQuotes.map(q => {
                  const status = q.status || 'Recorded';
                  const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : status === 'Pending CEO Approval' ? 'pq-badge-pending' : 'pq-badge-default';
                  const ceoApproved = isCeoApproved(q);
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600, color: '#2563EB', fontFamily: 'monospace', fontSize: 13 }}>{q.quotation_no}</td>
                      <td>{q.supplier_name}</td>
                      <td><span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{q.item_count || 1} item{(q.item_count || 1) !== 1 ? 's' : ''}</span></td>
                      <td className="right pq-amount" style={{ color: '#6B7280' }}>ETB {parseFloat(q.total_amount - (q.vat_amount || 0)).toLocaleString()}</td>
                      <td className="right pq-amount" style={{ color: '#6B7280' }}>{parseFloat(q.vat_rate) > 0 ? `ETB ${parseFloat(q.vat_amount || 0).toLocaleString()}` : '—'}</td>
                      <td className="right pq-amount" style={{ fontWeight: 600 }}>ETB {parseFloat(q.total_amount).toLocaleString()}</td>
                      <td style={{ color: '#6B7280' }}>{q.date_agreed ? new Date(q.date_agreed).toLocaleDateString() : '—'}</td>
                      <td><span className={`pq-badge ${badgeCls}`}>{statusLabel(status, ceoApproved)}</span><FinanceChip f={q.finance_status} ceoApproved={ceoApproved} /><StoreChip s={q.store_status} showNotSent={status === 'Converted'} /></td>
                      <td className="right">
                        <button className="pq-btn pq-btn-sm" style={{ background: '#F3F4F6', color: '#374151' }} onClick={() => handleViewQuote(q)}>View</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filteredQuotes.length > 0 && (() => {
              const sumSubtotal = filteredQuotes.reduce((s, q) => s + parseFloat(q.total_amount || 0) - parseFloat(q.vat_amount || 0), 0);
              const sumVat = filteredQuotes.reduce((s, q) => s + parseFloat(q.vat_amount || 0), 0);
              const sumTotal = filteredQuotes.reduce((s, q) => s + parseFloat(q.total_amount || 0), 0);
              const sumItems = filteredQuotes.reduce((s, q) => s + (parseInt(q.item_count, 10) || 0), 0);
              return (
                <tfoot>
                  <tr className="pq-summary-row">
                    <td colSpan={2}>Summary ({String(filteredQuotes.length)} quotation{filteredQuotes.length !== 1 ? 's' : ''})</td>
                    <td><span style={{ background: '#D1E7FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{sumItems} item{sumItems !== 1 ? 's' : ''}</span></td>
                    <td className="right pq-amount">ETB {sumSubtotal.toLocaleString()}</td>
                    <td className="right pq-amount">ETB {sumVat.toLocaleString()}</td>
                    <td className="right pq-amount" style={{ color: '#2563EB', fontSize: 14 }}>ETB {sumTotal.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="pq-modal-overlay">
          <div className="pq-modal">
            <div className="pq-modal-header">
              <h2><Plus size={18} color="#2563EB" style={{ verticalAlign: 'middle', marginRight: 8 }} />Record Quotation</h2>
              <button className="pq-close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="pq-modal-body">
                {/* Supplier & Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Supplier</label>
                    <div style={{ position: 'relative' }} ref={supplierWrapRef}>
                      <button
                        type="button"
                        className="pq-input"
                        onClick={() => { setSupplierOpen(o => !o); setSupplierQuery(''); }}
                        style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}
                      >
                        <span style={{ color: manualSupplier ? '#111827' : (selectedSupplier ? '#111827' : '#9CA3AF'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {manualSupplier ? (formData.supplier_name || 'Type supplier name...') : (selectedSupplier ? (selectedSupplier.company_name || selectedSupplier.full_name) : '-- Select Supplier --')}
                        </span>
                        <ChevronDown size={16} color="#9CA3AF" style={{ flexShrink: 0, marginLeft: 8 }} />
                      </button>

                      {supplierOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #D1D5DB', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.16)', zIndex: 70, overflow: 'hidden' }}>
                          <div style={{ padding: 8, borderBottom: '1px solid #F3F4F6' }}>
                            <input autoFocus type="text" className="pq-input" style={{ padding: '8px 10px', fontSize: 13 }} value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Search suppliers..." />
                          </div>
                          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                            <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>Self / Registered Suppliers</div>
                            {selfSuppliers.filter(matchesQuery).length === 0 && (
                              <div style={{ padding: '10px 14px', fontSize: 13, color: '#9CA3AF' }}>None found</div>
                            )}
                            {selfSuppliers.filter(matchesQuery).map(s => (
                              <button key={`self-${s.id}`} type="button" onClick={() => pickSupplier(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5 }}>
                                <span style={{ color: '#111827' }}>{s.company_name || s.full_name}</span>
                                {s.category && <span style={{ color: '#9CA3AF', fontSize: 12 }}> — {s.category}</span>}
                              </button>
                            ))}
                            <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>Internal Suppliers</div>
                            {internalSuppliers.filter(matchesQuery).length === 0 && (
                              <div style={{ padding: '10px 14px', fontSize: 13, color: '#9CA3AF' }}>None found</div>
                            )}
                            {internalSuppliers.filter(matchesQuery).map(s => (
                              <button key={`int-${s.id}`} type="button" onClick={() => pickSupplier(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5 }}>
                                <span style={{ color: '#111827' }}>{s.company_name || s.full_name}</span>
                                {s.category && <span style={{ color: '#9CA3AF', fontSize: 12 }}> — {s.category}</span>}
                              </button>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid #E5E7EB' }}>
                            <button
                              type="button"
                              onClick={() => { setManualSupplier(true); setSupplierOpen(false); setFormData({ ...formData, supplier_id: '', supplier_name: '' }); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2563EB' }}
                            >
                              <Plus size={15} /> Manual Entry — type a new supplier
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {manualSupplier && (
                      <input
                        type="text"
                        required
                        className="pq-input"
                        style={{ marginTop: 8 }}
                        value={formData.supplier_name}
                        onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                        placeholder="Type supplier name..."
                      />
                    )}
                  </div>
                  <div>
                    <label>Date Agreed</label>
                    <input required type="date" className="pq-input" value={formData.date_agreed} onChange={e => setFormData({ ...formData, date_agreed: e.target.value })} />
                  </div>
                  <div>
                    <label>Agreed Via</label>
                    <select className="pq-input" value={formData.agreed_via} onChange={e => setFormData({ ...formData, agreed_via: e.target.value })}>
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>
                  <div>
                    <label>Input VAT (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="pq-input"
                      value={formData.vat_rate}
                      onChange={e => setFormData({ ...formData, vat_rate: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label>Notes</label>
                    <input className="pq-input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional..." />
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ margin: 0, fontSize: 13 }}>Line Items</label>
                    <button type="button" className="pq-btn pq-btn-primary pq-btn-sm" onClick={addLineItem}>
                      <Plus size={14} /> New Line
                    </button>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div key={idx} className="pq-line-item">
                      <div className="pq-line-num">{idx + 1}</div>
                      {lineItems.length > 1 && (
                        <button type="button" className="pq-line-remove" onClick={() => removeLineItem(idx)} title="Remove line">
                          <MinusCircle size={18} />
                        </button>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.5fr 1fr 1fr', gap: 10, paddingTop: 6 }}>
                        <div>
                          <label>Item Description</label>
                          <input required className="pq-input" value={item.item_description} onChange={e => updateLineItem(idx, 'item_description', e.target.value)} placeholder="e.g. Paracetamol 500mg box" />
                        </div>
                        <div>
                          <label>Qty</label>
                          <input required type="number" min="1" step="1" className="pq-input" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                        </div>
                        <div>
                          <label>Unit</label>
                          <input className="pq-input" value={item.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} placeholder="pcs" />
                        </div>
                        <div>
                          <label>Cost Price (ETB)</label>
                          <input required type="number" min="0" step="0.01" className="pq-input" value={item.unit_price} onChange={e => updateLineItem(idx, 'unit_price', e.target.value)} />
                        </div>
                        <div>
                          <label>Line Total</label>
                          <div className="pq-input pq-input-static" style={{ display: 'flex', alignItems: 'center', height: 42 }}>ETB {lineSubtotal(item).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="pq-btn pq-btn-ghost pq-btn-sm" style={{ width: '100%', marginTop: 4, border: '2px dashed #D1D5DB' }} onClick={addLineItem}>
                    <Plus size={14} /> Add Another Item
                  </button>
                </div>

                {/* Summary */}
                <div style={{ marginTop: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', color: '#6B7280' }}>Subtotal ({lineItems.filter(i => i.item_description).length} item{(lineItems.filter(i => i.item_description).length) !== 1 ? 's' : ''})</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>ETB {subtotal.toLocaleString()}</td>
                      </tr>
                      {vatPct > 0 && (
                        <tr>
                          <td style={{ padding: '6px 0', color: '#6B7280' }}>Input VAT ({vatPct}%)</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>ETB {vatAmt.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 0 0 0', fontWeight: 700, fontSize: 16, color: '#111827' }}>Total Amount</td>
                        <td style={{ padding: '10px 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: 18, color: '#2563EB' }}>ETB {total.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pq-modal-footer">
                <button type="button" className="pq-btn pq-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="pq-btn pq-btn-primary">Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedQuote && (() => {
        const status = selectedQuote.status || 'Recorded';
        const badgeCls = status === 'Converted' ? 'pq-badge-converted' : status === 'Cancelled' ? 'pq-badge-cancelled' : status === 'Recorded' ? 'pq-badge-recorded' : status === 'Pending CEO Approval' ? 'pq-badge-pending' : 'pq-badge-default';
        const viewCeoApproved = isCeoApproved(selectedQuote);
        const viewSubtotal = selectedItems.reduce((s, i) => s + parseFloat(i.line_total || 0), 0);
        const viewVat = parseFloat(selectedQuote.vat_amount || 0);
        return (
          <div className="pq-modal-overlay">
            <div className="pq-modal pq-modal-lg">
              <div className="pq-modal-header">
                <h2 style={{ fontFamily: 'monospace', color: '#2563EB' }}>{selectedQuote.quotation_no}</h2>
                <button className="pq-close-btn" onClick={() => setShowViewModal(false)}><X size={20} /></button>
              </div>
              <div className="pq-modal-body">
                {/* Horizontal Detail Strip */}
                <div className="pq-detail-strip">
                  <div className="pq-detail-strip-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`pq-badge ${badgeCls}`}>{statusLabel(status, viewCeoApproved)}</span>
                      <FinanceChip f={selectedQuote.finance_status} ceoApproved={viewCeoApproved} />
                      <StoreChip s={selectedQuote.store_status} />
                      <span className="pq-detail-qno">{selectedQuote.quotation_no}</span>
                    </div>
                    <span className="pq-detail-agreed">Agreed {selectedQuote.date_agreed ? new Date(selectedQuote.date_agreed).toLocaleDateString() : '—'} via {selectedQuote.agreed_via || '—'}</span>
                  </div>
                  <div className="pq-detail-strip-grid">
                    <div className="pq-detail-cell">
                      <div className="pq-detail-kv-label">Supplier</div>
                      <div className="pq-detail-val"><Building2 size={15} /> {selectedQuote.supplier_name}</div>
                    </div>
                    <div className="pq-detail-cell">
                      <div className="pq-detail-kv-label">Items</div>
                      <div className="pq-detail-val">{selectedItems.length || (parseInt(selectedQuote.item_count, 10) || 1)} item{(selectedItems.length || (parseInt(selectedQuote.item_count, 10) || 1)) !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="pq-detail-cell">
                      <div className="pq-detail-kv-label">Subtotal</div>
                      <div className="pq-detail-val">ETB {(viewSubtotal || parseFloat(selectedQuote.total_amount) - viewVat).toLocaleString()}</div>
                    </div>
                    <div className="pq-detail-cell">
                      <div className="pq-detail-kv-label">Input VAT</div>
                      <div className="pq-detail-val">{parseFloat(selectedQuote.vat_rate) > 0 ? `ETB ${viewVat.toLocaleString()}` : '—'}</div>
                    </div>
                    <div className="pq-detail-cell pq-detail-cell-total">
                      <div className="pq-detail-kv-label">Total Amount</div>
                      <div className="pq-detail-total-val">ETB {parseFloat(selectedQuote.total_amount).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {selectedItems.length > 0 ? (
                  <div>
                    <div className="pq-detail-section-title">Line Items</div>
                    <div className="pq-table-wrap">
                      <table className="pq-table pq-items-table" style={{ fontSize: 13 }}>
                        <colgroup>
                          <col style={{ width: 40 }} />
                          <col />
                          <col style={{ width: 90 }} />
                          <col style={{ width: 90 }} />
                          <col style={{ width: 120 }} />
                          <col style={{ width: 130 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th className="right">Qty</th>
                            <th className="right">Unit</th>
                            <th className="right">Cost Price</th>
                            <th className="right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map(item => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 600, color: '#2563EB' }}>{item.line_no}</td>
                              <td>{item.item_description || '—'}</td>
                              <td className="right">{item.quantity}</td>
                              <td className="right">{item.unit || '—'}</td>
                              <td className="right">ETB {parseFloat(item.unit_price || 0).toLocaleString()}</td>
                              <td className="right" style={{ fontWeight: 600 }}>ETB {parseFloat(item.line_total || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="pq-detail-section-title">Item Details</div>
                    <table className="pq-info-table" style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td>Item</td><td>{selectedQuote.item_description}</td></tr>
                        <tr><td>Quantity</td><td>{selectedQuote.quantity} {selectedQuote.unit}</td></tr>
                        <tr><td>Cost Price</td><td>ETB {parseFloat(selectedQuote.unit_price).toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>Subtotal</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {(viewSubtotal || parseFloat(selectedQuote.total_amount) - viewVat).toLocaleString()}</td></tr>
                      {parseFloat(selectedQuote.vat_rate) > 0 && (
                        <tr><td style={{ padding: '4px 0', color: '#6B7280' }}>Input VAT ({parseFloat(selectedQuote.vat_rate)}%)</td><td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>ETB {viewVat.toLocaleString()}</td></tr>
                      )}
                      <tr><td style={{ padding: '8px 0 0 0', fontWeight: 700, borderTop: '2px solid #E5E7EB' }}>Total Amount</td><td style={{ padding: '8px 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#2563EB', borderTop: '2px solid #E5E7EB' }}>ETB {parseFloat(selectedQuote.total_amount).toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>

                {selectedQuote.notes && (
                  <div style={{ marginBottom: 16, background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>
                    {selectedQuote.notes}
                  </div>
                )}

                {selectedQuote.status === 'Pending CEO Approval' && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ textAlign: 'center', padding: 14, background: '#FEF3C7', color: '#92400E', fontWeight: 600, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                      <Clock size={16} /> Waiting for CEO approval before conversion.
                    </div>
                    {selectedQuote.finance_requested ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginBottom: 12, background: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 8, fontSize: 14 }}>
                        <Clock size={16} /> Asked — Awaiting Finance Response
                      </div>
                    ) : (
                      <button className="pq-btn" style={{ height: 44, width: '100%', background: '#D97706', color: '#fff', justifyContent: 'center', marginBottom: 12 }} disabled={askingFinance} onClick={() => handleAskFinance(selectedQuote.id)}>
                        {askingFinance ? <span>Requesting…</span> : <><Wallet size={16} /> Ask Finance Budget</>}
                      </button>
                    )}
                    <button className="pq-btn pq-btn-danger" style={{ height: 44, width: '100%' }} onClick={() => handleAction('cancel', selectedQuote.id)}>
                      <Trash2 size={16} /> Cancel Quotation
                    </button>
                  </div>
                )}
                {selectedQuote.status === 'Recorded' && (
                  <div style={{ marginTop: 24 }}>
                    {selectedQuote.finance_status !== 'ready' ? (
                      <div>
                        {!viewCeoApproved ? (
                          <div style={{ textAlign: 'center', padding: 14, background: '#FEF3C7', color: '#92400E', fontWeight: 600, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                            <Clock size={16} /> Awaiting CEO approval — Finance can release funds only after the CEO approves.
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: 14, background: '#FEF3C7', color: '#92400E', fontWeight: 600, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                            <Clock size={16} /> Awaiting Finance approval — conversion is locked until Finance releases funds.
                          </div>
                        )}
                        {selectedQuote.finance_requested ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginBottom: 12, background: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 8, fontSize: 14 }}>
                            <Clock size={16} /> Asked — Awaiting Finance Response
                          </div>
                        ) : (
                          <button className="pq-btn" style={{ height: 44, width: '100%', background: '#D97706', color: '#fff', justifyContent: 'center', marginBottom: 12 }} disabled={askingFinance} onClick={() => handleAskFinance(selectedQuote.id)}>
                            {askingFinance ? <span>Requesting…</span> : <><Wallet size={16} /> Ask Finance Budget</>}
                          </button>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <button className="pq-btn pq-btn-success" style={{ height: 44, opacity: 0.5, cursor: 'not-allowed' }} disabled>
                            <ShoppingCart size={16} /> Convert to Purchase
                          </button>
                          <button className="pq-btn pq-btn-danger" style={{ height: 44, opacity: 0.5, cursor: 'not-allowed' }} disabled>
                            <Trash2 size={16} /> Cancel Quotation
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button className="pq-btn pq-btn-success" style={{ height: 44 }} onClick={() => setShowConvertModal(true)}>
                          <ShoppingCart size={16} /> Convert to Purchase
                        </button>
                        <button className="pq-btn pq-btn-danger" style={{ height: 44 }} onClick={() => handleAction('cancel', selectedQuote.id)}>
                          <Trash2 size={16} /> Cancel Quotation
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {selectedQuote.status === 'Converted' && (
                  <div>
                    <div style={{ textAlign: 'center', padding: 14, background: '#DCFCE7', color: '#16A34A', fontWeight: 600, borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                      <CheckCircle size={16} /> Converted to Purchase Order.
                    </div>
                    {selectedQuote.store_status === 'received' ? (
                      <div style={{ textAlign: 'center', padding: 14, background: '#DCFCE7', color: '#15803D', fontWeight: 600, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                        <CheckCircle size={16} /> General Store accepted — {selectedQuote.store_delivery_no || 'goods delivered'} received{selectedQuote.store_received_by_name ? ` by ${selectedQuote.store_received_by_name}` : ''}{selectedQuote.store_received_at ? ` on ${new Date(selectedQuote.store_received_at).toLocaleDateString()}` : ''}. Expense marked paid.
                      </div>
                    ) : selectedQuote.store_status === 'pending' ? (
                      <div style={{ textAlign: 'center', padding: 14, background: '#FEF3C7', color: '#854D0E', fontWeight: 600, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                        <Clock size={16} /> Sent to General Store ({selectedQuote.store_delivery_no || 'delivery note'}) — awaiting acceptance. Expense stays Ready until received.
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 14, background: '#F3F4F6', color: '#6B7280', fontWeight: 500, borderRadius: 8, marginTop: 12, fontSize: 13 }}>
                        Converted to purchase — shipment not forwarded to the General Store.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Convert Choice Modal */}
      {showConvertModal && selectedQuote && (
        <div className="pq-modal-overlay">
          <div className="pq-modal pq-modal-sm">
            <div className="pq-modal-header">
              <h2><ShoppingCart size={18} color="#2563EB" style={{ verticalAlign: 'middle', marginRight: 8 }} />Convert Quotation</h2>
              <button className="pq-close-btn" onClick={() => setShowConvertModal(false)}><X size={20} /></button>
            </div>
            <div className="pq-modal-body">
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 16px 0' }}>
                <strong style={{ fontFamily: 'monospace' }}>{selectedQuote.quotation_no}</strong> is approved and finance-ready (funds released). Choose how to continue.
              </p>
              <button className="pq-btn pq-btn-success" style={{ height: 48, width: '100%', marginBottom: 8, justifyContent: 'center' }} disabled={converting} onClick={() => handleConvert(false)}>
                {converting ? <span>Converting…</span> : <><ShoppingCart size={16} /> Convert to Purchase Order</>}
              </button>
              <button className="pq-btn" style={{ height: 48, width: '100%', background: '#1D4ED8', color: '#fff', justifyContent: 'center' }} disabled={converting} onClick={() => handleConvert(true)}>
                {converting ? <span>Converting…</span> : <><ShoppingCart size={16} /> Convert & Send to General Store</>}
              </button>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '12px 0 0 0', lineHeight: 1.5 }}>
                Sending to the General Store creates a pending incoming shipment so the Store Keeper can receive the goods into inventory.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`pq-toast pq-toast-${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PurchaseSupplierQuotations;
