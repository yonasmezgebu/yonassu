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

  useEffect(() => {
    if (document.getElementById('fm-style')) return;
    const style = document.createElement('style');
    style.id = 'fm-style';
    style.textContent = `
      @keyframes fmSpin { to { transform: rotate(360deg); } }
      @keyframes fmSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .fm-toast { animation: fmSlideIn .25s ease; }
      .fm-btn { transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
      .fm-btn:hover:not(:disabled) { background: #EAB308 !important; color: #111827 !important; border-color: #EAB308 !important; }
      .fm-btn:disabled { opacity: .5; cursor: not-allowed; }
      .fm-row td { transition: background-color .15s ease; }
      .fm-row:hover td { background: #F9FAFB !important; }
      @media (max-width: 768px) {
        .fm-content { padding: 16px !important; }
        .fm-btn { min-height: 44px; }
      }
      @media (max-width: 480px) {
        .fm-content { padding: 12px !important; }
      }
    `;
    document.head.appendChild(style);
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

  // Enterprise Color Palette
  const colors = {
      primary: '#2563EB',   // Accent blue
      header: '#111827',    // Dark text / headings
      emerald: '#2563EB',   // Primary buttons
      success: '#16A34A',   // Success green
      sage: '#E5E7EB',      // Light borders
      olive: '#6B7280',     // Secondary accents
      mint: '#EFF6FF',      // Soft highlight tint
      lime: '#16A34A',      // Success green
      brown: '#E5E7EB',     // Borders
      sky: '#0284C7',       // Info
      background: '#FFFFFF',// Main bg
      pageBg: '#F5F6FA',    // Page bg
      text: '#111827',      // Body text
      border: '#E5E7EB',
      warning: '#D97706',
      error: '#DC2626'
  };

  // Enterprise UI Theme
  const sharpStyles = {
      card: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '24px',
          width: '100%',
          boxSizing: 'border-box'
      },
      btnPrimary: {
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          height: 36,
          padding: '0 16px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 14,
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
      },
      btnSecondary: {
          backgroundColor: '#FFFFFF',
          color: '#374151',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          height: 36,
          padding: '0 16px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 14,
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
      },
      btnAction: {
          backgroundColor: '#16A34A',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          height: 32,
          padding: '0 12px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 13,
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
      },
      input: {
          width: '100%',
          height: 36,
          padding: '0 12px',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          outline: 'none',
          fontSize: 14,
          color: '#111827',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          fontFamily: 'inherit'
      },
      tableHeader: {
          backgroundColor: '#F9FAFB',
          color: '#6B7280',
          padding: '12px 16px',
          textAlign: 'left',
          fontWeight: 500,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          border: 'none',
          borderBottom: '1px solid #E5E7EB',
          whiteSpace: 'nowrap'
      },
      tableCell: {
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          color: '#111827',
          fontSize: 14
      }
  };

  const getStatusBadge = (status) => {
      let bg, text, label, icon;
      switch (status) {
          case 'PENDING_CEO':
              bg = '#FEF3C7'; text = '#D97706'; label = 'Awaiting CEO'; icon = <Clock size={14} />;
              break;
          case 'PENDING_FINANCE':
              bg = '#FEF3C7'; text = '#D97706'; label = 'Awaiting Finance'; icon = <Clock size={14} />;
              break;
          case 'FINANCE_APPROVED':
              bg = '#E0F2FE'; text = '#0284C7'; label = 'Finance Approved'; icon = <CheckCircle size={14} />;
              break;
          case 'PAYMENT_RELEASED':
              bg = '#EFF6FF'; text = '#2563EB'; label = 'Payment Released'; icon = <DollarSign size={14} />;
              break;
          case 'COMPLETED':
              bg = '#DCFCE7'; text = '#16A34A'; label = 'Completed'; icon = <CheckCircle size={14} />;
              break;
          default:
              bg = '#F3F4F6'; text = '#6B7280'; label = status; icon = <Clock size={14} />;
      }
      return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', backgroundColor: bg, color: text, fontSize: 12, fontWeight: 500, borderRadius: 9999 }}>
              {icon} {label}
          </span>
      );
  };

  return (
    <div style={{ backgroundColor: colors.pageBg, minHeight: '100vh', width: '100%', fontFamily: "'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* In-App Toast Notification */}
      {toast && (
        <div className="fm-toast" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: '#FFFFFF', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '360px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `4px solid ${toast.type === 'error' ? '#DC2626' : '#16A34A'}`, padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7', color: toast.type === 'error' ? '#DC2626' : '#16A34A' }}>
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          </div>
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: 0 }}>Fuel & Service Requests</h1>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: 14 }}>Record daily fuel and service operations for fleet.</p>
          </div>
          {!showForm && (
              <button 
                  className="fm-btn"
                  style={sharpStyles.btnPrimary} 
                  onClick={() => setShowForm(true)}
              >
                  <Plus size={18} /> New Request
              </button>
          )}
      </div>

      <div className="fm-content" style={{ padding: '24px', width: '100%', boxSizing: 'border-box', flex: 1 }}>
          {showForm && (
              <div style={{ ...sharpStyles.card, marginBottom: 16, borderTop: '3px solid #2563EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h2 style={{ margin: 0, color: '#2563EB', fontSize: 18, fontWeight: 600 }}>Create Fuel/Service Request</h2>
                      <button className="fm-btn" onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', color: '#6B7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '16px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={lbl}>Select Asset (Car or Tractor) *</label>
                          <select required style={sharpStyles.input} value={selectedAssetKey} onChange={handleAssetSelect}>
                              <option value="">-- Choose Asset --</option>
                              {assets.map(a => (
                                  <option key={`${a.asset_type}-${a.id}`} value={`${a.asset_type}-${a.id}`}>{a.name} ({a.asset_type === 'car' ? 'Car' : 'Tractor'})</option>
                              ))}
                          </select>
                      </div>

                      {selectedAssetData && (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: 16, borderRadius: 8, flexWrap: 'wrap' }}>
                              <div style={{ width: '150px', height: '100px', backgroundColor: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                                  {(selectedAssetData.image1 || selectedAssetData.image2) ? (
                                      <img src={`http://localhost:5000${selectedAssetData.image1 || selectedAssetData.image2}`} alt={selectedAssetData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                                  ) : (
                                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>No Image</span>
                                  )}
                              </div>
                              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  <div>
                                      <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>ASSET NAME</div>
                                      <div style={{ color: colors.text }}>{selectedAssetData.name}</div>
                                  </div>
                                  <div>
                                      <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TYPE</div>
                                      <div style={{ color: colors.text, textTransform: 'capitalize' }}>{selectedAssetData.asset_type}</div>
                                  </div>
                              </div>
                          </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 8, margin: '16px 0', color: '#111827', fontSize: 16, fontWeight: 600 }}>1. Request Details</h3>
                      </div>

                      <div>
                          <label style={lbl}>Request Type *</label>
                          <select required style={sharpStyles.input} value={formData.request_type} onChange={(e) => setFormData({...formData, request_type: e.target.value})}>
                              <option value="Fuel">Fuel</option>
                              <option value="Service">Service</option>
                              <option value="Wash">Wash</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      
                      <div>
                          <label style={lbl}>Priority Level *</label>
                          <select required style={sharpStyles.input} value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                          </select>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <label style={lbl}>Description *</label>
                          <textarea required rows={3} style={{ ...sharpStyles.input, height: 'auto', minHeight: 80, padding: '10px 12px', resize: 'vertical' }} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. 50 Liters of Diesel, or Car Wash..."></textarea>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 8, margin: '16px 0', color: '#111827', fontSize: 16, fontWeight: 600 }}>2. Operation Info</h3>
                      </div>

                      <div>
                          <label style={lbl}>Driver Name</label>
                          <input type="text" style={sharpStyles.input} value={formData.driver_name} onChange={(e) => setFormData({...formData, driver_name: e.target.value})} placeholder="Name of driver" />
                      </div>

                      <div>
                          <label style={lbl}>Current Mileage (KM)</label>
                          <input type="number" style={sharpStyles.input} value={formData.current_mileage} onChange={(e) => setFormData({...formData, current_mileage: e.target.value})} placeholder="E.g. 45000" />
                      </div>

                      <div>
                          <label style={lbl}>Location / Gas Station</label>
                          <input type="text" style={sharpStyles.input} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Where?" />
                      </div>

                      <div>
                          <label style={lbl}>Reported By</label>
                          <input type="text" style={sharpStyles.input} value={formData.reported_by} onChange={(e) => setFormData({...formData, reported_by: e.target.value})} placeholder="Who reported?" />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                          <h3 style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 8, margin: '16px 0', color: '#111827', fontSize: 16, fontWeight: 600 }}>3. Cost & Date</h3>
                      </div>

                      <div>
                          <label style={lbl}>Estimated Cost (ETB) *</label>
                          <input required type="number" step="0.01" min="0" style={sharpStyles.input} value={formData.estimated_cost_cents} onChange={(e) => setFormData({...formData, estimated_cost_cents: e.target.value})} placeholder="0.00" />
                      </div>

                      <div>
                          <label style={lbl}>Date *</label>
                          <input required type="date" style={sharpStyles.input} value={formData.requested_date} onChange={(e) => setFormData({...formData, requested_date: e.target.value})} />
                      </div>

                      <div>
                          <label style={lbl}>Notes</label>
                          <textarea rows={3} style={{ ...sharpStyles.input, height: 'auto', minHeight: 80, padding: '10px 12px', resize: 'vertical' }} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any additional notes..."></textarea>
                      </div>

                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px', borderTop: `1px solid ${colors.border}`, paddingTop: 24, flexWrap: 'wrap' }}>
                          <button 
                              type="button" 
                              className="fm-btn"
                              style={sharpStyles.btnSecondary}
                              onClick={() => { setShowForm(false); setSelectedAssetKey(''); }}
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              className="fm-btn"
                              style={sharpStyles.btnPrimary}
                          >
                              SUBMIT REQUEST TO CEO
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {/* Records Table */}
          <div style={{ ...sharpStyles.card, overflowX: 'auto' }}>
              <h2 style={{ marginTop: 0, color: '#111827', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Request History</h2>
              
              {loading ? (
                  <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E5E7EB', borderTop: '4px solid #2563EB', borderRight: '4px solid #2563EB', animation: 'fmSpin 1s linear infinite', margin: '0 auto 16px' }} />
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#6B7280' }}>Loading service records…</div>
                  </div>
              ) : records.length === 0 ? (
                  <div style={{ padding: '64px 20px', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <Clock size={26} color="#2563EB" />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>No requests found</div>
                      <div style={{ color: '#6B7280', fontSize: 14, marginTop: 6 }}>Click "New Request" to create the first fuel/service request.</div>
                  </div>
              ) : (
                  <table className="fm-table" style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
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
                                  <tr className="fm-row" style={{ backgroundColor: expandedRow === record.id ? '#EFF6FF' : 'transparent', transition: 'background-color 0.15s', borderBottom: '1px solid #E5E7EB' }}>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 600, color: '#2563EB', whiteSpace: 'nowrap' }}>FS-{record.id.toString().padStart(4, '0')}</td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ fontWeight: 600, color: colors.header }}>{record.asset_name}</div>
                                      </td>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 600 }}>{record.request_type}</td>
                                      <td style={sharpStyles.tableCell}>{new Date(record.requested_date).toLocaleDateString()}</td>
                                      <td style={{ ...sharpStyles.tableCell, fontWeight: 600, color: '#2563EB', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                          ETB {(record.estimated_cost_cents / 100).toLocaleString(undefined, {minimumFractionDigits:2})}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          {getStatusBadge(record.status)}
                                      </td>
                                      <td style={sharpStyles.tableCell}>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                              <button 
                                                  className="fm-btn"
                                                  onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                                                  style={{ width: 32, height: 32, background: '#FFFFFF', border: '1px solid #E5E7EB', cursor: 'pointer', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                                              >
                                                  {expandedRow === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                              </button>

                                              {record.status === 'PAYMENT_RELEASED' && (
                                                  <button 
                                                      className="fm-btn"
                                                      onClick={() => handleComplete(record.id)}
                                                      style={sharpStyles.btnAction}
                                                  >
                                                      Complete
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                                  {expandedRow === record.id && (
                                      <tr>
                                          <td colSpan="7" style={{ padding: 0, borderBottom: '1px solid #E5E7EB' }}>
                                              <div style={{ padding: '24px', backgroundColor: '#F9FAFB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                                                                  <Clock size={16} color="#9CA3AF" />}
                                                              <span style={{ color: ['FINANCE_READY', 'PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? colors.text : '#9CA3AF' }}>
                                                                  Finance Approval
                                                              </span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {['PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9CA3AF" />}
                                                              <span style={{ color: ['PAYMENT_RELEASED', 'COMPLETED'].includes(record.status) ? colors.text : '#9CA3AF' }}>
                                                                  Payment Released
                                                              </span>
                                                          </div>
                                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                              {record.status === 'COMPLETED' ? 
                                                                  <CheckCircle size={16} color={colors.primary} /> : 
                                                                  <Clock size={16} color="#9CA3AF" />}
                                                              <span style={{ color: record.status === 'COMPLETED' ? colors.text : '#9CA3AF' }}>
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

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em',
};

export default FuelService;
