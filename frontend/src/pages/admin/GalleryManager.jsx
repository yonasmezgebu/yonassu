import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/apiClient';
import { Upload, Edit3, Trash2, X, Save, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import styles from './GalleryManager.module.css';

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const CATEGORIES = [
  { key: 'cars', label: 'Cars & Fleet' },
  { key: 'workplace', label: 'Workers & Workplace' },
  { key: 'events', label: 'Events & Activities' },
  { key: 'products', label: 'Products Showcase' },
];

const INITIAL_FORM = {
  category: 'cars', title: '', description: '', date_taken: '', location: '',
  display_order: '0', status: 'active', image: null
};

const GalleryManager = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cars');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // In-App Notification (Rule 6)
  const [notif, setNotif] = useState({ type: null, text: '' });
  const [formError, setFormError] = useState('');
  
  const fileRef = useRef(null);

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/gallery');
      if (res.status === 'success') setImages(res.data);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const filtered = images.filter(i => i.category === activeTab);

  const openAdd = () => {
    setForm({ ...INITIAL_FORM, category: activeTab });
    setEditing(null);
    setShowForm(true);
    setFormError('');
  };

  const openEdit = (img) => {
    setForm({
      category: img.category, title: img.title, description: img.description || '',
      date_taken: img.date_taken ? img.date_taken.split('T')[0] : '',
      location: img.location || '', display_order: String(img.display_order),
      status: img.status, image: null
    });
    setEditing(img.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!editing && !form.image) { setFormError('Image file is required'); return; }
    
    setSaving(true); 
    setFormError('');

    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('title', form.title.trim());
      if (form.description) fd.append('description', form.description);
      if (form.date_taken) fd.append('date_taken', form.date_taken);
      if (form.location) fd.append('location', form.location);
      fd.append('display_order', form.display_order);
      fd.append('status', form.status);
      if (form.image) fd.append('image', form.image);

      if (editing) {
        const res = await axios.put(`/gallery/${editing}`, fd);
        if (res.status === 'success') showNotif('success', 'Image updated successfully!');
      } else {
        const res = await axios.post('/gallery', fd);
        if (res.status === 'success') showNotif('success', 'Image uploaded successfully!');
      }
      setShowForm(false);
      fetchImages();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally { 
      setSaving(false); 
    }
  };

  const triggerDelete = (img) => {
    setConfirmDelete(img);
  };

  const confirmAndDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const res = await axios.delete(`/gallery/${confirmDelete.id}`);
      if (res.status === 'success') { 
        showNotif('success', 'Image deleted successfully'); 
        fetchImages(); 
      }
    } catch (err) { 
      showNotif('error', err.response?.data?.message || 'Delete failed'); 
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Administration</span>
          </div>
          <h1 className={styles.pageTitle}>
            Public <span>Gallery</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Manage images for the public-facing gallery and fleet showcase.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={openAdd} className={styles.addBtn}>
            <Upload size={14} /> Add New Image
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS — Rule 6 ── */}
      {notif.text && (
        <div className={`${styles.notification} ${notif.type === 'success' ? styles.notifSuccess : styles.notifError}`}>
          <span>{notif.text}</span>
          <button className={styles.notifDismiss} onClick={() => setNotif({ type: null, text: '' })}>&times;</button>
        </div>
      )}

      {/* ── BODY AREA ── */}
      <div className={styles.bodyArea}>
        
        {/* Category Tabs */}
        <div className={styles.tabBar}>
          {CATEGORIES.map(c => (
            <button 
              key={c.key} 
              onClick={() => setActiveTab(c.key)}
              className={`${styles.tabBtn} ${activeTab === c.key ? styles.tabBtnActive : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.countLabel}>
            {filtered.length} image(s) in {CATEGORIES.find(c => c.key === activeTab)?.label}
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Description</th>
                <th className={styles.center}>Order</th>
                <th className={styles.center}>Status</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading images...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No images in this category. Click "Add New Image" to upload.
                  </td>
                </tr>
              ) : (
                filtered.map(img => (
                  <tr key={img.id}>
                    <td>
                      <div className={styles.thumb}>
                        {img.image_path ? (
                          <img 
                            src={resolveImg(img.image_path)} 
                            alt={img.title} 
                            onError={e => { e.target.style.display = 'none'; }} 
                          />
                        ) : (
                          <ImageIcon size={20} color="#94a3b8" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.titleCell}>{img.title}</div>
                    </td>
                    <td>
                      <div className={styles.descCell} title={img.description}>
                        {img.description || '—'}
                      </div>
                    </td>
                    <td className={styles.center}>
                      <div style={{ fontWeight: 800, color: '#424242' }}>
                        {img.display_order}
                      </div>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.statusBadge} ${img.status === 'active' ? styles.statusActive : styles.statusHidden}`}>
                        {img.status === 'active' ? <Eye size={10} /> : <EyeOff size={10} />}
                        {img.status === 'active' ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openEdit(img)}>
                          <Edit3 size={10} /> Edit
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDel}`} onClick={() => triggerDelete(img)}>
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL (Rule 10, 14, 17) ── */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit Image' : 'Add New Image'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {formError && (
                <div className={styles.formError}>{formError}</div>
              )}

              <form id="galleryForm" onSubmit={handleSubmit} className={styles.formGrid}>
                
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select 
                    className={styles.input} 
                    value={form.category} 
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Display Order *</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={form.display_order} 
                    onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} 
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>Title *</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    maxLength={255}
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    placeholder="Enter image title..."
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>Description</label>
                  <textarea 
                    className={styles.input} 
                    rows={3} 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Enter image description..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date Taken</label>
                  <input 
                    type="date" 
                    className={styles.input} 
                    value={form.date_taken} 
                    onChange={e => setForm(f => ({ ...f, date_taken: e.target.value }))} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    maxLength={255}
                    value={form.location} 
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                    placeholder="e.g. Main Campus"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label>Image File {!editing ? '*' : ''}</label>
                  <input 
                    type="file" 
                    className={styles.input} 
                    accept="image/jpeg,image/png,image/webp" 
                    ref={fileRef}
                    onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))}
                  />
                  {form.image && <div className={styles.fileHint}>Selected: {form.image.name}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        value="active" 
                        checked={form.status === 'active'} 
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
                      /> 
                      Active
                    </label>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio" 
                        value="hidden" 
                        checked={form.status === 'hidden'} 
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
                      /> 
                      Hidden
                    </label>
                  </div>
                </div>

              </form>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button 
                type="submit" 
                form="galleryForm"
                className={styles.saveBtn}
                disabled={saving}
              >
                <Save size={14} /> {saving ? 'Saving...' : editing ? 'Update Image' : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSmall}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirm Deletion</h2>
              <button className={styles.closeBtn} onClick={() => setConfirmDelete(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 14, color: '#424242', fontWeight: 600 }}>
                Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button 
                className={styles.deleteConfirmBtn}
                onClick={confirmAndDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
