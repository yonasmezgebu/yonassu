import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Bell, Settings, ChevronDown, LogOut, User,
  LayoutDashboard, Package, Wallet, BarChart3, X, Menu
} from 'lucide-react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';
import './TopNavBar.css';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Inventory', path: '/store/inventory-list', icon: Package },
  { label: 'Finance',   path: '/finance/financial-summary', icon: Wallet },
  { label: 'Analytics', path: '/reports/sales-reports', icon: BarChart3 },
];

export default function TopNavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const socketRef = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isAdminCEO = user?.roles?.some(r => ['Admin', 'CEO'].includes(r));

  /* ── Fetch notifications (news + system) ── */
  const fetchAllNotifications = useCallback(async () => {
    try {
      const [newsRes, sysRes, v2Res] = await Promise.all([
        notificationService.getMyNotifications(),
        notificationService.getSystemNotifications().catch(() => ({ data: { notifications: [] } })),
        notificationService.getMyNotificationsV2().catch(() => ({ data: [] }))
      ]);
      const news = newsRes?.status === 'success' ? (newsRes.data || []) : [];
      
      // V1 system notifications
      const sysData = (sysRes?.data?.notifications || sysRes?.data || []);
      const sys = sysData.map(n => ({
        id: `sys1-${n.id}`,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt || n.created_at,
        isRead: n.isRead || n.is_read,
        _type: n.type || 'system',
        _refId: n.id,
        _link: n.link_url || n.link,
      }));

      // V2 system notifications (role-based scopes)
      const v2Data = (v2Res?.data || v2Res || []);
      const v2Sys = Array.isArray(v2Data) ? v2Data.map(n => ({
        id: `sys2-${n.id}`,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt || n.created_at,
        isRead: n.isRead || n.is_read,
        _type: n.type || 'system',
        _refId: n.id,
        _link: n.link,
      })) : [];

      const merged = [...news, ...sys, ...v2Sys].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(merged);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAllNotifications();
  }, [isAuthenticated, fetchAllNotifications]);

  /* ── Socket.io for real-time notifications ── */
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = io(window.location.origin, { transports: ['websocket', 'polling'], withCredentials: true, auth: { token: localStorage.getItem('token') || '' } });

    socketRef.current = socket;

    // Join the socket room for role/id
    if (user.roles && user.roles.length > 0) {
      user.roles.forEach(role => socket.emit('join', { id: user.id, role }));
    } else {
      socket.emit('join', { id: user.id });
    }

    socket.on('notification', (data) => {
      setNotifications(prev => {
        const n = {
          id: `sys-${data.related_entity_id || Date.now()}`,
          title: data.title,
          message: data.message,
          createdAt: data.timestamp || new Date().toISOString(),
          isRead: false,
          _type: data.type || 'system',
          _refId: data.related_entity_id,
          _link: data.link
        };
        return [n, ...prev];
      });
    });

    if (isAdminCEO) {
      socket.on('new-prescription-request', (data) => {
        setNotifications(prev => {
          const n = {
            id: `rt-${data.id}-${Date.now()}`,
            title: `New Prescription Request: ${data.request_number}`,
            message: `${data.customer_name} ordered ${data.medication_name} x${data.quantity}`,
            createdAt: new Date().toISOString(),
            isRead: false,
            _type: 'pharmacy',
            _refId: data.id,
          };
          return [n, ...prev];
        });
      });
    }

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isAuthenticated, user, isAdminCEO]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isCEO = location.pathname.startsWith('/ceo');

  const getDashboardTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/ceo')) return 'CEO Dashboard';
    if (p.startsWith('/sales') || p.startsWith('/retail')) return 'Sales Dashboard';
    if (p.startsWith('/pharmacy')) return 'Pharmacy Dashboard';
    if (p.startsWith('/farming') || p.startsWith('/car') || p.startsWith('/rental')) return 'Car & Agri Rental Dashboard';
    if (p.startsWith('/printing')) return 'Printing Dashboard';
    if (p.startsWith('/general-store')) return 'General Store Dashboard';
    if (p.startsWith('/purchase')) return 'Purchase Dashboard';
    if (p.startsWith('/finance')) return 'Finance Dashboard';
    if (p.startsWith('/hr')) return 'HR Dashboard';
    return 'SUTANA EMS Dashboard';
  };

  return (
    <header className="tnb-root">
      <div className="tnb-inner">
        
        {/* ── Left: Menu + Title ── */}
        <div className="tnb-left">
          <Menu size={24} color="#4B5563" style={{ cursor: 'pointer' }} />
          <span className="tnb-dynamic-title">{getDashboardTitle()}</span>
        </div>

        {/* ── Center: Search Bar ── */}
        <div className="tnb-center">
          <form className="tnb-search-form" onSubmit={handleSearch}>
            <Search size={18} color="#9CA3AF" />
            <input
              className="tnb-search-input"
              placeholder="Search sales, medicines, orders..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </form>
        </div>

        {/* ── Right: Icons + Profile ── */}
        <div className="tnb-actions">
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="tnb-icon-btn tnb-notif-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications">
              <Bell size={18} color="#047857" />
              {unreadCount > 0 && (
                <span className="tnb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="tnb-dropdown tnb-dropdown--notif">
                <div className="tnb-dropdown-header">
                  <span className="tnb-dropdown-title">Notifications</span>
                  {unreadCount > 0 && <span className="tnb-dropdown-sub">{unreadCount} unread</span>}
                </div>
                <div className="tnb-dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="tnb-dropdown-empty">All caught up!</div>
                  ) : (
                    notifications.slice(0, 8).map(n => {
                      const getLink = () => {
                        if (n._link) {
                          if (n._link === '/car-renting/orders' || n._link.startsWith('/car-renting/orders')) {
                            return '/car-renting/manager/orders';
                          }
                          return n._link;
                        }
                        const t = (n._type || '').toLowerCase();
                        const title = (n.title || '').toLowerCase();
                        const msg   = (n.message || '').toLowerCase();
                        if (title.includes('rental') || title.includes('cancellation') || msg.includes('rental order') || msg.includes('car renting')) return '/car-renting/manager/orders';
                        if (t === 'pharmacy' || title.includes('prescription') || title.includes('pharmacy')) return '/ceo/pharmacy-requests';
                        if (t === 'printing_material' || t === 'printing' || title.includes('printing') || title.includes('material request') || msg.includes('printing')) return '/ceo/printing?tab=material';
                        if (t === 'purchase' || title.includes('purchase') || title.includes('procurement')) return '/ceo/purchase';
                        if (t === 'farming' || title.includes('farming') || title.includes('agri')) return '/ceo/farming';
                        if (t === 'hiring' || title.includes('hiring') || title.includes('applicant')) return '/ceo/applicants';
                        if (t === 'store_request' || title.includes('store request') || msg.includes('store request') || msg.includes('needs release')) return '/general-store/issue';
                        if (t === 'finance' || title.includes('finance') || msg.includes('finance')) return '/finance/pharmacy-sales';
                        return null;
                      };
                      const link = getLink();
                      return (
                      <div key={n.id} className="tnb-notif-item"
                        style={{ cursor: 'pointer', background: n.isRead ? 'transparent' : '#f0fdf4', borderLeft: n.isRead ? 'none' : '3px solid #228B22', position: 'relative' }}
                        onClick={async () => {
                          setNotifOpen(false);
                          setNotifications(prev => prev.filter(x => x.id !== n.id));
                          if (n.id && n.id.startsWith('sys-') && n._refId) {
                            try { await notificationService.markSystemAsRead(n._refId); } catch (_) {}
                          }
                          if (link) navigate(link);
                        }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.filter(x => x.id !== n.id));
                            if (n.id && n.id.startsWith('sys-') && n._refId) {
                              try { notificationService.markSystemAsRead(n._refId); } catch (_) {}
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%'
                          }}
                          title="Dismiss notification"
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <X size={14} />
                        </button>
                        <div style={{ paddingRight: '20px' }}>
                          <p className="tnb-notif-title">{n.title}</p>
                          <p className="tnb-notif-msg">{n.message}</p>
                          {link && <p style={{margin:'2px 0 0',fontSize:'0.7rem',color:'#228B22',fontWeight:700}}>→ Click to view</p>}
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button className="tnb-profile-btn" onClick={() => setProfileOpen(o => !o)}>
              <div className="tnb-avatar">{initials}</div>
              <div className="tnb-profile-text">
                <span className="tnb-profile-name">{user?.name || 'User'}</span>
                <span className="tnb-profile-role">{user?.role || ''}</span>
              </div>
              <ChevronDown size={14} className={`tnb-chevron${profileOpen ? ' tnb-chevron--open' : ''}`} />
            </button>
            {profileOpen && (
              <div className="tnb-dropdown tnb-dropdown--profile">
                <div className="tnb-dropdown-user">
                  <div className="tnb-avatar tnb-avatar--lg">{initials}</div>
                  <div>
                    <p className="tnb-user-name">{user?.name || 'User'}</p>
                    <p className="tnb-user-role">{user?.role || ''}</p>
                  </div>
                </div>
                <div className="tnb-dropdown-divider" />
                <button className="tnb-dropdown-item" onClick={() => { navigate('/admin/settings'); setProfileOpen(false); }}>
                  <User size={15} /> My Profile
                </button>
                <div className="tnb-dropdown-divider" />
                <button className="tnb-dropdown-item tnb-dropdown-item--danger" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
