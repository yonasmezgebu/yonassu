import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../../services/hrService.js';
import {
  Clock, Fingerprint, CreditCard, ScanFace, CheckCircle2, XCircle,
  CalendarDays, TrendingUp, Timer, ShieldCheck, ScanLine, Monitor,
  UserCheck, Zap, BadgeCheck
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
  .att-mth-chip { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; color: #334155; cursor: pointer; }
  .att-scan { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-bottom: 20px; }
  .att-scan-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .att-scan-btn { border: none; border-radius: 12px; padding: 14px 22px; font-weight: 800; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; color: #fff; background: linear-gradient(135deg, #0284c7, #0369a1); box-shadow: 0 2px 8px rgba(2,132,199,.3); transition: opacity .15s; }
  .att-scan-btn:disabled { opacity: .55; cursor: not-allowed; }
  .att-scan-m { border: 1px solid #cbd5e1; background: #fff; border-radius: 10px; padding: 9px 12px; font-size: 13px; font-weight: 600; }
  .att-scan-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px; font-weight: 600; }
  .att-scan-bad { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px; font-weight: 600; }

  /* Ashara How-It-Works Steps */
  .att-how { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  @media (max-width: 700px) { .att-how { grid-template-columns: 1fr; } .att-grid2 { grid-template-columns: 1fr; } }
  .att-step-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; }
  .att-step-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .att-step-card.step1::before { background: linear-gradient(90deg, #6366f1, #818cf8); }
  .att-step-card.step2::before { background: linear-gradient(90deg, #0284c7, #38bdf8); }
  .att-step-card.step3::before { background: linear-gradient(90deg, #059669, #34d399); }
  .att-step-num { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0; }
  .step1 .att-step-num { background: #eef2ff; color: #4f46e5; }
  .step2 .att-step-num { background: #e0f2fe; color: #0284c7; }
  .step3 .att-step-num { background: #d1fae5; color: #059669; }
  .att-step-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
  .step1 .att-step-icon { background: #eef2ff; }
  .step2 .att-step-icon { background: #e0f2fe; }
  .step3 .att-step-icon { background: #d1fae5; }
  .att-step-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; }
  .att-step-title { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; }
  .att-step-desc { font-size: 13px; color: #475569; line-height: 1.55; margin: 0; }
  .att-step-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .step1 .att-step-tag { background: #eef2ff; color: #4f46e5; }
  .step2 .att-step-tag { background: #e0f2fe; color: #0284c7; }
  .step3 .att-step-tag { background: #d1fae5; color: #059669; }
  .att-step-header { display: flex; align-items: center; gap: 12px; }
`;

export const AttendancePage = () => {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMethod, setScanMethod] = useState('ashara');
  const [scanMsg, setScanMsg] = useState(null);

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

  const doScan = async () => {
    setScanBusy(true); setScanMsg(null); setError('');
    try {
      const res = await hrService.etp.registerAttendanceScan({ auth_method: scanMethod });
      const sc = res.data?.data || {};
      setScanMsg({ ok: true, text: `${sc.message || 'Attendance recorded'} — Time in ${sc.time_in || '--:--'} · ${sc.auth_label || scanMethod} · Status P (Present)` });
      await load();
    } catch (e) {
      setScanMsg({ ok: false, text: e.response?.data?.message || e.message || 'Scan failed' });
    } finally {
      setScanBusy(false);
    }
  };

  if (loading) return <div className="att-wrap" style={{ paddingTop: 60, textAlign: 'center', color: '#64748b' }}>Loading attendance…</div>;

  const d = data || {};
  const monthly = d.monthly || {};
  const methods = monthly.method_counts || {};
  const monthLabel = monthly.month_label || `${monthLabelFor(month)} ${new Date().getFullYear()}`;
  function monthLabelFor(m) { return new Date(2000, m - 1, 1).toLocaleString('en-GB', { month: 'long' }); }

  const scanMethodIcon = () => {
    if (scanMethod === 'card') return <CreditCard size={16} />;
    if (scanMethod === 'face') return <ScanFace size={16} />;
    return <Fingerprint size={16} />;
  };

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
          <b>No HR attendance profile linked.</b> Contact HR to register your employee record — your attendance log will appear here automatically once linked.
        </div>
      )}

      {/* ── How the Ashara Attendance Process Works ─────────────── */}
      <div className="att-how">
        {/* Step 1 */}
        <div className="att-step-card step1">
          <div className="att-step-header">
            <div className="att-step-icon"><UserCheck size={22} color="#4f46e5" /></div>
            <div>
              <div className="att-step-label">Step 1 · One-Time</div>
              <p className="att-step-title">Registration &amp; Enrollment</p>
            </div>
            <div className="att-step-num" style={{ marginLeft: 'auto' }}>1</div>
          </div>
          <p className="att-step-desc">
            Your fingerprint is <b>registered once</b> by HR. It links your biometric print to your name, employee ID and department in the system. This happens only once during setup.
          </p>
          <span className="att-step-tag"><ShieldCheck size={11} /> Prerequisite · Done by HR</span>
        </div>

        {/* Step 2 */}
        <div className="att-step-card step2">
          <div className="att-step-header">
            <div className="att-step-icon"><Fingerprint size={22} color="#0284c7" /></div>
            <div>
              <div className="att-step-label">Step 2 · Every Working Day</div>
              <p className="att-step-title">Daily Scan — Check-In &amp; Out</p>
            </div>
            <div className="att-step-num" style={{ marginLeft: 'auto' }}>2</div>
          </div>
          <p className="att-step-desc">
            Press your <b>registered finger</b> on the optical sensor at an authorized IP terminal. The system matches your print against the database and <b>records your exact time</b> automatically.
          </p>
          <span className="att-step-tag"><Monitor size={11} /> Authorized Terminal Required</span>
        </div>

        {/* Step 3 */}
        <div className="att-step-card step3">
          <div className="att-step-header">
            <div className="att-step-icon"><Zap size={22} color="#059669" /></div>
            <div>
              <div className="att-step-label">Step 3 · Instant</div>
              <p className="att-step-title">Verification &amp; Confirmation</p>
            </div>
            <div className="att-step-num" style={{ marginLeft: 'auto' }}>3</div>
          </div>
          <p className="att-step-desc">
            A <b>green confirmation</b> appears on screen immediately. Your name, time-in, and attendance status (P — Present) are displayed. Your log updates automatically below.
          </p>
          <span className="att-step-tag"><BadgeCheck size={11} /> Instant Feedback · Auto-Logged</span>
        </div>
      </div>

      {/* Today + Monthly */}
      <div className="att-grid2">
        <div className="att-card">
          <h3 className="att-card-h"><Clock size={16} color="#0284c7" /> Today's Attendance</h3>
          {d.today ? (
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
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>No attendance record for today yet.</div>
          )}
        </div>

        {/* Monthly summary */}
        <div className="att-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 className="att-card-h" style={{ marginBottom: 0 }}><CalendarDays size={16} color="#0284c7" /> Monthly Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => shiftMonth(-1)} className="att-mth-chip">‹</button>
              <span className="att-mth-chip" style={{ cursor: 'default' }}>{monthLabel}</span>
              <button onClick={() => shiftMonth(1)} className="att-mth-chip">›</button>
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

      {/* Self-Service Clock-In (SRS 5 — Step 2/3 above) */}
      {d.linked !== false && (
        <div className="att-scan">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ScanLine size={16} color="#0284c7" />
            <h3 className="att-card-h" style={{ marginBottom: 0 }}>Self-Service Clock-In</h3>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 8 }}>
              <Monitor size={12} /> Terminal IP verified against HR-authorized computers
            </span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>
            Following <b>Step 2</b> of the Ashara process — select your biometric method and press <b>Scan &amp; Clock In</b>. The system records your time instantly.
          </p>
          <div className="att-scan-row">
            <select className="att-scan-m" value={scanMethod} onChange={e => setScanMethod(e.target.value)} disabled={scanBusy}>
              <option value="ashara">Ashara — Fingerprint</option>
              <option value="card">RFID Card</option>
              <option value="face">Facial Recognition</option>
            </select>
            <button className="att-scan-btn" onClick={doScan} disabled={scanBusy}>
              {scanMethodIcon()} {scanBusy ? 'Scanning…' : 'Scan & Clock In'}
            </button>
            {scanMsg && (
              <div className={scanMsg.ok ? 'att-scan-ok' : 'att-scan-bad'}>
                {scanMsg.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {scanMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

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