import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Plus, Edit3, Trash2, X, Save, Send, Eye, EyeOff, FileText, Video, Image, Briefcase, Bell } from 'lucide-react';
import styles from './NewsManager.module.css';

const POST_TYPES = [
  { key: 'news', label: 'News', icon: <FileText size={16} /> },
  { key: 'hiring', label: 'Hiring', icon: <Briefcase size={16} /> },
  { key: 'notice', label: 'Notice', icon: <Bell size={16} /> },
  { key: 'video', label: 'Video', icon: <Video size={16} /> },
];

const TYPE_ICONS = { news: '📰', hiring: '💼', notice: '🔔', video: '🎬' };
const TYPE_LABELS = { news: 'News', hiring: 'Hiring', notice: 'Notice', video: 'Video' };

const INITIAL_FORM = {
  type: 'news', title: '', content: '', visibility: 'public',
  youtube_url: '', hiring_position: '', hiring_deadline: '', hiring_email: '', hiring_location: '',
  status: 'draft', send_notification: true,
};

const NewsManager = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // In-App Notification (Rule 6)
  const [notif, setNotif] = useState({ type: null, text: '' });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const showNotif = (type, text) => {
    setNotif({ type, text });
    setTimeout(() => setNotif({ type: null, text: '' }), 5000);
  };

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/news');
      const data = res.data;
      if (Array.isArray(data)) setPosts(data);
      else if (data?.data) setPosts(data.data);
      else if (data?.status === 'success') setPosts(data.data ?? []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const openAdd = () => {
    setForm({ ...INITIAL_FORM });
    setEditing(null);
    setImageFiles([]);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      type: p.type, title: p.title, content: p.content || '',
      visibility: p.visibility || 'public',
      youtube_url: p.youtube_url || '',
      hiring_position: p.hiring_position || '',
      hiring_deadline: p.hiring_deadline ? p.hiring_deadline.split('T')[0] : '',
      hiring_email: p.hiring_email || '',
      hiring_location: p.hiring_location || '',
      status: p.status || 'draft',
      send_notification: !!p.send_notification,
    });
    setEditing(p.id);
    setImageFiles([]);
    
    // Show existing image if available
    const existingImages = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [];
    if (existingImages.length > 0) {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
      setImagePreview(`${base}${existingImages[0]}`);
    } else {
      setImagePreview(null);
    }
    setShowForm(true);
  };

  const validate = () => {
    if (!form.title.trim()) { showNotif('error', 'Title is required'); return false; }
    if (form.type === 'video') {
      if (!form.youtube_url.trim()) { showNotif('error', 'YouTube URL is required for video posts'); return false; }
      const re = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!re.test(form.youtube_url)) { showNotif('error', 'Invalid YouTube URL format'); return false; }
    }
    if (form.type === 'hiring') {
      if (!form.hiring_position.trim()) { showNotif('error', 'Position is required'); return false; }
      if (!form.hiring_deadline) { showNotif('error', 'Deadline is required'); return false; }
      if (new Date(form.hiring_deadline) <= new Date()) { showNotif('error', 'Deadline must be a future date'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e, actionStatus) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); 

    try {
      const payload = { ...form, status: actionStatus };
      if (!payload.content) delete payload.content;
      if (payload.type !== 'video') { delete payload.youtube_url; }
      if (payload.type !== 'hiring') {
        delete payload.hiring_position; delete payload.hiring_deadline;
        delete payload.hiring_email; delete payload.hiring_location;
      }

      let finalPayload = payload;
      let headers = {};
      
      if (imageFiles.length > 0) {
        finalPayload = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) finalPayload.append(k, v);
        });
        imageFiles.forEach(f => finalPayload.append('images', f));
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      if (editing) {
        await axios.put(`/news/${editing}`, finalPayload, { headers });
        showNotif('success', 'Post updated successfully!');
      } else {
        await axios.post('/news', finalPayload, { headers });
        showNotif('success', 'Post saved successfully!');
      }
      fetchPosts();
      setTimeout(() => setShowForm(false), 400);
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const triggerDelete = (p) => {
    setConfirmDelete(p);
  };

  const confirmAndDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await axios.delete(`/news/${confirmDelete.id}`);
      showNotif('success', 'Post deleted successfully!');
      fetchPosts();
    } catch (err) { 
      showNotif('error', err.response?.data?.message || 'Delete failed'); 
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const toggleVisibility = async (p) => {
    const newVisibility = p.visibility === 'public' ? 'employees_only' : 'public';
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => post.id === p.id ? { ...post, visibility: newVisibility } : post));
      await axios.put(`/news/${p.id}`, { visibility: newVisibility });
      showNotif('success', `Visibility changed to ${newVisibility === 'public' ? 'Public' : 'Employees Only'}`);
    } catch (err) {
      showNotif('error', 'Failed to change visibility');
      fetchPosts(); // Revert on failure
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
            News &amp; <span>Notices</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Manage public news, announcements, video links, and hiring posts.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button onClick={openAdd} className={styles.createBtn}>
            + New Post
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
        
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.countLabel}>
            {posts.length} post(s) found
          </div>
        </div>

        {/* Table — Rule 3, 4, 8 */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Date</th>
                <th className={styles.center}>Status</th>
                <th>Visibility</th>
                <th className={styles.right}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.loading}>Loading posts...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>No posts found. Click "New Post" to create one.</td></tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.typeTag}>
                        {TYPE_ICONS[p.type] || '📋'} {TYPE_LABELS[p.type] || p.type}
                      </div>
                    </td>
                    <td>
                      <div className={styles.subjectTitle}>{p.title}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#424242' }}>
                        {new Date(p.created_at).toLocaleDateString('en-CA')}
                      </div>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.statusBadge} ${styles['status' + p.status] || styles.statusdraft}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div 
                        onClick={() => toggleVisibility(p)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: p.visibility === 'public' ? '#E8F5E9' : '#FFEBEE', transition: 'background 0.2s' }}
                        title="Click to toggle visibility"
                      >
                        {p.visibility === 'public' ? (
                          <>
                            <Eye size={14} color="#228B22" />
                            <span style={{ color: '#228B22', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} color="#C62828" />
                            <span style={{ color: '#C62828', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Hidden</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsList}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => openEdit(p)}>
                          <Edit3 size={10} /> Edit
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDel}`} onClick={() => triggerDelete(p)}>
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
              <h2 className={styles.modalTitle}>{editing ? 'Edit Post' : 'New Post'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form id="postForm" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div className={styles.formGroup}>
                  <label>Post Type *</label>
                  <div className={styles.typeGrid}>
                    {POST_TYPES.map(t => (
                      <label key={t.key} className={`${styles.typeCard} ${form.type === t.key ? styles.typeCardActive : ''}`}>
                        <input type="radio" name="ptype" value={t.key} checked={form.type === t.key}
                          onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
                        {t.icon} {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    required 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    placeholder="Enter the title of the post..."
                  />
                </div>

                {form.type !== 'video' && (
                  <div className={styles.formGroup}>
                    <label>{form.type === 'hiring' ? 'Job Description & Guidelines *' : 'Content *'}</label>
                    <textarea 
                      className={styles.input} 
                      required 
                      rows={form.type === 'hiring' ? 6 : 4}
                      value={form.content} 
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder={form.type === 'hiring' ? "Write detailed guidelines, requirements, and job description here..." : "Write your post content here..."}
                    />
                  </div>
                )}

                {form.type === 'video' && (
                  <div className={styles.formGroup}>
                    <label>YouTube URL *</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      required 
                      value={form.youtube_url} 
                      onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} 
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    {form.youtube_url && /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(form.youtube_url) && (
                      <div style={{ marginTop: 8, aspectRatio: '16/9', background: '#F5F5F5', border: '1.5px solid #8D6E63', overflow: 'hidden' }}>
                        <iframe src={`https://www.youtube.com/embed/${form.youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)[1]}`}
                          title="Preview" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                      </div>
                    )}
                  </div>
                )}

                {form.type === 'hiring' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div className={styles.formGroup}>
                      <label>Position *</label>
                      <input type="text" className={styles.input} value={form.hiring_position} onChange={e => setForm(f => ({ ...f, hiring_position: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input type="text" className={styles.input} value={form.hiring_location} onChange={e => setForm(f => ({ ...f, hiring_location: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Deadline *</label>
                      <input type="date" className={styles.input} value={form.hiring_deadline} onChange={e => setForm(f => ({ ...f, hiring_deadline: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Company Stamp / Photo (Optional)</label>
                      <input type="file" className={styles.input} accept="image/png, image/jpeg" style={{ padding: '8px' }} onChange={e => {
                        if (e.target.files?.length > 0) {
                          setImageFiles(Array.from(e.target.files));
                          setImagePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
                  {imagePreview && (
                    <div style={{ border: '2px solid #8D6E63', padding: 4, background: '#FFFFFF' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '160px', maxHeight: '160px', objectFit: 'contain', display: 'block' }} />
                    </div>
                  )}
                  
                  <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
                    <label>Visibility *</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label className={styles.checkLabel}>
                        <input type="radio" value="public" checked={form.visibility === 'public'} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} /> 
                        Public
                      </label>
                      <label className={styles.checkLabel}>
                        <input type="radio" value="employees_only" checked={form.visibility === 'employees_only'} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} /> 
                        Employees Only
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkLabel}>
                      <input type="checkbox" checked={form.send_notification} onChange={e => setForm(f => ({ ...f, send_notification: e.target.checked }))} />
                      Send App Notification
                    </label>
                  </div>
                </div>

              </form>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'draft')} 
                className={styles.draftBtn}
                disabled={saving}
              >
                <Save size={14} /> Save Draft
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'published')} 
                className={styles.saveBtn}
                disabled={saving}
              >
                <Send size={14} /> {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSmall}>
            <div className={styles.modalHeaderSmall}>
              <h2 className={styles.modalTitle}>Confirm Deletion</h2>
              <button className={styles.closeBtnSmall} onClick={() => setConfirmDelete(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBodySmall}>
              <p style={{ margin: 0, fontSize: 14, color: '#424242', fontWeight: 600 }}>
                Are you sure you want to delete the post <strong>{confirmDelete.title}</strong>? This action cannot be undone.
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

export default NewsManager;
