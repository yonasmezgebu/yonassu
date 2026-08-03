import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { X, ArrowLeft, Car, Users, PartyPopper, Package, MapPin, Calendar } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

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

/* ─── Styles ─────────────────────────────────────────────────────── */
const STYLES = `
  /* ── Keyframes ── */
  @keyframes galleryTitleShimmer {
    0%   { background-position: 0% 50%; }
    100% { background-position: 300% 50%; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position: 200% 0; }
  }

  /* ── Page wrapper ── */
  .gal-page {
    min-height: 100vh;
    background: #F5F5F5;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* ── Inner layout ── */
  .gal-inner {
    width: 100%;
    padding: 0 24px 56px;
    box-sizing: border-box;
  }

  /* ── Top bar (back + marquee) ── */
  .gal-topbar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 0 18px;
  }

  /* ── Back button — UNTOUCHED ── */
  marquee { scrollbar-width: none; -ms-overflow-style: none; }
  marquee::-webkit-scrollbar { display: none; }

  .gallery-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 11px 24px 11px 10px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%);
    color: #fff;
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    position: relative;
    transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.4),
      0 4px 0 #145214,
      0 5px 0 #0d3d0d,
      0 6px 0 #092909,
      0 8px 24px rgba(27,94,32,0.4),
      0 0 40px rgba(46,125,50,0.2);
    transform: translateY(0);
    text-shadow: 0 1px 4px rgba(0,0,0,0.35);
    flex-shrink: 0;
  }
  .gallery-back-btn:hover {
    transform: translateY(-3px) scale(1.05);
    background: linear-gradient(135deg, #2E7D32 0%, #43A047 50%, #66BB6A 100%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.5),
      0 7px 0 #2E7D32,
      0 8px 0 #256025,
      0 9px 0 #1B5020,
      0 14px 30px rgba(46,125,50,0.5),
      0 0 50px rgba(102,187,106,0.3);
  }
  .gallery-back-btn:active {
    transform: translateY(4px);
    box-shadow:
      inset 0 3px 8px rgba(0,0,0,0.2),
      0 2px 0 #145214,
      0 4px 14px rgba(27,94,32,0.3);
  }
  .gallery-back-btn .back-icon-wrap {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.2);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.4);
    transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .gallery-back-btn:hover .back-icon-wrap {
    background: rgba(255,255,255,0.35);
    transform: scale(1.15) translateX(-3px);
    box-shadow: 0 0 14px rgba(102,187,106,0.6);
  }

  /* ── Filter bar — UNTOUCHED ── */
  .gallery-filter-bar {
    display: flex;
    width: 100%;
    margin-bottom: 28px;
    border-radius: 0;
    overflow: visible;
    gap: 0;
    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15));
  }
  .gallery-filter-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 10px 12px;
    border: none;
    border-right: 2px solid rgba(255,255,255,0.1);
    background: linear-gradient(180deg, #1B5E20 0%, #2E7D32 40%, #388E3C 100%);
    color: #bfdbfe;
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 0.05em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease, background 0.2s;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.15),
      inset 0 -2px 0 rgba(0,0,0,0.2),
      0 7px 0 #145214,
      0 8px 0 #0d3d0d,
      0 9px 0 #092909,
      0 13px 22px rgba(27,94,32,0.2);
    transform: translateY(0);
    user-select: none;
    text-transform: uppercase;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  }
  .gallery-filter-btn:last-child { border-right: none; }
  .gallery-filter-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -120%; width: 55%; height: 100%;
    background: linear-gradient(110deg, transparent, rgba(255,255,255,0.18), transparent);
    transition: left 0.45s ease;
    pointer-events: none;
    z-index: 1;
  }
  .gallery-filter-btn:hover::before { left: 160%; }
  .gallery-filter-btn::after {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 70%; height: 4px;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
    border-radius: 0 0 6px 6px;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 0 12px rgba(245,158,11,0.8);
  }
  .gallery-filter-btn:hover {
    background: linear-gradient(180deg, #2E7D32 0%, #388E3C 40%, #43A047 100%);
    color: #e8f5e9;
    transform: translateY(-5px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.2),
      inset 0 -2px 0 rgba(0,0,0,0.15),
      0 12px 0 #145214,
      0 13px 0 #0d3d0d,
      0 14px 0 #092909,
      0 20px 32px rgba(27,94,32,0.4);
  }
  .gallery-filter-btn:active {
    transform: translateY(5px);
    box-shadow:
      inset 0 3px 8px rgba(0,0,0,0.3),
      0 2px 0 #145214,
      0 4px 10px rgba(27,94,32,0.2);
  }
  .gallery-filter-btn.active {
    background: linear-gradient(180deg, #fefce8 0%, #f59e0b 40%, #d97706 100%);
    color: #1c1917;
    transform: translateY(5px);
    text-shadow: 0 1px 2px rgba(255,255,255,0.3);
    box-shadow:
      inset 0 3px 10px rgba(120,70,0,0.2),
      inset 0 1px 0 rgba(255,255,255,0.6),
      0 3px 0 #b45309,
      0 4px 0 #92400e,
      0 5px 0 #78350f,
      0 9px 20px rgba(245,158,11,0.4);
  }
  .gallery-filter-btn.active::after {
    transform: translateX(-50%) scaleX(1);
    background: linear-gradient(90deg, #228B22, #4CAF50);
    box-shadow: 0 0 12px rgba(34,139,34,0.8);
  }
  .gallery-filter-btn.active::before { content: none; }
  .gallery-filter-btn.active:hover {
    transform: translateY(2px);
    box-shadow:
      inset 0 2px 8px rgba(120,70,0,0.15),
      0 6px 0 #b45309,
      0 7px 0 #92400e,
      0 10px 24px rgba(245,158,11,0.35);
  }
  .gallery-filter-btn.active:active {
    transform: translateY(8px);
    box-shadow:
      inset 0 4px 10px rgba(120,70,0,0.25),
      0 1px 0 #b45309;
  }
  .gallery-filter-btn .btn-icon-wrap {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.1);
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.15);
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    flex-shrink: 0;
    font-size: 20px;
  }
  .gallery-filter-btn:hover .btn-icon-wrap {
    background: rgba(255,255,255,0.18);
    transform: scale(1.18) rotate(-5deg);
    box-shadow: 0 0 18px rgba(46,139,87,0.5);
  }
  .gallery-filter-btn.active .btn-icon-wrap {
    background: rgba(255,255,255,0.35);
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.1), 0 0 16px rgba(245,158,11,0.7);
  }
  .gallery-filter-btn.active:hover .btn-icon-wrap {
    transform: scale(1.18) rotate(5deg);
  }
  .btn-label { line-height: 1; position: relative; z-index: 2; }

  /* ── Section heading ── */
  .gal-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 800;
    color: #1B5E20;
    margin: 0 0 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #A5D6A7;
  }
  .gal-section-icon { font-size: 22px; }

  /* ── Image grid ── */
  .gal-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .gal-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 580px) { .gal-grid { grid-template-columns: 1fr; } }

  /* ── Image card ── */
  .gal-card {
    background: #FFFFFF;
    border-radius: 12px;
    border: 1px solid #8D6E63;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    animation: fadeInUp 0.3s ease both;
  }
  .gal-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }
  .gal-card-img-wrap {
    width: 100%;
    height: 220px;
    background: #1B5E20;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gal-card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.15s ease;
    display: block;
  }
  .gal-card:hover .gal-card-img-wrap img {
    transform: scale(1.03);
  }
  .gal-card-body {
    padding: 12px 14px 14px;
  }
  .gal-card-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: #424242;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gal-card-desc {
    margin: 0;
    font-size: 12px;
    color: #6B8E23;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Empty / loading ── */
  .gal-empty {
    text-align: center;
    padding: 56px 0;
    color: #8D6E63;
    font-size: 15px;
    font-weight: 500;
  }

  /* ── Skeleton shimmer ── */
  .gal-skeleton {
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 12px;
    height: 260px;
    border: 1px solid #8D6E63;
  }

  /* ── Popup modal ── */
  .gal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
  }
  .gal-modal {
    background: #FFFFFF;
    border-radius: 14px;
    max-width: 720px;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
    animation: fadeInUp 0.2s ease;
  }
  .gal-modal-img-wrap {
    position: relative;
    background: #1B5E20;
  }
  .gal-modal-img-wrap img {
    width: 100%;
    max-height: 460px;
    object-fit: contain;
    display: block;
  }
  .gal-modal-close {
    position: absolute;
    top: 10px; right: 10px;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s ease;
  }
  .gal-modal-close:hover { background: rgba(0,0,0,0.85); }
  .gal-modal-body { padding: 20px 24px 24px; }
  .gal-modal-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 800;
    color: #424242;
  }
  .gal-modal-desc {
    margin: 0 0 12px;
    font-size: 14px;
    color: #424242;
    line-height: 1.65;
  }
  .gal-modal-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
    color: #8D6E63;
    margin-bottom: 16px;
  }
  .gal-modal-meta span {
    display: flex; align-items: center; gap: 4px;
  }
  .gal-modal-footer-btn {
    width: 100%;
    padding: 10px;
    background: #6B8E23;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .gal-modal-footer-btn:hover {
    background: #556B2F;
    transform: translateY(-1px);
  }

  /* ── Marquee title ── */
  .gal-marquee-title {
    font-size: clamp(18px, 3vw, 26px);
    font-weight: 900;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, #1B5E20, #228B22, #4CAF50, #A5D6A7, #228B22, #1B5E20);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: galleryTitleShimmer 5s linear infinite;
    padding-right: 60px;
    white-space: nowrap;
  }

  /* ── Responsive filter bar ── */
  @media (max-width: 700px) {
    .gallery-filter-btn { padding: 16px 4px 12px; font-size: 10px; gap: 5px; letter-spacing: 0; }
    .gallery-filter-btn .btn-icon-wrap { width: 30px; height: 30px; }
    .gal-inner { padding: 0 12px 40px; }
  }
  @media (max-width: 480px) {
    .gallery-filter-btn .btn-label { display: none; }
    .gallery-filter-btn { padding: 16px 4px; }
  }
`;

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
      <style>{STYLES}</style>
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
              <section key={cat} id={`section-${cat}`} style={{ marginBottom: 48 }}>
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
