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
  FileText,
  Info
} from 'lucide-react';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const G = {
  forest:   '#228B22', dark:     '#1B5E20', emerald:  '#2E8B57',
  leaf:     '#4CAF50', sage:     '#A5D6A7', olive:    '#6B8E23',
  mint:     '#98FF98', lime:     '#8BC34A', brown:    '#8D6E63',
  sky:      '#87CEEB', white:    '#FFFFFF', lightGray:'#F5F5F5',
  darkGray: '#424242', orange:   '#FF9800', red:      '#F44336',
};

const BASE = '/api/v1/printing-assets';
const api = axios.create();
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onClose }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
  }}>
    {toasts.map(t => {
      const bg = t.type === 'error' ? G.red : t.type === 'warning' ? G.orange : G.forest;
      const Icon = t.type === 'error' ? AlertTriangle : CheckCircle;
      return (
        <div key={t.id} style={{
          pointerEvents: 'all', background: bg, color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          border: `2px solid ${G.dark}`, minWidth: 280, maxWidth: 380,
        }}>
          <Icon size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <button onClick={() => onClose(t.id)}
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
  let _id = 0;
  const show = useCallback((msg, type = 'success') => {
    const id = ++_id + Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, show, remove };
}

// ─── FLAT BUTTON ─────────────────────────────────────────────────────────────
const FlatBtn = ({ children, onClick, color = G.emerald, icon: Icon, disabled, small, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? G.sage : color,
      color: '#fff',
      border: `2px solid ${G.dark}`,
      padding: small ? '7px 14px' : '11px 22px',
      fontWeight: 800,
      fontSize: small ? 12 : 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      transition: 'background 0.2s',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = G.dark; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = color; }}
  >
    {Icon && <Icon size={small ? 13 : 16} />}
    {children}
  </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const FinancePrintingMachines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, show, remove } = useToast();

  // Value Edit Modal
  const [editMachine, setEditMachine] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${BASE}/store/machines`);
      setMachines(data.data || []);
    } catch {
      setMachines([]);
      show('Failed to load assets', 'error');
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

  const appraised = useMemo(() => machines.filter(m => parseFloat(m.internal_value) > 0).length, [machines]);
  const pending   = useMemo(() => machines.filter(m => !(parseFloat(m.internal_value) > 0)).length, [machines]);

  const handleUpdateValue = async (e) => {
    e.preventDefault();
    if (!newValue || isNaN(newValue) || parseFloat(newValue) < 0) {
      return show('Please enter a valid amount', 'error');
    }
    setSaving(true);
    try {
      await api.patch(`${BASE}/store/machines/${editMachine.id}/value`, {
        internal_value: parseFloat(newValue),
      });
      show('Asset value appraised successfully');
      setEditMachine(null);
      load();
    } catch (err) {
      show(err?.response?.data?.message || 'Failed to update value', 'error');
    }
    setSaving(false);
  };

  const statusColor = (status) => {
    if (status === 'Active/Functional')  return G.leaf;
    if (status === 'Under Maintenance')  return G.brown;
    if (status === 'Idle in Production') return G.orange;
    return G.olive;
  };

  return (
    <div style={{
      background: '#FFFFFF', minHeight: '100vh', width: '100%',
      fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box',
    }}>

      <style>{`
        @keyframes fpm-spin { 100% { transform: rotate(360deg); } }
        .fpm-spin { animation: fpm-spin 1s linear infinite; }
        * { box-sizing: border-box; }

        .fpm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .fpm-kpi-card {
          background: #fff;
          border: 2px solid #1B5E20;
          padding: 18px 20px;
          transition: background 0.2s;
        }
        .fpm-kpi-card:hover { background: #F1F8E9; }

        .fpm-table-row { transition: background 0.15s; }
        .fpm-table-row:hover { background: #E8F5E9 !important; }

        .fpm-action-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border: 2px solid #1B5E20;
          font-weight: 800; font-size: 12px; cursor: pointer;
          text-transform: uppercase; transition: background 0.2s;
          font-family: inherit; color: #fff;
          white-space: nowrap;
        }

        @media (max-width: 1100px) { .fpm-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px)  { .fpm-kpi-grid { grid-template-columns: 1fr; } }
      `}</style>

      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── CONTENT WRAPPER – no top gap ── */}
      <div style={{ padding: '20px 24px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <Printer size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Printing Asset Appraisals
              </div>
              <div style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Finance Dashboard · Machine Valuation &amp; Asset Ledger
              </div>
            </div>
          </div>
          <FlatBtn icon={RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh Ledger'}
          </FlatBtn>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="fpm-kpi-grid">
          {[
            { label: 'Total Machines', value: machines.length, Icon: Printer,    color: G.forest  },
            { label: 'Appraised',      value: appraised,        Icon: CheckCircle, color: G.leaf    },
            { label: 'Pending Value',  value: pending,          Icon: AlertTriangle, color: G.orange },
            { label: 'Total Book Value', value: `ETB ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, Icon: TrendingUp, color: G.emerald },
          ].map((kpi, i) => (
            <div key={i} className="fpm-kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ background: kpi.color, padding: 8, border: `2px solid ${G.dark}`, display: 'flex' }}>
                  <kpi.Icon size={18} color="#fff" />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: G.olive, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {kpi.label}
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: G.dark }}>
                {kpi.value}
              </div>
              <div style={{ height: 3, background: kpi.color, marginTop: 8 }} />
            </div>
          ))}
        </div>

        {/* ── INFO STRIP ── */}
        <div style={{
          background: '#E3F2FD', border: `2px solid ${G.sky}`, borderLeft: `6px solid ${G.sky}`,
          padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
        }}>
          <Info size={16} color={G.sky} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: G.dark, fontWeight: 600 }}>
            Machines registered by the Printing Supervisor appear here. Finance appraises their internal book value.
          </div>
        </div>

        {/* ── TABLE ── */}
        {loading && machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: G.forest, fontWeight: 800, fontSize: 18 }}>
            <SegmentedSpinner size={32} />
            Loading Ledger…
          </div>
        ) : machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 40px', background: G.lightGray, border: `2px dashed ${G.sage}` }}>
            <Printer size={56} color={G.sage} style={{ marginBottom: 16, display: 'block', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 20, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              No Assets Registered
            </div>
            <p style={{ color: G.olive, fontSize: 14, margin: 0 }}>
              Machines registered by the Printing Supervisor will appear here.
            </p>
          </div>
        ) : (
          <div style={{ border: `2px solid ${G.dark}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: G.dark }}>
                  {['#', 'Machine', 'Model / Serial', 'Registered By', 'Status', 'Condition Notes', 'Book Value (ETB)', 'Action'].map((h, hi) => (
                    <th key={h} style={{
                      padding: '15px 18px', fontWeight: 900, textTransform: 'uppercase',
                      letterSpacing: 1, fontSize: 11, color: '#fff',
                      border: `1px solid ${G.forest}`,
                      textAlign: hi >= 6 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {machines.map((m, idx) => {
                  const hasValue = parseFloat(m.internal_value) > 0;
                  return (
                    <tr
                      key={m.id}
                      className="fpm-table-row"
                      style={{ background: idx % 2 === 0 ? '#fff' : '#f4fbf4', borderBottom: `1px solid ${G.sage}` }}
                    >
                      {/* ID */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap', border: `1px solid ${G.sage}` }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: G.emerald, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Hash size={12} /> {m.machine_id}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', border: `1px solid ${G.sage}` }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: G.dark }}>{m.machine_name}</div>
                      </td>

                      {/* Model/Serial */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', color: G.darkGray, fontSize: 13, fontWeight: 600, border: `1px solid ${G.sage}` }}>
                        {m.model_serial || '—'}
                      </td>

                      {/* Registered By */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', color: G.darkGray, fontSize: 13, border: `1px solid ${G.sage}` }}>
                        {m.registered_by || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap', border: `1px solid ${G.sage}` }}>
                        <span style={{
                          background: statusColor(m.status), color: '#fff',
                          padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          border: `2px solid ${G.dark}`, display: 'inline-block',
                        }}>
                          {m.status}
                        </span>
                      </td>

                      {/* Condition Notes */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', color: G.darkGray, fontSize: 13, maxWidth: 200, border: `1px solid ${G.sage}` }}>
                        {m.condition_notes || '—'}
                      </td>

                      {/* Book Value */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', textAlign: 'right', border: `1px solid ${G.sage}` }}>
                        {hasValue ? (
                          <div style={{ fontSize: 15, fontWeight: 900, color: G.forest, whiteSpace: 'nowrap' }}>
                            {parseFloat(m.internal_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <span style={{
                            background: '#FFF3E0', color: G.brown, padding: '4px 10px',
                            fontSize: 11, fontWeight: 800, border: `2px solid ${G.orange}`, display: 'inline-block',
                          }}>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '13px 18px', verticalAlign: 'middle', textAlign: 'right', border: `1px solid ${G.sage}` }}>
                        <button
                          className="fpm-action-btn"
                          onClick={() => { setEditMachine(m); setNewValue(hasValue ? m.internal_value : ''); }}
                          style={{ background: hasValue ? G.olive : G.orange }}
                          onMouseEnter={e => e.currentTarget.style.background = G.dark}
                          onMouseLeave={e => e.currentTarget.style.background = hasValue ? G.olive : G.orange}
                        >
                          <DollarSign size={13} />
                          {hasValue ? 'Update' : 'Appraise'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: G.dark }}>
                  <td colSpan={6} style={{ padding: '15px 18px', fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, color: '#fff', border: `1px solid ${G.forest}` }}>
                    Total Asset Value — {machines.length} Machine{machines.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '15px 18px', fontWeight: 900, fontSize: 16, textAlign: 'right', color: G.mint, whiteSpace: 'nowrap', border: `1px solid ${G.forest}` }}>
                    ETB {machines.reduce((s, m) => s + (parseFloat(m.internal_value) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ border: `1px solid ${G.forest}` }} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── VALUATION MODAL ── */}
      {editMachine && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20,
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 440,
            maxHeight: '90vh', overflowY: 'auto',
            border: `3px solid ${G.dark}`,
          }}>
            {/* Modal Header */}
            <div style={{
              background: G.dark, color: '#fff',
              padding: '18px 22px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DollarSign size={20} color={G.mint} />
                <span style={{ fontSize: 18, fontWeight: 900 }}>Appraise Asset Value</span>
              </div>
              <button
                onClick={() => setEditMachine(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUpdateValue} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Asset Info */}
              <div style={{ background: G.lightGray, padding: 14, borderLeft: `4px solid ${G.emerald}` }}>
                <div style={{ fontSize: 11, color: G.olive, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Asset</div>
                <div style={{ fontSize: 17, color: G.dark, fontWeight: 900, marginTop: 4 }}>{editMachine.machine_name}</div>
                <div style={{ fontSize: 13, color: G.darkGray, marginTop: 2 }}>ID: {editMachine.machine_id}</div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: G.darkGray, textTransform: 'uppercase' }}>Status:</span>
                <span style={{ background: statusColor(editMachine.status), color: '#fff', padding: '4px 10px', fontSize: 11, fontWeight: 800, border: `2px solid ${G.dark}` }}>
                  {editMachine.status}
                </span>
              </div>

              {/* Value Input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.darkGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Internal Book Value (ETB)
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${G.dark}` }}>
                  <div style={{
                    padding: '12px 14px', background: G.dark, color: '#fff',
                    fontWeight: 900, fontSize: 14, borderRight: `2px solid ${G.forest}`,
                    display: 'flex', alignItems: 'center',
                  }}>ETB</div>
                  <input
                    type="number" step="0.01" min="0" autoFocus required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    style={{
                      flex: 1, padding: '12px 14px', border: 'none',
                      fontSize: 17, fontWeight: 800, outline: 'none',
                      fontFamily: 'inherit', color: G.dark, background: '#fff',
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Condition notes display */}
              {editMachine.condition_notes && (
                <div style={{ background: '#FFF8E1', padding: 12, border: `2px solid ${G.orange}`, fontSize: 13, color: G.darkGray }}>
                  <strong style={{ color: G.brown }}>Condition Note:</strong> {editMachine.condition_notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setEditMachine(null)}
                  style={{
                    background: '#fff', color: G.dark, border: `2px solid ${G.dark}`,
                    padding: '11px 20px', fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'inherit', textTransform: 'uppercase', fontSize: 13,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = G.lightGray}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Cancel
                </button>
                <FlatBtn type="submit" color={G.forest} icon={FileText} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Value'}
                </FlatBtn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePrintingMachines;
