import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/Toast';
import { CheckCircle, Truck, Package, AlertCircle, ClipboardList } from 'lucide-react';

const ReceiveShipments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(id ? parseInt(id) : null);
  const [detail, setDetail] = useState(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadShippedRequests();
    if (id) loadDetail(parseInt(id));
  }, [id]);

  const loadShippedRequests = async () => {
    try {
      const res = await apiClient.get('/pharmacy/transfers');
      if (res.status === 'success') setRequests((res.data || []).filter(r => r.status === 'SHIPPED'));
    } catch (e) { console.error(e); }
  };

  const loadDetail = async (reqId) => {
    try {
      const res = await apiClient.get(`/pharmacy/transfers/${reqId}`);
      if (res.status === 'success') setDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const handleReceive = async () => {
    if (!receivedQty || parseInt(receivedQty) < 1) { showToast('Enter the quantity received', 'warning'); return; }
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/pharmacy/transfers/${selected}/receive`, { quantityReceived: receivedQty });
      if (res.status === 'success') {
        showToast(`Received ${receivedQty} units successfully`, 'success');
        setReceivedQty('');
        setDetail(d => ({ ...d, status: 'COMPLETED' }));
        loadShippedRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Receiving failed', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <ClipboardList size={22} color="#059669" />
        <h2 style={{ margin: 0, fontSize: 20, color: '#1E293B' }}>Receive Shipments</h2>
        {requests.length > 0 && (
          <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {requests.length} incoming
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', maxHeight: '70vh', overflow: 'auto' }}>
          {requests.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              <Truck size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No shipments in transit</div>
            </div>
          ) : requests.map(r => (
            <div key={r.id} onClick={() => { setSelected(r.id); setReceivedQty(''); loadDetail(r.id); }} style={{
              padding: '14px 18px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
              background: selected === r.id ? '#F0FDF4' : 'white',
              borderLeft: selected === r.id ? '3px solid #059669' : '3px solid transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 13, color: '#1E293B' }}>{r.request_number}</strong>
                <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>SHIPPED</span>
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>{r.drug_name} — {r.quantity_requested} units</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Shipped: {new Date(r.updated_at || r.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '1.5rem', minHeight: 300 }}>
          {!detail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, color: '#94A3B8', fontSize: 13 }}>
              Select a shipment to receive
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1E293B' }}>{detail.request_number}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{detail.drug_name} — Requested: {detail.quantity_requested} units</p>
              </div>

              <div style={{ background: '#FAF5FF', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #F3E8FF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Truck size={16} color="#6B21A8" />
                  <strong style={{ fontSize: 13, color: '#6B21A8' }}>Shipment Details</strong>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  {detail.shipment_number && <div>Shipment #: <strong>{detail.shipment_number}</strong></div>}
                  <div>Quantity Shipped: <strong>{detail.quantity_shipped || detail.quantity_requested}</strong></div>
                  <div>Shipped by: <strong>{detail.shipped_by_name || 'Store Manager'}</strong></div>
                </div>
              </div>

              {detail.status === 'SHIPPED' && (
                <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 16, border: '1px solid #BBF7D0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Package size={16} color="#059669" />
                    <strong style={{ fontSize: 13, color: '#065F46' }}>Confirm Receipt</strong>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      Quantity Received
                    </label>
                    <input type="number" min="1" value={receivedQty}
                      onChange={(e) => setReceivedQty(e.target.value)}
                      placeholder={`Enter qty (max ${detail.quantity_shipped || detail.quantity_requested})`}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }} />
                  </div>
                  <button onClick={handleReceive} disabled={actionLoading} style={{
                    padding: '12px 24px', background: '#059669', color: 'white', border: 'none',
                    borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8
                  }}><CheckCircle size={18} /> {actionLoading ? 'Processing...' : 'Confirm Receipt & Complete'}</button>
                </div>
              )}

              {detail.status === 'COMPLETED' && (
                <div style={{ background: '#D1FAE5', borderRadius: 8, padding: 16, textAlign: 'center', border: '1px solid #A7F3D0' }}>
                  <CheckCircle size={32} color="#059669" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Shipment Completed</div>
                  <div style={{ fontSize: 12, color: '#065F46', marginTop: 4 }}>All units received</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveShipments;
