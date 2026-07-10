import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/apiClient';
import { Award, CheckCircle, XCircle, Download, Eye, Users, Check, RefreshCw, Package, Info, X, AlertCircle, TrendingDown, Minus, TrendingUp, BarChart2, Star, Wallet } from 'lucide-react';

const CEOTenderManager = () => {
  const location = useLocation();

  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'Awaiting CEO';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewTender, setViewTender] = useState(null);
  const [bids, setBids] = useState([]);       // grouped by bidder: [{id, competitor_name, email, created_at, items:[...]}]
  const [selectedBids, setSelectedBids] = useState([]); // Array of bid IDs selected by CEO
  const [loadingBids, setLoadingBids] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);

  // Fund Requests
  const [fundRequests, setFundRequests] = useState([]);
  const [loadingFundRequests, setLoadingFundRequests] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionReqId, setActionReqId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [viewFundRequest, setViewFundRequest] = useState(null);
  const [inlineReason, setInlineReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // ─── In-app Toast Notification ───────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // ─── Inline Confirm Modal ─────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

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

  useEffect(() => {
    fetchTenders();
    fetchFundRequests();
  }, [fetchTenders, fetchFundRequests]);

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
  }, [location.search, tenders]);

  // ── Fetch bids for a tender ──────────────────────
  const handleViewTender = async (tender) => {
    setViewTender(tender);
    setBids([]);
    setSelectedBids([]);
    setLoadingBids(true);
    try {
      const res = await api.get(`/public-tenders/internal/${tender.id}/bids`);
      // The API returns: [{tenderItem, bids, analytics}]
      const itemGroups = res?.data?.data || res?.data || [];
      
      // Auto-select any recommended bids if we are awaiting approval
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
          showToast('✅ Tender awarded successfully! Finance and Purchase have been notified.', 'success');
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
      // Update tender status back to closed
      await api.put(`/public-tenders/internal/${viewTender.id}/close`);
      showToast(`❌ Tender ${rejectId} bids rejected. Tender closed.`, 'success');
    } catch (_) {}
    setRejectId(null);
    setRejectReason('');
    setViewTender(null);
    fetchTenders();
  };

  const handleFundRequestAction = async () => {
    if (actionType === 'REJECT' && !actionReason.trim()) return showToast('Reason is required for rejection', 'error');
    try {
      await api.put(`/public-procurement/fund-requests/${actionReqId}/approve`, {
        action: actionType,
        reason: actionReason
      });
      showToast(`Fund Request ${actionType === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`, 'success');
      fetchFundRequests();
      setActionReqId(null);
      setActionReason('');
    } catch (err) {
      showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const handleMarkAsRead = async (tender) => {
    try {
      // Mark the tender notification as read
      await api.post('/erp/ceo-mark-read', { type: 'tender', id: tender.id });
      // Also mark all pending bids for this tender as read
      await api.post('/erp/ceo-mark-read', { type: 'bid_all' });
      // Tell navbar to refresh its notification counts
      window.dispatchEvent(new Event('refreshNotifications'));
      showToast('✓ Notification cleared — tender removed from notification bell.', 'success');
    } catch (err) {
      showToast('Failed to mark as read: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const getStatusStyle = (status) => {
    const map = {
      published: { bg: '#dbeafe', col: '#1d4ed8', label: 'OPEN' },
      closed: { bg: '#f1f5f9', col: '#64748b', label: 'CLOSED' },
      awaiting_ceo_approval: { bg: '#fef3c7', col: '#b45309', label: 'AWAITING CEO' },
      awarded: { bg: '#dcfce7', col: '#166534', label: 'AWARDED' },
    };
    return map[status] || { bg: '#f1f5f9', col: '#64748b', label: (status || '').toUpperCase() };
  };

  const filteredTenders = tenders.filter(t => {
    if (activeTab === 'All Tenders') return true;
    if (activeTab === 'Awaiting CEO') return t.status === 'awaiting_ceo_approval';
    if (activeTab === 'Open') return t.status === 'published';
    if (activeTab === 'Awarded') return t.status === 'awarded';
    return true;
  });

  const awaitingCount = tenders.filter(t => t.status === 'awaiting_ceo_approval').length;
  const openCount = tenders.filter(t => t.status === 'published').length;

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
      <p>Loading Tenders...</p>
    </div>
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
            <Award color="#f59e0b" size={30} /> TENDER & BID MANAGEMENT
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Review public bids from both sell &amp; buy pages — approve winning bids as CEO.
          </p>
        </div>
        <button onClick={fetchTenders} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b' }}>
          ⚠️ {error} — <button onClick={fetchTenders} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>Retry</button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Tenders', value: tenders.length, bg: '#f8fafc', col: '#0f172a', border: '#e2e8f0' },
          { label: 'Open (Accepting Bids)', value: openCount, bg: '#eff6ff', col: '#1d4ed8', border: '#bfdbfe' },
          { label: 'Awaiting CEO Decision', value: awaitingCount, bg: '#fefce8', col: '#92400e', border: '#fde68a' },
          { label: 'Awarded', value: tenders.filter(t => t.status === 'awarded').length, bg: '#f0fdf4', col: '#166534', border: '#bbf7d0' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 28, fontWeight: 800, color: s.col }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['Awaiting CEO', 'Open', 'All Tenders', 'Awarded', 'Fund Requests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 18px', borderRadius: 6, border: activeTab === tab ? 'none' : '1px solid #e2e8f0',
              background: activeTab === tab ? '#0f172a' : 'white',
              color: activeTab === tab ? 'white' : '#64748b',
              cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {tab}
            {tab === 'Awaiting CEO' && awaitingCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', padding: '2px 7px', borderRadius: 12, fontSize: 11 }}>
                {awaitingCount}
              </span>
            )}
            {tab === 'Open' && openCount > 0 && (
              <span style={{ background: '#1d4ed8', color: 'white', padding: '2px 7px', borderRadius: 12, fontSize: 11 }}>
                {openCount}
              </span>
            )}
            {tab === 'Fund Requests' && fundRequests.filter(f => f.status === 'PENDING_CEO').length > 0 && (
              <span style={{ background: '#db2777', color: 'white', padding: '2px 7px', borderRadius: 12, fontSize: 11 }}>
                {fundRequests.filter(f => f.status === 'PENDING_CEO').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fund Requests Content */}
      {activeTab === 'Fund Requests' && (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                {['Request No.', 'Total Amount', 'Status', 'Date', 'Included Tenders', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingFundRequests ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading Fund Requests...</td></tr>
              ) : fundRequests.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No fund requests available.</td></tr>
              ) : (
                fundRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{req.request_code}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                      ETB {Number(req.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: req.status === 'APPROVED' || req.status === 'READY_FOR_PAYMENT' ? '#dcfce7' : req.status === 'REJECTED' ? '#fee2e2' : req.status === 'PENDING_CEO' ? '#fef9c3' : '#f1f5f9',
                        color: req.status === 'APPROVED' || req.status === 'READY_FOR_PAYMENT' ? '#166534' : req.status === 'REJECTED' ? '#991b1b' : req.status === 'PENDING_CEO' ? '#854d0e' : '#475569'
                      }}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                      {req.items?.map(i => <div key={i.id}>• {i.tender_title} ({i.supplier})</div>)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setViewFundRequest(req)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table for Tenders */}
      {activeTab !== 'Fund Requests' && (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Tender No.', 'Title', 'Category', 'Open Date', 'Close Date', 'Bids', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTenders.map(t => {
              const { bg, col, label } = getStatusStyle(t.status);
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8' }}>{t.tender_number}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.title}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.category || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13 }}>
                    {t.opening_date ? new Date(t.opening_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 13 }}>
                    {t.closing_date ? new Date(t.closing_date).toLocaleDateString() : 'Open'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#e2e8f0', padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>
                      {t.bids_count || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 5, fontSize: 12, fontWeight: 700, background: bg, color: col }}>{label}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => handleViewTender(t)}
                      style={{
                        background: t.status === 'awaiting_ceo_approval' ? '#16a34a' : '#0f172a',
                        color: 'white', border: 'none', padding: '7px 14px', borderRadius: 5,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700
                      }}
                    >
                      {t.status === 'awaiting_ceo_approval' ? <><Check size={13} /> Review & Approve</> : <><Eye size={13} /> View Bids</>}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTenders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <Package size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 15 }}>No tenders in "{activeTab}" tab.</p>
                  {activeTab === 'Awaiting CEO' && (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
                      Bids submitted from the public pages appear under <strong>Open</strong> tab first. The Purchase Manager evaluates and submits to CEO.
                    </p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* ── BID DETAIL MODAL ── */}
      {viewTender && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 14, width: 980, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '14px 14px 0 0' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="#3b82f6" />
                  {viewTender.title}
                  <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 13, fontWeight: 700, background: getStatusStyle(viewTender.status).bg, color: getStatusStyle(viewTender.status).col }}>
                    {getStatusStyle(viewTender.status).label}
                  </span>
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  {viewTender.tender_number} &nbsp;|&nbsp; {viewTender.description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {viewTender.status === 'awaiting_ceo_approval' && (
                  <button
                    onClick={() => { handleMarkAsRead(viewTender); setViewTender(null); }}
                    style={{
                      background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1',
                      padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600
                    }}
                  >
                    ✓ Mark as Read
                  </button>
                )}
                <button onClick={() => setViewTender(null)} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            <div style={{ padding: 28 }}>
              {/* Tender Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div><strong style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Category</strong><p style={{ margin: '2px 0 0', fontWeight: 600 }}>{viewTender.category || '—'}</p></div>
                <div><strong style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Bids Received</strong><p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 20, color: '#1d4ed8' }}>{viewTender.bids_count || bids.length}</p></div>
                <div><strong style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Closing Date</strong><p style={{ margin: '2px 0 0', fontWeight: 600 }}>{viewTender.closing_date ? new Date(viewTender.closing_date).toLocaleDateString() : 'No deadline'}</p></div>
              </div>

              {/* Bids section */}
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#f59e0b" />
                Submitted Bids {bids.length > 0 && <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>(sorted by total cost — lowest first)</span>}
              </h3>

              {loadingBids ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                  <p>Loading bids...</p>
                </div>
              ) : bids.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', marginBottom: 24 }}>
                  <Users size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No bids received yet</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>Bids submitted from the public Buy/Sell pages will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
                  {bids.map(group => {
                    const { tenderItem, bids: groupBids, analytics } = group;
                    return (
                      <div key={tenderItem.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        {/* Item Header */}
                        <div style={{ background: '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                          <div>
                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Product</span>
                            <h3 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>
                              {tenderItem.object_type}
                            </h3>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              Qty: {tenderItem.quantity} {tenderItem.unit}
                            </span>
                          </div>

                          {/* Analytics strip */}
                          {analytics && groupBids.length > 0 && (
                            <div style={{ display: 'flex', gap: 16 }}>
                              {[
                                { label: 'Lowest', value: analytics.lowest?.toFixed(2), icon: <TrendingDown size={14} />, color: '#16a34a' },
                                { label: 'Average', value: analytics.average?.toFixed(2), icon: <Minus size={14} />, color: '#f59e0b' },
                                { label: 'Highest', value: analytics.highest?.toFixed(2), icon: <TrendingUp size={14} />, color: '#ef4444' },
                                { label: 'Variance', value: analytics.variance?.toFixed(2), icon: <BarChart2 size={14} />, color: '#8b5cf6' },
                              ].map(m => (
                                <div key={m.label} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</div>
                                  <div style={{ color: m.color, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {m.icon} {m.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bids Table for this item */}
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
                            <thead>
                              <tr style={{ background: '#fff' }}>
                                {['Rank', 'Supplier', 'Email / Phone', 'Price (Birr.Cent)', 'Total (Birr.Cent)', 'Delivery', 'Status', viewTender.status === 'awaiting_ceo_approval' ? 'Award' : ''].map((h, i) => (
                                  <th key={i} style={{ padding: '10px 14px', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {groupBids.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No bids for this product.</td></tr>
                              ) : (
                                groupBids.map((bid, idx) => (
                                  <tr key={bid.id || bid.public_bid_id} style={{
                                    background: bid.bid_status === 'recommended' ? '#f0fdf4' : idx === 0 ? '#fefce8' : 'white',
                                    borderBottom: '1px solid #f1f5f9'
                                  }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                                      {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}th`}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{bid.competitor_name}</td>
                                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
                                      <div>{bid.email || '—'}</div>
                                      <div>{bid.phone || '—'}</div>
                                    </td>
                                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                                      {bid.price_birr}.{String(bid.price_cent || 0).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700 }}>
                                      {bid.total_birr}.{String(bid.total_cent || 0).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{bid.delivery_time || '—'}</td>
                                    <td style={{ padding: '12px 14px' }}>
                                      {bid.bid_status === 'recommended' ? (
                                        <span style={{ fontSize: 11, background: '#16a34a', color: 'white', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>⭐ Recommended</span>
                                      ) : bid.bid_status === 'winner' ? (
                                        <span style={{ fontSize: 11, background: '#3b82f6', color: 'white', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>🏆 AWARDED</span>
                                      ) : (
                                        <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: 12, fontWeight: 600 }}>{bid.bid_status}</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                      {viewTender.status === 'awaiting_ceo_approval' && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                          <input 
                                            type="checkbox" 
                                            checked={selectedBids.includes(bid.id || bid.public_bid_id)}
                                            onChange={(e) => {
                                              const bidId = bid.id || bid.public_bid_id;
                                              if (e.target.checked) setSelectedBids(prev => [...prev, bidId]);
                                              else setSelectedBids(prev => prev.filter(id => id !== bidId));
                                            }}
                                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }}
                                          />
                                          <span style={{ fontSize: 12, fontWeight: 700, color: selectedBids.includes(bid.id || bid.public_bid_id) ? '#16a34a' : '#64748b' }}>
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

              {/* CEO Action Buttons */}
              {viewTender.status === 'awaiting_ceo_approval' && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: 20 }}>
                  <button
                    onClick={() => setRejectId(viewTender.tender_number)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '11px 22px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}
                  >
                    <XCircle size={16} /> REJECT ALL BIDS
                  </button>
                  <button
                    onClick={() => handleApprove(viewTender)}
                    disabled={approving || selectedBids.length === 0}
                    style={{ background: selectedBids.length > 0 ? '#16a34a' : '#94a3b8', color: 'white', border: 'none', padding: '11px 22px', borderRadius: 7, cursor: selectedBids.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, opacity: approving ? 0.7 : 1 }}
                  >
                    <CheckCircle size={16} /> {approving ? 'Awarding...' : `APPROVE & AWARD (${selectedBids.length})`}
                  </button>
                </div>
              )}
              {viewTender.status !== 'awaiting_ceo_approval' && (
                <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#64748b', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
                  {viewTender.status === 'published'
                    ? '⏳ This tender is still open. The Purchase Manager must evaluate bids and submit to CEO before you can approve.'
                    : viewTender.status === 'awarded'
                    ? '✅ This tender has already been awarded.'
                    : '🔒 This tender is closed.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 12, width: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#ef4444' }}>Reject All Bids — {rejectId}</h3>
            <textarea
              placeholder="Enter rejection reason (required)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ width: '100%', height: 110, padding: 10, marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectId(null)} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleRejectAll} style={{ padding: '9px 18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Confirm Reject</button>
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
          MODAL: Fund Request Details View
      ══════════════════════════════════════════════════ */}
      {viewFundRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, backdropFilter: 'blur(4px)', padding: '24px', overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Fund Request Details</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{viewFundRequest.request_code} • {new Date(viewFundRequest.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewFundRequest(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} color="#64748b" />
              </button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Total Amount Requested:</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>ETB {Number(viewFundRequest.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                <span style={{ fontWeight: 700, color: viewFundRequest.status === 'PENDING_CEO' ? '#d97706' : '#166534' }}>{viewFundRequest.status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#334155' }}>Included Awarded Tenders</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
              {viewFundRequest.items?.map(item => (
                <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', background: 'white' }}>
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
                            const totalAmount = prod.total_birr + (prod.total_cent / 100);
                            const unitPrice = prod.price_birr + (prod.price_cent / 100);
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
                              {Number(item.products.reduce((acc, p) => acc + p.total_birr + (p.total_cent / 100), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No itemized products found for this tender.</div>
                  )}
                </div>
              ))}
            </div>

            {viewFundRequest.status === 'PENDING_CEO' && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                {pendingAction && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
                      {pendingAction === 'REJECT' ? 'Rejection reason (required):' : 'Comment (optional):'}
                    </label>
                    <textarea
                      value={inlineReason}
                      onChange={e => setInlineReason(e.target.value)}
                      placeholder={pendingAction === 'REJECT' ? 'Enter reason for rejection...' : 'Enter approval comment...'}
                      style={{ width: '100%', minHeight: '80px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!pendingAction ? (
                    <>
                      <button onClick={() => setPendingAction('REJECT')} style={{ flex: 1, padding: '12px', background: 'white', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                        Reject
                      </button>
                      <button onClick={() => setPendingAction('APPROVE')} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
                        Approve
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setPendingAction(null); setInlineReason(''); }} style={{ flex: 1, padding: '12px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Back
                      </button>
                      <button
                        disabled={pendingAction === 'REJECT' && !inlineReason.trim()}
                        onClick={async () => {
                          // Call the API directly — no second modal needed
                          const reqId = viewFundRequest.id;
                          const type = pendingAction;
                          const reason = inlineReason;
                          setViewFundRequest(null);
                          setPendingAction(null);
                          setInlineReason('');
                          try {
                            await api.put(`/public-procurement/fund-requests/${reqId}/approve`, { action: type, reason });
                            showToast(`✅ Fund Request ${type === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`, 'success');
                            // Dispatch event so navbar badge updates
                            window.dispatchEvent(new Event('refreshNotifications'));
                            fetchFundRequests();
                          } catch (err) {
                            showToast('Error: ' + (err?.response?.data?.message || err.message), 'error');
                          }
                        }}
                        style={{ flex: 1, padding: '12px', background: pendingAction === 'APPROVE' ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: pendingAction === 'REJECT' && !inlineReason.trim() ? 'not-allowed' : 'pointer', opacity: pendingAction === 'REJECT' && !inlineReason.trim() ? 0.5 : 1, fontSize: '14px' }}>
                        Confirm {pendingAction === 'APPROVE' ? 'Approval' : 'Rejection'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action Modal for Fund Requests ── */}
      {actionReqId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#0f172a' }}>
              {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Fund Request
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#64748b' }}>
              Please provide a reason or comment for this decision.
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
              style={{ width: '100%', minHeight: 80, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 20, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setActionReqId(null); setActionReason(''); }} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                Cancel
              </button>
              <button onClick={handleFundRequestAction} style={{ padding: '8px 16px', background: actionType === 'APPROVE' ? '#16a34a' : '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CEOTenderManager;
