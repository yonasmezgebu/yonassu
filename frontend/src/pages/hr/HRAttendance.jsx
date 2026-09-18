import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../services/hrService.js';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';

const style = `
  .hat-wrap { max-width: 1280px; margin: 0 auto; padding: 28px 24px; font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; min-height: calc(100vh - 64px); }
  .hat-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .hat-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
  .hat-sub { color: #64748b; margin: 0; font-size: 14px; }
  .hat-tabs { display: inline-flex; background: #e2e8f0; border-radius: 12px; padding: 4px; gap: 4px; }
  .hat-tab { border: none; background: transparent; padding: 8px 20px; border-radius: 9px; font-weight: 700; font-size: 13px; cursor: pointer; color: #475569; display: inline-flex; align-items: center; gap: 7px; }
  .hat-tab.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .hat-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; }
  .hat-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
  .hat-nav { display: flex; align-items: center; gap: 6px; }
  .hat-nav-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 7px 10px; cursor: pointer; display: inline-flex; }
  .hat-nav-btn:hover { background: #f1f5f9; }
  .hat-nav-btn:disabled { opacity: .4; cursor: not-allowed; }
  .hat-date { font-weight: 800; font-size: 15px; min-width: 190px; text-align: center; }
  input[type=date].hat-input, select.hat-input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #fff; }
  .hat-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 14px; font-weight: 600; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .hat-btn:hover { background: #f1f5f9; }
  .hat-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
  .hat-stat { background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px 16px; }
  .hat-stat b { display: block; font-size: 24px; font-weight: 800; }
  .hat-stat span { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: .04em; }
  .hat-stat.green b { color: #059669; } .hat-stat.red b { color: #dc2626; } .hat-stat.blue b { color: #0284c7; } .hat-stat.amber b { color: #d97706; }
  table.hat-t { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.hat-t th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e2e8f0; }
  table.hat-t td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  table.hat-t tr:hover td { background: #fafcff; }
  .hat-pill { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 800; font-size: 12px; min-width: 30px; padding: 3px 8px; }
  .hat-pill.P { background: #ecfdf5; color: #059669; } .hat-pill.A { background: #fef2f2; color: #dc2626; }
  .hat-pill.Present { background: #ecfdf5; color: #059669; } .hat-pill.Absent { background: #fef2f2; color: #dc2626; }
  .hat-pill.Late { background: #fffbeb; color: #d97706; } .hat-pill.NR, .hat-pill['Not Recorded'] { background: #f1f5f9; color: #475569; }
  .hat-method { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; }
  .hat-rate { font-weight: 800; font-size: 13px; }
  .hat-empty { text-align: center; color: #94a3b8; padding: 26px 0; }
  .hat-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 13px; }
  .hat-ov { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.hat-ov .ov-card { background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px 16px; }
  .hat-ov b { display: block; font-size: 22px; font-weight: 800; } .hat-ov span { font-size: 11px; color:#64748b; text-transform: uppercase; font-weight: 700; }
  .hat-bar { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; margin-top: 8px; }
  .hat-bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
  .hat-me td { background: #eff6ff !important; }
  .hat-you { display: inline-flex; align-items: center; font-size: 10px; font-weight: 800; color: #1d4ed8; background: #dbeafe; padding: 1px 7px; border-radius: 999px; margin-left: 6px; letter-spacing: .03em; }
  .hat-filter-h { font-size: 11px; text-transform: uppercase; letter-spacing:.05em; color:#94a3b8; }
`;

function csv(data, headers, rows, filePrefix) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers, ...rows.map(r => headers.map((_, i) => esc(r[i])))];
  const blob = new Blob([lines.map(l => l.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filePrefix}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const to12 = (t) => {
  if (!t) return '--:--';
  const hh = parseInt(t.slice(0, 2), 10);
  const mm = t.slice(3, 5);
  const amp = hh >= 12 ? 'PM' : 'AM';
  return `${String(hh % 12 || 12).padStart(2, '0')}:${mm} ${amp}`;
};
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const HRAttendance = () => {
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depts, setDepts] = useState([]);

  // Daily state — SRS 4.1
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [daily, setDaily] = useState({ employees: [], summary: {}, date: '' });
  const [dept, setDept] = useState('');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  // Monthly state — SRS 4.2
  const [mDate, setMDate] = useState(() => new Date());
  const [monthly, setMonthly] = useState({ rows: [], overview: {} });
  const [mDept, setMDept] = useState('');
  const [mSearch, setMSearch] = useState('');

  const loadDepts = useCallback(async () => {
    try {
      const r = await hrService.etp.getDepartments();
      const body = r.data;
      const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
      setDepts(list);
    } catch (e) { setDepts([]); }
  }, []);

  const loadDaily = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await hrService.etp.getDailyAttendance({ date, dept_id: dept || undefined });
      const d = r.data?.data || {};
      setDaily({ employees: d.employees || [], summary: d.summary || {}, date: d.date || date });
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to load daily attendance'); }
    finally { setLoading(false); }
  }, [date, dept]);

  const loadMonthly = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await hrService.etp.getMonthlyAttendance({
        month: mDate.getMonth() + 1, year: mDate.getFullYear(), dept_id: mDept || undefined, search: mSearch || undefined
      });
      setMonthly({ rows: r.data?.data || [], overview: r.data?.overview || {} });
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to load monthly attendance'); }
    finally { setLoading(false); }
  }, [mDate, mDept, mSearch]);

  useEffect(() => { loadDepts(); }, [loadDepts]);
  useEffect(() => { if (tab === 'daily') loadDaily(); }, [tab, loadDaily]);
  useEffect(() => { if (tab === 'monthly') { const t = setTimeout(loadMonthly, 300); return () => clearTimeout(t); } }, [tab, loadMonthly]);

  const shiftDay = (n) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    setDate(toDateStr(d));
  };
  const shiftMonth = (n) => {
    const d = new Date(mDate); d.setMonth(d.getMonth() + n); setMDate(d);
  };

  const filtered = (daily.employees || []).filter(e => {
    if (status !== 'all' && e.status !== status) return false;
    if (method === 'ashara' && (e.auth_method || 'ashara') !== 'ashara') return false;
    if (method === 'card' && e.auth_method !== 'card') return false;
    if (method === 'face' && e.auth_method !== 'face') return false;
    if (method === 'card_face' && e.auth_method !== 'card' && e.auth_method !== 'face') return false;
    return true;
  });

  const s = daily.summary || {};

  const exportDaily = () => csv('', ['Employee ID', 'Name', 'Department', 'Time In', 'Auth Method', 'Status P/A'],
    filtered.map(e => [e.employee_id, e.full_name, e.dept_name, to12(e.time_in), e.auth_label, e.status]),
    `attendance-daily-${date}`);

  const mRows = monthly.rows || [];
  const exportMonthly = () => csv('', ['Employee ID', 'Employee Name', 'Department', 'Work Days', 'Present (P)', 'Absent (A)', 'Rate %'],
    mRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_working_days, e.days_present, e.days_absent, e.attendance_rate]),
    `attendance-monthly-${mDate.getFullYear()}-${mDate.getMonth() + 1}`);

  return (
    <div className="hat-wrap">
      <style>{style}</style>

      <div className="hat-head">
        <div>
          <h1 className="hat-title">Attendance</h1>
          <p className="hat-sub">Biometric &amp; Card-Based Attendance — <b>Ashara</b> (fingerprint), <b>RFID Card</b>, <b>Face Rec</b></p>
        </div>
        <div className="hat-tabs">
          <button className={`hat-tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}><CalendarDays size={15} /> Daily</button>
          <button className={`hat-tab ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}><CalendarRange size={15} /> Monthly</button>
        </div>
      </div>

      {error && <div className="hat-err">{error}</div>}

      {tab === 'daily' ? (
        <div className="hat-panel">
          {/* SRS 4.1 Header & Controls */}
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftDay(-1)} title="Previous day"><ChevronLeft size={16} /></button>
              <input type="date" className="hat-input" value={date} onChange={e => setDate(e.target.value)} />
              <button className="hat-nav-btn" onClick={() => shiftDay(1)} title="Next day"><ChevronRight size={16} /></button>
            </div>
            <div>
              <div className="hat-filter-h">Department</div>
              <select className="hat-input" value={dept} onChange={e => setDept(e.target.value)}>
                <option value="">All</option>
                {depts.map(dp => <option key={dp.id ?? dp.dept_id} value={dp.id ?? dp.dept_id}>{dp.name || dp.dept_name}</option>)}
              </select>
            </div>
            <div>
              <div className="hat-filter-h">Auth Method</div>
              <select className="hat-input" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="all">All</option>
                <option value="ashara">Ashara</option>
                <option value="card">RFID Card</option>
                <option value="face">Face Rec</option>
                <option value="card_face">Card / Face</option>
              </select>
            </div>
            <div>
              <div className="hat-filter-h">Status</div>
              <select className="hat-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="P">P — Present</option>
                <option value="A">A — Absent</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="hat-btn" onClick={loadDaily}><RefreshCw size={14} /> Refresh</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportDaily}><Download size={14} /> Export CSV</button>
            </div>
          </div>

          {/* SRS 4.1 Quick Stats Bar */}
          <div className="hat-stats">
            <div className="hat-stat"><b>{s.total ?? 0}</b><span>Total Active</span></div>
            <div className="hat-stat green"><b>{s.present_pa ?? 0}</b><span>Present (P)</span></div>
            <div className="hat-stat red"><b>{s.absent_pa ?? 0}</b><span>Absent (A)</span></div>
            <div className="hat-stat blue"><b>{s.ashara_scans ?? 0}</b><span>Ashara Scans</span></div>
            <div className="hat-stat amber"><b>{s.card_face_scans ?? 0}</b><span>Face / Card Scans</span></div>
          </div>

          {/* SRS 4.1 Daily Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Time In</th><th>Auth Method</th><th>Status</th><th>Terminal IP</th><th>Hours</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="hat-empty">Loading attendance…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="hat-empty">No records for {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</td></tr>
                ) : filtered.map((e, i) => (
                  <tr key={e.employee_id || i} className={e.is_me ? 'hat-me' : ''}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{e.employee_id}</td>
                    <td style={{ fontWeight: 600 }}>{e.full_name}{e.is_me && <span className="hat-you">You</span>}</td>
                    <td>{e.dept_name || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{to12(e.time_in)}</td>
                    <td><span className="hat-method">{e.auth_label}</span></td>
                    <td><span className={`hat-pill ${e.status}`}>{e.status}</span></td>
                    <td style={{ color: '#64748b' }}>{e.terminal_ip || '—'}</td>
                    <td>{(parseFloat(e.net_work_hours) || 0).toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="hat-panel">
          {/* SRS 4.2 Header & Controls */}
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
              <span className="hat-date">{mDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
              <button className="hat-nav-btn" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
            </div>
            <div>
              <div className="hat-filter-h">Department</div>
              <select className="hat-input" value={mDept} onChange={e => setMDept(e.target.value)}>
                <option value="">All</option>
                {depts.map(dp => <option key={dp.id ?? dp.dept_id} value={dp.id ?? dp.dept_id}>{dp.name || dp.dept_name}</option>)}
              </select>
            </div>
            <div>
              <div className="hat-filter-h">Search Employee</div>
              <input className="hat-input" placeholder="Search employee…" value={mSearch} onChange={e => setMSearch(e.target.value)} />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="hat-btn" onClick={loadMonthly}><RefreshCw size={14} /> Refresh</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportMonthly}><Download size={14} /> Export CSV</button>
            </div>
          </div>

          {/* SRS 4.2 Monthly Overview Cards */}
          <div className="hat-ov">
            <div className="ov-card"><b>{monthly.overview.total_working_days ?? 0}</b><span>Total Working Days</span></div>
            <div className="ov-card">
              <b style={{ color: '#0284c7' }}>{(monthly.overview.avg_present_rate ?? 0).toFixed(1)}%</b><span>Avg. Present Rate</span>
              <div className="hat-bar"><div className="hat-bar-fill" style={{ width: `${Math.min(monthly.overview.avg_present_rate ?? 0, 100)}%`, background: '#0284c7' }} /></div>
            </div>
            <div className="ov-card"><b style={{ color: '#dc2626' }}>{monthly.overview.total_absences ?? 0}</b><span>Total Absences</span></div>
          </div>

          {/* SRS 4.2 Monthly Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr><th>Employee ID</th><th>Employee Name</th><th>Department</th><th>Work Days</th><th>Present (P)</th><th>Absent (A)</th><th>Attendance Rate</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="hat-empty">Loading monthly summary…</td></tr>
                ) : mRows.length === 0 ? (
                  <tr><td colSpan={7} className="hat-empty">No attendance data for {mDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.</td></tr>
                ) : mRows.map((e, i) => {
                  const rr = e.attendance_rate;
                  const barC = rr >= 90 ? '#059669' : rr >= 75 ? '#d97706' : rr > 0 ? '#dc2626' : '#cbd5e1';
                  return (
                    <tr key={e.employee_id || i} className={e.is_me ? 'hat-me' : ''}>
                      <td style={{ fontWeight: 700 }}>{e.employee_id}</td>
                      <td style={{ fontWeight: 600 }}>{e.full_name}{e.is_me && <span className="hat-you">You</span>}</td>
                      <td>{e.dept_name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{e.total_working_days}</td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{e.days_present}</td>
                      <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{e.days_absent}</td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="hat-rate" style={{ color: rr >= 90 ? '#059669' : rr >= 75 ? '#d97706' : rr > 0 ? '#dc2626' : '#94a3b8', width: 46 }}>
                            {rr ? `${rr}%` : '—'}
                          </span>
                          <div className="hat-bar" style={{ flex: 1, marginTop: 0 }}>
                            <div className="hat-bar-fill" style={{ width: `${Math.min(rr || 0, 100)}%`, background: barC }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAttendance;