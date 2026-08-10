import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, Users, ClipboardList, Settings, BarChart2, ShoppingCart, FileText, Wallet,
  CreditCard, TrendingUp, Package, Truck, Printer, Layers, Receipt, AreaChart,
  List, User, FilePlus, Box, ArrowRight, Bell, Search, LogOut, ChevronDown, Monitor, CheckCircle, Car, X,
  Target, Shield, AlertTriangle, GitBranch, Scale, Building, AlertOctagon, UserCheck, Layout, Lock,
  Key, Sprout, Pill, CirclePlus, MessageCircle, ChevronRight, Clock, Book, AlertCircle,
  Sliders, RotateCcw, UserPlus, Upload, Droplet, CheckCircle2, AlertCircle as AlertCircle2, Info, X as XIcon, EyeOff,
  Folder, Image, Wrench, Inbox, UploadCloud, Eye, GitCommit, Cpu, Activity, Scissors, Archive, Star, RotateCcw as RepeatCcw,
  PenTool, PieChart, DollarSign, FolderOpen, Award, Check, RefreshCw, Camera
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification, requestPermission } from '../../services/notificationManager';
import { io } from 'socket.io-client';
import UserProfile from '../../pages/shared/UserProfile';
import './DashboardLayout.css';
import SegmentedSpinner from '../ui/SegmentedSpinner';

const ICONS = {
  default:       <Box size={18} strokeWidth={2.5} />,
  dashboard:     <Home size={18} strokeWidth={2.5} />,
  users:         <Users size={18} strokeWidth={2.5} />,
  clipboard:     <ClipboardList size={18} strokeWidth={2.5} />,
  settings:      <Settings size={18} strokeWidth={2.5} />,
  'bar-chart':   <BarChart2 size={18} strokeWidth={2.5} />,
  'bar-chart-2': <BarChart2 size={18} strokeWidth={2.5} />,
  database:      <Monitor size={18} strokeWidth={2.5} />,
  'shopping-cart':<ShoppingCart size={18} strokeWidth={2.5} />,
  'file-text':   <FileText size={18} strokeWidth={2.5} />,
  wallet:        <Wallet size={18} strokeWidth={2.5} />,
  'credit-card': <CreditCard size={18} strokeWidth={2.5} />,
  'trending-up': <TrendingUp size={18} strokeWidth={2.5} />,
  package:       <Package size={18} strokeWidth={2.5} />,
  truck:         <Truck size={18} strokeWidth={2.5} />,
  printer:       <Printer size={18} strokeWidth={2.5} />,
  layers:        <Layers size={18} strokeWidth={2.5} />,
  receipt:       <Receipt size={18} strokeWidth={2.5} />,
  analytics:     <AreaChart size={18} strokeWidth={2.5} />,
  home:          <Home size={18} strokeWidth={2.5} />,
  list:          <List size={18} strokeWidth={2.5} />,
  user:          <User size={18} strokeWidth={2.5} />,
  'file-plus':   <FilePlus size={18} strokeWidth={2.5} />,
  box:           <Box size={18} strokeWidth={2.5} />,
  'arrow-right': <ArrowRight size={18} strokeWidth={2.5} />,
  target:        <Target size={18} strokeWidth={2.5} />,
  shield:        <Shield size={18} strokeWidth={2.5} />,
  'alert-triangle': <AlertTriangle size={18} strokeWidth={2.5} />,
  'git-branch':  <GitBranch size={18} strokeWidth={2.5} />,
  scale:         <Scale size={18} strokeWidth={2.5} />,
  building:      <Building size={18} strokeWidth={2.5} />,
  'alert-octagon': <AlertOctagon size={18} strokeWidth={2.5} />,
  'user-check':  <UserCheck size={18} strokeWidth={2.5} />,
  layout:        <Layout size={18} strokeWidth={2.5} />,
  lock:          <Lock size={18} strokeWidth={2.5} />,
  monitor:       <Monitor size={18} strokeWidth={2.5} />,
  car:           <Car size={18} strokeWidth={2.5} />,
  key:           <Key size={18} strokeWidth={2.5} />,
  sprout:        <Sprout size={18} strokeWidth={2.5} />,
  pill:          <Pill size={18} strokeWidth={2.5} />,
  'plus-circle': <CirclePlus size={18} strokeWidth={2.5} />,
  'message-circle': <MessageCircle size={18} strokeWidth={2.5} />,
  search:        <Search size={18} strokeWidth={2.5} />,
  'check-square': <CheckCircle size={18} strokeWidth={2.5} />,
  'check-circle': <CheckCircle size={18} strokeWidth={2.5} />,
  clock:         <Clock size={18} strokeWidth={2.5} />,
  x:             <X size={18} strokeWidth={2.5} />,
  book:          <Book size={18} strokeWidth={2.5} />,
  'alert-circle': <AlertCircle size={18} strokeWidth={2.5} />,
  sliders:       <Sliders size={18} strokeWidth={2.5} />,
  'rotate-ccw':  <RotateCcw size={18} strokeWidth={2.5} />,
  'user-plus':   <UserPlus size={18} strokeWidth={2.5} />,
  upload:        <Upload size={18} strokeWidth={2.5} />,
  droplet:       <Droplet size={18} strokeWidth={2.5} />,
  calendar:      <Clock size={18} strokeWidth={2.5} />,
  'eye-off':     <EyeOff size={18} strokeWidth={2.5} />,
  // Printing Dashboard icons
  folder:        <Folder size={18} strokeWidth={2.5} />,
  image:         <Image size={18} strokeWidth={2.5} />,
  tool:          <Wrench size={18} strokeWidth={2.5} />,
  inbox:         <Inbox size={18} strokeWidth={2.5} />,
  'upload-cloud':<UploadCloud size={18} strokeWidth={2.5} />,
  eye:           <Eye size={18} strokeWidth={2.5} />,
  'git-commit':  <GitCommit size={18} strokeWidth={2.5} />,
  cpu:           <Cpu size={18} strokeWidth={2.5} />,
  activity:      <Activity size={18} strokeWidth={2.5} />,
  scissors:      <Scissors size={18} strokeWidth={2.5} />,
  archive:       <Archive size={18} strokeWidth={2.5} />,
  star:          <Star size={18} strokeWidth={2.5} />,
  'pen-tool':    <PenTool size={18} strokeWidth={2.5} />,
  'pie-chart':   <PieChart size={18} strokeWidth={2.5} />,
  'dollar-sign': <DollarSign size={18} strokeWidth={2.5} />,
  default:       <CheckCircle size={18} strokeWidth={2.5} />
};

/* ── Notification Bell with dropdown ── */
const NotificationBell = ({ navigate, refreshTrigger, ceoPending, setCeoPending, isCeoRoute, ceoPendingSnapshot, setCeoPendingSnapshot, storeApprovalsPending = 0, pharmacyPending, pharmacyOnlinePending, setPharmacyOnlinePending, purchasePending, purchaseApprovedTenders, setPurchaseApprovedTenders, procurementMessages, purchaseNewBids, purchaseBidsList, setPurchaseBidsList, setPurchaseNewBids, ceoFundRequestsPending, agriRentPending, onOpenProcurementInbox, pcvNotifications = [], setPcvNotifications, isFinanceRoute = false, isPharmacyManagerRoute = false, chatUnread = 0, setChatUnread }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await notificationService.getMyNotificationsV2();
      if (res?.status === 'success' && Array.isArray(res.data)) {
        setItems(res.data.map(n => ({ ...n, isRead: n.is_read ?? n.isRead ?? false })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAction = async (e, actionType, reqId) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/procurement/requests/${reqId}/decision`, { 
        decision: actionType, 
        ceoNotes: actionType === 'CEO_REJECTED' ? 'Rejected from quick actions' : '' 
      });
      // Trigger a refresh of the pending counts
      if (refreshTrigger !== undefined) {
        // If DashboardLayout provides a way to refresh, or we just call the fetch again.
        // The load is dependent on refreshTrigger. But let's just trigger a full reload.
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsReadV2();
      setItems(prev => prev.map(i => ({ ...i, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const markRead = async (id) => {
    try {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
      await notificationService.markAsReadV2(id);
      load();
    } catch (e) { console.error(e); }
  };

  // Maps known broken/non-existent notification links to real working routes
  const resolveLink = (link, isCeo) => {
    if (!link) return isCeo ? '/ceo/overview' : '/';
    
    // 2. Finance Route Check
    const financeMap = {
      '/finance/crv': '/finance/crv',
      '/finance/pv': '/finance/pv',
      '/finance/pcv': '/finance/pcv',
      '/finance/pending-pcvs': '/finance/pcv', // Fallback for old notifications
      '/finance/cash-book': '/finance/cash-book',
    };

    // Exact or prefix matches → map to working route
    const ceoMap = {
      '/ceo/pharmacy-approvals': '/ceo/pharmacy',
      '/ceo/pharmacy-transfers': '/ceo/flow1-transfers',
      '/ceo/pharmacy-reports': '/ceo/pharmacy',
      '/ceo/expired-drugs': '/ceo/pharmacy',
      '/ceo/tender-decisions': '/ceo/tender-full',
      '/ceo/purchase-flow': '/ceo/flow2-purchase',
      '/ceo/fund-requests': '/ceo/fund-approvals',
      '/ceo/deliveries': '/ceo/direct-delivery',
      '/ceo/manager-requests': '/ceo/manager-requests',
      '/ceo/tenders': '/ceo/tenders',
      '/ceo/finance-approvals': '/ceo/finance-approvals',
    };
    // Check prefix matches for finance map
    for (const [prefix, target] of Object.entries(financeMap)) {
      if (link === prefix || link.startsWith(prefix + '/') || link.startsWith(prefix + '?')) return target;
    }
    
    // Check prefix matches for ceo map
    for (const [prefix, target] of Object.entries(ceoMap)) {
      if (link === prefix || link.startsWith(prefix + '/') || link.startsWith(prefix + '?')) return target;
    }
    // If CEO is browsing, trust any /ceo/ route
    if (isCeo && link.startsWith('/ceo/')) return link;
    
    // If a non-CEO (like Purchase Manager) clicks a generic broadcast link meant for CEO:
    if (!isCeo && link.startsWith('/ceo/tenders')) return '/purchase/smart-tenders';
    
    return link;
  };

  const handleClick = (item) => {
    setOpen(false);
    if (item.id) markRead(item.id);
    const resolved = resolveLink(item.link, isCeoRoute);
    if (resolved) {
      // Pass a state timestamp so same-route pages can detect and re-fetch
      navigate(resolved, { state: { bellTs: Date.now() } });
    }
  };

  const handleCeoClick = (item) => {
    setOpen(false);

    // Determine navigation target - use item.link directly, fallback to /ceo/tenders
    const link = item.link || '/ceo/tenders';

    // Optimistically remove clicked item from ceoPending so it vanishes from the bell
    if (setCeoPending) {
      setCeoPending(prev => {
        return prev
          .map(g => ({
            ...g,
            details: g.details ? g.details.filter(d => d.id !== item.id) : []
          }))
          .map(g => ({ ...g, count: g.details ? g.details.length : 0 }))
          .filter(g => g.count > 0);
      });
    }

    // Tell the server we read this so it doesn't show up again
    if (item.type && item.id) {
      apiClient.post('/erp/mark-ceo-read', { type: item.type, id: item.id }).catch(() => {});
    }

    // Navigate using React Router to avoid hard page refresh
    navigate(link, { state: { bellTs: Date.now() } });
  };

  const bellDebounce = React.useRef(null);
  useEffect(() => {
    if (bellDebounce.current) clearTimeout(bellDebounce.current);
    bellDebounce.current = setTimeout(() => { load(); }, 1500);
    return () => { if (bellDebounce.current) clearTimeout(bellDebounce.current); };
  }, [refreshTrigger]);

  const ceoTotal = (ceoPending || []).reduce((s, i) => s + i.count, 0);
  const ceoNew = Math.max(0, ceoTotal - (ceoPendingSnapshot || 0));
  const notifCount = items.filter(i => !i.isRead).length;
  const pcvUnread = (pcvNotifications || []).filter(n => !n.read).length;
  const totalBadge = (
    (ceoPending?.reduce((s, g) => s + (g.count || 0), 0) || 0) +
    (ceoFundRequestsPending || 0) +
    (storeApprovalsPending || 0) +
    (isPharmacyManagerRoute ? pharmacyPending : 0) +
    (window.location.pathname.startsWith('/pharmacy-worker') ? (pharmacyOnlinePending || 0) : 0) +
    purchasePending +
    (purchaseApprovedTenders?.length || 0) +
    procurementMessages +
    purchaseNewBids +
    (agriRentPending || 0) +
    notifCount +
    pcvUnread +
    (chatUnread || 0)
  );

  useEffect(() => {
    if (open && ceoTotal > 0) setCeoPendingSnapshot(ceoTotal);
  }, [open]);

  const safeDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="dash-notif-btn"
        title="Notifications"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative' }}
      >
        <Bell size={18} color="#047857" style={{ filter: 'drop-shadow(0 2px 4px rgba(4,120,87,0.35))' }} />
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            backgroundColor: '#047857', color: 'white',
            borderRadius: '9999px', fontSize: '10px', fontWeight: '700',
            minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1
          }}>{totalBadge > 9 ? '9+' : totalBadge}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '360px', backgroundColor: 'white',
          borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>Notifications</span>
            {totalBadge > 0 && <span style={{ fontSize: '12px', color: '#6B7280' }}>{totalBadge} unread</span>}
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {ceoPending.length > 0 && ceoPending.map((item, idx) => (
              <div key={'ceo-' + idx}>
                <div
                  onClick={() => handleCeoClick(item)}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#FEF3C7', transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#FDE68A' }}>
                    <AlertTriangle size={16} color="#D97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#92400E' }}>Pending CEO Action</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#A16207', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                  </div>
                </div>
                {item.details && item.details.map(detail => (
                  <div key={detail.id} style={{ padding: '10px 18px 10px 48px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFBEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleCeoClick({ ...detail, link: detail.link || item.link })}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#92400E' }}>{detail.title}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#B45309' }}>{detail.subtitle}</p>
                      </div>
                      {detail.type === 'procurement' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={(e) => handleQuickAction(e, 'APPROVED', detail.id)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>APPROVE</button>
                          <button onClick={(e) => handleQuickAction(e, 'CEO_REJECTED', detail.id)} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>REJECT</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {isCeoRoute && ceoFundRequestsPending > 0 && (
              <div
                onClick={() => { setOpen(false); navigate('/ceo/tenders?tab=Fund+Requests', { state: { bellTs: Date.now() } }); }}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: '#FDF2F8', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FCE7F3'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FDF2F8'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#FBCFE8' }}>
                  <span style={{ fontSize: '18px' }}>💰</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#9D174D' }}>Fund Request Awaiting Approval</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#BE185D' }}>{ceoFundRequestsPending} request{ceoFundRequestsPending > 1 ? 's' : ''} need your decision</p>
                </div>
              </div>
            )}

            {/* Store Update Approvals pending CEO review */}
            {isCeoRoute && storeApprovalsPending > 0 && (
              <div
                onClick={() => { setOpen(false); navigate('/ceo/store-approvals'); }}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: '#FFF7ED', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFEDD5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#FED7AA' }}>
                  <span style={{ fontSize: '18px' }}>📦</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#C2410C' }}>Store Inventory Update Pending</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#EA580C' }}>{storeApprovalsPending} item update{storeApprovalsPending > 1 ? 's' : ''} awaiting your approval</p>
                </div>
              </div>
            )}

            {purchasePending > 0 && (
              <div
                onClick={() => { setOpen(false); navigate('/purchase/tenders'); }}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: '#ECFDF5', transition: 'background 0.15s'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#BBF7D0' }}>
                  <CheckCircle size={16} color="#059669" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#065F46' }}>Tender Creation Required</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#059669' }}>{purchasePending} CEO-approved request{purchasePending > 1 ? 's' : ''} awaiting tender</p>
                </div>
              </div>
            )}
            
            {purchaseApprovedTenders && purchaseApprovedTenders.length > 0 && (
              <div key="purchase-approved-tenders">
                <div
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#ECFDF5'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#D1FAE5' }}>
                    <Award size={16} color="#059669" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#065F46' }}>Tender Approved &amp; Awarded</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#059669' }}>{purchaseApprovedTenders.length} tender(s) approved by CEO</p>
                  </div>
                </div>
                {purchaseApprovedTenders.map(t => (
                  <div
                    key={`appr-${t.id}`}
                    onClick={() => { setOpen(false); navigate(`/purchase/smart-tenders?viewTender=${t.id}`, { state: { bellTs: Date.now() } }); }}
                    style={{ padding: '10px 18px 10px 16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F0FDF4', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                  >
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#065F46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title} ({t.tender_number})</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#059669' }}>Click to view → Mark as Read on page</p>
                  </div>
                ))}
              </div>
            )}


            {window.location.pathname.startsWith('/pharmacy-worker') && pharmacyOnlinePending > 0 && (
              <Link
                to="/pharmacy-worker/sales"
                state={{ bellTs: Date.now(), tab: 'online' }}
                onClick={() => {
                  setOpen(false);
                  if (setPharmacyOnlinePending) setPharmacyOnlinePending(0);
                }}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#FEF2F2', transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#FEE2E2' }}>
                    <ShoppingCart size={16} color="#B91C1C" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '13px', color: '#B91C1C' }}>🔴 New Online Orders</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#DC2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pharmacyOnlinePending} online order{pharmacyOnlinePending > 1 ? 's' : ''} awaiting processing</p>
                  </div>
                </div>
              </Link>
            )}
            
            {pharmacyPending > 0 && isPharmacyManagerRoute && (
              <Link
                to="/pharmacy/store-inventory"
                state={{ tab: 'my_requests', bellTs: Date.now() }}
                onClick={() => setOpen(false)}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#BAE6FD'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E0F2FE'}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#E0F2FE', transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#BAE6FD' }}>
                    <Truck size={16} color="#0369A1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#0369A1' }}>Action Required</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#0284C7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pharmacyPending} Shipment{pharmacyPending > 1 ? 's' : ''} Awaiting Receipt</p>
                  </div>
                </div>
              </Link>
            )}
            {purchaseNewBids > 0 && (
              <div key="purchase-bids">
                <div
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#FEF3C7'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#FDE68A' }}>
                    <AlertTriangle size={16} color="#D97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#92400E' }}>New Bid(s) Submitted</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#A16207' }}>{purchaseNewBids} bids require evaluation</p>
                  </div>
                </div>
                {purchaseBidsList && purchaseBidsList.slice(0, 5).map(b => (
                  <div key={b.id} style={{ padding: '10px 18px 10px 48px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFBEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { 
                        setOpen(false);
                        if (setPurchaseBidsList) setPurchaseBidsList(prev => prev.filter(x => x.id !== b.id));
                        if (setPurchaseNewBids) setPurchaseNewBids(prev => Math.max(0, prev - 1));
                        navigate(`/purchase/smart-tenders?viewTender=${b.public_tender_id}`, { state: { bellTs: Date.now() } });
                      }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Bid from {b.competitor_name}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#B45309' }}>Pending Evaluation</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {procurementMessages > 0 && (
              <Link
                to="/purchase/smart-tenders"
                state={{ tab: 'contact', bellTs: Date.now() }}
                onClick={() => { setOpen(false); if (onOpenProcurementInbox) onOpenProcurementInbox(); }}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3E8FF'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FDF4FF'}
                  style={{
                    padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    backgroundColor: '#FDF4FF', transition: 'background 0.15s'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#F3E8FF' }}>
                    <MessageCircle size={16} color="#9333ea" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#6b21a8' }}>New Customer Messages</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9333ea' }}>{procurementMessages} unread message{procurementMessages > 1 ? 's' : ''} from public tender inquiries</p>
                  </div>
                </div>
              </Link>
            )}
            {/* Chat unread messages */}
            {chatUnread > 0 && (
              <div
                onClick={() => {
                  setOpen(false);
                  if (setChatUnread) setChatUnread(0);
                  // Navigate to the chat page based on current path
                  const base = window.location.pathname.split('/').slice(0, 2).join('/');
                  navigate(`${base}/chat`);
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: '#F0FDF4', transition: 'background 0.15s'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#BBF7D0' }}>
                  <MessageCircle size={16} color="#16A34A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '13px', color: '#065F46' }}>💬 New Chat Messages</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#16A34A' }}>{chatUnread} unread message{chatUnread > 1 ? 's' : ''} in Manager Chat</p>
                </div>
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', fontSize: 11, fontWeight: 800, minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              </div>
            )}
            {((ceoPending && ceoPending.length > 0) || pharmacyPending > 0) && items.filter(i => !i.isRead).length > 0 && <div style={{ borderTop: '1px solid #E5E7EB' }} />}
            {/* PCV Notifications */}
            {pcvNotifications.filter(n => !n.read).map(n => (
              <div
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  if (setPcvNotifications) {
                    setPcvNotifications(prev => prev.map(p => p.id === n.id ? { ...p, read: true } : p));
                  }
                  // Permanently mark read on server if it's a finance db notification
                  if (n.dbId) {
                    apiClient.put(`/finance-cash/pcv/${n.dbId}/finance-read`).catch(()=>{});
                  }
                  if (n.link) navigate(n.link, { state: { bellTs: Date.now() } });
                }}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: '#F0FDF4',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#DCFCE7' }}>
                  <Bell size={16} color="#16A34A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                    {n.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.message}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                    Just now
                  </p>
                </div>
              </div>
            ))}
            {items.filter(i => !i.isRead).length > 0 ? items.filter(i => !i.isRead).map((item, idx) => (
              <div
                key={item.id ? `notif-${item.id}` : `notif-idx-${idx}`}
                onClick={() => handleClick(item)}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #F9FAFB',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                  backgroundColor: item._type === 'car_request' ? '#EFF6FF' : '#F0FDF4',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: item._type === 'car_request' ? '#DBEAFE' : '#DCFCE7' }}>
                  {item._type === 'car_request' ? <Car size={16} color="#2563EB" /> : <Bell size={16} color="#16A34A" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.message}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                    {safeDate(item.createdAt)}
                  </p>
                </div>
              </div>
            )) : items.filter(i => !i.isRead).length === 0 && ceoPending.length === 0 && pharmacyPending === 0 && pharmacyOnlinePending === 0 && purchasePending === 0 && purchaseNewBids === 0 && procurementMessages === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
                <CheckCircle size={32} style={{ marginBottom: '8px', color: '#10B981' }} />
                <p style={{ margin: 0 }}>All caught up!</p>
              </div>
            ) : null}
          </div>
          {notifCount > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <button
                onClick={() => { navigate(isCeoRoute ? '/ceo/flow1-transfers' : '/notifications'); setOpen(false); }}
                  style={{ fontSize: '13px', color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >View All Notifications →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const Toast = ({ message, type, onClose }) => {
  const ICONS = { success: <CheckCircle2 size={20} color="#10B981" />, error: <AlertCircle2 size={20} color="#EF4444" />, warning: <AlertCircle2 size={20} color="#F59E0B" />, info: <Info size={20} color="#3B82F6" />, approved: <CheckCircle2 size={20} color="#10B981" />, rejected: <AlertCircle2 size={20} color="#EF4444" />, shipment: <Truck size={20} color="#8B5CF6" />, completed: <CheckCircle2 size={20} color="#059669" /> };
  const BG = { success: '#ECFDF5', error: '#FEF2F2', warning: '#FFFBEB', info: '#EFF6FF', approved: '#ECFDF5', rejected: '#FEF2F2', shipment: '#F5F3FF', completed: '#ECFDF5' };
  const BORDER = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6', approved: '#10B981', rejected: '#EF4444', shipment: '#8B5CF6', completed: '#059669' };
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: BG[type] || BG.info, border: `1px solid ${BORDER[type] || BORDER.info}40`, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', maxWidth: 420, animation: 'toastSlideIn 0.3s ease-out', fontFamily: 'Inter, sans-serif' }}>
      {ICONS[type] || ICONS.info}
      <span style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.4, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}><XIcon size={16} /></button>
    </div>
  );
};

const DashboardLayout = ({ children, menuItems, title, hideTopbar, noPadding }) => {
  const { user, logout, updateUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [toasts, setToasts] = useState([]);
  const [notifRefresh, setNotifRefresh] = useState(0);
  const [ceoPending, setCeoPending] = useState([]);
  const [ceoPendingSnapshot, setCeoPendingSnapshot] = useState(0);
  const [storeApprovalsPending, setStoreApprovalsPending] = useState(0);
  const [pharmacyPending, setPharmacyPending] = useState(0);
  const [pharmacyOnlinePending, setPharmacyOnlinePending] = useState(0);
  const [purchasePending, setPurchasePending] = useState(0);
  const [procurementMessages, setProcurementMessages] = useState(0);
  const [purchaseNewBids, setPurchaseNewBids] = useState(0);
  const [purchaseBidsList, setPurchaseBidsList] = useState([]);
  const [purchaseApprovedTenders, setPurchaseApprovedTenders] = useState([]);
  const [ceoFundRequestsPending, setCeoFundRequestsPending] = useState(0);
  const [agriRentPending, setAgriRentPending] = useState(0);
  const [pageNotifs, setPageNotifs] = useState([]); // unread notifs for current page
  const [pcvNotifications, setPcvNotifications] = useState([]); // PCV approval notifications
  const [photoUploading, setPhotoUploading] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const chatUnreadRef = useRef(0);
  const profileRef = useRef(null);
  const photoInputRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine resolved backend URL for profile photos
  const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanUrl}`;
};

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setPhotoUploading(true);
    try {
      const res = await apiClient.post('/users/profile-photo', formData);
      if (res?.data?.profilePhoto) {
        updateUser({ profilePhoto: res.data.profilePhoto });
        showToast('Profile photo updated!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload photo', 'error');
    } finally {
      setPhotoUploading(false);
      // reset input so same file can be re-selected
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const isCeoRoute = location.pathname.startsWith('/ceo');
  const isPharmacyRoute = location.pathname.startsWith('/pharmacy') && !location.pathname.startsWith('/pharmacy-worker') && !location.pathname.startsWith('/pharmacy/store');
  const isPurchaseRoute = location.pathname.startsWith('/purchase');
  const isFinanceRoute = location.pathname.startsWith('/finance');
  const isCarRentingRoute = location.pathname.startsWith('/car-renting');
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);
  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Listen for global hijacked alerts
  useEffect(() => {
    const handleGlobalToast = (e) => {
      const detail = e.detail;
      if (typeof detail === 'string') {
        showToast(detail, 'info');
      } else if (detail && detail.message) {
        showToast(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener('app-toast', handleGlobalToast);
    return () => window.removeEventListener('app-toast', handleGlobalToast);
  }, [showToast]);

  useEffect(() => {
    setExpandedMenus(prev => {
      const next = { ...prev };
      menuItems.forEach(item => {
        if (item.children) {
          const hasActive = item.children.some(child =>
            isActive(child.path, child) || (child.altActiveOn && child.altActiveOn.some(ap => isActive(ap)))
          );
          if (hasActive) next[item.label] = true;
        }
      });
      return next;
    });
  }, [location.pathname, menuItems]);

  useEffect(() => {
    requestPermission();
  }, []);

  // Poll total unread chat messages and fire browser notifications
  useEffect(() => {
    const pollChat = async () => {
      try {
        const res = await apiClient.get('/manager-chat/unread-counts');
        const map = res?.data || {};
        const count = typeof map === 'object' && !Array.isArray(map)
          ? Object.values(map).reduce((s, v) => s + Number(v || 0), 0)
          : 0;
        if (count > chatUnreadRef.current && chatUnreadRef.current !== undefined) {
          const diff = count - chatUnreadRef.current;
          // Browser push notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('💬 New Chat Message', {
              body: `You have ${diff} new message${diff > 1 ? 's' : ''} in Manager Chat`,
              icon: '/logo.png',
              tag: 'manager-chat',
              requireInteraction: false,
            });
          }
          // In-app toast
          showToast(`💬 ${diff} new chat message${diff > 1 ? 's' : ''}`, 'info');
        }
        chatUnreadRef.current = count;
        setChatUnread(count);
      } catch (_) {}
    };
    pollChat();
  }, [showToast]);

  useEffect(() => {
    let socket = null;
    let connectTimer = null;
    // Delay connection slightly to avoid premature close
    connectTimer = setTimeout(() => {
      socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', ''), {
        transports: ['polling', 'websocket'],  // polling first, then upgrade
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });
      socketRef.current = socket;
      socket.on('pharmacy-transfer', (data) => {
        const { title, message, type, link } = data || {};
        const soundMap = { approved: 'info', rejected: 'info', completed: 'success', shipment: 'success', sale_created: 'info', sales_report: 'info', report_rejected: 'info', expired_drug: 'info', prescription: 'info' };
        const soundName = soundMap[type] || 'info';
        playSound(soundName);
        sendPushNotification(title || 'Pharmacy Transfer', message || '', link || '');
        if (title) showToast(`${title}: ${message}`, type);
        setNotifRefresh(n => n + 1);
      });
      // Online Prescription Requests
      socket.on('new-prescription-request', (data) => {
        const { request_number, medication_name, quantity, customer_name } = data || {};
        playSound('info');
        sendPushNotification('New Online Order', `${customer_name} ordered ${medication_name} x${quantity}`, '/pharmacy-worker/sales');
        showToast(`New Online Order #${request_number}: ${customer_name} ordered ${medication_name}`, 'info');
        setNotifRefresh(n => n + 1);
        // Dispatch event for PharmacySalesForm to update cart if open
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      });
      // PCV Approval Notifications
      socket.on('finance-cash', (data) => {
        const { title, message, type, link } = data || {};
        const isCeo = location.pathname.startsWith('/ceo');
        const isFinance = location.pathname.startsWith('/finance');
        
        // Target notifications correctly
        const meantForCeo = link?.startsWith('/ceo');
        const meantForFinance = link?.startsWith('/finance');

        if ((isCeo && meantForCeo) || (isFinance && meantForFinance)) {
          if (title) showToast(`${title}: ${message}`, type || 'info');
          setPcvNotifications(prev => [{ id: Date.now(), title, message, link, type, read: false }, ...prev].slice(0, 10));
          setNotifRefresh(n => n + 1);
        }
      });
    }, 500);
    return () => {
      clearTimeout(connectTimer);
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    };
  }, [showToast]);

  useEffect(() => {
    if (isCeoRoute) {
      apiClient.get('/erp/ceo-pending').then(res => {
        if (res?.status === 'success') setCeoPending(res.data || []);
      }).catch(() => {});
      setCeoPendingSnapshot(0);
      // Fetch fund requests pending CEO approval
      apiClient.get('/public-procurement/fund-requests').then(res => {
        const requests = res?.data?.data || res?.data || [];
        setCeoFundRequestsPending(Array.isArray(requests) ? requests.filter(r => r.status === 'PENDING_CEO').length : 0);
      }).catch(() => {});
      // Fetch store updates pending CEO approval
      apiClient.get('/ceo/store-updates/pending').then(res => {
        const updates = res?.data?.updates || [];
        setStoreApprovalsPending(Array.isArray(updates) ? updates.length : 0);
      }).catch(() => {});
    } else {
      setCeoPending([]);
      setCeoPendingSnapshot(0);
      setCeoFundRequestsPending(0);
      setStoreApprovalsPending(0);
    }
    
    if (isFinanceRoute) {
      apiClient.get('/finance-cash/pcv/finance-notifications').then(res => {
        const pcvs = res?.data || [];
        setPcvNotifications(prev => {
          // Merge with existing socket notifications to avoid duplicates
          const existingIds = prev.map(p => p.dbId).filter(Boolean);
          const newNotifs = pcvs.filter(p => !existingIds.includes(p.id)).map(p => ({
            id: Date.now() + p.id,
            dbId: p.id,
            title: p.status === 'approved_finance' ? '✅ PCV Approved' : '❌ PCV Rejected',
            message: `PCV ${p.pcv_number} ${p.status === 'approved_finance' ? 'approved' : 'rejected'} by CEO.`,
            link: '/finance/pcv',
            type: p.status === 'approved_finance' ? 'success' : 'error',
            read: false
          }));
          return [...newNotifs, ...prev].slice(0, 10);
        });
      }).catch(() => {});
    }
    
    if (isPharmacyRoute || location.pathname.startsWith('/pharmacy-worker')) {
      apiClient.get('/transfer-requests').then(res => {
        const reqs = Array.isArray(res) ? res : (res?.data || []);
        setPharmacyPending(reqs.filter(r => r.status === 'SHIPPED').length);
      }).catch(() => {});
      // Only pharmacy-worker routes can access online prescription requests
      if (location.pathname.startsWith('/pharmacy-worker')) {
        apiClient.get('/pharmacy/requests/pending').then(res => {
          const reqs = Array.isArray(res?.data?.data) ? res.data.data : (res?.data || []);
          setPharmacyOnlinePending(reqs.length);
        }).catch(() => {});
      } else {
        setPharmacyOnlinePending(0);
      }
    } else {
      setPharmacyPending(0);
      setPharmacyOnlinePending(0);
    }

    if (isPurchaseRoute) {
      apiClient.get('/procurement/approved-for-purchase').then(res => {
        const items = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setPurchasePending(items.filter(r => r.status === 'APPROVED_FOR_PURCHASE' || r.status === 'IN_MARKET').length);
      }).catch(() => {});
      // Fetch unread procurement message count for notification bell
      apiClient.get('/procurement-settings/messages/unread-count').then(res => {
        setProcurementMessages(res?.count || 0);
      }).catch(() => {});
      apiClient.get('/public-tenders/internal/recent-bids').then(res => {
        if (res?.data?.data) {
          setPurchaseNewBids(res.data.data.length);
          setPurchaseBidsList(res.data.data);
        }
      }).catch(() => {});
      apiClient.get('/erp/purchase-pending-tenders').then(res => {
        if (res?.status === 'success') setPurchaseApprovedTenders(res.data || []);
      }).catch(() => {});
    } else {
      setPurchasePending(0);
      setProcurementMessages(0);
      setPurchaseNewBids(0);
      setPurchaseBidsList([]);
      setPurchaseApprovedTenders([]);
    }

    const hasAgriRole = user?.roles?.includes('Agri Rental Manager') || user?.roles?.includes('Admin') || user?.roles?.includes('CEO');
    if (isCarRentingRoute && hasAgriRole) {
      apiClient.get('/agrirent-orders?status=pending').then(res => {
        if (res?.data?.data?.orders) {
          setAgriRentPending(res.data.data.orders.length);
        }
      }).catch(() => {});
    } else {
      setAgriRentPending(0);
    }
  }, [location.pathname, isCeoRoute, isPharmacyRoute, isPurchaseRoute, isFinanceRoute, isCarRentingRoute, notifRefresh]);

  // Load page-level unread notifications matching current URL (debounced to prevent loop)
  const pageNotifDebounce = React.useRef(null);
  useEffect(() => {
    if (pageNotifDebounce.current) clearTimeout(pageNotifDebounce.current);
    pageNotifDebounce.current = setTimeout(() => {
      notificationService.getMyNotificationsV2().then(all => {
        const unread = (all || []).filter(n => {
          if (n.isRead) return false;
          if (!n.link) return false;
          const link = n.link.split('?')[0];
          return location.pathname === link || location.pathname.startsWith(link + '/');
        });
        setPageNotifs(unread);
      }).catch(() => {});
    }, 2000); // 2s debounce – collapses rapid notifRefresh bursts
    return () => { if (pageNotifDebounce.current) clearTimeout(pageNotifDebounce.current); };
  }, [location.pathname, notifRefresh]);

  const markPageNotifsRead = async () => {
    try {
      await Promise.all(pageNotifs.map(n => notificationService.markAsReadV2(n.id)));
      setPageNotifs([]);
      setNotifRefresh(p => p + 1);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const handleRefreshEvent = () => {
      // Trigger a re-fetch of notification counts
      setNotifRefresh(prev => prev + 1);
    };
    window.addEventListener('refreshNotifications', handleRefreshEvent);
    return () => window.removeEventListener('refreshNotifications', handleRefreshEvent);
  }, []);

  // Reset chat unread badge when user opens the chat page
  useEffect(() => {
    if (location.pathname.endsWith('/chat')) {
      setChatUnread(0);
      chatUnreadRef.current = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };
  const handleNav = (item) => {
    if (item.isExternal) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };
  const isActive = (path, item) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    const [p, qs] = path.split('?');
    if (qs !== undefined) {
      return (location.pathname + location.search) === path;
    }
    // Exact match OR it is a direct child segment (e.g. /sales/pos/123 but NOT /sales/pos-something)
    const segments = location.pathname.split('/');
    const pSegments = p.split('/');
    const exactOrChild =
      location.pathname === p ||
      (location.pathname.startsWith(p + '/') && segments.length === pSegments.length + 1);
    if (exactOrChild) return true;
    if (item?.altActiveOn) {
      return item.altActiveOn.some(ap => location.pathname === ap || location.pathname.startsWith(ap + '/'));
    }
    return false;
  };
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.path, child));
  };
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className={`dashboard-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>
      {/* Mobile Backdrop */}
      <div 
        className={`dash-mobile-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      {/* Sidebar */}
      <aside className={`dash-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {/* Brand */}
        <div className="dash-brand">
          <div className="dash-brand-inner" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="SUTANA" className="dash-brand-logo"
              onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="dash-brand-text">SUTANA</span>
          </div>
          {isSidebarOpen && (
            <button className="dash-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar">
              <X size={18} />
            </button>
          )}
        </div>
        {/* Nav Links */}
        <nav className="dash-nav">
          {menuItems.map((item, index) => {
            if (item.type === 'section') {
              return <div key={index} className="dash-nav-section-label">{item.label}</div>;
            }
            if (item.type === 'divider') {
              return <div key={index} className="dash-nav-divider" />;
            }
            if (item.children) {
              const isExpanded = expandedMenus[item.label];
              return (
                <div key={item.label || index} className="dash-nav-group">
                  <button
                    className={`dash-nav-item ${isParentActive(item) || isActive(item.path, item) ? 'active' : ''}`}
                    onClick={() => { toggleSubmenu(item.label); if (item.path) navigate(item.path); }}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {/* Show unread chat badge on parent 'Contact'/'Chat' groups */}
                    {chatUnread > 0 && item.children?.some(c => c.path?.endsWith('/chat')) && (
                      <span style={{
                        background: '#ef4444', color: '#fff', borderRadius: '9999px',
                        fontSize: '10px', fontWeight: 800, minWidth: 18, height: 18,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', marginRight: 4, flexShrink: 0
                      }}>{chatUnread > 9 ? '9+' : chatUnread}</span>
                    )}
                    <ChevronRight size={14} className={`dash-nav-chevron ${isExpanded ? 'open' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="dash-nav-submenu">
                      {item.children.map(child => (
                        <button
                          key={child.label || child.path}
                          className={`dash-nav-subitem ${child.className || ''} ${isActive(child.path, child) ? 'active' : ''}`}
                          onClick={() => handleNav(child)}
                        >
                          {child.icon && <span className="nav-icon sub-icon" style={child.color ? { color: child.color } : undefined}>{ICONS[child.icon] || ICONS.default}</span>}
                          <span style={{ flex: 1 }}>{child.label}</span>
                          {/* Generic badge from menu item definition */}
                          {child.badge > 0 && (
                            <span style={{
                              background: '#f97316', color: '#fff', borderRadius: '9999px',
                              fontSize: '10px', fontWeight: 800, minWidth: 18, height: 18,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0 4px', flexShrink: 0
                            }}>{child.badge > 99 ? '99+' : child.badge}</span>
                          )}
                          {/* Badge on the 'Chat' leaf menu item */}
                          {chatUnread > 0 && child.path?.endsWith('/chat') && (
                            <span style={{
                              background: '#ef4444', color: '#fff', borderRadius: '9999px',
                              fontSize: '10px', fontWeight: 800, minWidth: 18, height: 18,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0 4px', flexShrink: 0
                            }}>{chatUnread > 9 ? '9+' : chatUnread}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.path || index}
                className={`dash-nav-item ${item.className || ''} ${isActive(item.path, item) ? 'active' : ''}`}
                onClick={() => handleNav(item)}
                title={!isSidebarOpen ? item.label : ''}
              >
                <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      {/* ── Main Content Area ── */}
      <main className="dash-main">
        {/* ── Topbar ── */}
        {!hideTopbar && (
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button 
              className="dash-sidebar-toggle" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            {title && (
              <h2 className="dash-topbar-title">
                {title.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== title.split('\n').length - 1 && <br/>}
                  </React.Fragment>
                ))}
              </h2>
            )}
          </div>
          
          <div className="dash-topbar-center" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '600px', margin: '0 2rem' }}>
            <div className="dash-search" style={{ flex: 1, position: 'relative' }}>
              <span className="dash-search-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#047857' }}><Search size={18} /></span>
              <input 
                type="text" 
                placeholder="Search sales, medicines, orders..." 
                onChange={(e) => window.dispatchEvent(new CustomEvent('dashboardSearch', { detail: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 20px 12px 46px',
                  borderRadius: '30px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.25s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#047857';
                  e.target.style.boxShadow = '0 0 0 4px rgba(4, 120, 87, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                }}
              />
            </div>
          </div>

          <div className="dash-topbar-right">
            <NotificationBell 
              navigate={navigate}
              refreshTrigger={notifRefresh}
              ceoPending={ceoPending}
              setCeoPending={setCeoPending}
              isCeoRoute={isCeoRoute}
              ceoPendingSnapshot={ceoPendingSnapshot}
              setCeoPendingSnapshot={setCeoPendingSnapshot}
              storeApprovalsPending={storeApprovalsPending}
              pharmacyPending={pharmacyPending}
              pharmacyOnlinePending={pharmacyOnlinePending}
              setPharmacyOnlinePending={setPharmacyOnlinePending}
              purchasePending={purchasePending}
              purchaseApprovedTenders={purchaseApprovedTenders}
              setPurchaseApprovedTenders={setPurchaseApprovedTenders}
              procurementMessages={procurementMessages}
              purchaseNewBids={purchaseNewBids}
              purchaseBidsList={purchaseBidsList}
              setPurchaseBidsList={setPurchaseBidsList}
              setPurchaseNewBids={setPurchaseNewBids}
              ceoFundRequestsPending={ceoFundRequestsPending}
              agriRentPending={agriRentPending}
              onOpenProcurementInbox={() => navigate('/purchase/smart-tenders?tab=contact')}
              pcvNotifications={pcvNotifications}
              setPcvNotifications={setPcvNotifications}
              isFinanceRoute={location.pathname.startsWith('/finance')}
              isPharmacyManagerRoute={location.pathname === '/pharmacy' || location.pathname.startsWith('/pharmacy/')}
              chatUnread={chatUnread}
              setChatUnread={setChatUnread}
            />
            <div className="dash-profile-dropdown" ref={profileRef}>
              <button 
                className={`dash-user-chip ${profileOpen ? 'open' : ''}`} 
                onClick={() => setProfileOpen(!profileOpen)}
                title={user?.roles?.[0]}
              >
                <div className="dash-avatar">
                  {resolvePhoto(user?.profilePhoto) ? (
                    <img
                      src={resolvePhoto(user.profilePhoto)}
                      alt={user.fullName || 'User'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    user?.fullName?.charAt(0)?.toUpperCase() || <User size={14} />
                  )}
                  {photoUploading && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SegmentedSpinner size={24} />
                    </div>
                  )}
                </div>
                <div className="dash-user-info">
                  <div className="dash-user-name">{user?.fullName || 'User'}</div>
                  <div className="dash-user-role">{user?.roles?.[0] || 'Staff'}</div>
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${profileOpen ? 'rotate' : ''}`} />
              </button>
              
              {profileOpen && (
                <div className="dash-dropdown-menu">
                  {/* Hidden file input for photo upload */}
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <div className="dropdown-header" style={{ textAlign: 'center', paddingBottom: '12px' }}>
                    {/* Clickable avatar in dropdown */}
                    <div
                      style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 8px',
                        background: resolvePhoto(user?.profilePhoto) ? 'transparent' : 'linear-gradient(135deg, #047857, #064e3b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', fontWeight: 700, color: 'white',
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(4,120,87,0.3)',
                        border: '3px solid #e2e8f0'
                      }}
                      title="Click to change photo"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {resolvePhoto(user?.profilePhoto) ? (
                        <img
                          src={resolvePhoto(user.profilePhoto)}
                          alt={user?.fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        user?.fullName?.charAt(0)?.toUpperCase() || <User size={28} />
                      )}
                      {/* Camera overlay on hover */}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'background 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                      >
                        <Camera size={20} color="white" style={{ opacity: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                        />
                      </div>
                    </div>
                    <p className="dropdown-name">{user?.fullName || 'User'}</p>
                    <p className="dropdown-email">{user?.email || 'user@sutana.com'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => {
                    setProfileOpen(false);
                    // Base path like /admin, /ceo, /pharmacy
                    const basePath = location.pathname.split('/').slice(0, 2).join('/');
                    navigate(user?.roles?.includes('Customer') ? '/customer/profile' : `${basePath}/profile`);
                  }}>
                    <User size={16} />
                    My Profile
                  </button>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        )}
        {/* Page Content stretched 100% */}
        <div className={`dash-content${noPadding ? ' no-padding' : ''}`} style={{ width: '100%', overflowX: 'hidden', ...(noPadding ? { padding: 0, margin: 0, background: 'transparent', display: 'flex', flexDirection: 'column' } : {}) }}>
          {pageNotifs.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid #bfdbfe', borderRadius: '10px',
              padding: '12px 18px', marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(59,130,246,0.1)'
            }}>
              <Bell size={16} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a' }}>
                  {pageNotifs.length === 1 ? pageNotifs[0].title : `${pageNotifs.length} unread notifications for this page`}
                </span>
                {pageNotifs.length === 1 && pageNotifs[0].message && (
                  <span style={{ fontSize: '12px', color: '#3b82f6', marginLeft: '8px' }}>{pageNotifs[0].message}</span>
                )}
              </div>
              <button
                onClick={markPageNotifsRead}
                style={{
                  padding: '6px 16px', background: '#2563eb', color: 'white',
                  border: 'none', borderRadius: '6px', fontWeight: 700,
                  fontSize: '12px', cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                }}
              >
                Mark as Read
              </button>
              <button
                onClick={() => setPageNotifs([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', flexShrink: 0, padding: '2px' }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {location.pathname.endsWith('/profile') ? <UserProfile /> : children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
