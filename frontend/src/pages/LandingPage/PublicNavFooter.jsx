import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Printer, Pill, Car, Wheat, Store, Video, Users, PartyPopper, User,
  Package, FileText, ShoppingCart, Menu, X, ChevronDown, LogIn, Home, Truck, Building2, Award, ArrowRight
} from 'lucide-react';
import SearchDropdown from '../../components/SearchDropdown';
import { useAuth } from '../../hooks/useAuth';
import './PublicLayout.css';

/* ─── Role → home dashboard map (mirrors PublicRoute) ───────────── */
const ROLE_HOME = {
  'Admin': '/admin',
  'CEO': '/ceo',
  'Board Member': '/board',
  'Finance Manager': '/finance',
  'Finance': '/finance',
  'Purchase': '/purchase',
  'Market Team': '/purchase',
  'Pharmacy Store Keeper': '/pharmacy-store',
  'General Store Keeper': '/general-store',
  'Printing Supervisor': '/printing-manager',
  'Printing Manager': '/printing-manager',
  'Pharmacy Manager': '/pharmacy',
  'Pharmacy Worker': '/pharmacy-worker',
  'Sales/Cashier': '/pharmacy-worker',
  'Car Renting Manager': '/car-renting',
  'Sales Manager': '/sales/overview',
  'HR Manager': '/hr',
  'Employee': '/employee',
  'Customer': '/customer'
};
const ROLE_PRIORITY = [
  'Admin', 'CEO', 'Board Member', 'Finance', 'Finance Manager', 'Purchase', 'Pharmacy Store Keeper',
  'General Store Keeper', 'Printing Supervisor', 'Printing Manager', 'Market Team', 'Pharmacy Manager', 'Pharmacy Worker',
  'Sales/Cashier', 'Car Renting Manager', 'Sales Manager', 'HR Manager', 'Employee', 'Customer'
];

const homeFor = (u) => {
  const roles = (u?.roles || []).map(r => String(r).toLowerCase());
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r.toLowerCase()) && ROLE_HOME[r]) return ROLE_HOME[r];
  }
  return '/';
};

const tokenIsValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

import imgPrinting   from '../../assets/drop_down/printing_dropdown.jpg';
import imgPharmacy   from '../../assets/drop_down/pharmacy_dropdown.jpg';
import imgCarRental  from '../../assets/drop_down/carRental_dropdown.jpg';
import imgAgriRental from '../../assets/drop_down/agrirental_dropdown.jpg';
import imgRetail     from '../../assets/drop_down/retailStore_dropdown.jpg';

/* ─── Services Mega-Dropdown ────────────────────────────────────── */
const SERVICES = [
  { label: 'Commercial Printing', path: '/services/printing',  img: imgPrinting   },
  { label: 'Pharmacy & Health',   path: '/services/pharmacy',  img: imgPharmacy   },
  { label: 'Car Rental',          path: '/fleet-gallery',      img: imgCarRental  },
  { label: 'AgriRent',            path: '/services/farming',   img: imgAgriRental },
  { label: 'Retail Store',        path: '/services/retail',    img: imgRetail     },
];

const ServicesMegaDropdown = ({ isOpen, onOpen, onClose, isActive, onClose: closeAll }) => {
  const navigate = useNavigate();
  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span className={`pub-link-modern${isActive ? ' active' : ''}`} role="button" tabIndex={0}>
        Services
        <ChevronDown size={13} className={`pub-chevron${isOpen ? ' pub-chevron--open' : ''}`} />
      </span>

      {isOpen && (
        <div className="svc-mega-panel">
          {/* Top row: 3 cards */}
          <div className="svc-mega-row svc-mega-row--3">
            {SERVICES.slice(0, 3).map(svc => (
              <Link key={svc.path} to={svc.path} className="svc-card" onClick={closeAll}>
                <div className="svc-card-img-wrap">
                  <img src={svc.img} alt={svc.label} className="svc-card-img" />
                  <div className="svc-card-top-label">{svc.label}</div>
                  <div className="svc-card-overlay" />
                </div>
                <div className="svc-card-footer">
                  <span className="svc-card-name">{svc.label}</span>
                </div>
              </Link>
            ))}
          </div>
          {/* Bottom row: 2 cards */}
          <div className="svc-mega-row svc-mega-row--2">
            {SERVICES.slice(3).map(svc => (
              <Link key={svc.path} to={svc.path} className="svc-card" onClick={closeAll}>
                <div className="svc-card-img-wrap">
                  <img src={svc.img} alt={svc.label} className="svc-card-img" />
                  <div className="svc-card-top-label">{svc.label}</div>
                  <div className="svc-card-overlay" />
                </div>
                <div className="svc-card-footer">
                  <span className="svc-card-name">{svc.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
/* ─── Marketplace Mega-Dropdown ─────────────────────────────────── */
const MarketplaceDropdown = ({ isOpen, onOpen, onClose, isActive, onClose: closeAll, location }) => {
  const isSellActive = location.pathname === '/tenders/smart-bids' || location.pathname === '/tenders';
  const isBuyActive = location.pathname === '/tenders/buy' || (location.pathname.startsWith('/tenders/') && !location.pathname.startsWith('/tenders/smart-bids') && !location.pathname.startsWith('/tenders/manage'));

  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span className={`pub-link-modern${isActive ? ' active' : ''}`} role="button" tabIndex={0}>
        Marketplace
        <ChevronDown size={13} className={`pub-chevron${isOpen ? ' pub-chevron--open' : ''}`} />
      </span>

      {isOpen && (
        <div className="mkt-mega-panel">
          <Link to="/tenders/smart-bids" className={`mkt-card${isSellActive ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Compete &amp; Sell</span>
            <span className="mkt-card-desc">Participate in open tenders, submit smart bids, and win lucrative contracts for your business.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/tenders/buy" className={`mkt-card${isBuyActive ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Compete &amp; Buy</span>
            <span className="mkt-card-desc">Publish your own tenders, receive competitive bids, and find the best verified suppliers.</span>
          </Link>
        </div>
      )}
    </div>
  );
};


/* ─── Gallery Mega-Dropdown ─────────────────────────────────────── */
const GalleryDropdown = ({ isOpen, onOpen, onClose, isActive, onClose: closeAll, isActiveHash }) => {
  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span className={`pub-link-modern${isActive ? ' active' : ''}`} role="button" tabIndex={0}>
        Gallery
        <ChevronDown size={13} className={`pub-chevron${isOpen ? ' pub-chevron--open' : ''}`} />
      </span>

      {isOpen && (
        <div className="mkt-mega-panel" style={{ width: '380px' }}>
          <Link to="/gallery#section-cars" className={`mkt-card${isActiveHash('/gallery', '#section-cars') ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Cars &amp; Fleet</span>
            <span className="mkt-card-desc">View our premium rental cars and heavy machinery fleet.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/gallery#section-workplace" className={`mkt-card${isActiveHash('/gallery', '#section-workplace') ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Workers &amp; Workplace</span>
            <span className="mkt-card-desc">Take a look at our dedicated team and modern facilities.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/gallery#section-events" className={`mkt-card${isActiveHash('/gallery', '#section-events') ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Events &amp; Activities</span>
            <span className="mkt-card-desc">Explore highlights from our latest company events and campaigns.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/gallery#section-products" className={`mkt-card${isActiveHash('/gallery', '#section-products') ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Products Showcase</span>
            <span className="mkt-card-desc">Browse a showcase of our top commercial and retail products.</span>
          </Link>
        </div>
      )}
    </div>
  );
};

/* ─── News Mega-Dropdown ────────────────────────────────────────── */
const NewsDropdown = ({ isOpen, onOpen, onClose, isActive, onClose: closeAll, location }) => {
  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span className={`pub-link-modern${isActive ? ' active' : ''}`} role="button" tabIndex={0}>
        News
        <ChevronDown size={13} className={`pub-chevron${isOpen ? ' pub-chevron--open' : ''}`} />
      </span>

      {isOpen && (
        <div className="mkt-mega-panel" style={{ width: '380px' }}>
          <Link to="/news" className={`mkt-card${location.pathname === '/news' ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">All Updates</span>
            <span className="mkt-card-desc">Stay informed with the latest company updates, announcements, and press releases.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/news/news" className={`mkt-card${location.pathname === '/news/news' ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Latest News</span>
            <span className="mkt-card-desc">Read our recent blog posts and detailed articles about our services and achievements.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/news/hiring" className={`mkt-card${location.pathname === '/news/hiring' ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Careers &amp; Hiring</span>
            <span className="mkt-card-desc">Explore open positions and join our dedicated team of professionals.</span>
          </Link>
          <div className="mkt-divider" />
          <Link to="/news/video" className={`mkt-card${location.pathname === '/news/video' ? ' mkt-card--active' : ''}`} onClick={closeAll}>
            <span className="mkt-card-title">Video Gallery</span>
            <span className="mkt-card-desc">Watch video highlights, tutorials, and showcases of our top services.</span>
          </Link>
        </div>
      )}
    </div>
  );
};

const NavDropdown = ({ label, isOpen, onOpen, onClose, children, isActive }) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  return (
    <div
      className={`pub-dropdown-wrapper${isOpen ? ' pub-dropdown-wrapper--open' : ''}`}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <span
        className={`pub-link-modern${isActive ? ' active' : ''}`}
        onClick={() => setMobileExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setMobileExpanded(v => !v)}
      >
        {label}
        <ChevronDown size={13} className={`pub-chevron${isOpen || mobileExpanded ? ' pub-chevron--open' : ''}`} />
      </span>
      {/* Desktop dropdown */}
      {isOpen && (
        <div className="pub-dropdown-grid pub-dropdown-desktop">
          {children}
        </div>
      )}
      {/* Mobile accordion */}
      <div className={`pub-mobile-accordion${mobileExpanded ? ' pub-mobile-accordion--open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

/* ─── Main Nav ─────────────────────────────────────────────────── */
export const PublicNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [servicesOpen, setServicesOpen]     = useState(false);
  const [marketOpen, setMarketOpen]         = useState(false);
  const [galleryOpen, setGalleryOpen]       = useState(false);
  const [newsOpen, setNewsOpen]             = useState(false);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [tokenValid, setTokenValid]         = useState(() => tokenIsValid());
  const headerRef = useRef(null);

  // Clear stale/expired auth so the "Dashboard" button never shows at login
  useEffect(() => {
    if (tokenIsValid()) return;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    setTokenValid(false);
  }, []);

  const loggedIn = tokenValid && !!user;
  const homePath = homeFor(user);

  const isActive    = (path)   => location.pathname === path;
  const isActiveAt  = (prefix) => location.pathname.startsWith(prefix);
  const isActiveHash = (path, hash) => location.pathname === path && location.hash === hash;

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.hash]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => {
    setServicesOpen(false); setMarketOpen(false);
    setGalleryOpen(false);  setNewsOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="pub-nav-modern" ref={headerRef}>
      <div className="pub-nav-inner-modern">

        {/* ── Hamburger + Logo (left) ── */}
        <div className="pub-logo-modern" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <button
            className="pub-mobile-toggle pub-mobile-toggle-left"
            onClick={(e) => { e.stopPropagation(); setMobileOpen(v => !v); }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Home size={26} className="brand-icon" style={{ color: '#10b981' }} />
          <span>SUTANA</span>
        </div>



        {/* ── Desktop nav links ── */}
        <nav className="pub-nav-links-desktop">
          <ServicesMegaDropdown
            isOpen={servicesOpen}
            onOpen={() => setServicesOpen(true)}
            onClose={() => setServicesOpen(false)}
            isActive={isActiveAt('/services') || isActiveAt('/fleet-gallery')}
            onClose={closeAll}
          />


          <MarketplaceDropdown
            isOpen={marketOpen}
            onOpen={() => setMarketOpen(true)}
            onClose={() => setMarketOpen(false)}
            isActive={isActiveAt('/tenders') || isActiveAt('/marketplace')}
            onClose={closeAll}
            location={location}
          />

          <GalleryDropdown
            isOpen={galleryOpen}
            onOpen={() => setGalleryOpen(true)}
            onClose={() => setGalleryOpen(false)}
            isActive={isActiveAt('/gallery')}
            onClose={closeAll}
            isActiveHash={isActiveHash}
          />

          <NewsDropdown
            isOpen={newsOpen}
            onOpen={() => setNewsOpen(true)}
            onClose={() => setNewsOpen(false)}
            isActive={isActiveAt('/news')}
            onClose={closeAll}
            location={location}
          />

          <Link to="/track-order" className={`pub-link-modern${isActive('/track-order') ? ' active' : ''}`}>Track Order</Link>
          <Link to="/about"       className={`pub-link-modern${isActive('/about')       ? ' active' : ''}`}>About Us</Link>
        </nav>

        {/* ── Search ── */}
        <div className="pub-nav-search-wrap">
          <SearchDropdown />
        </div>

        {/* ── Right: Auth / User ── */}
        <div className="pub-nav-right-modern">
          <button className="pub-btn-solid-modern" onClick={() => navigate('/login')}>
            <LogIn size={15} style={{ marginRight: 6 }} />
            <span>Login</span>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown panel ── */}
      <div className={`pub-mobile-panel${mobileOpen ? ' pub-mobile-panel--open' : ''}`}>
        <nav className="pub-mobile-nav">
          {/* Services */}
          <MobileGroup label="Services" icon={<Store size={16}/>}>
            <Link to="/services/printing"  onClick={closeAll} className="pub-mobile-link"><Printer size={14}/> Commercial Printing</Link>
            <Link to="/services/pharmacy"  onClick={closeAll} className="pub-mobile-link"><Pill size={14}/> Pharmacy &amp; Health</Link>
            <Link to="/fleet-gallery"      onClick={closeAll} className="pub-mobile-link"><Car size={14}/> Car Rental</Link>
            <Link to="/services/farming"   onClick={closeAll} className="pub-mobile-link"><Wheat size={14}/> AgriRent</Link>
            <Link to="/services/retail"    onClick={closeAll} className="pub-mobile-link"><Store size={14}/> Retail Store</Link>
          </MobileGroup>

          {/* Marketplace */}
          <MobileGroup label="Marketplace" icon={<ShoppingCart size={16}/>}>
            <Link to="/tenders/smart-bids" onClick={closeAll} className={`pub-mobile-link ${(location.pathname === '/tenders/smart-bids' || location.pathname === '/tenders') ? 'active-sublink' : ''}`}><Award size={14}/> Compete &amp; Sell</Link>
            <Link to="/tenders/buy"        onClick={closeAll} className={`pub-mobile-link ${(location.pathname === '/tenders/buy' || (location.pathname.startsWith('/tenders/') && !location.pathname.startsWith('/tenders/smart-bids') && !location.pathname.startsWith('/tenders/manage'))) ? 'active-sublink' : ''}`}><ShoppingCart size={14}/> Compete &amp; Buy</Link>
          </MobileGroup>

          {/* Gallery */}
          <MobileGroup label="Gallery" icon={<Package size={16}/>}>
            <Link to="/gallery#section-cars"      onClick={closeAll} className={`pub-mobile-link${isActiveHash('/gallery', '#section-cars') ? ' active-sublink' : ''}`}><Car size={14}/> Cars &amp; Fleet</Link>
            <Link to="/gallery#section-workplace" onClick={closeAll} className={`pub-mobile-link${isActiveHash('/gallery', '#section-workplace') ? ' active-sublink' : ''}`}><Users size={14}/> Workers &amp; Workplace</Link>
            <Link to="/gallery#section-events"    onClick={closeAll} className={`pub-mobile-link${isActiveHash('/gallery', '#section-events') ? ' active-sublink' : ''}`}><PartyPopper size={14}/> Events &amp; Activities</Link>
            <Link to="/gallery#section-products"  onClick={closeAll} className={`pub-mobile-link${isActiveHash('/gallery', '#section-products') ? ' active-sublink' : ''}`}><Package size={14}/> Products Showcase</Link>
          </MobileGroup>

          {/* News */}
          <MobileGroup label="News" icon={<Video size={16}/>}>
            <Link to="/news"        onClick={closeAll} className="pub-mobile-link">📡 All News</Link>
            <Link to="/news/news"   onClick={closeAll} className="pub-mobile-link">📰 News</Link>
            <Link to="/news/hiring" onClick={closeAll} className="pub-mobile-link">💼 Hiring</Link>
            <Link to="/news/video"  onClick={closeAll} className="pub-mobile-link"><Video size={14}/> Video</Link>
          </MobileGroup>

          <Link to="/track-order" onClick={closeAll} className="pub-mobile-top-link"><Truck size={18} className="pub-mobile-group-icon" /> Track Order</Link>
          <Link to="/about"       onClick={closeAll} className="pub-mobile-top-link"><Building2 size={18} className="pub-mobile-group-icon" /> About Us</Link>
        </nav>
      </div>
    </header>
  );
};

/* ─── Mobile accordion group ───────────────────────────────────── */
const MobileGroup = ({ label, icon, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pub-mobile-group">
      <button className="pub-mobile-group-trigger" onClick={() => setOpen(v => !v)}>
        <span className="pub-mobile-group-icon">{icon}</span>
        <span>{label}</span>
        <ChevronDown size={14} className={`pub-mobile-chevron${open ? ' pub-mobile-chevron--open' : ''}`} />
      </button>
      <div className={`pub-mobile-group-body${open ? ' pub-mobile-group-body--open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// PublicFooter removed — SmartFooter from ModernSections is now global in App.jsx
