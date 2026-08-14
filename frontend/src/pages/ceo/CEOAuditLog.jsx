import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shield, RefreshCw, AlertTriangle, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import apiClient from '../../services/apiClient';

const C = {
  forest: '#16a34a', dark: '#14532d', emerald: '#059669',
  mint: '#f0fdf4', white: '#FFFFFF', lightGray: '#F9FAFB',
  gray: '#6B7280', darkGray: '#111827', border: '#E5E7EB',
  warning: '#d97706', warningLight: '#FEF3C7',
  error: '#dc2626', errorLight: '#FEE2E2',
  blue: '#2563eb', blueLight: '#DBEAFE',
  purple: '#7c3aed', purpleLight: '#EDE9FE',
  orange: '#ea580c', orangeLight: '#FFF7ED',
  indigo: '#4f46e5', indigoLight: '#EEF2FF'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
         ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const safeParse = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed, null, 2) : String(val);
  } catch {
    return String(val);
  }
};

const IGNORE_KEYS = new Set([
  'id', 'created_at', 'updated_at', 'timestamp', 'createdAt', 'updatedAt',
  'password', 'currentPassword', 'newPassword', 'two_factor_secret', 'token',
]);

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (/created|added|registered|recorded|set$|opened|posted/.test(a)) return 'create';
  if (/updated|changed|toggled|adjusted|extended|modified|renewed|emailed/.test(a)) return 'update';
  if (/deleted|cancelled|rejected|disqualified|voided|removed|retracted|archived|terminated/.test(a)) return 'delete';
  if (/approved|published|submitted|released|sent|completed|converted|finalized|verified|closed|awarded|forwarded|paid|generated|accepted/.test(a)) return 'status';
  return 'other';
};

const toneColors = {
  create: { bg: C.mint, text: C.forest, border: C.emerald },
  update: { bg: C.blueLight, text: C.blue, border: C.blue },
  delete: { bg: C.errorLight, text: C.error, border: C.error },
  status: { bg: C.purpleLight, text: C.purple, border: C.purple },
  other: { bg: C.lightGray, text: C.gray, border: C.border }
};

const CEOAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('CEO');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;

      // CEO uses standard audit-logs endpoint to see EVERYTHING securely
      const res = await apiClient.get('/audit-logs', { params });
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []));
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const toggleRow = (id) => setExpandedRow(prev => (prev === id ? null : id));

  const exportLogs = () => {
    window.print();
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1440, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 30, background: `linear-gradient(180deg, ${C.forest}, ${C.emerald})`, borderRadius: 4 }} />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.darkGray, letterSpacing: -0.5 }}>Central Audit Log</h1>
          </div>
          <p style={{ margin: 0, color: C.gray, fontSize: 13, paddingLeft: 16 }}>CEO view · Append-only system record of all module activities</p>
        </div>
        <button onClick={exportLogs} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
          background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 9,
          color: C.darkGray, fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s'
        }}>
          <Download size={16} /> Export Logs
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
          <Search size={18} color={C.gray} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search user, action, or record..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ 
              width: '100%', padding: '10px 14px 10px 40px', borderRadius: 8, border: `1px solid ${C.border}`, 
              fontSize: 14, outline: 'none', background: C.white, boxSizing: 'border-box'
            }}
          />
        </div>
        <select
          value={moduleFilter}
          onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
          style={{ 
            padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, 
            fontSize: 14, outline: 'none', background: C.white, cursor: 'pointer', minWidth: 200
          }}
        >
          <option value="CEO">CEO (My Activities)</option>
          <option value="">— All Modules —</option>
          <option value="HR">HR</option>
          <option value="Printing">Printing</option>
          <option value="Finance">Finance</option>
          <option value="Pharmacy Store">Pharmacy Store</option>
          <option value="Pharmacy Sales">Pharmacy Sales</option>
          <option value="Pharmacy">Pharmacy (Legacy)</option>
          <option value="Store">Store</option>
          <option value="Car Rental">Car Rental</option>
          <option value="Procurement">Procurement</option>
          <option value="Sales">Sales</option>
          <option value="Inventory">Inventory</option>
        </select>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.lightGray }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: C.gray, borderBottom: `2px solid ${C.border}` }}>User & Role</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: C.gray, borderBottom: `2px solid ${C.border}` }}>Module</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: C.gray, borderBottom: `2px solid ${C.border}` }}>Action & Record</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: C.gray, borderBottom: `2px solid ${C.border}` }}>Date & IP</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: C.gray, borderBottom: `2px solid ${C.border}` }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: C.gray }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    Loading audit records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: C.error }}>
                    <AlertTriangle size={24} style={{ margin: '0 auto 12px' }} />
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: C.gray }}>
                    <FileText size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const tone = actionTone(log.action);
                  const colors = toneColors[tone] || toneColors.other;
                  const isExpanded = expandedRow === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: isExpanded ? C.lightGray : C.white, transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 700, color: C.darkGray, fontSize: 13 }}>{log.user_name}</div>
                          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{log.role} — {log.department}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700, border: '1px solid #E2E8F0' }}>
                            {log.module || 'System'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 800, color: colors.text, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{log.action}</div>
                          {log.action !== 'UPDATE' && <div style={{ fontSize: 12, color: C.gray, marginTop: 4, fontWeight: 500 }}>{log.record_identifier || '—'}</div>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 500, color: C.darkGray, fontSize: 12 }}>{formatDate(log.created_at)}</div>
                          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>IP: {log.ip_address || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button onClick={() => toggleRow(log.id)} style={{
                            background: isExpanded ? colors.bg : 'transparent', color: isExpanded ? colors.text : C.gray,
                            border: `1px solid ${isExpanded ? colors.border : C.border}`, borderRadius: 6,
                            padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                          }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? 'Hide' : 'Changes'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (() => {
                        const getObj = (val) => {
                          if (!val) return null;
                          try {
                            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                            return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : null;
                          } catch { return null; }
                        };
                        const pObj = getObj(log.previous_value);
                        const nObj = getObj(log.new_value);
                        const hasAnyValue = log.previous_value != null || log.new_value != null;
                        
                        return (
                          <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#FAFAFA' }}>
                            <td colSpan={5} style={{ padding: '20px 30px', borderLeft: `3px solid ${colors.border}` }}>
                              {pObj || nObj ? (() => {
                                const keys = Array.from(new Set([...Object.keys(pObj || {}), ...Object.keys(nObj || {})]))
                                  .filter(k => !IGNORE_KEYS.has(k));
                                const changedKeys = (pObj && nObj)
                                  ? keys.filter(k => String(pObj[k] ?? '') !== String(nObj[k] ?? ''))
                                  : keys;
                                
                                if (changedKeys.length === 0) {
                                  return (
                                    <div style={{ background: C.white, padding: 16, borderRadius: 8, border: `1px solid ${C.border}`, color: C.gray, fontSize: 12, textAlign: 'center' }}>
                                      No field values changed in this update.
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                      <thead>
                                        <tr style={{ background: '#F1F5F9' }}>
                                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: `1px solid ${C.border}` }}>Field</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: `1px solid ${C.border}` }}>Previous Value</th>
                                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: `1px solid ${C.border}` }}>New Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {keys.map(key => {
                                          const pv = pObj && pObj[key] !== undefined && pObj[key] !== null ? String(pObj[key]) : '—';
                                          const nv = nObj && nObj[key] !== undefined && nObj[key] !== null ? String(nObj[key]) : '—';
                                          const isChanged = pv !== nv && pObj !== null && nObj !== null;
                                          if (!isChanged && pObj !== null && nObj !== null) return null; // Only show changes
                                          
                                          return (
                                            <tr key={key} style={{ borderBottom: `1px solid ${C.border}`, background: isChanged ? C.mint : 'transparent' }}>
                                              <td style={{ padding: '10px 14px', fontWeight: 600, color: C.darkGray }}>{key}</td>
                                              <td style={{ padding: '10px 14px', color: isChanged ? C.error : C.gray, textDecoration: isChanged ? 'line-through' : 'none' }}>{pv}</td>
                                              <td style={{ padding: '10px 14px', color: isChanged ? C.forest : C.gray, fontWeight: isChanged ? 600 : 400 }}>{nv}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })() : (
                                !hasAnyValue ? (
                                  <div style={{ background: C.white, padding: 16, borderRadius: 8, border: `1px solid ${C.border}`, color: C.darkGray, fontSize: 13, textAlign: 'center', fontWeight: 500 }}>
                                    {log.record_identifier
                                      ? log.record_identifier
                                      : `"${log.action}" was performed by ${log.user_name}.`}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {log.record_identifier && (
                                      <div style={{ background: C.mint, padding: '12px 16px', borderRadius: 8, border: `1px solid ${C.emerald}`, color: C.dark, fontSize: 13, fontWeight: 500 }}>
                                        {log.record_identifier}
                                      </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: log.previous_value != null && log.new_value != null ? '1fr 1fr' : '1fr', gap: 16 }}>
                                      {log.previous_value != null && (
                                        <div style={{ background: C.white, padding: 16, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                          <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase' }}>Previous Value</div>
                                          <pre style={{ margin: 0, fontSize: 12, color: C.darkGray, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{safeParse(log.previous_value)}</pre>
                                        </div>
                                      )}
                                      {log.new_value != null && (
                                        <div style={{ background: C.white, padding: 16, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                          <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase' }}>{log.previous_value == null ? 'Payload (Snapshot)' : 'New Value'}</div>
                                          <pre style={{ margin: 0, fontSize: 12, color: C.darkGray, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{safeParse(log.new_value)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
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
        
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: C.white, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.gray, fontWeight: 500 }}>
            Showing page {page} {logs.length === 50 ? '(50 records)' : `(${logs.length} records)`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: page === 1 ? '#cbd5e1' : C.darkGray, fontWeight: 600, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              disabled={logs.length < 50}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: logs.length < 50 ? '#cbd5e1' : C.darkGray, fontWeight: 600, fontSize: 13, cursor: logs.length < 50 ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default CEOAuditLog;
