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
import { playSound, sendPushNotification, requestPermission, SOUND_FOR_TYPE } from '../../services/notificationManager';
const soundNameForType = (t) => SOUND_FOR_TYPE[t] || 'info';
import { io } from 'socket.io-client';
import UserProfile from '../../pages/shared/UserProfile';
import './DashboardLayout.css';
import SegmentedSpinner from '../ui/SegmentedSpinner';
import { apiLoadingEvents } from '../ui/GlobalLoader';

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
const NotifDismissBtn = ({ onClick, title = 'Dismiss — do not navigate' }) => (
  <button
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(e); }}
    onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent'; }}
    title={title}
    aria-label={title}
    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'color .15s, background .15s' }}
  >
    <X size={14} />
  </button>
);

// Route prefixes restricted by role — mirrors AppRoutes.jsx RoleBasedRoute rules
const NOTIF_ROUTE_ROLES = [
  ['/admin',            ['admin']],
  ['/ceo',              ['ceo']],
  ['/finance',          ['finance', 'finance manager', 'admin']],
  ['/purchase',         ['purchase', 'purchase manager', 'market team', 'admin']],
  ['/pharmacy-store',   ['pharmacy store keeper', 'ceo']],
  ['/general-store',    ['general store keeper', 'ceo']],
  ['/printing-manager', ['printing supervisor', 'printing manager', 'admin', 'ceo']],
  ['/pharmacy-worker',  ['pharmacy worker', 'sales/cashier', 'admin']],
  ['/pharmacy',         ['pharmacy manager', 'admin']],
  ['/car-renting',      ['car renting manager', 'admin', 'ceo']],
  ['/hr',               ['hr manager', 'admin', 'ceo']],
  ['/board',            ['board member', 'admin', 'ceo']],
  ['/employee',         ['employee', 'admin', 'ceo']],
  ['/sales',            ['admin', 'ceo', 'sales manager']],
];

const NotificationBell = ({ navigate, refreshTrigger, ceoPending, setCeoPending, isCeoRoute, ceoPendingSnapshot, setCeoPendingSnapshot, storeApprovalsPending = 0, setStoreApprovalsPending = () => {}, pharmacyPending, setPharmacyPending = () => {}, pharmacyOnlinePending, setPharmacyOnlinePending, purchasePending, setPurchasePending = () => {}, purchaseApprovedTenders, setPurchaseApprovedTenders, procurementMessages, setProcurementMessages = () => {}, purchaseNewBids, purchaseBidsList, setPurchaseBidsList, setPurchaseNewBids, ceoFundRequestsPending, setCeoFundRequestsPending = () => {}, agriRentPending, onOpenProcurementInbox, pcvNotifications = [], setPcvNotifications, isFinanceRoute = false, isPharmacyManagerRoute = false, chatUnread = 0, setChatUnread, showToast = () => {} }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const { hasRole } = useAuth();

  // Returns true only if the current user has a role that permits opening this link.
  // Uses hasRole (reads fresh from localStorage) instead of user.roles (React state
  // which can be stale/null on first render — caused every message to be blocked).
  const canAccessLink = (link) => {
    if (!link) return false;
    try {
      const path = (link.split('?')[0].split('#')[0]).replace(/\/+$/, '') || '/';
      for (const [prefix, allowed] of NOTIF_ROUTE_ROLES) {
        if (path === prefix || path.startsWith(prefix + '/')) {
          return allowed.some(role => hasRole(role));
        }
      }
      return true;
    } catch {
      return true;
    }
  };

  const load = async () => {
    try {
      const res = await notificationService.getMyNotificationsV2();
      // apiClient unwraps response.data, so getMyNotificationsV2 returns the array directly
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setItems(list.map(n => ({ ...n, isRead: n.is_read ?? n.isRead ?? false })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAction = async (e, actionType, group, detail) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/procurement/requests/${detail.id}/decision`, { 
        decision: actionType, 
        ceoNotes: actionType === 'CEO_REJECTED' ? 'Rejected from quick actions' : '' 
      });
      // Avoid page refresh! Just update local state
      dismissCeoDetail(group, detail);
      if (typeof showToast === 'function') {
        showToast(`Successfully ${actionType === 'APPROVED' ? 'approved' : 'rejected'} request.`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (typeof showToast === 'function') {
        showToast('Failed to apply action.', 'error');
      }
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

  // Dismiss a DB notification: remove from bell + mark read server-side so it never returns
  const dismissNotif = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try { await notificationService.markAsReadV2(id); } catch (e) { console.error(e); }
  };

  // Dismiss a live EV notification (local hide + server read)
  const dismissPcv = (n) => {
    if (setPcvNotifications) setPcvNotifications(prev => prev.map(p => p.id === n.id ? { ...p, read: true } : p));
    if (n.dbId) apiClient.put(`/finance-cash/ev/${n.dbId}/finance-read`).catch(() => {});
  };

  const dismissCeoGroup = (group) => setCeoPending(prev => prev.filter(g => g !== group));

  const dismissCeoDetail = (group, detail) => setCeoPending(prev =>
    prev
      .map(g => g === group ? { ...g, details: (g.details || []).filter(d => d !== detail) } : g)
      .map(g => ({ ...g, count: (g.details || []).length }))
      .filter(g => g.count > 0)
  );

  // Maps known broken/non-existent notification links to real working routes
  const resolveLink = (link, isCeo) => {
    if (!link) return isCeo ? '/ceo/overview' : '/';

    // CEO: remap any /finance/* link to the CEO finance page
    if (isCeo && link.startsWith('/finance')) return '/ceo/finance';

    // Finance Route Check — all /finance routes exist; keep query strings so tab deep-links work
    if (link.startsWith('/finance')) return link;

    // Admin route map — notifications for admin sub-pages
    const adminMap = {
      '/admin/danger-zone':   '/admin/danger-zone',
      '/admin/users':         '/admin/users',
      '/admin/alerts':        '/admin/alerts',
      '/admin/audit':         '/admin/audit',
      '/admin/system-health': '/admin/system-health',
      '/admin/maintenance':   '/admin/system-health',
      '/admin/disaster':      '/admin/system-health',
      '/admin/backups':       '/admin/backups',
      '/admin/settings':      '/admin/settings',
    };
    for (const [prefix, target] of Object.entries(adminMap)) {
      if (link === prefix || link.startsWith(prefix + '/') || link.startsWith(prefix + '?')) return target;
    }

    // Pharmacy Manager route mappings
    const pharmacyManagerMap = {
      '/pharmacy/sales':             '/pharmacy/manager-sales',
      '/pharmacy/worker-sales':      '/pharmacy/manager-sales',
      '/pharmacy/audit':             '/pharmacy/manager-sales',
      '/pharmacy/audit-trail':       '/pharmacy/manager-sales',
      '/pharmacy/daily-submission':  '/pharmacy/manager-sales',
      '/pharmacy/submissions':       '/pharmacy/manager-sales',
      '/pharmacy/transfer':          '/pharmacy/pending-shipments',
      '/pharmacy/shipments':         '/pharmacy/pending-shipments',
      '/pharmacy/stock':             '/pharmacy/store-inventory',
      '/pharmacy/inventory':         '/pharmacy/store-inventory',
      '/pharmacy/medicines':         '/pharmacy/medicines',
      '/pharmacy/products':          '/pharmacy/medicines',
      '/pharmacy/prescriptions':     '/pharmacy/overview',
      '/pharmacy/requests':          '/pharmacy/requests',
      '/pharmacy-worker':            '/pharmacy/overview',
    };
    for (const [prefix, target] of Object.entries(pharmacyManagerMap)) {
      if (link === prefix || link.startsWith(prefix + '/') || link.startsWith(prefix + '?')) return target;
    }

    // Exact or prefix matches → map to working CEO route
    const ceoMap = {
      '/ceo/pharmacy-approvals': '/ceo/pharmacy',
      '/ceo/pharmacy-transfers': '/ceo/flow1-transfers',
      '/ceo/pharmacy-reports':   '/ceo/pharmacy',
      '/ceo/expired-drugs':      '/ceo/pharmacy',
      '/ceo/tender-decisions':   '/ceo/tender-full',
      '/ceo/purchase-flow':      '/ceo/flow2-purchase',
      '/ceo/fund-requests':      '/ceo/fund-approvals',
      '/ceo/deliveries':         '/ceo/direct-delivery',
      '/ceo/manager-requests':   '/ceo/manager-requests',
      '/ceo/tenders':            '/ceo/tenders',
      '/ceo/finance-approvals':  '/ceo/finance-approvals',
    };
    for (const [prefix, target] of Object.entries(ceoMap)) {
      if (link === prefix || link.startsWith(prefix + '/') || link.startsWith(prefix + '?')) return target;
    }
    // If CEO is browsing, trust any /ceo/ route
    if (isCeo && link.startsWith('/ceo/')) return link;

    // CEO should never navigate to pharmacy/worker/store dashboards via bell.
    // Remap any /pharmacy/* or /pharmacy-worker/* link to CEO's own hub.
    if (isCeo && (link.startsWith('/pharmacy') || link.startsWith('/pharmacy-worker'))) {
      return '/ceo/pharmacy-hub';
    }

    // If a non-CEO (like Purchase Manager) clicks a generic broadcast link meant for CEO:
    if (!isCeo && link.startsWith('/ceo/tenders')) return '/purchase/smart-tenders';

    return link;
  };

  const handleClick = (item) => {
    setOpen(false);
    if (item.id) markRead(item.id);
    // No link → informational message only, never navigate
    if (!item.link) return;
    const resolved = resolveLink(item.link, isCeoRoute);
    if (!resolved) return;
    // Unauthorized target → stay put, tell the user why
    if (!canAccessLink(resolved)) {
      showToast("You don't have access to that page", 'warning');
      return;
    }
    // Pass a state timestamp so same-route pages can detect and re-fetch
    navigate(resolved, { state: { bellTs: Date.now() } });
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

    const target = resolveLink(link, true);
    // Never navigate to a page this role cannot open
    if (!target || !canAccessLink(target)) {
      showToast("You don't have access to that page", 'warning');
      return;
    }
    // Navigate using React Router to avoid hard page refresh
    navigate(target, { state: { bellTs: Date.now() } });
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
  const evUnread = (pcvNotifications || []).filter(n => !n.read).length;
  const totalBadge = (
    (ceoPending?.reduce((s, g) => s + (g.count || 0), 0) || 0) +
    (ceoFundRequestsPending || 0) +
    (storeApprovalsPending || 0) +
    (isPharmacyManagerRoute ? pharmacyPending : 0) +
    
    purchasePending +
    (purchaseApprovedTenders?.length || 0) +
    procurementMessages +
    purchaseNewBids +
    (agriRentPending || 0) +
    notifCount +
    evUnread +
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
        onClick={() => setOpen(o => { const next = !o; if (next) load(); return next; })}
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
                  <NotifDismissBtn onClick={() => dismissCeoGroup(item)} title="Dismiss this group" />
                </div>
                {item.details && item.details.map(detail => (
                  <div key={detail.id} style={{ padding: '10px 18px 10px 48px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFBEB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleCeoClick({ ...detail, link: detail.link || item.link })}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#92400E' }}>{detail.title}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#B45309' }}>{detail.subtitle}</p>
                      </div>
                      {detail.type === 'procurement' && (
                        <div style={{ display: 'flex', gap: 6, marginRight: 4 }}>
                          <button onClick={(e) => handleQuickAction(e, 'APPROVED', item, detail)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>APPROVE</button>
                          <button onClick={(e) => handleQuickAction(e, 'CEO_REJECTED', item, detail)} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>REJECT</button>
                        </div>
                      )}
                      <NotifDismissBtn onClick={() => dismissCeoDetail(item, detail)} title="Dismiss this item" />
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#BE185D' }}>{ceoFundRequestsPending} request{ceoFundRequestsPending > 1 ? 's' : ''} need your decision</p>
                </div>
                <NotifDismissBtn onClick={() => setCeoFundRequestsPending(0)} title="Dismiss" />
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#EA580C' }}>{storeApprovalsPending} item update{storeApprovalsPending > 1 ? 's' : ''} awaiting your approval</p>
                </div>
                <NotifDismissBtn onClick={() => setStoreApprovalsPending(0)} title="Dismiss" />
              </div>
            )}

            {purchasePending > 0 && (
              <div
                onClick={() => { setOpen(false); navigate('/ceo/tenders'); }}
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
                  <p style={{ margin: '0', fontSize: '12px', color: '#059669' }}>{purchasePending} CEO-approved request{purchasePending > 1 ? 's' : ''} awaiting tender</p>
                </div>
                <NotifDismissBtn onClick={() => setPurchasePending(0)} title="Dismiss" />
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
                    onClick={() => { setOpen(false); navigate(`/ceo/tenders?viewTender=${t.id}`, { state: { bellTs: Date.now() } }); }}
                    style={{ padding: '10px 18px 10px 16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F0FDF4', cursor: 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'flex-start', gap: 8 }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#065F46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title} ({t.tender_number})</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#059669' }}>Click to view → Mark as Read on page</p>
                    </div>
                    <NotifDismissBtn onClick={() => setPurchaseApprovedTenders(prev => prev.filter(x => x.id !== t.id))} title="Dismiss this tender" />
                  </div>
                ))}
              </div>
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
                  <NotifDismissBtn onClick={() => setPharmacyPending(0)} title="Dismiss" />
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
                        navigate(`/ceo/tenders?viewTender=${b.public_tender_id}`, { state: { bellTs: Date.now() } });
                      }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Bid from {b.competitor_name}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#B45309' }}>Pending Evaluation</p>
                      </div>
                      <NotifDismissBtn onClick={() => {
                        if (setPurchaseBidsList) setPurchaseBidsList(prev => prev.filter(x => x.id !== b.id));
                        if (setPurchaseNewBids) setPurchaseNewBids(prev => Math.max(0, prev - 1));
                      }} title="Dismiss this bid" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {procurementMessages > 0 && (
              <Link
                to="/ceo/tenders"
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
                  <NotifDismissBtn onClick={() => setProcurementMessages(0)} title="Dismiss" />
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
                <NotifDismissBtn onClick={() => { if (setChatUnread) setChatUnread(0); }} title="Dismiss" />
              </div>
            )}
            {((ceoPending && ceoPending.length > 0) || pharmacyPending > 0) && items.filter(i => !i.isRead).length > 0 && <div style={{ borderTop: '1px solid #E5E7EB' }} />}
            {/* EV Notifications */}
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
                    apiClient.put(`/finance-cash/ev/${n.dbId}/finance-read`).catch(()=>{});
                  }
                  // No link or unauthorized link → stay put
                  if (n.link && canAccessLink(n.link)) navigate(n.link, { state: { bellTs: Date.now() } });
                  else if (n.link) showToast("You don't have access to that page", 'warning');
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
                <NotifDismissBtn onClick={() => dismissPcv(n)} title="Dismiss" />
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
                <NotifDismissBtn onClick={() => dismissNotif(item.id)} title="Dismiss — mark as read" />
              </div>
            )) : items.filter(i => !i.isRead).length === 0 && ceoPending.length === 0 && pharmacyPending === 0  && purchasePending === 0 && purchaseNewBids === 0 && procurementMessages === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
                <CheckCircle size={32} style={{ marginBottom: '8px', color: '#10B981' }} />
                <p style={{ margin: 0 }}>All caught up!</p>
              </div>
            ) : null}
          </div>
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
  const [pcvNotifications, setPcvNotifications] = useState([]); // EV approval notifications
  const [photoUploading, setPhotoUploading] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [navSearchValue, setNavSearchValue] = useState('');
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [showNavSuggestions, setShowNavSuggestions] = useState(false);
  const [navSelectedIndex, setNavSelectedIndex] = useState(0);
  const chatUnreadRef = useRef(0);
  const profileRef = useRef(null);
  const photoInputRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [_apiLoading, _setApiLoading] = useState(false);

  useEffect(() => {
    let count = 0;
    const onStart = () => { count++; _setApiLoading(true); };
    const onStop  = () => { count = Math.max(0, count - 1); if (count === 0) _setApiLoading(false); };
    apiLoadingEvents.addEventListener('start', onStart);
    apiLoadingEvents.addEventListener('stop', onStop);
    return () => {
      apiLoadingEvents.removeEventListener('start', onStart);
      apiLoadingEvents.removeEventListener('stop', onStop);
    };
  }, []);
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

  // Clear the nav search bar whenever the user navigates to a different page
  useEffect(() => {
    setNavSearchValue('');
    window.dispatchEvent(new CustomEvent('dashboardSearch', { detail: '' }));
    setShowNavSuggestions(false);
  }, [location.pathname]);

  const [navSearchLoading, setNavSearchLoading] = useState(false);

  useEffect(() => {
    const isPharmacy = location.pathname.startsWith('/pharmacy');
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isEmployeeRoute = location.pathname.startsWith('/employee');
    const isHrRoute = location.pathname.startsWith('/hr');
    const isPrintingRoute = location.pathname.startsWith('/printing-manager');
    const isSalesRoute = location.pathname.startsWith('/sales');
    const isFinDashRoute = location.pathname.startsWith('/finance');
    const isPurchRoute = location.pathname.startsWith('/purchase');
    const isCustomerRoute = location.pathname.startsWith('/customer');
    if (!isPharmacy && !isAdminRoute && !isEmployeeRoute && !isHrRoute && !isPrintingRoute && !isSalesRoute && !isFinDashRoute && !isCarRentingRoute && !isPurchRoute && !isCustomerRoute) return;

    if (!navSearchValue.trim()) {
      setNavSuggestions([]);
      return;
    }

    let isMounted = true;
    const q = navSearchValue.toLowerCase();
    const isWorker = location.pathname.startsWith('/pharmacy-worker');

    // INSTANT RESULTS: employee portal pages match locally with zero latency
    let instantPageHits = [];
    let hrPageHits = [];
    let printPageHits = [];
    let salesPageHits = [];
    let finPageHits = [];
    let carPageHits = [];
    let purchPageHits = [];
    let custPageHits = [];
    if (isHrRoute) {
      const hrPages = [
        { label: 'Dashboard',           path: '/hr/employee-summary',   icon: '🏠', keywords: 'home dashboard summary overview start hr' },
        { label: "Today's Activities",  path: '/hr/todays-activities',  icon: '📅', keywords: 'today activities daily log events' },
        { label: 'Employees',           path: '/hr/employees',          icon: '👥', keywords: 'employees staff list etp people manage add edit worker' },
        { label: 'Monthly Payroll',     path: '/hr/monthly-payroll',    icon: '📊', keywords: 'payroll monthly process salary calculate run' },
        { label: 'Salary List',         path: '/hr/salary-list',        icon: '💰', keywords: 'salary list pay wages earnings basic' },
        { label: 'Deductions',          path: '/hr/deductions',         icon: '💳', keywords: 'deductions loan tax pension absence deduct' },
        { label: 'Payroll History',     path: '/hr/payslips',           icon: '🧾', keywords: 'payslips history payroll documents pdf slip' },
        { label: 'Job Posts',           path: '/hr/job-posts',          icon: '📰', keywords: 'job posts vacancies recruitment publish opening' },
        { label: 'Applications',        path: '/hr/applications',       icon: '📥', keywords: 'job applications applicants cv resume apply hiring' },
        { label: 'Interviews',          path: '/hr/interviews',         icon: '🗣️', keywords: 'interviews schedule candidates meeting hire' },
        { label: 'Hiring Status',       path: '/hr/hiring-status',      icon: '✅', keywords: 'hiring status pipeline candidates onboard' },
        { label: 'Evaluations',         path: '/hr/evaluations',        icon: '⭐', keywords: 'evaluations performance score rating review' },
        { label: 'Performance Review',  path: '/hr/performance-review', icon: '📈', keywords: 'performance review approve evaluate' },
        { label: 'Feedback',            path: '/hr/feedback',           icon: '💬', keywords: 'feedback employee comments suggestions' },
        { label: 'Contracts',           path: '/hr/contracts',          icon: '📜', keywords: 'contracts renew terminate agreement document' },
        { label: 'Employee Info',       path: '/hr/employee-info',      icon: '🗂️', keywords: 'employee info status departments positions details' },
        { label: 'HR Policies',         path: '/hr/hr-policies',        icon: '🛡️', keywords: 'policies rules guidelines handbook compliance' },
        { label: 'Announcements',       path: '/hr/announcements',      icon: '📢', keywords: 'announcements news broadcast send all staff' },
        { label: 'Internal Notices',    path: '/hr/internal-notices',   icon: '📌', keywords: 'internal notices memo pin board' },
        { label: 'News Manager',        path: '/hr/news',               icon: '🗞️', keywords: 'news public website articles post' },
        { label: 'Public Gallery',      path: '/hr/gallery',            icon: '🖼️', keywords: 'gallery photos images public upload picture' },
        { label: 'Job Applications Manager', path: '/hr/job-applications', icon: '📋', keywords: 'job applications manager public submissions careers' },
        { label: 'Contact Settings',    path: '/hr/settings-contact',   icon: '🔧', keywords: 'contact settings phone email address configure' },
        { label: 'Chat',                path: '/hr/chat',               icon: '💬', keywords: 'chat messages talk communication manager' },
        { label: 'Audit Log',           path: '/hr/audit-log',          icon: '🔎', keywords: 'audit log history actions trail security records' },
      ];
      hrPageHits = hrPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • HR Dashboard`,
        type: 'hr_page',
        item: p
      }));
      setNavSuggestions(hrPageHits);
      setNavSelectedIndex(0);
    } else if (isEmployeeRoute) {
      const empPages = [
        { label: 'Dashboard',         path: '/employee/overview',          icon: '🏠', keywords: 'home overview dashboard start' },
        { label: 'My Tasks',          path: '/employee/tasks/mine',        icon: '📋', keywords: 'tasks assigned work todo mine' },
        { label: "Today's Tasks",     path: '/employee/tasks/today',       icon: '📅', keywords: 'today tasks due now' },
        { label: 'In-Progress Tasks', path: '/employee/tasks/in-progress', icon: '⏳', keywords: 'progress working ongoing tasks' },
        { label: 'Completed Tasks',   path: '/employee/tasks/completed',   icon: '✅', keywords: 'done completed finished tasks' },
        { label: 'Submit Work',       path: '/employee/work/submit',       icon: '📤', keywords: 'submit work upload deliverable report' },
        { label: 'Daily Report',      path: '/employee/work/daily-report', icon: '📝', keywords: 'daily report log eod summary' },
        { label: 'My Payslips',       path: '/employee/payslips',          icon: '💵', keywords: 'payslip salary payroll pay wage money' },
        { label: 'Attendance',        path: '/employee/attendance',        icon: '🕒', keywords: 'attendance clock present absent time schedule' },
        { label: 'Chat',              path: '/employee/comm/chat',         icon: '💬', keywords: 'chat message manager communication talk' },
      ];
      instantPageHits = empPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Employee Portal`,
        type: 'emp_page',
        item: p
      }));
      setNavSuggestions(instantPageHits);
      setNavSelectedIndex(0);
    } else if (isPrintingRoute) {
      const printPages = [
        { label: 'Dashboard',              path: '/printing-manager/overview',            icon: '🏠', keywords: 'home overview dashboard start printing supervisor' },
        { label: 'New Job',                path: '/printing-manager/jobs/new',            icon: '➕', keywords: 'new job create order add start job' },
        { label: 'Job Process',            path: '/printing-manager/jobs/queue',          icon: '📋', keywords: 'job process queue pipeline workflow active jobs' },
        { label: 'Design Stage',           path: '/printing-manager/jobs/design',         icon: '🎨', keywords: 'design stage artwork graphic layout' },
        { label: 'Prepress',               path: '/printing-manager/jobs/prepress',       icon: '🖼️', keywords: 'prepress plate proof prepare press ready' },
        { label: 'In Print',               path: '/printing-manager/jobs/printing',       icon: '🖨️', keywords: 'in print printing press machine running' },
        { label: 'Finishing',              path: '/printing-manager/jobs/finishing',      icon: '✂️', keywords: 'finishing cutting binding lamination final touches' },
        { label: 'Delivery',               path: '/printing-manager/jobs/delivery',       icon: '🚚', keywords: 'delivery ship dispatch handover customer pickup' },
        { label: 'Job History',            path: '/printing-manager/jobs/history',        icon: '🗂️', keywords: 'job history completed past archive records all orders' },
        { label: 'My Tasks',               path: '/printing-manager/jobs/tasks',          icon: '✅', keywords: 'tasks employee assignments todo work reports' },
        { label: 'Design Requests',        path: '/printing-manager/design/requests',     icon: '📥', keywords: 'design requests inbox customer submitted designs' },
        { label: 'Upload Artwork',         path: '/printing-manager/design/upload',       icon: '📤', keywords: 'upload artwork files media assets' },
        { label: 'File Review',            path: '/printing-manager/design/review',       icon: '👁️', keywords: 'file review check approve proof files' },
        { label: 'Production Machines',    path: '/printing-manager/prod/machines',       icon: '⚙️', keywords: 'machines equipment printer allocation status maintenance' },
        { label: 'Production Materials',   path: '/printing-manager/prod/materials',      icon: '📦', keywords: 'production materials stock paper ink supplies inventory' },
        { label: 'Store Material',         path: '/printing-manager/prod/store-materials',icon: '🏬', keywords: 'store material warehouse general supplies stock' },
        { label: 'Redo Requests',          path: '/printing-manager/prod/reprints',       icon: '🔁', keywords: 'redo reprint requests rework defects complaints quality' },
        { label: 'Daily Production Report',path: '/printing-manager/reports/daily',       icon: '📅', keywords: 'daily production report output today summary' },
        { label: 'Job Cost Report',        path: '/printing-manager/reports/costs',       icon: '💰', keywords: 'job cost report pricing revenue profit expenses calculate' },
        { label: 'Material Consumption',   path: '/printing-manager/reports/materials',   icon: '📉', keywords: 'material consumption report usage waste track' },
        { label: 'CEO Report',             path: '/printing-manager/reports/ceo',         icon: '👔', keywords: 'ceo report executive summary performance submit' },
        { label: 'Finance Review',         path: '/printing-manager/reports/finance',     icon: '🧾', keywords: 'finance review invoices payments billing verification' },
        { label: 'Setting Contact',        path: '/printing-manager/contact',             icon: '📞', keywords: 'contact settings phone email address configure messages' },
        { label: 'Chat',                   path: '/printing-manager/chat',                icon: '💬', keywords: 'chat messages talk communication manager' },
        { label: 'Audit Log',              path: '/printing-manager/audit-log',           icon: '🔎', keywords: 'audit log history actions trail security records' },
      ];
      printPageHits = printPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Printing Supervisor`,
        type: 'print_page',
        item: p
      }));
      setNavSuggestions(printPageHits);
      setNavSelectedIndex(0);
    } else if (isSalesRoute) {
        const salesPages = [
          { label: 'Overview', path: '/sales/overview', icon: '📊', keywords: 'home overview dashboard start sales' },
          { label: 'Retail POS', path: '/sales/pos', icon: '🛒', keywords: 'pos point of sale retail sell cash register checkout' },
          { label: 'Sales Returns', path: '/sales/sales-return', icon: '🔄', keywords: 'returns refund reverse back' },
          { label: 'Store Inventory', path: '/sales/store-inventory', icon: '📦', keywords: 'stock inventory products items store warehouse' },
          { label: 'Tasks', path: '/sales/tasks', icon: '📋', keywords: 'tasks assignments todo work' },
          { label: 'Branches', path: '/sales/branches', icon: '🏢', keywords: 'branches locations retail stores' },
          { label: 'Tenders & Bids', path: '/sales/bids', icon: '📑', keywords: 'bids tender manage approve review quotes' },
          { label: 'CEO Report', path: '/sales/ceo-report', icon: '📈', keywords: 'ceo report executive summary performance' },
          { label: 'Finance Review', path: '/sales/finance-review', icon: '💵', keywords: 'finance review payments billing verification' },
          { label: 'Daily Summary', path: '/sales/daily-summary', icon: '📅', keywords: 'daily summary report today sales' },
          { label: 'Setting Contact', path: '/sales/contact', icon: '📞', keywords: 'contact settings phone email address' },
          { label: 'Chat', path: '/sales/chat', icon: '💬', keywords: 'chat messages talk communication manager' },
          { label: 'Audit Log', path: '/sales/audit-log', icon: '📝', keywords: 'audit log history tracking changes' }
        ];
        
        salesPageHits = salesPages
          .filter(p => p.label.toLowerCase().includes(q) || p.keywords.includes(q))
          .map(p => ({
            title: p.label,
            subtitle: `${p.icon} Page • Sales Manager`,
            type: 'sales_page',
            item: p
          }));

        setNavSuggestions(salesPageHits);
        setNavSelectedIndex(0);
    } else if (isFinDashRoute) {
      const finPages = [
        { label: 'Dashboard',                  path: '/finance/overview',                icon: '🏠', keywords: 'home overview dashboard start finance summary' },
        { label: 'Receipts (CRV)',             path: '/finance/crv',                     icon: '🧾', keywords: 'receipts crv cash received voucher income' },
        { label: 'Expense Vouchers (EV)',      path: '/finance/ev',                      icon: '📄', keywords: 'expense vouchers ev payments spend' },
        { label: 'Procurement (Drug/Stock)',   path: '/finance/procurement',             icon: '📦', keywords: 'procurement drug stock purchase pharmacy supplies' },
        { label: 'General Procurement',        path: '/finance/general-procurement',     icon: '🚚', keywords: 'general procurement purchase tender supplies' },
        { label: 'Expense Book',               path: '/finance/cash-book',               icon: '📚', keywords: 'expense book cash book payments ledger record' },
        { label: 'Liabilities & Payable',      path: '/finance/liabilities',             icon: '⚠️', keywords: 'liabilities accounts payable debts owed suppliers' },
        { label: 'Bank Accounts',              path: '/finance/bank-accounts',           icon: '🏦', keywords: 'bank accounts reconciliation balance transfer deposit' },
        { label: 'Sales Invoice & Receipt',    path: '/finance/invoices',                icon: '🖨️', keywords: 'sales invoice receipt print document tax' },
        { label: 'Live Income',                path: '/finance/pharmacy-sales',          icon: '📈', keywords: 'live income all departments verification submissions approve reject' },
        { label: 'Revenue Book',               path: '/finance/outstanding-ar',          icon: '📕', keywords: 'revenue book outstanding receivables income records' },
        { label: 'Accounts Receivable',        path: '/finance/accounts-receivable',     icon: '👥', keywords: 'accounts receivable customers collect debt invoices due' },
        { label: 'Equity',                     path: '/finance/equity',                  icon: '🥧', keywords: 'equity capital owner shares retained' },
        { label: 'General Store Valuation',    path: '/finance/general-store-assets',    icon: '🏬', keywords: 'general store valuation assets stock value' },
        { label: 'Printing Machines Valuation',path: '/finance/printing-machines-assets',icon: '🖨️', keywords: 'printing machines valuation assets equipment value' },
        { label: 'Pharmacy Store & Stock',     path: '/finance/pharmacy-assets',         icon: '💊', keywords: 'pharmacy store stock valuation assets medicines' },
        { label: 'Vehicle & Rental Assets',    path: '/finance/vehicle-assets',          icon: '🚗', keywords: 'vehicle rental assets cars valuation fleet' },
        { label: 'Tractor Assets',             path: '/finance/tractor-assets',          icon: '🚜', keywords: 'tractor assets machinery valuation farm' },
        { label: 'Payroll Payment',            path: '/finance/payroll-payment',         icon: '💸', keywords: 'payroll payment salaries wages pay staff' },
        { label: 'Cash Flow',                  path: '/finance/cash-flow',               icon: '💧', keywords: 'cash flow statement inflow outflow movement' },
        { label: 'Income Statement',           path: '/finance/profit-loss',             icon: '📊', keywords: 'income statement profit loss pnl revenue expenses' },
        { label: 'Balance Sheet',              path: '/finance/balance-sheet',           icon: '⚖️', keywords: 'balance sheet assets liabilities equity position' },
        { label: 'Audit Log',                  path: '/finance/audit-log',               icon: '🔎', keywords: 'audit log history actions trail security records' },
      ];
      finPageHits = finPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Finance Dashboard`,
        type: 'fin_page',
        item: p
      }));
      setNavSuggestions(finPageHits);
      setNavSelectedIndex(0);
      } else if (isPurchRoute) {
      const purchPages = [
        { label: 'Dashboard',              path: '/purchase/overview',               icon: '🏠', keywords: 'home overview dashboard start purchase summary' },
        { label: 'Tasks',                  path: '/purchase/tasks',                  icon: '✅', keywords: 'tasks assignments todo work reports employee' },
        { label: 'Purchase Requests',      path: '/purchase/requests',               icon: '🛒', keywords: 'purchase requests pr requisition order buy items drugs' },
        { label: 'Tender & Bid',           path: '/purchase/smart-tenders',          icon: '💵', keywords: 'tender bid smart auction supplier offers bids' },
        { label: 'Quotations',             path: '/purchase/quotations',             icon: '📄', keywords: 'quotation quote price supplier offer estimate' },
        { label: 'General Procurements',   path: '/purchase/general-procurements',   icon: '🚚', keywords: 'general procurement non drug supplies tender' },
        { label: 'Supplier Directory',     path: '/purchase/suppliers',              icon: '🏢', keywords: 'suppliers directory vendor list company verify' },
        { label: 'Add Supplier',           path: '/purchase/suppliers/add',          icon: '➕', keywords: 'add supplier new vendor create register' },
        { label: 'Purchase Orders',        path: '/purchase/orders',                 icon: '📦', keywords: 'purchase orders po delivery status track' },
        { label: 'Returns',                path: '/purchase/returns',                icon: '↩️', keywords: 'returns refund send back damaged wrong items' },
        { label: 'Contact Settings',       path: '/purchase/contact',                icon: '📞', keywords: 'contact settings phone email address configure' },
        { label: 'Chat',                   path: '/purchase/chat',                   icon: '💬', keywords: 'chat messages talk communication manager' },
        { label: 'Purchase Report',        path: '/purchase/reports/purchase',       icon: '📊', keywords: 'purchase report analytics summary buying' },
        { label: 'Delivery Report',        path: '/purchase/reports/delivery',       icon: '🚛', keywords: 'delivery report shipments received logistics' },
        { label: 'CEO Report',             path: '/purchase/reports/ceo',            icon: '📈', keywords: 'ceo report executive summary performance' },
        { label: 'Financial Review',       path: '/purchase/reports/financial',      icon: '💰', keywords: 'financial review budget cost spending payment' },
        { label: 'Audit Log',              path: '/purchase/audit-log',              icon: '🔎', keywords: 'audit log history actions trail security records' },
      ];
      purchPageHits = purchPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Purchase Manager`,
        type: 'purch_page',
        item: p
      }));
      setNavSuggestions(purchPageHits);
      setNavSelectedIndex(0);
      } else if (isCarRentingRoute) {
      const carPages = [
        { label: 'Dashboard',            path: '/car-renting/manager/dashboard',       icon: '🏠', keywords: 'home overview dashboard start car rental summary' },
        { label: 'Tasks',                path: '/car-renting/manager/tasks',           icon: '✅', keywords: 'tasks assignments todo work employee' },
        { label: 'Rental Orders',        path: '/car-renting/manager/orders',          icon: '📋', keywords: 'rental order booking rent customer car reservation' },
        { label: 'Agri Rent Orders',     path: '/car-renting/manager/agri-orders',     icon: '🌿', keywords: 'agri rent tractor farm agriculture order booking' },
        { label: 'Agri Rent List',       path: '/car-renting/manager/agrirent-list',   icon: '🌾', keywords: 'agri rent list records history farm' },
        { label: 'Store Request',        path: '/car-renting/manager/store-request',   icon: '📦', keywords: 'store request inventory items parts spare' },
        { label: 'Procurement Request',  path: '/car-renting/manager/procurement-request', icon: '➕', keywords: 'procurement purchase request supplies' },
        { label: 'Fleet & Vehicles',     path: '/car-renting/manager/fleet',           icon: '🚗', keywords: 'fleet vehicles car rental post availability' },
        { label: 'Tractor Fleet',        path: '/car-renting/manager/tractor-fleet',   icon: '🚜', keywords: 'tractor fleet agri post machinery farm' },
        { label: 'Asset Register',       path: '/car-renting/manager/assets',          icon: '🗃️', keywords: 'asset register assets property value record' },
        { label: 'Maintenance',          path: '/car-renting/manager/maintenance',     icon: '🔧', keywords: 'maintenance repair fix service garage' },
        { label: 'Service & Fuel',       path: '/car-renting/manager/utilization',     icon: '⛽', keywords: 'service fuel utilization gas petrol consumption' },
        { label: 'Drivers & Calendar',   path: '/car-renting/manager/calendar',        icon: '👥', keywords: 'drivers calendar availability schedule booking driver' },
        { label: 'Rental Report',        path: '/car-renting/manager/reports/rental',  icon: '📈', keywords: 'rental report analytics performance' },
        { label: 'Revenue Report',       path: '/car-renting/manager/reports/revenue', icon: '💲', keywords: 'revenue report finance money income earnings' },
        { label: 'Contact Settings',     path: '/car-renting/manager/contact',         icon: '📞', keywords: 'contact settings phone email address configure' },
        { label: 'Chat',                 path: '/car-renting/manager/chat',            icon: '💬', keywords: 'chat messages talk communication manager' },
        { label: 'Audit Log',            path: '/car-renting/manager/audit-log',       icon: '🔎', keywords: 'audit log history actions trail security records' },
      ];
      carPageHits = carPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Car Rental Manager`,
        type: 'car_page',
        item: p
      }));
      setNavSuggestions(carPageHits);
      setNavSelectedIndex(0);
      } else if (isCustomerRoute) {
      const custPages = [
        { label: 'Overview',            path: '/customer/dashboard',       icon: '🏠', keywords: 'overview home dashboard all orders summary start customer' },
        { label: 'Printing Orders',     path: '/customer/printing-orders', icon: '🖨️', keywords: 'printing orders print jobs business cards flyers documents' },
        { label: 'AgriRent Orders',     path: '/customer/farming-orders',  icon: '🌿', keywords: 'agri rent farming tractor plough land orders' },
        { label: 'Retail Orders',       path: '/customer/retail-orders',   icon: '🛍️', keywords: 'retail orders shop products purchase delivery invoice' },
        { label: 'Car Rentals',         path: '/customer/rentals',         icon: '🚗', keywords: 'car rentals vehicle booking driver reservation' },
        { label: 'Pharmacy Orders',     path: '/customer/prescriptions',   icon: '💊', keywords: 'pharmacy prescriptions medicine drugs order upload' },
        { label: 'Tender Bids',         path: '/customer/bids',            icon: '🏆', keywords: 'tender bids auction offers supplier bid' },
        { label: 'Invoices',            path: '/customer/invoices',        icon: '🧾', keywords: 'invoices billing payments due amounts documents' },
        { label: 'Receipts',            path: '/customer/receipts',        icon: '🧾', keywords: 'receipts payment proof paid records' },
        { label: 'Support Tickets',     path: '/customer/support',         icon: '🎫', keywords: 'support tickets help issues complaints contact' },
        { label: 'Become a Supplier',   path: '/customer/become-supplier', icon: '🚚', keywords: 'become supplier register sell vendor partner' },
      ];
      custPageHits = custPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.keywords.includes(q)
      ).map(p => ({
        title: p.label,
        subtitle: `${p.icon} Page • Customer Portal`,
        type: 'cust_page',
        item: p
      }));
      setNavSuggestions(custPageHits);
      setNavSelectedIndex(0);
      }

    const fetchSearch = async () => {
      try {
        setNavSearchLoading(true);
        const suggs = [];

        if (isAdminRoute) {
          // ── ADMIN: search users, audit logs, alerts ──
          const [usersRes, auditRes, alertsRes] = await Promise.all([
            apiClient.get('/users?limit=10&search=' + encodeURIComponent(q)).catch(() => ({ data: [] })),
            apiClient.get('/admin/audit-logs?limit=5&search=' + encodeURIComponent(q)).catch(() => ({ data: [] })),
            apiClient.get('/admin/alerts?limit=3').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;

          // Users
          const usersRaw = Array.isArray(usersRes.data?.users) ? usersRes.data.users : (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
          usersRaw.forEach(u => {
             suggs.push({
               title: u.full_name || u.fullName,
               subtitle: `👤 User • ${u.email || u.phone}`,
               type: 'admin_user',
               item: u
             });
          });

          // Audit Logs
          const auditRaw = Array.isArray(auditRes.data?.logs) ? auditRes.data.logs : (Array.isArray(auditRes.data?.data) ? auditRes.data.data : []);
          auditRaw.forEach(a => {
             suggs.push({
               title: a.user_name || 'System Action',
               subtitle: `📋 ${(a.action || '').replace(/_/g, ' ')} • ${a.description || ''}`.slice(0, 60),
               type: 'admin_audit',
               item: a
             });
          });

          // Alerts
          const alertsRaw = Array.isArray(alertsRes.data?.alerts) ? alertsRes.data.alerts : (Array.isArray(alertsRes.data?.data) ? alertsRes.data.data : []);
          alertsRaw.filter(al => (al.title || '').toLowerCase().includes(q) || (al.message || '').toLowerCase().includes(q)).slice(0, 3).forEach(al => {
             suggs.push({
               title: al.title || 'Alert',
               subtitle: `⚠️ ${al.message || ''}`.slice(0, 60),
               type: 'admin_alert',
               item: al
             });
          });
        } else if (isWorker) {
          // ── PHARMACY WORKER: search products, online orders, prescriptions ──
          const [prodRes, reqRes, rxRes] = await Promise.all([
            apiClient.get('/pharmacy/products'),
            apiClient.get('/pharmacy/requests/pending').catch(() => ({ data: [] })),
            apiClient.get('/pharmacy/prescriptions?status=PENDING').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;

          // Products
          const products = Array.isArray(prodRes.data?.data) ? prodRes.data.data : Array.isArray(prodRes.data) ? prodRes.data : [];
          products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 6).forEach(p => {
            const stockVal = p.stock !== undefined ? p.stock : (p.quantity || 0);
            const priceVal = p.price || p.selling_price || p.unit_price || 0;
            suggs.push({
              title: p.name,
              subtitle: `💊 Medicine • ETB ${priceVal} • ${stockVal} in stock`,
              type: 'product',
              item: { ...p, price: priceVal, stock: stockVal }
            });
          });

          // Online orders
          const orders = Array.isArray(reqRes.data?.data) ? reqRes.data.data : Array.isArray(reqRes.data) ? reqRes.data : [];
          orders.filter(o => (o.customer_name || '').toLowerCase().includes(q) || (o.sale_code || '').toLowerCase().includes(q)).slice(0, 3).forEach(o => {
            suggs.push({
              title: o.customer_name || 'Online Order',
              subtitle: `🛒 Order ${o.sale_code || o.id} • ETB ${o.total_amount}`,
              type: 'online_order',
              item: o
            });
          });

          // Prescriptions
          const rxs = Array.isArray(rxRes.data?.data) ? rxRes.data.data : Array.isArray(rxRes.data) ? rxRes.data : [];
          rxs.filter(rx => (rx.patient_name || '').toLowerCase().includes(q) || (rx.patient_phone || '').includes(q)).slice(0, 3).forEach(rx => {
            suggs.push({
              title: rx.patient_name || 'Prescription',
              subtitle: `📋 Prescription • Phone: ${rx.patient_phone || 'N/A'}`,
              type: 'prescription',
              item: rx
            });
          });

        } else if (isHrRoute) {
          // ── HR: pages already shown instantly above; now live data ──
          suggs.push(...hrPageHits);

          const [empRes, appRes] = await Promise.all([
            apiClient.get('/hr/etp/employees?limit=10&search=' + encodeURIComponent(q)).catch(() => ({ data: {} })),
            apiClient.get('/hr/recruitment/applications?limit=10&search=' + encodeURIComponent(q)).catch(() => ({ data: {} }))
          ]);
          if (!isMounted) return;

          // Employees (name / employee ID / department / position)
          const empsRaw = empRes.data?.data?.employees || empRes.data?.employees ||
            (Array.isArray(empRes.data?.data) ? empRes.data.data : []);
          (Array.isArray(empsRaw) ? empsRaw : []).filter(e =>
            (e.full_name || '').toLowerCase().includes(q) ||
            (e.employee_id || '').toLowerCase().includes(q) ||
            (e.dept_name || '').toLowerCase().includes(q) ||
            (e.position_title || '').toLowerCase().includes(q)
          ).slice(0, 6).forEach(e => {
            suggs.push({
              title: e.full_name || 'Employee',
              subtitle: `👤 Employee • ${e.employee_id || ''}${e.dept_name ? ` • ${e.dept_name}` : ''}${e.position_title ? ` • ${e.position_title}` : ''}`,
              type: 'hr_employee',
              item: e
            });
          });

          // Job applications (applicant name / position)
          const appsRaw = appRes.data?.data?.applications || appRes.data?.applications ||
            (Array.isArray(appRes.data?.data) ? appRes.data.data : []);
          (Array.isArray(appsRaw) ? appsRaw : []).filter(a =>
            (a.full_name || a.applicant_name || '').toLowerCase().includes(q) ||
            (a.position || a.job_title || '').toLowerCase().includes(q) ||
            (a.email || '').toLowerCase().includes(q)
          ).slice(0, 4).forEach(a => {
            suggs.push({
              title: a.full_name || a.applicant_name || 'Applicant',
              subtitle: `💼 Application • ${a.position || a.job_title || 'Position N/A'}${a.status ? ` • ${String(a.status).replace(/_/g, ' ')}` : ''}`,
              type: 'hr_application',
              item: a
            });
          });
        } else if (isEmployeeRoute) {
          // ── EMPLOYEE: pages already shown instantly above; now live data ──
          suggs.push(...instantPageHits);

          const [taskRes, payRes] = await Promise.all([
            apiClient.get('/employee-tasks').catch(() => ({ data: [] })),
            apiClient.get('/hr/etp/my-payslips').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;

          // Tasks (title / description / priority / id)
          const tasks = Array.isArray(taskRes.data?.data) ? taskRes.data.data : (Array.isArray(taskRes.data) ? taskRes.data : []);
          tasks.filter(t =>
            (t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.priority || '').toLowerCase().includes(q) ||
            String(t.id) === q
          ).slice(0, 5).forEach(t => {
            suggs.push({
              title: t.title,
              subtitle: `📋 Task • ${(t.status || 'pending').replace(/_/g, ' ')}${t.due_date ? ` • Due ${String(t.due_date).slice(0, 10)}` : ''}`,
              type: 'emp_task',
              item: t
            });
          });

          // Payslips (month/year/status)
          const slips = Array.isArray(payRes.data?.data) ? payRes.data.data : (Array.isArray(payRes.data) ? payRes.data : []);
          slips.filter(s => {
            const label = `${s.month_number}/${s.year_number}`;
            return label.includes(q) || (s.status || '').toLowerCase().includes(q);
          }).slice(0, 4).forEach(s => {
            suggs.push({
              title: `Payslip ${s.month_number}/${s.year_number}`,
              subtitle: `💵 Payslip • Net ETB ${Number(s.net_pay || 0).toLocaleString()} • ${s.status || ''}`,
              type: 'emp_payslip',
              item: s
            });
          });
        } else if (isPrintingRoute) {
          // ── PRINTING SUPERVISOR: pages already shown instantly above; now live orders ──
          suggs.push(...printPageHits);

          const ordRes = await apiClient.get('/printing/orders', { params: { limit: 200 } }).catch(() => ({ data: [] }));
          if (!isMounted) return;

          const ordsRaw = Array.isArray(ordRes.data?.data) ? ordRes.data.data
            : Array.isArray(ordRes.data?.orders) ? ordRes.data.orders
            : (Array.isArray(ordRes.data) ? ordRes.data : []);
          (Array.isArray(ordsRaw) ? ordsRaw : []).filter(o =>
            (o.order_number || '').toLowerCase().includes(q) ||
            String(o.id).includes(q) ||
            (o.customer_name || '').toLowerCase().includes(q) ||
            (o.customer_phone || '').includes(q) ||
            (o.product_type || '').toLowerCase().includes(q) ||
            (o.status_name || o.status_code || '').toLowerCase().includes(q)
          ).slice(0, 6).forEach(o => {
            suggs.push({
              title: `${o.order_number || 'Order #' + o.id} — ${o.product_type || 'Print Job'}`,
              subtitle: `🖨️ Order • ${o.customer_name || 'Customer N/A'} • ${(o.status_name || o.status_code || 'unknown').replace(/_/g, ' ')}`,
              type: 'print_order',
              item: o
            });
          });
        } else if (isSalesRoute) {
            // SALES MANAGER
            suggs.push(...salesPageHits);

            const [prodRes, reqRes] = await Promise.all([
              apiClient.get('/retail/store-inventory').catch(() => ({ data: [] })),
              apiClient.get('/retail/store-requests').catch(() => ({ data: [] }))
            ]);
            if (!isMounted) return;

            // Products
            const prodRaw = Array.isArray(prodRes.data?.data) ? prodRes.data.data : Array.isArray(prodRes.data) ? prodRes.data : [];
            prodRaw.filter(p =>
              (p.name || '').toLowerCase().includes(q) ||
              (p.category_name || '').toLowerCase().includes(q)
            ).slice(0, 5).forEach(p => {
              suggs.push({
                title: p.name,
                subtitle: `Store Inventory • ${p.category_name || 'General'}`,
                type: 'sale_product',
                item: p
              });
            });

            // Requests
            const reqRaw = Array.isArray(reqRes.data?.data) ? reqRes.data.data : Array.isArray(reqRes.data) ? reqRes.data : [];
            reqRaw.filter(r =>
              String(r.id) === q ||
              (r.request_code || '').toLowerCase().includes(q) ||
              (r.drug_name || '').toLowerCase().includes(q)
            ).slice(0, 4).forEach(r => {
              suggs.push({
                title: `${r.request_code || 'Req #' + r.id} - ${r.drug_name || 'Product'}`,
                subtitle: `Request • ${(r.status || 'unknown').replace(/_/g, ' ')}`,
                type: 'sale_request',
                item: r
              });
            });
          } else if (isCarRentingRoute) {
        // ── CAR RENTAL / AGRI: pages already shown instantly above; now live data ──
        suggs.push(...carPageHits);
        const [rentRes, agriRes, carRes, tractRes] = await Promise.all([
          apiClient.get('/rental-orders').catch(() => ({ data: [] })),
          apiClient.get('/agrirent-orders').catch(() => ({ data: [] })),
          apiClient.get('/cars').catch(() => ({ data: [] })),
          apiClient.get('/tractors').catch(() => ({ data: [] }))
        ]);
        if (!isMounted) return;

        const rentRaw = rentRes.data?.data || rentRes.data || [];
        (Array.isArray(rentRaw) ? rentRaw : []).filter(o =>
          (o.order_number || o.orderNumber || '').toLowerCase().includes(q) ||
          String(o.id) === q ||
          (o.customer_name || o.customerName || '').toLowerCase().includes(q) ||
          (o.customer_phone || o.customerPhone || '').toString().includes(q)
        ).slice(0, 4).forEach(o => {
          suggs.push({
            title: `${o.order_number || o.orderNumber || 'Order #' + o.id} - ${o.customer_name || o.customerName || 'Customer'}`,
            subtitle: `🚘 Rental Order • ${(o.status || o.order_status || 'unknown').replace(/_/g, ' ')}`,
            type: 'car_order',
            item: o
          });
        });

        const agriRaw = agriRes.data?.orders || agriRes.data?.data || agriRes.data || [];
        (Array.isArray(agriRaw) ? agriRaw : []).filter(o =>
          (o.order_number || '').toLowerCase().includes(q) ||
          String(o.id) === q ||
          (o.customer_name || '').toLowerCase().includes(q) ||
          (o.customer_phone || '').toString().includes(q)
        ).slice(0, 3).forEach(o => {
          suggs.push({
            title: `${o.order_number || 'Agri #' + o.id} - ${o.customer_name || 'Customer'}`,
            subtitle: `🚜 Agri Order • ${(o.status || o.order_status || 'unknown').replace(/_/g, ' ')}`,
            type: 'car_agri_order',
            item: o
          });
        });

        const carsRaw = carRes.data?.data || carRes.data || [];
        (Array.isArray(carsRaw) ? carsRaw : []).filter(c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.car_type || c.carType || '').toLowerCase().includes(q) ||
          String(c.id) === q
        ).slice(0, 3).forEach(c => {
          suggs.push({
            title: `${c.name || 'Unknown Vehicle'}`,
            subtitle: `🚙 Fleet Vehicle • ETB ${Number(c.dailyRate ?? c.daily_rate ?? 0).toLocaleString()}/day • ${(c.availability || 'unknown').replace(/_/g, ' ')}`,
            type: 'car_fleet',
            item: c
          });
        });

        const tractsRaw = tractRes.data?.data || tractRes.data || [];
        (Array.isArray(tractsRaw) ? tractsRaw : []).filter(t =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.tractor_type || t.tractorType || '').toLowerCase().includes(q) ||
          String(t.id) === q
        ).slice(0, 3).forEach(t => {
          suggs.push({
            title: `${t.name || 'Tractor'}`,
            subtitle: `🚜 Tractor • ETB ${Number(t.dailyRate ?? t.daily_rate ?? 0).toLocaleString()}/day • ${(t.availability || 'unknown').replace(/_/g, ' ')}`,
            type: 'car_tractor',
            item: t
          });
        });
      } else if (isCustomerRoute) {
          // ── CUSTOMER PORTAL: pages already shown instantly above; now live data ──
          suggs.push(...custPageHits);

          const [printRes, agriRes, retailRes, rentRes, rxRes, bidRes] = await Promise.all([
            apiClient.get('/printing/customer/orders').catch(() => ({ data: [] })),
            apiClient.get('/agrirent-orders/my-orders').catch(() => ({ data: [] })),
            apiClient.get('/retail/orders/my-orders').catch(() => ({ data: [] })),
            apiClient.get('/rental-orders/my-orders').catch(() => ({ data: [] })),
            apiClient.get('/pharmacy/requests/my-requests').catch(() => ({ data: [] })),
            apiClient.get('/tenders/my-bids').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;
          const rows = (r, key) => {
            let d = r?.data ?? r;
            if (d && typeof d === 'object' && !Array.isArray(d)) d = d[key] || d.orders || d.data || d.bids || d.requests || [];
            return Array.isArray(d) ? d : [];
          };

          // Printing orders
          rows(printRes).filter(o =>
            (o.order_number || o.orderNumber || '').toLowerCase().includes(q) ||
            String(o.id) === q ||
            (o.product_type || o.productType || o.status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.order_number || o.orderNumber || 'Print Order #' + o.id}`,
              subtitle: `🖨️ Printing • ${o.product_type || o.productType || 'order'} • ${(o.status || 'pending')}`,
              type: 'cust_printing',
              item: o
            });
          });

          // AgriRent orders
          rows(agriRes).filter(o =>
            (o.order_number || '').toLowerCase().includes(q) ||
            String(o.id) === q ||
            (o.farm_name || o.service_type || o.status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.order_number || 'Agri Order #' + o.id}`,
              subtitle: `🌿 AgriRent • ${o.service_type || o.farm_name || 'farming service'} • ${(o.status || 'pending')}`,
              type: 'cust_agri',
              item: o
            });
          });

          // Retail orders (invoice-based)
          rows(retailRes).filter(o =>
            (o.invoice_number || '').toLowerCase().includes(q) ||
            String(o.id) === q ||
            (o.status || o.payment_status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.invoice_number || 'Retail Order #' + o.id}`,
              subtitle: `🛍️ Retail • ETB ${Number(o.total_amount || 0).toLocaleString()} • ${(o.status || 'placed')}${o.payment_status ? ' • ' + o.payment_status : ''}`,
              type: 'cust_retail',
              item: o
            });
          });

          // Car rentals
          rows(rentRes).filter(o =>
            (o.orderNumber || o.order_number || '').toLowerCase().includes(q) ||
            String(o.id) === q ||
            (o.status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.orderNumber || o.order_number || 'Rental #' + o.id}`,
              subtitle: `🚗 Rental • ${o.totalDays ?? '-'} day(s) • ${(o.status || 'reserved').replace(/_/g, ' ')}`,
              type: 'cust_rental',
              item: o
            });
          });

          // Pharmacy prescriptions
          rows(rxRes).filter(o =>
            (o.request_number || '').toLowerCase().includes(q) ||
            (o.medication_name || '').toLowerCase().includes(q) ||
            String(o.id) === q
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.request_number || 'Rx #' + o.id} — ${o.medication_name || 'Medicine'}`,
              subtitle: `💊 Pharmacy • Qty ${o.quantity ?? '-'} • ${(o.status || 'pending').replace(/_/g, ' ')}`,
              type: 'cust_rx',
              item: o
            });
          });

          // Tender bids
          rows(bidRes).filter(b =>
            (b.tender_no || b.reference_number || b.tender_title || '').toLowerCase().includes(q) ||
            String(b.id) === q ||
            (b.status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(b => {
            suggs.push({
              title: `${b.tender_title || b.tender_no || b.reference_number || 'Bid #' + b.id}`,
              subtitle: `🏆 Bid • ${(b.status || 'submitted').replace(/_/g, ' ')}`,
              type: 'cust_bid',
              item: b
            });
          });
      } else if (isFinDashRoute) {
          // ── FINANCE: pages already shown instantly above; now live data ──
          suggs.push(...finPageHits);

          const [bankRes, rcvRes, crvRes, evRes, cbRes, liabRes] = await Promise.all([
            apiClient.get('/finance-bank').catch(() => ({ data: [] })),
            apiClient.get('/finance-receivables/book').catch(() => ({ data: [] })),
            apiClient.get('/finance-cash/crv').catch(() => ({ data: [] })),
            apiClient.get('/finance-cash/ev').catch(() => ({ data: [] })),
            apiClient.get('/finance-cash/cashbook').catch(() => ({ data: [] })),
            apiClient.get('/finance-liabilities').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;
          const arr = (r) => Array.isArray(r?.data?.data) ? r.data.data : (Array.isArray(r?.data) ? r.data : []);

          // Bank accounts (name / provider / account number)
          arr(bankRes).filter(b =>
            (b.account_name || '').toLowerCase().includes(q) ||
            (b.bank_provider || '').toLowerCase().includes(q) ||
            String(b.account_number || '').includes(q)
          ).slice(0, 4).forEach(b => {
            const netBal = b.netBalance ?? b.opening_balance ?? 0;
            suggs.push({
              title: `${b.bank_provider || 'Bank'} — ${b.account_name}`,
              subtitle: `🏦 Bank Account • ${b.account_number || 'N/A'} • ETB ${Number(netBal).toLocaleString()}`,
              type: 'fin_account',
              item: b
            });
          });

          // Receivables book (customer / invoice no / status)
          arr(rcvRes).filter(r =>
            (r.customer_name || '').toLowerCase().includes(q) ||
            (r.invoice_no || '').toLowerCase().includes(q) ||
            (r.status || '').toLowerCase().includes(q) ||
            String(r.id) === q
          ).slice(0, 4).forEach(r => {
            suggs.push({
              title: `${r.invoice_no || 'Invoice #' + r.id} — ${r.customer_name || 'Customer'}`,
              subtitle: `🧾 Receivable • ETB ${Number(r.outstanding_balance ?? r.total_amount ?? 0).toLocaleString()} outstanding • ${(r.status || '').replace(/_/g, ' ')}`,
              type: 'fin_receivable',
              item: r
            });
          });

          // Receipt vouchers / CRVs (received payments)
          arr(crvRes).filter(c =>
            (c.crv_number || '').toLowerCase().includes(q) ||
            (c.received_from || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q) ||
            String(c.amount || '') === q
          ).slice(0, 3).forEach(c => {
            suggs.push({
              title: `${c.crv_number || 'CRV #' + c.id} — ${c.received_from || 'Payer'}`,
              subtitle: `🧾 Receipt • ETB ${Number(c.amount || 0).toLocaleString()} received • ${(c.status || 'recorded')}`,
              type: 'fin_crv',
              item: c
            });
          });

          // Expense vouchers / EVs
          arr(evRes).filter(v =>
            (v.ev_number || '').toLowerCase().includes(q) ||
            (v.paid_to || '').toLowerCase().includes(q) ||
            (v.description || '').toLowerCase().includes(q) ||
            String(v.amount || '') === q
          ).slice(0, 3).forEach(v => {
            suggs.push({
              title: `${v.ev_number || 'EV #' + v.id} — ${v.paid_to || 'Payee'}`,
              subtitle: `📄 Expense • ETB ${Number(v.amount || 0).toLocaleString()} • ${(v.status || 'pending').replace(/_/g, ' ')}`,
              type: 'fin_ev',
              item: v
            });
          });

          // Cash book entries (expense/income ledger rows)
          arr(cbRes).filter(e =>
            (e.reference || '').toLowerCase().includes(q) ||
            (e.description || '').toLowerCase().includes(q) ||
            (e.type || '').toLowerCase() === q
          ).slice(0, 3).forEach(e => {
            const amt = Number(e.receipts || 0) > 0 ? `+ETB ${Number(e.receipts).toLocaleString()}` : `-ETB ${Number(e.payments || 0).toLocaleString()}`;
            suggs.push({
              title: e.description ? String(e.description).slice(0, 55) : (e.reference || `Entry #${e.id}`),
              subtitle: `📚 Cash Book • ${amt} • ${e.reference || e.date || ''}`,
              type: 'fin_cashbook',
              item: e
            });
          });

          // Liabilities & payables (supplier bills)
          arr(liabRes).filter(l =>
            (l.supplier_name || '').toLowerCase().includes(q) ||
            (l.invoice_number || '').toLowerCase().includes(q) ||
            (l.status || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(l => {
            suggs.push({
              title: `${l.supplier_name || 'Supplier'} — ${l.invoice_number || 'Invoice'}`,
              subtitle: `⚠️ Liability • ETB ${Number(l.balance ?? l.amount ?? 0).toLocaleString()} owed • ${l.status || 'Pending'}`,
              type: 'fin_liability',
              item: l
            });
          });
        } else if (isPurchRoute) {
          // ── PURCHASE MANAGER: pages already shown instantly above; now live data ──
          suggs.push(...purchPageHits);

          const [tenderRes, reqRes, quoteRes, orderRes, supRes] = await Promise.all([
            apiClient.get('/tenders').catch(() => ({ data: [] })),
            apiClient.get('/procurement/requests').catch(() => ({ data: [] })),
            apiClient.get('/purchase/quotations').catch(() => ({ data: [] })),
            apiClient.get('/purchase/orders').catch(() => ({ data: [] })),
            apiClient.get('/suppliers').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;

          // Tenders & bids
          arr(tenderRes).filter(t =>
            (t.reference_number || '').toLowerCase().includes(q) ||
            (t.title || '').toLowerCase().includes(q) ||
            (t.item_name || '').toLowerCase().includes(q) ||
            (t.status || '').toLowerCase().includes(q)
          ).slice(0, 4).forEach(t => {
            suggs.push({
              title: `${t.reference_number || 'Tender #' + t.id} — ${t.title || t.item_name || 'Tender'}`,
              subtitle: `💵 Tender • ${(t.item_name || '')}${t.quantity ? ` • Qty ${t.quantity}` : ''} • ${(t.status || 'open')}`,
              type: 'purch_tender',
              item: t
            });
          });

          // Procurement requests (purchase requisitions)
          arr(reqRes).filter(r =>
            (r.pr_no || '').toLowerCase().includes(q) ||
            (r.drug_name || r.item_name || '').toLowerCase().includes(q) ||
            (r.status || '').toLowerCase().includes(q) ||
            String(r.id) === q
          ).slice(0, 4).forEach(r => {
            suggs.push({
              title: `${r.pr_no || 'PR #' + r.id} — ${r.drug_name || r.item_name || 'Request'}`,
              subtitle: `🛒 Request • Qty ${r.quantity_requested ?? r.quantity ?? '-'} ${r.unit_of_measure || ''} • ${(r.urgency || r.status || 'pending')}`,
              type: 'purch_request',
              item: r
            });
          });

          // Supplier quotations
          arr(quoteRes).filter(qt =>
            (qt.quotation_no || '').toLowerCase().includes(q) ||
            (qt.supplier_name || '').toLowerCase().includes(q) ||
            (qt.item_description || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(qt => {
            suggs.push({
              title: `${qt.quotation_no || 'Quote #' + qt.id} — ${qt.supplier_name || 'Supplier'}`,
              subtitle: `📄 Quotation • ETB ${Number(qt.total_amount ?? qt.unit_price ?? 0).toLocaleString()} • ${String(qt.item_description || '').slice(0, 30)}`,
              type: 'purch_quote',
              item: qt
            });
          });

          // Purchase orders
          arr(orderRes).filter(o =>
            (o.po_number || o.order_number || '').toLowerCase().includes(q) ||
            (o.supplier_name || o.supplier || '').toLowerCase().includes(q) ||
            (o.status || '').toLowerCase().includes(q) ||
            String(o.id) === q
          ).slice(0, 3).forEach(o => {
            suggs.push({
              title: `${o.po_number || o.order_number || 'PO #' + o.id}`,
              subtitle: `📦 Purchase Order • ${o.supplier_name || o.supplier || 'Supplier'} • ${(o.status || 'pending').replace(/_/g, ' ')}`,
              type: 'purch_order',
              item: o
            });
          });

          // Suppliers directory
          arr(supRes).filter(s =>
            (s.name || s.company_name || s.supplier_name || '').toLowerCase().includes(q) ||
            (s.email || s.contact_email || '').toLowerCase().includes(q) ||
            (s.phone || s.contact_phone || '').toString().includes(q)
          ).slice(0, 4).forEach(s => {
            const nm = s.name || s.company_name || s.supplier_name || 'Supplier';
            suggs.push({
              title: nm,
              subtitle: `🏢 Supplier • ${s.email || s.contact_email || s.phone || s.contact_phone || 'contact N/A'}${s.verified ? ' • ✔ verified' : ''}`,
              type: 'purch_supplier',
              item: s
            });
          });
        } else {
          // ── PHARMACY MANAGER: search products, sales records, audit trail ──
          const [prodRes, salesRes, auditRes] = await Promise.all([
            apiClient.get('/pharmacy/products'),
            apiClient.get('/pharmacy/sales').catch(() => ({ data: [] })),
            apiClient.get('/pharmacy/audit-trail').catch(() => ({ data: [] }))
          ]);
          if (!isMounted) return;

          // Products / Medicines
          const products = Array.isArray(prodRes.data?.data) ? prodRes.data.data : Array.isArray(prodRes.data) ? prodRes.data : [];
          products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 5).forEach(p => {
            const stockVal = p.stock !== undefined ? p.stock : (p.quantity || 0);
            const priceVal = p.price || p.selling_price || p.unit_price || 0;
            suggs.push({
              title: p.name,
              subtitle: `💊 Medicine • ETB ${priceVal} • ${stockVal} in stock`,
              type: 'product',
              item: { ...p, price: priceVal, stock: stockVal }
            });
          });

          // Sales records
          const salesRaw = Array.isArray(salesRes.data?.sales) ? salesRes.data.sales : Array.isArray(salesRes.data) ? salesRes.data : [];
          salesRaw.filter(s =>
            (s.customer_name || '').toLowerCase().includes(q) ||
            (s.worker_name || s.cashier_name || '').toLowerCase().includes(q) ||
            (s.receipt_no || '').toLowerCase().includes(q) ||
            String(s.id).includes(q)
          ).slice(0, 4).forEach(s => {
            suggs.push({
              title: s.customer_name || `Sale #${s.id}`,
              subtitle: `💰 Sale by ${s.worker_name || s.cashier_name || 'Staff'} • ETB ${parseFloat(s.total_amount || 0).toFixed(2)}`,
              type: 'sale',
              item: s
            });
          });

          // Audit trail
          const auditRaw = Array.isArray(auditRes.data) ? auditRes.data : [];
          auditRaw.filter(e =>
            (e.user_name || '').toLowerCase().includes(q) ||
            (e.action || '').toLowerCase().includes(q) ||
            (e.description || '').toLowerCase().includes(q)
          ).slice(0, 3).forEach(e => {
            suggs.push({
              title: e.user_name || 'Audit Entry',
              subtitle: `📋 ${(e.action || '').replace(/_/g, ' ')} • ${e.description || ''}`.slice(0, 60),
              type: 'audit',
              item: e
            });
          });
        }

        setNavSuggestions(suggs);
        setNavSelectedIndex(0);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        if (isMounted) setNavSearchLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navSearchValue, location.pathname]);

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
          playSound('received');
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
      // Role gating: only toast notifications that belong to THIS user's dashboard
      let roleFlags = { pharm: false, store: false, fin: false, userId: null };
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const rl = (Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : [])).map(r => String(r).toLowerCase());
        roleFlags.pharm = rl.some(r => r.includes('pharmacy') || r.includes('sales/cashier'));
        roleFlags.store = rl.some(r => r.includes('store keeper'));
        roleFlags.fin = rl.some(r => r.includes('finance'));
        roleFlags.userId = u?.id ?? null;
      } catch (_) {}
      // Personal employee notifications (task assigned / payslip ready) — exact user match
      const isForMe = (data) => data && roleFlags.userId != null && Number(data.user_id) === Number(roleFlags.userId);
      socket.on('employee-task', (data) => {
        if (!isForMe(data)) return;
        // No sound — bell notifications are silent; sound plays only for new chat messages
        sendPushNotification(data.title || 'New Task Assigned', data.message || '', data.link || '');
        if (data.title) showToast(`${data.title}: ${data.message}`, 'info');
        setNotifRefresh(n => n + 1);
      });
      socket.on('employee-payslip', (data) => {
        if (!isForMe(data)) return;
        sendPushNotification(data.title || 'Payslip Available', data.message || '', data.link || '');
        if (data.title) showToast(`${data.title}: ${data.message}`, 'success');
        setNotifRefresh(n => n + 1);
      });
      socket.on('pharmacy-transfer', (data) => {
        const { title, message, type, link } = data || {};
        if (!(roleFlags.pharm || roleFlags.store)) return;
        // No sound for sale/pos events — only for logistics events like shipment
        const silentTypes = ['sale_created', 'pos', 'pharmacy', 'prescription', 'sales_report'];
        if (!silentTypes.includes(type)) playSound(soundNameForType(type));
        sendPushNotification(title || 'Pharmacy Transfer', message || '', link || '');
        if (title) showToast(`${title}: ${message}`, type);
        setNotifRefresh(n => n + 1);
      });
      // Online Prescription Requests
      socket.on('new-prescription-request', (data) => {
        if (!roleFlags.pharm) return;
        const { request_number, medication_name, quantity, customer_name } = data || {};
        // No sound — just toast and push notification
        sendPushNotification('New Online Order', `${customer_name} ordered ${medication_name} x${quantity}`, '/pharmacy-worker/sales');
        showToast(`New Online Order #${request_number}: ${customer_name} ordered ${medication_name}`, 'info');
        setNotifRefresh(n => n + 1);
        // Dispatch event for PharmacySalesForm to update cart if open
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      });
      // Finance notifications (from any dashboard submitting to finance)
      socket.on('finance-cash', (data) => {
        const { title, message, type, link } = data || {};
        const meantForFinance = roleFlags.fin && link?.startsWith('/finance');

        // Always refresh the bell so the DB-backed notification appears (badge + list)
        if (meantForFinance) {
          if (title) {
            // sound fires only when a bell message actually arrives
            const t = String(title).toLowerCase();
            playSound(t.includes('reject') ? 'rejected' : t.includes('approv') || t.includes('confirm') ? 'approved' : 'request');
            showToast(`${title}: ${message}`, type || 'info');
          }
          setNotifRefresh(n => n + 1);
        }
      });
      // CEO notifications (CEO approves/rejects an action on finance pages)
      socket.on('ceo-cash', (data) => {
        const { title, message, type, link } = data || {};
        const meantForCeo = !link || link?.startsWith('/finance') || link?.startsWith('/ceo');
        if (meantForCeo) {
          let isCeoUser = false;
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []);
            isCeoUser = roles.some(r => ['CEO', 'Admin'].includes(r));
          } catch (_) {}
          if (isCeoUser && title) {
            // decision-aware sound: approved / rejected / waited / confirmation
            const t = String(title).toLowerCase();
            playSound(t.includes('reject') ? 'rejected' : t.includes('wait') ? 'waited' : t.includes('approv') ? 'approved' : 'ceo_confirmation_needed');
            showToast(`${title}: ${message}`, type || 'info');
          }
          setNotifRefresh(n => n + 1);
        }
      });
      // Printing Supervisor notifications (online orders, finance decisions, CEO material decisions)
      socket.on('printing-cash', (data) => {
        const { title, message, type, link } = data || {};
        let isPrintingUser = false;
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []);
          isPrintingUser = roles.some(r => String(r).toLowerCase().includes('printing'));
        } catch (_) {}
        if (isPrintingUser && title) {
          // sound fires only when a bell message actually arrives
          playSound(soundNameForType(type));
          showToast(`${title}: ${message}`, type === 'payment_confirmed' ? 'success' : type === 'payment_rejected' ? 'error' : 'info');
        }
        if (isPrintingUser) setNotifRefresh(n => n + 1);
      });
      // Customer portal notifications (order confirmations, payments, prescriptions, rentals)
      socket.on('customer-cash', (data) => {
        const { title, message, type, link } = data || {};
        let isCustomerUser = false;
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []);
          isCustomerUser = roles.some(r => String(r).toLowerCase() === 'customer');
        } catch (_) {}
        if (!isCustomerUser) return;
        // Only react to rows meant for customer pages
        const meantForCustomer = !link || link?.startsWith('/customer');
        if (meantForCustomer && title) {
          // sound fires only when a bell message actually arrives; decision-aware
          const t = String(title).toLowerCase();
          playSound(t.includes('reject') ? 'rejected' : t.includes('approv') || t.includes('confirm') || t.includes('ready') ? 'approved' : 'request');
          showToast(`${title}: ${message}`, t.includes('reject') ? 'error' : 'success');
        }
        setNotifRefresh(n => n + 1);
      });

      // ── Generic DB notification (sent by sendNotification() service for any role) ──
      // This fires for: transfer approved/rejected, procurement approved/rejected,
      // health publisher unlock, stock operations unlock, shipment notifications, etc.
      socket.on('notification', (data) => {
        const { title, message, type } = data || {};
        // Always refresh the bell badge & list
        setNotifRefresh(n => n + 1);
        // Play a sound matching the notification type or title
        if (title) {
          const t = String(title).toLowerCase();
          const sound = t.includes('reject') ? 'rejected'
            : t.includes('approv') ? 'approved'
            : t.includes('ship') || t.includes('receiv') ? 'received'
            : t.includes('unlock') || t.includes('grant') ? 'info'
            : t.includes('expired') || t.includes('expir') ? 'expired'
            : soundNameForType(type);
          playSound(sound);
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
      apiClient.get('/finance-cash/ev/finance-notifications').then(res => {
        const evs = res?.data || [];
        setPcvNotifications(prev => {
          // Merge with existing socket notifications to avoid duplicates
          const existingIds = prev.map(p => p.dbId).filter(Boolean);
          const newNotifs = evs.filter(p => !existingIds.includes(p.id)).map(p => ({
            id: Date.now() + p.id,
            dbId: p.id,
            title: p.status === 'approved_finance' ? '✅ Expense Voucher Approved' : '❌ Expense Voucher Rejected',
            message: `EV ${p.ev_number} ${p.status === 'approved_finance' ? 'approved' : 'rejected'} by CEO.`,
            link: '/finance/ev',
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
                <span className="nav-icon" style={item.color ? { color: item.color } : undefined}>{ICONS[item.icon] || ICONS.default}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {/* Generic badge on a top-level menu item */}
                {item.badge > 0 && (
                  <span style={{
                    background: '#f97316', color: '#fff', borderRadius: '9999px',
                    fontSize: '10px', fontWeight: 800, minWidth: 18, height: 18,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', flexShrink: 0
                  }}>{item.badge > 99 ? '99+' : item.badge}</span>
                )}
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
              <span className="dash-search-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#047857', display: 'flex' }}>
                {_apiLoading ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'dash-search-spin 0.8s linear infinite' }}>
                    <circle cx="9" cy="9" r="7" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeDasharray="35 10" />
                  </svg>
                ) : (
                  <Search size={18} />
                )}
              </span>
              <input 
                type="text" 
                placeholder={
  location.pathname.startsWith('/admin') ? 'Search users, logs, alerts...' : 
  location.pathname.startsWith('/pharmacy') ? 'Search sales, medicines, orders...' : 
  location.pathname.startsWith('/employee') ? 'Search tasks, payslips, pages...' : 
  location.pathname.startsWith('/hr') ? 'Search employees, payroll, HR pages...' : 
  location.pathname.startsWith('/printing-manager') ? 'Search jobs, orders, production...' : 
  location.pathname.startsWith('/sales') ? 'Search products, sales, pages...' : 
  location.pathname.startsWith('/purchase') ? 'Search tenders, suppliers, orders, pages...' : 
  location.pathname.startsWith('/finance') ? 'Search bank accounts, receivables, pages...' : 
  location.pathname.startsWith('/car-renting') ? 'Search rentals, fleet, tractors...' :
  location.pathname.startsWith('/customer') ? 'Search my orders, invoices, pages...' :
  'Search...'
}
                value={navSearchValue}
                onChange={(e) => {
                  setNavSearchValue(e.target.value);
                  setShowNavSuggestions(true);
                  window.dispatchEvent(new CustomEvent('dashboardSearch', { detail: e.target.value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setNavSelectedIndex(prev => Math.min(prev + 1, navSuggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setNavSelectedIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (navSuggestions.length > 0 && navSuggestions[navSelectedIndex]) {
                      const sel = navSuggestions[navSelectedIndex];
                      const isWorker = location.pathname.startsWith('/pharmacy-worker');
                      const isManager = location.pathname.startsWith('/pharmacy') && !isWorker;
                      if (isWorker) {
                        if (location.pathname !== '/pharmacy-worker/sales') {
                          navigate('/pharmacy-worker/sales', { state: { autoSelectSearchItem: sel } });
                        } else {
                          window.dispatchEvent(new CustomEvent('dashboardSearchSelect', { detail: sel }));
                        }
                      } else if (isManager) {
                        if (sel.type === 'product') {
                          navigate('/pharmacy/medicines', { state: { autoSelectSearchItem: sel } });
                        } else if (sel.type === 'sale' || sel.type === 'audit') {
                          navigate('/pharmacy/manager-sales', { state: { autoSelectSearchItem: sel } });
                        } else {
                          navigate('/pharmacy/manager-sales', { state: { autoSelectSearchItem: sel } });
                        }
                      } else if (location.pathname.startsWith('/admin')) {
                        if (sel.type === 'admin_user') {
                          navigate('/admin/users', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'admin_audit') {
                          navigate('/admin/audit', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'admin_alert') {
                          navigate('/admin/alerts', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/admin/overview');
                        }
                      } else if (location.pathname.startsWith('/employee')) {
                        if (sel.type === 'emp_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'emp_task') {
                          navigate('/employee/tasks/mine', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'emp_payslip') {
                          navigate('/employee/payslips');
                        } else {
                          navigate('/employee/overview');
                        }
                      } else if (location.pathname.startsWith('/hr')) {
                        if (sel.type === 'hr_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'hr_employee') {
                          navigate('/hr/employees', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'hr_application') {
                          navigate('/hr/applications', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/hr/employee-summary');
                        }
                      } else if (location.pathname.startsWith('/printing-manager')) {
                        if (sel.type === 'print_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'print_order') {
                          navigate('/printing-manager/jobs/history', { state: { dashSearchTerm: sel.item?.order_number || sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/printing-manager/overview');
                        }
                      } else if (location.pathname.startsWith('/finance')) {
                        if (sel.type === 'fin_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'fin_account') {
                          navigate('/finance/bank-accounts', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'fin_receivable') {
                          navigate('/finance/accounts-receivable', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'fin_crv') {
                          navigate('/finance/crv', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'fin_ev') {
                          navigate('/finance/ev', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'fin_cashbook') {
                          navigate('/finance/cash-book');
                        } else if (sel.type === 'fin_liability') {
                          navigate('/finance/liabilities');
                        } else if (sel.type === 'fin_income') {
                          navigate('/finance/pharmacy-sales');
                        } else {
                          navigate('/finance/overview');
                        }
                      } else if (location.pathname.startsWith('/purchase')) {
                        if (sel.type === 'purch_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'purch_tender') {
                          navigate('/purchase/smart-tenders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'purch_request') {
                          navigate('/purchase/requests', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'purch_quote') {
                          navigate('/purchase/quotations', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'purch_order') {
                          navigate('/purchase/orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'purch_supplier') {
                          navigate('/purchase/suppliers', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/purchase/overview');
                        }
                      } else if (location.pathname.startsWith('/car-renting')) {
                        if (sel.type === 'car_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'car_order') {
                          navigate('/car-renting/manager/orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'car_agri_order') {
                          navigate('/car-renting/manager/agri-orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'car_fleet') {
                          navigate('/car-renting/manager/fleet', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'car_tractor') {
                          navigate('/car-renting/manager/tractor-fleet', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/car-renting/manager/dashboard');
                        }
                      } else if (location.pathname.startsWith('/customer')) {
                        if (sel.type === 'cust_page' && sel.item?.path) {
                          navigate(sel.item.path);
                        } else if (sel.type === 'cust_printing') {
                          navigate('/customer/printing-orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'cust_agri') {
                          navigate('/customer/farming-orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'cust_retail') {
                          navigate('/customer/retail-orders', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'cust_rental') {
                          navigate('/customer/rentals', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'cust_rx') {
                          navigate('/customer/prescriptions', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else if (sel.type === 'cust_bid') {
                          navigate('/customer/bids', { state: { dashSearchTerm: sel.title, dashSearchItem: sel.item } });
                        } else {
                          navigate('/customer/dashboard');
                        }
                      }
                      setShowNavSuggestions(false);
                      setNavSearchValue('');
                      window.dispatchEvent(new CustomEvent('dashboardSearch', { detail: '' }));
                    }
                  } else if (e.key === 'Escape') {
                    setShowNavSuggestions(false);
                  }
                }}
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
                  setTimeout(() => setShowNavSuggestions(false), 200);
                }}
              />
              {/* Dropdown */}
              {showNavSuggestions && navSearchValue.trim() !== '' && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                  background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0', zIndex: 100, maxHeight: '400px', overflowY: 'auto', padding: '8px 0'
                }}>
                  {navSuggestions.length === 0 ? (
                    <div style={{ padding: '12px 20px', color: '#64748b', fontSize: '14px', textAlign: 'center' }}>No results found</div>
                  ) : (
                    navSuggestions.map((s, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '10px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                          background: idx === navSelectedIndex ? '#f1f5f9' : 'transparent',
                          borderLeft: idx === navSelectedIndex ? '3px solid #047857' : '3px solid transparent'
                        }}
                        onMouseEnter={() => setNavSelectedIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevents input from losing focus immediately
                          const isWorker = location.pathname.startsWith('/pharmacy-worker');
                          const isManager = location.pathname.startsWith('/pharmacy') && !isWorker;
                          if (isWorker) {
                            if (location.pathname !== '/pharmacy-worker/sales') {
                              navigate('/pharmacy-worker/sales', { state: { autoSelectSearchItem: s } });
                            } else {
                              window.dispatchEvent(new CustomEvent('dashboardSearchSelect', { detail: s }));
                            }
                          } else if (isManager) {
                            if (s.type === 'product') {
                              navigate('/pharmacy/medicines', { state: { autoSelectSearchItem: s } });
                            } else {
                              navigate('/pharmacy/manager-sales', { state: { autoSelectSearchItem: s } });
                            }
                          } else if (location.pathname.startsWith('/admin')) {
                            if (s.type === 'admin_user') {
                              navigate('/admin/users', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'admin_audit') {
                              navigate('/admin/audit', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'admin_alert') {
                              navigate('/admin/alerts', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/admin/overview');
                            }
                          } else if (location.pathname.startsWith('/employee')) {
                            if (s.type === 'emp_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'emp_task') {
                              navigate('/employee/tasks/mine', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'emp_payslip') {
                              navigate('/employee/payslips');
                            } else {
                              navigate('/employee/overview');
                            }
                          } else if (location.pathname.startsWith('/hr')) {
                            if (s.type === 'hr_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'hr_employee') {
                              navigate('/hr/employees', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'hr_application') {
                              navigate('/hr/applications', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/hr/employee-summary');
                            }
                          } else if (location.pathname.startsWith('/printing-manager')) {
                            if (s.type === 'print_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'print_order') {
                              navigate('/printing-manager/jobs/history', { state: { dashSearchTerm: s.item?.order_number || s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/printing-manager/overview');
                            }
                          } else if (location.pathname.startsWith('/car-renting')) {
                            if (s.type === 'car_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'car_order') {
                              navigate('/car-renting/manager/orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'car_agri_order') {
                              navigate('/car-renting/manager/agri-orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'car_fleet') {
                              navigate('/car-renting/manager/fleet', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'car_tractor') {
                              navigate('/car-renting/manager/tractor-fleet', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/car-renting/manager/dashboard');
                            }
                          } else if (location.pathname.startsWith('/customer')) {
                            if (s.type === 'cust_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'cust_printing') {
                              navigate('/customer/printing-orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'cust_agri') {
                              navigate('/customer/farming-orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'cust_retail') {
                              navigate('/customer/retail-orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'cust_rental') {
                              navigate('/customer/rentals', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'cust_rx') {
                              navigate('/customer/prescriptions', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'cust_bid') {
                              navigate('/customer/bids', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/customer/dashboard');
                            }
                          } else if (location.pathname.startsWith('/finance')) {
                            if (s.type === 'fin_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'fin_account') {
                              navigate('/finance/bank-accounts', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'fin_receivable') {
                              navigate('/finance/accounts-receivable', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'fin_crv') {
                              navigate('/finance/crv', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'fin_ev') {
                              navigate('/finance/ev', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'fin_cashbook') {
                              navigate('/finance/cash-book');
                            } else if (s.type === 'fin_liability') {
                              navigate('/finance/liabilities');
                            } else if (s.type === 'fin_income') {
                              navigate('/finance/pharmacy-sales');
                            } else {
                              navigate('/finance/overview');
                            }
                          } else if (location.pathname.startsWith('/purchase')) {
                            if (s.type === 'purch_page' && s.item?.path) {
                              navigate(s.item.path);
                            } else if (s.type === 'purch_tender') {
                              navigate('/purchase/smart-tenders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'purch_request') {
                              navigate('/purchase/requests', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'purch_quote') {
                              navigate('/purchase/quotations', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'purch_order') {
                              navigate('/purchase/orders', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else if (s.type === 'purch_supplier') {
                              navigate('/purchase/suppliers', { state: { dashSearchTerm: s.title, dashSearchItem: s.item } });
                            } else {
                              navigate('/purchase/overview');
                            }
                          }
                          setShowNavSuggestions(false);
                          setNavSearchValue('');
                          window.dispatchEvent(new CustomEvent('dashboardSearch', { detail: '' }));
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{s.title}</div>
                        {s.subtitle && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.subtitle}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
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
              setStoreApprovalsPending={setStoreApprovalsPending}
              pharmacyPending={pharmacyPending}
              setPharmacyPending={setPharmacyPending}
              pharmacyOnlinePending={pharmacyOnlinePending}
              setPharmacyOnlinePending={setPharmacyOnlinePending}
              purchasePending={purchasePending}
              setPurchasePending={setPurchasePending}
              purchaseApprovedTenders={purchaseApprovedTenders}
              setPurchaseApprovedTenders={setPurchaseApprovedTenders}
              procurementMessages={procurementMessages}
              setProcurementMessages={setProcurementMessages}
              purchaseNewBids={purchaseNewBids}
              purchaseBidsList={purchaseBidsList}
              setPurchaseBidsList={setPurchaseBidsList}
              setPurchaseNewBids={setPurchaseNewBids}
              ceoFundRequestsPending={ceoFundRequestsPending}
              setCeoFundRequestsPending={setCeoFundRequestsPending}
              agriRentPending={agriRentPending}
              onOpenProcurementInbox={() => navigate('/purchase/smart-tenders?tab=contact')}
              pcvNotifications={pcvNotifications}
              setPcvNotifications={setPcvNotifications}
              isFinanceRoute={location.pathname.startsWith('/finance')}
              isPharmacyManagerRoute={location.pathname === '/pharmacy' || location.pathname.startsWith('/pharmacy/')}
              chatUnread={chatUnread}
              setChatUnread={setChatUnread}
              showToast={showToast}
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
