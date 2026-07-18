import React, { useState, useEffect } from 'react';
import purchaseService from '../../services/purchaseService';
import { formatNumber } from '../../utils/formatters';
import styles from './ReceivePO.module.css';
const ReceivePO = () => {
  const [pendingReceiving, setPendingReceiving] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [receiveData, setReceiveData] = useState([]);
  const [receivingNote, setReceivingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchPendingReceiving();
  }, []);
  const fetchPendingReceiving = async () => {
    try {
      const response = await purchaseService.getPendingReceiving();
      setPendingReceiving(response.data?.pendingReceiving || []);
    } catch (error) {
      console.error('Failed to fetch pending receiving:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSelectPO = (po) => {
    setSelectedPO(po);
    // Since pending POs from the list might not have items populated, we need to fetch the full PO
    fetchPODetails(po.po_id || po.id);
  };

  const fetchPODetails = async (id) => {
    try {
      const response = await purchaseService.getPendingReceivingById(id);
      const fullPo = response.data?.purchaseOrder || response.data?.order;
      if (fullPo && fullPo.items) {
        setReceiveData(fullPo.items.map(item => ({
          poItemId: item.id,
          productName: item.product_name,
          requiresSerial: item.requires_serial || false,
          quantityOrdered: item.quantity_ordered,
          quantityReceived: item.quantity_ordered - (item.quantity_received || 0),
          quantityDamaged: 0,
          qualityPass: true,
          serialNumbersInput: ''
        })));
      }
    } catch (error) {
      console.error('Failed to fetch PO details:', error);
      setMessage({ type: 'error', text: 'Failed to load PO items' });
    }
    setMessage(null);
  };
  const handleItemChange = (index, field, value) => {
    const updated = [...receiveData];
    updated[index][field] = value;
    setReceiveData(updated);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await purchaseService.registerReceiving({
        poId: selectedPO.po_id || selectedPO.id,
        items: receiveData.map(item => ({
          poItemId: item.poItemId,
          quantityReceived: parseInt(item.quantityReceived),
          quantityDamaged: parseInt(item.quantityDamaged),
          qualityPass: item.qualityPass,
          serialNumbers: item.requiresSerial ? item.serialNumbersInput.split('\n').map(s => s.trim()).filter(s => s) : undefined
        })),
        receivingNote
      });
      setMessage({ type: 'success', text: 'Items received successfully!' });
      setSelectedPO(null);
      fetchPendingReceiving();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to receive items' });
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div className={styles.loading}>Loading pending purchase orders...</div>;
  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#1E293B', fontSize: 24, fontWeight: 700 }}>Receive Purchase Orders</h2>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: message.type === 'error' ? '#FEE2E2' : '#D1FAE5', color: message.type === 'error' ? '#991B1B' : '#065F46', borderRadius: 8, marginBottom: '1.5rem', fontSize: 14 }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '70vh', overflow: 'auto' }}>
          {pendingReceiving.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No pending purchase orders to receive.</div>
          ) : (
            <div>
              {pendingReceiving.map(po => (
                <div key={po.po_id || po.id} onClick={() => handleSelectPO(po)} style={{
                  padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                  background: selectedPO && (selectedPO.po_id || selectedPO.id) === (po.po_id || po.id) ? '#F0FDF4' : 'white',
                  borderLeft: selectedPO && (selectedPO.po_id || selectedPO.id) === (po.po_id || po.id) ? '3px solid #059669' : '3px solid transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#1E293B' }}>PO #{po.po_number}</strong>
                    <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{po.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{po.supplier_name}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                    <span>Expected: {new Date(po.expected_delivery_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', position: 'relative', minHeight: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {!selectedPO ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1, color: '#94A3B8', fontSize: 13 }}>Select a PO to Receive</div>
          ) : (
            <div style={{ padding: '2rem', flex: 1, overflow: 'auto' }}>
              <h2 style={{ color: '#065F46', fontSize: 24, fontStyle: 'italic', fontWeight: 800, textAlign: 'center', margin: '0 0 5px 0' }}>Goods Receipt Form</h2>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#64748B', marginBottom: 24 }}>Model 19</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13, marginBottom: 24, color: '#1E293B' }}>
                <div><strong>Receipt No.:</strong> PO-{selectedPO.po_number}</div>
                <div><strong>Receipt Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Supplier:</strong> {selectedPO.supplier_name}</div>
                <div><strong>Purchase Order:</strong> #{selectedPO.po_number}</div>
                <div><strong>Warehouse:</strong> Main Store</div>
                <div><strong>Received By:</strong> Store Manager</div>
              </div>

              <form onSubmit={handleSubmit}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1E293B', marginBottom: 24 }}>
                  <thead>
                    <tr style={{ background: '#065F46', color: 'white' }}>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Item</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Ordered</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Received Now</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Damaged</th>
                      <th style={{ padding: 10, border: '1px solid #1E293B', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Quality Pass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveData.map((item, index) => (
                      <React.Fragment key={item.poItemId}>
                        <tr>
                          <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13 }}>
                            <strong>{item.productName}</strong>
                            {item.requiresSerial && <span style={{ color: '#059669', fontSize: 11, marginLeft: 6 }}>(Requires Serial)</span>}
                          </td>
                          <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>{item.quantityOrdered}</td>
                          <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>
                            <input type="number" min="0" max={item.quantityOrdered} value={item.quantityReceived} onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)} style={{ width: 60, padding: 4, textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: 4 }} required />
                          </td>
                          <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>
                            <input type="number" min="0" value={item.quantityDamaged} onChange={(e) => handleItemChange(index, 'quantityDamaged', e.target.value)} style={{ width: 60, padding: 4, textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: 4 }} />
                          </td>
                          <td style={{ padding: 12, border: '1px solid #1E293B', fontSize: 13, textAlign: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                              <input type="checkbox" checked={item.qualityPass} onChange={(e) => handleItemChange(index, 'qualityPass', e.target.checked)} />
                              Pass
                            </label>
                          </td>
                        </tr>
                        {item.requiresSerial && parseInt(item.quantityReceived) > 0 && (
                          <tr>
                            <td colSpan="5" style={{ padding: 12, border: '1px solid #1E293B', background: '#F8FAFC' }}>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Serial Numbers (1 per line) - Need {item.quantityReceived}:</label>
                              <textarea rows={Math.min(10, parseInt(item.quantityReceived))} value={item.serialNumbersInput} onChange={(e) => handleItemChange(index, 'serialNumbersInput', e.target.value)} placeholder={`Enter ${item.quantityReceived} serial numbers...`} required style={{ width: '100%', padding: 8, border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 13, resize: 'vertical' }} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {receiveData.length < 5 && [...Array(5 - receiveData.length)].map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                        <td style={{ padding: 16, border: '1px solid #1E293B' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>Remarks:</label>
                  <textarea value={receivingNote} onChange={(e) => setReceivingNote(e.target.value)} placeholder="Any issues with delivery, packaging, etc." style={{ width: '100%', padding: '10px 12px', border: '1px solid #1E293B', borderRadius: 4, fontSize: 13, resize: 'vertical' }} rows={2} />
                </div>

                <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px 24px', background: '#065F46', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Processing...' : 'Confirm Receipt & Complete Form'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReceivePO;
