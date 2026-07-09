import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { PlusCircle, Search, CheckCircle, FileText, Activity, AlertCircle, X } from 'lucide-react';

const PurchaseSmartTenders = () => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'evaluate'
  
  // Create Tab State
  const [newTender, setNewTender] = useState({ title: '', description: '' });
  const [tenderItems, setTenderItems] = useState([{ id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  // Evaluate Tab State
  const [activeTenders, setActiveTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [bidsData, setBidsData] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    if (activeTab === 'evaluate') {
      fetchInternalTenders();
    }
  }, [activeTab]);

  const fetchInternalTenders = async () => {
    setLoadingTenders(true);
    try {
      const { data } = await api.get('/public-tenders/internal');
      setActiveTenders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTenders(false);
    }
  };

  const loadBidsForTender = async (id) => {
    setSelectedTenderId(id);
    setLoadingBids(true);
    try {
      const { data } = await api.get(`/public-tenders/internal/${id}/bids`);
      // data.data is array of { tenderItem, bids: [] }
      setBidsData(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBids(false);
    }
  };

  // --- CREATE TENDER LOGIC ---
  const handleAddItem = () => {
    setTenderItems([...tenderItems, { id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
  };

  const handleRemoveItem = (id) => {
    setTenderItems(tenderItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setTenderItems(tenderItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        title: newTender.title,
        description: newTender.description,
        items: tenderItems.map(i => ({
          objectType: i.objectType,
          unit: i.unit,
          quantity: parseInt(i.quantity, 10)
        }))
      };
      await api.post('/public-tenders/internal', payload);
      setCreateMsg('Tender successfully posted to public sell page!');
      setNewTender({ title: '', description: '' });
      setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
    } catch (err) {
      alert('Error creating tender');
    } finally {
      setCreating(false);
    }
  };

  // --- SUBMIT EVALUATION LOGIC ---
  const handleSubmitEvaluation = async () => {
    if (!window.confirm('Are you sure you want to submit this evaluation to the CEO for final approval?')) return;
    try {
      await api.put(`/public-tenders/internal/${selectedTenderId}/submit-evaluation`);
      alert('Evaluation submitted to CEO successfully.');
      setSelectedTenderId(null);
      fetchInternalTenders(); // refresh list
    } catch (err) {
      alert('Error submitting evaluation');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Tender & Bid Hub</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Manage smart public tenders, collect bids, and submit evaluations to the CEO.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('create')}
            style={{ 
              padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'create' ? 'white' : 'transparent',
              color: activeTab === 'create' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'create' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Create Tender
          </button>
          <button 
            onClick={() => setActiveTab('evaluate')}
            style={{ 
              padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'evaluate' ? 'white' : 'transparent',
              color: activeTab === 'evaluate' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'evaluate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Evaluate Bids
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="#3b82f6" /> Post New Public Tender
          </h2>
          {createMsg && (
            <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} /> {createMsg}
            </div>
          )}
          
          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Tender Title</label>
                <input 
                  required value={newTender.title} onChange={e => setNewTender({...newTender, title: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} placeholder="e.g., Procurement of Office Computers" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Description / Guidelines</label>
                <input 
                  required value={newTender.description} onChange={e => setNewTender({...newTender, description: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} placeholder="Provide a brief overview for competitors..." 
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Tender Items (Smart Table Format)</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Note: You are only defining the items here. Competitors will fill out the pricing and totals on the public page.</p>
              
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>No</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Object Type</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Unit</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Quantity</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#cbd5e1' }} colSpan="2">Price (Competitor)</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#cbd5e1' }} colSpan="2">Total (Competitor)</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#cbd5e1' }}>Checkup</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenderItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            required value={item.objectType} onChange={e => handleItemChange(item.id, 'objectType', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g., Laptop" 
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            required value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="Pcs" 
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                          />
                        </td>
                        {/* Disabled Competitor columns */}
                        <td style={{ padding: '12px', background: '#f8fafc' }}><input disabled style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '4px', cursor: 'not-allowed' }} placeholder="Birr" /></td>
                        <td style={{ padding: '12px', background: '#f8fafc' }}><input disabled style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '4px', cursor: 'not-allowed' }} placeholder="Cent" /></td>
                        <td style={{ padding: '12px', background: '#f8fafc' }}><input disabled style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '4px', cursor: 'not-allowed' }} placeholder="Birr" /></td>
                        <td style={{ padding: '12px', background: '#f8fafc' }}><input disabled style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '4px', cursor: 'not-allowed' }} placeholder="Cent" /></td>
                        <td style={{ padding: '12px', background: '#f8fafc' }}><input disabled style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '6px', borderRadius: '4px', cursor: 'not-allowed' }} placeholder="Remarks" /></td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button 
                type="button" onClick={handleAddItem}
                style={{ marginTop: '16px', padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={16} /> Add Product Item
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <button 
                type="submit" disabled={creating}
                style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '16px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
              >
                {creating ? 'Posting...' : 'Post Tender to Public Page'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'evaluate' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTenderId ? '350px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          {/* Tenders List */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#3b82f6" /> Active Tenders
            </h2>
            {loadingTenders ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTenders.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => loadBidsForTender(t.id)}
                    style={{ 
                      padding: '16px', border: '1px solid', borderColor: selectedTenderId === t.id ? '#3b82f6' : '#e2e8f0', 
                      borderRadius: '8px', cursor: 'pointer', background: selectedTenderId === t.id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, background: t.status === 'published' ? '#dcfce7' : '#fef9c3', color: t.status === 'published' ? '#166534' : '#854d0e', padding: '4px 8px', borderRadius: '12px' }}>
                        {t.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px', color: '#1e293b' }}>{t.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                  </div>
                ))}
                {activeTenders.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>No active tenders found.</p>}
              </div>
            )}
          </div>

          {/* Evaluation Panel */}
          {selectedTenderId && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Smart Bid Evaluation</h2>
                <button 
                  onClick={handleSubmitEvaluation}
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Submit to CEO for Approval
                </button>
              </div>

              {loadingBids ? <p>Loading bids...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {bidsData.map(dataGroup => (
                    <div key={dataGroup.tenderItem.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                          Product: <span style={{ color: '#3b82f6' }}>{dataGroup.tenderItem.object_type}</span>
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Requested: {dataGroup.tenderItem.quantity} {dataGroup.tenderItem.unit}</p>
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'white', fontSize: '13px', color: '#64748b' }}>
                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Rank</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Competitor</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Price (Birr.Cent)</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total (Birr.Cent)</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataGroup.bids.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No bids received for this product yet.</td></tr>
                          ) : (
                            dataGroup.bids.map((bid, index) => (
                              <tr key={bid.id} style={{ background: index === 0 ? '#ecfdf5' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px' }}>
                                  {index === 0 ? <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>1st (Lowest)</span> : `${index + 1}th`}
                                </td>
                                <td style={{ padding: '12px', fontWeight: index === 0 ? 600 : 400 }}>{bid.competitor_name}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px' }}>
                                  {bid.price_birr}.{bid.price_cent.toString().padStart(2, '0')}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', fontWeight: 600 }}>
                                  {bid.total_birr}.{bid.total_cent.toString().padStart(2, '0')}
                                </td>
                                <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>{bid.checkup || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {bidsData.length === 0 && <p style={{ color: '#64748b' }}>No products found in this tender.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseSmartTenders;
