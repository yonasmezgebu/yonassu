import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';

const TenderBidsEvaluation = () => {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [evaluationData, setEvaluationData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const { data } = await api.get('/public-tenders/internal');
      setTenders(data.data.filter(t => t.status === 'published' || t.status === 'closed'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBids = async (tenderId) => {
    if (!tenderId) {
      setEvaluationData([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/public-tenders/internal/${tenderId}/bids`);
      setEvaluationData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenderSelect = (e) => {
    const id = e.target.value;
    setSelectedTenderId(id);
    fetchBids(id);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Evaluate Bids by Product</h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Select a public tender to view bids. Bids are grouped by product and sorted from lowest to highest price automatically.
      </p>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Select Tender</label>
        <select 
          value={selectedTenderId}
          onChange={handleTenderSelect}
          style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          <option value="">-- Choose a Tender --</option>
          {tenders.map(t => (
            <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
          ))}
        </select>
      </div>

      {loading && <div>Loading bids...</div>}

      {!loading && evaluationData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {evaluationData.map((group) => (
            <div key={group.tenderItem.id} style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  Product: {group.tenderItem.object_type} 
                  <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b', marginLeft: '12px' }}>
                    (Qty: {group.tenderItem.quantity} {group.tenderItem.unit})
                  </span>
                </h3>
              </div>
              <div style={{ padding: '16px', overflowX: 'auto' }}>
                {group.bids.length === 0 ? (
                  <p style={{ color: '#64748b' }}>No bids submitted for this product.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Rank</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Competitor Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Unit Price (Birr.Cent)</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Total Value</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Checkup / Remarks</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bids.map((bid, index) => (
                        <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0', background: index === 0 ? '#f0fdf4' : 'transparent' }}>
                          <td style={{ padding: '12px', fontWeight: index === 0 ? 'bold' : 'normal', color: index === 0 ? '#166534' : 'inherit' }}>
                            {index === 0 ? '🏆 1st (Lowest)' : `${index + 1}th`}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{bid.competitor_name}</td>
                          <td style={{ padding: '12px' }}>
                            {bid.price_birr}.{bid.price_cent.toString().padStart(2, '0')} ETB
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>
                            {bid.total_birr}.{bid.total_cent.toString().padStart(2, '0')} ETB
                          </td>
                          <td style={{ padding: '12px' }}>{bid.checkup || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            <button style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              Select to Buy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && selectedTenderId && evaluationData.length === 0 && (
        <p>No products found for this tender.</p>
      )}
    </div>
  );
};

export default TenderBidsEvaluation;
