import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { playSound } from '../../services/notificationManager';
import {
  Upload, Pill, Phone, User, MessageSquare, CheckCircle, List, FileText,
  RefreshCw, Hash, Clock, Calendar, AlertCircle, Package
} from 'lucide-react';

const SOURCES = [
  { value: 'From Hospital', label: 'From Hospital' },
  { value: 'From Health Institution', label: 'From Health Institution' },
  { value: 'From Private Doctor', label: 'From Private Doctor' },
];

export default function CustomerPrescription() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState('submit');
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  const [customerName, setCustomerName] = useState(user?.fullName || user?.name || user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [drugName, setDrugName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [source, setSource] = useState('From Hospital');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || user.name || user.full_name || '');
      setCustomerPhone(user.phone || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'list') fetchPrescriptions();
  }, [tab]);

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const res = await apiClient.get('/pharmacy/prescriptions');
      setPrescriptions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescriptionFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) { showToast('Full name is required', 'warning'); return; }
    if (!customerPhone.trim()) { showToast('Phone is required', 'warning'); return; }
    if (!drugName.trim()) { showToast('Drug name is required', 'warning'); return; }
    if (!quantity) { showToast('Quantity is required', 'warning'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('customer_phone', customerPhone);
      formData.append('customer_email', customerEmail);
      if (prescriptionFile) formData.append('prescription_file', prescriptionFile);
      formData.append('drug_name', drugName);
      formData.append('quantity', quantity);
      formData.append('source', source);
      formData.append('intake_source', 'online');
      formData.append('special_instructions', specialInstructions);

      const res = await apiClient.post('/pharmacy/prescriptions', formData);
      // res.status is the HTTP status code (200/201), not the JSON body status string
      if (res.status === 200 || res.status === 201) {
        showToast('Prescription submitted successfully', 'success');
        playSound('success');
        setSubmitted(res.data?.data || res.data || {});
        setDrugName('');
        setQuantity('');
        setSource('From Hospital');
        setSpecialInstructions('');
        setPrescriptionFile(null);
        setFileName('');
      } else {
        showToast(res.data?.message || 'Unexpected response from server', 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Failed to submit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setDrugName('');
    setQuantity('');
    setSource('From Hospital');
    setSpecialInstructions('');
    setPrescriptionFile(null);
    setFileName('');
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer />

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={22} color="#059669" /> Customer Prescription
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>Submit your prescription for processing (B7/B9)</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setTab('submit'); setSubmitted(null); }} style={tabBtn(tab === 'submit')}>
          <Upload size={15} /> Submit Prescription
        </button>
        <button onClick={() => { setTab('list'); fetchPrescriptions(); }} style={tabBtn(tab === 'list')}>
          <List size={15} /> My Prescriptions ({prescriptions.length})
        </button>
      </div>

      {tab === 'submit' && (
        <>
          {submitted ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#224f94', color: 'white', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, background: 'white', borderRadius: '50% 50% 50% 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#224f94', fontWeight: 800, fontSize: 8 }}>SUTANA</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Prescription Submitted</h2>
                  </div>
                </div>
              </div>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#059669' }}>Form Submitted Successfully</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: '#475569' }}>
                  Please come in to PAY and PICKUP your drugs
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '16px 24px', border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Reference #</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
                      {submitted.reference || submitted.reference_number || 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '16px 24px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Estimated Wait Time</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#92400E' }}>15–20 minutes</div>
                  </div>
                </div>
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button onClick={resetForm} style={{ padding: '12px 24px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    Submit Another
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                  color: 'white', padding: '32px', position: 'relative', overflow: 'hidden' 
                }}>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Playfair Display', serif", letterSpacing: '0.5px' }}>Prescription Request</h2>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>Securely submit your prescription for fulfillment</p>
                  <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }}></div>
                </div>

                <div style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}><User size={13} /> Full Name</label>
                      <input type="text" value={customerName} readOnly style={{ ...inputStyle(), background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={labelStyle}><Phone size={13} /> Phone</label>
                      <input type="text" value={customerPhone} readOnly style={{ ...inputStyle(), background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>📧 Email</label>
                      <input type="email" value={customerEmail} readOnly style={{ ...inputStyle(), background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}><FileText size={13} /> Upload Prescription (Optional)</label>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                      padding: '40px 24px', background: fileName ? '#F0FDF4' : '#F8FAFC', border: `2px dashed ${fileName ? '#059669' : '#CBD5E1'}`,
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s ease'
                    }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                        <Upload size={24} color={fileName ? '#059669' : '#94A3B8'} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{fileName || 'Browse or drag prescription file'}</span>
                      <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={labelStyle}><Pill size={13} /> Drug Name *</label>
                      <input type="text" value={drugName} onChange={e => setDrugName(e.target.value)} placeholder="e.g. Amoxicillin" style={inputStyle()} />
                    </div>
                    <div>
                      <label style={labelStyle}><Package size={13} /> Quantity *</label>
                      <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" style={inputStyle()} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Source *</label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {SOURCES.map(s => (
                        <label key={s.value} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                          border: `1px solid ${source === s.value ? '#059669' : '#E2E8F0'}`,
                          borderRadius: 8, cursor: 'pointer', background: source === s.value ? '#ECFDF5' : 'white',
                          fontWeight: 600, fontSize: 13, color: source === s.value ? '#065F46' : '#475569',
                        }}>
                          <input type="radio" name="source" value={s.value} checked={source === s.value} onChange={() => setSource(s.value)} style={{ display: 'none' }} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}><MessageSquare size={13} /> Special Instructions</label>
                    <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Any specific requirements?" rows={3} style={{ ...inputStyle(), resize: 'vertical' }} />
                  </div>

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '16px', background: loading ? '#94A3B8' : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
                  }}>
                    {loading ? 'Submitting...' : 'SUBMIT REQUEST'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {tab === 'list' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <List size={16} color="#059669" /> My Prescriptions
            </h3>
            <button onClick={fetchPrescriptions} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {prescriptionsLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
          ) : prescriptions.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No prescriptions found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Reference #</th>
                  <th style={thStyle}>Drug</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>#{p.reference_number || p.id}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{p.drug_name}</div>
                      {p.special_instructions && <div style={{ fontSize: 11, color: '#64748B' }}>{p.special_instructions}</div>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{p.quantity}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11, color: '#475569' }}>{p.source || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: p.status === 'PENDING' ? '#FEF3C7' : p.status === 'PREPARED' ? '#DBEAFE' : p.status === 'PICKED_UP' ? '#D1FAE5' : '#F1F5F9',
                        color: p.status === 'PENDING' ? '#92400E' : p.status === 'PREPARED' ? '#1E40AF' : p.status === 'PICKED_UP' ? '#065F46' : '#475569',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>
                        {p.status || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: '#64748B' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = () => ({
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  backgroundColor: '#F8FAFC',
  color: '#1E293B'
});

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '12px 14px', color: '#1E293B' };
const tabBtn = (active) => ({
  background: active ? '#059669' : 'white',
  color: active ? 'white' : '#475569',
  border: active ? 'none' : '1px solid #E2E8F0',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: active ? 600 : 400,
});
