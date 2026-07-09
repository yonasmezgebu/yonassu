import React, { useState } from 'react';
import styles from './PurchaseDashboard.module.css'; // Reusing standard styles
import api from '../../services/apiClient';

const PurchaseTenderForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const initialItem = {
    objectType: '',
    unit: '',
    quantity: '',
  };
  
  const [items, setItems] = useState([{ ...initialItem }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const addItem = () => setItems([...items, { ...initialItem }]);
  
  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    if (newItems.length === 0) newItems.push({ ...initialItem });
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        title,
        description,
        items: items.filter(item => item.objectType && item.quantity)
      };

      if (payload.items.length === 0) {
        throw new Error('Please add at least one valid item');
      }

      await api.post('/public-tenders/internal', payload);
      setSuccess(true);
      setTitle('');
      setDescription('');
      setItems([{ ...initialItem }]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit tender');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Create Public Tender / Bid Request</h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Create a new tender with thousands of products. Once submitted, it will be reviewed by the CEO before being posted publicly.
      </p>

      {error && <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px' }}>Tender submitted successfully to CEO for approval!</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Tender Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            placeholder="e.g. Office Supplies 2026 Q3"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            placeholder="Detailed description of the tender..."
          />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Products (Smart Table)</h3>
        
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>No</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Object Type</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Unit</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Quantity</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="text" 
                      value={item.objectType}
                      onChange={(e) => updateItem(index, 'objectType', e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="text" 
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                      min="1"
                      style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button type="button" onClick={() => removeItem(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button 
          type="button" 
          onClick={addItem}
          style={{ padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginBottom: '24px' }}
        >
          + Add Product
        </button>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '16px' }}
          >
            {submitting ? 'Submitting...' : 'Submit to CEO'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseTenderForm;
