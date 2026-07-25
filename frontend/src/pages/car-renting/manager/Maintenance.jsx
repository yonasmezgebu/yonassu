import React, { useState, useEffect, useCallback } from 'react';
import { rentalState } from '../../../utils/rentalManagerState';
import api from '../../../services/apiClient';
import { CheckCircle, Clock, AlertTriangle, Plus, X, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAssetData, setSelectedAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedAssetKey, setSelectedAssetKey] = useState(''); // tracks the composite dropdown value
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
      asset_id: '', asset_type: 'car', asset_name: '', type: '', description: '', 
      estimated_cost_cents: '', scheduled_date: new Date().toISOString().substring(0, 10),
      priority: 'Normal', mechanic_name: '', mechanic_phone: '', reported_by: '', location: '', notes: '', images: []
  });
  
  // Expanded Row State
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRecordsAndAssets = async () => {
      try {
          const [recordsRes, carsRes, tractorsRes] = await Promise.all([
              api.get('/car-renting/maintenance'),
              api.get('/cars'),
              api.get('/tractors')
          ]);
          
          setRecords(recordsRes.data || []);
          
          const cars = (carsRes.data || []).map(c => ({...c, asset_type: 'car'}));
          const tractors = (tractorsRes.data || []).map(t => ({...t, asset_type: 'tractor'}));
          setAssets([...cars, ...tractors]);
      } catch (err) {
          console.error(err);
          showToast('Failed to load data', 'error');
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchRecordsAndAssets();
  }, []);

  const handleAssetSelect = (e) => {
      const selectedIdStr = e.target.value;
      setSelectedAssetKey(selectedIdStr);
      const selectedAsset = assets.find(a => `${a.asset_type}-${a.id}` === selectedIdStr);
      if (selectedAsset) {
          setSelectedAssetData(selectedAsset);
          setFormData({
              ...formData,
              asset_id: selectedAsset.id?.toString(),
              asset_type: selectedAsset.asset_type,
              asset_name: selectedAsset.name
          });
      } else {
          setSelectedAssetData(null);
          setSelectedAssetKey('');
          setFormData({ ...formData, asset_id: '', asset_name: '', asset_type: 'car' });
      }
  };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return showToast('Image too large (max 2MB)', 'error');
      
      const reader = new FileReader();
      reader.onloadend = () => {
          setFormData(prev => ({ ...prev, images: [reader.result] }));
          setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const costCents = formData.estimated_cost_cents ? Math.round(parseFloat(formData.estimated_cost_cents) * 100) : 0;
          await api.post('/car-renting/maintenance', {
              ...formData,
              estimated_cost_cents: costCents
          });
          
          showToast('Maintenance request submitted — sent to Finance for approval.');
          setShowForm(false);
          setSelectedAssetKey('');
          setImagePreview(null);
          setFormData({
              asset_id: '', asset_type: 'car', asset_name: '', type: '', description: '', 
              estimated_cost_cents: '', scheduled_date: new Date().toISOString().substring(0, 10),
              priority: 'Normal', mechanic_name: '', mechanic_phone: '', reported_by: '', location: '', notes: '', images: []
          });
          setSelectedAssetData(null);
          fetchRecordsAndAssets();
      } catch (error) {
          console.error(error);
          showToast('Failed to create request. Please try again.', 'error');
      }
  };

  const handleComplete = async (id) => {
      try {
          await api.patch(`/car-renting/maintenance/${id}/complete`);
          showToast('Maintenance marked as complete. Asset is ready.');
          fetchRecordsAndAssets();
      } catch (error) {
          console.error(error);
          showToast('Failed to complete maintenance. Try again.', 'error');
      }
  };

  // Color Palette Definitions (Sharp & Natural)
  const colors = {
      primary: '#228B22',   // Forest Green
      header: '#1B5E20',    // Dark Green
      emerald: '#2E8B57',   // Buttons/Highlights
      success: '#4CAF50',   // Leaf Green
      sage: '#A5D6A7',      // Light Backgrounds
      background: '#FFFFFF', // Main bg
      pageBg: '#F5F5F5',    // Page bg
      text: '#424242',      // Dark Gray
      border: '#E0E0E0'     // Light Gray Border
  };

  // Sharp Corner UI Theme
  const sharpStyles = {
      card: {
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '0px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          padding: '24px'
      },
      btnPrimary: {
          backgroundColor: colors.emerald,
          color: 'white',
          border: 'none',
          borderRadius: '0px',
          padding: '12px 24px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 4px 0 ${colors.header}`,
          transition: 'all 0.1s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
      },
      btnSecondary: {
          backgroundColor: '#9E9E9E',
          color: 'white',
          border: 'none',
          borderRadius: '0px',
          padding: '12px 24px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 4px 0 #616161`,
          transition: 'all 0.1s ease',
      },
      btnAction: {
          backgroundColor: colors.success,
          color: 'white',
          border: 'none',
          borderRadius: '0px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 3px 0 ${colors.primary}`,
          transition: 'all 0.1s ease',
      },
      input: {
          width: '100%',
          padding: '12px',
          border: `1px solid ${colors.border}`,
          borderRadius: '0px',
          outline: 'none',
          fontSize: '14px',
          color: colors.text
      },
      tableHeader: {
          backgroundColor: colors.header,
          color: 'white',
          padding: '16px',
          textAlign: 'left',
          fontWeight: '600',
          border: 'none',
          borderRadius: '0px'
      },
      tableCell: {
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          color: colors.text
      }
  };

  const getStatusBadge = (status) => {
      let bg, text, label, icon;
      switch (status) {
          case 'PENDING_CEO':
              bg = '#FFFDE7'; text = '#F57F17'; label = 'Awaiting CEO'; icon = <Clock size={14} />;
              break;
          case 'PENDING_FINANCE':
              bg = '#FFF3E0'; text = '#E65100'; label = 'Awaiting Finance'; icon = <Clock size={14} />;
              break;
          case 'FINANCE_APPROVED':
              bg = '#E3F2FD'; text = '#1565C0'; label = 'Finance Approved'; icon = <CheckCircle size={14} />;
              break;
          case 'PAYMENT_RELEASED':
              bg = '#E8F5E9'; text = '#2E7D32'; label = 'Payment Released'; icon = <DollarSign size={14} />;
              break;
          case 'COMPLETED':
              bg = colors.success; text = 'white'; label = 'Completed'; icon = <CheckCircle size={14} />;
              break;
          default:
              bg = '#EEEEEE'; text = '#616161'; label = status; icon = <Clock size={14} />;
      }
      return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: bg, color: text, fontSize: '12px', fontWeight: 'bold', borderRadius: '0px' }}>
              {icon} {label}
          </span>
      );
  };

  return (
    <div style={{ backgroundColor: colors.pageBg, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* In-App Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '16px 24px', backgroundColor: toast.type === 'error' ? '#F44336' : '#228B22', color: 'white', fontWeight: 'bold', borderRadius: '0px', boxShadow: '0 6px 24px rgba(0,0,0,0.3)', maxWidth: '360px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}
      {/* Header Banner */}
      <div style={{ backgroundColor: colors.header, color: 'white', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>Fleet Maintenance</h1>
              <p style={{ margin: '8px 0 0 0', color: colors.sage }}>Record service requests and manage finance approvals</p>
          </div>
          {!showForm && (
              <button 
                  style={sharpStyles.btnPrimary} 
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.header}`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.header}`; }}
                  onClick={() => setShowForm(true)}
              >
                  <Plus size={18} /> New Request
              </button>
          )}
      </div>

      <div style={{ padding: '48px', maxWidth: '100%' }}>
          {showForm && (
              <div style={{ ...sharpStyles.card, marginBottom: '48px', borderTop: `4px solid ${colors.primary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2 style={{ margin: 0, color: colors.primary }}>Create Maintenance Request</h2>
                      <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9E9E9E' }}><X size={24} /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Select Asset (Car or Tractor) *</label>
                          <select required style={sharpStyles.input} value={selectedAssetKey} onChange={handleAssetSelect}>
                              <option value="">-- Choose Asset --</option>
                              {assets.map(a => (
                                  <option key={`${a.asset_type}-${a.id}`} value={`${a.asset_type}-${a.id}`}>{a.name} ({a.asset_type === 'car' ? 'Car' : 'Tractor'})</option>
                              ))}
                          </select>
                      </div>

                      {selectedAssetData && (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px', backgroundColor: '#FAFAFA', border: `1px solid ${colors.border}`, padding: '16px' }}>
                              <div style={{ width: '150px', height: '100px', backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                  {(selectedAssetData.image1 || selectedAssetData.image2) ? (
                                      <img src={`http://localhost:5000${selectedAssetData.image1 || selectedAssetData.image2}`} alt={selectedAssetData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                  ) : (
                                      <span style={{ color: '#9E9E9E', fontSize: '12px' }}>No Image</span>
                                  )}
                              </div>
                              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  <div>
                                      <div style={{ fontSize: '12px', color: '#757575', fontWeight: 'bold' }}>ASSET NAME</div>
                                      <div style={{ color: colors.text }}>{selectedAssetData.name}</div>
                                  </div>
                                  <div>
                                      <div style={{ fontSize: '12px', color: '#757575', fontWeight: 'bold' }}>TYPE</div>
                                      <div style={{ color: colors.text, textTransform: 'capitalize' }}>{selectedAssetData.asset_type}</div>
                                  </div>
                                  <div>
                                      <div style={{ fontSize: '12px', color: '#757575', fontWeight: 'bold' }}>DEPARTMENT / CATEGORY</div>
                                      <div style={{ color: colors.text }}>{selectedAssetData.asset_type === 'tractor' ? 'AgriRent' : 'Car Rental'}</div>
                                  </div>
                                  <div>
                                      <div style={{ fontSize: '12px', color: '#757575', fontWeight: 'bold' }}>IDENTIFIER</div>
                                      <div style={{ color: colors.text }}>Asset ID: #{selectedAssetData.id}</div>
                                  </div>
                              </div>
                          </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>1. Basic Details</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Maintenance Type *</label>
                          <input required type="text" style={sharpStyles.input} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} placeholder="e.g. Oil Change, Tire Replacement" />
                      </div>
                      
                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Priority Level *</label>
                          <select required style={sharpStyles.input} value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                              <option value="Low">Low</option>
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                          </select>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Service Description *</label>
                          <textarea required rows={3} style={sharpStyles.input} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue or required service..."></textarea>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>2. Service Details</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Mechanic / Garage Name</label>
                          <input type="text" style={sharpStyles.input} value={formData.mechanic_name} onChange={(e) => setFormData({...formData, mechanic_name: e.target.value})} placeholder="Garage name or mechanic name" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Mechanic Phone</label>
                          <input type="text" style={sharpStyles.input} value={formData.mechanic_phone} onChange={(e) => setFormData({...formData, mechanic_phone: e.target.value})} placeholder="Phone number" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Location</label>
                          <input type="text" style={sharpStyles.input} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Where is the asset?" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Reported By</label>
                          <input type="text" style={sharpStyles.input} value={formData.reported_by} onChange={(e) => setFormData({...formData, reported_by: e.target.value})} placeholder="Driver or staff name" />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>3. Cost & Media</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Estimated Cost (ETB) *</label>
                          <input required type="number" step="0.01" min="0" style={sharpStyles.input} value={formData.estimated_cost_cents} onChange={(e) => setFormData({...formData, estimated_cost_cents: e.target.value})} placeholder="0.00" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Scheduled Date *</label>
                          <input required type="date" style={sharpStyles.input} value={formData.scheduled_date} onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})} />
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '24px' }}>
                          <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Upload Damage / Proforma Image</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                  <label style={{ cursor: 'pointer', padding: '12px 24px', backgroundColor: '#E0E0E0', border: '1px dashed #9E9E9E', fontWeight: 'bold', display: 'inline-block' }}>
                                      Browse Image
                                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                  </label>
                                  {imagePreview && (
                                      <div style={{ width: 80, height: 80, border: '1px solid #CCC', backgroundColor: '#EEE' }}>
                                          <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                      </div>
                                  )}
                              </div>
                          </div>
                          
                          <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Additional Notes</label>
                              <textarea rows={3} style={sharpStyles.input} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any other details..."></textarea>
                          </div>
                      </div>

                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', borderTop: `1px solid ${colors.border}`, paddingTop: 24 }}>
                          <button 
                              type="button" 
                              style={sharpStyles.btnSecondary}
                              onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 #616161`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 #616161`; }}
                              onClick={() => { setShowForm(false); setSelectedAssetKey(''); setImagePreview(null); }}
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              style={sharpStyles.btnPrimary}
                              onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.header}`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.header}`; }}
                          >
                              SUBMIT REQUEST TO CEO
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {/* Records Table */}
          <div style={sharpStyles.card}>
              <h2 style={{ marginTop: 0, color: colors.primary, marginBottom: '24px' }}>Service History</h2>
              
              {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9E9E9E' }}>Loading records...</div>
              ) : records.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9E9E9E', backgroundColor: '#FAFAFA', border: '1px dashed #CCC' }}>
                      No maintenance records found.
                  </div>
              ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                          <tr>
                              <th style={sharpStyles.tableHeader}>ID</th>
                              <th style={sharpStyles.tableHeader}>Asset</th>
                              <th style={sharpStyles.tableHeader}>Type</th>
                              <th style={sharpStyles.tableHeader}>Date</th>
                              <th style={sharpStyles.tableHeader}>Cost</th>
                              <th style={sharpStyles.tableHeader}>Status</th>
                              <th style={sharpStyles.tableHeader}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {records.map(record => (
                              <React.Fragment key={record.id}>
                                  <tr style={{ backgroundColor: expandedRow === record.id ? colors.sage + '22' : 'transparent', transition: 'background-color 0.2s' }}>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 'bold' }}>MNT-{record.id.toString().padStart(4, '0')}</td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ fontWeight: '600' }}>{record.asset_name}</div>
                                          <div style={{ fontSize: '12px', color: '#757575', textTransform: 'capitalize' }}>{record.asset_type.replace('_', ' ')}</div>
                                      </td>
                                      <td style={{ ...sharpStyles.tableCell, textTransform: 'capitalize' }}>{record.type}</td>
                                      <td style={sharpStyles.tableCell}>{new Date(record.scheduled_date).toLocaleDateString()}</td>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 'bold' }}>
                                          ETB {(record.estimated_cost_cents / 100).toLocaleString(undefined, {minimumFractionDigits:2})}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          {getStatusBadge(record.status)}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                              <button 
                                                  onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                                                  style={{ padding: '6px 10px', background: 'white', border: `1px solid ${colors.border}`, cursor: 'pointer', borderRadius: '0px' }}
                                              >
                                                  {expandedRow === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                              </button>

                                              {record.status === 'PAYMENT_RELEASED' && (
                                                  <button 
                                                      onClick={() => handleComplete(record.id)}
                                                      style={sharpStyles.btnAction}
                                                      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                                                      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 0 ${colors.primary}`; }}
                                                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 0 ${colors.primary}`; }}
                                                  >
                                                      Complete
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                                  {expandedRow === record.id && (
                                      <tr>
                                          <td colSpan="7" style={{ padding: 0, borderBottom: `1px solid ${colors.border}` }}>
                                              <div style={{ padding: '24px', backgroundColor: '#FAFAFA', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                  <div>
                                                      <h4 style={{ margin: '0 0 8px 0', color: colors.header }}>Service Description</h4>
                                                      <p style={{ margin: 0, color: colors.text, lineHeight: '1.5' }}>{record.description}</p>
                                                  </div>
                                                  <div>
                                                      <h4 style={{ margin: '0 0 8px 0', color: colors.header }}>Workflow Timeline</h4>
                                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              <CheckCircle size={16} color={colors.primary} />
                                                              <span style={{ color: colors.text }}>Requested on {new Date(record.created_at).toLocaleDateString()}</span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {['FINANCE_APPROVED', 'PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9E9E9E" />}
                                                              <span style={{ color: ['FINANCE_APPROVED', 'PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? colors.text : '#9E9E9E' }}>
                                                                  Finance Approval
                                                              </span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {['PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9E9E9E" />}
                                                              <span style={{ color: ['PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? colors.text : '#9E9E9E' }}>
                                                                  Payment Released
                                                              </span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {record.status === 'COMPLETED' ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9E9E9E" />}
                                                              <span style={{ color: record.status === 'COMPLETED' ? colors.text : '#9E9E9E' }}>
                                                                  Service Completed
                                                              </span>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  )}
                              </React.Fragment>
                          ))}
                      </tbody>
                  </table>
              )}
          </div>
      </div>
    </div>
  );
};

export default Maintenance;
