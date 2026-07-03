import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  Phone, User, Search, AlertTriangle, CheckCircle, XCircle, Bell,
  MessageSquare, Globe, ShoppingCart
} from 'lucide-react';

const CHANNELS = [
  { key: 'phone', label: 'Phone', icon: <Phone size={15} /> },
  { key: 'in_person', label: 'In Person', icon: <User size={15} /> },
  { key: 'online', label: 'Online Form', icon: <Globe size={15} /> },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', icon: <CheckCircle size={14} color="#10B981" />, color: '#D1FAE5' },
  { value: 'LOW_STOCK', label: 'Low Stock ⚠️', icon: <AlertTriangle size={14} color="#F59E0B" />, color: '#FEF3C7' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock ❌', icon: <XCircle size={14} color="#EF4444" />, color: '#FEE2E2' },
];

export default function CustomerQueryForm() {
  const { user, isAuthenticated } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [channel, setChannel] = useState('phone');
  const [loading, setLoading] = useState(false);

  const [drugName, setDrugName] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [responseStatus, setResponseStatus] = useState('AVAILABLE');
  const [notifyOnRestock, setNotifyOnRestock] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drugName.trim()) { showToast('Drug name is required', 'warning'); return; }
    if (!customerName.trim()) { showToast('Customer name is required', 'warning'); return; }
    if (!customerPhone.trim()) { showToast('Customer phone is required', 'warning'); return; }

    if (channel === 'online' && !isAuthenticated) {
      showToast('Please login to submit an online query', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        drug_name: drugName,
        channel: channel === 'in_person' ? 'in_person' : channel,
        response_status: responseStatus,
        customer_name: customerName,
        customer_phone: customerPhone,
        notify_on_restock: notifyOnRestock,
      };
      const res = await apiClient.post('/pharmacy/queries', payload);
      if (res.status === 'success') {
        showToast('Query submitted successfully', 'success');
        playSound('success');
        setDrugName('');
        setCustomerName(user?.name || user?.full_name || '');
        setCustomerPhone(user?.phone || '');
        setResponseStatus('AVAILABLE');
        setNotifyOnRestock(false);
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to submit query', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={22} color="#059669" /> Drug Availability Query (B6)
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Check drug availability via phone, in person, or online</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CHANNELS.map(ch => (
          <button key={ch.key}
            style={tabBtn(channel === ch.key)}
            onClick={() => setChannel(ch.key)}>
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#224f94', color: 'white', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 8 }}>SUTANA</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Query Form</h2>
                <p style={{ margin: 0, fontSize: 10, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Channel: {channel === 'phone' ? 'Phone' : channel === 'in_person' ? 'In Person' : 'Online Form'}
                </p>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -30, right: -20, width: 150, height: 150, background: '#4585c5', borderRadius: '40% 60% 70% 30%', opacity: 0.6 }}></div>
            <div style={{ position: 'absolute', bottom: -8, right: 80, width: 50, height: 50, background: '#1c3d70', borderRadius: '12px' }}></div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}><ShoppingCart size={13} /> Drug Name *</label>
              <input type="text" value={drugName} onChange={e => setDrugName(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg" style={inputStyle()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}><User size={13} /> Customer Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Full name" style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}><Phone size={13} /> Customer Phone *</label>
                <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+251..." style={inputStyle()} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}><AlertTriangle size={13} /> Response Status *</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', flex: 1,
                    border: `2px solid ${responseStatus === opt.value ? '#059669' : '#E2E8F0'}`,
                    borderRadius: 8, cursor: 'pointer', background: responseStatus === opt.value ? '#ECFDF5' : 'white',
                    fontWeight: 600, fontSize: 13, color: responseStatus === opt.value ? '#065F46' : '#475569',
                    minWidth: 140,
                  }}>
                    <input type="radio" name="responseStatus" value={opt.value}
                      checked={responseStatus === opt.value}
                      onChange={() => setResponseStatus(opt.value)} style={{ display: 'none' }} />
                    {opt.icon} {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {responseStatus === 'OUT_OF_STOCK' && (
              <div style={{ marginBottom: 20, background: '#FEF2F2', borderRadius: 8, padding: '12px 16px', border: '1px solid #FECACA' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                  <input type="checkbox" checked={notifyOnRestock} onChange={e => setNotifyOnRestock(e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  <Bell size={14} /> Notify me when back in stock
                </label>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px 24px', background: '#059669', color: 'white', border: 'none',
                borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
              }}>
              <Search size={18} /> {loading ? 'Submitting...' : 'Submit Query'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = () => ({ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
