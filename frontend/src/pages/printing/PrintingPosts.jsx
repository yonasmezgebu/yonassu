import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import { Eye, EyeOff, Edit2, Trash2, Plus, X, Image as ImageIcon, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const EMPTY_FORM = {
  code: '', name: '', description: '', badge_label: '',
  base_price_per_page: '0.50', sort_order: '0', is_visible: true,
};

function Toast({ toasts = [], remove }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.type === 'success' ? '#16A34A' : '#DC2626', color: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 260, fontSize: 14, fontWeight: 500 }}>
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, show, remove };
}

export default function PrintingPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState('');
  const imgRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, show, remove } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/printing/posts/admin');
      setPosts(res?.data || []);
    } catch (e) {
      show('Failed to load posts: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({
      code: post.code || '',
      name: post.name || '',
      description: post.description || '',
      badge_label: post.badge_label || '',
      base_price_per_page: String(post.base_price_per_page ?? '0.50'),
      sort_order: String(post.sort_order ?? '0'),
      is_visible: Boolean(post.is_visible),
    });
    setImageFile(null);
    setImagePreview(post.image_url ? `${API_BASE}/${post.image_url}` : null);
    setFormError('');
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setFormError('Code is required'); return; }
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setFormError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('code', form.code.trim());
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('badge_label', form.badge_label.trim());
      fd.append('base_price_per_page', form.base_price_per_page);
      fd.append('sort_order', form.sort_order);
      fd.append('is_visible', String(form.is_visible));
      if (imageFile) fd.append('image', imageFile);

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (editPost) {
        const res = await apiClient.put(`/printing/posts/${editPost.id}`, fd, { headers });
        show(res.success ? 'Post updated successfully' : (res.message || 'Update failed'), res.success ? 'success' : 'error');
      } else {
        const res = await apiClient.post('/printing/posts', fd, { headers });
        show(res.success ? 'Post created successfully' : (res.message || 'Create failed'), res.success ? 'success' : 'error');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      show(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (post) => {
    try {
      const res = await apiClient.patch(`/printing/posts/${post.id}/visibility`);
      show(res.success ? res.message : (res.message || 'Failed'), res.success ? 'success' : 'error');
      if (res.success) load();
    } catch (e) {
      show(e.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/printing/posts/${deleteTarget.id}`);
      show(res.success ? 'Post deleted' : (res.message || 'Delete failed'), res.success ? 'success' : 'error');
      setDeleteTarget(null);
      load();
    } catch (e) {
      show(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="posts-page-root" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, Segoe UI, sans-serif' }}>
      <style>{`
        .post-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .post-modal-box {
          background: white; border-radius: 16px; width: 100%; max-width: 900px;
          max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .post-modal-grid {
          display: grid; grid-template-columns: 300px 1fr; gap: 32px;
        }
        .post-input {
          width: 100%; padding: 12px 16px; border: 1px solid #D1D5DB; border-radius: 8px;
          font-size: 15px; outline: none; box-sizing: border-box; transition: border-color 0.2s;
        }
        .post-input:focus {
          border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .post-label {
          font-size: 14px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px;
        }
        
        @media (max-width: 768px) {
          .post-modal-grid { grid-template-columns: 1fr; gap: 20px; }
          .posts-page-root { padding: 16px !important; }
          .post-modal-backdrop { padding: 12px; }
          .post-modal-box { border-radius: 12px; }
          .form-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>Printing Posts</h1>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '6px 0 0' }}>Manage large service cards shown on the public page</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#228B22', color: 'white', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(34,139,34,0.2)' }}>
          <Plus size={18} /> Add New Post
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Posts', value: posts.length, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Visible (Public)', value: posts.filter(p => p.is_visible).length, bg: '#DCFCE7', color: '#16A34A' },
          { label: 'Hidden', value: posts.filter(p => !p.is_visible).length, bg: '#FEF3C7', color: '#D97706' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#6B7280', fontSize: 18 }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#6B7280', background: 'white', borderRadius: 16, border: '2px dashed #E5E7EB' }}>
          <ImageIcon size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <div style={{ fontWeight: 600, fontSize: 18, color: '#374151' }}>No posts found</div>
          <div style={{ fontSize: 15, marginTop: 8 }}>Click "Add New Post" to create your first large service card</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: 'white', borderRadius: 16, border: `2px solid ${post.is_visible ? '#E5E7EB' : '#FCA5A5'}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 200, background: post.is_visible ? '#1B5E20' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {post.image_url ? (
                  <img src={`${API_BASE}/${post.image_url}`} alt={post.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={64} color="rgba(255,255,255,0.2)" />
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 800, color: '#111827', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {post.badge_label || post.code}
                </div>
                {!post.is_visible && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#EF4444', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    <EyeOff size={12} /> HIDDEN
                  </div>
                )}
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{post.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Code: <strong>{post.code}</strong> • Sort: {post.sort_order}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#16A34A', whiteSpace: 'nowrap', background: '#DCFCE7', padding: '4px 10px', borderRadius: 8 }}>
                    {parseFloat(post.base_price_per_page).toFixed(2)} ETB
                  </div>
                </div>
                {post.description && (
                  <p style={{ fontSize: 14, color: '#4B5563', margin: '0 0 20px', lineHeight: 1.6, flex: 1 }}>{post.description}</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginTop: 'auto' }}>
                  <button onClick={() => openEdit(post)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button onClick={() => handleToggleVisibility(post)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: post.is_visible ? '#FEF3C7' : '#DCFCE7', color: post.is_visible ? '#D97706' : '#16A34A', border: `1px solid ${post.is_visible ? '#FDE68A' : '#BBF7D0'}`, borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    {post.is_visible ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> Show</>}
                  </button>
                  <button onClick={() => setDeleteTarget(post)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Large Responsive Add/Edit Modal ── */}
      {modalOpen && (
        <div className="post-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="post-modal-box" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', borderRadius: '16px 16px 0 0' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>
                {editPost ? 'Edit Post Card' : 'Create Large Post Card'}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'white', border: '1px solid #D1D5DB', borderRadius: 50, padding: 8, cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px' }}>
              {formError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 20px', fontSize: 15, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontWeight: 500 }}>
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              <div className="post-modal-grid">
                {/* Left Column - Image & Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label className="post-label">Post Cover Image</label>
                    <div onClick={() => imgRef.current?.click()} style={{ border: '2px dashed #D1D5DB', borderRadius: 12, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#F9FAFB', position: 'relative', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#2563EB'} onMouseOut={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <Upload size={36} color="#9CA3AF" style={{ marginBottom: 12 }} />
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#4B5563' }}>Click to upload image</div>
                          <div style={{ fontSize: 13, color: '#9CA3AF', margin: '6px auto 0', maxWidth: 200, lineHeight: 1.4 }}>High resolution JPG, PNG, WEBP (Max 5MB)</div>
                        </div>
                      )}
                    </div>
                    <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    {imagePreview && (
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <X size={16} /> Remove current image
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={e => field('is_visible', e.target.checked)} style={{ width: 22, height: 22, cursor: 'pointer', marginTop: 2 }} />
                    <div>
                      <label htmlFor="is_visible" style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', cursor: 'pointer', display: 'block' }}>Visible to Public</label>
                      <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0', lineHeight: 1.5 }}>If unchecked, this post will be hidden from the main printing service catalog.</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  <div>
                    <label className="post-label">Post Title (Name) *</label>
                    <input className="post-input" value={form.name} onChange={e => field('name', e.target.value)} placeholder="e.g. Premium Book Printing" />
                  </div>

                  <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label className="post-label">Short Code *</label>
                      <input className="post-input" value={form.code} onChange={e => field('code', e.target.value)} placeholder="e.g. Book" />
                    </div>
                    <div>
                      <label className="post-label">Badge Label</label>
                      <input className="post-input" value={form.badge_label} onChange={e => field('badge_label', e.target.value)} placeholder="e.g. Best Seller" />
                    </div>
                  </div>

                  <div>
                    <label className="post-label">Detailed Description</label>
                    <textarea className="post-input" value={form.description} onChange={e => field('description', e.target.value)} placeholder="Describe this printing service in detail..." rows={4} style={{ resize: 'vertical' }} />
                  </div>

                  <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label className="post-label">Base Price per Page (ETB)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: 12, color: '#6B7280', fontWeight: 600 }}>ETB</span>
                        <input className="post-input" type="number" step="0.01" min="0" value={form.base_price_per_page} onChange={e => field('base_price_per_page', e.target.value)} style={{ paddingLeft: 52 }} />
                      </div>
                    </div>
                    <div>
                      <label className="post-label">Display Order</label>
                      <input className="post-input" type="number" min="0" value={form.sort_order} onChange={e => field('sort_order', e.target.value)} />
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>1 = First, 2 = Second, etc.</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '24px 32px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', background: '#228B22', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? 'Saving...' : (editPost ? 'Save All Changes' : 'Publish Post')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="post-modal-backdrop" style={{ zIndex: 9100 }} onClick={() => setDeleteTarget(null)}>
          <div className="post-modal-box" style={{ maxWidth: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: '50%', padding: 14, display: 'flex' }}><Trash2 size={28} /></div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>Delete Post?</div>
            </div>
            <p style={{ fontSize: 16, color: '#4B5563', marginBottom: 32, lineHeight: 1.6 }}>
              Are you completely sure you want to delete the <strong>"{deleteTarget.name}"</strong> post? This removes it from the public catalog permanently and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '12px 20px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '12px 24px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Yes, Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
