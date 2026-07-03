import React, { useState } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import { useNavigate } from 'react-router-dom';

const AddAsset = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
      asset_type: 'car',
      category: 'sedan',
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      identifier: '',
      purchase_date: new Date().toISOString().substring(0, 10),
      purchase_price_cents: '',
      daily_rate_cents: '',
      hourly_rate_cents: '',
      deposit_amount_cents: '',
      location: 'Addis Ababa'
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => {
          const updated = { ...prev, [name]: value };
          // Adjust default categories when type changes
          if (name === 'asset_type') {
              updated.category = value === 'car' ? 'sedan' : 'tractor';
          }
          return updated;
      });
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      setError('');
      try {
          // Convert price strings to ints
          const toCents = (val) => val ? Math.round(parseFloat(val) * 100) : null;
          
          rentalState.addAsset({
              ...formData,
              purchase_price_cents: toCents(formData.purchase_price_cents),
              daily_rate_cents: toCents(formData.daily_rate_cents),
              hourly_rate_cents: toCents(formData.hourly_rate_cents),
              deposit_amount_cents: toCents(formData.deposit_amount_cents),
              year: parseInt(formData.year, 10)
          });
          
          rentalState.notify('ADD_ASSET');
          navigate('/car-renting/manager/assets');
      } catch (err) {
          setError(err.message);
      }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Add New Asset</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Register a new vehicle or agricultural equipment to the fleet.</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '800px' }}>
        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Asset Type *</label>
            <select style={inputStyle} name="asset_type" value={formData.asset_type} onChange={handleInputChange} required>
              <option value="car">Car / Vehicle</option>
              <option value="agri_equipment">Agricultural Equipment</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Category *</label>
            <select style={inputStyle} name="category" value={formData.category} onChange={handleInputChange} required>
              {formData.asset_type === 'car' ? (
                  <>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  </>
              ) : (
                  <>
                  <option value="tractor">Tractor</option>
                  <option value="harvester">Harvester</option>
                  <option value="plough">Plough</option>
                  <option value="sprayer">Sprayer</option>
                  </>
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Make *</label>
            <input type="text" style={inputStyle} name="make" value={formData.make} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>Model *</label>
            <input type="text" style={inputStyle} name="model" value={formData.model} onChange={handleInputChange} required />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Display Name * (e.g. Toyota Land Cruiser V8)</label>
            <input type="text" style={inputStyle} name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>Year *</label>
            <input type="number" style={inputStyle} name="year" value={formData.year} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>{formData.asset_type === 'car' ? 'License Plate *' : 'Serial Number *'}</label>
            <input type="text" style={inputStyle} name="identifier" value={formData.identifier} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>Daily Rate (ETB) *</label>
            <input type="number" step="0.01" style={inputStyle} name="daily_rate_cents" value={formData.daily_rate_cents} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>Hourly Rate (ETB)</label>
            <input type="number" step="0.01" style={inputStyle} name="hourly_rate_cents" value={formData.hourly_rate_cents} onChange={handleInputChange} />
          </div>

          <div>
            <label style={labelStyle}>Required Deposit (ETB) *</label>
            <input type="number" step="0.01" style={inputStyle} name="deposit_amount_cents" value={formData.deposit_amount_cents} onChange={handleInputChange} required />
          </div>

          <div>
            <label style={labelStyle}>Purchase Price (ETB)</label>
            <input type="number" step="0.01" style={inputStyle} name="purchase_price_cents" value={formData.purchase_price_cents} onChange={handleInputChange} />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button type="submit" style={{ padding: '14px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
              Save Asset to Registry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' };

export default AddAsset;
