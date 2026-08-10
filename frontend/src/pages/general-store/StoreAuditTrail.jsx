import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

/* ─── tiny spinner ─── */
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px' }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '3px solid #E5E7EB', borderTopColor: '#2563EB',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ─── date formatter ─── */
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/* ─── safe JSON pretty-printer ─── */
const pretty = (v) => {
  if (!v) return 'None';
  try { return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2); }
  catch { return String(v); }
};

/* ─── action badge colour map ─── */
const ACTION_COLOR = {
  STORE_ISSUE_TO_DEPT:        { bg: '#DBEAFE', color: '#1D4ED8' },
  STORE_MOVEMENT_TRANSFER:    { bg: '#EDE9FE', color: '#5B21B6' },
  STORE_NEW_ITEM_REGISTERED:  { bg: '#D1FAE5', color: '#065F46' },
  STORE_ADJUSTMENT_APPROVED:  { bg: '#FEF3C7', color: '#92400E' },
  STORE_QUANTITY_UPDATE:      { bg: '#FEF3C7', color: '#92400E' },
  STORE_VALUE_UPDATE:         { bg: '#FCE7F3', color: '#9D174D' },
  STORE_MATERIAL_UPDATE:      { bg: '#E0E7FF', color: '#3730A3' },
  CREATE:                     { bg: '#D1FAE5', color: '#065F46' },
  UPDATE:                     { bg: '#F3F4F6', color: '#374151' },
  DELETE:                     { bg: '#FEE2E2', color: '#991B1B' },
};
const actionStyle = (a) => ACTION_COLOR[a] || { bg: '#F3F4F6', color: '#374151' };

/* ════════════════════════════════════════════════════════
   StoreAuditTrail — General Store Audit Log
   Fetches from /audit-logs (centralAudit) with module=Store
   ════════════════════════════════════════════════════════ */
const StoreAuditTrail = () => {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [expanded,   setExpanded]   = useState(null);

  /* ── fetch ── */
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { module: 'Store', page, limit: 50 };
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/audit-logs', { params });

      /* apiClient interceptor already returns response.data
         backend sends: { status:'success', data: [...] }
         so res = { status, data: [...] }  */
      const rows = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      setLogs(rows);
    } catch (err) {
      console.error('[StoreAuditTrail] fetch failed:', err);
      setError(err.message || 'Failed to load audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [search, page]); // eslint-disable-line

  const toggle = (id) => setExpanded(p => (p === id ? null : id));

  /* ────────── styles ────────── */
  const S = {
    page:    { padding: '24px', background: '#F5F6FA', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',Roboto,sans-serif", color: '#111827' },
    header:  { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
    badge:   { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,.1)', padding: '4px 10px', borderRadius: 6, marginBottom: 10 },
    badgeDot:{ width: 6, height: 6, background: '#2563EB', borderRadius: '50%' },
    badgeTxt:{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#2563EB' },
    title:   { fontSize: 26, fontWeight: 600, margin: '0 0 4px', color: '#111827' },
    sub:     { fontSize: 14, color: '#6B7280', margin: 0 },
    expBtn:  { display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' },
    filters: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
    srchWrap:{ position: 'relative', flex: 1, minWidth: 260 },
    srchIcon:{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' },
    srchInp: { width: '100%', height: 36, padding: '0 12px 0 38px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' },
    lockedPill:{ display:'inline-flex', alignItems:'center', gap:6, height:36, padding:'0 14px', background:'rgba(37,99,235,.08)', border:'1px solid rgba(37,99,235,.25)', borderRadius:8, fontSize:13, fontWeight:600, color:'#2563EB', whiteSpace:'nowrap' },
    card:    { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' },
    tblWrap: { overflowX: 'auto' },
    tbl:     { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 },
    th:      { background: '#F9FAFB', padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' },
    td:      { padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontSize: 14, verticalAlign: 'top' },
    empty:   { textAlign: 'center', padding: '56px', color: '#9CA3AF', fontSize: 14 },
    viewBtn: { height: 28, padding: '0 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms' },
    detRow:  { background: '#F9FAFB' },
    diffWrap:{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '16px' },
    diffBox: { flex: 1, minWidth: 240, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 },
    diffT:   { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' },
    diffPre: { margin: 0, fontFamily: 'Consolas,monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#111827' },
    pgn:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #E5E7EB' },
    pgInfo:  { fontSize: 13, color: '#6B7280' },
    pgBtns:  { display: 'flex', gap: 8 },
    pgBtn:   { height: 32, padding: '0 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms' },
  };

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.badge}>
            <span style={S.badgeDot} />
            <span style={S.badgeTxt}>Security &amp; Compliance</span>
          </div>
          <h1 style={S.title}>Store Audit Log</h1>
          <p style={S.sub}>Append-only record of every General Store action — issues, receipts, transfers, adjustments.</p>
        </div>
        <button
          style={S.expBtn}
          onClick={() => window.print()}
          onMouseEnter={e => { e.target.style.background = '#F5F6FA'; e.target.style.borderColor = '#2563EB'; e.target.style.color = '#2563EB'; }}
          onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#111827'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={S.filters}>
        <div style={S.srchWrap}>
          <svg style={S.srchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={S.srchInp}
            type="text"
            placeholder="Search user, action, record no…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onFocus={e => e.target.style.borderColor = '#2563EB'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
        <div style={S.lockedPill}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Store Module Only
        </div>
      </div>

      {/* ── Table card ── */}
      <div style={S.card}>
        {error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626', fontSize: 14 }}>
            ⚠ {error} — <button onClick={fetchLogs} style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
          </div>
        ) : loading ? (
          <Spinner />
        ) : (
          <>
            <div style={S.tblWrap}>
              <table style={S.tbl}>
                <thead>
                  <tr>
                    <th style={S.th}>User &amp; Role</th>
                    <th style={S.th}>Action</th>
                    <th style={S.th}>Record</th>
                    <th style={S.th}>Date &amp; Time</th>
                    <th style={S.th}>IP</th>
                    <th style={S.th}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={S.empty}>
                        {search ? `No results for "${search}"` : 'No audit records found yet. Actions performed in the store will appear here.'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, i) => {
                      const ac = actionStyle(log.action);
                      const isOpen = expanded === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            style={{
                              background: isOpen ? '#EFF6FF' : i % 2 === 0 ? '#fff' : '#FAFAFA',
                              transition: 'background 150ms'
                            }}
                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(37,99,235,.04)'; }}
                            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'; }}
                          >
                            <td style={S.td}>
                              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{log.user_name || '—'}</div>
                              <div style={{ fontSize: 11, color: '#6B7280' }}>{log.role || 'Unknown'}</div>
                              {log.department && log.department !== 'Unknown' && (
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{log.department}</div>
                              )}
                            </td>
                            <td style={S.td}>
                              <span style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                                fontSize: 12, fontWeight: 600, background: ac.bg, color: ac.color
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontFamily: 'Consolas,monospace', fontSize: 13, color: '#374151' }}>
                                {log.record_identifier || '—'}
                              </span>
                            </td>
                            <td style={S.td}>
                              <div style={{ fontSize: 13, color: '#111827' }}>{fmtDate(log.created_at)}</div>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Consolas,monospace' }}>
                                {log.ip_address || '—'}
                              </span>
                            </td>
                            <td style={S.td}>
                              <button
                                style={{
                                  ...S.viewBtn,
                                  background: isOpen ? '#EFF6FF' : '#fff',
                                  borderColor: isOpen ? '#2563EB' : '#E5E7EB',
                                  color: isOpen ? '#2563EB' : '#111827'
                                }}
                                onClick={() => toggle(log.id)}
                                onMouseEnter={e => { e.target.style.borderColor = '#2563EB'; e.target.style.color = '#2563EB'; }}
                                onMouseLeave={e => { if (!isOpen) { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#111827'; } }}
                              >
                                {isOpen ? '▲ Hide' : '▼ Show'}
                              </button>
                            </td>
                          </tr>

                          {/* ── Expanded detail row ── */}
                          {isOpen && (() => {
                            const getObj = (val) => {
                              if (!val) return null;
                              try {
                                const p = typeof val === 'string' ? JSON.parse(val) : val;
                                return typeof p === 'object' && p !== null && !Array.isArray(p) ? p : null;
                              } catch { return null; }
                            };
                            const pObj = getObj(log.previous_value);
                            const nObj = getObj(log.new_value);

                            // Skip rows that carry no data at all
                            if (!pObj && !nObj) return (
                              <tr style={S.detRow}>
                                <td colSpan={6} style={{ padding: '20px 24px', borderBottom: '2px solid #BFDBFE', color: '#6B7280', fontSize: 13 }}>
                                  No field details recorded for this action.
                                </td>
                              </tr>
                            );

                            // Skip internal / noisy keys
                            const SKIP = new Set(['id', 'updated_at', 'created_at', 'deleted_at']);
                            const allKeys = Array.from(
                              new Set([...Object.keys(pObj || {}), ...Object.keys(nObj || {})])
                            ).filter(k => !SKIP.has(k));

                            return (
                              <tr style={S.detRow}>
                                <td colSpan={6} style={{ padding: 0, borderBottom: '2px solid #BFDBFE' }}>
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                      <thead>
                                        <tr style={{ background: '#F9FAFB' }}>
                                          <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB', width: '22%' }}>Field</th>
                                          <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB', width: '39%' }}>Previous Value</th>
                                          <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB', width: '39%' }}>New Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {allKeys.map(key => {
                                          const pv = pObj && pObj[key] != null ? String(pObj[key]) : '—';
                                          const nv = nObj && nObj[key] != null ? String(nObj[key]) : '—';
                                          const changed = pv !== nv && pObj !== null && nObj !== null;
                                          return (
                                            <tr key={key} style={{ background: changed ? '#FFFBEB' : 'transparent' }}>
                                              <td style={{ padding: '7px 16px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #F3F4F6', fontFamily: 'Consolas,monospace', fontSize: 12 }}>{key}</td>
                                              <td style={{ padding: '7px 16px', color: changed ? '#B45309' : '#6B7280', borderBottom: '1px solid #F3F4F6', fontFamily: 'Consolas,monospace', fontSize: 12, wordBreak: 'break-all' }}>
                                                {changed ? <s style={{ opacity: .6 }}>{pv}</s> : pv}
                                              </td>
                                              <td style={{ padding: '7px 16px', color: changed ? '#15803D' : '#6B7280', borderBottom: '1px solid #F3F4F6', fontWeight: changed ? 600 : 400, fontFamily: 'Consolas,monospace', fontSize: 12, wordBreak: 'break-all' }}>
                                                {nv}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div style={S.pgn}>
              <span style={S.pgInfo}>
                Page {page} — {logs.length === 50 ? '50 records (more available)' : `${logs.length} record${logs.length !== 1 ? 's' : ''}`}
              </span>
              <div style={S.pgBtns}>
                <button
                  style={{ ...S.pgBtn, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  onMouseEnter={e => { if (page > 1) { e.target.style.borderColor = '#2563EB'; e.target.style.color = '#2563EB'; } }}
                  onMouseLeave={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#111827'; }}
                >← Previous</button>
                <button
                  style={{ ...S.pgBtn, opacity: logs.length < 50 ? 0.4 : 1, cursor: logs.length < 50 ? 'not-allowed' : 'pointer' }}
                  disabled={logs.length < 50}
                  onClick={() => setPage(p => p + 1)}
                  onMouseEnter={e => { if (logs.length >= 50) { e.target.style.borderColor = '#2563EB'; e.target.style.color = '#2563EB'; } }}
                  onMouseLeave={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.color = '#111827'; }}
                >Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoreAuditTrail;
