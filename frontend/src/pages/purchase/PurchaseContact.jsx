import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, MessageCircle, PhoneCall } from 'lucide-react';
import api from '../../services/apiClient';
// Using standard fetch logic with try/catch

const PurchaseContact = () => {
  const [settings, setSettings] = useState({
    phone1: '+901407032',
    phone2: '+950169940',
    email: 'yonasmezgebu77@gmail.com'
  });
  
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState('');

  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/procurement-settings');
        if (res.data) {
          setSettings({
            phone1: res.data.contact_phone1 || '',
            phone2: res.data.contact_phone2 || '',
            email: res.data.contact_email || ''
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get('/procurement-settings/messages');
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchSettings();
    fetchMessages();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/procurement-settings', {
        contactPhone1: settings.phone1,
        contactPhone2: settings.phone2,
        contactEmail: settings.email
      });
      setToast('Contact settings saved successfully.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      setToast('Failed to save settings: ' + (err?.response?.data?.message || err.message));
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {toast && (
        <div style={{ padding: '12px 20px', background: toast.includes('Failed') ? '#fee2e2' : '#dcfce7', color: toast.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontWeight: 500 }}>
          {toast}
        </div>
      )}

      {/* TOP SECTION: Settings */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <PhoneCall size={24} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Procurement Contact Settings</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5, maxWidth: '800px' }}>
          Set the phone numbers and email address that will appear in the public "Contact Procurement Team" popup. Customers see this when they click the contact button on the tender page.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Phone 1 */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Phone 1 (Primary)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', background: '#FFFFFF', transition: 'border-color 0.2s' }}>
              <Phone size={16} color="#94a3b8" />
              <input 
                type="text" 
                name="phone1"
                value={settings.phone1}
                onChange={handleChange}
                style={{ flex: 1, border: 'none', padding: '12px', outline: 'none', fontSize: '14px', color: '#0f172a' }} 
              />
            </div>
          </div>

          {/* Phone 2 */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Phone 2 (Secondary)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', background: '#FFFFFF', transition: 'border-color 0.2s' }}>
              <Phone size={16} color="#94a3b8" />
              <input 
                type="text" 
                name="phone2"
                value={settings.phone2}
                onChange={handleChange}
                style={{ flex: 1, border: 'none', padding: '12px', outline: 'none', fontSize: '14px', color: '#0f172a' }} 
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Email Address (Procurement)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', background: '#FFFFFF', transition: 'border-color 0.2s' }}>
              <Mail size={16} color="#94a3b8" />
              <input 
                type="email" 
                name="email"
                value={settings.email}
                onChange={handleChange}
                style={{ flex: 1, border: 'none', padding: '12px', outline: 'none', fontSize: '14px', color: '#0f172a' }} 
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: '#6366f1', color: '#FFFFFF', padding: '12px 24px', 
            borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', 
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', transition: 'background 0.2s'
          }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Contact Settings'}
        </button>
      </div>

      {/* BOTTOM SECTION: Inbox */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <MessageCircle size={24} color="#a855f7" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Customer Inquiry Inbox</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5, maxWidth: '800px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px' }}>
          Messages sent by customers from the public tender contact form.
        </p>

        {loadingMessages ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No new messages.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, idx) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', borderBottom: idx === messages.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', marginRight: '6px', fontSize: '15px' }}>{msg.sender_name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px', margin: '0 4px' }}>•</span>
                    <a href={`mailto:${msg.sender_email}`} style={{ color: '#3b82f6', textDecoration: 'none', margin: '0 6px', fontSize: '14px' }}>{msg.sender_email}</a>
                    {msg.sender_phone && (
                      <>
                        <span style={{ color: '#94a3b8', fontSize: '12px', margin: '0 4px' }}>•</span>
                        <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '14px' }}>{msg.sender_phone}</span>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PurchaseContact;
