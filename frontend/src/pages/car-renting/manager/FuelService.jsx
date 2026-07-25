import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/apiClient';
import { CheckCircle, Clock, AlertTriangle, Plus, X, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

const FuelService = () => {
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
  
  const [formData, setFormData] = useState({
      asset_id: '', asset_type: 'car', asset_name: '', request_type: 'Fuel', description: '', 
      estimated_cost_cents: '', requested_date: new Date().toISOString().substring(0, 10),
      priority: 'Normal', driver_name: '', current_mileage: '', reported_by: '', location: '', notes: ''
  });
  
  // Expanded Row State
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRecordsAndAssets = async () => {
      try {
          const [recordsRes, carsRes, tractorsRes] = await Promise.all([
              api.get('/car-renting/fuel-service'),
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

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const costCents = formData.estimated_cost_cents ? Math.round(parseFloat(formData.estimated_cost_cents) * 100) : 0;
          await api.post('/car-renting/fuel-service', {
              ...formData,
              estimated_cost_cents: costCents
          });
          
          showToast(`${formData.request_type} request submitted — sent to CEO for approval.`);
          setShowForm(false);
          setSelectedAssetKey('');
          setFormData({
              asset_id: '', asset_type: 'car', asset_name: '', request_type: 'Fuel', description: '', 
              estimated_cost_cents: '', requested_date: new Date().toISOString().substring(0, 10),
              priority: 'Normal', driver_name: '', current_mileage: '', reported_by: '', location: '', notes: ''
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
          await api.patch(`/car-renting/fuel-service/${id}/complete`);
          showToast('Request marked as complete.');
          fetchRecordsAndAssets();
      } catch (error) {
          console.error(error);
          showToast('Failed to complete request. Try again.', 'error');
      }
  };

  // Color Palette Definitions (Natural & Sharp)
  const colors = {
      primary: '#228B22',   // Forest Green
      header: '#1B5E20',    // Dark Green
      emerald: '#2E8B57',   // Buttons/Highlights
      success: '#4CAF50',   // Leaf Green
      sage: '#A5D6A7',      // Cards/Backgrounds
      olive: '#6B8E23',     // Secondary accents
      mint: '#98FF98',      // Soft backgrounds
      lime: '#8BC34A',      // Notifications/Active states
      brown: '#8D6E63',     // Soil/borders/icons
      sky: '#87CEEB',       // Links
      background: '#FFFFFF',// Main bg
      pageBg: '#F5F5F5',    // Page bg
      text: '#424242',      // Dark Gray
      border: '#E0E0E0',
      warning: '#FF9800',
      error: '#F44336'
  };

  // Sharp Corner UI Theme
  const sharpStyles = {
      card: {
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '0px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          padding: '24px',
          width: '100%',
          boxSizing: 'border-box'
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
          gap: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
      },
      btnSecondary: {
          backgroundColor: colors.olive,
          color: 'white',
          border: 'none',
          borderRadius: '0px',
          padding: '12px 24px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 4px 0 ${colors.brown}`,
          transition: 'all 0.1s ease',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
      },
      btnAction: {
          backgroundColor: colors.success,
          color: 'white',
          border: 'none',
          borderRadius: '0px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 3px 0 ${colors.header}`,
          transition: 'all 0.1s ease',
      },
      input: {
          width: '100%',
          padding: '12px',
          border: `1px solid ${colors.brown}`,
          borderRadius: '0px',
          outline: 'none',
          fontSize: '14px',
          color: colors.text,
          boxSizing: 'border-box',
          backgroundColor: colors.background
      },
      tableHeader: {
          backgroundColor: colors.header,
          color: 'white',
          padding: '16px',
          textAlign: 'left',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '0px',
          textTransform: 'uppercase',
          fontSize: '13px',
          letterSpacing: '0.5px'
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
              bg = '#FFF3E0'; text = colors.warning; label = 'Awaiting CEO'; icon = <Clock size={14} />;
              break;
          case 'PENDING_FINANCE':
              bg = '#FFF3E0'; text = colors.warning; label = 'Awaiting Finance'; icon = <Clock size={14} />;
              break;
          case 'FINANCE_APPROVED':
              bg = '#E0F7FA'; text = '#006064'; label = 'Finance Approved'; icon = <CheckCircle size={14} />;
              break;
          case 'PAYMENT_RELEASED':
              bg = colors.sage; text = colors.header; label = 'Payment Released'; icon = <DollarSign size={14} />;
              break;
          case 'COMPLETED':
              bg = colors.primary; text = 'white'; label = 'Completed'; icon = <CheckCircle size={14} />;
              break;
          default:
              bg = '#EEEEEE'; text = '#616161'; label = status; icon = <Clock size={14} />;
      }
      return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: bg, color: text, fontSize: '12px', fontWeight: 'bold', borderRadius: '0px', border: `1px solid ${text}` }}>
              {icon} {label}
          </span>
      );
  };

  return (
    <div style={{ backgroundColor: colors.pageBg, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* In-App Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '16px 24px', backgroundColor: toast.type === 'error' ? colors.error : colors.lime, color: toast.type === 'error' ? 'white' : colors.header, fontWeight: 'bold', borderRadius: '0px', boxShadow: `4px 4px 0 ${colors.header}`, maxWidth: '360px', display: 'flex', alignItems: 'center', gap: '12px', border: `2px solid ${colors.header}` }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}
      {/* Header Banner */}
      <div style={{ backgroundColor: colors.header, color: 'white', padding: '32px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: `4px solid ${colors.emerald}` }}>
          <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>Fuel & Service Requests</h1>
              <p style={{ margin: '8px 0 0 0', color: colors.sage }}>Record daily fuel and service operations for fleet.</p>
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

      <div style={{ padding: '32px 5%', width: '100%', boxSizing: 'border-box', flex: 1 }}>
          {showForm && (
              <div style={{ ...sharpStyles.card, marginBottom: '32px', borderTop: `4px solid ${colors.primary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2 style={{ margin: 0, color: colors.primary }}>Create Fuel/Service Request</h2>
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
                              </div>
                          </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>1. Request Details</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Request Type *</label>
                          <select required style={sharpStyles.input} value={formData.request_type} onChange={(e) => setFormData({...formData, request_type: e.target.value})}>
                              <option value="Fuel">Fuel</option>
                              <option value="Service">Service</option>
                              <option value="Wash">Wash</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      
                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Priority Level *</label>
                          <select required style={sharpStyles.input} value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                          </select>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Description *</label>
                          <textarea required rows={3} style={sharpStyles.input} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. 50 Liters of Diesel, or Car Wash..."></textarea>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>2. Operation Info</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Driver Name</label>
                          <input type="text" style={sharpStyles.input} value={formData.driver_name} onChange={(e) => setFormData({...formData, driver_name: e.target.value})} placeholder="Name of driver" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Current Mileage (KM)</label>
                          <input type="number" style={sharpStyles.input} value={formData.current_mileage} onChange={(e) => setFormData({...formData, current_mileage: e.target.value})} placeholder="E.g. 45000" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Location / Gas Station</label>
                          <input type="text" style={sharpStyles.input} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Where?" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Reported By</label>
                          <input type="text" style={sharpStyles.input} value={formData.reported_by} onChange={(e) => setFormData({...formData, reported_by: e.target.value})} placeholder="Who reported?" />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: `2px solid ${colors.border}`, paddingBottom: 8, margin: '16px 0', color: colors.header, fontSize: 16 }}>3. Cost & Date</h3>
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Estimated Cost (ETB) *</label>
                          <input required type="number" step="0.01" min="0" style={sharpStyles.input} value={formData.estimated_cost_cents} onChange={(e) => setFormData({...formData, estimated_cost_cents: e.target.value})} placeholder="0.00" />
                      </div>

                      <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: colors.text }}>Date *</label>
                          <input required type="date" style={sharpStyles.input} value={formData.requested_date} onChange={(e) => setFormData({...formData, requested_date: e.target.value})} />
                      </div>

                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', borderTop: `1px solid ${colors.border}`, paddingTop: 24, flexWrap: 'wrap' }}>
                          <button 
                              type="button" 
                              style={sharpStyles.btnSecondary}
                              onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.brown}`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${colors.brown}`; }}
                              onClick={() => { setShowForm(false); setSelectedAssetKey(''); }}
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
              <h2 style={{ marginTop: 0, color: colors.primary, marginBottom: '24px' }}>Request History</h2>
              
              {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9E9E9E' }}>Loading records...</div>
              ) : records.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9E9E9E', backgroundColor: '#FAFAFA', border: '1px dashed #CCC' }}>
                      No requests found.
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
                                  <tr style={{ backgroundColor: expandedRow === record.id ? colors.mint : 'transparent', transition: 'background-color 0.2s', borderBottom: `1px solid ${colors.border}` }}>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 'bold' }}>FS-{record.id.toString().padStart(4, '0')}</td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ fontWeight: 'bold', color: colors.header }}>{record.asset_name}</div>
                                      </td>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 'bold' }}>{record.request_type}</td>
                                      <td style={sharpStyles.tableCell}>{new Date(record.requested_date).toLocaleDateString()}</td>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 'bold', color: colors.primary }}>
                                          ETB {(record.estimated_cost_cents / 100).toLocaleString(undefined, {minimumFractionDigits:2})}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          {getStatusBadge(record.status)}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                              <button 
                                                  onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                                                  style={{ padding: '6px 10px', background: 'white', border: `1px solid ${colors.brown}`, cursor: 'pointer', borderRadius: '0px', boxShadow: `0 2px 0 ${colors.brown}` }}
                                                  onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                                                  onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 2px 0 ${colors.brown}`; }}
                                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 2px 0 ${colors.brown}`; }}
                                              >
                                                  {expandedRow === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                              </button>

                                              {record.status === 'PAYMENT_RELEASED' && (
                                                  <button 
                                                      onClick={() => handleComplete(record.id)}
                                                      style={sharpStyles.btnAction}
                                                      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = '0 0 0 transparent'; }}
                                                      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 0 ${colors.header}`; }}
                                                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 3px 0 ${colors.header}`; }}
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
                                                      <h4 style={{ margin: '0 0 8px 0', color: colors.header }}>Description</h4>
                                                      <p style={{ margin: 0, color: colors.text, lineHeight: '1.5' }}>{record.description}</p>
                                                      {record.driver_name && <p style={{ margin: '8px 0 0 0', color: colors.text }}><strong>Driver:</strong> {record.driver_name}</p>}
                                                      {record.current_mileage && <p style={{ margin: '4px 0 0 0', color: colors.text }}><strong>Mileage:</strong> {record.current_mileage} km</p>}
                                                  </div>
                                                  <div>
                                                      <h4 style={{ margin: '0 0 8px 0', color: colors.header }}>Workflow Timeline</h4>
                                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              <CheckCircle size={16} color={colors.primary} />
                                                              <span style={{ color: colors.text }}>Requested on {new Date(record.created_at).toLocaleDateString()}</span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {['FINANCE_READY', 'PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9E9E9E" />}
                                                              <span style={{ color: ['FINANCE_READY', 'PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? colors.text : '#9E9E9E' }}>
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
                                                                  Operation Completed
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

export default FuelService;
