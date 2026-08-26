import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, MapPin, Briefcase, Clock, Play, ArrowLeft, X } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import './LandingRedesign.css';
import './NewsPage.css';

/* ─── Helpers ─────────────────────────────────────────────────────── */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const safePath = path.startsWith('/') ? path : `/uploads/news/${path}`;
  return `${baseUrl}${safePath}`;
};

const extractYoutubeId = (url) => {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

/* ─── Skeleton Components ─────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="news-card-skeleton">
    <div className="news-skeleton-block" style={{ width: '60px', height: '18px', borderRadius: '99px' }} />
    <div className="news-skeleton-block" style={{ width: '90%', height: '18px', margin: '12px 0 8px', borderRadius: '6px' }} />
    <div className="news-skeleton-block" style={{ width: '100%', height: '13px', margin: '0 0 4px', borderRadius: '6px' }} />
    <div className="news-skeleton-block" style={{ width: '70%', height: '13px', margin: '0 0 12px', borderRadius: '6px' }} />
    <div className="news-skeleton-block" style={{ width: '120px', height: '12px', borderRadius: '6px' }} />
  </div>
);

const VideoSkeleton = () => (
  <div className="news-video-skeleton">
    <div className="news-video-skeleton-thumb">
      <div className="news-video-skeleton-btn">
        <Play size={24} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
      </div>
    </div>
    <div className="news-video-skeleton-body">
      <div className="news-skeleton-block" style={{ width: '80%', height: '14px', borderRadius: '6px' }} />
      <div className="news-skeleton-block" style={{ width: '60%', height: '12px', margin: '6px 0 0', borderRadius: '6px' }} />
    </div>
  </div>
);

/* ─── Post Image (news / hiring side image) ─────────────────────── */
const PostImage = ({ images, alt }) => {
  if (!images) return null;
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
    if (parsed && parsed.length > 0) {
      return (
        <div className="news-post-image-col">
          <div className="news-post-image-wrapper">
            <img
              src={getImageUrl(parsed[0])}
              alt={alt || 'Post Image'}
              className="news-post-img"
            />
          </div>
        </div>
      );
    }
  } catch (e) { return null; }
  return null;
};

/* ─── Main Component ──────────────────────────────────────────────── */
export default () => {
  const { type: filterParam } = useParams();
  const navigate = useNavigate();
  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState(filterParam || 'all');
  const [playingVideo,  setPlayingVideo]  = useState(null);
  const [applyingPost,  setApplyingPost]  = useState(null);
  const [formData,      setFormData]      = useState({
    full_name: '', phone_number: '', email: '',
    education_status: 'High School', national_id: '', sex: 'Male'
  });
  const [idFront,       setIdFront]       = useState(null);
  const [idBack,        setIdBack]        = useState(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [showSuccess,   setShowSuccess]   = useState(false);

  useEffect(() => { setActiveFilter(filterParam || 'all'); }, [filterParam]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/news/public');
      const data = res.data;
      if (Array.isArray(data))              setPosts(data);
      else if (data?.data)                  setPosts(data.data);
      else if (data?.status === 'success')  setPosts(data.data ?? []);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = (playingVideo || applyingPost || showSuccess) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [playingVideo, applyingPost, showSuccess]);

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries({ ...formData, post_id: applyingPost.id }).forEach(([k, v]) => fd.append(k, v));
      if (idFront) fd.append('id_front_image', idFront);
      if (idBack)  fd.append('id_back_image',  idBack);
      await axios.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setApplyingPost(null);
      setShowSuccess(true);
      setFormData({ full_name: '', phone_number: '', email: '', education_status: 'High School', national_id: '', sex: 'Male' });
      setIdFront(null);
      setIdBack(null);
    } catch (err) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = activeFilter === 'all' ? posts : posts.filter(p => p.type === activeFilter);

  const FILTERS = [
    { key: 'all',     label: 'All',     icon: '✨' },
    { key: 'hiring',  label: 'Hiring',  icon: '💼' },
    { key: 'news',    label: 'News',    icon: '📰' },
    { key: 'video',   label: 'Video',   icon: '🎬' },
  ];

  const newsItems    = filtered.filter(p => p.type === 'news');
  const hiringItems  = filtered.filter(p => p.type === 'hiring');
  const videoItems   = filtered.filter(p => p.type === 'video');

  return (
    <>
      <PublicNav />

      <div className="news-page">
        <div className="news-inner">

          {/* ── Top bar ── */}
          <div className="news-topbar">
            <button className="news-back-btn" onClick={() => navigate(-1)}>
              <div className="back-icon-wrap">
                <ArrowLeft size={16} strokeWidth={2.5} />
              </div>
              <span>Back</span>
            </button>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '4px 0' }}>
                <span className="news-marquee-title">
                  📢 News &amp; Announcements &nbsp;·&nbsp; Stay informed with the latest from Sutana &nbsp;·&nbsp;
                </span>
              </marquee>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="news-filter-bar">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`news-filter-btn${activeFilter === f.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <div className="btn-icon-wrap">{f.icon}</div>
                <span className="btn-label">{f.label}</span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="news-skeleton-container">
              <div className="news-skeleton-grid">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
              </div>
              <div className="news-video-grid">
                {[1,2,3].map(i => <VideoSkeleton key={i} />)}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="news-empty">
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
              No {activeFilter === 'all' ? '' : activeFilter} posts found.
            </div>
          ) : (
            <div className="news-content-container">

              {/* ── News posts ── */}
              {(activeFilter === 'all' || activeFilter === 'news') && newsItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">📰 News Announcements</h2>
                  <div className="news-articles-list">
                    {newsItems.map(p => (
                      <div key={p.id} className="news-article-card">
                        <div className="news-article-body" style={{ paddingRight: p.images ? '2rem' : 0 }}>
                          <span className="news-badge news-badge--news">News Announcement</span>
                          <h3 className="news-article-title">{p.title}</h3>
                          {p.content && <p className="news-article-content">{p.content}</p>}
                          <div className="news-article-meta">
                            <span><Calendar size={13} /> {new Date(p.created_at).toLocaleDateString('en-CA')}</span>
                          </div>
                        </div>
                        <PostImage images={p.images} alt={p.title} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Hiring posts ── */}
              {(activeFilter === 'all' || activeFilter === 'hiring') && hiringItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">💼 Job Openings</h2>
                  <div className="news-articles-list">
                    {hiringItems.map(p => (
                      <div key={p.id} className="news-article-card">
                        <div className="news-article-body" style={{ paddingRight: p.images ? '2rem' : 0 }}>
                          <div className="news-article-title-row">
                            <h3 className="news-article-title">{p.hiring_position || p.title}</h3>
                            <span className="hiring-location-pill">{p.hiring_location || 'Addis Ababa'}</span>
                          </div>
                          <span className="news-badge news-badge--hiring">Now Hiring</span>
                          {p.content && <p className="news-article-content">{p.content}</p>}
                          <div className="news-article-meta news-article-meta-hiring">
                            {p.hiring_deadline && (
                              <span><Clock size={13} /> <strong>Deadline:</strong> {new Date(p.hiring_deadline).toLocaleDateString('en-CA')}</span>
                            )}
                            <span><MapPin size={13} /> <strong>Location:</strong> {p.hiring_location || 'Addis Ababa'}</span>
                          </div>
                          <button className="news-apply-btn" onClick={() => setApplyingPost(p)}>
                            <Briefcase size={14} /> Apply Now
                          </button>
                        </div>
                        <PostImage images={p.images} alt={p.hiring_position || p.title} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Video posts ── */}
              {(activeFilter === 'all' || activeFilter === 'video') && videoItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">🎬 Videos</h2>
                  <div className="news-video-grid">
                    {videoItems.map(p => {
                      const vid = extractYoutubeId(p.youtube_url);
                      return vid ? (
                        <div key={p.id} className="news-video-card">
                          <div className="news-video-thumb" onClick={() => setPlayingVideo(vid)}>
                            <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt={p.title} />
                            <div className="news-video-play">
                              <div className="news-video-play-btn">
                                <Play size={22} color="white" fill="white" />
                              </div>
                            </div>
                          </div>
                          <div className="news-video-body">
                            <h4 className="news-video-title">{p.title}</h4>
                            {p.content && (
                              <p className="news-video-desc">{p.content.replace(/<[^>]*>/g, '').slice(0, 120)}</p>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Video player modal ── */}
      {playingVideo && (
        <div className="news-modal-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="news-video-modal" onClick={e => e.stopPropagation()}>
            <button className="news-video-close" onClick={() => setPlayingVideo(null)}>
              <X size={20} />
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

      {/* ── Application form modal ── */}
      {applyingPost && (
        <div className="news-modal-overlay news-form-overlay">
          <div className="news-form-modal">
            <div className="news-form-header">
              <div>
                <h2>Apply for Position</h2>
                <p>{applyingPost.hiring_position || applyingPost.title}</p>
              </div>
              <button className="news-form-close" onClick={() => setApplyingPost(null)}>
                <X size={20} />
              </button>
            </div>
            <form className="news-form-body" onSubmit={handleApply}>
              <div className="news-form-row">
                <div className="news-form-group">
                  <label>Full Name</label>
                  <input className="news-input-field" required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="news-form-group">
                  <label>Phone Number</label>
                  <input className="news-input-field" required type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
              </div>
              <div className="news-form-group">
                <label>Email Address</label>
                <input className="news-input-field" required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="news-form-row">
                <div className="news-form-group">
                  <label>National ID</label>
                  <input className="news-input-field" required type="text" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
                </div>
                <div className="news-form-group">
                  <label>Sex</label>
                  <select className="news-input-field" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="news-form-group">
                <label>Highest Education Status</label>
                <select className="news-input-field" value={formData.education_status} onChange={e => setFormData({...formData, education_status: e.target.value})}>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              {/* ── ID Images ── */}
              <div className="news-upload-section">
                <label className="news-upload-title">
                  📷 National ID Images
                </label>
                <div className="news-upload-grid">
                  <div className="news-upload-box">
                    <label className="news-upload-label">
                      {idFront
                        ? <img src={URL.createObjectURL(idFront)} alt="ID Front" className="news-upload-img" />
                        : <div className="news-upload-placeholder">🪪 Front of ID<br /><span className="news-upload-subtext">Click to upload</span></div>
                      }
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setIdFront(e.target.files[0])} />
                    </label>
                    {idFront && <button type="button" onClick={() => setIdFront(null)} className="news-upload-remove">✕ Remove</button>}
                  </div>
                  <div className="news-upload-box">
                    <label className="news-upload-label">
                      {idBack
                        ? <img src={URL.createObjectURL(idBack)} alt="ID Back" className="news-upload-img" />
                        : <div className="news-upload-placeholder">🪪 Back of ID<br /><span className="news-upload-subtext">Click to upload</span></div>
                      }
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setIdBack(e.target.files[0])} />
                    </label>
                    {idBack && <button type="button" onClick={() => setIdBack(null)} className="news-upload-remove">✕ Remove</button>}
                  </div>
                </div>
              </div>

              <button type="submit" className="news-form-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Success notification modal ── */}
      {showSuccess && (
        <div className="news-modal-overlay news-success-overlay">
          <div className="news-success-modal">
            <div className="news-success-icon">
              <Briefcase size={32} color="hsl(var(--primary))" />
            </div>
            <h2 className="news-success-title">🎉 Congratulations!</h2>
            <p className="news-success-info">
              Your application has been received. Please visit our office within <strong>5 working days</strong>, bringing your:<br /><br />
              &nbsp;&nbsp;📄 <strong>Original education certificate(s)</strong><br />
              &nbsp;&nbsp;🪪 <strong>National ID card</strong><br /><br />
              to continue the hiring process.
            </p>
            <p className="news-success-note">
              ✉️ A confirmation email has been sent to your email address with full details and our office address.
            </p>
            <button className="news-success-btn" onClick={() => setShowSuccess(false)}>
              Understood — I Will Visit the Office
            </button>
          </div>
        </div>
      )}
    </>
  );
};
