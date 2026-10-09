import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Package, DollarSign, Printer, TrendingUp,
  Home, Settings2, RefreshCw, Save, Filter,
  CheckCircle, AlertTriangle, Info, X, ChevronDown
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const G = {
  dark:      '#2563EB', forest:    '#16A34A', emerald:   '#16A34A',
  leaf:      '#16A34A', sage:      '#E5E7EB', olive:     '#D97706',
  mint:      '#16A34A', lime:      '#16A34A', brown:     '#D97706',
  sky:       '#0284C7', white:     '#FFFFFF', lightGray: '#F9FAFB',
  darkGray:  '#4B5563', orange:    '#F59E0B', red:       '#DC2626',
};

const DEPARTMENTS = ['Printing','Car Rental','AgriRent','Sales','Retail','IT','Maintenance'];

const DEPT_COLORS = {
  Printing: G.forest, 'Car Rental': G.sky, AgriRent: G.emerald,
  Sales: G.orange,   Retail: G.olive,    IT: G.emerald, Maintenance: G.brown,
};

// ─── API ─────────────────────────────────────────────────────────────────────
const api = axios.create();
api.interceptors.request.use(cfg => {
  // FIX #4: Token handled centrally by apiClient interceptor — removed manual token read
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ─── TOAST ───────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg   = t.type === 'error' ? G.red : t.type === 'warn' ? G.orange : G.forest;
      const Icon = t.type === 'error' ? AlertTriangle : t.type === 'warn' ? Info : CheckCircle;
      return (
        <div key={t.id} className={'gsv-toast' + (t.type === 'error' ? ' error' : t.type === 'warn' ? ' warn' : ' success')} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 280, maxWidth: 380,
          border: `2px solid ${G.dark}`,
        }}>
          <Icon size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, pointerEvents: 'all' }}>
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

// ─── DEPT BADGE ───────────────────────────────────────────────────────────────
const DeptBadge = ({ dept }) => {
  const c = DEPT_COLORS[dept] || G.olive;
  return (
    <span className="gsv-badge" style={{
      background: c, color: '#fff', padding: '3px 10px',
      fontSize: 11, fontWeight: 800, border: `2px solid ${G.dark}`,
      display: 'inline-block',
    }}>{dept}</span>
  );
};

// ─── FLAT BUTTON ─────────────────────────────────────────────────────────────
const FlatBtn = ({ children, onClick, color = G.emerald, icon: Icon, disabled, full, small }) => (
  <button
    className="gsv-btn"
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? G.sage : color,
      color: '#fff',
      border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 20px',
      fontWeight: 800,
      fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      width: full ? '100%' : undefined,
      justifyContent: full ? 'center' : undefined,
      transition: 'background 0.2s',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      textTransform: 'uppercase',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = G.dark; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = color; }}
  >
    {Icon && <Icon size={small ? 14 : 16} />}
    {children}
  </button>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, Icon, sub }) => (
  <div className="gsv-stat" style={{
    background: '#fff',
    border: `2px solid ${G.dark}`,
    padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'background 0.2s',
  }}
    onMouseEnter={e => e.currentTarget.style.background = '#F1F8E9'}
    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ background: color, padding: 10, border: `2px solid ${G.dark}`, display: 'flex' }}>
        <Icon size={20} color="#fff" />
      </div>
      {sub && <span style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{sub}</span>}
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: G.dark, lineHeight: 1.1, marginTop: 4 }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 12, color: G.darkGray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {label}
    </div>
    <div style={{ height: 3, background: color, marginTop: 2 }} />
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
      <div className="gsv-toolbar" style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        marginBottom: 18, padding: '14px 18px',
        background: G.lightGray, border: `2px solid ${G.dark}`,
        borderLeft: `6px solid ${G.forest}`,
      }}>
        <Filter size={15} color={G.olive} />
        <span style={{ fontSize: 12, fontWeight: 900, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>Department:</span>
        <div style={{ position: 'relative' }}>
          <select
            value={dept} onChange={e => setDept(e.target.value)}
            className="gsv-select"
            style={{
              padding: '8px 36px 8px 12px', border: `2px solid ${G.dark}`,
              background: '#fff', fontSize: 13, fontWeight: 700,
              appearance: 'none', cursor: 'pointer', outline: 'none',
              color: G.darkGray, fontFamily: 'inherit',
            }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={13} color={G.dark} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <FlatBtn small icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </FlatBtn>
        {grandTotal > 0 && (
          <div style={{ marginLeft: 'auto', fontWeight: 900, fontSize: 14, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={15} /> Grand Total: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {loading && materials.length === 0 ? (
        <div className="gsv-loading" style={{ textAlign: 'center', padding: 60, color: G.olive, fontWeight: 800, fontSize: 16 }}>
          <SegmentedSpinner size={24} />
          <span>Loading materials…</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="gsv-empty" style={{ textAlign: 'center', padding: 60, color: G.darkGray, fontWeight: 700, fontSize: 15, border: `2px dashed ${G.sage}`, background: G.lightGray }}>
          No materials found{dept ? ` for "${dept}"` : ''}.
        </div>
      ) : (
        <div className="gsv-table-scroll" style={{ overflowX: 'auto', border: `2px solid ${G.dark}` }}>
          <table className="gsv-table gsv-mat" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr className="gsv-thead" style={{ background: G.dark }}>
                {['ID', 'Item Name', 'Category', 'Department', 'Qty in Store', 'Unit', 'Unit Value (ETB)', 'Total Value (ETB)', 'Action'].map(h => (
                  <th key={h} className="gsv-th" style={{
                    padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase',
                    fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', color: '#fff',
                    border: `1px solid ${G.forest}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => {
                const isDirty = editing[m.id] !== undefined;
                return (
                  <tr key={m.id} className="gsv-row"
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.emerald, whiteSpace: 'nowrap', border: `1px solid ${G.sage}` }}>{m.material_id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark, border: `1px solid ${G.sage}` }}>{m.material_name}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{m.category}</td>
                    <td style={{ padding: '11px 16px', border: `1px solid ${G.sage}` }}><DeptBadge dept={m.department} /></td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: G.dark, border: `1px solid ${G.sage}` }}>{parseFloat(m.quantity_in_store).toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{m.unit}</td>
                    <td style={{ padding: '11px 16px', border: `1px solid ${G.sage}` }}>
                      <input
                        className="gsv-input"
                        type="number" min="0" step="0.01"
                        value={isDirty ? editing[m.id] : (m.unit_value || '')}
                        placeholder="0.00"
                        onChange={e => setEditing(ev => ({ ...ev, [m.id]: e.target.value }))}
                        style={{
                          width: 120, padding: '7px 10px',
                          border: `2px solid ${isDirty ? G.forest : G.sage}`,
                          background: isDirty ? '#f0fdf0' : '#fff',
                          fontSize: 13, fontWeight: 700, outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 900, color: G.forest, whiteSpace: 'nowrap', border: `1px solid ${G.sage}` }}>
                      ETB {parseFloat(m.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '11px 16px', border: `1px solid ${G.sage}` }}>
                      {isDirty && (
                        <FlatBtn small icon={Save} color={G.forest} disabled={saving[m.id]} onClick={() => saveValue(m.id)}>
                          {saving[m.id] ? 'Saving…' : 'Save'}
                        </FlatBtn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="gsv-tfoot" style={{ background: G.dark }}>
                <td colSpan={7} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                  Grand Total — {materials.length} Item{materials.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15, color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: `1px solid ${G.forest}` }} />
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
      <div className="gsv-toolbar" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, marginBottom: 18, padding: '14px 18px',
        background: G.lightGray, border: `2px solid ${G.dark}`, borderLeft: `6px solid ${G.brown}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Printer size={16} color={G.brown} />
          <span style={{ fontSize: 13, color: G.dark, fontWeight: 700 }}>
            Finance sets the internal book value for each registered machine.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {grandTotal > 0 && (
            <div style={{ fontWeight: 900, fontSize: 14, color: G.forest, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={15} /> Total: ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <FlatBtn small icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </FlatBtn>
        </div>
      </div>

      {loading && machines.length === 0 ? (
        <div className="gsv-loading" style={{ textAlign: 'center', padding: 60, color: G.olive, fontWeight: 800, fontSize: 16 }}>
          <SegmentedSpinner size={24} />
          <span>Loading machines…</span>
        </div>
      ) : machines.length === 0 ? (
        <div className="gsv-empty" style={{ textAlign: 'center', padding: 60, color: G.darkGray, fontWeight: 700, fontSize: 15, border: `2px dashed ${G.sage}`, background: G.lightGray }}>
          No printing machines registered yet.
        </div>
      ) : (
        <div className="gsv-table-scroll" style={{ overflowX: 'auto', border: `2px solid ${G.dark}` }}>
          <table className="gsv-table gsv-mach" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr className="gsv-thead" style={{ background: G.dark }}>
                {['Machine ID', 'Name', 'Model / Serial', 'Department', 'Status', 'Internal Book Value (ETB)', 'Action'].map(h => (
                  <th key={h} className="gsv-th" style={{
                    padding: '14px 16px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase',
                    fontSize: 11, letterSpacing: 1, whiteSpace: 'nowrap', color: '#fff',
                    border: `1px solid ${G.forest}`,
                  }}>{h}</th>
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
                  <tr key={m.id} className="gsv-row"
                    style={{ background: i % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}`, transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f4fbf4'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 900, color: G.emerald, whiteSpace: 'nowrap', border: `1px solid ${G.sage}` }}>{m.machine_id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: G.dark, border: `1px solid ${G.sage}` }}>{m.machine_name}</td>
                    <td style={{ padding: '12px 16px', color: G.darkGray, border: `1px solid ${G.sage}` }}>{m.model_serial || '—'}</td>
                    <td style={{ padding: '12px 16px', border: `1px solid ${G.sage}` }}><DeptBadge dept={m.department || 'Printing'} /></td>
                    <td style={{ padding: '12px 16px', border: `1px solid ${G.sage}` }}>
                      <span className="gsv-status" style={{ background: statusColor, color: '#fff', padding: '4px 10px', fontSize: 11, fontWeight: 800, border: `2px solid ${G.dark}`, display: 'inline-block' }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', border: `1px solid ${G.sage}` }}>
                      <input
                        className="gsv-input"
                        type="number" min="0" step="0.01"
                        value={isDirty ? editing[m.id] : (m.internal_value || '')}
                        placeholder="0.00"
                        onChange={e => setEditing(ev => ({ ...ev, [m.id]: e.target.value }))}
                        style={{
                          width: 140, padding: '7px 10px',
                          border: `2px solid ${isDirty ? G.forest : G.sage}`,
                          background: isDirty ? '#f0fdf0' : '#fff',
                          fontSize: 13, fontWeight: 700, outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', border: `1px solid ${G.sage}` }}>
                      {isDirty && (
                        <FlatBtn small icon={Save} color={G.forest} disabled={saving[m.id]} onClick={() => saveValue(m.id)}>
                          {saving[m.id] ? 'Saving…' : 'Save'}
                        </FlatBtn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="gsv-tfoot" style={{ background: G.dark }}>
                <td colSpan={5} style={{ padding: '14px 16px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                  Total Book Value — {machines.length} Machine{machines.length !== 1 ? 's' : ''}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15, color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
                  ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: `1px solid ${G.forest}` }} />
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
    { id: 'materials', label: 'Consumables',  icon: Package, color: G.forest },
    { id: 'machines',  label: 'Fixed Assets', icon: Printer, color: G.brown  },
  ];

  const CARDS = stats ? [
    { label: 'Total Consumable Lines',  value: stats.totalMaterials, Icon: Package,    color: G.lime,    sub: 'Items'     },
    { label: 'Total Consumable Value',  value: `ETB ${parseFloat(stats.totalMaterialValue || 0).toLocaleString()}`, Icon: DollarSign, color: G.emerald, sub: 'Value' },
    { label: 'Printing Machines',       value: stats.totalMachines,  Icon: Printer,    color: G.forest,  sub: 'Assets'    },
    { label: 'Machine Book Value',      value: `ETB ${parseFloat(stats.totalMachineValue  || 0).toLocaleString()}`, Icon: TrendingUp, color: G.brown,   sub: 'Book Val.' },
    { label: 'Machines In Store',       value: stats.machinesInStore,       Icon: Home,      color: G.olive,   sub: 'In Store'  },
    { label: 'Machines In Production',  value: stats.machinesInProduction,  Icon: Settings2, color: G.sky,     sub: 'Active'    },
  ] : [];

  return (
    <div className="gsv-page" style={{ background: '#FFFFFF', minHeight: '100vh', width: '100%', fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box' }}>

      <style>{`
        :root, .gsv-page {
          --color-primary: #2563EB;
          --color-primary-hover: #1D4ED8;
          --color-gold: #F59E0B;
          --color-gold-text: #1F2937;
        }
        .gsv-page, .gsv-page *, .gsv-page *::before, .gsv-page *::after { box-sizing: border-box; }
        .gsv-page { max-width: 1600px; margin: 0 auto; width: 100%; padding: 0; }
        .gsv-spin { animation: gsv-spin 1s linear infinite; }
        @keyframes gsv-spin { 100% { transform: rotate(360deg); } }

        /* ── Page shell — end-to-end within layout margins ── */
        .gsv-content { padding: 0 !important; }

        /* ── Header ── */
        .gsv-header-icon { border-radius: 10px; transition: transform 0.15s ease; }
        .gsv-header-icon svg { display: block; }
        .gsv-header-title { font-size: 28px !important; font-weight: 600 !important; letter-spacing: -0.5px; }
        .gsv-header-sub { font-size: 14px !important; }

        /* ── Buttons (FlatBtn → .gsv-btn) — gold hover on every button ── */
        .gsv-btn {
          min-height: 36px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease !important;
        }
        .gsv-btn:hover { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }
        .gsv-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── KPI stat cards ── */
        .gsv-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .gsv-stat {
          border-radius: 10px !important;
          border: 1px solid #E5E7EB !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
          transition: box-shadow 0.15s ease, transform 0.15s ease !important;
        }
        .gsv-stat:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; background: #F9FAFB !important; }
        .gsv-stat > div:first-child > div { border-radius: 8px !important; border: none !important; }
        .gsv-stat > div:nth-child(2) { font-variant-numeric: tabular-nums; }
        .gsv-stat > div:nth-child(3) { font-weight: 600 !important; }
        .gsv-stat > div:last-child { border-radius: 3px; }

        /* ── Toolbars / filters ── */
        .gsv-toolbar { border-radius: 10px !important; }
        .gsv-select {
          height: 36px !important;
          padding: 8px 36px 8px 12px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #111827 !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .gsv-select:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

        /* ── States ── */
        .gsv-loading, .gsv-empty { min-height: 200px; }
        .gsv-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .gsv-empty { border-radius: 10px !important; }

        /* ── Info banner ── */
        .gsv-banner { border-radius: 10px !important; }

        /* ── Tabs ── */
        .gsv-tab-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .gsv-tab-btn {
          flex: 1 1 220px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px 20px;
          border: 1px solid #E5E7EB !important;
          border-radius: 8px !important;
          font-weight: 600; font-size: 14px;
          color: #4B5563;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-family: inherit;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .gsv-tab-btn.active {
          background: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: #fff !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .gsv-tab-btn:not(.active):hover { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }

        /* ── Panel ── */
        .gsv-panel { border-radius: 10px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .gsv-panel-icon { border-radius: 8px !important; }
        .gsv-panel-icon svg { display: block; }
        .gsv-panel-title { font-size: 16px !important; font-weight: 600 !important; }
        .gsv-panel-sub { font-size: 12px !important; }

        /* ── Tables (rule 9) ── */
        .gsv-table-scroll { border-radius: 10px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .gsv-table { font-size: 14px !important; min-width: 900px; }
        .gsv-thead { background: #F9FAFB !important; }
        .gsv-thead .gsv-th, .gsv-thead th {
          background: #F9FAFB !important;
          color: #6B7280 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 12px 16px !important;
          border: none !important;
          border-bottom: 1px solid #E5E7EB !important;
          white-space: nowrap;
        }
        .gsv-table tbody tr { background: #fff !important; transition: background 0.15s ease; }
        .gsv-table tbody tr:hover { background: #F9FAFB !important; }
        .gsv-table tbody td {
          padding: 12px 16px !important;
          border: none !important;
          border-bottom: 1px solid #F3F4F6 !important;
          vertical-align: middle;
        }
        /* Amounts right-aligned tabular-nums */
        .gsv-mat td:nth-child(7), .gsv-mat td:nth-child(8),
        .gsv-mach td:nth-child(6) { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .gsv-mat .gsv-th:nth-child(7), .gsv-mat .gsv-th:nth-child(8),
        .gsv-mach .gsv-th:nth-child(6) { text-align: right; }
        .gsv-table tbody td:nth-child(2) { font-weight: 600; }

        /* Table footer */
        .gsv-table tfoot tr { background: #F9FAFB !important; }
        .gsv-table tfoot td {
          background: #F9FAFB !important;
          border: none !important;
          border-top: 1px solid #E5E7EB !important;
          color: #4B5563 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .gsv-table tfoot td:nth-child(2) { text-align: right; color: #111827 !important; font-size: 15px !important; font-weight: 700 !important; font-variant-numeric: tabular-nums; }

        /* ── Badges / status chips ── */
        .gsv-badge, .gsv-status {
          border-radius: 999px !important;
          border: none !important;
          padding: 2px 10px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        /* ── Inputs ── */
        .gsv-input {
          height: 36px !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .gsv-input:focus { border-color: var(--color-primary) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

        /* ── Toasts ── */
        .gsv-toast {
          background: #FFFFFF !important;
          color: #111827 !important;
          border: 1px solid #E5E7EB !important;
          border-left: 4px solid #16A34A !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          animation: gsv-slidein 0.25s ease;
        }
        .gsv-toast.success { border-left-color: #16A34A !important; }
        .gsv-toast.error   { border-left-color: #DC2626 !important; }
        .gsv-toast.warn    { border-left-color: #D97706 !important; }
        .gsv-toast button { color: #6B7280 !important; }
        .gsv-toast button:hover { color: #111827 !important; }

        /* ── Animations ── */
        @keyframes gsv-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsv-slidein { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .gsv-stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .gsv-header { flex-direction: column; align-items: flex-start; }
          .gsv-tab-row { flex-direction: column; }
          .gsv-tab-btn { flex: 1 1 100%; min-height: 44px; }
          .gsv-btn { min-height: 44px !important; }
          .gsv-input { min-height: 44px !important; }
          .gsv-select { min-height: 44px !important; }
        }
        @media (max-width: 600px) {
          .gsv-stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── CONTENT WRAPPER ── */}
      <div className="gsv-content" style={{ padding: '20px 24px', boxSizing: 'border-box' }}>

        {/* ── PAGE HEADER ── */}
        <div className="gsv-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="gsv-header-icon" style={{ background: G.forest, padding: '10px 12px', display: 'flex', border: `2px solid ${G.dark}` }}>
              <DollarSign size={22} color="#fff" />
            </div>
            <div>
              <div className="gsv-header-title" style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                General Store — Asset Valuation
              </div>
              <div className="gsv-header-sub" style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Finance sets internal unit values for all consumables &amp; fixed assets across departments.
              </div>
            </div>
          </div>
          <FlatBtn icon={statsLoading ? null : RefreshCw} color={G.emerald} onClick={loadStats} disabled={statsLoading}>
            {statsLoading ? <SegmentedSpinner size={14} /> : 'Refresh Stats'}
          </FlatBtn>
        </div>

        {/* ── STAT CARDS ── */}
        {statsLoading ? (
          <div className="gsv-loading" style={{ textAlign: 'center', padding: 40, color: G.olive, fontWeight: 800, fontSize: 15 }}>
            <SegmentedSpinner size={28} />
            Loading stats…
          </div>
        ) : (
          <div className="gsv-stat-grid">
            {CARDS.map((c, i) => (
              <StatCard key={i} label={c.label} value={c.value} color={c.color} Icon={c.Icon} sub={c.sub} />
            ))}
          </div>
        )}

        {/* ── INFO BANNER ── */}
        <div className="gsv-banner" style={{
          background: '#E0F2FE', border: `1px solid ${G.sky}`,
          borderLeft: `4px solid ${G.sky}`,
          padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 20, flexWrap: 'wrap',
        }}>
          <Info size={18} color={G.sky} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: G.dark, lineHeight: 1.6 }}>
            <strong>Departments served:</strong> Printing · Car Rental · AgriRent · Sales · Retail · IT · Maintenance.
            &nbsp;Use the department filter in the Consumables tab to scope work.
            Fleet vehicles &amp; tractors are valued in their own Asset modules.
          </div>
        </div>

        {/* ── TAB BUTTONS ── */}
        <div className="gsv-tab-row">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className={'gsv-tab-btn' + (active ? ' active' : '')}
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? G.dark : '#fff',
                  color: active ? '#fff' : G.darkGray,
                  borderColor: G.dark,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = G.lightGray; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#fff'; } }}
              >
                <t.icon size={17} color={active ? '#fff' : t.color} />
                {t.label}
                {active && (
                  <div style={{ width: 6, height: 6, background: G.leaf, borderRadius: '50%' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT PANEL ── */}
        <div className="gsv-panel" style={{ background: '#fff', border: `2px solid ${G.dark}`, padding: '24px' }}>

          {/* Panel sub-header — only a small label, NOT a bold full-width container header (rule 16) */}
          <div className="gsv-panel-head" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: `2px solid ${G.sage}` }}>
            <div className="gsv-panel-icon" style={{ background: tab === 'materials' ? G.forest : G.brown, padding: 8, border: `2px solid ${G.dark}` }}>
              {tab === 'materials' ? <Package size={18} color="#fff" /> : <Printer size={18} color="#fff" />}
            </div>
            <div>
              <div className="gsv-panel-title" style={{ fontSize: 15, fontWeight: 900, color: G.dark }}>
                {tab === 'materials' ? 'Consumables — Unit Cost Valuation' : 'Fixed Assets — Book Value'}
              </div>
              <div className="gsv-panel-sub" style={{ fontSize: 11, color: G.olive, fontWeight: 700, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
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
