import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Globe, ExternalLink, Search, DollarSign, CheckCircle, XCircle, Building2, Layers, X, Edit3, MapPin, Phone, Clock, User, Hash, Save, Shield, ShieldCheck } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './PharmacyHealthPublisher.module.css';

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
      content: `Manufacturer: ${prod.manufacturer || 'N/A'}\nCategory: ${prod.category_name || ''}\nCost Price: ${prod.price || ''} ${prod.price_unit || ''}`,
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

  // ── Reusable Form ──────────────────────────────────────────
  const renderForm = (isEditMode) => (
    <div className={isEditMode ? styles.formCardEdit : styles.formCard}>
      <h3 className={styles.formTitle}>
        <ImageIcon size={18} color={isEditMode ? '#D97706' : '#2563EB'} />
        {isEditMode ? 'Edit Health Post' : 'Create New Health Post'}
      </h3>

      <form onSubmit={handleSubmit} className={styles.formInner}>

        {/* Scraped Data Selectors */}
        {!isEditMode && scrapedCategories.length > 0 && (
          <div className={styles.scrapedPanel}>
            <p className={styles.scrapedPanelTitle}>Scraped Categories — click to autofill</p>
            <div className={styles.chipGroup} style={{ marginBottom: 12 }}>
              {scrapedCategories.map(cat => (
                <button key={cat.id} type="button" onClick={() => fillFromCategory(cat)} className={styles.chip}>
                  {cat.name}
                </button>
              ))}
            </div>
            <p className={styles.scrapedPanelTitle}>Scraped Products — click to autofill</p>
            <div className={styles.chipGroup}>
              {scrapedProducts.map(prod => (
                <button key={prod.id} type="button" onClick={() => fillFromProduct(prod)} className={styles.chip}>
                  {prod.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main row: text fields + image uploads */}
        <div className={styles.formRow}>
          <div className={styles.formColMain}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title <span style={{ color: '#DC2626' }}>*</span></label>
              <input className={styles.formInput} required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subtitle</label>
              <input className={styles.formInput} value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Content / Description</label>
              <textarea className={styles.formInput} rows={4} value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
          </div>

          <div className={styles.formColSide}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Drug Image</label>
              <input type="file" accept="image/*" ref={drugFileRef} className={styles.fileInput}
                onChange={e => { const f = e.target.files[0]; if (f) { setDrugImage(f); setDrugPreview(URL.createObjectURL(f)); } }} />
              {drugPreview && <img src={drugPreview} alt="" className={styles.imagePreview} />}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cover Image</label>
              <input type="file" accept="image/*" ref={coverFileRef} className={styles.fileInput}
                onChange={e => { const f = e.target.files[0]; if (f) { setCoverImage(f); setCoverPreview(URL.createObjectURL(f)); } }} />
              {coverPreview && <img src={coverPreview} alt="" className={styles.imagePreview} />}
            </div>
          </div>
        </div>

        {/* Numeric fields */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cost Price</label>
            <input className={styles.formInput} placeholder="0.00" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Cost Price Unit</label>
            <input className={styles.formInput} placeholder="ETB" value={form.price_unit}
              onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Manufacturer</label>
            <input className={styles.formInput} value={form.manufacturer}
              onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Stock Qty</label>
            <input className={styles.formInput} type="number" placeholder="0" value={form.stock_quantity}
              onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
          </div>
        </div>

        {/* URL / Category / Status */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Source URL</label>
            <input className={styles.formInput} placeholder="https://…" value={form.source_url}
              onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category</label>
            <input className={styles.formInput} placeholder="Category name" value={form.category_name}
              onChange={e => setForm(f => ({ ...f, category_name: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select className={styles.formSelect} value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Prescription checkbox */}
        <div className={styles.checkRow}>
          <input type="checkbox" id={`prescription-${isEditMode ? editingId : 'new'}`}
            checked={form.is_prescription_required}
            onChange={e => setForm(f => ({ ...f, is_prescription_required: e.target.checked }))} />
          <label htmlFor={`prescription-${isEditMode ? editingId : 'new'}`} className={styles.checkLabel}>
            Prescription Required
          </label>
        </div>

        {/* Meta fields */}
        <div className={styles.formGrid2}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Meta Title</label>
            <input className={styles.formInput} value={form.meta_title}
              onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Meta Description</label>
            <input className={styles.formInput} value={form.meta_description}
              onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} />
          </div>
        </div>

        {/* Form actions */}
        <div className={styles.formActions}>
          <button type="submit" disabled={submitting} className={styles.btnPrimary} style={{ height: 44, paddingLeft: 24, paddingRight: 24 }}>
            {submitting ? <SegmentedSpinner size={16} spinning={true} /> : <Save size={16} />}
            {submitting ? 'Saving…' : (isEditMode ? 'Update Post' : 'Publish Post')}
          </button>
          <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }}
            className={styles.btnSecondary} style={{ height: 44 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // ── Main render ────────────────────────────────────────────
  return (
    <div className={styles.pubRoot}>

      {/* ── Toast Notification ── */}
      {settingMsg.text && (
        <div className={settingMsg.type === 'error' ? styles.toastError : styles.toast}>
          {settingMsg.type === 'success'
            ? <CheckCircle size={18} color="#16A34A" />
            : <XCircle size={18} color="#DC2626" />}
          <span className={styles.toastMessage}>{settingMsg.text}</span>
          <button onClick={() => setSettingMsg({ type: '', text: '' })} className={styles.toastClose}>✕</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className={styles.pubHeader}>
        <div className={styles.pubHeaderLeft}>
          <div className={styles.pubHeaderIcon}>
            <Globe size={20} />
          </div>
          <div>
            <h1 className={styles.pubTitle}>Health Publisher</h1>
            <p className={styles.pubSubtitle}>Import · Educate · Publish</p>
          </div>
        </div>

        <div className={styles.pubHeaderRight}>

          {/* Refresh */}
          <button onClick={handleRefresh} disabled={spinning || loading} className={styles.btnSecondary}>
            <SegmentedSpinner size={15} spinning={spinning || loading} />
            Refresh
          </button>

          {/* Worker access toggle */}
          {isManager && (
            <div className={styles.workerAccessWidget}>
              {workerCanPost
                ? <ShieldCheck size={16} color="#16A34A" />
                : <Shield size={16} color="#9CA3AF" />}
              <span className={styles.workerAccessLabel}>Worker Access</span>
              <button
                className={`${styles.toggleSwitch} ${workerCanPost ? styles.on : ''}`}
                onClick={handleToggleWorkerPost}
                disabled={togglingPost}
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          )}

          {/* Manager tools */}
          {isManager && (
            <>
              <button
                onClick={() => { setShowCatManager(s => !s); setShowBranchManager(false); }}
                className={showCatManager ? styles.btnSecondaryActive : styles.btnSecondary}
              >
                <Layers size={15} /> {showCatManager ? 'Close Cats' : 'Manage Cats'}
              </button>
              <button
                onClick={() => { setShowBranchManager(s => !s); setShowCatManager(false); }}
                className={showBranchManager ? styles.btnSecondaryActive : styles.btnSecondary}
              >
                <Building2 size={15} /> {showBranchManager ? 'Close Branches' : 'Manage Branches'}
              </button>
              <button onClick={handleScrape} disabled={scraping} className={styles.btnSecondary}>
                {scraping ? <SegmentedSpinner size={15} spinning={true} /> : <Search size={15} />}
                {scraping ? 'Scraping…' : 'Scrape & Import'}
              </button>
            </>
          )}

          {/* New Post */}
          {canAct && (
            <button
              onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }}
              className={styles.btnPrimary}
            >
              {showForm && !editingId ? <><X size={15} /> Cancel</> : <><Plus size={15} /> New Post</>}
            </button>
          )}

          {/* View-only notice */}
          {!canAct && !isManager && (
            <div className={styles.viewOnlyBadge}>
              <Shield size={14} /> View Only
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={styles.pubContent}>

        {/* New Post Form */}
        {showForm && !editingId && (
          <div style={{ marginBottom: 24 }}>{renderForm(false)}</div>
        )}

        {/* Category Manager */}
        {showCatManager && <CategoryManager pharmacyService={pharmacyService} refreshTrigger={refreshTrigger} />}

        {/* Branch Manager */}
        {showBranchManager && <BranchManager pharmacyService={pharmacyService} refreshTrigger={refreshTrigger} />}

        {/* Posts Grid */}
        {loading ? (
          <div className={styles.loadingState}>
            <SegmentedSpinner size={32} spinning={true} />
            <p className={styles.loadingText}>Loading posts…</p>
          </div>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <React.Fragment key={post.id}>
                {/* Inline Edit */}
                {showForm && editingId === post.id ? (
                  <div className={styles.inlineEditSlot}>{renderForm(true)}</div>
                ) : (
                  <div className={styles.postCard}>
                    {(post.drug_image || post.cover_image) && (
                      <div className={styles.postCardImgWrap}>
                        <img
                          src={`http://localhost:5000${post.drug_image || post.cover_image}`}
                          alt={post.title}
                          className={styles.postCardImg}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className={styles.postCardBody}>
                      <div className={styles.postCardTop}>
                        <h3 className={styles.postCardTitle}>{post.title}</h3>
                        <span className={post.status === 'published' ? styles.badgePublished : styles.badgeDraft}>
                          {post.status}
                        </span>
                      </div>

                      {post.subtitle && <p className={styles.postCardSubtitle}>{post.subtitle}</p>}

                      {post.price && (
                        <p className={styles.postCardPrice}>
                          <DollarSign size={15} /> {post.price} {post.price_unit}
                        </p>
                      )}

                      <div className={styles.postCardMeta}>
                        {post.category_name && <span className={styles.badgeMuted}>{post.category_name}</span>}
                        {post.branch_name && <span className={styles.badgeMuted}>{post.branch_name}</span>}
                        {post.manufacturer && <span className={styles.badgeMuted}>{post.manufacturer}</span>}
                      </div>

                      {canAct && (
                        <div className={styles.postCardActions}>
                          <button onClick={() => startEdit(post)} className={styles.btnSecondary} style={{ flex: 1 }}>
                            <Edit3 size={14} /> Edit
                          </button>
                          {post.status !== 'published' && (
                            <button onClick={() => handlePublish(post.id)} className={styles.btnPrimary} style={{ flex: 1 }}>
                              Publish
                            </button>
                          )}
                          <button onClick={() => handleDelete(post.id)} className={styles.btnDanger}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {posts.length === 0 && !showForm && (
              <div className={styles.emptyState}>
                <Globe size={48} className={styles.emptyIcon} color="#9CA3AF" />
                <p className={styles.emptyTitle}>No health posts yet</p>
                <p className={styles.emptyText}>Click "Scrape & Import" to pull data, or create a new post manually.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Inline Category Manager
═══════════════════════════════════════════════════════════ */
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
    <div className={styles.managerCard}>
      <div className={styles.managerCardHeader}>
        <h3 className={styles.managerCardTitle}>
          <Layers size={18} color="#0284C7" /> Category Management
        </h3>
      </div>
      <div className={styles.managerCardBody}>
        <div className={styles.managerInputRow}>
          <input className={styles.formInput} placeholder="Category name" value={name}
            onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
          <input className={styles.formInput} placeholder="Description" value={desc}
            onChange={e => setDesc(e.target.value)} style={{ flex: 2, minWidth: 240 }} />
          <button onClick={handleSave} disabled={submitting} className={styles.btnPrimary} style={{ height: 36, padding: '0 24px' }}>
            {submitting ? 'Saving…' : editId ? 'Update' : 'Add'}
          </button>
          {editId && (
            <button onClick={() => { setName(''); setDesc(''); setEditId(null); }} className={styles.btnSecondary} style={{ height: 36 }}>
              Cancel
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingState} style={{ padding: '24px 0' }}>
            <SegmentedSpinner size={24} spinning={true} />
            <p className={styles.loadingText}>Loading categories…</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>ID</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Active</th>
                  <th className={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.tdMono}>{item.id}</td>
                    <td className={styles.td} style={{ fontWeight: 500 }}>{item.name}</td>
                    <td className={styles.td}>
                      <span className={item.is_active ? styles.badgeActive : styles.badgeInactive}>
                        {item.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className={styles.tdRight}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEdit(item)} className={styles.btnSecondary} style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} className={styles.btnDanger} style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Inline Branch Manager
═══════════════════════════════════════════════════════════ */
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
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        {React.cloneElement(icon, { size: 16, style: { position: 'absolute', left: 12, top: 10, color: '#9CA3AF' } })}
        <input className={styles.formInput} placeholder={ph} value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ paddingLeft: 36 }} />
      </div>
    </div>
  );

  return (
    <div className={styles.managerCard} style={{ position: 'relative' }}>

      {msg.text && (
        <div className={msg.type === 'success' ? styles.branchMsgSuccess : styles.branchMsgError}>
          {msg.type === 'success' ? <CheckCircle size={18} color="#16A34A" /> : <XCircle size={18} color="#DC2626" />}
          {msg.text}
        </div>
      )}

      <div className={styles.managerCardHeader}>
        <h3 className={styles.managerCardTitle}>
          <Building2 size={18} color="#0284C7" /> Branch Management
        </h3>
        <button onClick={() => { if (showForm) resetForm(); else openForm(); }} className={styles.btnPrimary} style={{ height: 36 }}>
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Branch</>}
        </button>
      </div>

      <div className={styles.managerCardBody}>
        {showForm && (
          <div className={styles.branchFormPanel}>
            <h4 className={styles.branchFormTitle}>
              {editId ? <Edit3 size={16} /> : <Plus size={16} />}
              {editId ? 'Edit Branch' : 'New Branch'}
            </h4>
            <div className={styles.branchFormGrid}>
              {fldIcon(<Building2 />, 'Branch Name *', 'name', 'e.g. Downtown Pharmacy')}
              {fldIcon(<Hash />, 'Code', 'code', 'e.g. DTP')}
              {fldIcon(<Phone />, 'Phone', 'phone', '+251-XXX-XXXX')}
              {fldIcon(<User />, 'Manager Name', 'manager_name', 'Manager name')}
              {fldIcon(<Clock />, 'Working Hours', 'working_hours', 'Mon-Sat 8AM-6PM')}
              <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
                <label className={styles.checkRow} style={{ paddingTop: 24 }}>
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer' }} />
                  <span className={styles.checkLabel}>Active Branch</span>
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#9CA3AF' }} />
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      rows={2} className={styles.formInput}
                      style={{ paddingLeft: 36, minHeight: 60 }}
                      placeholder="Full address" />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.branchFormActions}>
              <button onClick={handleSave} disabled={submitting} className={styles.btnPrimary} style={{ height: 44, padding: '0 24px' }}>
                {submitting ? <SegmentedSpinner size={16} spinning={true} /> : <Save size={16} />}
                {submitting ? 'Saving…' : editId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} className={styles.btnSecondary} style={{ height: 44 }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState} style={{ padding: '32px 0' }}>
            <SegmentedSpinner size={32} spinning={true} />
            <p className={styles.loadingText}>Loading branches…</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState} style={{ gridColumn: 'unset' }}>
            <Building2 size={40} className={styles.emptyIcon} color="#9CA3AF" />
            <p className={styles.emptyTitle}>No branches yet</p>
            <p className={styles.emptyText}>Click "Add Branch" to create one</p>
          </div>
        ) : (
          <div className={styles.branchGrid}>
            {items.map(item => (
              <div key={item.id} className={styles.branchCard}>
                <div className={styles.branchCardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.branchIconWrap}><Building2 size={20} /></div>
                    <div>
                      <h4 className={styles.branchName}>{item.name}</h4>
                      {item.code && <span className={styles.branchCode}>#{item.code}</span>}
                    </div>
                  </div>
                  <span className={item.is_active ? styles.badgeActive : styles.badgeInactive}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className={styles.branchMeta}>
                  {item.phone && <div className={styles.branchMetaRow}><Phone size={14} /> {item.phone}</div>}
                  {item.manager_name && <div className={styles.branchMetaRow}><User size={14} /> {item.manager_name}</div>}
                  {item.working_hours && <div className={styles.branchMetaRow}><Clock size={14} /> {item.working_hours}</div>}
                  {item.address && <div className={styles.branchMetaRow}><MapPin size={14} style={{ flexShrink: 0 }} /> <span>{item.address}</span></div>}
                </div>

                <div className={styles.branchActions}>
                  <button onClick={() => openForm(item)} className={styles.btnSecondary} style={{ flex: 1 }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className={styles.btnDanger} style={{ flex: 1 }}>
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