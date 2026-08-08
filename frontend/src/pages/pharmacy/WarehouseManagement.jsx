import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, X, Edit3, Trash2, MapPin, Phone, User, Hash, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';
import apiClient from '../../services/apiClient';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', manager_name: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/warehouses');
      setWarehouses(data.data || []);
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
      if (editing) {
        await apiClient.put(`/warehouses/${editing}`, form);
      } else {
        await apiClient.post('/warehouses', form);
      }
      setForm({ name: '', code: '', address: '', phone: '', manager_name: '' });
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (w) => {
    setEditing(w.id);
    setForm({ name: w.name, code: w.code || '', address: w.address || '', phone: w.phone || '', manager_name: w.manager_name || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await apiClient.delete(`/warehouses/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: '', code: '', address: '', phone: '', manager_name: '' });
    setShowForm(false);
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b', minHeight: '100vh', background: 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 30%,#ede9fe 70%,#f0f0ff 100%)', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
            <Warehouse size={26} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#0f172a' }}>Warehouse Management</h1>
            <p style={{ color: '#64748b', margin: '2px 0 0 0', fontSize: 14 }}>Manage storage locations and distribution centers</p>
          </div>
          <button onClick={() => { if (!showForm) handleCancel(); setShowForm(!showForm); }}
            style={{ padding: '12px 20px', background: showForm ? '#475569' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: showForm ? 'none' : '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add Warehouse'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit}
            style={{ background: 'white', borderRadius: 16, border: '2px solid #c7d2fe', padding: 24, marginBottom: 24, boxShadow: '0 8px 30px rgba(99,102,241,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              {editing ? <Edit3 size={17} color="#6366f1" /> : <Plus size={17} color="#6366f1" />}
              {editing ? 'Edit Warehouse' : 'New Warehouse'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Warehouse Name *</label>
                <div style={{ position: 'relative' }}>
                  <Warehouse size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <input style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                    placeholder="e.g. Central Warehouse" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Code</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <input style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="e.g. WH-001" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <input style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="+251-XXX-XXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Manager Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <input style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Manager name" value={form.manager_name} onChange={e => setForm({...form, manager_name: e.target.value})} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <textarea style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    placeholder="Full address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit"
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                <Save size={16} /> {editing ? 'Update Warehouse' : 'Create Warehouse'}
              </button>
              <button type="button" onClick={handleCancel}
                style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <SegmentedSpinner size={36} />
          </div>
        ) : warehouses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <Warehouse size={56} style={{ color: '#c7d2fe', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>No warehouses yet</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>Click "Add Warehouse" to create your first storage location</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {warehouses.map(w => (
              <div key={w.id}
                style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse size={20} color="#6366f1" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>{w.name}</h3>
                      {w.code && <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>#{w.code}</span>}
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: w.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: w.status === 'Active' ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {w.status === 'Active' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                    {w.status || 'Active'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#64748b' }}>
                  {w.manager_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} style={{ color: '#94a3b8' }} /> {w.manager_name}
                    </div>
                  )}
                  {w.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} style={{ color: '#94a3b8' }} /> {w.phone}
                    </div>
                  )}
                  {w.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <MapPin size={14} style={{ color: '#94a3b8', marginTop: 2 }} /> {w.address}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => handleEdit(w)}
                    style={{ flex: 1, padding: '8px 12px', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eef2ff'}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(w.id)}
                    style={{ flex: 1, padding: '8px 12px', background: '#fef2f2', color: '#e11d48', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{100%{transform:rotate(360deg);}} input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }`}</style>
    </div>
  );
};

export default WarehouseManagement;
