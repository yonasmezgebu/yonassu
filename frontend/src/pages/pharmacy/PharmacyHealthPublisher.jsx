import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Globe, ExternalLink, Search, DollarSign, CheckCircle, XCircle, Building2, Layers, X, Edit3, MapPin, Phone, Clock, User, Hash, Save, Shield, ShieldCheck } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../hooks/useAuth';
import successSound from '../../assets/notification/info.mp3';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import './StockOperations.css';

const PharmacyHealthPublisher = () => {
  const { user } = useAuth();
  const isManager = user?.roles?.some(r => ['Pharmacy Manager', 'Admin', 'CEO'].includes(r));

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [form, setForm] = useState({
    title: '', subtitle: '', content: '', source_url: '',
    category_id: '', category_name: '', product_id: '', product_name: '',
    price: '', price_unit: '', manufacturer: '',
    stock_quantity: '', reorder_level: '', is_prescription_required: false,
    status: 'draft', meta_title: '', meta_description: ''
  });

  const [drugImage, setDrugImage] = useState(null);
  const [drugPreview, setDrugPreview] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const drugFileRef = useRef(null);
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
      stock_quantity: '', reorder_level: '', is_prescription_required: false,
      status: 'draft', meta_title: '', meta_description: ''
    });
    setDrugImage(null);
    setDrugPreview('');
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
      is_prescription_required: prod.is_prescription_required || false,
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
      is_prescription_required: !!post.is_prescription_required,
      status: post.status || 'draft',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || ''
    });
    setShowForm(true);
    // Auto-scroll to the card if needed, but since it renders in-place, it's fine.
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
      if (drugImage) fd.append('drug_image', drugImage);
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

  // Reusable Form component for both New and Edit
  const renderForm = (isEditMode) => (
    <div className="card-container" style={{ padding: 24, borderTop: `4px solid ${isEditMode ? 'var(--color-warning)' : 'var(--color-primary)'}`, animation: 'slideIn 0.2s ease', background: 'var(--color-bg-card)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ImageIcon size={18} color={isEditMode ? 'var(--color-warning)' : 'var(--color-primary)'} /> 
        {isEditMode ? 'Edit Health Post' : 'Create New Health Post'}
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Scraped Data Selectors */}
        {!isEditMode && scrapedCategories.length > 0 && (
          <div style={{ padding: 16, background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', fontSize: 13 }}>Scraped Categories (Click to autofill)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {scrapedCategories.map(cat => (
                <button key={cat.id} type="button" onClick={() => fillFromCategory(cat)}
                  className="btn-action-secondary btn-gold-hover" style={{ padding: '6px 12px', fontSize: 12 }}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', fontSize: 13 }}>Scraped Products (Click to autofill)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
              {scrapedProducts.map(prod => (
                <button key={prod.id} type="button" onClick={() => fillFromProduct(prod)}
                  className="btn-action-secondary btn-gold-hover" style={{ padding: '6px 12px', fontSize: 12 }}>
                  {prod.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 250 }}>
            <div>
              <label className="pso-label">Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input className="pso-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="pso-label">Subtitle</label>
              <input className="pso-input" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div>
              <label className="pso-label">Content / Description</label>
              <textarea className="pso-input" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 200 }}>
            <div>
              <label className="pso-label">Drug Image</label>
              <input type="file" accept="image/*" ref={drugFileRef} className="pso-input" style={{ padding: '6px 12px' }}
                onChange={e => { const f = e.target.files[0]; if (f) { setDrugImage(f); setDrugPreview(URL.createObjectURL(f)); } }} />
              {drugPreview && <img src={drugPreview} alt="" style={{ marginTop: 8, maxHeight: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
            </div>
            <div>
              <label className="pso-label">Cover Image</label>
              <input type="file" accept="image/*" ref={coverFileRef} className="pso-input" style={{ padding: '6px 12px' }}
                onChange={e => { const f = e.target.files[0]; if (f) { setCoverImage(f); setCoverPreview(URL.createObjectURL(f)); } }} />
              {coverPreview && <img src={coverPreview} alt="" style={{ marginTop: 8, maxHeight: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
          <div><label className="pso-label">Price</label><input className="pso-input" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          <div><label className="pso-label">Price Unit</label><input className="pso-input" placeholder="ETB" value={form.price_unit} onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))} /></div>
          <div><label className="pso-label">Manufacturer</label><input className="pso-input" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} /></div>
          <div><label className="pso-label">Stock Qty</label><input className="pso-input" type="number" placeholder="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div><label className="pso-label">Source URL</label><input className="pso-input" placeholder="https://..." value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} /></div>
          <div><label className="pso-label">Category</label><input className="pso-input" placeholder="Category name" value={form.category_name} onChange={e => setForm(f => ({ ...f, category_name: e.target.value }))} /></div>
          <div><label className="pso-label">Status</label>
            <select className="pso-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input type="checkbox" id={`prescription-${isEditMode ? editingId : 'new'}`} checked={form.is_prescription_required}
            onChange={e => setForm(f => ({ ...f, is_prescription_required: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
          <label htmlFor={`prescription-${isEditMode ? editingId : 'new'}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Prescription Required</label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <div><label className="pso-label">Meta Title</label><input className="pso-input" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} /></div>
          <div><label className="pso-label">Meta Description</label><input className="pso-input" value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} /></div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button type="submit" disabled={submitting} className="btn-action-primary" style={{ padding: '10px 20px' }}>
            {submitting ? <SegmentedSpinner size={16} spinning={true} /> : <Save size={16} />}
            {submitting ? 'Saving...' : (isEditMode ? 'Update Post' : 'Publish Post')}
          </button>
          <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }} className="btn-action-secondary" style={{ padding: '10px 20px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="pso-root">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pub-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          background: var(--color-bg-card);
          border-left: 4px solid var(--color-success);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 14px 20px; min-width: 280px;
          animation: slideIn .2s ease;
          display: flex; gap: 12px; align-items: center;
          font-size: 14px; font-weight: 500;
          color: var(--color-text-primary);
        }
        .pub-toast.error { border-left-color: var(--color-danger); }

        .pub-card {
          transition: transform var(--transition), box-shadow var(--transition);
        }
        .pub-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* Fully styled enterprise buttons for header and specific actions */
        .btn-action-primary {
          background: var(--color-primary);
          color: white;
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-md);
          padding: 0 16px;
          height: 36px;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all var(--transition);
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }
        .btn-action-primary:hover:not(:disabled) {
          background: var(--color-gold, #FBBF24);
          color: #111827;
          border-color: var(--color-gold-border, #F59E0B);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .btn-action-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-action-secondary {
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0 16px;
          height: 36px;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all var(--transition);
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }
        .btn-action-secondary:hover:not(:disabled) {
          background: var(--color-gold, #FBBF24);
          color: #111827;
          border-color: var(--color-gold-border, #F59E0B);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .btn-action-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-action-secondary.active {
          background: var(--color-bg-page);
          border-color: var(--color-border);
        }

        .toggle-switch {
          width: 40px; height: 22px; border-radius: 11px;
          position: relative; cursor: pointer;
          background: var(--color-border);
          transition: background 0.3s;
          border: none; outline: none; padding: 0;
        }
        .toggle-switch.active { background: var(--color-success); }
        .toggle-knob {
          width: 18px; height: 18px; border-radius: 50%;
          background: white; position: absolute; top: 2px; left: 2px;
          transition: left 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,.2);
        }
        .toggle-switch.active .toggle-knob { left: 20px; }
        .toggle-switch:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {settingMsg.text && (
        <div className={`pub-toast ${settingMsg.type === 'error' ? 'error' : ''}`}>
          {settingMsg.type === 'success' ? <CheckCircle size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-danger)" />}
          <span style={{ flex: 1 }}>{settingMsg.text}</span>
          <button onClick={() => setSettingMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pso-header">
        <div className="pso-header-left">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
            <Globe size={20} />
          </div>
          <div>
            <h1 className="pso-title">Health Publisher</h1>
            <p className="pso-subtitle">Import · Educate · Publish</p>
          </div>
        </div>
        <div className="pso-header-right">
          
          <button onClick={handleRefresh} className="btn-action-secondary" disabled={spinning || loading}>
            <SegmentedSpinner size={15} spinning={spinning || loading} />
            Refresh
          </button>

          {isManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', height: 36 }}>
              {workerCanPost ? <ShieldCheck size={16} color="var(--color-success)" /> : <Shield size={16} color="var(--color-text-muted)" />}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Worker Access</span>
              <button className={`toggle-switch ${workerCanPost ? 'active' : ''}`} onClick={handleToggleWorkerPost} disabled={togglingPost}>
                <div className="toggle-knob"></div>
              </button>
            </div>
          )}

          {isManager && (
            <>
              <button onClick={() => { setShowCatManager(s => !s); setShowBranchManager(false); }} className={`btn-action-secondary ${showCatManager ? 'active' : ''}`}>
                <Layers size={15} /> {showCatManager ? 'Close Cats' : 'Manage Cats'}
              </button>
              <button onClick={() => { setShowBranchManager(s => !s); setShowCatManager(false); }} className={`btn-action-secondary ${showBranchManager ? 'active' : ''}`}>
                <Building2 size={15} /> {showBranchManager ? 'Close Branches' : 'Manage Branches'}
              </button>
              <button onClick={handleScrape} disabled={scraping} className="btn-action-secondary">
                {scraping ? <SegmentedSpinner size={15} spinning={true} /> : <Search size={15} />}
                {scraping ? 'Scraping...' : 'Scrape & Import'}
              </button>
            </>
          )}

          {canAct && (
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }} className="btn-action-primary">
              {showForm && !editingId ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Post</>}
            </button>
          )}

          {!canAct && !isManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-info)' }}>
              <Shield size={14} color="var(--color-info)" />
              <span style={{ fontSize: 12, color: 'var(--color-info)', fontWeight: 600 }}>View Only</span>
            </div>
          )}
        </div>
      </div>

      <div className="pso-content">
        <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          
          {/* New Post Form (At top) */}
          {showForm && !editingId && (
            <div style={{ marginBottom: 24 }}>
              {renderForm(false)}
            </div>
          )}

          {/* ── Category Manager ── */}
          {showCatManager && <CategoryManager pharmacyService={pharmacyService} refreshTrigger={refreshTrigger} />}

          {/* ── Branch Manager ── */}
          {showBranchManager && <BranchManager pharmacyService={pharmacyService} refreshTrigger={refreshTrigger} />}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <SegmentedSpinner size={32} spinning={true} />
              <p style={{ marginTop: 16, fontWeight: 500 }}>Loading posts...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {posts.map((post) => (
                <React.Fragment key={post.id}>
                  {/* Inline Edit Form - Replaces the card if editing this specific post */}
                  {showForm && editingId === post.id ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      {renderForm(true)}
                    </div>
                  ) : (
                    <div className="card-container pub-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {(post.drug_image || post.cover_image) && (
                        <div style={{ width: '100%', height: 180, overflow: 'hidden', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-page)' }}>
                          <img src={`http://localhost:5000${post.drug_image || post.cover_image}`} alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                      )}
                      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{post.title}</h3>
                          <span className="pso-badge" style={{
                            background: post.status === 'published' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                            color: post.status === 'published' ? 'var(--color-success)' : 'var(--color-warning)',
                          }}>{post.status}</span>
                        </div>
                        {post.subtitle && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{post.subtitle}</p>}
                        
                        {post.price && (
                          <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={16} /> {post.price} {post.price_unit}
                          </p>
                        )}
                        
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                          {post.category_name && <span className="pso-badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{post.category_name}</span>}
                          {post.branch_name && <span className="pso-badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{post.branch_name}</span>}
                          {post.manufacturer && <span className="pso-badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>{post.manufacturer}</span>}
                        </div>
                        
                        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                          {canAct && (
                            <>
                              <button onClick={() => startEdit(post)} className="btn-action-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                Edit
                              </button>
                              {post.status !== 'published' && (
                                <button onClick={() => handlePublish(post.id)} className="btn-action-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                  Publish
                                </button>
                              )}
                              <button onClick={() => handleDelete(post.id)} className="btn-action-secondary" style={{ padding: '8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger-bg)', background: 'var(--color-danger-bg)' }}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {posts.length === 0 && !showForm && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 24px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <Globe size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>No health posts yet</p>
                  <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>Click "Scrape & Import" to pull data, or create a new post manually.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Inline Category Manager ── */
const CategoryManager = ({ pharmacyService: svc, refreshTrigger }) => {
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
    <div className="card-container" style={{ padding: 24, marginBottom: 24, borderTop: '4px solid var(--color-info)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers size={18} color="var(--color-info)" /> Category Management
      </h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="pso-input" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <input className="pso-input" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 2, minWidth: 300 }} />
        <button onClick={handleSave} disabled={submitting} className="btn-action-primary" style={{ padding: '0 24px' }}>
          {submitting ? 'Saving...' : editId ? 'Update' : 'Add'}
        </button>
        {editId && <button onClick={() => { setName(''); setDesc(''); setEditId(null); }} className="btn-action-secondary" style={{ padding: '0 24px' }}>Cancel</button>}
      </div>
      {loading ? <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading categories...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="pso-table" style={{ width: '100%', minWidth: 500 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="pub-card">
                  <td style={{ color: 'var(--color-text-secondary)' }}>{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>
                    <span className="pso-badge" style={{ background: item.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: item.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {item.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(item)} className="btn-action-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="btn-action-secondary" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--color-danger)', borderColor: 'var(--color-danger-bg)', background: 'var(--color-danger-bg)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── Inline Branch Manager ── */
const BranchManager = ({ pharmacyService: svc, refreshTrigger }) => {
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
      <label className="pso-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {React.cloneElement(icon, { size: 16, style: { position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' } })}
        <input className="pso-input" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ paddingLeft: 36 }} />
      </div>
    </div>
  );

  return (
    <div className="card-container" style={{ marginBottom: 24, padding: 0, overflow: 'hidden', borderTop: '4px solid var(--color-info)' }}>
      {msg.text && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', background: 'var(--color-bg-card)', borderLeft: `4px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`, color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-md)' }}>
          {msg.type === 'success' ? <CheckCircle size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-danger)" />}
          {msg.text}
        </div>
      )}
      
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-page)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          <Building2 size={18} color="var(--color-info)" /> Branch Management
        </div>
        <button onClick={() => { if (showForm) resetForm(); else openForm(); }} className="btn-action-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Branch</>}
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {showForm && (
          <div style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editId ? <Edit3 size={16} /> : <Plus size={16} />}
              {editId ? 'Edit Branch' : 'New Branch'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {fldIcon(<Building2 />, 'Branch Name *', 'name', 'e.g. Downtown Pharmacy')}
              {fldIcon(<Hash />, 'Code', 'code', 'e.g. DTP')}
              {fldIcon(<Phone />, 'Phone', 'phone', '+251-XXX-XXXX')}
              {fldIcon(<User />, 'Manager Name', 'manager_name', 'Manager name')}
              {fldIcon(<Clock />, 'Working Hours', 'working_hours', 'Mon-Sat 8AM-6PM')}
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 4, height: '100%', paddingTop: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Active Branch</span>
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="pso-label">Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                    className="pso-input" style={{ paddingLeft: 36, minHeight: 60, resize: 'vertical' }}
                    placeholder="Full address" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={submitting} className="btn-action-primary" style={{ padding: '10px 24px' }}>
                {submitting ? <SegmentedSpinner size={16} spinning={true} /> : <Save size={16} />}
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} className="btn-action-secondary" style={{ padding: '10px 24px' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
            <SegmentedSpinner size={32} spinning={true} />
            <div style={{ marginTop: 12 }}>Loading branches...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--color-text-muted)' }}>
            <Building2 size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, margin: '0 0 6px', fontSize: 16, color: 'var(--color-text-primary)' }}>No branches yet</p>
            <p style={{ margin: 0, fontSize: 14 }}>Click "Add Branch" to create one</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {items.map((item) => (
              <div key={item.id} className="card-container pub-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--color-info-bg)', color: 'var(--color-info)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{item.name}</h4>
                      {item.code && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>#{item.code}</span>}
                    </div>
                  </div>
                  <span className="pso-badge" style={{ background: item.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: item.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {item.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> {item.phone}</div>}
                  {item.manager_name && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> {item.manager_name}</div>}
                  {item.working_hours && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={14} /> {item.working_hours}</div>}
                  {item.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{item.address}</span></div>}
                </div>
                
                <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <button onClick={() => openForm(item)} className="btn-action-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn-action-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger-bg)', background: 'var(--color-danger-bg)' }}>
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

export default PharmacyHealthPublisher;