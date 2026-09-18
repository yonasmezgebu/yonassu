import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../../services/hrService.js';
import {
  Clock, Fingerprint, CreditCard, ScanFace, CheckCircle2, XCircle,
  CalendarDays, TrendingUp, Timer, ShieldCheck
} from 'lucide-react';

const to12 = (t) => {
  if (!t) return '--:--';
  const hh = parseInt(t.slice(0, 2), 10);
  const mm = t.slice(3, 5);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`;
};

const style = `
  .att-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 24px; font-family: Inter, system-ui, sans-serif; color: #0f172a; }
  .att-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .att-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
  .att-sub { color: #64748b; margin: 0; font-size: 14px; }
  .att-clock { font-family: ui-monospace, monospace; font-size: 26px; font-weight: 800; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px 18px; border-radius: 12px; }
  .att-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .att-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; }
  .att-card-h { font-size: 15px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
  .att-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; }
  .att-stat { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 14px 8px; }
  .att-stat b { display: block; font-size: 22px; font-weight: 800; }
  .att-stat span { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
  .att-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; font-weight: 800; font-size: 15px; border: 1px solid transparent; }
  .att-pill.P { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
  .att-pill.A { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
  .att-method { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; }
  table.att-t { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.att-t th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e2e8f0; }
  table.att-t td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  .att-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
  .att-note { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
  .att-mth-chip { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: #334155; }
`;

export const AttendancePage = () => {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await hrService.etp.getMyAttendancePortal({ month });
      setData(res.data?.data || res.data || null);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const shiftMonth = (delta) => {
    let m = month + delta;
    if (m < 1) m = 12;
    if (m > 12) m = 1;
    setMonth(m);
  };

  if (loading) return <div className="att-wrap">Loading attendance…</div>;

  const d = data || {};
  const monthly = d.monthly || {};
  const methods = monthly.method_counts || {};
  const monthLabel = monthly.month_label || `${monthLabelFor(month)} ${new Date().getFullYear()}`;
  function monthLabelFor(m) { return new Date(2000, m - 1, 1).toLocaleString('en-GB', { month: 'long' }); }

  return (
    <div className="att-wrap">
      <style>{style}</style>

      {/* Header */}
      <div className="att-head">
        <div>
          <h1 className="att-title">My Attendance</h1>
          <p className="att-sub">
            Biometric &amp; card-based daily attendance log · {d.full_name || 'Employee'} {d.employee_id ? `· ${d.employee_id}` : ''}
            {d.dept_name ? ` · ${d.dept_name}` : ''}
          </p>
        </div>
        <div className="att-clock">{now.toLocaleTimeString()}</div>
      </div>

      {error && <div className="att-err">{error}</div>}

      {d.linked === false && (
        <div className="att-note">
          No HR attendance profile is linked to this account yet. Contact HR to link your employee record — your log will appear here automatically.
        </div>
      )}

      {/* Today */}
      <div className="att-grid2">
        <div className="att-card">
          <h3 className="att-card-h"><Clock size={16} color="#0284c7" /> Today's Attendance</h3>
          {d.today && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span className={`att-pill ${d.today.status === 'P' ? 'P' : 'A'}`}>
                  {d.today.status === 'P' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  Status: {d.today.status === 'P' ? 'Present' : 'Absent'} ({d.today.status})
                </span>
                {d.today.auth_label && <span className="att-method">{methodIcon(d.today.auth_label)}{d.today.auth_label}</span>}
              </div>
              <div className="att-stat-row">
                <div className="att-stat"><b>{to12(d.today.time_in)}</b><span>Time In</span></div>
                <div className="att-stat"><b>{to12(d.today.time_out)}</b><span>Time Out</span></div>
                <div className="att-stat"><b>{d.today.net_work_hours || '0.00'}h</b><span>Work Hours</span></div>
                <div className="att-stat"><b>{d.today.terminal_ip || '—'}</b><span>Terminal IP</span></div>
              </div>
            </>
          )}
        </div>

        {/* Monthly summary */}
        <div className="att-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 className="att-card-h" style={{ marginBottom: 0 }}><CalendarDays size={16} color="#0284c7" /> Monthly Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => shiftMonth(-1)} className="att-mth-chip" style={{ cursor: 'pointer' }}>‹</button>
              <span className="att-mth-chip">{monthLabel}</span>
              <button onClick={() => shiftMonth(1)} className="att-mth-chip" style={{ cursor: 'pointer' }}>›</button>
            </div>
          </div>
          <div className="att-stat-row" style={{ marginTop: 10 }}>
            <div className="att-stat"><b>{monthly.work_days ?? 0}</b><span>Work Days</span></div>
            <div className="att-stat"><b style={{ color: '#059669' }}>{monthly.days_present ?? 0}</b><span>Present (P)</span></div>
            <div className="att-stat"><b style={{ color: '#dc2626' }}>{monthly.days_absent ?? 0}</b><span>Absent (A)</span></div>
            <div className="att-stat"><b style={{ color: '#0284c7' }}>{monthly.attendance_rate ?? 0}%</b><span>Rate</span></div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, fontSize: 12, color: '#475569' }}>
            <span><Fingerprint size={13} style={{ verticalAlign: '-2px' }} /> Ashara: {methods['Ashara'] || 0}</span>
            <span><CreditCard size={13} style={{ verticalAlign: '-2px' }} /> RFID: {methods['RFID Card'] || 0}</span>
            <span><ScanFace size={13} style={{ verticalAlign: '-2px' }} /> Face: {methods['Face Rec'] || 0}</span>
            <span><Timer size={13} style={{ verticalAlign: '-2px' }} /> Total: {monthly.total_hours ?? 0}h</span>
          </div>
        </div>
      </div>

      {/* Daily log */}
      <div className="att-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="att-card-h" style={{ marginBottom: 0 }}><TrendingUp size={16} color="#0284c7" /> Daily Log (last 40)</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldCheck size={14} color="#64748b" /> <span style={{ fontSize: 12, color: '#64748b' }}>Ashara · RFID Card · Facial Recognition</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="att-t">
            <thead>
              <tr>
                <th>Date</th><th>Day</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Auth Method</th><th>Terminal</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(d.log || []).map(r => (
                <tr key={r.record_id}>
                  <td>{fmtDate(r.attendance_date)}</td>
                  <td>{r.attendance_date ? dayName(r.attendance_date) : '—'}</td>
                  <td style={{ fontWeight: 600 }}>{to12(r.time_in)}</td>
                  <td>{to12(r.time_out)}</td>
                  <td>{r.net_work_hours}h</td>
                  <td><span className="att-method">{methodIcon(r.auth_label)}{r.auth_label}</span></td>
                  <td style={{ color: '#64748b' }}>{r.terminal_ip || '—'}</td>
                  <td>
                    <span className={`att-pill ${r.status === 'P' ? 'P' : 'A'}`} style={{ padding: '2px 10px', fontSize: 12, minWidth: 28, justifyContent: 'center' }}>
                      {r.status === 'P' ? 'P' : 'A'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!d.log || d.log.length === 0) && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No attendance records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}
function dayName(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { weekday: 'short' });
}
function methodIcon(label) {
  if (label === 'RFID Card') return <CreditCard size={12} />;
  if (label === 'Face Rec') return <ScanFace size={12} />;
  return <Fingerprint size={12} />;
}

export default AttendancePage;