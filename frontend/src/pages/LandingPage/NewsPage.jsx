import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, MapPin, Briefcase, Clock, Play, ArrowLeft, X } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

const ShimmerBlock = ({ width = '100%', height = 16, margin = '0 0 8px', borderRadius = 6 }) => (
  <div style={{
    width, height, margin, borderRadius,
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  // make sure path starts with a slash
  const safePath = path.startsWith('/') ? path : `/uploads/news/${path}`;
  return `${baseUrl}${safePath}`;
};

const VideoSkeleton = () => (
  <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
    <div style={{
      aspectRatio: '16/9', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={24} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
      </div>
    </div>
    <div style={{ padding: 14 }}>
      <ShimmerBlock width="80%" height={14} />
      <ShimmerBlock width="60%" height={12} margin="6px 0 0" />
    </div>
  </div>
);

const CardSkeleton = () => (
  <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
    <ShimmerBlock width="60px" height={18} borderRadius={99} />
    <ShimmerBlock width="90%" height={18} margin="12px 0 8px" />
    <ShimmerBlock height={13} margin="0 0 4px" />
    <ShimmerBlock width="70%" height={13} margin="0 0 12px" />
    <ShimmerBlock width="120px" height={12} />
  </div>
);

const PostImage = ({ images, alt }) => {
  if (!images) return null;
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
    if (parsed && parsed.length > 0) {
      return (
        <div style={{ 
          flex: '0 0 50%', maxWidth: '50%', paddingLeft: 40, borderLeft: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            borderRadius: 8, overflow: 'hidden', background: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <img src={getImageUrl(parsed[0])} alt={alt || 'Post Image'} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 500 }} />
          </div>
        </div>
      );
    }
  } catch (e) { return null; }
  return null;
};

export default () => {
  const { type: filterParam } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(filterParam || 'all');
  const [playingVideo, setPlayingVideo] = useState(null);
  
  // Application Form State
  const [applyingPost, setApplyingPost] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', email: '', education_status: 'High School', national_id: '', sex: 'Male' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    setActiveFilter(filterParam || 'all');
  }, [filterParam]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/news/public');
      const data = res.data;
      if (Array.isArray(data)) setPosts(data);
      else if (data?.data) setPosts(data.data);
      else if (data?.status === 'success') setPosts(data.data ?? []);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/applications', { ...formData, post_id: applyingPost.id });
      setApplyingPost(null);
      setShowSuccess(true);
      setFormData({ full_name: '', phone_number: '', email: '', education_status: 'High School', national_id: '', sex: 'Male' });
    } catch (err) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (playingVideo || applyingPost || showSuccess) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [playingVideo, applyingPost, showSuccess]);

  const extractYoutubeId = (url) => {
    const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const filtered = activeFilter === 'all' ? posts : posts.filter(p => p.type === activeFilter);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'hiring', label: '💼 Hiring', icon: '💼' },
    { key: 'news', label: '📰 News', icon: '📰' },
    { key: 'video', label: '🎬 Video', icon: '🎬' },
  ];

  const renderShimmer = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ flex: '0 0 340px' }}><VideoSkeleton /></div>)}
      </div>
    </div>
  );

  return (
    <><PublicNav />
    <div style={{ width: '98%', maxWidth: 1400, margin: '0 auto', padding: '16px 20px 80px', minHeight: '100vh', background: 'linear-gradient(160deg, #f8f9fc 0%, #f1f3f6 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div className="tip-wrap" style={{ flexShrink: 0 }}>
          <button className="news-back-btn" onClick={() => navigate(-1)}>
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
              background: 'linear-gradient(90deg, #059669, #10b981, #6366f1, #f59e0b, #059669)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'newsTitleShimmer 4s linear infinite',
              paddingRight: 60,
              textShadow: '0 4px 20px rgba(5,150,105,0.25), 0 8px 40px rgba(99,102,241,0.15)',
            }}>
              📢 News &amp; Announcements &nbsp;·&nbsp; Stay informed with the latest from Sutana &nbsp;·&nbsp;
            </span>
          </marquee>
        </div>
      </div>
      <style>{`
        @keyframes newsTitleShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        marquee {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        marquee::-webkit-scrollbar { display: none; }

          /* Back Button 3D */
          .news-back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px 10px 8px;
            border: none;
            border-radius: 999px;
            background: linear-gradient(180deg, #e6f9fd 0%, #22D1EE 50%, #1bbad4 100%);
            color: #0d4e5a;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            cursor: pointer;
            position: relative;
            transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.7),
              0 4px 0 #18a4bd,
              0 5px 0 #148ea4,
              0 6px 0 #107789,
              0 8px 18px rgba(0,0,0,0.12);
            transform: translateY(0);
          }
          .news-back-btn:hover {
            transform: translateY(-2px);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              0 6px 0 #18a4bd,
              0 7px 0 #148ea4,
              0 8px 0 #107789,
              0 12px 24px rgba(0,0,0,0.18);
          }
          .news-back-btn:active {
            transform: translateY(4px);
            box-shadow:
              inset 0 2px 4px rgba(0,0,0,0.1),
              0 2px 0 #18a4bd,
              0 4px 10px rgba(0,0,0,0.1);
          }
          .news-back-btn .back-icon-wrap {
            width: 28px; height: 28px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(13,78,90,0.15);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.9);
            transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          }
          .news-back-btn:hover .back-icon-wrap {
            background: rgba(13,78,90,0.25);
            transform: scale(1.1) translateX(-2px);
          }

          /* Filter Bar 3D */
          .news-filter-bar {
            display: flex;
            width: 100%;
            margin-bottom: 24px;
            border-radius: 0;
            overflow: visible;
            gap: 0;
            filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15));
          }
          .news-filter-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 14px 10px 12px;
            border: none;
            border-right: 2px solid rgba(0,0,0,0.06);
            background: linear-gradient(180deg, #f2f3ff 0%, #8C93F5 40%, #767fe8 100%);
            color: #24285e;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.02em;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              inset 0 -1px 0 rgba(0,0,0,0.06),
              0 8px 0 #616bd4,
              0 9px 0 #4c57c0,
              0 10px 0 #3a45a3,
              0 12px 18px rgba(0,0,0,0.14);
            transform: translateY(0px);
            user-select: none;
            text-transform: uppercase;
          }
          .news-filter-btn:first-child { border-radius: 0; }
          .news-filter-btn:last-child { border-right: none; border-radius: 0; }

          .news-filter-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 60%; height: 100%;
            background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
            transition: left 0.5s ease;
            pointer-events: none;
          }
          .news-filter-btn:hover::before { left: 150%; }

          .news-filter-btn::after {
            content: '';
            position: absolute;
            bottom: 0; left: 50%; transform: translateX(-50%);
            width: 0; height: 3px;
            background: #4c57c0;
            border-radius: 3px 3px 0 0;
            transition: width 0.3s ease;
          }

          .news-filter-btn:hover {
            background: linear-gradient(180deg, #ffffff 0%, #a2a8fa 40%, #8C93F5 100%);
            color: #1e224e;
            transform: translateY(-4px);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.95),
              inset 0 -1px 0 rgba(0,0,0,0.05),
              0 12px 0 #616bd4,
              0 13px 0 #4c57c0,
              0 14px 0 #3a45a3,
              0 18px 28px rgba(0,0,0,0.2);
          }
          .news-filter-btn:active {
            transform: translateY(6px);
            box-shadow:
              inset 0 2px 4px rgba(0,0,0,0.12),
              0 2px 0 #616bd4,
              0 3px 8px rgba(0,0,0,0.1);
          }

          .news-filter-btn.active {
            background: linear-gradient(180deg, #f0fdff 0%, #22D1EE 40%, #1abdd6 100%);
            color: #0b4b57;
            transform: translateY(4px);
            box-shadow:
              inset 0 2px 8px rgba(11,75,87,0.12),
              inset 0 1px 0 rgba(255,255,255,0.7),
              0 4px 0 #16a6bd,
              0 5px 0 #138ea3,
              0 6px 0 #107789,
              0 8px 18px rgba(0,0,0,0.12);
          }
          .news-filter-btn.active::after {
            width: 60%;
            background: #0b4b57;
          }
          .news-filter-btn.active::before { display: none; }
          .news-filter-btn.active:hover {
            transform: translateY(2px);
            box-shadow:
              inset 0 2px 6px rgba(11,75,87,0.1),
              0 6px 0 #16a6bd,
              0 7px 0 #138ea3,
              0 8px 20px rgba(0,0,0,0.15);
          }
          .news-filter-btn.active:active {
            transform: translateY(7px);
            box-shadow:
              inset 0 3px 8px rgba(11,75,87,0.15),
              0 1px 0 #16a6bd;
          }

          .news-filter-btn .btn-icon-wrap {
            width: 38px; height: 38px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.06);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9);
            transition: all 0.2s;
            flex-shrink: 0;
            font-size: 18px;
          }
          .news-filter-btn:hover .btn-icon-wrap {
            background: rgba(0,0,0,0.1);
            transform: scale(1.1);
          }
          .news-filter-btn.active .btn-icon-wrap {
            background: rgba(11,75,87,0.15);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 0 8px rgba(11,75,87,0.2);
          }
          
          .btn-label {
            line-height: 1;
            position: relative;
            z-index: 2;
          }

          @media (max-width: 700px) {
            .news-filter-btn { padding: 16px 4px 12px; font-size: 10px; gap: 5px; }
            .news-filter-btn .btn-icon-wrap { width: 28px; height: 28px; font-size: 14px; }
          }
          @media (max-width: 480px) {
            .news-filter-btn .btn-label { display: none; }
            .news-filter-btn { padding: 14px 4px; }
          }
        `}</style>

      <div className="news-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`news-filter-btn${activeFilter === f.key ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            <div className="btn-icon-wrap">
              {f.icon ?? '✨'}
            </div>
            <span className="btn-label">{f.label.replace(/📰 |💼 |🎬 /g, '')}</span>
          </button>
        ))}
      </div>

      {loading ? renderShimmer() : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <p>No {activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} posts found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {(activeFilter === 'all' || activeFilter === 'news') && (
            filtered.filter(p => p.type === 'news').length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
                  {filtered.filter(p => p.type === 'news').map(p => (
                    <div key={p.id} style={{
                      background: 'white', borderRadius: 4, padding: '40px 48px', border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex', alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1, paddingRight: 40 }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                          background: '#dbeafe', color: '#1e40af', marginBottom: 12
                        }}>News Announcement</span>
                        <h3 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{p.title}</h3>
                        {p.content && (
                          <p style={{ margin: '0 0 24px', fontSize: 15, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                            {p.content}
                          </p>
                        )}
                        <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                          <Calendar size={12} /> {new Date(p.created_at).toLocaleDateString('en-CA')}
                        </div>
                      </div>
                      <PostImage images={p.images} alt={p.title} />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {(activeFilter === 'all' || activeFilter === 'hiring') && (
            filtered.filter(p => p.type === 'hiring').length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
                {filtered.filter(p => p.type === 'hiring').map(p => (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: 4, padding: '40px 48px', border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1, paddingRight: 40 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{p.hiring_position || p.title}</h3>
                        <span style={{ fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '4px 12px', borderRadius: 4, whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {p.hiring_location || 'Addis Ababa'}
                        </span>
                      </div>
                      {p.content && <p style={{ margin: '0 0 24px', fontSize: 15, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{p.content}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14, color: '#64748b', marginBottom: 24, flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> <strong>Deadline:</strong> {new Date(p.hiring_deadline).toLocaleDateString('en-CA')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> <strong>Location:</strong> {p.hiring_location || 'Addis Ababa'}</span>
                      </div>
                      <button onClick={() => setApplyingPost(p)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 18px',
                        background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
                      }}>
                        <Briefcase size={14} /> Apply Now
                      </button>
                    </div>
                    <PostImage images={p.images} alt={p.hiring_position || p.title} />
                  </div>
                ))}
              </div>
            )
          )}

          {(activeFilter === 'all' || activeFilter === 'video') && (
            filtered.filter(p => p.type === 'video').length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
              }}>
                  {filtered.filter(p => p.type === 'video').map(p => {
                  const vid = extractYoutubeId(p.youtube_url);
                  return vid ? (
                    <div key={p.id} style={{
                      background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ aspectRatio: '16/9', background: '#0f172a', position: 'relative', cursor: 'pointer' }}
                        onClick={() => setPlayingVideo(vid)}>
                        <>
                          <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={24} color="white" fill="white" />
                            </div>
                          </div>
                        </>
                      </div>
                      <div style={{ padding: 14 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.title}</h4>
                        {p.content && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{p.content.replace(/<[^>]*>/g, '').slice(0, 120)}</p>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )
          )}

        </div>
      )}

      {playingVideo && (
        <div onClick={() => setPlayingVideo(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', width: '100%', maxWidth: 960, aspectRatio: '16/9',
            background: '#000', borderRadius: 12, overflow: 'hidden'
          }}>
            <button onClick={() => setPlayingVideo(null)} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={20} color="white" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title="Video Player"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {applyingPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: '20px',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 520,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            margin: 'auto',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Apply for Position</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{applyingPost.hiring_position || applyingPost.title}</p>
              </div>
              <button onClick={() => setApplyingPost(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleApply} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh' }}>
              <PostImage images={applyingPost.images} alt={applyingPost.hiring_position || applyingPost.title} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Full Name</label>
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Phone Number</label>
                  <input required type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>National ID</label>
                  <input required type="text" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Sex</label>
                  <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Highest Education Status</label>
                <select value={formData.education_status} onChange={e => setFormData({...formData, education_status: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} style={{
                marginTop: 8, width: '100%', padding: 12, background: isSubmitting ? '#94a3b8' : '#0ea5e9', color: 'white',
                border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccess && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)', padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 480,
            padding: 40, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Briefcase size={36} color="#16a34a" />
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 22, color: '#0f172a', fontWeight: 700 }}>🎉 Congratulations!</h2>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#334155', lineHeight: 1.7, textAlign: 'left', background: '#f0fdf4', borderRadius: 10, padding: '18px 22px', border: '1px solid #bbf7d0' }}>
              Your application has been received. Please visit our office within <strong>5 working days</strong>, bringing your:
              <br/><br/>
              &nbsp;&nbsp;📄 <strong>Original education certificate(s)</strong><br/>
              &nbsp;&nbsp;🪪 <strong>National ID card</strong>
              <br/><br/>
              to continue the hiring process.
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              ✉️ A confirmation email has been sent to your email address with full details and our office address.
            </p>
            <button onClick={() => setShowSuccess(false)} style={{
              width: '100%', padding: '13px', background: '#059669', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5,150,105,0.35)'
            }}>
              Understood — I Will Visit the Office
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
