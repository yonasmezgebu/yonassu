import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Send, Trash2, Clock, Globe, Building, Users, Loader2, MessageSquare } from 'lucide-react';
import apiClient from '../../services/apiClient';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', target_audience: 'All Branches', target_branch_id: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, bRes] = await Promise.all([
        apiClient.get('/announcements'),
        apiClient.get('/pharmacy/branches')
      ]);
      setAnnouncements(aRes.data.data || []);
      setBranches(bRes.data.data || bRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/announcements', {
        ...form,
        target_branch_id: form.target_audience === 'Specific Branch' ? form.target_branch_id : null
      });
      setForm({ title: '', message: '', target_audience: 'All Branches', target_branch_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiClient.delete(`/announcements/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const audienceIcon = (audience) => {
    if (audience === 'All Branches') return <Globe size={13} />;
    if (audience === 'Managers Only') return <Users size={13} />;
    return <Building size={13} />;
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#fef2f2 0%,#fff1f2 30%,#fce7f3 70%,#fdf2f8 100%)', padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(244,63,94,0.35)' }}>
            <Megaphone size={26} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a' }}>Announcements</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Broadcast messages to branches and staff</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '12px 20px', background: showForm ? '#475569' : 'linear-gradient(135deg,#f43f5e,#e11d48)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: showForm ? 'none' : '0 4px 14px rgba(244,63,94,0.35)', transition: 'all 0.2s' }}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit}
            style={{ background: 'white', borderRadius: 16, border: '2px solid #fecaca', padding: 24, marginBottom: 24, boxShadow: '0 8px 30px rgba(244,63,94,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={17} color="#f43f5e" /> New Announcement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                placeholder="Announcement Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              <textarea style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', minHeight: 100, resize: 'vertical', transition: 'border 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' }}
                rows={4} placeholder="Write your announcement message..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Target Audience</label>
                  <select style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' }}
                    value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})}>
                    <option value="All Branches">All Branches</option>
                    <option value="Specific Branch">Specific Branch</option>
                    <option value="Managers Only">Managers Only</option>
                  </select>
                </div>
                {form.target_audience === 'Specific Branch' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Branch</label>
                    <select style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' }}
                      value={form.target_branch_id} onChange={e => setForm({...form, target_branch_id: e.target.value})} required>
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit"
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content', boxShadow: '0 4px 12px rgba(244,63,94,0.25)' }}>
                <Send size={16} /> Publish Announcement
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#f43f5e' }} />
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <Megaphone size={56} style={{ color: '#fecaca', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>No announcements yet</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>Click "New Announcement" to broadcast a message</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map((a, idx) => (
              <div key={a.id}
                style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#e11d48' }}>
                        {audienceIcon(a.target_audience)} {a.target_audience}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 12 }}>
                        <Clock size={12} /> {new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '6px 0 0', color: '#0f172a' }}>{a.title}</h3>
                    {a.author && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>by {a.author}</p>}
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    style={{ padding: '8px 12px', background: '#fef2f2', color: '#e11d48', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
                <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', background: '#f8fafc', borderRadius: 10, padding: 14 }}>
                  {a.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}} input:focus, textarea:focus, select:focus { border-color: #f43f5e !important; box-shadow: 0 0 0 3px rgba(244,63,94,0.12) !important; }`}</style>
    </div>
  );
};

export default Announcements;
