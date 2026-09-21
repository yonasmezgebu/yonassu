import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { playSound, sendPushNotification } from '../../services/notificationManager';
import { useToast } from '../../components/Toast';
import { Package, Truck, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const PharmacyShipments = () => {
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [shipQty, setShipQty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadApprovedRequests(); }, []);

  const loadApprovedRequests = async () => {
    try {
      const res = await apiClient.get('/pharmacy/transfers');
      if (res.status === 'success') setRequests((res.data || []).filter(r => r.status === 'APPROVED'));
    } catch (e) { console.error(e); }
  };

  const handleShip = async () => {
    if (!shipQty || parseInt(shipQty) < 1) { showToast('Enter a valid quantity to ship', 'warning'); return; }
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/pharmacy/transfers/${selected}/ship`, { quantityShipped: shipQty });
      if (res.status === 'success') {
        showToast(`Shipped ${shipQty} units to Pharmacy`, 'success');
        playSound('info');
        sendPushNotification('Pharmacy Transfer Shipped', `${res.data.drug_name || 'Drug'} — ${shipQty} units in transit`, `/pharmacy/receive-shipment/${selected}`);
        setShipQty('');
        setSelected(null);
        loadApprovedRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Shipment failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleShipAll = async () => {
    if (!selected) return;
    const req = requests.find(r => r.id === selected);
    if (!req) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/pharmacy/transfers/${selected}/ship`, { quantityShipped: req.quantity_requested });
      if (res.status === 'success') {
        showToast(`Shipped ${req.quantity_requested} units to Pharmacy`, 'success');
        playSound('info');
        sendPushNotification('Pharmacy Transfer Shipped', `${req.drug_name} — ${req.quantity_requested} units in transit`, `/pharmacy/receive-shipment/${selected}`);
        setShipQty('');
        setSelected(null);
        loadApprovedRequests();
      }
    } catch (e) { showToast(e.response?.data?.message || 'Shipment failed', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <Truck size={22} color="#6B21A8" />
        <h2 style={{ margin: 0, fontSize: 20, color: '#1E293B' }}>Pharmacy Shipment Processing</h2>
        {requests.length > 0 && (
          <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {requests.length} pending
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
          <Package size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No approved transfers to ship</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Approved transfers from CEO will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => (
            <div key={r.id} onClick={() => { setSelected(r.id); setShipQty(''); }} style={{
              background: selected === r.id ? '#F5F3FF' : 'white',
              border: selected === r.id ? '2px solid #8B5CF6' : '1px solid #E2E8F0',
              borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
              transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14, color: '#1E293B' }}>{r.request_number}</strong>
                  <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>APPROVED</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748B' }}>{new Date(r.updated_at || r.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#374151' }}>
                <span>Drug: <strong>{r.drug_name}</strong></span>
                <span>Requested: <strong>{r.quantity_requested}</strong></span>
                <span>Pharmacy: <strong>{r.created_by_name}</strong></span>
              </div>

              {selected === r.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Quantity to Ship</label>
                    <input type="number" min="1" max={r.quantity_requested} value={shipQty}
                      onChange={(e) => setShipQty(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }} />
                  </div>
                  <button onClick={handleShipAll} style={{
                    padding: '8px 16px', background: '#6B21A8', color: 'white', border: 'none',
                    borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>Ship Full Qty ({r.quantity_requested})</button>
                  <button onClick={handleShip} disabled={actionLoading || !shipQty} style={{
                    padding: '8px 16px', background: '#059669', color: 'white', border: 'none',
                    borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1, whiteSpace: 'nowrap'
                  }}>{actionLoading ? 'Shipping...' : 'Mark as Shipped'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyShipments;
