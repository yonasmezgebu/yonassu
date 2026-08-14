import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/apiClient';
import {
  Award, CheckCircle, XCircle, Download, Eye, Users, Check,
  RefreshCw, Package, Info, X, AlertCircle, TrendingDown,
  Minus, TrendingUp, BarChart2, Star, Wallet, Leaf, Clock
} from 'lucide-react';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  forestGreen:  '#228B22',
  darkGreen:    '#1B5E20',
  emerald:      '#2E8B57',
  leafGreen:    '#4CAF50',
  sage:         '#A5D6A7',
  olive:        '#6B8E23',
  mint:         '#E8F5E9',
  lime:         '#8BC34A',
  earthBrown:   '#8D6E63',
  skyBlue:      '#87CEEB',
  white:        '#FFFFFF',
  lightGray:    '#F5F5F5',
  darkGray:     '#424242',
  orange:       '#FF9800',
  red:          '#F44336',
};

const CEOTenderManager = ({ isApprovalMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || (isApprovalMode ? 'Awaiting CEO' : 'Open');
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewTender, setViewTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [selectedBids, setSelectedBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);

  // Sales module bids (from the Sales Manager flow)
  const [salesTenders, setSalesTenders] = useState([]);
  const [loadingSalesTenders, setLoadingSalesTenders] = useState(false);
  const [viewSalesTender, setViewSalesTender] = useState(null);
  const [salesBids, setSalesBids] = useState([]);
  const [loadingSalesBids, setLoadingSalesBids] = useState(false);
  const [ceoApproving, setCeoApproving] = useState(false);
  const [selectedSalesBids, setSelectedSalesBids] = useState([]);
  const [detailModalBidCeo, setDetailModalBidCeo] = useState(null);

  // Fund Requests
  const [fundRequests, setFundRequests] = useState([]);
  const [loadingFundRequests, setLoadingFundRequests] = useState(false);
  const [viewFundRequest, setViewFundRequest] = useState(null);
  const [confirmApproveFund, setConfirmApproveFund] = useState(null);
  const [approvingFund, setApprovingFund] = useState(false);

  // ─── In-app Toast Notification ───────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // ─── Inline Confirm Modal ─────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState(null);

  // Sync tab from URL changes
  useEffect(() => {
    const tab = getTabFromUrl();
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/public-tenders/internal');
      const data = res?.data?.data || res?.data || [];
      setTenders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch tenders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFundRequests = useCallback(async () => {
    try {
      setLoadingFundRequests(true);
      const res = await api.get('/public-procurement/fund-requests');
      setFundRequests(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load fund requests', err);
    } finally {
      setLoadingFundRequests(false);
    }
  }, []);

  const handleApproveFundRequest = async (id) => {
    try {
      setApprovingFund(true);
      await api.put(`/public-procurement/fund-requests/${id}/approve`);
      showToast('Fund Request approved and forwarded to Finance!', 'success');
      setConfirmApproveFund(null);
      setViewFundRequest(null);
      fetchFundRequests();
    } catch (err) {
      showToast('Error approving Fund Request: ' + (err?.response?.data?.message || err.message), 'error');
    } finally {
      setApprovingFund(false);
    }
  };



  const fetchSalesTenders = useCallback(async () => {
    try {
      setLoadingSalesTenders(true);
      const res = await api.get('/tenders');
      const data = res?.data?.data || res?.data || [];
      setSalesTenders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load sales tenders', err);
    } finally {
      setLoadingSalesTenders(false);
    }
  }, []);

  useEffect(() => {
    fetchTenders();
    fetchFundRequests();
    fetchSalesTenders();
  }, [fetchTenders, fetchFundRequests, fetchSalesTenders]);

  // Auto-open tender from notification deep link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewTenderId = params.get('viewTender');
    if (viewTenderId && tenders.length > 0 && !viewTender) {
      const t = tenders.find(x => x.id === parseInt(viewTenderId));
      if (t) {
        setActiveTab('Open');
        handleViewTender(t);
      }
    }
  }, [location.search, tenders, viewTender]);

  const fetchSalesBids = async (tenderId) => {
    try {
      setLoadingSalesBids(true);
      const res = await api.get(`/tenders/${tenderId}/bids`);
      const data = res?.data?.data || res?.data || [];
      setSalesBids(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load sales bids', err);
      setSalesBids([]);
    } finally {
      setLoadingSalesBids(false);
    }
  };

  const handleViewSalesTender = async (t) => {
    setViewSalesTender(t);
    setSalesBids([]);
    await fetchSalesBids(t.id);
  };

  const handleCeoApprove = async (bidId, approved) => {
    try {
      setCeoApproving(true);
      const res = await api.post(`/tenders/${viewSalesTender.id}/bids/ceo-approve`, {
        approvals: [{ bidId, approved }]
      });
      if (res.status === 200 || res.data?.status === 'success') {
        showToast(approved ? 'Bid approved successfully.' : 'Bid rejected successfully.', approved ? 'success' : 'error');
        await fetchSalesBids(viewSalesTender.id);
        fetchSalesTenders();
      }
    } catch (err) {
      showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
    } finally {
      setCeoApproving(false);
    }
  };

  const handleCeoApproveAll = async () => {
    try {
      setCeoApproving(true);
      let tenderItems = [];
      try { tenderItems = typeof viewSalesTender.items === 'string' ? JSON.parse(viewSalesTender.items) : (viewSalesTender.items || []); } catch (_) {}

      let approvals = [];
      if (tenderItems.length > 0) {
        tenderItems.forEach((item, itemIdx) => {
          const productBids = salesBids.map(bid => {
            let bidItems = [];
            try { bidItems = typeof bid.items === 'string' ? JSON.parse(bid.items) : (bid.items || []); } catch (_) {}
            const matched = bidItems.find((bi, i) => i === itemIdx || bi.objectType === item.objectType);
            const bidPrice = matched ? (parseFloat(matched.bidPriceBirr || 0) + parseFloat(matched.bidPriceCent || 0) / 100) : 0;
            return { ...bid, productBidPrice: bidPrice };
          }).filter(b => b.productBidPrice > 0).sort((a, b2) => b2.productBidPrice - a.productBidPrice);

          if (productBids.length > 0) {
            approvals.push({ bidId: productBids[0].id, approved: true });
          }
        });
      } else {
        const sorted = [...salesBids].sort((a, b2) => parseFloat(b2.total_bid_value || 0) - parseFloat(a.total_bid_value || 0));
        if (sorted.length > 0) approvals.push({ bidId: sorted[0].id, approved: true });
      }

      if (!approvals.length) { showToast('No bids to approve', 'error'); return; }
      const res = await api.post(`/tenders/${viewSalesTender.id}/bids/ceo-approve`, { approvals });
      if (res.status === 200 || res.data?.status === 'success') {
        showToast('All top-ranked winners approved!', 'success');
        await fetchSalesBids(viewSalesTender.id);
        fetchSalesTenders();
      }
    } catch (err) {
      showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
    } finally {
      setCeoApproving(false);
    }
  };

  const handleViewTender = async (tender) => {
    setViewTender(tender);
    setBids([]);
    setSelectedBids([]);
    setLoadingBids(true);
    try {
      const res = await api.get(`/public-tenders/internal/${tender.id}/bids`);
      const itemGroups = res?.data?.data || res?.data || [];
      if (tender.status === 'awaiting_ceo_approval') {
        const autoSelected = [];
        itemGroups.forEach(group => {
          (group.bids || []).forEach(bid => {
            if (bid.bid_status === 'recommended') {
              autoSelected.push(bid.id || bid.public_bid_id);
            }
          });
        });
        setSelectedBids(autoSelected);
      }
      setBids(itemGroups);
    } catch (err) {
      console.error('Failed to load bids', err);
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleApprove = async (tender) => {
    if (selectedBids.length === 0) return showToast('Please select at least one bid to award', 'error');
    setConfirmModal({
      message: `Approve and AWARD Tender ${tender.tender_number} to the selected bidder(s)? This decision will be sent back to Purchase and Finance.`,
      onConfirm: async () => {
        try {
          setApproving(true);
          await api.put(`/public-tenders/internal/${tender.id}/approve`, { bidIds: selectedBids });
          showToast('Tender awarded successfully! Finance and Purchase have been notified.', 'success');
          fetchTenders();
          setViewTender(null);
        } catch (err) {
          showToast('Failed to approve tender: ' + (err?.response?.data?.message || err.message), 'error');
        } finally {
          setApproving(false);
        }
      }
    });
  };

  const handleRejectAll = async () => {
    if (!rejectReason.trim()) return showToast('Rejection reason is required', 'error');
    try {
      await api.put(`/public-tenders/internal/${viewTender.id}/close`);
      showToast(`Tender ${rejectId} bids rejected. Tender closed.`, 'success');
    } catch (_) {}
    setRejectId(null);
    setRejectReason('');
    setViewTender(null);
    fetchTenders();
  };

  const handleMarkAsRead = async (tender) => {
    try {
      await api.post('/erp/ceo-mark-read', { type: 'tender', id: tender.id });
      await api.post('/erp/ceo-mark-read', { type: 'bid_all' });
      window.dispatchEvent(new Event('refreshNotifications'));
      showToast('Notification cleared — tender removed from notification bell.', 'success');
    } catch (err) {
      showToast('Failed to mark as read: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const getStatusStyle = (status) => {
    const map = {
      published: { bg: C.mint, col: C.darkGreen, label: 'OPEN' },
      closed: { bg: C.lightGray, col: C.darkGray, label: 'CLOSED' },
      awaiting_ceo_approval: { bg: '#FFF3E0', col: C.orange, label: 'AWAITING CEO' },
      awarded: { bg: C.sage, col: C.darkGreen, label: 'AWARDED' },
    };
    return map[status] || { bg: C.lightGray, col: C.darkGray, label: (status || '').toUpperCase() };
  };

  const combinedTenders = [
    ...tenders.map(t => ({ ...t, _type: 'internal' })),
    ...salesTenders.filter(t => ['awaiting_ceo_approval', 'awarded'].includes(t.status)).map(t => ({ ...t, _type: 'sales' }))
  ];

  const filteredTenders = combinedTenders.filter(t => {
    if (activeTab === 'All Tenders') return true;
    if (activeTab === 'Awaiting CEO') return t.status === 'awaiting_ceo_approval';
    if (activeTab === 'Open') return t.status === 'published' || t.status === 'open';
    if (activeTab === 'Awarded') return t.status === 'awarded';
    return true;
  });

  const awaitingCount = combinedTenders.filter(t => t.status === 'awaiting_ceo_approval').length;
  const openCount = combinedTenders.filter(t => t.status === 'published' || t.status === 'open').length;

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.earthBrown, width: '100%' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
      <p style={{ fontWeight: 700 }}>Loading Tenders...</p>
    </div>
  );

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh', fontFamily: "'Inter', sans-serif", width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Detail Modal */}
      {detailModalBidCeo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailModalBidCeo(null)}>
          <div style={{ maxWidth: 500, width: '100%', padding: 30, borderRadius: 12, background: C.white }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.darkGreen, marginBottom: 20, borderBottom: `2px solid ${C.sage}`, paddingBottom: 10 }}>Bid Details (CEO)</h3>
            
            <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
              <div><strong>Competitor Name:</strong> {detailModalBidCeo.bidder_full_name || detailModalBidCeo.customer_name || detailModalBidCeo.competitor_name}</div>
              <div><strong>Email:</strong> {detailModalBidCeo.bidder_email || detailModalBidCeo.customer_email || detailModalBidCeo.email}</div>
              <div><strong>Phone:</strong> {detailModalBidCeo.bidder_phone || detailModalBidCeo.phone || 'N/A'}</div>
              <div><strong>Submit Date:</strong> {detailModalBidCeo.submitted_at ? new Date(detailModalBidCeo.submitted_at).toLocaleString() : 'N/A'}</div>
              <div><strong>Open Date:</strong> {detailModalBidCeo.opened_at ? new Date(detailModalBidCeo.opened_at).toLocaleString() : 'N/A'}</div>
              <div>
                <strong>Digital Signature:</strong>
                <div style={{ marginTop: 8, padding: '12px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, fontFamily: '"Caveat", "Dancing Script", cursive', fontSize: 24, color: '#0f172a' }}>
                  {detailModalBidCeo.digital_signature || 'No Signature'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button style={{ background: 'transparent', border: 'none', padding: '8px 16px', fontWeight: 600, cursor: 'pointer', color: C.darkGray }} onClick={() => setDetailModalBidCeo(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      {isApprovalMode && (
        <div style={{ background: '#1a2e1a', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.sage}` }}>
          <button
            onClick={() => navigate('/ceo/approvals')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: `1px solid ${C.sage}`,
              color: C.sage, padding: '6px 14px', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, borderRadius: 4,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.sage; e.currentTarget.style.color = C.darkGreen; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.sage; }}
          >
            ← Back to Approvals Hub
          </button>
          <span style={{ color: C.sage, fontSize: 12, opacity: 0.7 }}>Administration / Approvals Hub / Tender Approvals</span>
        </div>
      )}
      <div style={{ background: C.darkGreen, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: C.forestGreen, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={28} color={C.white} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {isApprovalMode ? 'CEO TENDER & FUND APPROVALS' : 'CEO TENDER & BID MANAGEMENT'}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: C.sage, marginTop: 4 }}>
              {isApprovalMode ? 'Review pending public bids and fund requests requiring CEO approval' : 'Monitor open bids, awarded contracts, and procurement requests'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { fetchTenders(); fetchSalesTenders(); fetchFundRequests(); }} style={{ padding: '10px 16px', background: C.forestGreen, color: C.white, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 32px', background: C.red, color: C.white, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} /> {error}
          <button onClick={fetchTenders} style={{ background: 'transparent', color: C.white, textDecoration: 'underline', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
        </div>
      )}

      <div style={{ padding: '24px 32px', flex: 1 }}>
        {/* ── Stats Row ── */}
        {!isApprovalMode && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Tenders', value: combinedTenders.length, icon: <Package size={24} color={C.forestGreen} />, accent: C.forestGreen },
              { label: 'Open (Accepting Bids)', value: openCount, icon: <Wallet size={24} color={C.skyBlue} />, accent: C.skyBlue },
              { label: 'Awaiting CEO Decision', value: awaitingCount, icon: <Clock size={24} color={C.orange} />, accent: C.orange },
              { label: 'Awarded', value: combinedTenders.filter(t => t.status === 'awarded').length, icon: <CheckCircle size={24} color={C.emerald} />, accent: C.emerald },
            ].map(s => (
              <div key={s.label} style={{ background: C.white, border: `1px solid ${C.sage}`, borderLeft: `5px solid ${s.accent}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: `${s.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.darkGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.darkGreen, marginTop: 4 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `2px solid ${C.sage}`, flexWrap: 'wrap' }}>
          {(isApprovalMode ? ['Awaiting CEO', 'Fund Requests'] : ['Open', 'All Tenders', 'Awarded']).map(tab => {
            let count = 0;
            if (tab === 'Awaiting CEO') count = awaitingCount;
            if (tab === 'Open') count = openCount;
            if (tab === 'Sales Bids') count = salesTenders.filter(t => ['open','closed'].includes(t.status) && t.id).length;
            if (tab === 'Fund Requests') count = fundRequests.filter(f => f.status === 'PENDING_CEO').length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: activeTab === tab ? C.forestGreen : 'transparent',
                  color: activeTab === tab ? C.white : C.darkGray,
                  borderBottom: activeTab === tab ? `3px solid ${C.darkGreen}` : '3px solid transparent',
                  marginBottom: -2, transition: 'all 0.15s ease'
                }}
              >
                {tab}
                {count > 0 && (
                  <span style={{
                    background: activeTab === tab ? C.white : C.forestGreen,
                    color: activeTab === tab ? C.forestGreen : C.white,
                    padding: '2px 8px', fontSize: 11, fontWeight: 800
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sales Bids tab removed — sales tenders are now merged into main tabs above */}

        {/* ── TAB CONTENT: FUND REQUESTS ── */}
        {activeTab === 'Fund Requests' && (
          <div style={{ background: C.white, border: `1px solid ${C.sage}` }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: C.darkGreen }}>
                  <tr>
                    {['Request No.', 'Total Amount (ETB)', 'Status', 'Date', 'Action'].map((h, i) => (
                      <th key={h} style={{ padding: '14px 16px', color: C.white, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 1 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingFundRequests ? (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: C.earthBrown, fontWeight: 700 }}>Loading Fund Requests...</td></tr>
                  ) : fundRequests.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: C.earthBrown, fontWeight: 700 }}>No fund requests available.</td></tr>
                  ) : (
                    fundRequests.map((req, idx) => (
                      <tr key={req.id} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.darkGreen }}>{req.request_code}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: C.forestGreen, textAlign: 'right' }}>
                          {Number(req.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            padding: '4px 10px', fontSize: 11, fontWeight: 700,
                            background: req.status === 'APPROVED' ? C.sage : req.status === 'PENDING_CEO' ? '#FFF3E0' : C.lightGray,
                            color: req.status === 'APPROVED' ? C.darkGreen : req.status === 'PENDING_CEO' ? C.orange : C.darkGray,
                            border: `1px solid ${req.status === 'APPROVED' ? C.leafGreen : req.status === 'PENDING_CEO' ? C.orange : C.sage}`
                          }}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: C.darkGray, fontWeight: 600 }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => setViewFundRequest(req)} style={{ padding: '8px 16px', background: C.emerald, color: C.white, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Eye size={14} /> View
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

        {/* ── TAB CONTENT: PROCUREMENT TENDERS (All other tabs) ── */}
        {(activeTab !== 'Fund Requests' && activeTab !== 'Sales Bids') && (
          <div style={{ background: C.white, border: `1px solid ${C.sage}` }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead style={{ background: C.darkGreen }}>
                  <tr>
                    {['Source', 'Tender No.', 'Title', 'Category', 'Open Date', 'Close Date', 'Bids', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.sage}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTenders.map((t, idx) => {
                    const st = getStatusStyle(t.status);
                    const isSales = t._type === 'sales';
                    return (
                      <tr key={`${t._type}-${t.id}`} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', background: isSales ? C.orange : C.emerald, color: C.white, padding: '4px 8px' }}>
                            {isSales ? 'Sales' : 'Procure'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.forestGreen }}>{t.tender_number || t.reference_number}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: C.darkGray }}>{t.title}</td>
                        <td style={{ padding: '14px 16px', color: C.darkGray }}>{t.category || '—'}</td>
                        <td style={{ padding: '14px 16px', color: C.darkGray, fontWeight: 600 }}>
                          {(t.opening_date) ? new Date(t.opening_date).toLocaleDateString() : (isSales ? '—' : '—')}
                        </td>
                        <td style={{ padding: '14px 16px', color: C.darkGray, fontWeight: 600 }}>
                          {(t.closing_date || t.deadline) ? new Date(t.closing_date || t.deadline).toLocaleDateString() : (t.status === 'published' || t.status === 'open' ? 'Open' : '—')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: C.sage, color: C.darkGreen, padding: '4px 10px', fontWeight: 800, fontSize: 12, border: `1px solid ${C.leafGreen}` }}>
                            {t.bids_count || (isSales ? '—' : 0)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, background: st.bg, color: st.col, border: `1px solid ${st.col}40` }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => isSales ? handleViewSalesTender(t) : handleViewTender(t)}
                            style={{
                              background: t.status === 'awaiting_ceo_approval' ? C.orange : C.forestGreen,
                              color: C.white, border: 'none', padding: '8px 16px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700
                            }}
                          >
                            {t.status === 'awaiting_ceo_approval' ? <><Check size={14} /> Review & Approve</> : <><Eye size={14} /> View Bids</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTenders.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 60, textAlign: 'center', color: C.earthBrown }}>
                        <Package size={40} style={{ marginBottom: 12, opacity: 0.5, color: C.forestGreen }} />
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No tenders in "{activeTab}" tab.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: SALES BID REVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {viewSalesTender && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: C.white, width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', background: C.darkGreen, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${C.leafGreen}`, position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
                  <Award size={24} color={C.sage} /> {viewSalesTender.title}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.sage, fontWeight: 600 }}>{viewSalesTender.reference_number} — CEO BID APPROVAL</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={async () => {
                    setCeoApproving(true);
                    try {
                      const uniqueIds = [...new Set(selectedSalesBids.map(id => id.toString().split('-')[0]))];
                      const approvals = uniqueIds.map(id => ({ bidId: id, approved: true }));
                      const res = await api.post(`/tenders/${viewSalesTender.id}/bids/ceo-approve`, { approvals });
                      if (res.status === 200 || res.data?.status === 'success') {
                        showToast(`Approved ${uniqueIds.length} bid(s) successfully!`, 'success');
                        await fetchSalesBids(viewSalesTender.id);
                        fetchSalesTenders();
                      }
                      setSelectedSalesBids([]);
                    } catch (err) {
                      showToast('Error approving: ' + (err?.response?.data?.message || err.message), 'error');
                    } finally { setCeoApproving(false); }
                  }}
                  disabled={ceoApproving || selectedSalesBids.length === 0}
                  style={{ background: C.emerald, color: C.white, border: `1px solid ${C.white}`, padding: '10px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, opacity: (ceoApproving || selectedSalesBids.length === 0) ? 0.6 : 1 }}
                >
                  <Check size={16} /> APPROVE SELECTED ({[...new Set(selectedSalesBids.map(id => id.toString().split('-')[0]))].length})
                </button>
                <button onClick={() => { setViewSalesTender(null); setSalesBids([]); setSelectedSalesBids([]); }} style={{ background: C.forestGreen, border: `1px solid ${C.sage}`, color: C.white, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 32px', flex: 1, overflowX: 'auto' }}>
              {loadingSalesBids ? (
                <div style={{ padding: 60, textAlign: 'center', color: C.earthBrown, fontWeight: 700, fontSize: 16 }}>Loading bids...</div>
              ) : salesBids.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.earthBrown, background: C.mint, border: `1px solid ${C.sage}` }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>No bids forwarded by Sales Manager yet.</p>
                </div>
              ) : (() => {
                let tItems = [];
                try { tItems = typeof viewSalesTender.items === 'string' ? JSON.parse(viewSalesTender.items) : (viewSalesTender.items || []); } catch (_) {}
                const isMulti = tItems.length > 0;

                if (isMulti) {
                  return tItems.map((item, itemIdx) => {
                    const productBids = salesBids
                      .map(bid => {
                        let bidItems = [];
                        try { bidItems = typeof bid.items === 'string' ? JSON.parse(bid.items) : (bid.items || []); } catch (_) {}
                        const matched = bidItems.find((bi, i) => i === itemIdx || bi.objectType === item.objectType);
                        const bidPrice = matched ? (parseFloat(matched.bidPriceBirr || 0) + parseFloat(matched.bidPriceCent || 0) / 100) : 0;
                        return { ...bid, productBidPrice: bidPrice };
                      })
                      .filter(b => b.productBidPrice > 0)
                      .reduce((acc, curr) => acc.some(b => b.customer_id === curr.customer_id) ? acc : [...acc, curr], [])
                      .sort((a, b2) => b2.productBidPrice - a.productBidPrice);

                    const sectionSelected = productBids.every(b => selectedSalesBids.includes(b.id));

                    return (
                      <div key={itemIdx} style={{ marginBottom: 32, border: `1px solid ${C.sage}`, background: C.white }}>
                        <div style={{ background: C.mint, color: C.darkGreen, padding: '16px 20px', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.sage}` }}>
                          <div>
                            <div style={{ textTransform: 'uppercase', fontSize: 14 }}>
                              ITEM #{itemIdx + 1} — {item.objectType} (Qty: {item.quantity} {item.unit})
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.forestGreen, marginTop: 4 }}>Start Price: {item.startPrice ? parseFloat(item.startPrice).toLocaleString() + ' ETB' : '—'}</div>
                          </div>
                          {productBids.length > 0 && (
                            <div style={{ display: 'flex', gap: 20 }}>
                              {[
                                { label: 'Lowest', value: Math.min(...productBids.map(b => b.productBidPrice)), col: C.forestGreen },
                                { label: 'Average', value: productBids.reduce((a, b) => a + b.productBidPrice, 0) / productBids.length, col: C.darkGreen },
                                { label: 'Highest', value: Math.max(...productBids.map(b => b.productBidPrice)), col: C.orange }
                              ].map(m => (
                                <div key={m.label} style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 10, color: C.sage, marginBottom: 2, textTransform: 'uppercase', fontWeight: 800 }}>{m.label}</div>
                                  <div style={{ color: m.col, fontWeight: 800, fontSize: 14 }}>{m.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {productBids.length === 0 ? (
                          <div style={{ padding: '20px', color: C.earthBrown, fontSize: 13, fontWeight: 600 }}>No valid bids for this item.</div>
                        ) : (() => {
                          return (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead style={{ background: C.darkGreen }}>
                              <tr>
                                <th style={{ padding: '12px 16px', width: 40 }}></th>
                                {['Rank', 'Competitor', 'Bid Price (ETB)', 'Status', 'Decision', 'Detail'].map(h => (
                                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: C.white, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {productBids.map((b, rank) => {
                                return (
                                <tr key={`${b.id}-${itemIdx}`} style={{ borderBottom: `1px solid ${C.sage}`, background: rank === 0 ? C.mint : C.white }}>
                                  <td style={{ padding: '10px 16px' }}>
                                    {(!b.ceo_approval_status || b.ceo_approval_status === 'pending') && (
                                      <input type="checkbox" checked={selectedSalesBids.includes(b.id)} onChange={(e) => {
                                        if (e.target.checked) setSelectedSalesBids(prev => [...prev, b.id]);
                                        else setSelectedSalesBids(prev => prev.filter(id => id !== b.id));
                                      }} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.forestGreen }} />
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: 14, color: rank === 0 ? C.forestGreen : C.darkGray }}>{rank === 0 ? '🥇 1ST' : `${rank + 1}TH`}</td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: 800, color: C.darkGreen }}>{b.bidder_full_name || b.customer_name || `User #${b.customer_id}`}</div>
                                    <div style={{ fontSize: 11, color: C.darkGray }}>{b.bidder_email || b.customer_email}</div>
                                  </td>
                                  <td style={{ padding: '14px 16px', fontWeight: 800, color: rank === 0 ? C.forestGreen : C.darkGray }}>{b.productBidPrice.toLocaleString()} ETB</td>
                                  <td style={{ padding: '14px 16px' }}><span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', background: C.sage, color: C.darkGreen, border: `1px solid ${C.leafGreen}` }}>{b.status}</span></td>
                                  <td style={{ padding: '10px 16px' }}>
                                    {b.ceo_approval_status === 'approved' ? (
                                      <span style={{ color: C.forestGreen, fontWeight: 800, fontSize: 13 }}>✓ APPROVED</span>
                                    ) : b.ceo_approval_status === 'rejected' ? (
                                      <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 13 }}>✕ REJECTED</span>
                                    ) : (
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => handleCeoApprove(b.id, true)} disabled={ceoApproving} style={{ background: C.emerald, color: C.white, border: 'none', padding: '6px 10px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Approve</button>
                                        <button onClick={() => handleCeoApprove(b.id, false)} disabled={ceoApproving} style={{ background: '#dc2626', color: C.white, border: 'none', padding: '6px 10px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Reject</button>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 16px' }}>
                                    <button onClick={() => setDetailModalBidCeo(b)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.forestGreen }} title="View Detail"><Eye size={16} /></button>
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          );
                        })()}
                      </div>
                    );
                  });
                }

                const ranked = [...salesBids]
                  .filter(b => parseFloat(b.total_bid_value || 0) > 0)
                  .reduce((acc, curr) => acc.some(b => b.customer_id === curr.customer_id) ? acc : [...acc, curr], [])
                .sort((a, b2) => parseFloat(b2.total_bid_value || 0) - parseFloat(a.total_bid_value || 0));
                
                const pendingBids = ranked.filter(b => !b.ceo_approval_status || b.ceo_approval_status === 'pending');

                return (
                  <div style={{ border: `1px solid ${C.sage}` }}>
                    <div style={{ background: C.mint, color: C.darkGreen, padding: '12px 20px', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.sage}` }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800, fontSize: 14 }}>
                          <input type="checkbox"
                            checked={pendingBids.length > 0 && pendingBids.every(b => selectedSalesBids.includes(b.id))}
                            onChange={(e) => {
                              const ids = pendingBids.map(b => b.id);
                              if (e.target.checked) setSelectedSalesBids(prev => Array.from(new Set([...prev, ...ids])));
                              else setSelectedSalesBids(prev => prev.filter(id => !ids.includes(id)));
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.forestGreen }}
                            disabled={pendingBids.length === 0}
                          />
                          SELECT ALL COMPETITORS
                        </label>
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{ranked.length} competitor(s)</div>
                      </div>
                      {ranked.length > 0 && (
                        <div style={{ display: 'flex', gap: 20 }}>
                          {[
                            { label: 'Lowest', value: Math.min(...ranked.map(b => parseFloat(b.total_bid_value || 0))), col: C.forestGreen },
                            { label: 'Average', value: ranked.reduce((a, b) => a + parseFloat(b.total_bid_value || 0), 0) / ranked.length, col: C.darkGreen },
                            { label: 'Highest', value: Math.max(...ranked.map(b => parseFloat(b.total_bid_value || 0))), col: C.orange }
                          ].map(m => (
                            <div key={m.label} style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 10, color: C.sage, marginBottom: 2, textTransform: 'uppercase', fontWeight: 800 }}>{m.label}</div>
                              <div style={{ color: m.col, fontWeight: 800, fontSize: 14 }}>{m.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead style={{ background: C.darkGreen }}>
                        <tr>
                          <th style={{ padding: '12px 16px', width: 40 }}></th>
                          {['Rank', 'Competitor', 'Contact', 'Submit Date', 'Open Date', 'Price/Unit (ETB)', 'Total (ETB)', 'Status', 'Decision', 'Detail'].map((h, i) => (
                            <th key={i} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: C.white, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ranked.length === 0 ? (
                          <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: C.earthBrown, fontWeight: 700 }}>No bids received yet.</td></tr>
                        ) : ranked.map((b, rank) => (
                          <tr key={b.id} style={{ borderBottom: `1px solid ${C.sage}`, background: rank === 0 ? C.mint : C.white }}>
                            <td style={{ padding: '10px 16px' }}>
                              {(!b.ceo_approval_status || b.ceo_approval_status === 'pending') && (
                                <input type="checkbox"
                                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.forestGreen }}
                                  checked={selectedSalesBids.includes(b.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedSalesBids(prev => [...prev, b.id]);
                                    else setSelectedSalesBids(prev => prev.filter(id => id !== b.id));
                                  }}
                                />
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: 14, color: rank === 0 ? C.forestGreen : C.darkGray }}>
                              {rank === 0 ? '🥇 1ST' : `${rank + 1}TH`}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 800, color: C.darkGreen }}>{b.bidder_full_name || b.customer_name || `User #${b.customer_id}`}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 11, color: C.darkGray }}>{b.bidder_email || b.customer_email}</div>
                              <div style={{ fontSize: 11, color: C.darkGray }}>{b.bidder_phone || 'N/A'}</div>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: 11, color: C.darkGray }}>{b.submitted_at ? new Date(b.submitted_at).toLocaleString() : 'N/A'}</td>
                            <td style={{ padding: '14px 16px', fontSize: 11, color: C.darkGray }}>{b.opened_at ? new Date(b.opened_at).toLocaleString() : 'N/A'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: rank === 0 ? C.forestGreen : C.darkGray, textAlign: 'right' }}>{parseFloat(b.bid_price_per_unit || 0).toLocaleString()}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: rank === 0 ? C.forestGreen : C.darkGray, textAlign: 'right', fontSize: 15 }}>{parseFloat(b.total_bid_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', background: C.sage, color: C.darkGreen, border: `1px solid ${C.leafGreen}` }}>{b.status}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {b.ceo_approval_status === 'approved' ? (
                                <span style={{ color: C.forestGreen, fontWeight: 800, fontSize: 13 }}>✓ APPROVED</span>
                              ) : b.ceo_approval_status === 'rejected' ? (
                                <span style={{ color: C.red, fontWeight: 800, fontSize: 13 }}>✕ REJECTED</span>
                              ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleCeoApprove(b.id, true)} disabled={ceoApproving} style={{ background: C.emerald, color: C.white, border: 'none', padding: '8px 12px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Approve</button>
                                  <button onClick={() => handleCeoApprove(b.id, false)} disabled={ceoApproving} style={{ background: C.red, color: C.white, border: 'none', padding: '8px 12px', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Reject</button>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button onClick={() => setDetailModalBidCeo(b)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.forestGreen }} title="View Detail"><Eye size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {selectedSalesBids.length > 0 && (
              <div style={{ padding: '14px 32px', background: C.mint, borderTop: `2px solid ${C.sage}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, position: 'sticky', bottom: 0, zIndex: 10 }}>
                <button onClick={() => setSelectedSalesBids([])} style={{ background: 'transparent', color: C.darkGray, border: `1px solid ${C.sage}`, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: PUBLIC PROCUREMENT TENDER REVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {viewTender && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: C.white, width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', background: C.darkGreen, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${C.leafGreen}` }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
                  <Users size={24} color={C.sage} /> {viewTender.title}
                  <span style={{ padding: '4px 10px', fontSize: 12, fontWeight: 800, background: C.sage, color: C.darkGreen, border: `1px solid ${C.white}`, marginLeft: 12 }}>
                    {getStatusStyle(viewTender.status).label}
                  </span>
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.sage, fontWeight: 600 }}>{viewTender.tender_number} | {viewTender.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {viewTender.status === 'awaiting_ceo_approval' && (
                  <button onClick={() => { handleMarkAsRead(viewTender); setViewTender(null); }} style={{ background: 'transparent', color: C.white, border: `1px solid ${C.sage}`, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✓ MARK AS READ
                  </button>
                )}
                <button onClick={() => setViewTender(null)} style={{ background: C.forestGreen, border: `1px solid ${C.sage}`, color: C.white, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, padding: 20, background: C.mint, border: `1px solid ${C.sage}` }}>
                <div><div style={{ fontSize: 11, fontWeight: 800, color: C.olive, textTransform: 'uppercase' }}>Category</div><div style={{ margin: '4px 0 0', fontWeight: 800, color: C.darkGreen, fontSize: 15 }}>{viewTender.category || '—'}</div></div>
                <div><div style={{ fontSize: 11, fontWeight: 800, color: C.olive, textTransform: 'uppercase' }}>Bids Received</div><div style={{ margin: '4px 0 0', fontWeight: 800, color: C.forestGreen, fontSize: 20 }}>{viewTender.bids_count || bids.length}</div></div>
                <div><div style={{ fontSize: 11, fontWeight: 800, color: C.olive, textTransform: 'uppercase' }}>Closing Date</div><div style={{ margin: '4px 0 0', fontWeight: 800, color: C.darkGreen, fontSize: 15 }}>{viewTender.closing_date ? new Date(viewTender.closing_date).toLocaleDateString() : 'No deadline'}</div></div>
              </div>

              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: C.darkGreen, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
                <Award size={20} color={C.forestGreen} /> Submitted Bids
              </h3>

              {loadingBids ? (
                <div style={{ padding: 60, textAlign: 'center', color: C.earthBrown, fontWeight: 700, fontSize: 16 }}>Loading bids...</div>
              ) : bids.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.earthBrown, background: C.mint, border: `1px solid ${C.sage}` }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>No bids received yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 24 }}>
                  {bids.map(group => {
                    const { tenderItem, bids: groupBids, analytics } = group;
                    return (
                      <div key={tenderItem.id} style={{ border: `1px solid ${C.sage}`, background: C.white }}>
                        <div style={{ background: C.darkGreen, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${C.leafGreen}` }}>
                          <div>
                            <div style={{ fontSize: 11, color: C.sage, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Requirement</div>
                            <h3 style={{ margin: '4px 0 0', color: C.white, fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>{tenderItem.object_type}</h3>
                            <div style={{ fontSize: 12, color: C.mint, marginTop: 4, fontWeight: 700 }}>Quantity: {tenderItem.quantity} {tenderItem.unit}</div>
                          </div>
                          {analytics && groupBids.length > 0 && (
                            <div style={{ display: 'flex', gap: 20 }}>
                              {[
                                { label: 'Lowest', value: analytics.lowest?.toFixed(2), col: C.mint },
                                { label: 'Average', value: analytics.average?.toFixed(2), col: C.white },
                                { label: 'Highest', value: analytics.highest?.toFixed(2), col: C.orange },
                              ].map(m => (
                                <div key={m.label} style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 10, color: C.sage, marginBottom: 4, textTransform: 'uppercase', fontWeight: 800 }}>{m.label}</div>
                                  <div style={{ color: m.col, fontWeight: 800, fontSize: 15 }}>{m.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead style={{ background: C.mint }}>
                              <tr>
                                {['Rank', 'Supplier', 'Contact', 'Unit Price', 'Total Cost', 'Delivery', 'Status', viewTender.status === 'awaiting_ceo_approval' ? 'Award' : ''].map((h, i) => (
                                  <th key={i} style={{ padding: '12px 16px', fontWeight: 800, color: C.darkGreen, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${C.sage}`, textAlign: i >= 3 && i <= 4 ? 'right' : 'left' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {groupBids.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>No bids for this product.</td></tr>
                              ) : (
                                groupBids.map((bid, idx) => (
                                  <tr key={bid.id || bid.public_bid_id} style={{
                                    background: bid.bid_status === 'recommended' ? C.mint : C.white,
                                    borderBottom: `1px solid ${C.sage}`
                                  }}>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: idx === 0 ? C.forestGreen : C.darkGray, fontSize: 14 }}>
                                      {idx === 0 ? '1ST' : `${idx + 1}TH`}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: C.darkGreen }}>{bid.competitor_name}</td>
                                    <td style={{ padding: '14px 16px', color: C.darkGray, fontSize: 12, fontWeight: 600 }}>
                                      <div>{bid.email || '—'}</div>
                                      <div>{bid.phone || '—'}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: C.darkGray, textAlign: 'right' }}>
                                      {bid.price_birr}.{String(bid.price_cent || 0).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: C.forestGreen, textAlign: 'right', fontSize: 15 }}>
                                      {bid.total_birr}.{String(bid.total_cent || 0).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: C.darkGray, fontSize: 12, fontWeight: 600 }}>{bid.delivery_time || '—'}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                      {bid.bid_status === 'recommended' ? (
                                        <span style={{ fontSize: 11, background: C.forestGreen, color: C.white, padding: '4px 8px', fontWeight: 800, textTransform: 'uppercase' }}>Recommended</span>
                                      ) : bid.bid_status === 'winner' ? (
                                        <span style={{ fontSize: 11, background: C.emerald, color: C.white, padding: '4px 8px', fontWeight: 800, textTransform: 'uppercase' }}>Awarded</span>
                                      ) : (
                                        <span style={{ fontSize: 11, background: C.lightGray, color: C.darkGray, padding: '4px 8px', fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${C.sage}` }}>{bid.bid_status}</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                      {viewTender.status === 'awaiting_ceo_approval' && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                          <input 
                                            type="checkbox" 
                                            checked={selectedBids.includes(bid.id || bid.public_bid_id)}
                                            onChange={(e) => {
                                              const bidId = bid.id || bid.public_bid_id;
                                              if (e.target.checked) setSelectedBids(prev => [...prev, bidId]);
                                              else setSelectedBids(prev => prev.filter(id => id !== bidId));
                                            }}
                                            style={{ width: 20, height: 20, cursor: 'pointer', accentColor: C.forestGreen }}
                                          />
                                          <span style={{ fontSize: 12, fontWeight: 800, color: selectedBids.includes(bid.id || bid.public_bid_id) ? C.forestGreen : C.darkGray, textTransform: 'uppercase' }}>
                                            Select
                                          </span>
                                        </label>
                                      )}
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
                </div>
              )}

              {viewTender.status === 'awaiting_ceo_approval' && (
                <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', borderTop: `2px solid ${C.sage}`, paddingTop: 24 }}>
                  <button
                    onClick={() => setRejectId(viewTender.tender_number)}
                    style={{ background: C.red, color: C.white, border: 'none', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}
                  >
                    <XCircle size={18} /> Reject All Bids
                  </button>
                  <button
                    onClick={() => handleApprove(viewTender)}
                    disabled={approving || selectedBids.length === 0}
                    style={{ background: selectedBids.length > 0 ? C.forestGreen : C.sage, color: C.white, border: 'none', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', opacity: (approving || selectedBids.length === 0) ? 0.7 : 1 }}
                  >
                    <CheckCircle size={18} /> Award Selected Bids
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: C.white, padding: 32, width: '100%', maxWidth: 480, borderTop: `4px solid ${C.red}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 20px', color: C.red, fontWeight: 800, fontSize: 20, textTransform: 'uppercase' }}>Reject All Bids — {rejectId}</h3>
            <textarea
              placeholder="Enter rejection reason (required)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ width: '100%', height: 120, padding: 16, marginBottom: 24, border: `1px solid ${C.sage}`, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '12px 24px', background: C.lightGray, color: C.darkGray, border: `1px solid ${C.sage}`, cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase', fontSize: 13 }}>Cancel</button>
              <button onClick={handleRejectAll} style={{ padding: '12px 24px', background: C.red, color: C.white, border: 'none', cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase', fontSize: 13 }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ── INLINE CONFIRM MODAL ── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: C.white, padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', borderTop: `4px solid ${C.orange}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <AlertCircle size={56} color={C.orange} />
            </div>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '22px', color: C.darkGreen, textTransform: 'uppercase' }}>Confirm Action</h3>
            <p style={{ margin: '0 0 28px', color: C.darkGray, fontSize: '15px', lineHeight: '1.6', fontWeight: 600 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{ flex: 1, padding: '14px', border: `1px solid ${C.sage}`, background: C.lightGray, fontWeight: 800, cursor: 'pointer', color: C.darkGray, textTransform: 'uppercase', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                style={{ flex: 1, padding: '14px', background: C.forestGreen, color: C.white, border: 'none', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', fontSize: 13 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ── */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#FFEBEE' : C.mint,
            border: `1px solid ${t.type === 'error' ? C.red : C.leafGreen}`,
            color: t.type === 'error' ? C.red : C.darkGreen,
            padding: '16px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: 14, minWidth: '320px', maxWidth: '420px',
            animation: 'slideIn 0.3s ease-out forwards', pointerEvents: 'auto', borderLeft: `6px solid ${t.type === 'error' ? C.red : C.forestGreen}`
          }}>
            {t.type === 'error' ? <XCircle size={22} color={C.red} /> : t.type === 'success' ? <CheckCircle size={22} color={C.forestGreen} /> : <Info size={22} color={C.skyBlue} />}
            <span style={{ fontSize: '14px', fontWeight: 700, flex: 1, lineHeight: '1.4' }}>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color={t.type === 'error' ? C.red : C.darkGreen} />
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

      {/* ── MODAL: FUND REQUEST DETAILS ── */}
      {viewFundRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '24px', overflowY: 'auto' }}>
          <div style={{ background: C.white, padding: '0', width: '100%', maxWidth: '640px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 32px', background: C.darkGreen, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${C.leafGreen}` }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: C.white, textTransform: 'uppercase' }}>Fund Request Details</h3>
                <p style={{ margin: 0, color: C.sage, fontSize: '13px', fontWeight: 600 }}>{viewFundRequest.request_code} • {new Date(viewFundRequest.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewFundRequest(null)} style={{ background: C.forestGreen, border: `1px solid ${C.sage}`, borderRadius: '0', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color={C.white} />
              </button>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ background: C.mint, padding: '20px', marginBottom: '28px', border: `1px solid ${C.sage}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: C.darkGreen, fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Total Amount Requested:</span>
                  <span style={{ fontWeight: 800, color: C.forestGreen, fontSize: '18px' }}>ETB {Number(viewFundRequest.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.darkGreen, fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>Status:</span>
                  <span style={{ fontWeight: 800, padding: '4px 10px', background: viewFundRequest.status === 'PENDING_CEO' ? '#FFF3E0' : C.sage, color: viewFundRequest.status === 'PENDING_CEO' ? C.orange : C.darkGreen, border: `1px solid ${viewFundRequest.status === 'PENDING_CEO' ? C.orange : C.leafGreen}` }}>
                    {viewFundRequest.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: C.darkGreen, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} color={C.forestGreen} /> Included Awarded Tenders
              </h4>
              <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '24px' }}>
                {viewFundRequest.items?.map(item => (
                  <div key={item.id} style={{ padding: '16px 20px', border: `1px solid ${C.sage}`, marginBottom: '12px', background: C.white }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: '15px', marginBottom: '6px' }}>{item.tender_title}</div>
                        <div style={{ color: C.darkGray, fontSize: '13px', fontWeight: 600 }}>Supplier: <span style={{ fontWeight: 800, color: C.forestGreen }}>{item.supplier}</span></div>
                      </div>
                      <div style={{ fontWeight: 800, color: C.forestGreen, fontSize: '16px' }}>
                        ETB {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {viewFundRequest.status === 'PENDING_CEO' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button 
                    onClick={() => setConfirmApproveFund(viewFundRequest)}
                    style={{ padding: '12px 24px', background: C.emerald, color: C.white, border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <CheckCircle size={18} /> APPROVE FUND REQUEST
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM FUND REQUEST APPROVAL MODAL ── */}
      {confirmApproveFund && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: C.white, padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', borderTop: `4px solid ${C.emerald}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle size={56} color={C.emerald} />
            </div>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '22px', color: C.darkGreen, textTransform: 'uppercase' }}>Confirm Approval</h3>
            <p style={{ margin: '0 0 28px', color: C.darkGray, fontSize: '15px', lineHeight: '1.6', fontWeight: 600 }}>
              Approve Fund Request <b>{confirmApproveFund.request_code}</b> for <b>ETB {Number(confirmApproveFund.total_amount).toLocaleString()}</b>? This will forward the request to Finance for payment.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmApproveFund(null)}
                style={{ flex: 1, padding: '14px', border: `1px solid ${C.sage}`, background: C.lightGray, fontWeight: 800, cursor: 'pointer', color: C.darkGray, textTransform: 'uppercase', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={() => handleApproveFundRequest(confirmApproveFund.id)}
                disabled={approvingFund}
                style={{ flex: 1, padding: '14px', background: C.emerald, color: C.white, border: 'none', fontWeight: 800, cursor: approvingFund ? 'not-allowed' : 'pointer', textTransform: 'uppercase', fontSize: 13, opacity: approvingFund ? 0.7 : 1 }}>
                {approvingFund ? 'Approving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CEOTenderManager;
