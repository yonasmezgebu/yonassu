import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  AlertTriangle, 
  X,
  Printer,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Hash,
  FileText
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

const FinancePrintingMachines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Value Edit Modal
  const [editMachine, setEditMachine] = useState(null);
  const [newValue, setNewValue] = useState('');

  const showMsg = (type, message) => setToast({ type, message });

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const { data } = await api.get(`${BASE}/store/machines`); 
      setMachines(data.data || []); 
    } catch { 
      setMachines([]); 
      showMsg('error', 'Failed to load assets');
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const totalValue = useMemo(() => {
    return machines.reduce((sum, m) => sum + (parseFloat(m.internal_value) || 0), 0);
  }, [machines]);

  const handleUpdateValue = async (e) => {
    e.preventDefault();
    if (!newValue || isNaN(newValue) || parseFloat(newValue) < 0) {
      return showMsg('error', 'Please enter a valid amount');
    }
    try {
      await api.patch(`${BASE}/store/machines/${editMachine.id}/value`, {
        internal_value: parseFloat(newValue)
      });
      showMsg('success', 'Asset value appraised successfully');
      setEditMachine(null);
      load();
    } catch (err) {
      showMsg('error', err?.response?.data?.message || 'Failed to update value');
    }
  };

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', fontFamily: "'Inter', sans-serif", width: '100%', padding: '0 0 40px 0' }}>
      
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
            <Printer size={32} color={G.mint} /> Printing Asset Appraisals
          </h1>
          <p style={{ margin: '6px 0 0 44px', opacity: 0.9, fontSize: 15 }}>
            Finance Dashboard • Machine Valuation & Asset Ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 8, border: `2px solid ${G.emerald}` }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 800, color: G.mint, letterSpacing: 1 }}>Total Asset Value</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} /> ETB {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ background: G.white+'33', border: 'none', color: '#fff', borderRadius: 8, padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} title="Refresh">
            <RefreshCw size={20} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* REGISTRY CONTENT */}
      <div style={{ padding: '40px' }}>
        {loading && machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: G.forest, fontWeight: 800, fontSize: 20 }}>Loading Ledger...</div>
        ) : machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', borderRadius: 16, border: `2px dashed ${G.sage}` }}>
            <Printer size={64} color={G.sage} style={{ marginBottom: 20 }} />
            <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              No Assets Registered
            </div>
            <p style={{ color: G.olive, fontSize: 15 }}>Machines registered by the Printing Supervisor will appear here.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `4px solid ${G.dark}`, boxShadow: `8px 8px 0 ${G.dark}`, width: '100%', overflowX: 'auto', animation: 'fadeIn 0.4s ease-out' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1050 }}>
              <thead>
                <tr style={{ background: G.dark, color: '#fff' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}`, whiteSpace: 'nowrap' }}>#</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}` }}>Machine</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}` }}>Model / Serial</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}` }}>Registered By</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}` }}>Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}` }}>Condition Notes</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}`, textAlign: 'right' }}>Book Value (ETB)</th>
                  <th style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, borderBottom: `4px solid ${G.forest}`, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m, idx) => {
                  const hasValue = parseFloat(m.internal_value) > 0;
                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: `2px solid ${G.lightGray}`, background: idx % 2 === 0 ? '#fff' : '#f9fdf9', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = G.mint + '33'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f9fdf9'}
                    >
                      {/* ID */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: G.emerald, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Hash size={12} /> {m.machine_id}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: G.darkGray }}>{m.machine_name}</div>
                      </td>

                      {/* Model/Serial */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: G.dark, fontSize: 13, fontWeight: 600 }}>
                        {m.model_serial || '—'}
                      </td>

                      {/* Registered By */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: G.darkGray, fontSize: 13 }}>
                        {m.registered_by || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: m.status === 'Active/Functional' ? G.leaf
                            : m.status === 'Under Maintenance' ? G.brown
                            : m.status === 'Idle in Production' ? G.orange
                            : G.olive,
                          color: '#fff', padding: '4px 10px', borderRadius: 4,
                          fontSize: 11, fontWeight: 800, boxShadow: '2px 2px 0 rgba(0,0,0,0.15)', display: 'inline-block'
                        }}>
                          {m.status}
                        </span>
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: G.darkGray, fontSize: 13, maxWidth: 200 }}>
                        {m.condition_notes || '—'}
                      </td>

                      {/* Book Value */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {hasValue ? (
                          <div style={{ fontSize: 16, fontWeight: 900, color: G.forest, whiteSpace: 'nowrap' }}>
                            {parseFloat(m.internal_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <span style={{ background: '#FFF3CD', color: G.brown, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, border: `1px solid ${G.orange}`, display: 'inline-block' }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button
                          onClick={() => { setEditMachine(m); setNewValue(hasValue ? m.internal_value : ''); }}
                          style={{
                            background: hasValue ? G.olive : G.orange,
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                            borderRadius: 4,
                            boxShadow: `3px 3px 0 ${G.dark}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.1s'
                          }}
                          onMouseDown={e => (e.currentTarget.style.transform = 'translate(3px,3px)', e.currentTarget.style.boxShadow = 'none')}
                          onMouseUp={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = `3px 3px 0 ${G.dark}`)}
                          onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = `3px 3px 0 ${G.dark}`)}
                        >
                          <DollarSign size={13} />
                          {hasValue ? 'Update Value' : 'Appraise'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* FOOTER TOTAL ROW */}
              <tfoot>
                <tr style={{ background: G.dark, color: '#fff' }}>
                  <td colSpan={6} style={{ padding: '16px 20px', fontWeight: 900, textTransform: 'uppercase', fontSize: 13, letterSpacing: 1 }}>
                    Total Asset Value — {machines.length} Machine{machines.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 900, fontSize: 18, textAlign: 'right', color: G.mint, whiteSpace: 'nowrap' }}>
                    ETB {machines.reduce((s, m) => s + (parseFloat(m.internal_value) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* VALUATION MODAL */}
      {editMachine && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto', border: `4px solid ${G.dark}`, boxShadow: `10px 10px 0 ${G.dark}`, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ background: G.dark, color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Appraise Asset Value</h2>
              <button onClick={() => setEditMachine(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdateValue} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: G.lightGray, padding: 16, borderLeft: `4px solid ${G.emerald}` }}>
                <div style={{ fontSize: 12, color: G.olive, fontWeight: 800 }}>ASSET</div>
                <div style={{ fontSize: 18, color: G.dark, fontWeight: 900 }}>{editMachine.machine_name}</div>
                <div style={{ fontSize: 13, color: G.darkGray, marginTop: 4 }}>ID: {editMachine.machine_id}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: G.darkGray, marginBottom: 8 }}>INTERNAL VALUE (ETB)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${G.sage}`, background: '#fff' }}>
                  <div style={{ padding: '12px 16px', background: G.lightGray, color: G.dark, fontWeight: 800, borderRight: `2px solid ${G.sage}` }}>ETB</div>
                  <input 
                    type="number" step="0.01" min="0" autoFocus required
                    value={newValue} onChange={e => setNewValue(e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', border: 'none', fontSize: 18, fontWeight: 800, outline: 'none', fontFamily: 'inherit' }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setEditMachine(null)} style={{ background: '#fff', color: G.dark, border: `2px solid ${G.dark}`, padding: '12px 24px', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
                <Btn3D color={G.forest}>SAVE VALUE</Btn3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default FinancePrintingMachines;
