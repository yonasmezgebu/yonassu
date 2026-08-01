import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, RefreshCw, Truck, ClipboardList, AlertTriangle,
  EyeOff, CheckCircle, XCircle, Zap, ChevronDown, ChevronUp,
  DollarSign, Package, Calendar, FileText
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import authService from '../../services/authService';

const BG  = '#FCEFD8';
const C   = '#8B4513';
const CD  = '#5C2D0A';
const CDX = '#3E1E06';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }
  @keyframes colorBlink {
    0%   { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); }
    33%  { color:#D4A843; filter:drop-shadow(0 0 10px rgba(212,168,67,0.8)); transform:scale(1.15) rotate(10deg); }
    66%  { color:#5BAD8A; filter:drop-shadow(0 0 14px rgba(91,173,138,1)); transform:scale(1.3) rotate(-10deg); }
    100% { color:#E07B54; filter:drop-shadow(0 0 6px rgba(224,123,84,0.6)); transform:scale(1) rotate(0deg); }
  }
  .ceo-blink { animation: colorBlink 2.5s infinite ease-in-out; }

  .ceo-page { min-height:calc(100vh - 64px); font-family:'Inter','Segoe UI',sans-serif; padding-bottom:48px; }

  .ceo-card {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0;
    box-shadow:0 4px 20px rgba(0,30,80,.10);
    transition:background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation:fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,var(--hc),var(--hc)),
      linear-gradient(to bottom,var(--hc),var(--hc)),
      linear-gradient(to left,var(--hc),var(--hc)),
      linear-gradient(to top,var(--hc),var(--hc));
    background-position:0 0,100% 0,100% 100%,0 100%;
    background-repeat:no-repeat;
    background-size:0% 4px,4px 0%,0% 4px,4px 0%;
  }
  .ceo-card:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,30,80,.18);
    transform:translateY(-2px);
  }
  .ceo-card::after {
    content:''; position:absolute; top:0; left:-150%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent 0%,rgba(0,255,255,0.25) 20%,rgba(255,0,255,0.25) 50%,rgba(0,255,0,0.25) 80%,transparent 100%);
    transform:skewX(-25deg); pointer-events:none; z-index:2;
  }
  .ceo-card:hover::after { animation:laserSweep .8s ease-out forwards; }

  .ceo-chip {
    --hc:${C}; position:relative; overflow:hidden;
    background:white; border-radius:0; padding:20px;
    box-shadow:0 4px 20px rgba(0,30,80,.10);
    transition:background-size .45s ease, box-shadow .3s ease, transform .2s ease;
    animation:fadeUp .5s ease both;
    background-image:
      linear-gradient(to right,var(--hc),var(--hc)),
      linear-gradient(to bottom,var(--hc),var(--hc)),
      linear-gradient(to left,var(--hc),var(--hc)),
      linear-gradient(to top,var(--hc),var(--hc));
    background-position:0 0,100% 0,100% 100%,0 100%;
    background-repeat:no-repeat;
    background-size:0% 4px,4px 0%,0% 4px,4px 0%;
  }
  .ceo-chip:hover {
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
    box-shadow:0 8px 32px rgba(0,30,80,.18);
    transform:translateY(-3px);
  }

  .ceo-head {
    padding:14px 22px;
    background:linear-gradient(135deg,${C},${CD});
    color:white; display:flex; align-items:center; gap:12px;
    box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);
  }
  .ceo-head span { font-size:13px; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }

  .ceo-title {
    font-size:2.4rem; font-weight:900; color:#0d1a30; letter-spacing:-.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 ${C},4px 4px 0 ${C},5px 5px 0 ${CD},6px 6px 10px rgba(0,0,0,.18);
    margin:0; display:flex; align-items:center; gap:12px; line-height:1.1;
  }
  .ceo-sub { font-size:.82rem; color:${C}; font-weight:800; text-transform:uppercase; letter-spacing:.14em; }

  .ceo-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .ceo-th  { text-align:left; padding:11px 14px;
    background:linear-gradient(135deg,rgba(139,69,19,.12),rgba(92,45,10,.07));
    border-bottom:3px solid ${C}; color:${CD}; font-weight:900;
    text-transform:uppercase; letter-spacing:.06em; font-size:10.5px; }
  .ceo-td  { padding:12px 14px; border-bottom:1px solid rgba(139,69,19,.09); color:#2d3748; font-weight:600; vertical-align:middle; }
  .ceo-tr:hover .ceo-td { background:rgba(139,69,19,.04); }

  .ceo-badge {
    padding:5px 12px; border-radius:99px; font-weight:900; font-size:10.5px;
    text-transform:uppercase; letter-spacing:.05em; display:inline-flex; align-items:center; gap:5px;
    box-shadow:0 2px 0 rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.6);
    white-space:nowrap;
  }
  .badge-pending  { background:linear-gradient(135deg,#fffbeb,#fef3c7); color:#92400e; border:1px solid #fde68a; }
  .badge-confirmed { background:linear-gradient(135deg,#ecfdf5,#d1fae5); color:#065f46; border:1px solid #6ee7b7; }
  .badge-rejected { background:linear-gradient(135deg,#fef2f2,#fee2e2); color:#991b1b; border:1px solid #fca5a5; }
  .badge-approved { background:linear-gradient(135deg,#ecfdf5,#d1fae5); color:#065f46; border:1px solid #6ee7b7; }
  .badge-ceo-conf { background:linear-gradient(135deg,#eff6ff,#dbeafe); color:#1e40af; border:1px solid #93c5fd; }
  .badge-ceo-rej  { background:linear-gradient(135deg,#fdf2f8,#fce7f3); color:#9d174d; border:1px solid #f9a8d4; }
  .badge-default  { background:rgba(139,69,19,.1); color:${CD}; border:1px solid rgba(139,69,19,.25); }

  .ceo-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 16px; font-weight:900; font-size:12px; cursor:pointer;
    letter-spacing:.07em; text-transform:uppercase; border-radius:8px;
    transition:all .12s; font-family:'Inter',sans-serif;
    box-shadow:0 4px 0 rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.2);
  }
  .ceo-btn:active { transform:translateY(4px); box-shadow:none; }
  .ceo-btn-confirm { background:linear-gradient(135deg,#10b981,#059669); color:white; border:2px solid #047857; }
  .ceo-btn-reject  { background:linear-gradient(135deg,#ef4444,#dc2626); color:white; border:2px solid #b91c1c; }
  .ceo-btn-ghost   { background:white; color:${CD}; border:2px solid ${C}; }

  .ceo-section-toggle {
    display:flex; align-items:center; gap:10px; cursor:pointer;
    padding:8px 0; user-select:none;
  }
  .ceo-section-toggle:hover { opacity:.8; }

  .ceo-note-input {
    width:100%; padding:8px 12px; font-size:13px; font-family:'Inter',sans-serif;
    border:2px solid ${C}; outline:none; background:white; color:#0d1a30; font-weight:600;
    box-shadow:0 3px 0 ${CD},0 5px 10px rgba(0,40,80,.08); border-radius:0;
    resize:none;
  }
  .ceo-note-input:focus { border-color:${CD}; }

  .read-only-banner {
    background:linear-gradient(135deg,#fffbeb,#fef3c7);
    border:2px solid #fde68a; padding:14px 20px;
    display:flex; align-items:center; gap:12px;
    margin:0 32px 20px; animation:fadeUp .4s ease;
  }
`;

const BADGE_CLASS = {
  PENDING:       'badge-pending',
  CEO_CONFIRMED: 'badge-ceo-conf',
  CEO_REJECTED:  'badge-ceo-rej',
  APPROVED:      'badge-approved',
  REJECTED:      'badge-rejected',
  CEO_APPROVED:  'badge-approved',
};
const getBadgeClass = (s) => BADGE_CLASS[s] || 'badge-default';

const StatusBadge = ({ status }) => (
  <span className={`ceo-badge ${getBadgeClass(status)}`}>
    {status?.replace(/_/g, ' ') || '—'}
  </span>
);

const fmt = (v) => parseFloat(v || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Section wrapper with collapse ──
function Section({ icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ceo-card">
      <div className="ceo-head" style={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon size={20} />
          <span>{title}</span>
          {count !== undefined && (
            <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 900 }}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      {open && children}
    </div>
  );
}

// ── Confirm/Reject action row ──
function ActionRow({ id, onDecide, isReadOnly, type = 'delivery' }) {
  const [note, setNote]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [ceoVal, setCeoVal] = useState('');

  const handleDecide = async (action) => {
    setBusy(true);
    try {
      if (type === 'delivery') {
        await pharmacyService.ceoDecideDelivery(id, { action, ceo_notes: note });
      } else if (type === 'manager-request') {
        await pharmacyService.ceoDecideManagerRequest(id, { ceo_value: ceoVal });
      } else if (type === 'expired-drug') {
        await pharmacyService.ceoDecideExpiredDrug(id, { action, ceo_notes: note });
      }
      setDone(true);
      onDecide();
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  if (isReadOnly) return null;
  if (done) return <div style={{ color: '#059669', fontWeight: 800, fontSize: 12, padding: '6px 0' }}>✓ Decision recorded — refresh to see update</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {type === 'manager-request' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number" step="any"
            placeholder="Set CEO value"
            value={ceoVal} onChange={e => setCeoVal(e.target.value)}
            style={{ padding: '7px 12px', border: `2px solid ${C}`, fontWeight: 800, fontSize: 13, fontFamily: 'Inter', outline: 'none', width: 160 }}
          />
          <button className="ceo-btn ceo-btn-confirm" disabled={busy || !ceoVal} onClick={() => handleDecide('DECIDE')}>
            {busy ? '…' : <><CheckCircle size={13} />Set Value</>}
          </button>
        </div>
      ) : (
        <>
          <textarea rows={2} className="ceo-note-input" placeholder="CEO notes (optional)…" value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ceo-btn ceo-btn-confirm" disabled={busy} onClick={() => handleDecide('CONFIRM')}>
              {busy ? '…' : <><CheckCircle size={13} />Confirm</>}
            </button>
            <button className="ceo-btn ceo-btn-reject" disabled={busy} onClick={() => handleDecide('REJECT')}>
              {busy ? '…' : <><XCircle size={13} />Reject</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CEOReport() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]       = useState(today);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const user     = authService.getCurrentUser();
  const isCEO    = user?.roles?.map(r => r.toLowerCase()).includes('ceo') || user?.roles?.map(r => r.toLowerCase()).includes('admin');
  const isReadOnly = !isCEO; // Pharmacy Manager sees read-only

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getCEOReport({ date });
      setData(res?.data || res);
    } catch (e) {
      console.error(e);
      setData({ deliveries: [], managerRequests: [], expiredDrugs: [], hideLog: [] });
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const deliveries      = data?.deliveries || [];
  const managerRequests = data?.managerRequests || [];
  const expiredDrugs    = data?.expiredDrugs || [];
  const hideLog         = data?.hideLog || [];

  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING');
  const pendingRequests   = managerRequests.filter(r => r.status === 'PENDING');
  const pendingExpired    = expiredDrugs.filter(e => !['CEO_APPROVED','CEO_REJECTED'].includes(e.status));

  return (
    <div className="ceo-page">
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '28px 32px 22px', animation: 'fadeUp .35s ease' }}>
        <div>
          <h1 className="ceo-title">
            CEO Report.
            <BarChart2 className="ceo-blink" size={34} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="ceo-sub">Executive Queue · Items Awaiting CEO Decision</p>
        </div>
        <div style={{ justifySelf: 'end', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '9px 13px', border: `2px solid ${C}`, background: 'white', fontWeight: 800, color: '#0d1a30', outline: 'none', fontFamily: 'Inter', fontSize: 13, boxShadow: `0 4px 0 ${CD}`, borderRadius: 0 }}
          />
          <button onClick={load} disabled={loading} className="ceo-btn ceo-btn-ghost">
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Read-only notice for Pharmacy Manager */}
      {isReadOnly && (
        <div className="read-only-banner">
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong style={{ color: '#92400e', fontSize: 13 }}>Read-Only View</strong>
            <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: 12, fontWeight: 600 }}>
              You can see the status of your submitted items. Only the CEO can approve or reject them.
            </p>
          </div>
        </div>
      )}

      {/* SUMMARY CHIPS */}
      <div style={{ padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Pending Deliveries', val: pendingDeliveries.length, icon: <Truck size={22} />, color: '#d97706' },
          { label: 'Pending Requests',   val: pendingRequests.length,   icon: <ClipboardList size={22} />, color: '#7c3aed' },
          { label: 'Expired Drug Issues',val: pendingExpired.length,    icon: <Package size={22} />, color: '#dc2626' },
          { label: 'Hide Log (CEO)',      val: hideLog.length,           icon: <EyeOff size={22} />, color: '#0369a1' },
        ].map((s, i) => (
          <div key={i} className="ceo-chip" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>{s.label}</div>
              <div style={{ color: s.color, opacity: .7 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <Zap size={48} color={C} style={{ animation: 'pulse 1.5s ease-in-out infinite', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontWeight: 800, color: '#0d1a30', fontSize: 18 }}>Loading CEO Report…</div>
        </div>
      ) : (
        <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 1. Direct Deliveries ── */}
          <Section icon={Truck} title="Direct Deliveries" count={deliveries.length}>
            {deliveries.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No delivery records found.</div>
            ) : (
              <table className="ceo-tbl">
                <thead>
                  <tr>
                    <th className="ceo-th">Delivery No.</th>
                    <th className="ceo-th">Supplier</th>
                    <th className="ceo-th">Drug</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>Qty</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>Total (ETB)</th>
                    <th className="ceo-th">Status</th>
                    <th className="ceo-th">CEO Notes</th>
                    {!isReadOnly && <th className="ceo-th">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => (
                    <tr key={d.id} className="ceo-tr">
                      <td className="ceo-td"><code style={{ background: 'rgba(139,69,19,.1)', padding: '3px 8px', fontSize: 12, fontWeight: 900, color: CD }}>{d.delivery_no || `#${d.id}`}</code></td>
                      <td className="ceo-td" style={{ fontWeight: 700 }}>{d.supplier || '—'}</td>
                      <td className="ceo-td">{d.drug_name || '—'}</td>
                      <td className="ceo-td" style={{ textAlign: 'right', fontWeight: 800 }}>{d.quantity || 0}</td>
                      <td className="ceo-td" style={{ textAlign: 'right', fontWeight: 900, color: CD }}>{fmt(d.total_amount)}</td>
                      <td className="ceo-td"><StatusBadge status={d.status} /></td>
                      <td className="ceo-td" style={{ color: '#64748b', fontSize: 12 }}>{d.ceo_notes || '—'}</td>
                      {!isReadOnly && (
                        <td className="ceo-td">
                          {['PENDING', 'PENDING_CEO'].includes(d.status) ? (
                            <ActionRow id={d.id} onDecide={load} isReadOnly={isReadOnly} type="delivery" />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 2. Manager Requests ── */}
          <Section icon={ClipboardList} title="Manager Requests (Price / Qty Changes)" count={managerRequests.length}>
            {managerRequests.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No manager requests found.</div>
            ) : (
              <table className="ceo-tbl">
                <thead>
                  <tr>
                    <th className="ceo-th">Drug</th>
                    <th className="ceo-th">Request Type</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>Current Value</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>Requested Value</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>CEO Value</th>
                    <th className="ceo-th">Reason</th>
                    <th className="ceo-th">Status</th>
                    {!isReadOnly && <th className="ceo-th">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {managerRequests.map((r, i) => (
                    <tr key={r.id} className="ceo-tr">
                      <td className="ceo-td" style={{ fontWeight: 700 }}>{r.drug_name || '—'}</td>
                      <td className="ceo-td">
                        <span className="ceo-badge badge-default">{r.request_type || '—'}</span>
                      </td>
                      <td className="ceo-td" style={{ textAlign: 'right' }}>{fmt(r.current_value)}</td>
                      <td className="ceo-td" style={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>{fmt(r.requested_value)}</td>
                      <td className="ceo-td" style={{ textAlign: 'right', fontWeight: 900, color: CD }}>
                        {r.ceo_value != null ? fmt(r.ceo_value) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td className="ceo-td" style={{ color: '#64748b', fontSize: 12, maxWidth: 180 }}>{r.reason || '—'}</td>
                      <td className="ceo-td"><StatusBadge status={r.status} /></td>
                      {!isReadOnly && (
                        <td className="ceo-td">
                          {r.status === 'PENDING' ? (
                            <ActionRow id={r.id} onDecide={load} isReadOnly={isReadOnly} type="manager-request" />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 3. Expired Drugs ── */}
          <Section icon={AlertTriangle} title="Expired Drug Actions" count={expiredDrugs.length}>
            {expiredDrugs.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No expired drug records found.</div>
            ) : (
              <table className="ceo-tbl">
                <thead>
                  <tr>
                    <th className="ceo-th">Drug Name</th>
                    <th className="ceo-th" style={{ textAlign: 'right' }}>Qty</th>
                    <th className="ceo-th">Expiry Date</th>
                    <th className="ceo-th">Action Required</th>
                    <th className="ceo-th">Status</th>
                    <th className="ceo-th">CEO Notes</th>
                    {!isReadOnly && <th className="ceo-th">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expiredDrugs.map((e, i) => (
                    <tr key={e.id} className="ceo-tr">
                      <td className="ceo-td" style={{ fontWeight: 700 }}>{e.drug_name || '—'}</td>
                      <td className="ceo-td" style={{ textAlign: 'right', fontWeight: 800 }}>{e.quantity || 0}</td>
                      <td className="ceo-td" style={{ color: '#dc2626', fontWeight: 800 }}>{fmtDate(e.expiry_date)}</td>
                      <td className="ceo-td"><span className="ceo-badge badge-pending">{e.action_required || '—'}</span></td>
                      <td className="ceo-td"><StatusBadge status={e.status} /></td>
                      <td className="ceo-td" style={{ color: '#64748b', fontSize: 12 }}>{e.ceo_notes || '—'}</td>
                      {!isReadOnly && (
                        <td className="ceo-td">
                          {!['CEO_APPROVED', 'CEO_REJECTED'].includes(e.status) ? (
                            <ActionRow id={e.id} onDecide={load} isReadOnly={isReadOnly} type="expired-drug" />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── 4. Drug Hide Log ── */}
          <Section icon={EyeOff} title="Drug Hide Log (CEO-Notified)" count={hideLog.length} defaultOpen={false}>
            {hideLog.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No CEO-notified hide events.</div>
            ) : (
              <table className="ceo-tbl">
                <thead>
                  <tr>
                    <th className="ceo-th">Drug Name</th>
                    <th className="ceo-th">Hide Type</th>
                    <th className="ceo-th">Reason</th>
                    <th className="ceo-th">Auto-Show Date</th>
                    <th className="ceo-th">Logged At</th>
                  </tr>
                </thead>
                <tbody>
                  {hideLog.map((h, i) => (
                    <tr key={h.id} className="ceo-tr">
                      <td className="ceo-td" style={{ fontWeight: 700 }}>{h.drug_name || '—'}</td>
                      <td className="ceo-td"><span className="ceo-badge badge-default">{h.hide_type || '—'}</span></td>
                      <td className="ceo-td" style={{ color: '#64748b', fontSize: 12 }}>{h.reason || '—'}</td>
                      <td className="ceo-td">{fmtDate(h.auto_show_date)}</td>
                      <td className="ceo-td" style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(h.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

        </div>
      )}
    </div>
  );
}
