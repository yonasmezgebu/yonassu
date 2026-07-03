import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, Users, ClipboardList, Settings, BarChart2, ShoppingCart, FileText, Wallet,
  CreditCard, TrendingUp, Package, Truck, Printer, Layers, Receipt, AreaChart,
  List, User, FilePlus, Box, ArrowRight, Bell, Search, LogOut, ChevronDown, Monitor, CheckCircle, Car, X,
  Target, Shield, AlertTriangle, GitBranch, Scale, Building, AlertOctagon, UserCheck, Layout, Lock,
  Key, Sprout, Pill, CirclePlus, MessageCircle, ChevronRight, Clock, Book, AlertCircle,
  Sliders, RotateCcw, UserPlus, Upload, Droplet, CheckCircle2, AlertCircle as AlertCircle2, Info, X as XIcon, EyeOff,
  Folder, Image, Wrench, Inbox, UploadCloud, Eye, GitCommit, Cpu, Activity, Scissors, Archive, Star, RotateCcw as RepeatCcw,
  PenTool, PieChart, DollarSign, FolderOpen
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification, requestPermission } from '../../services/notificationManager';
import { io } from 'socket.io-client';
import './DashboardLayout.css';

const ICONS = {
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
const NotificationBell = ({ navigate, refreshTrigger, ceoPending, isCeoRoute, ceoPendingSnapshot, setCeoPendingSnapshot }) => {
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

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsReadV2();
      setItems(prev => prev.map(i => ({ ...i, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markAsReadV2(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleClick = (item) => {
    setOpen(false);
    if (item.id) markRead(item.id);
    if (item.link) navigate(item.link);
  };

  const handleCeoClick = (item) => {
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  const ceoTotal = (ceoPending || []).reduce((s, i) => s + i.count, 0);
  const ceoNew = Math.max(0, ceoTotal - (ceoPendingSnapshot || 0));
  const notifCount = items.filter(i => !i.isRead).length;
  const totalCount = ceoNew + notifCount;

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
        <Bell size={18} />
        {totalCount > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            backgroundColor: '#EF4444', color: 'white',
            borderRadius: '9999px', fontSize: '10px', fontWeight: '700',
            minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1
          }}>{totalCount > 9 ? '9+' : totalCount}</span>
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
            {totalCount > 0 && <span style={{ fontSize: '12px', color: '#6B7280' }}>{totalCount} unread</span>}
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {ceoPending.length > 0 && ceoPending.map((item, idx) => (
              <div
                key={'ceo-' + idx}
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
            ))}
            {ceoPending.length > 0 && items.length > 0 && <div style={{ borderTop: '1px solid #E5E7EB' }} />}
            {items.length > 0 ? items.map(item => (
              <div
                key={item.id}
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
            )) : items.length === 0 && ceoPending.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
                <CheckCircle size={32} style={{ marginBottom: '8px', color: '#10B981' }} />
                <p style={{ margin: 0 }}>All caught up!</p>
              </div>
            ) : null}
          </div>
          {notifCount > 0 && (
            <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
              <button
                onClick={() => { navigate('/notifications'); setOpen(false); }}
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

const DashboardLayout = ({ children, menuItems, title, hideTopbar }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [toasts, setToasts] = useState([]);
  const [notifRefresh, setNotifRefresh] = useState(0);
  const [ceoPending, setCeoPending] = useState([]);
  const [ceoPendingSnapshot, setCeoPendingSnapshot] = useState(0);
  const profileRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isCeoRoute = location.pathname.startsWith('/ceo');
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);
  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
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
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [showToast]);

  useEffect(() => {
    if (isCeoRoute) {
      apiClient.get('/erp/ceo-pending').then(res => {
        if (res?.status === 'success') setCeoPending(res.data || []);
      }).catch(() => {});
      setCeoPendingSnapshot(0);
    } else {
      setCeoPending([]);
      setCeoPendingSnapshot(0);
    }
  }, [location.pathname, isCeoRoute]);

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
  const isActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    const [p, qs] = path.split('?');
    if (qs !== undefined) {
      return (location.pathname + location.search) === path;
    }
    return location.pathname.startsWith(p + '/') || location.pathname === p;
  };
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.path));
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
                    className={`dash-nav-item ${isParentActive(item) || isActive(item.path) ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.label)}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <span className="nav-icon">{ICONS[item.icon] || ICONS.default}</span>
                    <span>{item.label}</span>
                    <ChevronRight size={14} className={`dash-nav-chevron ${isExpanded ? 'open' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="dash-nav-submenu">
                      {item.children.map(child => (
                        <button
                          key={child.label || child.path}
                          className={`dash-nav-subitem ${isActive(child.path) ? 'active' : ''}`}
                          onClick={() => handleNav(child)}
                        >
                          {child.icon && <span className="nav-icon sub-icon" style={child.color ? { color: child.color } : undefined}>{ICONS[child.icon] || ICONS.default}</span>}
                          {child.label}
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
                className={`dash-nav-item ${item.className || ''} ${isActive(item.path) ? 'active' : ''}`}
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
          
          <div className="dash-topbar-center">
            <div className="dash-search">
              <span className="dash-search-icon"><Search size={16} /></span>
              <input type="text" placeholder="Search medicines, orders, or customers..." />
            </div>
          </div>

          <div className="dash-topbar-right">
            <NotificationBell navigate={navigate} refreshTrigger={notifRefresh} ceoPending={ceoPending} isCeoRoute={isCeoRoute} ceoPendingSnapshot={ceoPendingSnapshot} setCeoPendingSnapshot={setCeoPendingSnapshot} />
            <div className="dash-profile-dropdown" ref={profileRef}>
              <button 
                className={`dash-user-chip ${profileOpen ? 'open' : ''}`} 
                onClick={() => setProfileOpen(!profileOpen)}
                title={user?.roles?.[0]}
              >
                <div className="dash-avatar">
                  {user?.fullName?.charAt(0)?.toUpperCase() || <User size={14} />}
                </div>
                <div className="dash-user-info">
                  <div className="dash-user-name">{user?.fullName || 'User'}</div>
                  <div className="dash-user-role">{user?.roles?.[0] || 'Staff'}</div>
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${profileOpen ? 'rotate' : ''}`} />
              </button>
              
              {profileOpen && (
                <div className="dash-dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.fullName || 'User'}</p>
                    <p className="dropdown-email">{user?.email || 'user@sutana.com'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate(user?.roles?.includes('Admin') ? '/admin/settings' : '/customer/profile')}>
                    <User size={16} />
                    My Profile
                  </button>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        )}
        <div className="dash-content">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
