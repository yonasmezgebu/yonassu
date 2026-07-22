import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Image as ImageIcon, Trash2, Globe, ExternalLink, Search, Package, Pill, DollarSign, CheckCircle, XCircle, Building2, Layers, X, Edit3, MapPin, Phone, Clock, User, Hash, Save, Shield, ShieldCheck, RefreshCw } from 'lucide-react';
import salesService from '../../services/salesService';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../hooks/useAuth';
import successSound from '../../assets/notification/info.mp3';

/* ── Palette ─────────────────────────────────────────── */
const LAVENDER = '#E3E7FE';
const ICE      = '#EAFBFD';
const DARK     = '#171B36';
const MID      = '#313C7A';
const ACCENT   = '#4A5CD0';
const GOLD     = '#D4A843';
const GOLD2    = '#9A701E';

const SalesHealthPublisher = () => {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Sales Manager', 'Admin', 'CEO'].includes(r));

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showBranchManager, setShowBranchManager] = useState(false);

  const [workerCanPost, setWorkerCanPost] = useState(false);
  const [togglingPost, setTogglingPost] = useState(false);
  const [settingMsg, setSettingMsg] = useState({ type: '', text: '' });
  const [spinning, setSpinning] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For child components

  const [form, setForm] = useState({
    title: '', subtitle: '', content: '', source_url: '',
    category_id: '', category_name: '', product_id: '', product_name: '',
    price: '', price_unit: '', manufacturer: '',
    stock_quantity: '', reorder_level: '', is_order_required: false,
    status: 'draft', meta_title: '', meta_description: ''
  });

  const [productImage, setproductImage] = useState(null);
  const [productPreview, setproductPreview] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const productFileRef = useRef(null);
  const coverFileRef = useRef(null);

  const [scrapedCategories, setScrapedCategories] = useState([]);
  const [scrapedProducts, setScrapedProducts] = useState([]);

  useEffect(() => {
    loadPosts();
    pharmacyService.getWorkerHealthPostSetting()
      .then(res => setWorkerCanPost(res?.data?.enabled ?? false))
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setSpinning(true);
    await loadPosts();
    setRefreshTrigger(prev => prev + 1);
    setSpinning(false);
  };

  const handleToggleWorkerPost = async () => {
    setTogglingPost(true);
    try {
      const newVal = !workerCanPost;
      await pharmacyService.updateWorkerHealthPostSetting(newVal);
      setWorkerCanPost(newVal);
      setSettingMsg({ type: 'success', text: `Workers can now ${newVal ? 'POST / EDIT / DELETE' : 'NO LONGER manage'} health posts.` });
    } catch (err) {
      setSettingMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update setting' });
    } finally {
      setTogglingPost(false);
      setTimeout(() => setSettingMsg({ type: '', text: '' }), 4000);
    }
  };

  // canAct: true if user is manager OR worker with permission granted
  const canAct = isManager || workerCanPost;

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getHealthPosts();
      setPosts(res?.data || []);
    } catch (e) {
      console.error('Failed to load health posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await pharmacyService.scrapeHealthData();
      const { categories, products } = res?.data || {};
      setScrapedCategories(categories || []);
      setScrapedProducts(products || []);
      if (categories?.length > 0 || products?.length > 0) {
        setShowForm(true);
        setEditingId(null);
        resetForm();
      }
    } catch (e) {
      alert('Failed to scrape data: ' + (e?.response?.data?.message || e.message));
    } finally {
      setScraping(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', subtitle: '', content: '', source_url: '',
      category_id: '', category_name: '', product_id: '', product_name: '',
      price: '', price_unit: '', manufacturer: '',
      stock_quantity: '', reorder_level: '', is_order_required: false,
      status: 'draft', meta_title: '', meta_description: ''
    });
    setproductImage(null);
    setproductPreview('');
    setCoverImage(null);
    setCoverPreview('');
  };

  const fillFromCategory = (cat) => {
    setForm(f => ({
      ...f,
      title: cat.name || f.title,
      subtitle: cat.description?.slice(0, 200) || f.subtitle,
      content: cat.description || f.content,
      category_id: cat.id,
      category_name: cat.name,
      meta_title: cat.name,
      meta_description: cat.description?.slice(0, 300) || ''
    }));
  };

  const fillFromProduct = (prod) => {
    setForm(f => ({
      ...f,
      title: prod.name || f.title,
      subtitle: prod.generic_name || f.subtitle,
      content: `Manufacturer: ${prod.manufacturer || 'N/A'}\nCategory: ${prod.category_name || ''}\nPrice: ${prod.price || ''} ${prod.price_unit || ''}`,
      product_id: prod.id,
      product_name: prod.name,
      price: prod.price || '',
      price_unit: prod.price_unit || '',
      manufacturer: prod.manufacturer || '',
      stock_quantity: prod.stock_quantity || '',
      reorder_level: prod.reorder_level || '',
      is_order_required: prod.is_order_required || false,
      category_id: prod.category_id || f.category_id,
      category_name: prod.category_name || f.category_name,
      meta_title: prod.name,
      meta_description: `${prod.name} - ${prod.generic_name || ''} - ${prod.manufacturer || ''}`.trim()
    }));
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      subtitle: post.subtitle || '',
      content: post.content || '',
      source_url: post.source_url || '',
      category_id: post.category_id || '',
      category_name: post.category_name || '',
      product_id: post.product_id || '',
      product_name: post.product_name || '',
      price: post.price || '',
      price_unit: post.price_unit || '',
      manufacturer: post.manufacturer || '',
      stock_quantity: post.stock_quantity || '',
      reorder_level: post.reorder_level || '',
      is_order_required: !!post.is_order_required,
      status: post.status || 'draft',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    });
    setShowForm(true);
  };

  const playSuccessSound = () => {
    try { new Audio(successSound).play(); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { alert('Title is required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (productImage) fd.append('product_image', productImage);
      if (coverImage) fd.append('cover_image', coverImage);

      if (editingId) {
        await pharmacyService.updateHealthPost(editingId, fd);
      } else {
        await pharmacyService.createHealthPost(fd);
      }
      playSuccessSound();
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await loadPosts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this health post?')) return;
    try {
      await pharmacyService.deleteHealthPost(id);
      await loadPosts();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handlePublish = async (id) => {
    try {
      await pharmacyService.publishHealthPost(id);
      await loadPosts();
    } catch (err) {
      alert('Failed to publish');
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: `3px solid ${DARK}`,
    borderRadius: 0, fontSize: 13, fontWeight: 700, color: DARK,
    background: 'white', outline: 'none', boxSizing: 'border-box',
    boxShadow: `3px 3px 0 ${DARK}`
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 900, color: DARK, 
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  return (
    <div style={{ padding: 0, margin: 0, minHeight: '100vh', width: '100%', background: LAVENDER, fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      
      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes spin     { 100%{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

        @keyframes blink3D {
          0%,100%{ opacity:1;  transform:perspective(400px) rotateY(0deg)   scale(1); }
          50%    { opacity:0.5; transform:perspective(400px) rotateY(180deg) scale(1.15); }
        }
        @keyframes rowIn3D {
          from{ opacity:0; transform:perspective(900px) rotateX(-55deg) translateY(-18px); }
          to  { opacity:1; transform:perspective(900px) rotateX(0deg)   translateY(0);     }
        }
        @keyframes iconPop {
          0%,100%{ transform:scale(1)    rotateZ(0deg); }
          50%    { transform:scale(1.28) rotateZ(14deg); }
        }
        @keyframes badgePop {
          0%,100%{ transform:perspective(300px) rotateX(0deg) scale(1); }
          50%    { transform:perspective(300px) rotateX(20deg) scale(1.08); }
        }

        /* Button 3-D lift */
        .btn3d {
          transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
        }
        .btn3d:hover:not(:disabled) {
          transform: perspective(500px) translateZ(12px) translateY(-4px) rotateX(6deg) !important;
          box-shadow: 0 10px 0 ${MID}, 0 14px 20px rgba(0,0,0,.25) !important;
        }
        .btn3d-alt:hover:not(:disabled) {
          transform: perspective(500px) translateZ(12px) translateY(-4px) rotateX(6deg) !important;
          box-shadow: 0 10px 0 ${GOLD2}, 0 14px 20px rgba(0,0,0,.25) !important;
        }
        .btn3d:active:not(:disabled), .btn3d-alt:active:not(:disabled) {
          transform: perspective(500px) translateZ(0) translateY(5px) rotateX(0deg) !important;
          box-shadow: 0 0 0 ${DARK} !important;
        }

        /* Row / Card 3-D hover */
        .card3d {
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          transform-style: preserve-3d;
        }
        .card3d:hover {
          transform: perspective(900px) scale(1.01) translateZ(10px);
          box-shadow: 0 12px 24px rgba(0,0,0,.15), 6px 6px 0 ${DARK};
          z-index: 5;
          position: relative;
        }

        .icon3d  { animation: blink3D 3.2s ease-in-out infinite; display:inline-block; }
        .iconPop { animation: iconPop  2.5s ease-in-out infinite; display:inline-block; }
        .badge3d { animation: badgePop 2.8s ease-in-out infinite; display:inline-block; }
      `}</style>

      {settingMsg.text && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 24px', borderRadius: 0,
          background: settingMsg.type === 'success' ? ICE : '#fef2f2',
          border: `3px solid ${settingMsg.type === 'success' ? DARK : '#991b1b'}`,
          color: settingMsg.type === 'success' ? DARK : '#991b1b',
          fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `4px 4px 0 ${settingMsg.type === 'success' ? DARK : '#991b1b'}`,
          animation: 'fadeSlide .3s ease-out',
        }}>
          <span className="icon3d">
            {settingMsg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </span>
          {settingMsg.text}
        </div>
      )}

      {/* ══ HEADER BAR ══════════════════════════════════════════ */}
      <div style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: '0 24px', animation: 'fadeUp .3s ease' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${ACCENT},${ICE},${LAVENDER},${ACCENT})`, backgroundSize: '400% 100%', animation: 'shimmer 2.5s linear infinite' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', flexWrap: 'wrap', gap: 16 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="icon3d" style={{
              width: 48, height: 48, background: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${ICE}`, boxShadow: `4px 4px 0 ${ICE}`,
            }}>
              <Globe size={24} color={ICE} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: ICE, margin: 0, lineHeight: 1.1 }}>
                Health Publisher
              </h1>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: ACCENT }}>
                Import • Educate • Publish
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="btn3d"
              style={{
                background: ICE, color: DARK, border: `3px solid ${DARK}`,
                padding: '10px 18px', fontWeight: 900, fontSize: 12, cursor: 'pointer',
                boxShadow: `4px 4px 0 ${DARK}`, display: 'inline-flex',
                alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px',
              }}
            >
              <RefreshCw size={16} style={spinning ? { animation: 'spin .7s linear infinite' } : {}} />
              Refresh
            </button>

            {isManager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: workerCanPost ? ACCENT : '#fef2f2', border: `3px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}`, transition: 'all 0.3s' }}>
                <div className={workerCanPost ? 'iconPop' : ''}>
                  {workerCanPost ? <ShieldCheck size={16} color={ICE} /> : <Shield size={16} color="#dc2626" />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: workerCanPost ? ICE : '#991b1b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Worker Access</span>
                </div>
                <button onClick={handleToggleWorkerPost} disabled={togglingPost}
                  style={{ width: 44, height: 24, borderRadius: 0, border: `2px solid ${DARK}`, cursor: togglingPost ? 'not-allowed' : 'pointer', background: workerCanPost ? ICE : '#d1d5db', position: 'relative', transition: 'background 0.3s ease', padding: 0, outline: 'none' }}>
                  <span style={{ display: 'block', width: 16, height: 16, background: DARK, position: 'absolute', top: 2, left: workerCanPost ? 22 : 2, transition: 'left 0.3s ease' }} />
                  {togglingPost && <Loader2 size={12} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'spin 1s linear infinite', color: 'white' }} />}
                </button>
              </div>
            )}

            {isManager && (
              <>
                <button onClick={() => { setShowCatManager(s => !s); setShowBranchManager(false); }}
                  className="btn3d"
                  style={{ background: showCatManager ? '#ef4444' : ICE, color: DARK, border: `3px solid ${DARK}`, padding: '10px 16px', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>
                  <Layers size={16} /> {showCatManager ? 'Close Cats' : 'Manage Cats'}
                </button>
                <button onClick={() => { setShowBranchManager(s => !s); setShowCatManager(false); }}
                  className="btn3d"
                  style={{ background: showBranchManager ? '#ef4444' : ICE, color: DARK, border: `3px solid ${DARK}`, padding: '10px 16px', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>
                  <Building2 size={16} /> {showBranchManager ? 'Close Branches' : 'Manage Branches'}
                </button>
                <button onClick={handleScrape} disabled={scraping}
                  className="btn3d-alt"
                  style={{ background: GOLD, color: DARK, border: `3px solid ${GOLD2}`, padding: '10px 16px', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${GOLD2}` }}>
                  {scraping ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <span className="icon3d"><Search size={16} /></span>}
                  {scraping ? 'Scraping...' : 'Scrape & Import'}
                </button>
              </>
            )}

            {canAct && (
              <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
                className="btn3d"
                style={{ background: showForm ? '#ef4444' : ACCENT, color: showForm ? 'white' : ICE, border: `3px solid ${DARK}`, padding: '10px 16px', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>
                {showForm ? 'Cancel' : <><span className="icon3d"><Plus size={16} /></span> New Post</>}
              </button>
            )}

            {!canAct && !isManager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,0.15)', border: `2px dashed ${ACCENT}` }}>
                <Shield size={15} color={ICE} />
                <span style={{ fontSize: 12, color: ICE, fontWeight: 900, textTransform: 'uppercase' }}>View only — manager controls</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', animation: 'fadeUp .4s ease' }}>

        {showForm && (
          <div style={{ background: ICE, border: `3px solid ${DARK}`, padding: 24, boxShadow: `6px 6px 0 ${DARK}`, marginBottom: 24, animation: 'fadeSlide 0.3s ease-out' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 900, color: DARK, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="icon3d"><ImageIcon size={18} color={DARK} /></span> {editingId ? 'Edit' : 'Create'} Health Post
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Scraped Data Selectors */}
              {!editingId && scrapedCategories.length > 0 && (
                <div style={{ padding: 16, background: LAVENDER, border: `3px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}` }}>
                  <div style={{ fontWeight: 900, marginBottom: 12, color: DARK, textTransform: 'uppercase', fontSize: 12 }}>Scraped Categories — click to fill form</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {scrapedCategories.map(cat => (
                      <button key={cat.id} type="button" onClick={() => fillFromCategory(cat)}
                        className="btn3d"
                        style={{ padding: '8px 14px', border: `2px solid ${DARK}`, background: 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', boxShadow: `2px 2px 0 ${DARK}` }}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 900, marginBottom: 12, color: DARK, textTransform: 'uppercase', fontSize: 12 }}>Scraped Products — click to fill form</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                    {scrapedProducts.map(prod => (
                      <button key={prod.id} type="button" onClick={() => fillFromProduct(prod)}
                        className="btn3d"
                        style={{ padding: '8px 14px', border: `2px solid ${DARK}`, background: 'white', cursor: 'pointer', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', boxShadow: `2px 2px 0 ${DARK}` }}>
                        {prod.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 300 }}>
                  <input placeholder="Title *" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={inputStyle} />
                  <input placeholder="Subtitle" value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    style={inputStyle} />
                  <textarea placeholder="Content / Description" rows={5} value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
                  <div>
                    <label style={labelStyle}>product Image</label>
                    <input type="file" accept="image/*" ref={productFileRef}
                      onChange={e => { const f = e.target.files[0]; if (f) { setproductImage(f); setproductPreview(URL.createObjectURL(f)); } }}
                      style={{ ...inputStyle, padding: '8px' }} />
                    {productPreview && <img src={productPreview} alt="" style={{ marginTop: 8, maxHeight: 100, border: `3px solid ${DARK}`, objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <label style={labelStyle}>Cover Image</label>
                    <input type="file" accept="image/*" ref={coverFileRef}
                      onChange={e => { const f = e.target.files[0]; if (f) { setCoverImage(f); setCoverPreview(URL.createObjectURL(f)); } }}
                      style={{ ...inputStyle, padding: '8px' }} />
                    {coverPreview && <img src={coverPreview} alt="" style={{ marginTop: 8, maxHeight: 100, border: `3px solid ${DARK}`, objectFit: 'cover' }} />}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={labelStyle}>Price</label>
                  <input placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={labelStyle}>Price Unit</label>
                  <input placeholder="ETB" value={form.price_unit} onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={labelStyle}>Manufacturer</label>
                  <input placeholder="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={labelStyle}>Stock Qty</label>
                  <input type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>Source URL</label>
                  <input placeholder="https://..." value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={labelStyle}>Category</label>
                  <input placeholder="Category name" value={form.category_name} onChange={e => setForm(f => ({ ...f, category_name: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                <input type="checkbox" id="order" checked={form.is_order_required}
                  onChange={e => setForm(f => ({ ...f, is_order_required: e.target.checked }))} style={{ width: 18, height: 18, accentColor: DARK }} />
                <label htmlFor="order" style={{ fontSize: 13, fontWeight: 900, color: DARK, textTransform: 'uppercase' }}>Order Required</label>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>Meta Title</label>
                  <input placeholder="Meta Title" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ flex: 2, minWidth: 300 }}>
                  <label style={labelStyle}>Meta Description</label>
                  <input placeholder="Meta Description" value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 16 }}>
                <button type="submit" disabled={submitting}
                  className="btn3d"
                  style={{ background: ACCENT, color: ICE, border: `3px solid ${DARK}`, padding: '14px 24px', fontWeight: 900, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', boxShadow: `5px 5px 0 ${DARK}` }}>
                  {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <span className="icon3d"><ExternalLink size={18} /></span>}
                  {submitting ? 'Saving...' : (editingId ? 'Update Post' : 'Publish Post')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Category Manager ── */}
        {showCatManager && <CategoryManager salesService={salesService} refreshTrigger={refreshTrigger} />}

        {/* ── Branch Manager ── */}
        {showBranchManager && <BranchManager salesService={salesService} refreshTrigger={refreshTrigger} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: DARK }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: 16, color: DARK }} />
            <p style={{ fontWeight: 900, textTransform: 'uppercase' }}>Loading posts...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {posts.map((post, idx) => (
              <div key={post.id} className="card3d" style={{
                background: ICE, border: `3px solid ${DARK}`, boxShadow: `6px 6px 0 ${DARK}`,
                animation: `rowIn3D 0.35s ease-out ${idx * 0.04}s both`, display: 'flex', flexDirection: 'column'
              }}>
                {(post.product_image || post.cover_image) && (
                  <div style={{ width: '100%', height: 180, overflow: 'hidden', borderBottom: `3px solid ${DARK}`, background: LAVENDER }}>
                    <img src={`http://localhost:5000${post.product_image || post.cover_image}`} alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: DARK }}>{post.title}</h3>
                    <span className="badge3d" style={{
                      padding: '4px 10px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                      border: `2px solid ${post.status === 'published' ? '#166534' : '#b45309'}`,
                      background: post.status === 'published' ? '#dcfce7' : '#fef3c7',
                      color: post.status === 'published' ? '#166534' : '#b45309'
                    }}>{post.status}</span>
                  </div>
                  {post.subtitle && <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: MID }}>{post.subtitle}</p>}
                  {post.price && <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 900, color: DARK }}><DollarSign size={14} /> {post.price} {post.price_unit}</p>}
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                    {post.category_name && <span style={{ padding: '4px 10px', border: `2px solid ${DARK}`, background: LAVENDER, color: DARK }}>{post.category_name}</span>}
                    {post.branch_name && <span style={{ padding: '4px 10px', border: `2px solid ${DARK}`, background: 'white', color: DARK }}>{post.branch_name}</span>}
                    {post.manufacturer && <span style={{ padding: '4px 10px', border: `2px solid ${DARK}`, background: '#f1f5f9', color: DARK }}>{post.manufacturer}</span>}
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                    {canAct && (
                      <>
                        <button onClick={() => startEdit(post)}
                          className="btn3d"
                          style={{ flex: 1, padding: '10px', border: `3px solid ${DARK}`, background: LAVENDER, color: DARK, cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${DARK}` }}>
                          Edit
                        </button>
                        {post.status !== 'published' && (
                          <button onClick={() => handlePublish(post.id)}
                            className="btn3d"
                            style={{ flex: 1, padding: '10px', border: `3px solid ${DARK}`, background: ACCENT, color: ICE, cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${DARK}` }}>
                            Publish
                          </button>
                        )}
                        <button onClick={() => handleDelete(post.id)}
                          className="btn3d"
                          style={{ padding: '10px 14px', border: `3px solid #991b1b`, background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', boxShadow: `3px 3px 0 #991b1b` }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && !showForm && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 24px', background: ICE, border: `3px solid ${DARK}`, boxShadow: `6px 6px 0 ${DARK}` }}>
                <span className="iconPop" style={{ display: 'block', fontSize: 48, marginBottom: 16 }}>🌍</span>
                <p style={{ fontSize: 18, fontWeight: 900, color: DARK, textTransform: 'uppercase', margin: '0 0 8px' }}>No health posts yet</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: MID, margin: 0 }}>Click "Scrape & Import" to pull data, or create a new post manually.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Inline Category Manager ── */
const CategoryManager = ({ salesService: svc, refreshTrigger }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const load = async () => { setLoading(true); try { const r = await svc.getCategories(); if (r?.status === 'success') setItems(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, [refreshTrigger]);
  
  const handleSave = async () => {
    if (!name.trim()) return alert('Name required');
    setSubmitting(true);
    try {
      const fd = new FormData(); fd.append('name', name); fd.append('description', desc);
      if (editId) await svc.updateCategory(editId, fd); else await svc.createCategory(fd);
      setName(''); setDesc(''); setEditId(null); await load();
    } catch (e) { alert(e?.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
  };
  const handleEdit = (item) => { setName(item.name); setDesc(item.description || ''); setEditId(item.id); };
  const handleDelete = async (id) => { if (!window.confirm('Delete category?')) return; try { await svc.deleteCategory(id); await load(); } catch (e) { alert('Failed'); } };
  
  return (
    <div style={{ background: ICE, border: `3px solid ${DARK}`, padding: 24, boxShadow: `6px 6px 0 ${DARK}`, marginBottom: 24, animation: 'fadeSlide 0.3s ease-out' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 900, color: DARK, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
        <span className="icon3d"><Layers size={18} /></span> Category Management
      </h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: `3px solid ${DARK}`, fontSize: 13, fontWeight: 700, outline: 'none' }} />
        <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 2, minWidth: 300, padding: '12px 16px', border: `3px solid ${DARK}`, fontSize: 13, fontWeight: 700, outline: 'none' }} />
        <button onClick={handleSave} disabled={submitting} className="btn3d" style={{ padding: '12px 24px', background: ACCENT, color: ICE, border: `3px solid ${DARK}`, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>
          {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
        </button>
        {editId && <button onClick={() => { setName(''); setDesc(''); setEditId(null); }} className="btn3d" style={{ padding: '12px 24px', background: LAVENDER, color: DARK, border: `3px solid ${DARK}`, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>Cancel</button>}
      </div>
      {loading ? <p style={{ color: DARK, fontWeight: 900, textTransform: 'uppercase' }}>Loading categories...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: DARK }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: ICE, fontWeight: 900, textTransform: 'uppercase' }}>ID</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: ICE, fontWeight: 900, textTransform: 'uppercase' }}>Name</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: ICE, fontWeight: 900, textTransform: 'uppercase' }}>Active</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', color: ICE, fontWeight: 900, textTransform: 'uppercase' }}>Actions</th>
          </tr></thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="row3d" style={{ borderBottom: `2px solid ${DARK}`, background: idx % 2 === 0 ? 'white' : LAVENDER }}>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: DARK }}>{item.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 900, color: DARK }}>{item.name}</td>
                <td style={{ padding: '12px 16px' }}><span className="badge3d" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 900, border: `2px solid ${item.is_active ? '#166534' : '#b45309'}`, background: item.is_active ? '#dcfce7' : '#fffbeb', color: item.is_active ? '#166534' : '#b45309', textTransform: 'uppercase' }}>{item.is_active ? 'Yes' : 'No'}</span></td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(item)} className="btn3d" style={{ padding: '6px 12px', border: `2px solid ${DARK}`, background: ICE, cursor: 'pointer', fontWeight: 900, fontSize: 11, marginRight: 8, boxShadow: `2px 2px 0 ${DARK}` }}>EDIT</button>
                  <button onClick={() => handleDelete(item.id)} className="btn3d" style={{ padding: '6px 12px', border: `2px solid #991b1b`, background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontWeight: 900, fontSize: 11, boxShadow: `2px 2px 0 #991b1b` }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ── Inline Branch Manager ── */
const BranchManager = ({ salesService: svc, refreshTrigger }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', working_hours: '', manager_name: '', is_active: true });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const load = async () => { setLoading(true); try { const r = await svc.getBranches(); if (r?.status === 'success') setItems(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, [refreshTrigger]);

  const resetForm = () => { setForm({ name: '', code: '', address: '', phone: '', working_hours: '', manager_name: '', is_active: true }); setEditId(null); setShowForm(false); };

  const openForm = (item) => {
    if (item) {
      setEditId(item.id);
      setForm({ name: item.name, code: item.code || '', address: item.address || '', phone: item.phone || '', working_hours: item.working_hours || '', manager_name: item.manager_name || '', is_active: item.is_active === 1 || item.is_active === true });
    } else { resetForm(); setShowForm(true); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showMsg('error', 'Branch name is required'); return; }
    setSubmitting(true);
    try {
      if (editId) await svc.updateBranch(editId, { ...form, is_active: form.is_active ? 1 : 0 });
      else await svc.createBranch({ ...form, is_active: form.is_active ? 1 : 0 });
      showMsg('success', editId ? 'Branch updated' : 'Branch created');
      resetForm();
      await load();
    } catch (e) { showMsg('error', e?.response?.data?.message || 'Failed to save branch'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete branch?')) return; try { await svc.deleteBranch(id); showMsg('success', 'Branch deleted'); await load(); } catch { showMsg('error', 'Failed to delete'); } };

  const fldIcon = (icon, label, key, ph) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {React.cloneElement(icon, { size: 16, style: { position: 'absolute', left: 14, top: 14, color: DARK } })}
        <input placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '12px 12px 12px 42px', border: `3px solid ${DARK}`, borderRadius: 0, fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box', boxShadow: `3px 3px 0 ${DARK}` }} />
      </div>
    </div>
  );

  return (
    <div style={{ background: ICE, border: `3px solid ${DARK}`, marginBottom: 24, boxShadow: `6px 6px 0 ${DARK}`, overflow: 'hidden', animation: 'fadeSlide 0.3s ease-out' }}>
      {msg.text && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', background: msg.type === 'success' ? ICE : '#fef2f2', border: `3px solid ${msg.type === 'success' ? DARK : '#991b1b'}`, color: msg.type === 'success' ? DARK : '#991b1b', fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `4px 4px 0 ${msg.type === 'success' ? DARK : '#991b1b'}` }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}
      <div style={{ padding: '18px 24px', borderBottom: `3px solid ${DARK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DARK }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 900, color: ICE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span className="icon3d"><Building2 size={20} color={ICE} /></span> Branch Management
        </div>
        <button onClick={() => { if (showForm) resetForm(); else openForm(); }}
          className="btn3d"
          style={{ padding: '10px 16px', background: showForm ? '#ef4444' : ACCENT, color: showForm ? 'white' : ICE, border: `3px solid ${showForm ? '#991b1b' : DARK}`, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${showForm ? '#991b1b' : DARK}` }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Branch'}
        </button>
      </div>
      <div style={{ padding: 24 }}>
        {showForm && (
          <div style={{ background: LAVENDER, border: `3px solid ${DARK}`, padding: 24, marginBottom: 24, boxShadow: `4px 4px 0 ${DARK}` }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 900, color: DARK, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
              <span className="iconPop">{editId ? <Edit3 size={18} color={DARK} /> : <Plus size={18} color={DARK} />}</span>
              {editId ? 'Edit Branch' : 'New Branch'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {fldIcon(<Building2 />, 'Branch Name *', 'name', 'e.g. Downtown Sales')}
              {fldIcon(<Hash />, 'Code', 'code', 'e.g. DTP')}
              {fldIcon(<Phone />, 'Phone', 'phone', '+251-XXX-XXXX')}
              {fldIcon(<User />, 'Manager Name', 'manager_name', 'Manager name')}
              {fldIcon(<Clock />, 'Working Hours', 'working_hours', 'Mon-Sat 8AM-6PM')}
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 0' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 20, height: 20, accentColor: DARK, cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, fontWeight: 900, color: DARK, textTransform: 'uppercase' }}>Active Branch</span>
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: DARK, marginBottom: 4, textTransform: 'uppercase' }}>Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 14, top: 14, color: DARK }} />
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                    style={{ width: '100%', padding: '12px 12px 12px 42px', border: `3px solid ${DARK}`, borderRadius: 0, fontSize: 14, fontWeight: 700, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: `3px 3px 0 ${DARK}` }}
                    placeholder="Full address" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={submitting}
                className="btn3d"
                style={{ padding: '12px 24px', background: submitting ? '#94a3b8' : ACCENT, color: ICE, border: `3px solid ${DARK}`, fontWeight: 900, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <span className="icon3d"><Save size={16} /></span>}
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} className="btn3d" style={{ padding: '12px 24px', background: 'white', color: DARK, border: `3px solid ${DARK}`, fontWeight: 900, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${DARK}` }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: DARK }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: DARK }}>
            <span className="iconPop" style={{ display: 'inline-block', fontSize: 40, marginBottom: 12 }}>🏬</span>
            <p style={{ fontWeight: 900, margin: '0 0 6px', fontSize: 16, textTransform: 'uppercase' }}>No branches yet</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Click "Add Branch" to create one</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {items.map((item, idx) => (
              <div key={item.id} className="card3d" style={{ background: LAVENDER, border: `3px solid ${DARK}`, padding: 20, animation: `rowIn3D 0.3s ease-out ${idx*0.05}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="iconPop" style={{ width: 44, height: 44, background: ICE, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}` }}>
                      <Building2 size={20} color={DARK} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: DARK, textTransform: 'uppercase' }}>{item.name}</h4>
                      {item.code && <span style={{ fontSize: 12, color: ACCENT, fontWeight: 900, fontFamily: 'monospace' }}>#{item.code}</span>}
                    </div>
                  </div>
                  <span className="badge3d" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 900, border: `2px solid ${item.is_active ? '#166534' : '#b45309'}`, background: item.is_active ? '#dcfce7' : '#fffbeb', color: item.is_active ? '#166534' : '#b45309', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                    {item.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: DARK, fontWeight: 700 }}>
                  {item.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} color={MID} /> {item.phone}</div>}
                  {item.manager_name && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} color={MID} /> {item.manager_name}</div>}
                  {item.working_hours && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={14} color={MID} /> {item.working_hours}</div>}
                  {item.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={14} color={MID} style={{ marginTop: 2 }} /> {item.address}</div>}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `2px solid ${DARK}` }}>
                  <button onClick={() => openForm(item)}
                    className="btn3d"
                    style={{ flex: 1, padding: '10px', background: ICE, color: DARK, border: `3px solid ${DARK}`, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `3px 3px 0 ${DARK}` }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="btn3d"
                    style={{ flex: 1, padding: '10px', background: '#fef2f2', color: '#991b1b', border: `3px solid #991b1b`, cursor: 'pointer', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', boxShadow: `3px 3px 0 #991b1b` }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHealthPublisher;