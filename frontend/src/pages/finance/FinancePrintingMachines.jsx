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
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const G = {
  dark:      '#2563EB', forest:    '#16A34A', emerald:   '#16A34A',
  leaf:      '#16A34A', sage:      '#E5E7EB', olive:     '#D97706',
  mint:      '#16A34A', lime:      '#16A34A', brown:     '#D97706',
  sky:       '#0284C7', white:     '#FFFFFF', lightGray: '#F9FAFB',
  darkGray:  '#4B5563', orange:    '#F59E0B', red:       '#DC2626',
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
        <div key={t.id} className={'fpm-toast' + (t.type === 'error' ? ' error' : t.type === 'warning' ? ' warn' : ' success')} style={{
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
    className="fpm-btn"
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
    <div className="fpm-page" style={{
      background: '#FFFFFF', minHeight: '100vh', width: '100%',
      fontFamily: "'Inter','Segoe UI',sans-serif", boxSizing: 'border-box',
    }}>

      <style>{`
        :root, .fpm-page {
          --color-primary: #2563EB;
          --color-primary-hover: #1D4ED8;
          --color-gold: #F59E0B;
          --color-gold-text: #1F2937;
        }
        .fpm-page, .fpm-page *, .fpm-page *::before, .fpm-page *::after { box-sizing: border-box; }
        .fpm-page { max-width: 1600px; margin: 0 auto; width: 100%; padding: 0; }
        .fpm-spin { animation: fpm-spin 1s linear infinite; }
        @keyframes fpm-spin { 100% { transform: rotate(360deg); } }

        /* ── Page shell — end-to-end within layout margins ── */
        .fpm-content { padding: 0 !important; }

        /* ── Header ── */
        .fpm-header-icon { border-radius: 10px; transition: transform 0.15s ease; }
        .fpm-header-icon svg { display: block; }
        .fpm-header-title { font-size: 28px !important; font-weight: 600 !important; letter-spacing: -0.5px; }
        .fpm-header-sub { font-size: 14px !important; }

        /* ── Buttons (FlatBtn → .fpm-btn) — gold hover on every button ── */
        .fpm-btn, .fpm-btn-ghost, .fpm-action-btn {
          min-height: 36px !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease !important;
        }
        .fpm-btn:hover, .fpm-btn-ghost:hover, .fpm-action-btn:hover { background: var(--color-gold) !important; border-color: var(--color-gold) !important; color: var(--color-gold-text) !important; }
        .fpm-btn:disabled, .fpm-btn-ghost:disabled, .fpm-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── KPI stat cards ── */
        .fpm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .fpm-kpi-card {
          border-radius: 10px !important;
          border: 1px solid #E5E7EB !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
          transition: box-shadow 0.15s ease, transform 0.15s ease, background 0.15s ease !important;
        }
        .fpm-kpi-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; background: #F9FAFB !important; }
        .fpm-kpi-card > div:first-child > div { border-radius: 8px !important; border: none !important; }
        .fpm-kpi-card > div:first-child > span { font-size: 12px !important; font-weight: 600 !important; }
        .fpm-kpi-card > div:nth-child(2) { font-size: 28px !important; font-weight: 700 !important; font-variant-numeric: tabular-nums; }
        .fpm-kpi-card > div:last-child { border-radius: 3px; }

        /* ── States ── */
        .fpm-loading, .fpm-empty { min-height: 220px; }
        .fpm-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .fpm-empty { border-radius: 10px !important; }

        /* ── Info banner ── */
        .fpm-banner { border-radius: 10px !important; }

        /* ── Tables (rule 9) ── */
        .fpm-table-scroll { border-radius: 10px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .fpm-table { font-size: 14px !important; min-width: 1000px; }
        .fpm-thead { background: #F9FAFB !important; }
        .fpm-thead .fpm-th, .fpm-thead th {
          background: #F9FAFB !important;
          color: #6B7280 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 14px 16px !important;
          border: none !important;
          border-bottom: 1px solid #E5E7EB !important;
          white-space: nowrap;
        }
        .fpm-table tbody tr { background: #fff !important; transition: background 0.15s ease; }
        .fpm-table tbody tr:hover { background: #F9FAFB !important; }
        .fpm-table tbody td {
          padding: 13px 16px !important;
          border: none !important;
          border-bottom: 1px solid #F3F4F6 !important;
          vertical-align: middle;
        }
        .fpm-table td:nth-child(7), .fpm-table th:nth-child(7) { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .fpm-table tbody td:nth-child(2) { font-weight: 600; }

        /* Table footer */
        .fpm-table tfoot tr { background: #F9FAFB !important; }
        .fpm-table tfoot td {
          background: #F9FAFB !important;
          border: none !important;
          border-top: 1px solid #E5E7EB !important;
          color: #4B5563 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .fpm-table tfoot td:nth-child(7) { text-align: right; color: #111827 !important; font-size: 15px !important; font-weight: 700 !important; font-variant-numeric: tabular-nums; }

        /* ── Status chips / pending badge ── */
        .fpm-status, .fpm-pending {
          border-radius: 999px !important;
          border: none !important;
          padding: 2px 10px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        /* ── Modal ── */
        .fpm-overlay { background: rgba(0,0,0,0.4) !important; animation: fpm-fade 0.2s ease; }
        .fpm-modal { border-radius: 12px !important; border-width: 1px !important; box-shadow: 0 20px 50px rgba(0,0,0,0.25); animation: fpm-modal-in 0.2s ease; }
        .fpm-modal-head { border-radius: 11px 11px 0 0; }
        .fpm-modal-close { border-radius: 6px; transition: background 0.15s ease, color 0.15s ease; }
        .fpm-modal-close:hover { background: var(--color-gold) !important; color: var(--color-gold-text) !important; }
        .fpm-modal-asset { border-radius: 8px !important; }
        .fpm-modal-note { border-radius: 8px !important; }
        .fpm-label { font-size: 12px !important; }
        .fpm-input-group { border-radius: 8px !important; overflow: hidden; transition: box-shadow 0.15s ease; }
        .fpm-input-group:focus-within { box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
        .fpm-input-lg { min-height: 36px !important; }
        .fpm-modal-actions { gap: 12px !important; }
        .fpm-btn-ghost {
          background: #fff !important;
          border: 1px solid #E5E7EB !important;
          color: #111827 !important;
          padding: 0 16px !important;
          text-transform: uppercase;
        }

        /* ── Toasts ── */
        .fpm-toast {
          background: #FFFFFF !important;
          color: #111827 !important;
          border: 1px solid #E5E7EB !important;
          border-left: 4px solid #16A34A !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          animation: fpm-slidein 0.25s ease;
        }
        .fpm-toast.success { border-left-color: #16A34A !important; }
        .fpm-toast.error   { border-left-color: #DC2626 !important; }
        .fpm-toast.warn    { border-left-color: #D97706 !important; }
        .fpm-toast button { color: #6B7280 !important; }
        .fpm-toast button:hover { color: #111827 !important; }

        /* ── Animations ── */
        @keyframes fpm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fpm-modal-in { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes fpm-slidein { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .fpm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .fpm-header { flex-direction: column; align-items: flex-start; }
          .fpm-btn, .fpm-btn-ghost, .fpm-action-btn { min-height: 44px !important; }
        }
        @media (max-width: 600px) {
          .fpm-kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <ToastContainer toasts={toasts} onClose={remove} />

      {/* ── CONTENT WRAPPER – no top gap ── */}
      <div className="fpm-content" style={{ padding: '20px 24px' }}>

        {/* ── PAGE HEADER ── */}
        <div className="fpm-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 14, marginBottom: 20,
          paddingBottom: 14, borderBottom: `2px solid ${G.dark}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="fpm-header-icon" style={{ background: G.forest, padding: '10px 12px', border: `2px solid ${G.dark}`, display: 'flex' }}>
              <Printer size={22} color="#fff" />
            </div>
            <div>
              <div className="fpm-header-title" style={{ fontSize: 22, fontWeight: 900, color: G.dark, letterSpacing: -0.5 }}>
                Printing Asset Appraisals
              </div>
              <div className="fpm-header-sub" style={{ fontSize: 13, color: G.darkGray, marginTop: 2, fontWeight: 500 }}>
                Finance Dashboard · Machine Valuation &amp; Asset Ledger
              </div>
            </div>
          </div>
          <FlatBtn icon={loading ? null : RefreshCw} color={G.emerald} onClick={load} disabled={loading}>
            {loading ? <SegmentedSpinner size={14} /> : 'Refresh Ledger'}
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
        <div className="fpm-banner" style={{
          background: '#E0F2FE', border: `1px solid ${G.sky}`, borderLeft: `4px solid ${G.sky}`,
          padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
        }}>
          <Info size={16} color={G.sky} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: G.dark, fontWeight: 600 }}>
            Machines registered by the Printing Supervisor appear here. Finance appraises their internal book value.
          </div>
        </div>

        {/* ── TABLE ── */}
        {loading && machines.length === 0 ? (
          <div className="fpm-loading" style={{ textAlign: 'center', padding: '80px 24px', color: G.forest, fontWeight: 800, fontSize: 18 }}>
            <SegmentedSpinner size={32} />
            <span>Loading Ledger…</span>
          </div>
        ) : machines.length === 0 ? (
          <div className="fpm-empty" style={{ textAlign: 'center', padding: '70px 40px', background: G.lightGray, border: `2px dashed ${G.sage}` }}>
            <Printer size={56} color={G.sage} style={{ marginBottom: 16, display: 'block', margin: '0 auto 14px' }} />
            <div className="fpm-empty-title" style={{ fontSize: 20, fontWeight: 900, color: G.dark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              No Assets Registered
            </div>
            <p style={{ color: G.olive, fontSize: 14, margin: 0 }}>
              Machines registered by the Printing Supervisor will appear here.
            </p>
          </div>
        ) : (
          <div className="fpm-table-scroll" style={{ border: `2px solid ${G.dark}`, overflowX: 'auto' }}>
            <table className="fpm-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr className="fpm-thead" style={{ background: G.dark }}>
                  {['#', 'Machine', 'Model / Serial', 'Registered By', 'Status', 'Condition Notes', 'Book Value (ETB)', 'Action'].map((h, hi) => (
                    <th key={h} className="fpm-th" style={{
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
                        <span className="fpm-status" style={{
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
                          <span className="fpm-pending" style={{
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
                <tr className="fpm-tfoot" style={{ background: G.dark }}>
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
        <div className="fpm-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20,
        }}>
          <div className="fpm-modal" style={{
            background: '#fff', width: '100%', maxWidth: 440,
            maxHeight: '90vh', overflowY: 'auto',
            border: `3px solid ${G.dark}`,
          }}>
            {/* Modal Header */}
            <div className="fpm-modal-head" style={{
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
                className="fpm-modal-close"
                onClick={() => setEditMachine(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUpdateValue} className="fpm-modal-body" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Asset Info */}
              <div className="fpm-modal-asset" style={{ background: G.lightGray, padding: 14, borderLeft: `4px solid ${G.emerald}` }}>
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
                <label className="fpm-label" style={{ display: 'block', fontSize: 12, fontWeight: 800, color: G.darkGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Internal Book Value (ETB)
                </label>
                <div className="fpm-input-group" style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${G.dark}` }}>
                  <div className="fpm-input-prefix" style={{
                    padding: '12px 14px', background: G.dark, color: '#fff',
                    fontWeight: 900, fontSize: 14, borderRight: `2px solid ${G.forest}`,
                    display: 'flex', alignItems: 'center',
                  }}>ETB</div>
                  <input
                    className="fpm-input-lg"
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
                <div className="fpm-modal-note" style={{ background: '#FFF8E1', padding: 12, border: `2px solid ${G.orange}`, fontSize: 13, color: G.darkGray }}>
                  <strong style={{ color: G.brown }}>Condition Note:</strong> {editMachine.condition_notes}
                </div>
              )}

              {/* Actions */}
              <div className="fpm-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                <button
                  className="fpm-btn-ghost"
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
