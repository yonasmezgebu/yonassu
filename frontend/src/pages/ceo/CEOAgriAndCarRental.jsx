import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, CheckCircle, XCircle, Search, RefreshCw, Eye, Package, Leaf, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { triggerNotification } from '../../utils/ceoNotifications';

const api = axios.create({ baseURL: '' });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ─── Palette (Natural Greens) ─── */
const C = {
  forest: '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf: '#4CAF50', sage: '#A5D6A7', olive: '#6B8E23',
  white: '#FFFFFF', light: '#F5F5F5', darkGray: '#424242',
  red: '#F44336', orange: '#FF9800', midGray: '#E0E0E0',
  textSec: '#757575', sageLight: '#E8F5E9', blue: '#0ea5e9',
};

const Btn = ({ onClick, children, color, icon: Icon, outline, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    style={{
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      border: `2px solid ${color}`,
      padding: '8px 16px',
      fontSize: 13,
      fontWeight: 800,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      textTransform: 'uppercase',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s'
    }}
    onMouseEnter={e => { if (!disabled && outline) e.currentTarget.style.background = `${color}15`; }}
    onMouseLeave={e => { if (!disabled && outline) e.currentTarget.style.background = 'transparent'; }}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'error' ? '#FFEBEE' : C.sageLight,
    borderLeft: `5px solid ${type === 'error' ? C.red : C.forest}`,
    padding: '16px 24px', color: C.darkGray, fontWeight: 700,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 12
  }}>
    {type === 'error' ? <XCircle color={C.red} /> : <CheckCircle color={C.forest} />}
    {msg}
  </div>
);

export default function CEOAgriAndCarRental() {
  const [activeTab, setActiveTab] = useState('Car Rental');
  
  // Data
  const [carRequests, setCarRequests] = useState([]);
  const [agriRequests, setAgriRequests] = useState([]);
  const [carHistory, setCarHistory] = useState([]);
  const [agriHistory, setAgriHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const maintenancePending = maintenanceRecords.filter(r => r.status === 'PENDING_CEO');
  const maintenanceDone    = maintenanceRecords.filter(r => r.status !== 'PENDING_CEO');
  const [loading, setLoading] = useState(true);
  
  // Row expansion state for history
  const [expandedRows, setExpandedRows] = useState({});
  const [rowDetails, setRowDetails] = useState({});
  const [rowDetailLoading, setRowDetailLoading] = useState({});
  
  // Modals
  const [viewDetail, setViewDetail] = useState(null); // { type, data }
  const [rejectModal, setRejectModal] = useState(null); // { type, id }
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedMaint, setExpandedMaint] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resReq, resMaint, resFuel] = await Promise.all([
        api.get('/api/v1/car-renting/store-requests'),
        api.get('/api/v1/car-renting/maintenance/finance'),
        api.get('/api/v1/car-renting/fuel-service')
      ]);
      const all = resReq.data?.data || [];
      const allMaintRaw = resMaint.data?.data || resMaint.data || [];
      const allFuelRaw = resFuel.data?.data || resFuel.data || [];

      // Normalize Fuel to look like Maintenance for CEO view
      const allFuel = allFuelRaw.map(f => ({
        ...f,
        type: f.request_type, // map request_type to type
        isFuel: true,
      }));
      const allMaint = [...allMaintRaw, ...allFuel];

      // Split Store Requests
      const carAll = all.filter(r => r.department === 'Car Rental' || !r.department);
      const agriAll = all.filter(r => r.department === 'AgriRent');

      const carH = carAll.filter(r => r.status !== 'FORWARDED_TO_CEO');
      const agriH = agriAll.filter(r => r.status !== 'FORWARDED_TO_CEO');
      setCarRequests(carAll.filter(r => r.status === 'FORWARDED_TO_CEO'));
      setAgriRequests(agriAll.filter(r => r.status === 'FORWARDED_TO_CEO'));
      setCarHistory(carH);
      setAgriHistory(agriH);

      // Split Maintenance
      setMaintenanceRecords(allMaint);
      const maintHistory = allMaint
        .filter(r => r.status !== 'PENDING_CEO')
        .map(r => ({
          ...r,
          department: 'Maintenance',
          request_number: r.isFuel ? `FS-${String(r.id).padStart(4, '0')}` : `MNT-${String(r.id).padStart(4, '0')}`,
          item_count: r.isFuel ? `1 ${r.request_type}` : '1 Service',
          isMaintenance: true,
          isFuel: !!r.isFuel
        }));

      // Combine
      setAllHistory([...carH, ...agriH, ...maintHistory].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      console.error('Fetch failed:', e);
      setCarRequests([]); setCarHistory([]);
      setAgriRequests([]); setAgriHistory([]);
      setMaintenanceRecords([]);
      setAllHistory([]);
    }
    setLoading(false);
  };

  const fetchRequests = loadAllData;
  const fetchMaintenance = loadAllData;

  const handleApproveMaintenance = async (r) => {
    setProcessing(true);
    try {
      if (r.isFuel) {
        await api.patch(`/api/v1/car-renting/fuel-service/${r.id}/ceo-approve`);
      } else {
        await api.patch(`/api/v1/car-renting/maintenance/${r.id}/ceo-approve`);
      }
      showToast(`${r.isFuel ? r.type : 'Maintenance'} Request ${r.id} Approved successfully`);
      fetchMaintenance();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const toggleRowDetail = async (r) => {
    const id = r.id;
    const isOpen = !!expandedRows[id];
    if (isOpen) {
      setExpandedRows(prev => ({ ...prev, [id]: false }));
      return;
    }
    setExpandedRows(prev => ({ ...prev, [id]: true }));
    if (!rowDetails[id]) {
      setRowDetailLoading(prev => ({ ...prev, [id]: true }));
      try {
        if (r.isMaintenance) {
          setRowDetails(prev => ({ ...prev, [id]: r }));
        } else {
          const res = await api.get(`/api/v1/car-renting/store-requests/${id}`);
          setRowDetails(prev => ({ ...prev, [id]: res.data?.data || res.data }));
        }
      } catch {
        showToast('Failed to load detail', 'error');
        setExpandedRows(prev => ({ ...prev, [id]: false }));
      } finally {
        setRowDetailLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMaintenance();
  }, []);

  const fetchDetail = async (type, id) => {
    try {
      const res = await api.get(`/api/v1/car-renting/store-requests/${id}`);
      setViewDetail({ type, data: res.data?.data || res.data });
    } catch (err) {
      showToast('Failed to load request details', 'error');
    }
  };

  const handleApprove = async (type, id) => {
    setProcessing(true);
    try {
      await api.patch(`/api/v1/car-renting/store-requests/${id}/status`, { status: 'APPROVED' });
      
      // Notify Store that items are approved and pending shipment
      await triggerNotification({
        roleTarget: 'General Store Keeper',
        title: `${type} Request Approved`,
        message: `A ${type} request has been approved by the CEO and is pending shipment.`,
        type: 'info',
        link: '/general-store/dashboard'
      });

      showToast(`Request ${id} Approved successfully`);
      setViewDetail(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }
    setProcessing(true);
    try {
      const { id } = rejectModal;
      await api.patch(`/api/v1/car-renting/store-requests/${id}/status`, { status: 'REJECTED', rejection_reason: rejectionReason });
      
      showToast(`Request ${id} Rejected successfully`);
      setRejectModal(null);
      setRejectionReason('');
      setViewDetail(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const activeData = activeTab === 'Car Rental' ? carRequests : agriRequests;
  const filteredHistory = historyFilter === 'All'
    ? allHistory
    : historyFilter === 'Car Rental'
      ? allHistory.filter(r => r.department === 'Car Rental' || !r.department)
      : allHistory.filter(r => r.department === 'AgriRent');

  const STATUS = {
    PENDING_STORE:    { label: 'Pending Store',  color: C.orange,  bg: '#FFF8E1' },
    FORWARDED_TO_CEO: { label: 'With CEO',       color: C.blue,    bg: '#E3F2FD' },
    APPROVED:         { label: 'CEO Approved',   color: C.leaf,    bg: '#F1F8E9' },
    REJECTED:         { label: 'Rejected',       color: C.red,     bg: '#FFEBEE' },
    SHIPPED:          { label: 'Shipped',        color: C.emerald, bg: '#E8F5E9' },
    RECEIVED:         { label: 'Received',       color: C.forest,  bg: '#E8F5E9' },
  };
  
  const StatusBadge = ({ status }) => {
    const cfg = STATUS[status] || { label: status, color: C.textSec, bg: C.light };
    return (
      <span style={{
        background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}`,
        padding: '4px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: 0.5, borderRadius: 0, display: 'inline-block',
      }}>{cfg.label}</span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: C.light, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} />}

      {/* HEADER */}
      <div style={{ background: C.dark, padding: '24px 32px', color: '#fff', borderBottom: `4px solid ${C.forest}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: C.forest, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>Agri & Car Rental Approvals</h1>
            <p style={{ margin: '4px 0 0', color: C.sage, fontSize: 13, fontWeight: 600 }}>Review and approve store requests from the Car Rental and AgriRent departments</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button 
            onClick={() => setActiveTab('Car Rental')}
            style={{ 
              padding: '12px 28px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
              background: activeTab === 'Car Rental' ? C.blue : C.white,
              color: activeTab === 'Car Rental' ? '#fff' : C.darkGray,
              border: `2px solid ${activeTab === 'Car Rental' ? C.blue : C.midGray}`,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: activeTab === 'Car Rental' ? '0 4px 12px rgba(14,165,233,0.3)' : 'none'
            }}
          >
            <Truck size={16} /> Car Rental
            <span style={{ background: activeTab === 'Car Rental' ? 'rgba(255,255,255,0.3)' : C.blue, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>
              {carRequests.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('AgriRent')}
            style={{ 
              padding: '12px 28px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
              background: activeTab === 'AgriRent' ? C.olive : C.white,
              color: activeTab === 'AgriRent' ? '#fff' : C.darkGray,
              border: `2px solid ${activeTab === 'AgriRent' ? C.olive : C.midGray}`,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: activeTab === 'AgriRent' ? '0 4px 12px rgba(107,142,35,0.3)' : 'none'
            }}
          >
            <Leaf size={16} /> AgriRent
            <span style={{ background: activeTab === 'AgriRent' ? 'rgba(255,255,255,0.3)' : C.olive, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>
              {agriRequests.length}
            </span>
          </button>
          <button 
            onClick={() => { setActiveTab('Maintenance'); fetchMaintenance(); }}
            style={{ 
              padding: '12px 28px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
              background: activeTab === 'Maintenance' ? C.forest : C.white,
              color: activeTab === 'Maintenance' ? '#fff' : C.darkGray,
              border: `2px solid ${activeTab === 'Maintenance' ? C.forest : C.midGray}`,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: activeTab === 'Maintenance' ? '0 4px 12px rgba(34,139,34,0.3)' : 'none'
            }}
          >
            🔧 Fleet & Fuel
            <span style={{ background: activeTab === 'Maintenance' ? 'rgba(255,255,255,0.3)' : C.forest, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>
              {maintenancePending.length}
            </span>
          </button>
        </div>

        {/* DATA TABLE */}
        {activeTab !== 'Maintenance' && (
        <div style={{ background: C.white, border: `2px solid ${C.midGray}` }}>
          <div style={{ padding: '16px 20px', borderBottom: `2px solid ${C.midGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase' }}>
              Pending {activeTab} Requests
            </h2>
            <Btn outline color={C.textSec} icon={RefreshCw} onClick={fetchRequests}>Refresh</Btn>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textSec }}>
              <SegmentedSpinner size={28} />
              <div style={{ fontWeight: 700 }}>Loading requests...</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : activeData.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textSec }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 800 }}>No pending requests</div>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>There are currently no store requests awaiting CEO approval for {activeTab}.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.dark, color: '#fff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Request #</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Requester</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>Items</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeData.map((req, i) => (
                  <tr key={req.id} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800 }}>{req.request_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: activeTab === 'Car Rental' ? '#e0f2fe' : '#f0fdf4',
                        color: activeTab === 'Car Rental' ? C.blue : C.olive,
                        border: `1.5px solid ${activeTab === 'Car Rental' ? C.blue : C.olive}`,
                        padding: '3px 10px', fontSize: 11, fontWeight: 900,
                        textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        {activeTab === 'Car Rental' ? <Truck size={11} /> : <Leaf size={11} />}
                        {activeTab}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.textSec }}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{req.requester_name || 'Unknown'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: C.forest, color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: 11 }}>
                        {req.item_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Btn color={C.blue} icon={Eye} onClick={() => fetchDetail(activeTab, req.id)}>Review</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        )}

        {/* ══ MAINTENANCE TAB ══ */}
        {activeTab === 'Maintenance' && (
          <div>

            {/* ── PENDING CEO APPROVAL ── */}
            <div style={{ background: C.white, border: `2px solid ${C.midGray}`, marginBottom: 24 }}>
              <div style={{ padding: '16px 20px', borderBottom: `2px solid ${C.midGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e40af' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>⏳ Pending Your Approval</h2>
                <Btn outline color="#fff" icon={RefreshCw} onClick={fetchMaintenance}>Refresh</Btn>
              </div>
              {maintenancePending.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.textSec }}>
                  <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 800 }}>All clear — no pending approvals</div>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>No maintenance requests are waiting for your approval.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1e40af', color: '#fff' }}>
                      {['ID', 'Asset', 'Type', 'Department', 'Cost (ETB)', 'Scheduled', 'Priority', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Action' ? 'right' : 'left', fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maintenancePending.map((r, i) => {
                      const isExpanded = expandedMaint === r.id;
                      const parsedImages = r.images ? JSON.parse(r.images) : [];
                      return (
                        <React.Fragment key={r.id}>
                          <tr style={{ borderBottom: isExpanded ? 'none' : `1px solid ${C.midGray}`, background: isExpanded ? '#EFF6FF' : (i % 2 === 0 ? C.white : '#F0F9FF'), transition: 'background 0.2s' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 900, color: '#1e40af', fontFamily: 'monospace' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => setExpandedMaint(isExpanded ? null : r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1e40af', display: 'flex', alignItems: 'center' }}>
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {r.isFuel ? 'FS-' : 'MNT-'}{String(r.id).padStart(4, '0')}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                              <div>{r.asset_name}</div>
                              <div style={{ fontSize: 11, color: C.textSec, textTransform: 'capitalize' }}>{r.asset_type}</div>
                            </td>
                            <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{r.type}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: r.asset_type === 'tractor' ? '#f0fdf4' : '#e0f2fe', color: r.asset_type === 'tractor' ? C.olive : C.blue, border: `1.5px solid ${r.asset_type === 'tractor' ? C.olive : C.blue}`, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                                {r.asset_type === 'tractor' ? '🌿 AgriRent' : '🚗 Car Rental'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1e40af' }}>ETB {(r.estimated_cost_cents / 100).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                            <td style={{ padding: '12px 16px', color: C.textSec }}>{new Date(r.requested_date || r.scheduled_date).toLocaleDateString('en-GB')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: r.priority==='Urgent'?'#FEE2E2':r.priority==='High'?'#FFEDD5':C.sageLight, color: r.priority==='Urgent'?'#B91C1C':r.priority==='High'?'#C2410C':C.dark }}>
                                {r.priority || 'Normal'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Btn color={C.forest} icon={CheckCircle} onClick={() => handleApproveMaintenance(r)} disabled={processing}>Approve</Btn>
                            </td>
                          </tr>
                        {isExpanded && (
                          <tr style={{ background: '#F0FDF4', borderBottom: `1px solid ${C.midGray}` }}>
                            <td colSpan={8} style={{ padding: '0 24px 24px 44px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 20, background: '#fff', border: `1px solid ${C.sage}`, borderRadius: 8 }}>
                                <div>
                                  <h4 style={{ margin: '0 0 12px', color: C.dark, fontSize: 13, textTransform: 'uppercase', fontWeight: 900, borderBottom: `2px solid ${C.sage}`, paddingBottom: 6 }}>Service Details</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>DESCRIPTION</span><b>{r.description}</b></div>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>PRIORITY</span>
                                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: r.priority==='Urgent'?'#FEE2E2':r.priority==='High'?'#FFEDD5':C.sageLight, color: r.priority==='Urgent'?'#B91C1C':r.priority==='High'?'#C2410C':C.dark }}>
                                        {r.priority || 'Normal'}
                                      </span>
                                    </div>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>MECHANIC / GARAGE</span>{r.mechanic_name || 'N/A'}</div>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>MECHANIC PHONE</span>{r.mechanic_phone || 'N/A'}</div>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>LOCATION</span>{r.location || 'N/A'}</div>
                                    <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>REPORTED BY</span>{r.reported_by || 'N/A'}</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 style={{ margin: '0 0 12px', color: C.dark, fontSize: 13, textTransform: 'uppercase', fontWeight: 900, borderBottom: `2px solid ${C.sage}`, paddingBottom: 6 }}>Notes & Attachments</h4>
                                  {r.notes && <div style={{ fontSize: 13, background: '#F8FAFC', padding: 12, border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: 16 }}>{r.notes}</div>}
                                  {!r.notes && parsedImages.length === 0 && <div style={{ color: C.textSec, fontSize: 12, fontStyle: 'italic' }}>No additional notes or images provided.</div>}
                                  
                                  {parsedImages.length > 0 && (
                                    <div>
                                      <span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ATTACHED IMAGE</span>
                                      <div style={{ display: 'flex', gap: 12 }}>
                                        {parsedImages.map((img, idx) => (
                                          <div key={idx} style={{ width: 120, height: 120, border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')}>
                                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Damage/Proforma" />
                                          </div>
                                        ))}
                                      </div>
                                      <div style={{ fontSize: 10, color: C.textSec, marginTop: 6 }}>Click image to view full size</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

            {/* ── MAINTENANCE RECORDS (Completed/Released) ── */}
            <div style={{ background: C.white, border: `2px solid ${C.midGray}` }}>
              <div style={{ padding: '16px 20px', borderBottom: `2px solid ${C.midGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.dark }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>🔧 Fleet & Fuel Records</h2>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 900 }}>{maintenanceDone.length} record{maintenanceDone.length !== 1 ? 's' : ''}</span>
              </div>
              {maintenanceDone.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.textSec }}>
                  <Package size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 800 }}>No completed records yet</div>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>Approved and paid maintenance requests will appear here.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.dark, color: '#fff' }}>
                      {['ID', 'Asset', 'Type', 'Dept', 'Cost (ETB)', 'Scheduled', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceDone.map((r, i) => {
                      const statusColors = {
                        PENDING_FINANCE:  { bg: '#FFF3E0', color: '#E65100', label: 'Awaiting Finance' },
                        FINANCE_READY:    { bg: '#EDE9FE', color: '#6D28D9', label: 'Finance Confirmed' },
                        FINANCE_APPROVED: { bg: '#E3F2FD', color: '#1565C0', label: 'Finance Approved' },
                        PAYMENT_RELEASED: { bg: '#DCFCE7', color: '#15803D', label: '✅ Payment Released' },
                        COMPLETED:        { bg: C.forest,  color: '#fff',     label: '✅ Completed' },
                      };
                      const s = statusColors[r.status] || { bg: '#EEE', color: '#616161', label: r.status };
                      return (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                          <td style={{ padding: '12px 16px', fontWeight: 900, color: C.forest, fontFamily: 'monospace' }}>
                            {r.isFuel ? 'FS-' : 'MNT-'}{String(r.id).padStart(4, '0')}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                            <div>{r.asset_name}</div>
                            <div style={{ fontSize: 11, color: C.textSec, textTransform: 'capitalize' }}>{r.asset_type}</div>
                          </td>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{r.type}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: r.asset_type === 'tractor' ? '#f0fdf4' : '#e0f2fe', color: r.asset_type === 'tractor' ? C.olive : C.blue, border: `1.5px solid ${r.asset_type === 'tractor' ? C.olive : C.blue}`, padding: '3px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                              {r.asset_type === 'tractor' ? '🌿 AgriRent' : '🚗 Car Rental'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: C.forest }}>ETB {(r.estimated_cost_cents / 100).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                          <td style={{ padding: '12px 16px', color: C.textSec }}>{new Date(r.requested_date || r.scheduled_date).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, border: `1px solid ${s.color}` }}>{s.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ PAST REQUESTS (FLOW HISTORY) — ALL DEPARTMENTS ══ */}
        {activeTab !== 'Maintenance' && (
          <>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ borderLeft: `5px solid ${C.blue}`, paddingLeft: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.darkGray, textTransform: 'uppercase' }}>
                Past Requests — Flow History
              </h2>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 2, fontWeight: 600 }}>
                {allHistory.length} total record{allHistory.length !== 1 ? 's' : ''} across all departments
              </div>
            </div>
          {/* Department Filter Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Car Rental', 'AgriRent', 'Maintenance'].map(f => {
              const isActive = historyFilter === f;
              const col = f === 'Car Rental' ? C.blue : f === 'AgriRent' ? C.olive : f === 'Maintenance' ? C.forest : C.darkGray;
              const Icon = f === 'Car Rental' ? Truck : f === 'AgriRent' ? Leaf : f === 'Maintenance' ? Wrench : null;
              return (
                <button key={f} onClick={() => setHistoryFilter(f)} style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  background: isActive ? col : C.white,
                  color: isActive ? '#fff' : col,
                  border: `2px solid ${isActive ? col : C.midGray}`,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  boxShadow: isActive ? `0 3px 8px ${col}40` : 'none',
                }}>
                  {Icon && <Icon size={12} />}
                  {f}
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.3)' : col,
                    color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, fontWeight: 900,
                  }}>
                    {f === 'All' ? allHistory.length : f === 'Car Rental'
                      ? allHistory.filter(r => r.department === 'Car Rental' || (!r.department && !r.isMaintenance)).length
                      : allHistory.filter(r => r.department === f).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.white, border: `2px solid ${C.midGray}` }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textSec }}>
              <SegmentedSpinner size={28} />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textSec }}>
              <Package size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 800 }}>No history records{historyFilter !== 'All' ? ` for ${historyFilter}` : ''}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.dark, color: '#fff' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Request #</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Items</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((r, i) => {
                  const isOpen = !!expandedRows[r.id];
                  const det = rowDetails[r.id];
                  const loadingDet = !!rowDetailLoading[r.id];
                  const dept = r.department || 'Car Rental';
                  const deptColor = dept === 'AgriRent' ? C.olive : dept === 'Maintenance' ? C.forest : C.blue;
                  const DeptIcon = dept === 'AgriRent' ? Leaf : dept === 'Maintenance' ? Wrench : Truck;

                  return (
                    <React.Fragment key={r.id}>
                      <tr style={{ borderBottom: isOpen ? 'none' : `1px solid ${C.midGray}`, background: i % 2 === 0 ? C.white : C.sageLight }}>
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 900, color: C.forest, fontFamily: 'monospace', fontSize: 12 }}>{r.request_number}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            background: dept === 'AgriRent' ? '#f0fdf4' : dept === 'Maintenance' ? '#E8F5E9' : '#e0f2fe',
                            color: deptColor, border: `1.5px solid ${deptColor}`,
                            padding: '3px 10px', fontSize: 11, fontWeight: 800,
                            textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <DeptIcon size={11} />{dept}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: C.textSec, fontWeight: 700 }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: C.sageLight, border: `1px solid ${C.sage}`, color: C.forest, padding: '3px 10px', fontWeight: 800, fontSize: 12 }}>{r.item_count || '—'}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding: '11px 14px' }}>
                          <button onClick={() => toggleRowDetail(r)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'none',
                            border: `1.5px solid ${isOpen ? C.forest : C.blue}`, color: isOpen ? C.forest : C.blue,
                            fontWeight: 800, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', borderRadius: 0,
                          }}>
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {isOpen ? 'View Less' : 'View More'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, borderBottom: `2px solid ${C.forest}` }}>
                            <div style={{ background: '#F0F7F0', borderLeft: `5px solid ${deptColor}`, padding: '18px 28px' }}>
                              {loadingDet ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: C.textSec }}><SegmentedSpinner size={18} /> Loading...</div>
                              ) : det ? (
                                <>
                                  {det.isMaintenance ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                      <div>
                                        <h4 style={{ margin: '0 0 12px', color: C.dark, fontSize: 13, textTransform: 'uppercase', fontWeight: 900, borderBottom: `2px solid ${C.sage}`, paddingBottom: 6 }}>Service Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                                          <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>DESCRIPTION</span><b>{det.description}</b></div>
                                          <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>PRIORITY</span>
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: det.priority==='Urgent'?'#FEE2E2':det.priority==='High'?'#FFEDD5':C.sageLight, color: det.priority==='Urgent'?'#B91C1C':det.priority==='High'?'#C2410C':C.dark }}>
                                              {det.priority || 'Normal'}
                                            </span>
                                          </div>
                                          <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>MECHANIC</span>{det.mechanic_name || 'N/A'}</div>
                                          <div><span style={{ color: C.textSec, display: 'block', fontSize: 11, fontWeight: 700 }}>LOCATION</span>{det.location || 'N/A'}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 style={{ margin: '0 0 12px', color: C.dark, fontSize: 13, textTransform: 'uppercase', fontWeight: 900, borderBottom: `2px solid ${C.sage}`, paddingBottom: 6 }}>Notes & Attachments</h4>
                                        {det.notes && <div style={{ fontSize: 13, background: '#fff', padding: 12, border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: 12 }}>{det.notes}</div>}
                                        {det.images && JSON.parse(det.images).length > 0 && (
                                          <div style={{ display: 'flex', gap: 8 }}>
                                            {JSON.parse(det.images).map((img, idx) => (
                                              <div key={idx} style={{ width: 80, height: 80, border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')}>
                                                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Attachment" />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
                                        {[
                                          { label: 'Department', value: dept },
                                          { label: 'Requested By', value: det.requester_name || '—' },
                                          { label: 'CEO Approved By', value: det.approver_name || '—' },
                                          { label: 'Store Handler', value: det.store_handler_name || '—' },
                                        ].map(f => (
                                          <div key={f.label} style={{ borderLeft: `3px solid ${C.sage}`, paddingLeft: 12 }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: C.textSec, textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray }}>{f.value}</div>
                                          </div>
                                        ))}
                                      </div>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                          <tr style={{ background: C.dark }}>
                                            {['#', 'Product', 'Qty Requested', 'Qty Shipped', 'Status'].map(h => (
                                              <th key={h} style={{ padding: '8px 12px', color: '#fff', fontWeight: 800, fontSize: 10, textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(det.items || []).map((it, idx) => (
                                            <tr key={idx} style={{ borderBottom: `1px solid ${C.midGray}`, background: '#fff' }}>
                                              <td style={{ padding: '8px 12px', color: C.textSec }}>{idx + 1}</td>
                                              <td style={{ padding: '8px 12px', fontWeight: 800 }}>{it.product_name}</td>
                                              <td style={{ padding: '8px 12px', fontWeight: 900, color: C.forest }}>{it.quantity_requested}</td>
                                              <td style={{ padding: '8px 12px', fontWeight: 800, color: C.emerald }}>{it.quantity_shipped ?? '—'}</td>
                                              <td style={{ padding: '8px 12px' }}>
                                                {it.quantity_shipped ? <span style={{ color: C.emerald, fontWeight: 800, fontSize: 10 }}>✓ SHIPPED</span> : <span style={{ color: C.textSec, fontSize: 10 }}>—</span>}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </>
                                  )}
                                </>
                              ) : (
                                <div style={{ color: C.red, fontSize: 13, fontWeight: 700 }}>Failed to load details.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {viewDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ background: C.white, width: '100%', maxWidth: 700, borderTop: `6px solid ${C.forest}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: `2px solid ${C.midGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: C.darkGray }}>
                  Review {viewDetail.type} Request
                </h2>
                <div style={{ color: C.textSec, fontSize: 13, marginTop: 4, fontWeight: 700 }}>{viewDetail.data.request_number}</div>
              </div>
              <button onClick={() => setViewDetail(null)} style={{ background: 'none', border: 'none', fontSize: 24, color: C.textSec, cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto' }}>
              <div style={{ background: '#F9FAFB', border: `2px solid ${C.midGray}`, padding: 16, marginBottom: 24, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <div style={{ color: C.textSec, fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>Requested By</div>
                    <div style={{ fontWeight: 800, color: C.darkGray }}>{viewDetail.data.requester_name}</div>
                  </div>
                  <div>
                    <div style={{ color: C.textSec, fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontWeight: 800, color: C.darkGray }}>{new Date(viewDetail.data.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <div style={{ color: C.textSec, fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}>Notes / Reason</div>
                  <div style={{ fontWeight: 700, color: C.darkGray, fontStyle: viewDetail.data.notes ? 'normal' : 'italic' }}>
                    {viewDetail.data.notes || 'No notes provided.'}
                  </div>
                </div>
              </div>

              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: C.darkGray }}>Requested Items</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: `2px solid ${C.midGray}` }}>
                <thead>
                  <tr style={{ background: C.dark, color: '#fff' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800 }}>Product</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>Qty Requested</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>In Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewDetail.data.items || []).map((it, idx) => {
                    const lowStock = (it.stock_quantity || 0) < it.quantity_requested;
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.midGray}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800 }}>{it.product_name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: 14 }}>{it.quantity_requested}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: lowStock ? C.red : C.forest }}>
                          {it.stock_quantity || 0}
                          {lowStock && <div style={{ fontSize: 10, color: C.red }}>Low Stock!</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '16px 24px', background: '#F9FAFB', borderTop: `2px solid ${C.midGray}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Btn outline color={C.textSec} onClick={() => setViewDetail(null)}>Close</Btn>
              <Btn color={C.red} icon={XCircle} onClick={() => setRejectModal({ type: viewDetail.type, id: viewDetail.data.id })} disabled={processing}>Reject</Btn>
              <Btn color={C.forest} icon={CheckCircle} onClick={() => handleApprove(viewDetail.type, viewDetail.data.id)} disabled={processing}>Approve & Send to Store</Btn>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }}>
          <div style={{ background: C.white, width: '100%', maxWidth: 450, borderTop: `5px solid ${C.red}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: C.darkGray }}>Reject {rejectModal.type} Request</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textSec }}>Please provide a reason for rejecting this request. It will be sent back to the manager.</p>
              <textarea 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Type rejection reason here..."
                rows={4}
                style={{ width: '100%', padding: 12, border: `2px solid ${C.midGray}`, outline: 'none', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '16px 24px', background: '#F9FAFB', borderTop: `1px solid ${C.midGray}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Btn outline color={C.textSec} onClick={() => { setRejectModal(null); setRejectionReason(''); }}>Cancel</Btn>
              <Btn color={C.red} icon={XCircle} onClick={handleReject} disabled={processing}>Confirm Reject</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
