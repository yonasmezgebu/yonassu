import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, Loader2, X, DownloadCloud } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function ImportStoreProductModal({ onClose, onImportSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch global products
  const fetchProducts = async (q = '') => {
    setLoading(true);
    try {
      const res = await apiClient.get('/inventory/products', { params: { search: q, limit: 15 } });
      const data = res?.data?.data?.products || res?.data?.products || [];
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length > 2 || e.target.value === '') {
      fetchProducts(e.target.value);
    }
  };

  const handleSelect = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      category_id: prod.category_id || '',
      price: prod.selling_price || prod.price || '',
      cost_price: prod.average_cost || prod.cost_price || 0,
      stock_quantity: prod.current_stock || prod.stock_quantity || 0,
      reorder_level: prod.reorder_level || 10,
      expiry_date: prod.expiry_date ? new Date(prod.expiry_date).toISOString().split('T')[0] : ''
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImport = async () => {
    if (!formData.price) {
      setError('Price is required to import');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/retail/products', formData);
      onImportSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to import product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: selectedProduct ? 800 : 600, height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 8, overflow: 'hidden', animation: 'fadeUp 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#0d2244', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DownloadCloud size={20}/> Import Product from Store
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left: Product Search */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: selectedProduct ? '1px solid #E0E0E0' : 'none' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #E0E0E0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#999' }} />
                <input 
                  type="text" 
                  value={search} 
                  onChange={handleSearch} 
                  placeholder="Search store inventory..." 
                  style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {loading ? (
                <div style={{ padding: 30, textAlign: 'center' }}><Loader2 className="lucide-spin" size={24} color="#666" /></div>
              ) : products.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>No products found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelect(p)}
                      style={{ 
                        padding: 12, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer',
                        background: selectedProduct?.id === p.id ? '#E3F2FD' : '#fff',
                        borderColor: selectedProduct?.id === p.id ? '#2196F3' : '#eee'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4, display: 'flex', gap: 12 }}>
                        <span>SKU: {p.sku}</span>
                        <span>Stock: {p.current_stock || p.stock_quantity || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Import Form */}
          {selectedProduct && (
            <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E0E0E0', background: '#fff' }}>
                <h4 style={{ margin: 0, fontSize: 16 }}>Confirm Details</h4>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {error && <div style={{ padding: 12, background: '#FFEBEE', color: '#C62828', fontSize: 13, marginBottom: 16, borderRadius: 4 }}>{error}</div>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>SKU</label>
                      <input type="text" name="sku" value={formData.sku} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Expiry Date</label>
                      <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Selling Price (ETB) *</label>
                      <input type="number" name="price" value={formData.price} onChange={handleChange} style={{ width: '100%', padding: 8, border: '2px solid #2E8B57', borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Cost Price</label>
                      <input type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Initial Stock</label>
                      <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Reorder Level</label>
                      <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleChange} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, borderTop: '1px solid #E0E0E0', background: '#fff', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedProduct(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleImport} disabled={saving} style={{ padding: '8px 16px', background: '#2E8B57', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  {saving ? <Loader2 size={16} className="lucide-spin" /> : <Plus size={16} />} Import to Retail
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
