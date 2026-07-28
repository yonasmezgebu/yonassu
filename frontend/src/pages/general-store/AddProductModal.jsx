import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { X, Save } from 'lucide-react';

const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: '',
    unitId: '',
    brand: '',
    warehouse: 'Main Store',
    minStock: '0',
    maxStock: '0',
    reorderLevel: '0',
    sellingPrice: '',
    description: '',
    status: 'Active'
  });
  
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) { 
      fetchLookupData(); 
      setError(null); 
      setSuccess(null);
    }
  }, [isOpen]);

  const fetchLookupData = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getUnits()
      ]);
      setCategories(catRes.data?.categories || []);
      setUnits(unitRes.data?.units || []);
    } catch (err) {
      console.error('Failed to load categories or units', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        categoryId: parseInt(formData.categoryId) || null,
        unitId: parseInt(formData.unitId) || null,
        unitCost: 0, // Using 0 for now as it's not in the requested form
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        currentStock: 0,
        description: formData.description,
        brand: formData.brand,
        status: formData.status
      };
      
      await inventoryService.createProduct(payload);
      setSuccess('Item Registered Successfully!');
      setTimeout(() => { 
        setSuccess(null); 
        onSuccess(); 
        setFormData({
          sku: '', name: '', categoryId: '', unitId: '', brand: '', warehouse: 'Main Store', minStock: '0', maxStock: '0', reorderLevel: '0', sellingPrice: '', description: '', status: 'Active'
        });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      {/* Background Pattern mimicking the image but in Green */}
      <div style={bgPatternStyle}></div>

      <div style={modalContainerStyle}>
        
        {/* Title Header with Green Outline styling */}
        <div style={headerContainerStyle}>
          <h1 style={titleStyle}>ITEM REGISTRATION FORM</h1>
        </div>

        <div style={paperStyle}>
          <button onClick={onClose} style={closeBtnStyle} title="Close">
            <X size={24} />
          </button>
          
          <form onSubmit={handleSubmit} style={formStyle}>
            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}
            
            <div style={gridStyle}>
              {/* Row 1 */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Item Code *</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} required style={inputStyle} placeholder="e.g. ITM-001" />
              </div>
              <div style={{...fieldGroupStyle, gridColumn: 'span 2'}}>
                <label style={labelStyle}>Item Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="Enter item name" />
              </div>

              {/* Row 2 */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Category *</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Unit of Measure *</label>
                <select name="unitId" value={formData.unitId} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} style={inputStyle} placeholder="Optional" />
              </div>

              {/* Row 3 */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Warehouse</label>
                <select name="warehouse" value={formData.warehouse} onChange={handleChange} style={inputStyle}>
                  <option value="Main Store">Main Store</option>
                </select>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Selling Price</label>
                <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} style={inputStyle} placeholder="0.00" />
              </div>

              {/* Row 4 - Stock Levels */}
              <div style={{...fieldGroupStyle, gridColumn: 'span 3', borderTop: '2px solid #E2E8F0', paddingTop: '1rem', marginTop: '0.5rem', position: 'relative'}}>
                <span style={{ position: 'absolute', top: '-10px', left: '10px', background: 'white', padding: '0 8px', fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>STOCK THRESHOLDS</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={labelStyle}>Minimum Stock</label>
                    <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Maximum Stock</label>
                    <input type="number" name="maxStock" value={formData.maxStock} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reorder Level</label>
                    <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Row 5 - Description */}
              <div style={{...fieldGroupStyle, gridColumn: 'span 3'}}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Enter optional details..."></textarea>
              </div>
            </div>

            <div style={footerStyle}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" disabled={loading} style={submitBtnStyle}>
                {loading ? 'Saving...' : <><Save size={18} /> Register Item</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  fontFamily: "'Inter', sans-serif",
  padding: '1rem'
};

const bgPatternStyle = {
  position: 'absolute',
  top: '2%', left: '2%', right: '2%', bottom: '2%',
  backgroundColor: '#f0fdf4', // light green bg
  backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(134, 239, 172, 0.4) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(134, 239, 172, 0.4) 0%, transparent 20%), radial-gradient(circle at 50% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 40%)',
  border: '4px solid #bbf7d0',
  borderRadius: '20px',
  zIndex: -1,
  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)'
};

const modalContainerStyle = {
  width: '100%',
  maxWidth: '800px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxHeight: '96vh'
};

const headerContainerStyle = {
  marginBottom: '20px',
  textAlign: 'center',
  width: '100%',
  flexShrink: 0
};

const titleStyle = {
  fontFamily: "'Arial Black', Impact, sans-serif",
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  color: '#86efac', // light green fill
  textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 4px 4px 0 #000', // Black outline + shadow matching the image style
  letterSpacing: '4px',
  margin: 0,
  textTransform: 'uppercase'
};

const paperStyle = {
  backgroundColor: '#ffffff',
  width: '100%',
  borderRadius: '8px',
  padding: '2rem 2.5rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  overflowY: 'auto', // Enable scrolling
  flex: 1 // Take up remaining space
};

const closeBtnStyle = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  background: '#f1f5f9',
  border: 'none',
  color: '#475569',
  cursor: 'pointer',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'background 0.2s, color 0.2s'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  marginTop: '10px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  rowGap: '1.25rem'
};

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#334155',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
};

const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  backgroundColor: '#f8fafc',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box'
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  marginTop: '1.5rem',
  paddingTop: '1.5rem',
  borderTop: '2px solid #f1f5f9'
};

const cancelBtnStyle = {
  padding: '10px 20px',
  backgroundColor: 'white',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '14px'
};

const submitBtnStyle = {
  padding: '10px 24px',
  backgroundColor: '#059669',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
};

const errorStyle = {
  padding: '12px 16px',
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  borderRadius: '6px',
  border: '1px solid #f87171',
  fontSize: '14px',
  fontWeight: '500'
};

const successStyle = {
  padding: '12px 16px',
  backgroundColor: '#f0fdf4',
  color: '#166534',
  borderRadius: '6px',
  border: '1px solid #4ade80',
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'center'
};

export default AddProductModal;

