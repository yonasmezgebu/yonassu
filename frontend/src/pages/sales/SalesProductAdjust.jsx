import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Package, Tag, Calendar as CalendarIcon, DollarSign, Layers } from 'lucide-react';
import apiClient from '../../services/apiClient';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .adjust-page {
    font-family: 'Inter', sans-serif;
    background: #F5F5F5;
    min-height: 100vh;
    padding: 40px 32px;
  }
  .adjust-card {
    max-width: 700px;
    margin: 0 auto;
    background: #FFFFFF;
    border-radius: 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    animation: fadeUp 0.3s ease;
  }
  .adjust-header {
    background: linear-gradient(135deg, #1B5E20, #0a3d12);
    padding: 24px 32px;
    color: white;
  }
  .adjust-header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .adjust-body {
    padding: 32px;
  }
  .form-group {
    margin-bottom: 24px;
  }
  .form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
    color: #424242;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #E0E0E0;
    background: #FAFAFA;
    border-radius: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    outline: none;
    transition: border 0.2s;
  }
  .form-input:focus {
    border-color: #2E8B57;
    background: #FFFFFF;
  }
  .two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .notice-box {
    background: #E8F5E9;
    border-left: 4px solid #4CAF50;
    padding: 16px;
    margin-bottom: 24px;
    color: #1B5E20;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
  }
  .btn-primary {
    background: #2E8B57;
    color: white;
    border: 2px solid #1B5E20;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 3px 3px 0 #1B5E20;
    transition: transform 0.1s;
  }
  .btn-primary:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #1B5E20;
  }
  .btn-secondary {
    background: #FFFFFF;
    color: #424242;
    border: 2px solid #BDBDBD;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 3px 3px 0 #BDBDBD;
  }
`;

export default function SalesProductAdjust() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    expiry_date: '',
    price: '',
    stock: ''
  });
  
  const [original, setOriginal] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiClient.get(`/retail/products/${id}`),
          apiClient.get('/retail/categories')
        ]);
        
        const prod = prodRes.data.data;
        const cats = Array.isArray(catRes?.data) ? catRes.data : catRes?.data?.data || [];
        setCategories(cats);
        
        const initial = {
          name: prod.name || '',
          category_id: prod.category_id || '',
          expiry_date: prod.expiry_date ? new Date(prod.expiry_date).toISOString().split('T')[0] : '',
          price: prod.price || '',
          stock: prod.stock_quantity || '0'
        };
        
        setFormData(initial);
        setOriginal(initial);
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to load product');
        navigate('/sales/stock-operations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        expiry_date: formData.expiry_date,
        price: formData.price,
        stock: formData.stock
      };
      
      const res = await apiClient.post(`/retail/products/${id}/partial-adjust`, payload);
      alert(res.data.message);
      navigate('/sales/stock-operations');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><SegmentedSpinner size={32} /></div>;

  return (
    <div className="adjust-page">
      <style>{CSS}</style>
      
      <div style={{ maxWidth: 700, margin: '0 auto 20px' }}>
        <button className="btn-secondary" onClick={() => navigate('/sales/stock-operations')} style={{ padding: '8px 16px', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back to Inventory
        </button>
      </div>

      <div className="adjust-card">
        <div className="adjust-header">
          <h2><Package size={28} /> Adjust Product Details</h2>
          <div style={{ fontSize: 14, marginTop: 6, opacity: 0.8, fontWeight: 600 }}>Modify product information. Price and stock changes require CEO approval.</div>
        </div>
        
        <div className="adjust-body">
          <div className="notice-box">
            <strong>Note:</strong> Changes to Name, Category, and Expiry Date take effect immediately. Changes to Price and Stock will be sent to the CEO Dashboard as a Pending Request.
          </div>

          <div className="form-group">
            <label><Tag size={16} /> Product Name</label>
            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
          </div>

          <div className="two-cols">
            <div className="form-group">
              <label><Layers size={16} /> Category</label>
              <select name="category_id" className="form-input" value={formData.category_id} onChange={handleChange}>
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label><CalendarIcon size={16} /> Expiry Date</label>
              <input type="date" name="expiry_date" className="form-input" value={formData.expiry_date} onChange={handleChange} />
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '2px dashed #E0E0E0', margin: '30px 0' }} />

          <div className="two-cols">
            <div className="form-group">
              <label><DollarSign size={16} /> Price (ETB) <span style={{ color: '#F44336' }}>*CEO Approval required</span></label>
              <input type="number" step="0.01" name="price" className="form-input" value={formData.price} onChange={handleChange} style={{ borderColor: formData.price !== original.price ? '#FF9800' : '#E0E0E0' }} />
            </div>
            
            <div className="form-group">
              <label><Package size={16} /> Stock Quantity <span style={{ color: '#F44336' }}>*CEO Approval required</span></label>
              <input type="number" name="stock" className="form-input" value={formData.stock} onChange={handleChange} style={{ borderColor: formData.stock !== original.stock ? '#FF9800' : '#E0E0E0' }} />
            </div>
          </div>

          <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => navigate('/sales/stock-operations')} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <SegmentedSpinner size={16} /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
