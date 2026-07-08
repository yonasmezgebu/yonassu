import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Package, Users, Clock, Loader2, Plus, XCircle, Trash2, Edit3 } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';

const btnPrimaryStyle = {
  padding: '12px 28px',
  background: '#224f94',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

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

const badgeStyle = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 700,
  background: bg,
  color: color,
});

const PharmacyWorkerProductPosts = () => {
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerCanAdd, setWorkerCanAdd] = useState(false);

  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', description: '', product_id: '' });
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const fileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', product_id: '' });
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    loadPosts();
    loadSetting();
    loadProducts();
  }, []);

  const loadSetting = async () => {
    try {
      const res = await pharmacyService.getWorkerAddProductSetting();
      setWorkerCanAdd(res?.data?.enabled === true);
    } catch (e) {
      setWorkerCanAdd(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await pharmacyService.getProductPosts();
      setPosts(res?.data || []);
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await pharmacyService.getProducts();
      setProducts(res?.data || []);
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.title) { alert('Title is required'); return; }
    setSubmittingPost(true);
    try {
      const fd = new FormData();
      fd.append('title', postForm.title);
      fd.append('description', postForm.description);
      if (postForm.product_id) fd.append('product_id', postForm.product_id);
      if (postImage) fd.append('image', postImage);
      await pharmacyService.createProductPost(fd);
      setShowPostForm(false);
      setPostForm({ title: '', description: '', product_id: '' });
      setPostImage(null);
      setPostImagePreview('');
      loadPosts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setEditForm({ title: post.title, description: post.description || '', product_id: post.product_id || '' });
    setEditImage(null);
    setEditImagePreview(post.image_url ? `http://localhost:5000${post.image_url}` : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '', product_id: '' });
    setEditImage(null);
    setEditImagePreview('');
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdatePost = async (id) => {
    if (!editForm.title) { alert('Title is required'); return; }
    setSubmittingEdit(true);
    try {
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('description', editForm.description);
      if (editForm.product_id) fd.append('product_id', editForm.product_id);
      if (editImage) fd.append('image', editImage);
      await pharmacyService.updateProductPost(id, fd);
      cancelEdit();
      loadPosts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update post');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await pharmacyService.deleteProductPost(id);
      loadPosts();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 8px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ImageIcon size={24} color="#224f94" /> Product Posts
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Latest product announcements and updates</p>
        </div>
        {workerCanAdd && (
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            style={{
              ...btnPrimaryStyle, display: 'flex', alignItems: 'center', gap: 8,
              background: showPostForm ? '#ef4444' : '#224f94'
            }}
          >
            {showPostForm ? <XCircle size={18} /> : <Plus size={18} />}
            {showPostForm ? 'Cancel' : 'New Product Post'}
          </button>
        )}
      </div>

      {showPostForm && workerCanAdd && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={cardHeaderStyle}>
            <div style={cardTitleStyle}><ImageIcon size={20} /> Create Product Post</div>
          </div>
          <div style={cardBodyStyle}>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Title *</label>
                <input
                  type="text" required
                  value={postForm.title}
                  onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Enter post title"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Description</label>
                <textarea
                  value={postForm.description}
                  onChange={e => setPostForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the product..."
                  rows="3"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Link to Product (optional)</label>
                  <select
                    value={postForm.product_id}
                    onChange={e => setPostForm(f => ({ ...f, product_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  >
                    <option value="">— No product link —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.price ? `($${p.price})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Post Image</label>
                  <input
                    type="file" accept="image/*" ref={fileInputRef}
                    onChange={handlePostImageChange}
                    style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                  {postImagePreview && (
                    <img src={postImagePreview} alt="preview" style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                </div>
              </div>
              <div>
                <button
                  type="submit" disabled={submittingPost}
                  style={{
                    ...btnPrimaryStyle, display: 'flex', alignItems: 'center', gap: 8,
                    opacity: submittingPost ? 0.6 : 1
                  }}
                >
                  {submittingPost ? <Loader2 size={18} /> : <Plus size={18} />}
                  {submittingPost ? 'Posting...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {posts.map(post => (
          <div key={post.id} style={{
            background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
            transition: 'box-shadow 0.2s'
          }}>
            {(post.image_url || post.product_drug_image) && (
              <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#f1f5f9' }}>
                <img
                  src={post.image_url ? `http://localhost:5000${post.image_url}` : post.product_drug_image ? `http://localhost:5000${post.product_drug_image}` : ''}
                  alt={post.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {editingId === post.id ? (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text" required
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Title"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description"
                    rows="2"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                  <select
                    value={editForm.product_id}
                    onChange={e => setEditForm(f => ({ ...f, product_id: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  >
                    <option value="">— No product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="file" accept="image/*" ref={editFileInputRef}
                      onChange={handleEditImageChange}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                    {editImagePreview && (
                      <img src={editImagePreview} alt="preview" style={{ marginTop: 6, maxHeight: 80, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleUpdatePost(post.id)} disabled={submittingEdit}
                      style={{ ...btnPrimaryStyle, padding: '8px 20px', fontSize: '0.85rem', opacity: submittingEdit ? 0.6 : 1 }}
                    >
                      {submittingEdit ? <Loader2 size={14} /> : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{ padding: '8px 20px', background: '#e2e8f0', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{post.title}</h3>
                  {workerCanAdd && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => startEdit(post)}
                        style={{ background: 'none', border: 'none', color: '#224f94', cursor: 'pointer', padding: 4 }}
                        title="Edit post"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                        title="Delete post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {post.description && (
                  <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{post.description}</p>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
                  {post.product_name && (
                    <span style={badgeStyle('#eff6ff', '#2563eb')}>
                      <Package size={12} /> {post.product_name}{post.product_price ? ` ($${post.product_price})` : ''}
                    </span>
                  )}
                  {post.posted_by_name && (
                    <span style={badgeStyle('#f8fafc', '#64748b')}>
                      <Users size={12} /> {post.posted_by_name}
                    </span>
                  )}
                  <span style={badgeStyle('#f8fafc', '#64748b')}>
                    <Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        {posts.length === 0 && !showPostForm && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '60px 24px',
            background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            color: '#94a3b8'
          }}>
            <ImageIcon size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>No product posts available</p>
            <p style={{ fontSize: '0.85rem' }}>Check back later for new product announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyWorkerProductPosts;