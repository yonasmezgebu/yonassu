import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Edit3, Trash2, Search, X, Image as ImageIcon, Save, CheckCircle, Package } from 'lucide-react';
import salesService from '../../services/salesService';
import { useAuth } from '../../hooks/useAuth';
import successSound from '../../assets/notification/info.mp3';

const COLORS = {
  primary: '#228B22',   // Forest Green
  secondary: '#2E8B57', // Emerald Green
  dark: '#1B5E20',      // Dark Green
  success: '#4CAF50',   // Leaf Green
  cardBg: '#A5D6A7',    // Sage Green
  accent: '#6B8E23',    // Olive Green
  soft: '#98FF98',      // Mint Green
  border: '#8D6E63',    // Earth Brown
  lightBg: '#F5F5F5',   // Light Gray
  text: '#424242',      // Dark Gray
  white: '#FFFFFF',
};

const RetailProductManager = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    reorder_level: '10',
    category_id: ''
  });
  const [productImage, setProductImage] = useState(null);
  const [productPreview, setProductPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        salesService.getRetailProducts({ limit: 1000 }),
        salesService.getRetailCategories()
      ]);
      setProducts(prodRes?.data?.products || []);
      setCategories(catRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSuccess = () => {
    try {
      const audio = new Audio(successSound);
      audio.play();
    } catch (e) {}
  };

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      name: '', sku: '', description: '', price: '', cost_price: '',
      stock_quantity: '', reorder_level: '10', category_id: ''
    });
    setProductImage(null);
    setProductPreview('');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      price: p.price || '',
      cost_price: p.cost_price || '',
      stock_quantity: p.stock_quantity || '',
      reorder_level: p.reorder_level || '10',
      category_id: p.category_id || ''
    });
    setProductImage(null);
    setProductPreview(p.product_image ? `http://localhost:5000${p.product_image}` : '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await salesService.deleteRetailProduct(id);
      playSuccess();
      showMessage('success', 'Product deleted successfully!');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to delete product.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
      setProductPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (form[k] !== null && form[k] !== '') {
          fd.append(k, form[k]);
        }
      });
      if (productImage) {
        fd.append('product_image', productImage);
      }

      if (editingId) {
        await salesService.updateRetailProduct(editingId, fd);
        showMessage('success', 'Product updated successfully!');
      } else {
        await salesService.createRetailProduct(fd);
        showMessage('success', 'Product created successfully!');
      }
      playSuccess();
      setShowModal(false);
      loadData();
    } catch (err) {
      showMessage('error', err?.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(p => {
    if (catFilter !== 'All' && p.category_name !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", color: COLORS.text, minHeight: '100vh', background: COLORS.lightBg }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.dark }}>Retail Products</h2>
          <p style={{ margin: '4px 0 0', color: COLORS.accent, fontSize: 14 }}>Manage public store catalogue</p>
        </div>
        <button 
          onClick={openAddModal}
          style={{
            background: COLORS.primary, color: '#fff', border: 'none', padding: '10px 20px', 
            borderRadius: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', boxShadow: '0 4px 6px rgba(34,139,34,0.2)', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {msg.text && (
        <div style={{
          padding: 12, marginBottom: 20, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8,
          background: msg.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: msg.type === 'success' ? COLORS.success : '#d32f2f',
          borderLeft: `4px solid ${msg.type === 'success' ? COLORS.success : '#d32f2f'}`
        }}>
          {msg.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
          <span style={{ fontWeight: 600 }}>{msg.text}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', marginBottom: 24 }}>
        <div style={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
          {['All', ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                flex: 1, padding: '14px 24px', borderRadius: 0, border: 'none', borderBottom: `2px solid ${catFilter === cat ? COLORS.primary : 'transparent'}`,
                background: catFilter === cat ? '#f1f5f9' : COLORS.white,
                color: catFilter === cat ? COLORS.primary : '#64748b',
                fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', borderRight: '1px solid #e2e8f0'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={32} color={COLORS.primary} className="spin" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              background: COLORS.white, borderRadius: 0, overflow: 'hidden',
              boxShadow: '0 4px 0 rgba(0,0,0,0.1)', border: `1px solid #ccc`,
              display: 'flex', flexDirection: 'column', position: 'relative',
              transition: 'transform 0.1s, box-shadow 0.1s'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.15)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 rgba(0,0,0,0.1)'; }}
            >
              <div style={{ height: 180, background: COLORS.lightBg, position: 'relative', borderBottom: '1px solid #ccc' }}>
                {p.product_image ? (
                  <img src={`http://localhost:5000${p.product_image}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={48} color="#ccc" />
                  </div>
                )}
              </div>
              
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: COLORS.dark }}>{p.name}</h3>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>SKU: {p.sku}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Price</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary }}>${parseFloat(p.price).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Stock</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: p.stock_quantity > p.reorder_level ? COLORS.success : '#d32f2f' }}>
                      {p.stock_quantity}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                  <button 
                    onClick={() => openEditModal(p)}
                    className="btn-3d"
                    style={{ flex: 1, height: 36, borderRadius: 0, background: COLORS.white, border: '1px solid #ccc', borderBottom: '3px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: COLORS.secondary, gap: 6, fontWeight: 600, fontSize: 13 }}
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="btn-3d"
                    style={{ flex: 1, height: 36, borderRadius: 0, background: COLORS.white, border: '1px solid #ccc', borderBottom: '3px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#d32f2f', gap: 6, fontWeight: 600, fontSize: 13 }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 0, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid #ccc', boxShadow: '8px 8px 0 rgba(0,0,0,0.2)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: COLORS.white, zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: COLORS.dark }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-3d" style={{ background: '#eee', border: '1px solid #ccc', borderBottom: '3px solid #999', borderRadius: 0, padding: 4, cursor: 'pointer', color: '#333' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                
                {/* Left Col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Product Name *</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>SKU *</label>
                    <input required type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Category *</label>
                    <select required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box', background: COLORS.white }}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Price *</label>
                      <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Cost Price</label>
                      <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Right Col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Initial Stock</label>
                      <input required type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Reorder Level</label>
                      <input type="number" value={form.reorder_level} onChange={e => setForm({...form, reorder_level: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Description</label>
                    <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '2px solid #aaa', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Product Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        height: 120, border: '2px dashed #999', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', background: productPreview ? `url(${productPreview}) center/cover` : '#eee',
                        position: 'relative', overflow: 'hidden'
                      }}
                    >
                      {!productPreview && <div style={{ color: '#555', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><ImageIcon size={32} /><span>Upload Image</span></div>}
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 20, borderTop: '2px solid #ccc' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-3d" style={{ padding: '10px 20px', borderRadius: 0, border: '1px solid #ccc', borderBottom: '3px solid #999', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-3d" style={{ padding: '10px 24px', borderRadius: 0, border: '1px solid #1B5E20', borderBottom: '3px solid #1B5E20', background: COLORS.primary, color: COLORS.white, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {submitting ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    {editingId ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .btn-3d { transition: transform 0.1s; }
        .btn-3d:active { transform: translateY(2px); border-bottom-width: 1px !important; margin-top: 2px; }
      `}</style>
    </div>
  );
};

export default RetailProductManager;