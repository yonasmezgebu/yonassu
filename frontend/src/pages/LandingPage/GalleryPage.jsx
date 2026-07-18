import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { X, ArrowLeft, Car, Users, PartyPopper, Package, MapPin, Calendar } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

const CATEGORIES = [
  { key: 'cars', label: 'Cars & Fleet', icon: <Car size={20} /> },
  { key: 'workplace', label: 'Workers & Workplace', icon: <Users size={20} /> },
  { key: 'events', label: 'Events & Activities', icon: <PartyPopper size={20} /> },
  { key: 'products', label: 'Products Showcase', icon: <Package size={20} /> },
];

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const GALLERY = {
  cars: { icon: '\uD83D\uDE97', label: 'Cars & Fleet' },
  workplace: { icon: '\uD83D\uDC65', label: 'Workers & Workplace' },
  events: { icon: '\uD83C\uDF89', label: 'Events & Activities' },
  products: { icon: '\uD83D\uDCE6', label: 'Products Showcase' },
};

export default () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [popup, setPopup] = useState(null);
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

  // Handle hash-based navigation from header links
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

  useEffect(() => {
    if (popup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [popup]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPopup(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const grouped = {};
  images.forEach(img => {
    if (filter !== 'all' && img.category !== filter) return;
    if (!grouped[img.category]) grouped[img.category] = [];
    grouped[img.category].push(img);
  });

  return (
    <><PublicNav />
    <div className="gallery-page-bg">
    <div style={{ maxWidth: '95vw', margin: '0 auto', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div className="tip-wrap" style={{ flexShrink: 0 }}>
          <button className="gallery-back-btn" onClick={() => navigate(-1)}>
            <div className="back-icon-wrap">
              <ArrowLeft size={16} strokeWidth={2.5} />
            </div>
            <span>Back</span>
          </button>
        </div>

        <div style={{ flexGrow: 1, overflow: 'hidden', paddingLeft: '10px' }}>
          <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '4px 0' }}>
            <span style={{
              fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #b91c1c, #ef4444, #f59e0b, #10b981, #b91c1c)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'galleryTitleShimmer 4s linear infinite',
              paddingRight: 60,
              textShadow: '0 4px 20px rgba(239,68,68,0.25), 0 8px 40px rgba(245,158,11,0.15)',
            }}>
              📸 Sutana Gallery &nbsp;·&nbsp; Explore our amazing fleet and memories &nbsp;·&nbsp;
            </span>
          </marquee>
        </div>
      </div>

      {/* Filter Bar — Premium 3D */}
      <style>{`
        @keyframes galleryTitleShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        marquee {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        marquee::-webkit-scrollbar { display: none; }
        .gallery-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 24px 11px 10px;
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%);
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
            0 4px 0 #1a3070,
            0 5px 0 #152860,
            0 6px 0 #102050,
            0 8px 24px rgba(14,165,233,0.4),
            0 0 40px rgba(37,99,235,0.2);
          transform: translateY(0);
          text-shadow: 0 1px 4px rgba(0,0,0,0.35);
        }
        .gallery-back-btn:hover {
          transform: translateY(-3px) scale(1.05);
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.5),
            0 7px 0 #4f46e5,
            0 8px 0 #4338ca,
            0 9px 0 #3730a3,
            0 14px 30px rgba(99,102,241,0.5),
            0 0 50px rgba(139,92,246,0.3);
        }
        .gallery-back-btn:active {
          transform: translateY(4px);
          box-shadow:
            inset 0 3px 8px rgba(0,0,0,0.2),
            0 2px 0 #1a3070,
            0 4px 14px rgba(14,165,233,0.3);
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
          box-shadow: 0 0 14px rgba(139,92,246,0.6);
        }

        .gallery-filter-bar {
          display: flex;
          width: 100%;
          margin-bottom: 24px;
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
          background: linear-gradient(180deg, #1e3158 0%, #1e3a8a 40%, #1d4ed8 100%);
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
            0 7px 0 #1a316e,
            0 8px 0 #162858,
            0 9px 0 #121f44,
            0 13px 22px rgba(14,165,233,0.2);
          transform: translateY(0);
          user-select: none;
          text-transform: uppercase;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .gallery-filter-btn:last-child { border-right: none; }

        /* Shimmer on hover */
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

        /* Gold active indicator bar at top */
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
          background: linear-gradient(180deg, #312e81 0%, #4f46e5 40%, #6366f1 100%);
          color: #e0e7ff;
          transform: translateY(-5px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset 0 -2px 0 rgba(0,0,0,0.15),
            0 12px 0 #3730a3,
            0 13px 0 #312e81,
            0 14px 0 #27255c,
            0 20px 32px rgba(99,102,241,0.4);
        }
        .gallery-filter-btn:active {
          transform: translateY(5px);
          box-shadow:
            inset 0 3px 8px rgba(0,0,0,0.3),
            0 2px 0 #1a316e,
            0 4px 10px rgba(14,165,233,0.2);
        }

        /* ── ACTIVE STATE (gold/amber pressed) ── */
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
          background: linear-gradient(90deg, #1e3a8a, #0ea5e9);
          box-shadow: 0 0 12px rgba(14,165,233,0.8);
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

        /* Icon bubble */
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
          box-shadow: 0 0 18px rgba(99,102,241,0.6);
        }
        .gallery-filter-btn.active .btn-icon-wrap {
          background: rgba(255,255,255,0.35);
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.1), 0 0 16px rgba(245,158,11,0.7);
        }
        .gallery-filter-btn.active:hover .btn-icon-wrap {
          transform: scale(1.18) rotate(5deg);
        }

        .btn-label {
          line-height: 1;
          position: relative;
          z-index: 2;
        }

        @media (max-width: 700px) {
          .gallery-filter-btn { padding: 16px 4px 12px; font-size: 10px; gap: 5px; letter-spacing: 0; }
          .gallery-filter-btn .btn-icon-wrap { width: 30px; height: 30px; }
        }
        @media (max-width: 480px) {
          .gallery-filter-btn .btn-label { display: none; }
          .gallery-filter-btn { padding: 16px 4px; }
        }
      `}</style>
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


      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading gallery...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>No images found.</p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} id={`section-${cat}`} style={{ marginBottom: 48 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
              <span style={{ fontSize: 24 }}>{GALLERY[cat]?.icon}</span>
              {GALLERY[cat]?.label || cat}
            </h2>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16
            }}>
              {items.map(img => (
                <div key={img.id}
                  onClick={() => setPopup(img)}
                  style={{
                    flex: `0 0 calc(${100 / cols}% - ${16 * (cols - 1) / cols}px)`, background: 'white', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s'
                  }}>
                  <div style={{
                    width: '100%', height: 300, background: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {img.image_path ? (
                      <img src={resolveImg(img.image_path)} alt={img.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : null}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{img.title}</h3>
                    {img.description && (
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {img.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Popup Modal */}
      {popup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setPopup(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, maxWidth: 720, width: '100%',
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ position: 'relative' }}>
              {popup.image_path && (
                <img src={resolveImg(popup.image_path)} alt={popup.title}
                  style={{ width: '100%', maxHeight: 460, objectFit: 'contain', background: '#0f172a', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              <button onClick={() => setPopup(null)}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18
                }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#0f172a' }}>{popup.title}</h2>
              {popup.description && (
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{popup.description}</p>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
                {popup.date_taken && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {new Date(popup.date_taken).toLocaleDateString('en-CA')}
                  </span>
                )}
                {popup.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {popup.location}
                  </span>
                )}
              </div>
              <button onClick={() => setPopup(null)}
                style={{
                  marginTop: 16, width: '100%', padding: '10px',
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: 13, color: '#475569', cursor: 'pointer'
                }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
};
