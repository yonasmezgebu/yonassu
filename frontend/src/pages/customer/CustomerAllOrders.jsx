import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import carService from '../../services/carService';
import { Printer, ShoppingCart, Package, Car, Pill, Search, Tractor, List, ChevronRight, ChevronLeft, Gavel } from 'lucide-react';

const ORDER_TYPES = [
  {
    key: 'retail',
    label: 'RETAIL',
    sublabel: 'Retail',
    icon: Package,
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.5)',
    img: '/cards/retail.png',
    navPath: '/customer/retail-orders',
    subtitle: 'Shop your retail orders',
  },
  {
    key: 'printing',
    label: 'PRINTING',
    sublabel: 'Printing',
    icon: Printer,
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.5)',
    img: '/cards/printing.png',
    navPath: '/customer/printing-orders',
    subtitle: 'Track print jobs',
  },
  {
    key: 'farming',
    label: 'AGRIRENT',
    sublabel: 'AgriRent',
    icon: Tractor,
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.7)',
    img: '/cards/agrirent.png',
    navPath: '/customer/farming-orders',
    subtitle: 'Ready for new order streams.',
  },
  {
    key: 'rental',
    label: 'CAR RENTAL',
    sublabel: 'Car Rental',
    icon: Car,
    color: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.5)',
    img: '/cards/carrental.png',
    navPath: '/customer/rentals',
    subtitle: 'Manage your car rentals',
  },
  {
    key: 'prescription',
    label: 'PHARMACY',
    sublabel: 'Pharmacy',
    icon: Pill,
    color: '#60a5fa',
    glowColor: 'rgba(96,165,250,0.5)',
    img: '/cards/pharmacy.png',
    navPath: '/customer/prescriptions',
    subtitle: 'Your prescription orders',
  },
  {
    key: 'tenders',
    label: 'TENDERS',
    sublabel: 'Bids',
    icon: Gavel,
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.5)',
    img: '/cards/tenders.png',
    navPath: null,
    subtitle: 'Manage your bids',
  },
  {
    key: 'all',
    label: 'ALL ORDERS',
    sublabel: 'All Orders',
    icon: List,
    color: '#94a3b8',
    glowColor: 'rgba(148,163,184,0.4)',
    img: '/cards/allorders.png',
    navPath: null,
    subtitle: 'View everything at once',
  },
];

export default function CustomerAllOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('farming');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = [];

      const printingP = apiClient.get('/printing/customer/orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data?.orders || []).forEach(o => results.push({
              id: `prt-${o.id}`, type: 'printing', typeLabel: 'PRINTING',
              orderNumber: o.order_number, date: o.created_at, status: o.status_name || o.status_code,
              amount: o.total_price, description: `${o.product_type || ''} ${o.quantity ? `(${o.quantity} copies)` : ''}`,
              navPath: '/customer/printing-orders', color: '#a855f7',
            }));
          }
        }).catch(() => {});

      const farmingP = apiClient.get('/farming/orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `farm-${o.id}`, type: 'farming', typeLabel: 'AGRIRENT',
              orderNumber: o.invoice_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: `${o.delivery_type || ''} ${o.items?.length ? `(${o.items.length} items)` : ''}`,
              navPath: '/customer/farming-orders', color: '#22c55e',
            }));
          }
        }).catch(() => {});

      const retailP = apiClient.get('/retail/orders/my-orders')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `ret-${o.id}`, type: 'retail', typeLabel: 'RETAIL',
              orderNumber: o.invoice_number, date: o.created_at, status: o.status,
              amount: o.total_amount, description: o.items?.map(i => i.product_name).join(', ')?.slice(0, 80) || '',
              navPath: '/customer/retail-orders', color: '#f59e0b',
            }));
          }
        }).catch(() => {});

      const rentalP = carService.getMyRentalOrders()
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `rent-${o.id}`, type: 'rental', typeLabel: 'CAR RENTAL',
              orderNumber: o.orderNumber, date: o.createdAt || o.created_at, status: o.status,
              amount: o.totalAmount, description: `${o.carName || ''} ${o.driverName ? `(${o.driverName})` : ''}`,
              navPath: '/customer/rentals', color: '#38bdf8',
            }));
          }
        }).catch(() => {});

      const prescriptionP = apiClient.get('/pharmacy/requests/my-requests')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `rx-${o.id}`, type: 'prescription', typeLabel: 'PHARMACY',
              orderNumber: o.prescription_number || `RX-${o.id}`, date: o.created_at, status: o.status,
              amount: null, description: `${o.medications?.length || 0} medications`,
              navPath: '/customer/prescriptions', color: '#60a5fa',
            }));
          }
        }).catch(() => {});

      const tenderP = apiClient.get('/tenders/my-bids')
        .then(r => {
          if (r.status === 'success') {
            (r.data || []).forEach(o => results.push({
              id: `bid-${o.id}`, type: 'tenders', typeLabel: 'TENDER BID',
              orderNumber: `BID-${o.id}`, date: o.created_at, status: o.status,
              amount: o.bid_amount, description: o.tender_title || 'Tender Bid',
              navPath: null, color: '#ef4444',
            }));
          }
        }).catch(() => {});

      await Promise.all([printingP, farmingP, retailP, rentalP, prescriptionP, tenderP]);
      results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setOrders(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Auto-scroll infinite carousel
  useEffect(() => {
    if (isHovered || isPaused || loading) return;

    const interval = setInterval(() => {
      setActiveTab(prev => {
        const idx = ORDER_TYPES.findIndex(t => t.key === prev);
        return ORDER_TYPES[(idx + 1) % ORDER_TYPES.length].key;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, isPaused, loading]);

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? orders : orders.filter(o => o.type === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = orders.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.typeLabel || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        String(o.amount || '').includes(q)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const statusBadge = (status) => {
    if (!status) return { label: 'Unknown', bg: '#1e293b', color: '#94a3b8' };
    const s = status.toUpperCase().replace(/\s+/g, '_');
    if (['COMPLETED', 'DELIVERED', 'PAID'].some(x => s.includes(x))) return { label: status, bg: '#052e16', color: '#4ade80' };
    if (['CANCELLED', 'REJECTED'].some(x => s.includes(x))) return { label: status, bg: '#450a0a', color: '#f87171' };
    if (['PROCESSING', 'PENDING', 'SHIPPED', 'APPROVED'].some(x => s.includes(x))) return { label: status, bg: '#451a03', color: '#fbbf24' };
    return { label: status, bg: '#1e293b', color: '#94a3b8' };
  };

  const handleRotate = (direction) => {
    const currentIndex = ORDER_TYPES.findIndex(t => t.key === activeTab);
    const nextIndex = (currentIndex + direction + ORDER_TYPES.length) % ORDER_TYPES.length;
    setActiveTab(ORDER_TYPES[nextIndex].key);
  };

  const activeType = ORDER_TYPES.find(t => t.key === activeTab) || ORDER_TYPES[2];
  const activeCount = activeTab === 'all' ? orders.length : orders.filter(o => o.type === activeTab).length;

  return (
    <div style={{
      width: 'calc(100% + 64px)',
      margin: '-32px',
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
    }}>

      {/* ── PREMIUM 3D HUB HEADER ── */}
      <div style={{
        background: '#C9CCD1',
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: 20,
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)'
      }}>
        {/* Top Bar - 3-column premium layout */}
        <div style={{ 
          background: 'linear-gradient(135deg, #b8bcc4 0%, #d4d7dc 40%, #c9ccd1 60%, #b8bcc4 100%)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '14px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
          gap: 16,
        }}>
          {/* LEFT: Gold title */}
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#92400e', letterSpacing: '0.06em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(255,255,255,0.9), 0 0 12px rgba(251,191,36,0.3)' }}>
              {activeType.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600, letterSpacing: '0.03em' }}>
              <span style={{ color: '#d97706', fontWeight: 800 }}>{activeCount}</span> {activeCount === 1 ? 'order' : 'orders'} · {activeType.subtitle}
            </div>
          </div>

          {/* CENTER: Hero Search Bar */}
          <div style={{ position: 'relative' }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -3,
              borderRadius: 32,
              background: search
                ? 'linear-gradient(135deg, #f59e0b, #d97706, #f59e0b)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(200,205,210,0.6), rgba(255,255,255,0.8))',
              filter: 'blur(4px)',
              opacity: search ? 0.7 : 0.5,
              transition: 'all 0.3s ease',
            }} />
            <div style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%)',
              border: search ? '1.5px solid #f59e0b' : '1.5px solid rgba(255,255,255,0.9)',
              borderRadius: 28,
              padding: '10px 18px',
              width: 340,
              boxShadow: search
                ? '0 0 0 3px rgba(245,158,11,0.15), 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,1)'
                : '0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: search ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#e2e8f0,#cbd5e1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.3s',
                boxShadow: search ? '0 2px 8px rgba(245,158,11,0.4)' : 'none',
              }}>
                <Search size={14} color={search ? '#fff' : '#64748b'} />
              </div>
              <input
                placeholder="Search by order, status, type, amount…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#0f172a', fontSize: 13, width: '100%', fontWeight: 500,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', border: '1px solid #cbd5e1', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 11, flexShrink: 0, padding: 0 }}
                >✕</button>
              )}
            </div>
            {/* Search result count hint */}
            {search && (
              <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#92400e', fontWeight: 700 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {/* RIGHT: Pause + label */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isPaused ? 'Paused' : 'Auto-rotating'}</div>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', marginTop: 3 }}>
                {ORDER_TYPES.map((t, i) => (
                  <div key={t.key} style={{ width: i === ORDER_TYPES.findIndex(x => x.key === activeTab) ? 16 : 6, height: 4, borderRadius: 2, background: i === ORDER_TYPES.findIndex(x => x.key === activeTab) ? t.color : '#94a3b8', transition: 'all 0.4s' }} />
                ))}
              </div>
            </div>
            {/* Pause / Resume button */}
            <button
              onClick={() => setIsPaused(p => !p)}
              title={isPaused ? 'Resume auto-rotate' : 'Pause auto-rotate'}
              style={{ background: isPaused ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(226,232,240,0.9))', border: isPaused ? '1.5px solid #d97706' : '1.5px solid rgba(255,255,255,0.8)', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, boxShadow: isPaused ? '0 4px 12px rgba(245,158,11,0.4)' : '0 4px 12px rgba(0,0,0,0.12)', flexShrink: 0, transition: 'all 0.3s' }}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>

        {/* ── 3D CIRCULAR CAROUSEL ── */}
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 320, perspective: 1200 }}
        >
          {/* Left Arrow */}
          <button 
            onClick={() => handleRotate(-1)}
            style={{ position: 'absolute', left: 24, zIndex: 50, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', border: '1px solid #cbd5e1', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <ChevronLeft size={24} color="#334155" />
          </button>
          
          {/* Right Arrow */}
          <button 
            onClick={() => handleRotate(1)}
            style={{ position: 'absolute', right: 24, zIndex: 50, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', border: '1px solid #cbd5e1', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <ChevronRight size={24} color="#334155" />
          </button>

          {ORDER_TYPES.map((tab, idx) => {
            const count = tab.key === 'all' ? orders.length : orders.filter(o => o.type === tab.key).length;
            const isActive = tab.key === activeTab;
            const IconCmp = tab.icon;

            // Infinite Circular Wrap Math
            const N = ORDER_TYPES.length;
            const centerIdx = ORDER_TYPES.findIndex(t => t.key === activeTab);
            let offset = idx - centerIdx;
            
            // Wrap the offset (shortest path)
            if (offset > Math.floor(N / 2)) offset -= N;
            else if (offset < -Math.floor(N / 2)) offset += N;
            
            // Concave 3D Math matching the picture
            // Negative rotateY for left cards brings their left edge forward (concave)
            const rotateY = offset * -18; 
            const translateZ = isActive ? 120 : Math.abs(offset) * -120;
            const translateX = offset * 220; // Wide gap for wide cards
            const scale = isActive ? 1.25 : 0.85;

            // Hide the cards jumping across the back
            const isBackCard = Math.abs(offset) >= Math.floor(N / 2);

            return (
              <div
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                }}
                style={{
                  position: 'absolute',
                  width: 250, // Much wider, like the picture
                  height: 140,
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  opacity: isBackCard ? 0 : 1,
                  pointerEvents: isBackCard ? 'none' : 'auto',
                  border: isActive ? `2px solid ${tab.color}` : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isActive
                    ? `0 0 40px ${tab.glowColor}, 0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.2)`
                    : '0 10px 30px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.05)',
                  zIndex: isActive ? 20 : 10 - Math.abs(offset),
                }}
              >
                {/* Background image */}
                {tab.img ? (
                  <img
                    src={tab.img}
                    alt={tab.label}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isActive ? 0.95 : 0.65, transition: 'opacity 0.4s' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
                )}

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isActive
                    ? `linear-gradient(to top, ${tab.key === 'farming' ? 'rgba(0,40,0,0.9)' : 'rgba(0,0,0,0.85)'} 0%, rgba(0,0,0,0.1) 60%)`
                    : 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 100%)',
                  transition: 'background 0.6s',
                }} />

                {/* Active glow ring at top */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: `linear-gradient(90deg, transparent, ${tab.color}, transparent)`,
                    boxShadow: `0 0 10px ${tab.color}`
                  }} />
                )}

                {/* Card content */}
                <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isActive ? '16px' : '12px' }}>
                  {/* Top label */}
                  <div>
                    <div style={{ fontSize: isActive ? 15 : 13, fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{tab.label}</div>
                    <div style={{ fontSize: isActive ? 12 : 11, color: isActive ? tab.color : '#94a3b8', fontWeight: 600, marginTop: 2 }}>({count} Orders)</div>
                  </div>

                  {/* Center icon — only show on non-image or small cards */}
                  {!tab.img && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <IconCmp size={isActive ? 54 : 40} color={isActive ? tab.color : '#94a3b8'} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 12px ${tab.color})` }} />
                    </div>
                  )}

                  {/* Bottom label */}
                  <div style={{
                    fontSize: isActive ? 13 : 11,
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                  }}>
                    {tab.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ORDERS LIST ── */}
      <div style={{ padding: '28px 32px', background: '#ffffff' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: 13 }}>Loading orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
            <ShoppingCart size={52} style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#475569', fontWeight: 700 }}>No orders found</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>{search ? 'Try a different search term.' : 'Place your first order to get started.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(order => {
              const badge = statusBadge(order.status);
              const orderType = ORDER_TYPES.find(t => t.key === order.type) || ORDER_TYPES[0];
              const OrderIcon = orderType.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(order.navPath)}
                  style={{
                    background: '#C9CCD1',
                    borderRadius: 14,
                    padding: '20px 22px',
                    border: '1px solid #94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)`;
                    e.currentTarget.style.borderColor = order.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                >
                  {/* Row 1: Icon + Order number + Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: `${order.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <OrderIcon size={22} color={order.color} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{order.orderNumber || `#${order.id}`}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700,
                      background: badge.bg, color: badge.color,
                      textTransform: 'uppercase', letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                    }}>
                      {badge.label.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Row 2: Description */}
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.description || `${order.typeLabel} order`}
                  </div>

                  {/* Row 3: Type + Amount + Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: order.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{order.typeLabel}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {order.amount && (
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                          {Number(order.amount).toLocaleString()} ETB
                        </span>
                      )}
                      <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
