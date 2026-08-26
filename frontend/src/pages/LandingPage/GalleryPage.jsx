import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { X, ArrowLeft, Car, Users, PartyPopper, Package, MapPin, Calendar } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import './LandingRedesign.css';
import './GalleryPage.css';

const CATEGORIES = [
  { key: 'cars',      label: 'Cars & Fleet',         icon: <Car size={20} /> },
  { key: 'workplace', label: 'Workers & Workplace',   icon: <Users size={20} /> },
  { key: 'events',    label: 'Events & Activities',   icon: <PartyPopper size={20} /> },
  { key: 'products',  label: 'Products Showcase',     icon: <Package size={20} /> },
];

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const GALLERY = {
  cars:      { icon: '🚗', label: 'Cars & Fleet' },
  workplace: { icon: '👥', label: 'Workers & Workplace' },
  events:    { icon: '🎉', label: 'Events & Activities' },
  products:  { icon: '📦', label: 'Products Showcase' },
};

/* ─── Component ─────────────────────────────────────────────────── */
export default () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [popup,   setPopup]   = useState(null);

  /* Responsive cols still kept for legacy compat (grid now handles it via CSS) */
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 600) setCols(1);
      else if (w < 900) setCols(2);
      else setCols(3);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Hash-based nav from header links */
  useEffect(() => {
    if (location.hash) {
      const cat = location.hash.replace('#section-', '');
      if (['cars', 'workplace', 'events', 'products'].includes(cat)) {
        setFilter(cat);
        setTimeout(() => {
          document.getElementById(location.hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [location.hash, images]);

  /* Fetch images */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/gallery/public');
        if (res.status === 'success') setImages(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  /* Lock body scroll when popup open */
  useEffect(() => {
    document.body.style.overflow = popup ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [popup]);

  /* Escape closes popup */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPopup(null);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Group images by category */
  const grouped = {};
  images.forEach(img => {
    if (filter !== 'all' && img.category !== filter) return;
    if (!grouped[img.category]) grouped[img.category] = [];
    grouped[img.category].push(img);
  });

  return (
    <>
      <PublicNav />

      <div className="gal-page">
        <div className="gal-inner">

          {/* ── Top bar ── */}
          <div className="gal-topbar">
            <button className="gallery-back-btn" onClick={() => navigate(-1)}>
              <div className="back-icon-wrap">
                <ArrowLeft size={16} strokeWidth={2.5} />
              </div>
              <span>Back</span>
            </button>

            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '4px 0' }}>
                <span className="gal-marquee-title">
                  📸 Sutana Gallery &nbsp;·&nbsp; Explore our amazing fleet and memories &nbsp;·&nbsp;
                </span>
              </marquee>
            </div>
          </div>

          {/* ── Filter bar — untouched logic ── */}
          <div className="gallery-filter-bar">
            {[{ key: 'all', label: 'All', icon: null }, ...CATEGORIES].map(c => (
              <button
                key={c.key}
                className={`gallery-filter-btn${filter === c.key ? ' active' : ''}`}
                onClick={() => setFilter(c.key)}
              >
                <div className="btn-icon-wrap">
                  {c.icon ?? <span style={{ fontSize: 20 }}>🖼</span>}
                </div>
                <span className="btn-label">{c.label}</span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="gal-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="gal-skeleton" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="gal-empty">
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🖼️</span>
              No images found in this category.
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <section key={cat} id={`section-${cat}`} style={{ marginBottom: '3rem' }}>
                <h2 className="gal-section-title">
                  <span className="gal-section-icon">{GALLERY[cat]?.icon}</span>
                  {GALLERY[cat]?.label || cat}
                </h2>
                <div className="gal-grid">
                  {items.map(img => (
                    <div
                      key={img.id}
                      className="gal-card"
                      onClick={() => setPopup(img)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setPopup(img)}
                    >
                      <div className="gal-card-img-wrap">
                        {img.image_path ? (
                          <img
                            src={resolveImg(img.image_path)}
                            alt={img.title}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ fontSize: 40, opacity: 0.4 }}>🖼</span>
                        )}
                      </div>
                      <div className="gal-card-body">
                        <h3 className="gal-card-title">{img.title}</h3>
                        {img.description && (
                          <p className="gal-card-desc">{img.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* ── Popup Modal ── */}
      {popup && (
        <div className="gal-overlay" onClick={() => setPopup(null)}>
          <div className="gal-modal" onClick={e => e.stopPropagation()}>
            <div className="gal-modal-img-wrap">
              {popup.image_path && (
                <img
                  src={resolveImg(popup.image_path)}
                  alt={popup.title}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <button className="gal-modal-close" onClick={() => setPopup(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="gal-modal-body">
              <h2 className="gal-modal-title">{popup.title}</h2>
              {popup.description && (
                <p className="gal-modal-desc">{popup.description}</p>
              )}
              <div className="gal-modal-meta">
                {popup.date_taken && (
                  <span><Calendar size={14} /> {new Date(popup.date_taken).toLocaleDateString('en-CA')}</span>
                )}
                {popup.location && (
                  <span><MapPin size={14} /> {popup.location}</span>
                )}
              </div>
              <button className="gal-modal-footer-btn" onClick={() => setPopup(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
