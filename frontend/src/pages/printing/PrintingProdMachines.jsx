import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info,
  X,
  Plus,
  Monitor,
  Hash,
  FileText,
  Settings,
  Archive,
  RefreshCw
} from 'lucide-react';

// Green Nature University Palette
const G = { 
  forest: '#228B22',
  dark: '#1B5E20',
  emerald: '#2E8B57',
  leaf: '#4CAF50',
  sage: '#A5D6A7',
  olive: '#6B8E23',
  mint: '#98FF98',
  lime: '#8BC34A',
  brown: '#8D6E63',
  sky: '#87CEEB',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#424242',
  orange: '#FF9800',
  red: '#F44336' 
};

const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Toast System
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'error' ? G.red : type === 'warning' ? G.orange : G.leaf;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: bg, color: '#fff',
      padding: '16px 24px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      {type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
      <span style={{ fontWeight: 600, fontSize: 14 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, marginLeft: 8 }}><X size={16} /></button>
    </div>
  );
};

// 3D Button Component
const Btn3D = ({ children, onClick, color = G.emerald, icon: Icon, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    style={{
      background: `linear-gradient(145deg, ${color}, ${color}dd)`,
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '12px 20px',
      fontWeight: 800,
      fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: `4px 4px 0 ${G.dark}`,
      transition: 'all 0.1s',
      opacity: disabled ? 0.6 : 1,
      transform: 'translate(0, 0)'
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'translate(4px, 4px)', e.currentTarget.style.boxShadow = '0 0 0 transparent')}
    onMouseUp={e => !disabled && (e.currentTarget.style.transform = 'translate(0, 0)', e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`)}
    onMouseLeave={e => !disabled && (e.currentTarget.style.transform = 'translate(0, 0)', e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`)}
  >
    {Icon && <Icon size={18} />}
    {children}
  </button>
);

const STATUS_COLORS = {
  'In Store': G.olive,
  'Moved to Production': G.emerald,
  'Active/Functional': G.leaf,
  'Idle in Production': G.orange,
  'Returned to Store': G.sage,
  'Under Maintenance': G.brown
};

const PrintingProdMachines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Registration Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    machine_name: '',
    model_serial: '',
    condition_notes: ''
  });

  const showMsg = (type, message) => setToast({ type, message });

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      // Using store/machines as it acts as the global registry
      const { data } = await api.get(`${BASE}/store/machines`); 
      setMachines(data.data || []); 
    } catch { 
      setMachines([]); 
      showMsg('error', 'Failed to load machines');
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.machine_name.trim()) return showMsg('error', 'Machine Name is required');
    try {
      await api.post(`${BASE}/store/machines`, formData);
      showMsg('success', 'Machine Registered Successfully');
      setShowModal(false);
      setFormData({ machine_name: '', model_serial: '', condition_notes: '' });
      load();
    } catch (err) {
      showMsg('error', err?.response?.data?.message || 'Registration failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`${BASE}/store/machines/${id}/status`, { status });
      showMsg('success', `Status updated to ${status}`);
      load();
    } catch (err) {
      showMsg('error', 'Failed to update status');
    }
  };

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', fontFamily: "'Inter', sans-serif", width: '100%', padding: '0 0 40px 0' }}>
      
      {/* GLOBAL STYLES FOR ANIMATIONS */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>

      {/* FULL WIDTH HEADER STRIP */}
      <div style={{ background: `linear-gradient(90deg, ${G.dark}, ${G.forest})`, padding: '24px 40px', color: '#fff', boxShadow: `0 8px 30px ${G.dark}66`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Monitor size={32} color={G.mint} /> Printing Machine Asset Registry
          </h1>
          <p style={{ margin: '6px 0 0 44px', opacity: 0.9, fontSize: 15 }}>
            Register new production machines. Value appraisal is managed exclusively by Finance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Btn3D color={G.emerald} icon={Plus} onClick={() => setShowModal(true)}>Register New Machine</Btn3D>
          <button onClick={load} disabled={loading} style={{ background: G.white+'33', border: 'none', color: '#fff', borderRadius: 8, padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} title="Refresh">
            <RefreshCw size={20} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* REGISTRY CONTENT */}
      <div style={{ padding: '40px' }}>
        {loading && machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: G.forest, fontWeight: 800, fontSize: 20 }}>Loading Assets...</div>
        ) : machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', borderRadius: 16, border: `2px dashed ${G.sage}` }}>
            <Monitor size={64} color={G.sage} style={{ marginBottom: 20 }} />
            <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              No Machines Registered
            </div>
            <p style={{ color: G.olive, fontSize: 15 }}>Click "Register New Machine" to add your first asset.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `4px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', overflowX: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: G.dark, color: '#fff' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}` }}>Machine ID & Name</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}` }}>Model / Serial</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}` }}>Condition Notes</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}` }}>Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}` }}>Finance Val.</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 13, borderBottom: `4px solid ${G.forest}`, textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: `2px solid ${G.lightGray}`, background: idx % 2 === 0 ? '#fff' : '#fcfcfc', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = G.mint+'22'} onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fcfcfc'}>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: G.emerald, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Hash size={12} /> {m.machine_id}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: G.darkGray, marginTop: 4 }}>{m.machine_name}</div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', color: G.dark, fontSize: 14, fontWeight: 600 }}>
                      {m.model_serial || '—'}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', color: G.darkGray, fontSize: 13, maxWidth: 250 }}>
                      {m.condition_notes || '—'}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      <span style={{ 
                        background: STATUS_COLORS[m.status] || G.sage, color: '#fff', padding: '4px 10px', borderRadius: 4, 
                        fontSize: 11, fontWeight: 800, boxShadow: '2px 2px 0 rgba(0,0,0,0.15)', display: 'inline-block' 
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                      {parseFloat(m.internal_value) > 0 ? (
                        <div style={{ fontWeight: 900, color: G.forest, fontSize: 15 }}>
                          ETB {parseFloat(m.internal_value).toLocaleString()}
                        </div>
                      ) : (
                        <div style={{ background: G.sage, color: G.dark, padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, display: 'inline-block' }}>
                          Pending Appraisal
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {m.status !== 'Active/Functional' && <button onClick={() => updateStatus(m.id, 'Active/Functional')} style={{ background: '#fff', border: `2px solid ${G.leaf}`, color: G.leaf, padding: '4px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', boxShadow: `2px 2px 0 ${G.leaf}` }}>Set Active</button>}
                        {m.status !== 'Idle in Production' && <button onClick={() => updateStatus(m.id, 'Idle in Production')} style={{ background: '#fff', border: `2px solid ${G.orange}`, color: G.orange, padding: '4px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', boxShadow: `2px 2px 0 ${G.orange}` }}>Set Idle</button>}
                        {m.status !== 'Under Maintenance' && <button onClick={() => updateStatus(m.id, 'Under Maintenance')} style={{ background: '#fff', border: `2px solid ${G.brown}`, color: G.brown, padding: '4px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', boxShadow: `2px 2px 0 ${G.brown}` }}>Maint.</button>}
                        {m.status !== 'Returned to Store' && <button onClick={() => updateStatus(m.id, 'Returned to Store')} style={{ background: '#fff', border: `2px solid ${G.dark}`, color: G.dark, padding: '4px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', boxShadow: `2px 2px 0 ${G.dark}` }}>Return</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: `4px solid ${G.dark}`, boxShadow: `10px 10px 0 ${G.dark}`, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ background: G.dark, color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Register Production Machine</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleRegister} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ background: G.mint+'44', borderLeft: `4px solid ${G.emerald}`, padding: 16, fontSize: 13, color: G.dark, fontWeight: 600, display: 'flex', gap: 12 }}>
                <Info size={24} style={{ flexShrink: 0 }} />
                <span>Asset valuation and price entry are restricted. Finance will appraise and set the value once registered.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: G.darkGray, marginBottom: 8 }}>MACHINE NAME *</label>
                <input 
                  autoFocus required
                  value={formData.machine_name} onChange={e => setFormData({...formData, machine_name: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 0, border: `2px solid ${G.sage}`, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  placeholder="e.g. Heidelberg Speedmaster 52"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: G.darkGray, marginBottom: 8 }}>MODEL & SERIAL NUMBER</label>
                <input 
                  value={formData.model_serial} onChange={e => setFormData({...formData, model_serial: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 0, border: `2px solid ${G.sage}`, fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  placeholder="e.g. SM52-2 / SN-9827364"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: G.darkGray, marginBottom: 8 }}>CONDITION / NOTES</label>
                <textarea 
                  value={formData.condition_notes} onChange={e => setFormData({...formData, condition_notes: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 0, border: `2px solid ${G.sage}`, fontSize: 15, outline: 'none', fontFamily: 'inherit', minHeight: 100, resize: 'vertical' }}
                  placeholder="Enter current condition or any remarks..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#fff', color: G.dark, border: `2px solid ${G.dark}`, padding: '12px 24px', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
                <Btn3D color={G.forest}>SUBMIT TO REGISTRY</Btn3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PrintingProdMachines;
