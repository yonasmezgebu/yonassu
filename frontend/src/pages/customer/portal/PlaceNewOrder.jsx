import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customerState } from '../../../utils/customerPortalState';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import {
  Printer, Sprout, Car, Pill, Package, ShoppingCart,
  ArrowRight, Star, Clock, CheckCircle, ChevronRight,
  ArrowLeft, Plus, Minus, MapPin, Truck
} from 'lucide-react';

const SERVICES = [
  {
    id: 'retail',
    label: 'Retail Order',
    tagline: 'Stationery, Electronics & Office Supplies',
    description: 'Browse our in-stock product catalog and place a direct order for immediate fulfillment. Pickup or delivery available.',
    icon: Package,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#d97706',
    path: '/customer/orders/new?service=retail',
    badge: 'Most Popular',
    badgeColor: '#d97706',
    features: ['Same-day pickup', 'Home delivery', 'Online invoice', 'Loyalty points'],
    isInternal: true,
  },
  {
    id: 'printing',
    label: 'Printing Order',
    tagline: 'Books, Modules, Exams, Brochures & Tax Receipts',
    description: 'Submit a professional printing request. Upload your files, choose size, quantity and binding — we handle the rest.',
    icon: Printer,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    path: '/services/printing',
    features: ['Bulk printing', 'Custom binding', 'Fast turnaround', 'Digital proof'],
    isInternal: false,
  },
  {
    id: 'farming',
    label: 'Farming / Agri Order',
    tagline: 'Seeds, Fertilizers, Tools & Pesticides',
    description: 'Order agricultural inputs and equipment. Bulk orders available. Talk to our agronomist for recommendations.',
    icon: Sprout,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#059669',
    path: '/services/farming',
    features: ['Bulk orders', 'Expert advice', 'Rural delivery', 'Seasonal discounts'],
    isInternal: false,
  },
  {
    id: 'car-rental',
    label: 'Car & Agri Rental',
    tagline: 'Vehicles, Tractors, Harvesters & Equipment',
    description: 'Rent a vehicle or agricultural machine for any duration. View live fleet availability and book in advance.',
    icon: Car,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    color: '#6d28d9',
    path: '/fleet-gallery',
    badge: 'Fleet Available',
    badgeColor: '#6d28d9',
    features: ['Cars & equipment', 'Daily / hourly rates', 'Advance booking', 'Live availability'],
    isInternal: false,
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy Order',
    tagline: 'Medicines, Prescriptions & Health Products',
    description: 'Order medications and health products. Upload your prescription for prescription-only items.',
    icon: Pill,
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    color: '#be185d',
    path: '/services/pharmacy',
    features: ['OTC products', 'Prescription upload', 'Home delivery', 'Private & confidential'],
    isInternal: false,
  },
];

const ServiceCard = ({ service, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(service)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `2px solid ${hovered ? service.color : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 12px 40px ${service.color}25` : '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        background: service.gradient,
        padding: '28px 24px 24px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          backgroundColor: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <Icon size={28} color="white" strokeWidth={2} />
        </div>
        {service.badge && (
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            color: service.badgeColor,
            fontSize: '11px', fontWeight: '700',
            padding: '4px 10px', borderRadius: '20px',
            letterSpacing: '0.03em',
          }}>
            {service.badge}
          </span>
        )}
      </div>

      <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
          {service.label}
        </div>
        <div style={{ fontSize: '13px', color: service.color, fontWeight: '600', marginBottom: '12px' }}>
          {service.tagline}
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 16px 0', flex: 1 }}>
          {service.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {service.features.map(f => (
            <span key={f} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              backgroundColor: service.bg, border: `1px solid ${service.border}`,
              color: service.color, fontSize: '11px', fontWeight: '600',
              padding: '4px 10px', borderRadius: '20px',
            }}>
              <CheckCircle size={10} /> {f}
            </span>
          ))}
        </div>

        <button style={{
          width: '100%', padding: '12px',
          background: hovered ? service.gradient : service.bg,
          border: `1px solid ${service.border}`,
          borderRadius: '10px', cursor: 'pointer',
          color: hovered ? 'white' : service.color,
          fontWeight: '700', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s',
        }}>
          {service.isInternal ? 'Browse & Order' : 'Go to Service'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const RetailCheckout = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState({});
  const [deliveryOpt, setDeliveryOpt] = useState('pickup');
  const [addressId, setAddressId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setCatalog(customerState.getCatalog());
    const addrs = customerState.getAddresses();
    setAddresses(addrs);
    if (addrs.length > 0) setAddressId(addrs.find(a => a.is_default)?.id || addrs[0].id);
    customerState.notify('PAGE_LOAD');
  }, []);

  const cartItems = Object.values(cart);
  const totalCents = cartItems.reduce((acc, item) => acc + (item.product.unit_price_cents * item.qty), 0);

  const addQty = (product) => {
    setCart(prev => {
      const current = prev[product.id]?.qty || 0;
      if (!product.in_stock) return prev; // simple guard
      return { ...prev, [product.id]: { product, qty: current + 1 } };
    });
  };

  const removeQty = (product) => {
    setCart(prev => {
      const current = prev[product.id]?.qty || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { product, qty: current - 1 } };
    });
  };

  const handleCheckout = () => {
    setError('');
    try {
      const items = cartItems.map(i => ({ product_id: i.product.id, qty: i.qty }));
      const order = customerState.placeOrder(items, deliveryOpt, addressId);
      customerState.notify('ORDER_PLACED');
      navigate('/customer/orders/history');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <button onClick={() => navigate('/customer/orders/new')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontWeight: '500' }}>
        <ArrowLeft size={16} /> Back to Services
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Retail Order</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Browse available items and checkout immediately.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Catalog */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {catalog.map(p => (
            <div key={p.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '8px' }}>{p.category}</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px', flex: 1 }}>{p.name}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                <CurrencyDisplay amountCents={p.unit_price_cents} />
              </div>
              
              {!p.in_stock ? (
                <div style={{ padding: '10px', backgroundColor: '#f1f5f9', color: '#94a3b8', textAlign: 'center', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>Out of Stock</div>
              ) : cart[p.id] ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => removeQty(p)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}><Minus size={16} /></button>
                  <span style={{ fontWeight: '600', color: '#1d4ed8' }}>{cart[p.id].qty}</span>
                  <button onClick={() => addQty(p)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}><Plus size={16} /></button>
                </div>
              ) : (
                <button onClick={() => addQty(p)} style={{ width: '100%', padding: '10px', backgroundColor: 'white', border: '2px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Checkout Sidebar */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'sticky', top: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }}>Your Cart</h2>
          
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <ShoppingCart size={32} style={{ marginBottom: '12px' }} />
              <div>Cart is empty</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                {cartItems.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.product.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{item.qty} × <CurrencyDisplay amountCents={item.product.unit_price_cents} /></div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      <CurrencyDisplay amountCents={item.qty * item.product.unit_price_cents} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Fulfillment Method</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: `2px solid ${deliveryOpt === 'pickup' ? '#10b981' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: deliveryOpt === 'pickup' ? '#ecfdf5' : 'white' }}>
                    <input type="radio" name="dopt" value="pickup" checked={deliveryOpt === 'pickup'} onChange={() => setDeliveryOpt('pickup')} style={{ display: 'none' }} />
                    <MapPin size={16} color={deliveryOpt === 'pickup' ? '#10b981' : '#64748b'} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: deliveryOpt === 'pickup' ? '#059669' : '#475569' }}>Pickup</span>
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: `2px solid ${deliveryOpt === 'delivery' ? '#10b981' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: deliveryOpt === 'delivery' ? '#ecfdf5' : 'white' }}>
                    <input type="radio" name="dopt" value="delivery" checked={deliveryOpt === 'delivery'} onChange={() => setDeliveryOpt('delivery')} style={{ display: 'none' }} />
                    <Truck size={16} color={deliveryOpt === 'delivery' ? '#10b981' : '#64748b'} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: deliveryOpt === 'delivery' ? '#059669' : '#475569' }}>Delivery</span>
                  </label>
                </div>
              </div>

              {deliveryOpt === 'delivery' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Select Address</label>
                  <select value={addressId} onChange={e => setAddressId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}>
                    {addresses.map(a => (
                      <option key={a.id} value={a.id}>{a.label} - {a.address_line}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '16px', borderTop: '2px dashed #e2e8f0' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}><CurrencyDisplay amountCents={totalCents} /></span>
              </div>

              {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

              <button onClick={handleCheckout} style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Confirm Order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PlaceNewOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  // IF url is ?service=retail, SHOW RETAIL CART INSTEAD OF BROWSER
  if (searchParams.get('service') === 'retail') {
    return <RetailCheckout />;
  }

  const filtered = SERVICES.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.tagline.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (service) => {
    navigate(service.path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8fafc 0%, #eff6ff 50%, #f0fdf4 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '48px 32px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <ShoppingCart size={14} color="#94a3b8" />
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>SUTANA Services</span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '800', color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            What would you like to order?
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 32px', lineHeight: 1.6 }}>
            Browse all SUTANA services in one place — from retail to rentals to professional printing.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
            <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search services…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 48px',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(255,255,255,0.08)', color: 'white',
                fontSize: '15px', boxSizing: 'border-box',
                outline: 'none', backdropFilter: 'blur(10px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats ribbon */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '40px', justifyContent: 'center' }}>
          {[
            { icon: <Star size={16} color="#f59e0b" />, label: '5 Service Categories' },
            { icon: <Clock size={16} color="#3b82f6" />, label: 'Order in minutes' },
            { icon: <CheckCircle size={16} color="#10b981" />, label: 'Real-time tracking' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ padding: '40px 32px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <Package size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px' }}>No services match your search.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {filtered.length} {filtered.length === 1 ? 'service' : 'services'} available
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {filtered.map(service => (
                <ServiceCard key={service.id} service={service} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaceNewOrder;
