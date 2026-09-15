import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/apiClient';
import {
  PlusCircle, FileText, BarChart2, Star, X, CheckCircle,
  Clock, AlertCircle, ChevronRight, ChevronDown, TrendingDown, TrendingUp, Minus,
  Phone, Mail, Save, MessageCircle, Send, XCircle, Info, Wallet, Eye
} from 'lucide-react';

// ─── Status badge helper ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    published: { bg: '#dcfce7', color: '#166534', label: 'Published' },
    draft: { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
    closed: { bg: '#fee2e2', color: '#991b1b', label: 'Closed' },
    awaiting_ceo_approval: { bg: '#fef9c3', color: '#854d0e', label: 'Awaiting CEO' },
    awarded: { bg: '#ede9fe', color: '#5b21b6', label: 'Awarded' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
      background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>{s.label}</span>
  );
};

const BidStatusBadge = ({ status }) => {
  const map = {
    pending: { bg: '#f1f5f9', color: '#475569', label: 'Pending' },
    recommended: { bg: '#dcfce7', color: '#166534', label: '⭐ Recommended' },
    rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
    winner: { bg: '#ede9fe', color: '#5b21b6', label: '🏆 Winner' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
      background: s.bg, color: s.color
    }}>{s.label}</span>
  );
};

const PaymentStatusBadge = ({ status }) => {
  if (!status || status === 'pending') return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#fef9c3', color: '#854d0e' }}>⏳ Awaiting Finance</span>
  );
  if (status === 'confirmed') return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#dcfce7', color: '#166534' }}>✅ Finance Confirmed</span>
  );
  if (status === 'rejected') return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#fee2e2', color: '#991b1b' }}>❌ Finance Rejected</span>
  );
  return <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' }}>{status}</span>;
};

// ─── Tab Button ──────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon, label, count }) => (
  <button onClick={onClick} style={{
    padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
    background: active ? 'white' : 'transparent',
    color: active ? '#0f172a' : '#64748b',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
    transition: 'all 0.2s'
  }}>
    {icon}
    {label}
    {count !== undefined && (
      <span style={{ background: active ? '#3b82f6' : '#e2e8f0', color: active ? 'white' : '#64748b', borderRadius: '20px', padding: '1px 8px', fontSize: '11px' }}>
        {count}
      </span>
    )}
  </button>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#3b82f6', icon }) => (
  <div className="pst-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: '26px', fontWeight: 800, color }}>{value}</p>
        {sub && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{sub}</p>}
      </div>
      <div style={{ fontSize: '28px' }}>{icon}</div>
    </div>
  </div>
);


// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const PurchaseSmartTenders = () => {

  // ─── STYLES ───────────────────────────────────────────
  const customStyles = `
    .pst-wrapper {
      padding: 24px;
      max-width: 1536px;
      margin: 10px auto;
      font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif !important;
      color: var(--color-text-primary, #111827);
      background-color: var(--color-bg-page, #F5F6FA) !important;
      min-height: calc(100vh - 60px);
    }
    @media(max-width: 1024px) { .pst-wrapper { padding: 16px; margin: 6px auto; } }
    @media(max-width: 768px) { .pst-wrapper { padding: 12px; margin: 4px auto; } }

    /* Typography */
    .pst-wrapper h2 { font-size: 28px !important; font-weight: 600 !important; color: #111827 !important; margin: 0 0 24px 0 !important; line-height: 1.3 !important; }
    .pst-wrapper h3, .pst-wrapper h4 { font-size: 18px !important; font-weight: 600 !important; color: #111827 !important; margin: 0 0 16px 0 !important; line-height: 1.3 !important; }
    .pst-wrapper p { font-size: 16px !important; font-weight: 400 !important; color: #6B7280 !important; line-height: 1.5 !important; }
    .pst-wrapper label { font-size: 14px !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF !important; }

    /* Cards */
    .pst-card {
      background: #FFFFFF !important;
      border-radius: 10px !important;
      border: 1px solid #E5E7EB !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
      padding: 24px !important;
      transition: all 150ms ease-in-out !important;
      margin-bottom: 24px !important;
    }
    .pst-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      transform: translateY(-1px) !important;
    }

    /* Buttons */
    .pst-wrapper button {
      border-radius: 8px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      transition: all 150ms ease-in-out !important;
      cursor: pointer !important;
    }
    .pst-wrapper button:hover:not(:disabled) {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
    }
    .pst-wrapper button:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

    /* Specific button overrides */
    .pst-btn-gold { background: #D97706 !important; color: white !important; }
    .pst-wrapper button[style*="background"]:hover:not(:disabled) {
      /* Apply gold hover to buttons with inline backgrounds like #f1f5f9 or others if they aren't primary blue */
      background: #D97706 !important;
      color: white !important;
    }
    /* Exclude primary and danger buttons from turning gold on hover if we can */
    .pst-wrapper button[style*="#3b82f6"]:hover:not(:disabled),
    .pst-wrapper button[style*="2563eb"]:hover:not(:disabled) {
      background: #1D4ED8 !important;
      color: white !important;
    }
    .pst-wrapper button[style*="#ef4444"]:hover:not(:disabled),
    .pst-wrapper button[style*="dc2626"]:hover:not(:disabled) {
      background: #DC2626 !important;
      color: white !important;
    }

    /* Tables */
    .pst-wrapper table { border-collapse: collapse !important; font-size: 14px !important; width: 100% !important; min-width: 700px !important; }
    .pst-wrapper th { background: #F9FAFB !important; text-transform: uppercase !important; font-size: 14px !important; font-weight: 500 !important; letter-spacing: 0.03em; color: #9CA3AF !important; padding: 12px 16px !important; border-bottom: 1px solid #E5E7EB !important; text-align: left !important; }
    .pst-wrapper td { padding: 12px 16px !important; border-bottom: 1px solid #E5E7EB !important; color: #111827 !important; }
    .pst-wrapper tr { transition: background 150ms ease-in-out !important; }
    .pst-wrapper tr:hover td { background: #F9FAFB !important; }

    /* Inputs */
    .pst-wrapper input, .pst-wrapper select, .pst-wrapper textarea {
      height: 36px !important;
      border-radius: 8px !important;
      border: 1px solid #E5E7EB !important;
      padding: 0 12px !important;
      font-size: 14px !important;
      transition: all 150ms ease !important;
      box-sizing: border-box !important;
    }
    .pst-wrapper input:focus, .pst-wrapper select:focus, .pst-wrapper textarea:focus {
      outline: none !important; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,.1) !important;
    }

    /* Segmented Spinner */
    .segmented-spinner {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 4px solid transparent;
      border-top-color: #2563EB;
      border-right-color: #2563EB;
      border-bottom-color: #E5E7EB;
      border-left-color: #E5E7EB;
      animation: spin 1s infinite cubic-bezier(0.5, 0, 0.5, 1);
      margin: 48px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('list');

  // ─── In-app Toast Notification ───────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // ─── Inline Confirm Modal ─────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

  // Switch to contact tab if URL has ?tab=contact (e.g. from notification bell click)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'contact') setActiveTab('contact');
  }, [location.search]);



  // Tender List / Create
  const [tenders, setTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create Form
  const [newTender, setNewTender] = useState({
    title: '', category: '', description: '', termsConditions: '', openingDate: '', closingDate: ''
  });
  const [tenderItems, setTenderItems] = useState([
    { id: Date.now(), objectType: '', unit: '', quantity: 1 }
  ]);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [gpRequestId, setGpRequestId] = useState(null);

  // Smart auto-growing Terms & Conditions editor (grows when text increases,
  // shrinks when text decreases). Uses setProperty(..., 'important') so the
  // page's `textarea { height:36px !important }` rule does not win.
  const createTermsRef = useRef(null);
  const editTermsRef = useRef(null);
  const resizeTermsBox = (el) => {
    if (!el) return;
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('height', `${Math.min(el.scrollHeight, 320)}px`, 'important');
  };
  useEffect(() => { resizeTermsBox(createTermsRef.current); }, [newTender.termsConditions]);

  // Auto-fill from GP if navigated with state
  useEffect(() => {
    if (location.state?.prefill) {
      setNewTender({
        title: location.state.prefill.title || '',
        category: location.state.prefill.category || '',
        description: location.state.prefill.description || '',
        termsConditions: '',
        openingDate: '',
        closingDate: ''
      });
      setTenderItems([{
        id: Date.now(),
        objectType: location.state.prefill.item_name || '',
        unit: 'Pcs',
        quantity: location.state.prefill.quantity || 1,
        startPrice: location.state.prefill.starting_bid_price || ''
      }]);
      if (location.state.gpRequestId) {
        setGpRequestId(location.state.gpRequestId);
      }
      setActiveTab('create');
      // Clear state so reload doesn't trigger again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Evaluate
  const [selectedTender, setSelectedTender] = useState(null);
  const [bidsData, setBidsData] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [recommending, setRecommending] = useState(null);
  const [reasonModal, setReasonModal] = useState(null); // { bidId, name, bid }
  const [reasonText, setReasonText] = useState('');
  const [emailModal, setEmailModal] = useState(null); // { bid, tender }

  // Fund Requests
  const [fundRequests, setFundRequests] = useState([]);
  const [loadingFundRequests, setLoadingFundRequests] = useState(true);
  const [showCreateFund, setShowCreateFund] = useState(false);
  const [selectedTendersForFund, setSelectedTendersForFund] = useState([]);
  const [submittingFund, setSubmittingFund] = useState(false);
  const [viewFundRequest, setViewFundRequest] = useState(null); // for detail modal

  // ─── Edit Logic ────────────────────────────────────────────────────────────
  const [editingTender, setEditingTender] = useState(null); // { id, ...editable fields }
  useEffect(() => { resizeTermsBox(editTermsRef.current); }, [editingTender?.termsConditions]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const toDateInput = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const handleStartEdit = (t) => {
    setEditMsg('');
    setEditingTender({
      id: t.id,
      title: t.title || '',
      category: t.category || '',
      description: t.description || '',
      termsConditions: t.terms_conditions || '',
      openingDate: toDateInput(t.opening_date),
      closingDate: toDateInput(t.closing_date || t.closingDate)
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTender) return;
    if (!editingTender.title.trim()) { setEditMsg('⚠️ Tender title is required.'); return; }
    setSavingEdit(true);
    setEditMsg('');
    try {
      await api.put(`/public-tenders/internal/${editingTender.id}`, {
        title: editingTender.title,
        category: editingTender.category,
        description: editingTender.description,
        termsConditions: editingTender.termsConditions,
        openingDate: editingTender.openingDate,
        closingDate: editingTender.closingDate
      });
      showToast('✅ Tender updated (Terms & Conditions saved).', 'success');
      setEditingTender(null);
      fetchTenders();
    } catch (err) {
      setEditMsg('❌ ' + (err?.response?.data?.message || err.message || 'Error updating tender'));
    } finally { setSavingEdit(false); }
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchTenders(); fetchFundRequests(); }, []);

  const fetchTenders = async () => {
    setLoadingTenders(true);
    try {
      const res = await api.get('/public-tenders/internal');
      const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || res || []);
      setTenders(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingTenders(false); }
  };

  const fetchFundRequests = async () => {
    setLoadingFundRequests(true);
    try {
      const res = await api.get('/public-procurement/fund-requests');
      const list = res.data?.data || res.data || [];
      setFundRequests(Array.isArray(list) ? list : []);
    } catch (err) { console.error(err); }
    finally { setLoadingFundRequests(false); }
  };

  const loadBids = async (tender) => {
    setSelectedTender(tender);
    setLoadingBids(true);
    try {
      const res = await api.get(`/public-tenders/internal/${tender.id}/bids`);
      const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || res || []);
      setBidsData(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingBids(false); }
  };

  // Support deep-linking to view bids for a specific tender (from notification click)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewId = params.get('viewTender');
    if (viewId && tenders.length > 0 && !selectedTender) {
      const t = tenders.find(x => x.id === parseInt(viewId));
      if (t) {
        setActiveTab('list');
        loadBids(t);
      }
    }
  }, [location.search, tenders]);

  // ─── Create Logic ─────────────────────────────────────────────────────────
  const handleAddItem = () =>
    setTenderItems([...tenderItems, { id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }]);

  const handleRemoveItem = (id) =>
    setTenderItems(tenderItems.filter(i => i.id !== id));

  const handleItemChange = (id, field, value) =>
    setTenderItems(tenderItems.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/public-tenders/internal', {
        ...newTender,
        items: tenderItems.map(i => ({
          objectType: i.objectType,
          unit: i.unit,
          quantity: parseInt(i.quantity, 10),
          startPrice: parseFloat(i.startPrice || 0)
        }))
      });
      
      if (gpRequestId) {
        const tenderRef = res.data?.data?.tenderNumber || res.data?.data?.tender_number || res.data?.tenderNumber || null;
        if (tenderRef) {
          try {
            await api.put(`/general-procurement/requests/${gpRequestId}/complete-tender`, {
              tender_reference: tenderRef
            });
          } catch (_) { /* ignore */ }
        }
        setGpRequestId(null);
      }

      setCreateMsg('✅ Tender posted to public page!');
      setNewTender({ title: '', category: '', description: '', termsConditions: '', openingDate: '', closingDate: '' });
      setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
      setShowCreate(false);
      fetchTenders();
    } catch (err) {
      alert('Error creating tender: ' + (err.message || 'Unknown error'));
    } finally { setCreating(false); }
  };

  // ─── Build Gmail Compose URL ───────────────────────────────────────────────
  const buildGmailUrl = (bid, tender) => {
    const to = encodeURIComponent(bid.email || '');
    const subject = encodeURIComponent(
      `[SUTANA] Award Confirmation – Tender ${tender.tender_number}: ${tender.title}`
    );
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const body = encodeURIComponent(
`Dear ${bid.competitor_name},

We are pleased to inform you that SUTANA has selected your company as the WINNING SUPPLIER for the following tender:

────────────────────────────────────────
TENDER DETAILS
────────────────────────────────────────
Tender Number : ${tender.tender_number}
Tender Title  : ${tender.title}
Category      : ${tender.category || 'N/A'}
Award Date    : ${date}
────────────────────────────────────────

Your bid has been evaluated and approved by SUTANA's management. We look forward to working with you.

Please acknowledge receipt of this email and confirm your availability to proceed with the supply order within 3 working days.

For any inquiries, please contact our Procurement Department directly.

Best regards,

Procurement Department
SUTANA
📧 procurement@sutana.com

────────────────────────────────────────
This is an official award notification from SUTANA's procurement system.
────────────────────────────────────────`
    );
    return `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`;
  };

  // ─── Trigger Gmail Award Email ────────────────────────────────────────────
  const handleSendAwardEmail = (bid) => {
    if (!bid.email) {
      showToast('No email address found for this supplier.', 'error');
      return;
    }
    setEmailModal({ bid, tender: selectedTender });
  };

  // ─── Recommend Logic ──────────────────────────────────────────────────────
  const handleRecommend = async () => {
    if (!reasonModal) return;
    setRecommending(reasonModal.bidId);
    try {
      await api.put(`/public-tenders/internal/bids/${reasonModal.bidId}/recommend`, {
        reason: reasonText
      });
      // Automatically open Gmail
      if (reasonModal.bid && reasonModal.bid.email) {
        const url = buildGmailUrl(reasonModal.bid, selectedTender);
        window.open(url, '_blank', 'noopener,noreferrer');
        showToast('Recommendation saved! Opening Gmail...', 'success');
      } else {
        showToast('Recommendation saved successfully! No email address found to notify.', 'success');
      }
      setReasonModal(null);
      setReasonText('');
      await loadBids(selectedTender); // refresh
    } catch (err) {
      showToast('Error recommending supplier: ' + (err?.response?.data?.message || err.message), 'error');
    } finally { setRecommending(null); }
  };

  // ─── Close Tender ─────────────────────────────────────────────────────────
  const handleCloseTender = async (id) => {
    setConfirmModal({
      message: 'Close this tender? No more bids will be accepted.',
      onConfirm: async () => {
        try {
          await api.put(`/public-tenders/internal/${id}/close`);
          showToast('Tender closed successfully.', 'success');
          fetchTenders();
          if (selectedTender?.id === id) setSelectedTender(prev => ({ ...prev, status: 'closed' }));
        } catch (err) {
          showToast(err?.response?.data?.message || err.message, 'error');
        }
      }
    });
  };

  // ─── Submit to CEO ────────────────────────────────────────────────────────
  const handleSubmitCEO = async () => {
    setConfirmModal({
      message: `Submit evaluation for "${selectedTender?.title}" to CEO for final approval? The CEO will be notified immediately.`,
      onConfirm: async () => {
        try {
          await api.put(`/public-tenders/internal/${selectedTender.id}/submit-evaluation`);
          showToast('✅ Evaluation submitted to CEO successfully! CEO has been notified.', 'success');
          fetchTenders();
          setSelectedTender(null);
          setBidsData([]);
        } catch (err) {
          showToast('Failed to submit: ' + (err?.response?.data?.message || err.message), 'error');
        }
      }
    });
  };

  // ─── Submit Fund Request ──────────────────────────────────────────────────
  const handleCreateFundRequest = async () => {
    if (selectedTendersForFund.length === 0) return;
    setSubmittingFund(true);
    try {
      await api.post('/public-procurement/fund-requests', { tenderIds: selectedTendersForFund });
      showToast('Fund Request generated successfully! Sent to CEO.', 'success');
      setShowCreateFund(false);
      setSelectedTendersForFund([]);
      fetchFundRequests();
    } catch (err) {
      showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
    } finally { setSubmittingFund(false); }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: tenders.length,
    published: tenders.filter(t => t.status === 'published').length,
    closed: tenders.filter(t => t.status === 'closed').length,
    awarded: tenders.filter(t => t.status === 'awarded').length,
    totalBids: tenders.reduce((s, t) => s + Number(t.bids_count || 0), 0),
  };

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'list', label: 'Tender List', icon: <FileText size={15} />, count: stats.total },
    { id: 'create', label: 'Create Tender', icon: <PlusCircle size={15} /> },
    { id: 'evaluate', label: 'Evaluate Bids', icon: <BarChart2 size={15} />, count: stats.totalBids },
    { id: 'fund_requests', label: 'Fund Requests', icon: <Wallet size={15} />, count: stats.awarded },
    { id: 'history', label: 'History & Logs', icon: <Clock size={15} />, count: stats.awarded },
  ];

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit'
  };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px', color: '#334155' };

  return (
    <div className="pst-wrapper">
      <style>{customStyles}</style>
      <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px', color: '#0f172a' }}>
          Tender &amp; Bid Hub
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Manage tenders, collect supplier bids, run analytics, recommend winners and submit to CEO.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Tenders" value={stats.total} icon="📋" color="#0f172a" />
        <StatCard label="Published" value={stats.published} icon="🟢" color="#16a34a" sub="Open for bids" />
        <StatCard label="Closed" value={stats.closed} icon="🔒" color="#dc2626" />
        <StatCard label="Awarded" value={stats.awarded} icon="🏆" color="#7c3aed" />
        <StatCard label="Total Bids" value={stats.totalBids} icon="📨" color="#2563eb" sub="All time" />
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '6px', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
        {tabs.map(t => (
          <TabBtn key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}
            icon={t.icon} label={t.label} count={t.count} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: TENDER LIST
      ══════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="pst-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>All Tenders</h2>
            <button onClick={() => setActiveTab('create')} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <PlusCircle size={14} /> New Tender
            </button>
          </div>
          {loadingTenders ? (
            <div className="segmented-spinner"></div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Tender No.', 'Title', 'Category', 'Items', 'Bids', 'Opening', 'Closing', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenders.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '13px' }}>{t.tender_number || `TND-${t.id}`}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{t.title}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{t.category || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>{t.items?.length || 0}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ background: t.bids_count > 0 ? '#eff6ff' : '#f8fafc', color: t.bids_count > 0 ? '#2563eb' : '#94a3b8', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', fontSize: '13px' }}>
                        {t.bids_count}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {t.opening_date ? new Date(t.opening_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: t.closing_date && new Date(t.closing_date) < new Date() ? '#ef4444' : '#64748b', fontSize: '13px', fontWeight: t.closing_date && new Date(t.closing_date) < new Date() ? 700 : 400 }}>
                      {t.closing_date ? new Date(t.closing_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={t.status} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setSelectedTender(t); setActiveTab('evaluate'); loadBids(t); }}
                          style={{ padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          Evaluate
                        </button>
                        {(t.status === 'published' || t.status === 'draft') && (
                          <button onClick={() => handleStartEdit(t)}
                            style={{ padding: '5px 10px', background: '#fefce8', color: '#a16207', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            Edit
                          </button>
                        )}
                        {t.status === 'published' && (
                          <button onClick={() => handleCloseTender(t.id)}
                            style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {tenders.length === 0 && (
                  <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No tenders found. Create one to get started.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: CREATE TENDER
      ══════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="pst-card">
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={20} color="#3b82f6" /> Post New Public Tender
          </h2>
          <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: '14px' }}>
            Fill in the tender details. The tender will be immediately published to the public portal where suppliers can submit bids.
          </p>

          <form onSubmit={handleCreateSubmit}>
            {/* Tender Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Tender Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={newTender.title}
                  onChange={e => setNewTender({ ...newTender, title: e.target.value })}
                  style={inputStyle} placeholder="e.g., Procurement of Medical Supplies" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={newTender.category}
                  onChange={e => setNewTender({ ...newTender, category: e.target.value })}
                  style={inputStyle}>
                  <option value="">-- Select Category --</option>
                  {['Medical Supplies', 'IT Equipment', 'Office Supplies', 'Construction Materials',
                    'Laboratory Equipment', 'Pharmaceuticals', 'Logistics & Transport', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description / Guidelines</label>
                <textarea value={newTender.description}
                  onChange={e => setNewTender({ ...newTender, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Provide detailed guidelines, requirements, and any special conditions for suppliers..." />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>
                  Terms &amp; Conditions <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea ref={createTermsRef} value={newTender.termsConditions}
                  onChange={e => setNewTender({ ...newTender, termsConditions: e.target.value })}
                  className="pst-terms-box"
                  style={{ ...inputStyle, minHeight: '110px', resize: 'none', overflowY: 'auto', lineHeight: 1.6 }}
                  placeholder="Write the binding conditions suppliers must accept when bidding — e.g. payment terms, delivery commitments, quality/acceptance standards, warranty, penalties, governing rules… These are filled in once at post time; suppliers simply accept them on the public page." />
              </div>
              <div>
                <label style={labelStyle}>Opening Date</label>
                <input type="date" value={newTender.openingDate}
                  onChange={e => setNewTender({ ...newTender, openingDate: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Closing Date</label>
                <input type="date" value={newTender.closingDate}
                  onChange={e => setNewTender({ ...newTender, closingDate: e.target.value })}
                  style={inputStyle} />
              </div>

            </div>

            {/* Smart Table */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Tender Items</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Define items to procure. Suppliers will fill in their pricing on the public page.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', textAlign: 'left' }}>
                      {['No', 'Object Type', 'Unit', 'Quantity', 'Bid / Obj (Birr)', 'Bid / Obj (Cent)', 'Total (Birr)', 'Total (Cent)', 'Checkup', ''].map((h, i) => (
                        <th key={i} style={{ padding: '12px 14px', color: i <= 3 ? 'white' : '#94a3b8', fontWeight: 600, fontSize: '12px', fontStyle: i >= 4 && i <= 8 ? 'italic' : 'normal' }}>
                          {h}{i >= 4 && i <= 8 ? ' ← supplier fills' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tenderItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#94a3b8' }}>{index + 1}</td>
                        <td style={{ padding: '8px' }}>
                          <input required value={item.objectType}
                            onChange={e => handleItemChange(item.id, 'objectType', e.target.value)}
                            style={{ ...inputStyle, minWidth: '160px' }} placeholder="e.g., Laptop" />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input required value={item.unit}
                            onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                            style={{ ...inputStyle, width: '80px' }} placeholder="Pcs" />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" min="1" required value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                            style={{ ...inputStyle, width: '80px' }} />
                        </td>

                        {[...Array(5)].map((_, ci) => (
                          <td key={ci} style={{ padding: '8px', background: '#f8fafc' }}>
                            <input disabled style={{ ...inputStyle, background: 'transparent', border: '1px dashed #cbd5e1', cursor: 'not-allowed', width: '80px' }} placeholder="—" />
                          </td>
                        ))}
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {tenderItems.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start' }}>
                <button type="button" onClick={handleAddItem}
                  style={{ padding: '8px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <PlusCircle size={14} /> Add Item
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', borderTop: '1px solid #f1f5f9', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {createMsg && (
                <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <CheckCircle size={16} /> {createMsg}
                </div>
              )}
              <button type="submit" disabled={creating}
                style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                {creating ? '⏳ Posting...' : '🚀 Post Tender to Public Page'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: EVALUATE BIDS
      ══════════════════════════════════════════════════ */}
      {activeTab === 'evaluate' && (
        <div className="pst-card" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} color="#3b82f6" /> Evaluate Bids
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Click a tender row to open its evaluation detail below it.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Tender No.', 'Title', 'Category', 'Items', 'Bids', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenders.map(t => (
                  <React.Fragment key={t.id}>
                    <tr
                      onClick={() => {
                        if (selectedTender?.id === t.id) {
                          setSelectedTender(null);
                          setBidsData([]);
                        } else {
                          loadBids(t);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        borderBottom: selectedTender?.id === t.id ? 'none' : '1px solid #f1f5f9',
                        background: selectedTender?.id === t.id ? '#eff6ff' : 'white'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '13px' }}>{t.tender_number || `TND-${t.id}`}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{t.title}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{t.category || '—'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>{t.items?.length || 0}</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ background: t.bids_count > 0 ? '#eff6ff' : '#f8fafc', color: t.bids_count > 0 ? '#2563eb' : '#94a3b8', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', fontSize: '13px' }}>
                          {t.bids_count}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8' }}>
                        <ChevronDown size={16} style={{ transform: selectedTender?.id === t.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </td>
                    </tr>

                    {selectedTender?.id === t.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ padding: '20px', background: '#f8fafc' }}>
                            {/* Bids Evaluation Detail */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                              {/* Header */}
                              <div className="pst-card">
                                <div>
                                  <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, fontFamily: 'monospace', marginBottom: '4px' }}>{selectedTender.tender_number || `TND-${selectedTender.id}`}</div>
                                  <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{selectedTender.title}</h2>
                                  <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {selectedTender.category && <span>🏷️ {selectedTender.category}</span>}
                                    {selectedTender.closing_date && <span>📅 Closes: {new Date(selectedTender.closing_date).toLocaleDateString()}</span>}
                                    <StatusBadge status={selectedTender.status} />
                                  </div>
                                </div>
                                {selectedTender.terms_conditions && (
                                  <div style={{
                                    marginTop: '14px', padding: '14px 16px', background: '#fffbeb',
                                    border: '1px solid #fde68a', borderRadius: '10px', fontSize: '13px', color: '#78350f', lineHeight: 1.65
                                  }}>
                                    <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                                      <FileText size={13} /> Terms &amp; Conditions Suppliers Accepted
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{selectedTender.terms_conditions}</div>
                                  </div>
                                )}
                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                                  {selectedTender.status === 'awarded' && !selectedTender.purchase_read && (
                                    <button onClick={async () => {
                                      try {
                                        await api.post('/erp/purchase-mark-read', { id: selectedTender.id });
                                        showToast('Marked as read', 'success');
                                        setSelectedTender(prev => ({ ...prev, purchase_read: 1 }));
                                        setTenders(prev => prev.map(t => t.id === selectedTender.id ? { ...t, purchase_read: 1 } : t));
                                        window.dispatchEvent(new Event('refreshNotifications'));
                                      } catch (err) {
                                        showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
                                      }
                                    }}
                                      style={{ padding: '9px 18px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <CheckCircle size={14} /> Mark as Read
                                    </button>
                                  )}
                                  {selectedTender.status === 'published' && (
                                    <button onClick={() => handleCloseTender(selectedTender.id)}
                                      style={{ padding: '9px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                                      🔒 Close Tender
                                    </button>
                                  )}
                                  {/* Submit to CEO — only enabled if all winner/recommended bids have Finance confirmed */}
                                  {(() => {
                                    const allBids = bidsData.flatMap(g => g.bids || []);
                                    const awardedBids = allBids.filter(b => ['winner', 'recommended'].includes((b.bid_status || '').toLowerCase()));
                                    const allFinanceConfirmed = awardedBids.length > 0 && awardedBids.every(b => b.payment_status === 'confirmed');
                                    const canSubmit = allFinanceConfirmed;
                                    return (
                                      <button
                                        onClick={canSubmit ? handleSubmitCEO : () => showToast('⏳ Cannot submit yet. Finance must confirm payment for all recommended/winner bids first.', 'error')}
                                        style={{
                                          padding: '9px 18px',
                                          background: canSubmit ? 'linear-gradient(135deg, #10b981, #059669)' : '#e2e8f0',
                                          color: canSubmit ? 'white' : '#94a3b8',
                                          border: 'none', borderRadius: '8px', fontWeight: 700,
                                          cursor: canSubmit ? 'pointer' : 'not-allowed',
                                          fontSize: '13px',
                                          boxShadow: canSubmit ? '0 3px 10px rgba(16,185,129,0.3)' : 'none',
                                          display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                        title={canSubmit ? 'Submit to CEO for final approval' : 'Finance must confirm payment for all winner/recommended bids first'}
                                      >
                                        {canSubmit ? '✅' : '🔒'} Submit to CEO
                                        {!canSubmit && <span style={{ fontSize: '11px', fontWeight: 500 }}>(Awaiting Finance)</span>}
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>

                              {loadingBids ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                  <div className="segmented-spinner"></div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                  {bidsData.map(group => {
                                    const { tenderItem, bids, analytics } = group;
                                    return (
                                      <div key={tenderItem.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                        {/* Item Header */}
                                        <div style={{ background: '#ffffff', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                                          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</span>
                                          <h3 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: '17px', fontWeight: 700 }}>
                                            {tenderItem.object_type}
                                          </h3>
                                          <span style={{ fontSize: '12px', color: '#475569' }}>
                                            Qty: {tenderItem.quantity} {tenderItem.unit}
                                          </span>
                                        </div>

                                        {/* Analytics strip — full width, evenly spread (not right side only) */}
                                        {analytics && bids.length > 0 && (
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                            {[
                                              { label: 'Lowest', value: analytics.lowest?.toFixed(2), icon: <TrendingDown size={14} />, color: '#059669' },
                                              { label: 'Average', value: analytics.average?.toFixed(2), icon: <Minus size={14} />, color: '#b45309' },
                                              { label: 'Highest', value: analytics.highest?.toFixed(2), icon: <TrendingUp size={14} />, color: '#dc2626' },
                                              { label: 'Variance', value: analytics.variance?.toFixed(2), icon: <BarChart2 size={14} />, color: '#7c3aed' },
                                            ].map(m => (
                                              <div key={m.label} style={{ background: '#fff', padding: '10px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{m.label}</div>
                                                <div style={{ color: m.color, fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', overflowWrap: 'anywhere' }}>
                                                  {m.icon} {m.value}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Bids Table — scrollable horizontally within its container */}
                                        <div style={{ overflowX: 'auto', width: '100%' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'auto', minWidth: '0' }}>
                                            <thead>
                                              <tr style={{ background: '#f8fafc' }}>
                                                {['Rank', 'Supplier', 'Email / Phone', 'Price (Birr.Cent)', 'Total (Birr.Cent)', 'Delivery', 'Payment Terms', 'Payment Method', 'Status', 'Finance', 'Action'].map(h => (
                                                  <th key={h} style={{ padding: '10px 8px', fontWeight: 600, color: '#64748b', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'normal', textAlign: 'center' }}>{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {bids.length === 0 ? (
                                                <tr><td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No bids for this product yet.</td></tr>
                                              ) : (
                                                bids.map((bid, idx) => (
                                                  <tr key={bid.id} style={{
                                                    background: bid.bid_status === 'recommended' ? '#f0fdf4' : idx === 0 ? '#fefce8' : 'white',
                                                    borderBottom: '1px solid #f1f5f9'
                                                  }}>
                                                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                                                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}th`}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{bid.competitor_name}</td>
                                                    <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '12px', overflowWrap: 'break-word' }}>
                                                      <div>{bid.email || '—'}</div>
                                                      <div>{bid.phone || '—'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                                                      {bid.price_birr}.{String(bid.price_cent || 0).padStart(2, '0')}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>
                                                      {bid.total_birr}.{String(bid.total_cent || 0).padStart(2, '0')}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{bid.delivery_time || '—'}</td>
                                                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{bid.payment_terms || '—'}</td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                      {bid.payment_method ? (() => {
                                                        const isTelebirr = bid.payment_method.startsWith('Telebirr');
                                                        const isBank = bid.payment_method.startsWith('Bank Transfer');
                                                        const parts = bid.payment_method.split('::');
                                                        const methodLabel = parts[0];
                                                        const accNum = parts.length > 1 ? `#${parts[1]}` : '';
                                                        return (
                                                          <span style={{
                                                            display: 'inline-flex', flexDirection: 'column', gap: '2px',
                                                            padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                                            background: isTelebirr ? '#FEF3C7' : isBank ? '#E0F2FE' : '#F3F4F6',
                                                            color: isTelebirr ? '#D97706' : isBank ? '#0284C7' : '#475569'
                                                          }}>
                                                            <span>{isTelebirr ? '📱' : isBank ? '🏦' : '📄'} {methodLabel}</span>
                                                            {accNum && <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '10px', opacity: 0.85 }}>[Acct {accNum}]</span>}
                                                          </span>
                                                        );
                                                      })() : '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}><BidStatusBadge status={bid.bid_status} /></td>
                                                    <td style={{ padding: '12px 14px' }}><PaymentStatusBadge status={bid.payment_status} /></td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {bid.bid_status === 'winner' ? (
                                                          <>
                                                            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>🏆 Winner</span>
                                                            <button
                                                              onClick={() => handleSendAwardEmail(bid)}
                                                              style={{ padding: '5px 10px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                              <Mail size={11} /> Send Award Email
                                                            </button>
                                                          </>
                                                        ) : bid.bid_status !== 'recommended' ? (
                                                          <button onClick={() => setReasonModal({ bidId: bid.id, name: bid.competitor_name, bid: bid })}
                                                            style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Star size={12} /> Recommend
                                                          </button>
                                                        ) : (
                                                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>✅ Recommended</span>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {bidsData.length === 0 && (
                                    <div style={{ background: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>
                                      No product items found in this tender.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {tenders.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No tenders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: FUND REQUESTS
      ══════════════════════════════════════════════════ */}
      {activeTab === 'fund_requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="pst-card">
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#db2777" /> Fund Requests
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Bundle awarded tenders and request funds from the CEO.</p>
            </div>
            <button onClick={() => setShowCreateFund(!showCreateFund)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #db2777, #be185d)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', boxShadow: '0 3px 10px rgba(219,39,119,0.3)' }}>
              <PlusCircle size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Create Fund Request
            </button>
          </div>

          {showCreateFund && (() => {
            const alreadyRequestedTenderIds = new Set(fundRequests.flatMap(r => (r.items || []).map(i => i.public_tender_id)));
            const availableAwardedTenders = tenders.filter(t => t.status === 'awarded' && !alreadyRequestedTenderIds.has(t.id));
            
            return (
            <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#9d174d' }}>Select Awarded Tenders</h3>
              {availableAwardedTenders.length === 0 ? (
                <p style={{ color: '#be185d', fontSize: '13px' }}>No awarded tenders available to request funds for (either none awarded, or all already requested).</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {availableAwardedTenders.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '14px', borderRadius: '8px', border: '1px solid #fbcfe8', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedTendersForFund.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTendersForFund([...selectedTendersForFund, t.id]);
                          else setSelectedTendersForFund(selectedTendersForFund.filter(id => id !== t.id));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#db2777' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.tender_number || `TND-${t.id}`} - {t.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Winner selected. Ready for funding.</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleCreateFundRequest} disabled={selectedTendersForFund.length === 0 || submittingFund} style={{ padding: '10px 20px', background: '#db2777', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: selectedTendersForFund.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedTendersForFund.length === 0 || submittingFund ? 0.6 : 1 }}>
                  {submittingFund ? 'Submitting...' : 'Submit Request'}
                </button>
                <button onClick={() => setShowCreateFund(false)} style={{ padding: '10px 20px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
            );
          })()}

          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Request No.', 'Total Amount', 'Status', 'Date', 'Included Tenders', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingFundRequests ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                ) : fundRequests.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No fund requests created yet.</td></tr>
                ) : (
                  fundRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{req.request_code}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                        ETB {Number(req.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          background: req.status === 'APPROVED' || req.status === 'READY_FOR_PAYMENT' ? '#dcfce7' : req.status === 'REJECTED' ? '#fee2e2' : req.status === 'PENDING_CEO' ? '#fef9c3' : '#f1f5f9',
                          color: req.status === 'APPROVED' || req.status === 'READY_FOR_PAYMENT' ? '#166534' : req.status === 'REJECTED' ? '#991b1b' : req.status === 'PENDING_CEO' ? '#854d0e' : '#475569'
                        }}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>
                        {req.items?.map(i => <div key={i.id}>• {i.tender_title} ({i.supplier})</div>)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button
                          onClick={() => setViewFundRequest(req)}
                          style={{ padding: '7px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '7px', fontWeight: 600, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: HISTORY & LOGS
      ══════════════════════════════════════════════════ */}

      {activeTab === 'history' && (
        <div className="pst-card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Historical Archival &amp; Logs</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Completed and awarded tenders with full audit trail.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                {['Tender No.', 'Title', 'Category', 'Items', 'Total Bids', 'Completion Date', 'Final Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenders.filter(t => ['awarded', 'closed', 'awaiting_ceo_approval'].includes(t.status)).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace', fontSize: '13px' }}>{t.tender_number || `TND-${t.id}`}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{t.title}</td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{t.category || '—'}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>{t.items?.length || 0}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>{t.bids_count || 0}</td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(t.updated_at).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
              {tenders.filter(t => ['awarded', 'closed', 'awaiting_ceo_approval'].includes(t.status)).length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No completed tenders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}




      {/* ══════════════════════════════════════════════════
          MODAL: Recommend Reason
      ══════════════════════════════════════════════════ */}
      {reasonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '36px', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
              <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '20px' }}>Recommend Supplier</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                You are recommending <strong>{reasonModal.name}</strong> as the best supplier.
              </p>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Justification / Reason <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                value={reasonText} onChange={e => setReasonText(e.target.value)} rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="e.g., Lowest price with same delivery time. Excellent track record with SUTANA..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setReasonModal(null); setReasonText(''); }}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
                Cancel
              </button>
              <button onClick={handleRecommend} disabled={!reasonText.trim() || !!recommending}
                style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: !reasonText.trim() ? 0.6 : 1 }}>
                {recommending ? '⏳ Saving...' : '✅ Confirm Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* ══════════════════════════════════════════════════
        MODAL: Award Email Preview
    ══════════════════════════════════════════════════ */}
    {emailModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(6px)', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px' }}>AWARD NOTIFICATION EMAIL</div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 800 }}>Send to: {emailModal.bid.competitor_name}</h3>
              <div style={{ color: '#6ee7b7', fontSize: '13px', marginTop: '4px' }}>📧 {emailModal.bid.email}</div>
            </div>
            <button onClick={() => setEmailModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <X size={18} />
            </button>
          </div>

          {/* Email Preview Body */}
          <div style={{ padding: '24px 28px', maxHeight: '420px', overflowY: 'auto' }}>
            <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`Dear ${emailModal.bid.competitor_name},

We are pleased to inform you that SUTANA has selected your company as the WINNING SUPPLIER for the following tender:

────────────────────────────────────────
TENDER DETAILS
────────────────────────────────────────
Tender Number : ${emailModal.tender?.tender_number}
Tender Title  : ${emailModal.tender?.title}
Category      : ${emailModal.tender?.category || 'N/A'}
Award Date    : ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
────────────────────────────────────────

Your bid has been evaluated and approved by SUTANA's management. We look forward to working with you.

Please acknowledge receipt of this email and confirm your availability to proceed within 3 working days.

For any inquiries, contact our Procurement Department.

Best regards,

Procurement Department
SUTANA
📧 procurement@sutana.com

────────────────────────────────────────
Official award notification from SUTANA's procurement system.
────────────────────────────────────────`}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1 }}>⚡ Gmail will open with this message pre-filled. Just click Send!</span>
            <button onClick={() => setEmailModal(null)}
              style={{ padding: '10px 20px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>
              Cancel
            </button>
            <button
              onClick={() => {
                const url = buildGmailUrl(emailModal.bid, emailModal.tender);
                window.open(url, '_blank');
                setEmailModal(null);
                showToast(`Gmail opened for ${emailModal.bid.competitor_name}. Click Send in Gmail to complete!`, 'success');
              }}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
              <Mail size={16} /> Open Gmail & Send
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════════════════════════════════════════════════
        INLINE CONFIRM MODAL
    ══════════════════════════════════════════════════ */}
    {confirmModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <AlertCircle size={48} color="#f59e0b" />
          </div>
          <h3 style={{ margin: '0 0 12px', fontWeight: 800, fontSize: '20px' }}>Confirm Action</h3>
          <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
            {confirmModal.message}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setConfirmModal(null)}
              style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
              Cancel
            </button>
            <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
              style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════════════════════════════════════════════════
        MODAL: EDIT TENDER (incl. Terms & Conditions)
    ══════════════════════════════════════════════════ */}
    {editingTender && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1150, backdropFilter: 'blur(4px)', padding: '24px', overflowY: 'auto' }}>
        <div style={{ background: 'white', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '720px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#3b82f6" /> Edit Published Tender
            </h3>
            <button onClick={() => setEditingTender(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tender Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={editingTender.title}
                onChange={e => setEditingTender({ ...editingTender, title: e.target.value })}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={editingTender.category}
                onChange={e => setEditingTender({ ...editingTender, category: e.target.value })}
                style={inputStyle}>
                <option value="">-- Select Category --</option>
                {['Medical Supplies', 'IT Equipment', 'Office Supplies', 'Construction Materials',
                  'Laboratory Equipment', 'Pharmaceuticals', 'Logistics & Transport', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Closing Date</label>
              <input type="date" value={editingTender.closingDate}
                onChange={e => setEditingTender({ ...editingTender, closingDate: e.target.value })}
                style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description / Guidelines</label>
              <textarea value={editingTender.description}
                onChange={e => setEditingTender({ ...editingTender, description: e.target.value })}
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>
                Terms &amp; Conditions <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea ref={editTermsRef} value={editingTender.termsConditions}
                onChange={e => setEditingTender({ ...editingTender, termsConditions: e.target.value })}
                className="pst-terms-box"
                style={{ ...inputStyle, minHeight: '110px', resize: 'none', overflowY: 'auto', lineHeight: 1.6 }}
                placeholder="Conditions suppliers must accept before bidding. Save to update the public Compete & Sell page immediately." />
            </div>
          </div>

          {editMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, fontSize: '13px',
              background: editMsg.startsWith('❌') ? '#fef2f2' : '#dcfce7', color: editMsg.startsWith('❌') ? '#991b1b' : '#166534', border: `1px solid ${editMsg.startsWith('❌') ? '#fecaca' : '#bbf7d0'}` }}>
              {editMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <button onClick={() => setEditingTender(null)}
              style={{ padding: '11px 22px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={savingEdit || !editingTender.title.trim()}
              style={{ padding: '11px 26px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: savingEdit || !editingTender.title.trim() ? 0.6 : 1 }}>
              <Save size={16} /> {savingEdit ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══════════════════════════════════════════════════
        TOAST NOTIFICATIONS
    ══════════════════════════════════════════════════ */}
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#fef2f2' : t.type === 'success' ? '#f0fdf4' : 'white',
          border: `1px solid ${t.type === 'error' ? '#fecaca' : t.type === 'success' ? '#bbf7d0' : '#e2e8f0'}`,
          color: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#166534' : '#0f172a',
          padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: 12, minWidth: '300px', maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out forwards', pointerEvents: 'auto'
        }}>
          {t.type === 'error' ? <XCircle size={20} color="#dc2626" /> : t.type === 'success' ? <CheckCircle size={20} color="#16a34a" /> : <Info size={20} color="#3b82f6" />}
          <span style={{ fontSize: '14px', fontWeight: 600, flex: 1, lineHeight: '1.4' }}>{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
            <X size={16} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>

    {/* ══════════════════════════════════════════════════
        MODAL: Fund Request Details (Purchase View)
    ══════════════════════════════════════════════════ */}
    {viewFundRequest && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(4px)', padding: '24px', overflowY: 'auto' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#db2777" /> Fund Request Details
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{viewFundRequest.request_code} • {new Date(viewFundRequest.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setViewFundRequest(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>×</button>
          </div>

          {/* Summary */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '18px' }}>ETB {Number(viewFundRequest.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
              <span style={{
                padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                background: viewFundRequest.status === 'APPROVED' || viewFundRequest.status === 'READY_FOR_PAYMENT' ? '#dcfce7' : viewFundRequest.status === 'REJECTED' ? '#fee2e2' : viewFundRequest.status === 'PENDING_CEO' ? '#fef9c3' : '#f1f5f9',
                color: viewFundRequest.status === 'APPROVED' || viewFundRequest.status === 'READY_FOR_PAYMENT' ? '#166534' : viewFundRequest.status === 'REJECTED' ? '#991b1b' : viewFundRequest.status === 'PENDING_CEO' ? '#854d0e' : '#475569'
              }}>
                {viewFundRequest.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Tender Items */}
          <h4 style={{ margin: '0 0 14px', fontSize: '15px', color: '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            📦 Included Awarded Tenders
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {viewFundRequest.items?.map(item => (
              <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>{item.tender_title}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Supplier: <span style={{ fontWeight: 600, color: '#334155' }}>{item.supplier}</span></div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '15px' }}>
                    ETB {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {item.products && item.products.length > 0 ? (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Item Name</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Unit Price (ETB)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Total (ETB)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.products.map((prod, idx) => {
                          const totalAmount = (prod.total_birr || 0) + ((prod.total_cent || 0) / 100);
                          const unitPrice = (prod.price_birr || 0) + ((prod.price_cent || 0) / 100);
                          return (
                            <tr key={idx} style={{ borderBottom: idx !== item.products.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                              <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 500 }}>{prod.item_name}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{prod.quantity}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{Number(unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>{Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                        <tr>
                          <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>Subtotal:</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {Number(item.products.reduce((acc, p) => acc + (p.total_birr || 0) + ((p.total_cent || 0) / 100), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No itemized products found.</div>
                )}
              </div>
            ))}
          </div>

          {/* Status banner */}
          <div style={{ padding: '14px 16px', borderRadius: '10px', background: viewFundRequest.status === 'PENDING_CEO' ? '#fef9c3' : viewFundRequest.status === 'APPROVED' ? '#dcfce7' : viewFundRequest.status === 'REJECTED' ? '#fee2e2' : '#eff6ff', border: `1px solid ${viewFundRequest.status === 'PENDING_CEO' ? '#fde68a' : viewFundRequest.status === 'APPROVED' ? '#bbf7d0' : viewFundRequest.status === 'REJECTED' ? '#fecaca' : '#bfdbfe'}`, fontSize: '13px', fontWeight: 600, color: viewFundRequest.status === 'PENDING_CEO' ? '#92400e' : viewFundRequest.status === 'APPROVED' ? '#166534' : viewFundRequest.status === 'REJECTED' ? '#991b1b' : '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewFundRequest.status === 'PENDING_CEO' && '⏳ Awaiting CEO approval. The CEO will approve or reject this fund request.'}
            {viewFundRequest.status === 'APPROVED' && '✅ CEO Approved. Finance is processing the budget verification.'}
            {viewFundRequest.status === 'READY_FOR_PAYMENT' && '💰 Finance verified budget. Payment is being processed.'}
            {viewFundRequest.status === 'REJECTED' && '❌ Request was rejected. Please check with CEO for reasons.'}
            {!['PENDING_CEO','APPROVED','READY_FOR_PAYMENT','REJECTED'].includes(viewFundRequest.status) && `ℹ️ Status: ${viewFundRequest.status}`}
          </div>
        </div>
      </div>
    )}

    </div>


    </div>
  );
};

export default PurchaseSmartTenders;
