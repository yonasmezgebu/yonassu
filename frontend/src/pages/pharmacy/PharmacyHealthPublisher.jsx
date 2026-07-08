import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Image as ImageIcon, Trash2, Globe, ExternalLink, Search, Package, Pill, DollarSign, CheckCircle, XCircle, Building2, Layers, X, Edit3, MapPin, Phone, Clock, User, Hash, Save } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import successSound from '../../assets/notification/info.mp3';

const cardStyle = {
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'white',
};

const cardTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: '1rem',
  fontWeight: 700,
  color: '#224f94',
};

const cardBodyStyle = {
  padding: 24,
};

const btnPrimaryStyle = {
  padding: '10px 24px',
  background: '#224f94',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const PharmacyHealthPublisher = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [showBranchManager, setShowBranchManager] = useState(false);

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
  }, []);

  const loadPosts = async () => {
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

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 8px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={24} color="#224f94" /> Pharmacy & Health Publisher
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Import and publish health content from pharmacy data</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { setShowCatManager(s => !s); setShowBranchManager(false); }}
            style={{ ...btnPrimaryStyle, background: showCatManager ? '#ef4444' : '#8b5cf6' }}>
            <Layers size={18} /> {showCatManager ? 'Close Categories' : 'Manage Categories'}
          </button>
          <button onClick={() => { setShowBranchManager(s => !s); setShowCatManager(false); }}
            style={{ ...btnPrimaryStyle, background: showBranchManager ? '#ef4444' : '#0891b2' }}>
            <Building2 size={18} /> {showBranchManager ? 'Close Branches' : 'Manage Branches'}
          </button>
          <button onClick={handleScrape} disabled={scraping}
            style={{ ...btnPrimaryStyle, background: '#059669' }}>
            {scraping ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={18} />}
            {scraping ? 'Scraping...' : 'Scrape & Import'}
          </button>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
            style={{ ...btnPrimaryStyle, background: showForm ? '#ef4444' : '#224f94' }}>
            {showForm ? 'Cancel' : <><Plus size={18} /> New Post</>}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={cardHeaderStyle}>
            <div style={cardTitleStyle}><ImageIcon size={20} /> {editingId ? 'Edit' : 'Create'} Health Post</div>
          </div>
          <div style={cardBodyStyle}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Scraped Data Selectors */}
              {!editingId && scrapedCategories.length > 0 && (
                <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#166534' }}>Scraped Categories — click to fill form</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {scrapedCategories.map(cat => (
                      <button key={cat.id} type="button" onClick={() => fillFromCategory(cat)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #86efac', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, margin: '12px 0 8px', color: '#166534' }}>Scraped Products — click to fill form</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                    {scrapedProducts.map(prod => (
                      <button key={prod.id} type="button" onClick={() => fillFromProduct(prod)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #86efac', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                        {prod.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input placeholder="Title *" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem', fontWeight: 600 }} />
                  <input placeholder="Subtitle" value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                  <textarea placeholder="Content / Description" rows={5} value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Drug Image</label>
                    <input type="file" accept="image/*" ref={drugFileRef}
                      onChange={e => { const f = e.target.files[0]; if (f) { setDrugImage(f); setDrugPreview(URL.createObjectURL(f)); } }}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.8rem' }} />
                    {drugPreview && <img src={drugPreview} alt="" style={{ marginTop: 6, maxHeight: 80, borderRadius: 6, objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Cover Image</label>
                    <input type="file" accept="image/*" ref={coverFileRef}
                      onChange={e => { const f = e.target.files[0]; if (f) { setCoverImage(f); setCoverPreview(URL.createObjectURL(f)); } }}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.8rem' }} />
                    {coverPreview && <img src={coverPreview} alt="" style={{ marginTop: 6, maxHeight: 80, borderRadius: 6, objectFit: 'cover' }} />}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Price</label>
                  <input placeholder="0.00" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Price Unit</label>
                  <input placeholder="ETB" value={form.price_unit}
                    onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Manufacturer</label>
                  <input placeholder="Manufacturer" value={form.manufacturer}
                    onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Stock Qty</label>
                  <input type="number" placeholder="0" value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Source URL</label>
                  <input placeholder="https://..." value={form.source_url}
                    onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Category</label>
                  <input placeholder="Category name" value={form.category_name}
                    onChange={e => setForm(f => ({ ...f, category_name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="prescription" checked={form.is_prescription_required}
                  onChange={e => setForm(f => ({ ...f, is_prescription_required: e.target.checked }))} />
                <label htmlFor="prescription" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Prescription Required</label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <input placeholder="Meta Title" value={form.meta_title}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
                <input placeholder="Meta Description" value={form.meta_description}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  style={{ flex: 2, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button type="submit" disabled={submitting}
                  style={{ ...btnPrimaryStyle, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={18} />}
                  {submitting ? 'Saving...' : (editingId ? 'Update & Redirect' : 'Publish & Redirect')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Manager ── */}
      {showCatManager && <CategoryManager pharmacyService={pharmacyService} />}

      {/* ── Branch Manager ── */}
      {showBranchManager && <BranchManager pharmacyService={pharmacyService} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p>Loading posts...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {posts.map(post => (
            <div key={post.id} style={{
              background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'
            }}>
              {(post.drug_image || post.cover_image) && (
                <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#f1f5f9' }}>
                  <img src={`http://localhost:5000${post.drug_image || post.cover_image}`} alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{post.title}</h3>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                    background: post.status === 'published' ? '#dcfce7' : '#fffbeb',
                    color: post.status === 'published' ? '#166534' : '#b45309'
                  }}>{post.status}</span>
                </div>
                {post.subtitle && <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b' }}>{post.subtitle}</p>}
                {post.price && <p style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}><DollarSign size={14} /> {post.price} {post.price_unit}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.75rem', color: '#94a3b8' }}>
                  {post.category_name && <span style={{ padding: '2px 8px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>{post.category_name}</span>}
                  {post.branch_name && <span style={{ padding: '2px 8px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>{post.branch_name}</span>}
                  {post.manufacturer && <span style={{ padding: '2px 8px', borderRadius: 999, background: '#f8fafc', color: '#64748b' }}>{post.manufacturer}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(post)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    Edit
                  </button>
                  {post.status !== 'published' && (
                    <button onClick={() => handlePublish(post.id)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                      Publish
                    </button>
                  )}
                  <button onClick={() => handleDelete(post.id)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #fca5a5', background: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && !showForm && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              <Globe size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>No health posts yet</p>
              <p style={{ fontSize: '0.85rem' }}>Click "Scrape & Import" to pull data from the pharmacy, or create a new post manually.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Inline Category Manager ── */
const CategoryManager = ({ pharmacyService: svc }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const load = async () => { try { const r = await svc.getCategories(); if (r?.status === 'success') setItems(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
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
  const btn = { padding: '8px 16px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: 'white' };
  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <div style={cardHeaderStyle}><div style={cardTitleStyle}><Layers size={20} /> Category Management</div></div>
      <div style={cardBodyStyle}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
          <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ flex: 2, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
          <button onClick={handleSave} disabled={submitting} style={{ ...btn, background: '#8b5cf6', opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving...' : editId ? 'Update' : 'Add'}</button>
          {editId && <button onClick={() => { setName(''); setDesc(''); setEditId(null); }} style={{ ...btn, background: '#64748b' }}>Cancel</button>}
        </div>
        {loading ? <p style={{ color: '#94a3b8' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: 10, textAlign: 'left', color: '#475569' }}>ID</th>
              <th style={{ padding: 10, textAlign: 'left', color: '#475569' }}>Name</th>
              <th style={{ padding: 10, textAlign: 'left', color: '#475569' }}>Active</th>
              <th style={{ padding: 10, textAlign: 'right', color: '#475569' }}>Actions</th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>{item.id}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: 10 }}><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: item.is_active ? '#dcfce7' : '#fffbeb', color: item.is_active ? '#166534' : '#b45309' }}>{item.is_active ? 'Yes' : 'No'}</span></td>
                  <td style={{ padding: 10, textAlign: 'right' }}>
                    <button onClick={() => handleEdit(item)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', marginRight: 4 }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ── Inline Branch Manager ── */
const BranchManager = ({ pharmacyService: svc }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', working_hours: '', manager_name: '', is_active: true });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const load = async () => { try { const r = await svc.getBranches(); if (r?.status === 'success') setItems(r.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

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
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {React.cloneElement(icon, { size: 16, style: { position: 'absolute', left: 12, top: 13, color: '#94a3b8' } })}
        <input placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {msg.text && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px', borderRadius: 12, background: msg.type === 'success' ? '#d1fae5' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#6ee7b7' : '#fecaca'}`, color: msg.type === 'success' ? '#065f46' : '#991b1b', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1rem', fontWeight: 700, color: '#224f94' }}>
          <Building2 size={20} color="#f59e0b" /> Branch Management
        </div>
        <button onClick={() => { if (showForm) resetForm(); else openForm(); }}
          style={{ padding: '8px 16px', background: showForm ? '#475569' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Branch'}
        </button>
      </div>
      <div style={{ padding: 24 }}>
        {showForm && (
          <div style={{ background: '#fffbeb', borderRadius: 12, border: '2px solid #fde68a', padding: 20, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editId ? <Edit3 size={16} color="#f59e0b" /> : <Plus size={16} color="#f59e0b" />}
              {editId ? 'Edit Branch' : 'New Branch'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fldIcon(<Building2 />, 'Branch Name *', 'name', 'e.g. Downtown Pharmacy')}
              {fldIcon(<Hash />, 'Code', 'code', 'e.g. DTP')}
              {fldIcon(<Phone />, 'Phone', 'phone', '+251-XXX-XXXX')}
              {fldIcon(<User />, 'Manager Name', 'manager_name', 'Manager name')}
              {fldIcon(<Clock />, 'Working Hours', 'working_hours', 'Mon-Sat 8AM-6PM')}
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 0' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Active</span>
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                    style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', minHeight: 55, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    placeholder="Full address" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={handleSave} disabled={submitting}
                style={{ padding: '10px 20px', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94a3b8' }}>
            <Building2 size={40} style={{ color: '#fde68a', marginBottom: 10 }} />
            <p style={{ fontWeight: 700, margin: '0 0 4px' }}>No branches yet</p>
            <p style={{ margin: 0, fontSize: 13 }}>Click "Add Branch" to create one</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, transition: 'transform 0.15s, box-shadow 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={18} color="#f59e0b" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0f172a' }}>{item.name}</h4>
                      {item.code && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>#{item.code}</span>}
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: item.is_active ? '#dcfce7' : '#f1f5f9', color: item.is_active ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {item.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#64748b' }}>
                  {item.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} style={{ color: '#94a3b8' }} /> {item.phone}</div>}
                  {item.manager_name && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={13} style={{ color: '#94a3b8' }} /> {item.manager_name}</div>}
                  {item.working_hours && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} style={{ color: '#94a3b8' }} /> {item.working_hours}</div>}
                  {item.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}><MapPin size={13} style={{ color: '#94a3b8', marginTop: 1 }} /> {item.address}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => openForm(item)}
                    style={{ flex: 1, padding: '6px 10px', background: '#fffbeb', color: '#d97706', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Edit3 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    style={{ flex: 1, padding: '6px 10px', background: '#fef2f2', color: '#e11d48', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Trash2 size={13} /> Delete
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