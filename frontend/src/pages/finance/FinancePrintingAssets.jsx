import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Package, DollarSign, Printer, TrendingUp,
  Home, Settings2, RefreshCw, Save, Filter,
  CheckCircle, AlertTriangle, Info, X, ChevronDown
} from 'lucide-react';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const G = {
  forest:    '#228B22', dark:      '#1B5E20', emerald:   '#2E8B57',
  leaf:      '#4CAF50', sage:      '#A5D6A7', olive:     '#6B8E23',
  mint:      '#98FF98', lime:      '#8BC34A', brown:     '#8D6E63',
  sky:       '#87CEEB', white:     '#FFFFFF', lightGray: '#F5F5F5',
  darkGray:  '#424242', orange:    '#FF9800', red:       '#F44336',
};

const DEPARTMENTS = ['Printing','Car Rental','AgriRent','Sales','Retail','IT','Maintenance'];

const DEPT_COLORS = {
  Printing: G.forest, 'Car Rental': G.sky, AgriRent: G.lime,
  Sales: G.orange,   Retail: '#7C3AED',   IT: G.emerald, Maintenance: G.brown,
};

// ─── API ─────────────────────────────────────────────────────────────────────
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ─── TOAST ───────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.red : t.type === 'warn' ? G.orange : G.forest;
      const Icon = t.type === 'error' ? AlertTriangle : t.type === 'warn' ? Info : CheckCircle;
      return (
        <div key={t.id} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: `6px 6px 0 ${G.dark}`, minWidth: 280, maxWidth: 380,
          animation: 'toastIn .3s cubic-bezier(.175,.885,.32,1.275)',
          border: `2px solid ${G.dark}`,
        }}>
          <Icon size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
            <X size={16} />
          </button>
        </div>
      );
    })}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = useCallback((msg, type = 'success') => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, push, remove };
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
const Btn3D = ({ children, onClick, color = G.emerald, icon: Icon, disabled, full, small }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: color, color: '#fff', border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 20px',
      fontWeight: 800, fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 7,
      boxShadow: `4px 4px 0 ${G.dark}`, borderRadius: 0,
      width: full ? '100%' : undefined, justifyContent: full ? 'center' : undefined,
      transition: 'all .1s', userSelect: 'none',
      whiteSpace: 'nowrap',
    }}
    onMouseDown={e => { if (!disabled) { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}}
    onMouseUp={e => { if (!disabled) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`; }}}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${G.dark}`; }}
  >
    {Icon && <Icon size={small ? 14 : 16} />}
    {children}
  </button>
);

const DeptBadge = ({ dept }) => {
  const c = DEPT_COLORS[dept] || G.olive;
  return (
    <span style={{
      background: c, color: '#fff', padding: '3px 10px',
      fontSize: 11, fontWeight: 800, border: `2px solid ${G.dark}`,
      boxShadow: `2px 2px 0 ${G.dark}`, display: 'inline-block',
    }}>{dept}</span>
  );
};

// ─── STAT CARD (3-D, sharp) ───────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, sub }) => (
  <div style={{
    background: '#fff', border: `3px solid ${G.dark}`,
    boxShadow: `6px 6px 0 ${G.dark}`, padding: '22px 24px',
    flex: '1 1 220px', minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 8,
    animation: 'cardIn .4s ease-out',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
        <Icon size={22} color="#fff" />
      </div>
      {sub && <span style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 6 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8 }}>
      {label}
    </div>
    <div style={{ height: 4, background: color, marginTop: 4, boxShadow: `2px 2px 0 ${G.dark}` }} />
  </div>
);

// ─── MATERIALS TAB ────────────────────────────────────────────────────────────
const StoreMaterialsTab = ({ toast }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState({});
  const [saving, setSaving]       = useState({});
  const [dept, setDept]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dept) params.department = dept;
      const { data } = await api.get('/api/v1/printing-assets/store/materials', { params });
      setMaterials(data.data || []);
    } catch { setMaterials([]); toast('Failed to load materials', 'error'); }
    setLoading(false);
  }, [dept, toast]);

  useEffect(() => { load(); }, [load]);

  const saveValue = async (id) => {
    const val = editing[id];
    if (val === undefined || val === '') return;
    setSaving(s => ({ ...s, [id]: true }));
    try {
      await api.patch(`/api/v1/printing-assets/store/materials/${id}/value`, { unit_value: parseFloat(val) });
      setEditing(e => { const n = { ...e }; delete n[id]; return n; });
      toast('Unit value saved successfully');
      load();
    } catch (e) { toast(e.response?.data?.message || 'Error saving value', 'error'); }
    setSaving(s => { const n = { ...s }; delete n[id]; return n; });
  };

  const grandTotal = materials.reduce((s, m) => s + parseFloat(m.total_value || 0), 0);

  return (
    <div>
      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, padding: '16px 20px', background: G.lightGray, border: `2px solid ${G.sage}`, borderLeft: `6px solid ${G.forest}` }}>
        <Filter size={16} color={G.olive} />
        <span style={{ fontSize: 12, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>Department:</span>
        <div style={{ position: 'relative' }}>
          <select
            value={dept} onChange={e => setDept(e.target.value)}
            style={{ padding: '8px 36px 8px 12px', border: `2px solid ${G.dark}`, background: '#fff', fontSize: 13, fontWeight: 700, appearance: 'none', cursor: 'pointer', outline: 'none', color: G.darkGray }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} color={G.dark} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <Btn3D small icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Btn3D>
        {grandTotal > 0 && (
          <div style={{ marginLeft: 'auto', fontWeight: 900, fontSize: 15, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} /> Grand Total: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {loading && materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.olive, fontWeight: 800, fontSize: 18 }}>Loading materials…</div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.sage, fontWeight: 800, fontSize: 16, border: `3px dashed ${G.sage}` }}>
          No materials found{dept ? ` for "${dept}"` : ''}.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: G.dark, color: '#fff' }}>
                {['ID', 'Item Name', 'Category', 'Department', 'Qty in Store', 'Unit', 'Unit Value (ETB)', 'Total Value (ETB)', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', borderBottom: `4px solid ${G.forest}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => {
                const isDirty = editing[m.id] !== undefined;
                return (
                  <tr key={m.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `2px solid ${G.lightGray}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald, whiteSpace: 'nowrap' }}>{m.material_id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark }}>{m.material_name}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray }}>{m.category}</td>
                    <td style={{ padding: '11px 16px' }}><DeptBadge dept={m.department} /></td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark }}>{parseFloat(m.quantity_in_store).toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray }}>{m.unit}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <input
                        type="number" min="0" step="0.01"
                        value={isDirty ? editing[m.id] : (m.unit_value || '')}
                        placeholder="0.00"
                        onChange={e => setEditing(ev => ({ ...ev, [m.id]: e.target.value }))}
                        style={{
                          width: 120, padding: '7px 10px',
                          border: `2px solid ${isDirty ? G.forest : G.sage}`,
                          background: isDirty ? '#f0fdf0' : '#fff',
                          fontSize: 13, fontWeight: 700, outline: 'none',
                          boxShadow: isDirty ? `2px 2px 0 ${G.forest}` : 'none',
                        }}
                      />
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest, whiteSpace: 'nowrap' }}>
                      ETB {parseFloat(m.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {isDirty && (
                        <Btn3D small icon={Save} color={G.forest} disabled={saving[m.id]} onClick={() => saveValue(m.id)}>
                          {saving[m.id] ? 'Saving…' : 'Save'}
                        </Btn3D>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark, color: '#fff' }}>
                <td colSpan={7} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  Grand Total — {materials.length} Item{materials.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 16, color: '#98FF98', whiteSpace: 'nowrap' }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── MACHINES TAB ─────────────────────────────────────────────────────────────
const PrintingMachinesTab = ({ toast }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState({});
  const [saving, setSaving]     = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/printing-assets/store/machines');
      setMachines(data.data || []);
    } catch { setMachines([]); toast('Failed to load machines', 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const saveValue = async (id) => {
    const val = editing[id];
    if (val === undefined || val === '') return;
    setSaving(s => ({ ...s, [id]: true }));
    try {
      await api.patch(`/api/v1/printing-assets/store/machines/${id}/value`, { internal_value: parseFloat(val) });
      setEditing(e => { const n = { ...e }; delete n[id]; return n; });
      toast('Machine book value saved');
      load();
    } catch (e) { toast(e.response?.data?.message || 'Error saving value', 'error'); }
    setSaving(s => { const n = { ...s }; delete n[id]; return n; });
  };

  const grandTotal = machines.reduce((s, m) => s + parseFloat(m.internal_value || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, padding: '16px 20px', background: G.lightGray, border: `2px solid ${G.sage}`, borderLeft: `6px solid ${G.brown}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Printer size={18} color={G.brown} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            Finance sets the internal book value for each registered machine.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 15, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} /> Total: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <Btn3D small icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Btn3D>
        </div>
      </div>

      {loading && machines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.olive, fontWeight: 800, fontSize: 18 }}>Loading machines…</div>
      ) : machines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: G.sage, fontWeight: 800, fontSize: 16, border: `3px dashed ${G.sage}` }}>
          No printing machines registered yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: `3px solid ${G.dark}`, boxShadow: `6px 6px 0 ${G.dark}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr style={{ background: G.dark, color: '#fff' }}>
                {['Machine ID', 'Name', 'Model / Serial', 'Department', 'Status', 'Internal Book Value (ETB)', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', borderBottom: `4px solid ${G.forest}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {machines.map((m, i) => {
                const isDirty = editing[m.id] !== undefined;
                const statusColor = m.status === 'Active/Functional' ? G.leaf
                  : m.status === 'Under Maintenance' ? G.brown
                  : m.status === 'Idle in Production' ? G.orange : G.olive;
                return (
                  <tr key={m.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `2px solid ${G.lightGray}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 900, color: G.emerald, whiteSpace: 'nowrap' }}>{m.machine_id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: G.dark }}>{m.machine_name}</td>
                    <td style={{ padding: '12px 16px', color: G.darkGray }}>{m.model_serial || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><DeptBadge dept={m.department || 'Printing'} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: statusColor, color: '#fff', padding: '4px 10px', fontSize: 11, fontWeight: 800, border: `2px solid ${G.dark}`, boxShadow: `2px 2px 0 ${G.dark}`, display: 'inline-block' }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="number" min="0" step="0.01"
                        value={isDirty ? editing[m.id] : (m.internal_value || '')}
                        placeholder="0.00"
                        onChange={e => setEditing(ev => ({ ...ev, [m.id]: e.target.value }))}
                        style={{
                          width: 140, padding: '7px 10px',
                          border: `2px solid ${isDirty ? G.forest : G.sage}`,
                          background: isDirty ? '#f0fdf0' : '#fff',
                          fontSize: 13, fontWeight: 700, outline: 'none',
                          boxShadow: isDirty ? `2px 2px 0 ${G.forest}` : 'none',
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isDirty && (
                        <Btn3D small icon={Save} color={G.forest} disabled={saving[m.id]} onClick={() => saveValue(m.id)}>
                          {saving[m.id] ? 'Saving…' : 'Save'}
                        </Btn3D>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: G.dark, color: '#fff' }}>
                <td colSpan={5} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
                  Total Book Value — {machines.length} Machine{machines.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 16, color: '#98FF98', whiteSpace: 'nowrap' }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const FinancePrintingAssets = () => {
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState('materials');
  const [statsLoading, setStatsLoading] = useState(true);
  const { toasts, push, remove } = useToast();

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/api/v1/printing-assets/stats');
      setStats(data.data);
    } catch { push('Could not load stats', 'warn'); }
    setStatsLoading(false);
  }, [push]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const TABS = [
    { id: 'materials', label: 'Consumables',     icon: Package,    color: G.forest  },
    { id: 'machines',  label: 'Fixed Assets',    icon: Printer,    color: G.brown   },
  ];

  // Stat cards data
  const CARDS = stats ? [
    { label: 'Total Consumable Lines',  value: stats.totalMaterials, Icon: Package,    color: G.lime,    sub: 'Items' },
    { label: 'Total Consumable Value',  value: `ETB ${parseFloat(stats.totalMaterialValue || 0).toLocaleString()}`, Icon: DollarSign, color: G.emerald, sub: 'Value' },
    { label: 'Printing Machines',       value: stats.totalMachines,  Icon: Printer,    color: G.forest,  sub: 'Assets' },
    { label: 'Machine Book Value',      value: `ETB ${parseFloat(stats.totalMachineValue  || 0).toLocaleString()}`, Icon: TrendingUp, color: G.brown,   sub: 'Book Val.' },
    { label: 'Machines In Store',       value: stats.machinesInStore,        Icon: Home,       color: G.olive,   sub: 'In Store' },
    { label: 'Machines In Production',  value: stats.machinesInProduction,   Icon: Settings2,  color: G.sky,     sub: 'Active' },
  ] : [];

  return (
    <div style={{ background: G.lightGray, minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", padding: '0 0 60px 0' }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes toastIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes cardIn  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin    { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }

        /* Responsive */
        @media (max-width: 768px) {
          .stat-grid  { grid-template-columns: 1fr 1fr !important; }
          .tab-row    { flex-direction: column !important; }
          .tab-btn    { width: 100% !important; }
          .page-header h1 { font-size: 20px !important; }
          .page-header p  { font-size: 13px !important; }
        }
        @media (max-width: 480px) {
          .stat-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── FULL-WIDTH HEADER ── */}
      <div style={{
        background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 60%, ${G.emerald} 100%)`,
        padding: '28px 40px', color: '#fff',
        boxShadow: `0 8px 32px ${G.dark}66`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }} className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: G.mint, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              <DollarSign size={28} color={G.dark} />
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: -.5 }}>
              General Store — Asset Valuation
            </h1>
          </div>
          <p style={{ margin: '0 0 0 52px', opacity: .85, fontSize: 14, lineHeight: 1.5 }}>
            Finance sets internal unit values for all consumables &amp; fixed assets across departments.
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={statsLoading}
          style={{ background: 'rgba(255,255,255,.15)', border: `2px solid rgba(255,255,255,.4)`, color: '#fff', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13 }}
        >
          <RefreshCw size={16} className={statsLoading ? 'spin-anim' : ''} />
          Refresh Stats
        </button>
      </div>

      <div style={{ padding: '32px 40px 0' }}>

        {/* ── STAT CARDS — 2×3 responsive grid ── */}
        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: G.olive, fontWeight: 800, fontSize: 16 }}>
            Loading stats…
          </div>
        ) : (
          <div className="stat-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20, marginBottom: 32,
          }}>
            {CARDS.map((c, i) => (
              <StatCard key={i} label={c.label} value={c.value} color={c.color} Icon={c.Icon} sub={c.sub} />
            ))}
          </div>
        )}

        {/* ── INFO BANNER ── */}
        <div style={{
          background: '#fff', border: `3px solid ${G.dark}`, borderLeft: `8px solid ${G.sky}`,
          boxShadow: `4px 4px 0 ${G.dark}`, padding: '14px 20px',
          display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap',
        }}>
          <Info size={20} color={G.sky} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: G.dark, lineHeight: 1.6 }}>
            <strong>Departments served:</strong> Printing · Car Rental · AgriRent · Sales · Retail · IT · Maintenance.
            &nbsp;Use the department filter in the Consumables tab to scope work.
            Fleet vehicles &amp; tractors are valued in their own Asset modules.
          </div>
        </div>

        {/* ── STRETCHED TAB BUTTONS (2 per row, full-width each) ── */}
        <div className="tab-row" style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
          {TABS.map((t, idx) => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="tab-btn"
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px 24px', border: `3px solid ${G.dark}`,
                  borderRight: idx < TABS.length - 1 ? 'none' : `3px solid ${G.dark}`,
                  background: active ? G.dark : '#fff',
                  color: active ? '#fff' : G.darkGray,
                  fontWeight: 900, fontSize: 15, cursor: 'pointer',
                  boxShadow: active ? `0 6px 0 ${G.forest}` : 'none',
                  transform: active ? 'translateY(-3px)' : 'translateY(0)',
                  transition: 'all .2s',
                  position: 'relative',
                  zIndex: active ? 2 : 1,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = G.lightGray; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
              >
                <t.icon size={18} color={active ? '#fff' : t.color} />
                {t.label}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    width: 40, height: 6, background: G.leaf,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT PANEL ── */}
        <div style={{
          background: '#fff', border: `3px solid ${G.dark}`,
          boxShadow: `6px 6px 0 ${G.dark}`, padding: '28px 28px',
          animation: 'fadeIn .25s ease-out',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingBottom: 18, marginBottom: 24,
            borderBottom: `3px solid ${G.sage}`,
          }}>
            <div style={{ background: tab === 'materials' ? G.forest : G.brown, padding: 8, border: `2px solid ${G.dark}`, boxShadow: `3px 3px 0 ${G.dark}` }}>
              {tab === 'materials' ? <Package size={20} color="#fff" /> : <Printer size={20} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: G.dark }}>
                {tab === 'materials' ? 'Consumables — Unit Cost Valuation' : 'Printing Machines — Fixed Asset Book Value'}
              </div>
              <div style={{ fontSize: 12, color: G.olive, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: .8 }}>
                {tab === 'materials' ? 'All Departments' : 'Finance — Internal Appraisal'}
              </div>
            </div>
          </div>

          {tab === 'materials'
            ? <StoreMaterialsTab toast={push} />
            : <PrintingMachinesTab toast={push} />
          }
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
};

export default FinancePrintingAssets;
