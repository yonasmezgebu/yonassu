import React, { useState, useEffect, useCallback } from 'react';
import hrService from '../../services/hrService.js';
import {
  CalendarDays, CalendarRange, CalendarCheck, CalendarX, Monitor, ChevronLeft, ChevronRight,
  Download, FileText, RefreshCw, PlusCircle, UserPlus, Clock, UserCheck, UserX, Fingerprint
} from 'lucide-react';

const style = `
  .hat-wrap { max-width: 1280px; margin: 0 auto; padding: 28px 24px; font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; min-height: calc(100vh - 64px); }
  .hat-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .hat-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
  .hat-sub { color: #64748b; margin: 0; font-size: 14px; }
  .hat-tabs { display: inline-flex; background: #e2e8f0; border-radius: 12px; padding: 4px; gap: 4px; flex-wrap: wrap; }
  .hat-tab { border: none; background: transparent; padding: 8px 16px; border-radius: 9px; font-weight: 700; font-size: 12.5px; cursor: pointer; color: #475569; display: inline-flex; align-items: center; gap: 7px; }
  .hat-tab.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .hat-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; }
  .hat-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
  .hat-nav { display: flex; align-items: center; gap: 6px; }
  .hat-nav-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 7px 10px; cursor: pointer; display: inline-flex; }
  .hat-nav-btn:hover { background: #f1f5f9; }
  .hat-nav-btn:disabled { opacity: .4; cursor: not-allowed; }
  .hat-date { font-weight: 800; font-size: 15px; min-width: 220px; text-align: center; }
  input[type=date].hat-input, select.hat-input, input.hat-input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #fff; box-sizing: border-box; }
  .hat-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 14px; font-weight: 600; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .hat-btn:hover { background: #f1f5f9; }
  .hat-btn.primary { background: #0284c7; border-color: #0284c7; color: #fff; }
  .hat-btn.primary:hover { background: #0370a8; }
  .hat-btn.danger { color: #dc2626; }
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
  .hat-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 13px; }
  .hat-ov { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .hat-ov .ov-card { background: #fff; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px 16px; }
  .hat-ov b { display: block; font-size: 22px; font-weight: 800; } .hat-ov span { font-size: 11px; color:#64748b; text-transform: uppercase; font-weight: 700; }
  .hat-bar { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; margin-top: 8px; }
  .hat-bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
  .hat-me td { background: #eff6ff !important; }
  .hat-you { display: inline-flex; align-items: center; font-size: 10px; font-weight: 800; color: #1d4ed8; background: #dbeafe; padding: 1px 7px; border-radius: 999px; margin-left: 6px; letter-spacing: .03em; }
  .hat-filter-h { font-size: 11px; text-transform: uppercase; letter-spacing:.05em; color:#94a3b8; }
  .hat-auth { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; color: #475569; background: #f1f5f9; border-radius: 6px; padding: 2px 6px; margin: 1px; }
  .hat-yrgrid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; min-width: 220px; }
  .hat-ym { height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; }
  .hat-ip-badge { display: inline-flex; align-items: center; gap: 5px; font-weight: 800; font-size: 12px; padding: 3px 10px; border-radius: 999px; }
  .hat-ip-badge.on { background: #ecfdf5; color: #059669; } .hat-ip-badge.off { background: #f1f5f9; color: #64748b; }
  .hat-status-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
  .hat-status-dot.on { background: #22c55e; } .hat-status-dot.off { background: #94a3b8; }
  .hat-ip-form { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; background: #fbfdff; }
  .hat-step { font-size: 12.5px; color: #475569; line-height: 1.6; margin: 10px 0 0; }
  .hat-step b { color: #0f172a; }
  .hat-reg { display: grid; grid-template-columns: 420px 1fr; gap: 18px; align-items: start; }
  .hat-reg-form { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; background: #fbfdff; }
  .hat-field { margin-bottom: 12px; }
  .hat-field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; font-weight: 700; margin-bottom: 4px; }
  .hat-field input, .hat-field select { width: 100%; }
  .hat-reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hat-cands { max-height: 460px; overflow-y: auto; border: 1px solid #eef2f7; border-radius: 12px; }
  .hat-cand { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
  .hat-cand:hover { background: #f8fafc; }
  .hat-cand.active { background: #eff6ff; }
  .hat-cand b { font-size: 13px; display: block; }
  .hat-cand span { font-size: 11.5px; color: #64748b; }
  @media (max-width: 980px) { .hat-reg { grid-template-columns: 1fr; } }
`;

// ── Export helpers ─────────────────────────────────────────────
function csv(headers, rows, filePrefix) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers, ...rows.map(r => headers.map((_, i) => esc(r[i])))];
  const blob = new Blob([lines.map(l => l.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filePrefix}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function printPdf(title, subtitle, headers, rows) {
  const w = window.open('', '_blank');
  if (!w) return alert('Please allow pop-ups to export PDF');
  w.document.write(`<html><head><title>${title}</title><style>
    *{box-sizing:border-box;font-family:Inter,Arial,sans-serif}
    body{padding:32px;color:#0f172a}
    h1{margin:0;font-size:22px}
    .sub{color:#64748b;margin:6px 0 24px;font-size:13px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f1f5f9;text-align:left;padding:8px 10px;text-transform:uppercase;font-size:10px;letter-spacing:.04em;border-bottom:2px solid #cbd5e1}
    td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
    tr:nth-child(even) td{background:#fcfcfd}
    @media print{body{padding:12mm}}
  </style></head><body>
    <h1>${title}</h1><div class="sub">${subtitle}</div>
    <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 350);
}
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const to12 = (t) => {
  if (!t) return '--:--';
  const hh = parseInt(t.slice(0, 2), 10);
  const mm = t.slice(3, 5);
  const amp = hh >= 12 ? 'PM' : 'AM';
  return `${String(hh % 12 || 12).padStart(2, '0')}:${mm} ${amp}`;
};
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function isoWeekInfo(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - dayNr + 3);
  const year = t.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.floor((t - jan1) / 86400000 / 7) + 1;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dn = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dn);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { week, year, monday, sunday };
}

const HRAttendance = () => {
  const [tab, setTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [depts, setDepts] = useState([]);

  // Daily state — SRS 4.1
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [daily, setDaily] = useState({ employees: [], summary: {}, date: '' });
  const [dept, setDept] = useState('');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  // Weekly state — SRS 1.3 / 3
  const [wk, setWk] = useState(() => ({ ...isoWeekInfo(new Date()) }));
  const [weekly, setWeekly] = useState({ rows: [], overview: {} });

  // Monthly state — SRS 4.2
  const [mDate, setMDate] = useState(() => new Date());
  const [monthly, setMonthly] = useState({ rows: [], overview: {} });
  const [mDept, setMDept] = useState('');
  const [mSearch, setMSearch] = useState('');

  // Yearly state — SRS 1.3 / 3 (yearly aggregation)
  const [yr, setYr] = useState(() => new Date().getFullYear());
  const [yearly, setYearly] = useState({ rows: [], overview: {} });
  const [yDept, setYDept] = useState('');
  const [ySearch, setYSearch] = useState('');

  // IP Terminals state — SRS 5.1 / 6.1
  const [comps, setComps] = useState([]);
  const [compName, setCompName] = useState('');
  const [compIp, setCompIp] = useState('');
  const [compLoc, setCompLoc] = useState('');
  const [ipBusy, setIpBusy] = useState(false);

  // Biometrics
  const [bioEmps, setBioEmps] = useState([]);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioInput, setBioInput] = useState({});

  // Registration state — SRS Step 1 (one-time employee registration, setup phase)
  const [positions, setPositions] = useState([]);
  const [regCands, setRegCands] = useState([]);
  const [allEmps, setAllEmps] = useState([]);       // all active HR employees for dropdown
  const [regLoading, setRegLoading] = useState(false);
  const [regBusy, setRegBusy] = useState(false);
  const [regMode, setRegMode] = useState('user'); // 'user' = from system user | 'manual' = brand new
  const EMPTY_REG = {
    user_id: '', full_name: '', email: '', personal_phone: '', personal_email: '',
    national_id: '', date_of_birth: '', gender: 'Male', marital_status: 'Single',
    physical_address: '', dept_id: '', position_id: '',
    hire_date: '', employment_type: 'Permanent',
    base_salary: '', housing_allowance: '', transport_allowance: '',
    payment_method: 'Bank Transfer', bank_name: '', bank_account_number: '',
    shift_start_time: '09:00', shift_end_time: '18:00', has_pc_access: 'Yes',
    emergency_contact_name: '', emergency_contact_phone: '',
    education_level: '', institution_name: '', field_of_study: '', graduation_year: '',
  };
  const [regForm, setRegForm] = useState(EMPTY_REG);

  const loadDepts = useCallback(async () => {
    try {
      const r = await hrService.etp.getDepartments();
      const body = r.data;
      setDepts(Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []));
    } catch (e) { setDepts([]); }
  }, []);

  const loadPositions = useCallback(async () => {
    try {
      const r = await hrService.etp.getPositions();
      const body = r.data;
      setPositions(Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []));
    } catch (e) { setPositions([]); }
  }, []);

  const loadRegCands = useCallback(async () => {
    setRegLoading(true);
    try {
      // Unregistered system users (for Link-System-User mode)
      const r = await hrService.etp.getAttendanceRegistrationCandidates();
      setRegCands(Array.isArray(r.data?.data) ? r.data.data : []);
      // All active HR employees (for dropdown autofill)
      const r2 = await hrService.etp.listEmployees({ status: 'Active' });
      setAllEmps(Array.isArray(r2.data?.data) ? r2.data.data : []);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to load registration data'); }
    finally { setRegLoading(false); }
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

  const loadWeekly = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await hrService.etp.getWeeklySummary({ week: wk.week, year: wk.year });
      setWeekly({ rows: r.data?.data || [], overview: r.data?.overview || {} });
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to load weekly summary'); }
    finally { setLoading(false); }
  }, [wk.week, wk.year]);

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

  const loadYearly = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await hrService.etp.getYearlyAttendance({ year: yr, dept_id: yDept || undefined, search: ySearch || undefined });
      setYearly({ rows: r.data?.data || [], overview: r.data?.overview || {} });
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to load yearly attendance'); }
    finally { setLoading(false); }
  }, [yr, yDept, ySearch]);

  const loadComps = useCallback(async () => {
    try {
      const r = await hrService.etp.getAllowedComputers();
      setComps(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (e) { setComps([]); }
  }, []);

  const loadBioEmps = useCallback(async () => {
    setBioLoading(true);
    try {
      const res = await hrService.etp.listEmployees({});
      const emps = Array.isArray(res.data?.data) ? res.data.data : [];
      setBioEmps(emps);
      const bMap = {};
      emps.forEach(e => {
        bMap[e.employee_id] = e.fingerprint_id || '';
      });
      setBioInput(bMap);
    } catch (err) {
      setError('Failed to load employees for biometrics');
    } finally {
      setBioLoading(false);
    }
  }, []);

  useEffect(() => { loadDepts(); loadPositions(); loadComps(); }, [loadDepts, loadPositions, loadComps]);
  useEffect(() => { if (tab === 'daily') loadDaily(); }, [tab, loadDaily]);
  useEffect(() => { if (tab === 'weekly') loadWeekly(); }, [tab, loadWeekly]);
  useEffect(() => { if (tab === 'monthly') { const t = setTimeout(loadMonthly, 300); return () => clearTimeout(t); } }, [tab, loadMonthly]);
  useEffect(() => { if (tab === 'yearly') { const t = setTimeout(loadYearly, 300); return () => clearTimeout(t); } }, [tab, loadYearly]);
  useEffect(() => { if (tab === 'ip') loadComps(); }, [tab, loadComps]);
  useEffect(() => { if (tab === 'biometrics') loadBioEmps(); }, [tab, loadBioEmps]);
  useEffect(() => { if (tab === 'registration') loadRegCands(); }, [tab, loadRegCands]);

  const shiftDay = (n) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + n); setDate(toDateStr(d)); };
  const shiftWeek = (n) => {
    const d = new Date(wk.monday.getFullYear(), wk.monday.getMonth(), wk.monday.getDate() + 7 * n);
    setWk(isoWeekInfo(d));
  };
  const shiftMonth = (n) => { const d = new Date(mDate); d.setMonth(d.getMonth() + n); setMDate(d); };
  const shiftYear = (n) => setYr(y => y + n);
  useEffect(() => {
    const w = isoWeekInfo(new Date(wk.monday.getFullYear(), wk.monday.getMonth(), wk.monday.getDate() + 3));
    setWk(prev => prev.week !== w.week ? { ...prev, week: w.week, year: w.year } : prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wk.monday]);

  const filtered = (daily.employees || []).filter(e => {
    if (status !== 'all' && e.status !== status) return false;
    if (method === 'ashara' && (e.auth_method || 'ashara') !== 'ashara') return false;
    if (method === 'card' && e.auth_method !== 'card') return false;
    if (method === 'face' && e.auth_method !== 'face') return false;
    if (method === 'card_face' && e.auth_method !== 'card' && e.auth_method !== 'face') return false;
    return true;
  });

  // Called when user picks from the "Link System User" candidates list (unregistered users)
  const pickRegCandidate = (u) => {
    setRegForm({
      ...EMPTY_REG,
      user_id: u.id, full_name: u.full_name || '', email: u.email || '',
      personal_email: u.email || '', personal_phone: u.phone || '',
      hire_date: toDateStr(new Date()),
    });
  };

  // Called when HR selects an existing active employee from the dropdown — autofills all fields
  const pickEmpFromDropdown = (empId) => {
    if (!empId) { clearRegForm(); return; }
    const emp = allEmps.find(e => String(e.employee_id) === String(empId));
    if (!emp) return;
    setRegForm({
      user_id: emp.user_id || '',
      full_name: emp.full_name || '',
      email: emp.personal_email || '',
      personal_email: emp.personal_email || '',
      personal_phone: emp.personal_phone || '',
      national_id: emp.national_id || '',
      date_of_birth: emp.date_of_birth ? emp.date_of_birth.slice(0, 10) : '',
      gender: emp.gender || 'Male',
      marital_status: emp.marital_status || 'Single',
      physical_address: emp.physical_address || '',
      dept_id: emp.dept_id ? String(emp.dept_id) : '',
      position_id: emp.position_id ? String(emp.position_id) : '',
      hire_date: emp.hire_date ? emp.hire_date.slice(0, 10) : toDateStr(new Date()),
      employment_type: emp.employment_type || 'Permanent',
      base_salary: emp.base_salary || '',
      housing_allowance: emp.housing_allowance || '',
      transport_allowance: emp.transport_allowance || '',
      payment_method: emp.payment_method || 'Bank Transfer',
      bank_name: emp.bank_name || '',
      bank_account_number: emp.bank_account_number || '',
      shift_start_time: emp.shift_start_time || '09:00',
      shift_end_time: emp.shift_end_time || '18:00',
      has_pc_access: emp.has_pc_access || 'Yes',
      emergency_contact_name: emp.emergency_contact_name || '',
      emergency_contact_phone: emp.emergency_contact_phone || '',
      education_level: emp.education_level || '',
      institution_name: emp.institution_name || '',
      field_of_study: emp.field_of_study || '',
      graduation_year: emp.graduation_year || '',
    });
  };

  const clearRegForm = () => setRegForm(EMPTY_REG);

  const submitReg = async () => {
    if (regMode === 'user' && !regForm.user_id) return setError('Please pick a system user from the list.');
    if (!regForm.full_name.trim()) return setError('Full name is required.');
    if (!regForm.hire_date) return setError('Hire date is required.');

    setRegBusy(true); setError(''); setOkMsg('');
    try {
      let r;
      if (regMode === 'user') {
        // Link-from-system-user path
        r = await hrService.etp.registerAttendanceEmployee({
          user_id: regForm.user_id,
          full_name: regForm.full_name,
          personal_phone: regForm.personal_phone,
          national_id: regForm.national_id || undefined,
          date_of_birth: regForm.date_of_birth || undefined,
          gender: regForm.gender || undefined,
          marital_status: regForm.marital_status || undefined,
          physical_address: regForm.physical_address || undefined,
          dept_id: regForm.dept_id || undefined,
          position_id: regForm.position_id || undefined,
          hire_date: regForm.hire_date,
          employment_type: regForm.employment_type,
          shift_start_time: regForm.shift_start_time,
          shift_end_time: regForm.shift_end_time,
          has_pc_access: regForm.has_pc_access,
          base_salary: regForm.base_salary || undefined,
          housing_allowance: regForm.housing_allowance || undefined,
          transport_allowance: regForm.transport_allowance || undefined,
          payment_method: regForm.payment_method || undefined,
          bank_name: regForm.bank_name || undefined,
          bank_account_number: regForm.bank_account_number || undefined,
          emergency_contact_name: regForm.emergency_contact_name || undefined,
          emergency_contact_phone: regForm.emergency_contact_phone || undefined,
          education_level: regForm.education_level || undefined,
          institution_name: regForm.institution_name || undefined,
          field_of_study: regForm.field_of_study || undefined,
          graduation_year: regForm.graduation_year || undefined,
        });
      } else {
        // Full manual registration path (no system user)
        r = await hrService.etp.createEmployee({
          full_name: regForm.full_name,
          national_id: regForm.national_id || undefined,
          date_of_birth: regForm.date_of_birth || undefined,
          gender: regForm.gender || undefined,
          marital_status: regForm.marital_status || undefined,
          personal_phone: regForm.personal_phone || undefined,
          personal_email: regForm.personal_email || undefined,
          physical_address: regForm.physical_address || undefined,
          dept_id: regForm.dept_id || undefined,
          position_id: regForm.position_id || undefined,
          hire_date: regForm.hire_date,
          employment_type: regForm.employment_type,
          base_salary: regForm.base_salary || 0,
          housing_allowance: regForm.housing_allowance || 0,
          transport_allowance: regForm.transport_allowance || 0,
          payment_method: regForm.payment_method || undefined,
          bank_name: regForm.bank_name || undefined,
          bank_account_number: regForm.bank_account_number || undefined,
          has_pc_access: regForm.has_pc_access,
          shift_start_time: regForm.shift_start_time,
          shift_end_time: regForm.shift_end_time,
          emergency_contact_name: regForm.emergency_contact_name || undefined,
          emergency_contact_phone: regForm.emergency_contact_phone || undefined,
          education_level: regForm.education_level || undefined,
          institution_name: regForm.institution_name || undefined,
          field_of_study: regForm.field_of_study || undefined,
          graduation_year: regForm.graduation_year || undefined,
        });
      }
      setOkMsg(r.data?.message || `${regForm.full_name} registered successfully.`);
      setRegForm(EMPTY_REG);
      await loadRegCands();
      loadDaily();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to register employee'); }
    finally { setRegBusy(false); }
  };

  const s = daily.summary || {};
  const mRows = monthly.rows || [];
  const wRows = weekly.rows || [];
  const yRows = yearly.rows || [];

  const deptOpts = (val, setVal) => (
    <select className="hat-input" value={val} onChange={e => setVal(e.target.value)}>
      <option value="">All</option>
      {depts.map(dp => <option key={dp.id ?? dp.dept_id} value={dp.id ?? dp.dept_id}>{dp.name || dp.dept_name}</option>)}
    </select>
  );

  const exportDaily = () => csv(['Employee ID', 'Name', 'Department', 'Time In', 'Auth Method', 'Status P/A'],
    filtered.map(e => [e.employee_id, e.full_name, e.dept_name, to12(e.time_in), e.auth_label, e.status]),
    `attendance-daily-${date}`);
  const pdfDaily = () => printPdf(`Daily Attendance — ${new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total ${s.total ?? 0} · Present (P) ${s.present_pa ?? 0} · Absent (A) ${s.absent_pa ?? 0}`,
    ['Employee ID', 'Name', 'Department', 'Time In', 'Auth Method', 'Status'],
    filtered.map(e => [e.employee_id, e.full_name, e.dept_name, to12(e.time_in), e.auth_label, e.status]));

  const exportWeekly = () => csv(['Employee ID', 'Name', 'Department', 'Work Days', 'Present (P)', 'Absent (A)', 'Rate %'],
    wRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_working_days, e.total_p, e.total_a, e.attendance_rate]),
    `attendance-week-${weekly.overview.week || wk.week}-${yearful(wk)}`);
  const pdfWeekly = () => printPdf(`Weekly Attendance — ${weekly.overview.week_label || `Week ${wk.week}`}`,
    `${weekly.overview.total_employees ?? 0} employees · Total records ${weekly.overview.total_records ?? 0}`,
    ['Employee ID', 'Name', 'Department', 'Work Days', 'Present (P)', 'Absent (A)', 'Rate %'],
    wRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_working_days, e.total_p, e.total_a, `${e.attendance_rate}%`]));

  const exportMonthly = () => csv(['Employee ID', 'Employee Name', 'Department', 'Work Days', 'Present (P)', 'Absent (A)', 'Rate %'],
    mRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_working_days, e.days_present, e.days_absent, e.attendance_rate]),
    `attendance-monthly-${mDate.getFullYear()}-${mDate.getMonth() + 1}`);
  const pdfMonthly = () => printPdf(`Monthly Attendance Summary — ${mDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    `Total Working Days ${monthly.overview.total_working_days ?? 0} · Avg. Present Rate ${(monthly.overview.avg_present_rate ?? 0).toFixed(1)}% · Total Absences ${monthly.overview.total_absences ?? 0}`,
    ['Employee ID', 'Employee Name', 'Department', 'Work Days', 'Present (P)', 'Absent (A)', 'Rate %'],
    mRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_working_days, e.days_present, e.days_absent, `${e.attendance_rate}%`]));

  const exportYearly = () => csv(['Employee ID', 'Name', 'Department', 'Days Present', 'Days Absent', 'Annual Rate %'],
    yRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_days_present, e.total_days_absent, e.annual_attendance_rate]),
    `attendance-yearly-${yr}`);
  const pdfYearly = () => printPdf(`Yearly Attendance — ${yr}`,
    `${yearly.overview.total_employees ?? 0} employees · Avg. Annual Rate ${(yearly.overview.avg_annual_rate ?? 0).toFixed(1)}%`,
    ['Employee ID', 'Name', 'Department', 'Days Present', 'Days Absent', 'Annual Rate %'],
    yRows.map(e => [e.employee_id, e.full_name, e.dept_name, e.total_days_present, e.total_days_absent, `${e.annual_attendance_rate}%`]));

  function yearful(wi) { return wi.year; }

  const addComputer = async (e) => {
    e.preventDefault();
    if (!compName.trim() || !compIp.trim()) return;
    setIpBusy(true); setError(''); setOkMsg('');
    try {
      const r = await hrService.etp.registerAllowedComputer({ computer_name: compName.trim(), ip_address: compIp.trim(), location: compLoc.trim() || undefined });
      setOkMsg(`Authorized computer ${compName.trim()} (${compIp.trim()}) enabled.`);
      setCompName(''); setCompIp(''); setCompLoc('');
      await loadComps();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to register computer'); }
    finally { setIpBusy(false); }
  };

  const toggleComp = async (c) => {
    setError(''); setOkMsg('');
    try {
      await hrService.etp.toggleAllowedComputer(c.computer_id);
      setOkMsg(`${c.computer_name} is now ${c.status === 'Active' ? 'Inactive' : 'Active'}.`);
      await loadComps();
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to toggle computer'); }
  };

  const handleEnrollBio = async (employee_id) => {
    const fingerprint_id = bioInput[employee_id];
    if (!fingerprint_id) return setError('Please enter a fingerprint ID');
    setError(''); setOkMsg('');
    try {
      const res = await hrService.etp.enrollFingerprint({ employee_id, fingerprint_id });
      setOkMsg(res.data?.message || 'Fingerprint enrolled successfully.');
      await loadBioEmps();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to enroll fingerprint');
    }
  };

  return (
    <div className="hat-wrap">
      <style>{style}</style>

      <div className="hat-head">
        <div>
          <h1 className="hat-title">Attendance</h1>
          <p className="hat-sub">Biometric &amp; Card-Based Attendance — <b>Ashara</b> (fingerprint), <b>RFID Card</b>, <b>Face Rec</b> · IP-verified terminals</p>
        </div>
        <div className="hat-tabs">
          <button className={`hat-tab ${tab === 'registration' ? 'active' : ''}`} onClick={() => setTab('registration')}><UserPlus size={15} /> Registration</button>
          <button className={`hat-tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}><CalendarDays size={15} /> Daily</button>
          <button className={`hat-tab ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}><CalendarCheck size={15} /> Weekly</button>
          <button className={`hat-tab ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}><CalendarRange size={15} /> Monthly</button>
          <button className={`hat-tab ${tab === 'yearly' ? 'active' : ''}`} onClick={() => setTab('yearly')}><CalendarX size={15} /> Yearly</button>
          <button className={`hat-tab ${tab === 'ip' ? 'active' : ''}`} onClick={() => setTab('ip')}><Monitor size={15} /> IP Terminals</button>
          <button className={`hat-tab ${tab === 'biometrics' ? 'active' : ''}`} onClick={() => setTab('biometrics')}><Fingerprint size={15} /> Biometrics</button>
        </div>
      </div>

      {error && <div className="hat-err">{error}</div>}
      {okMsg && <div className="hat-ok">{okMsg}</div>}

      {/* ── REGISTRATION (SRS Step 1 — one-time employee registration, setup phase) ── */}
      {tab === 'registration' && (
        <div className="hat-panel">
          <p className="hat-step"><b>Step 1 — One-Time Employee Registration (Setup Phase).</b>
            Select a system user below (their data is taken from the users/attendance side) and fill the
            remaining employee profile <b>manually</b>. The employee is registered <b>once</b>, becomes
            <b> Active</b>, appears instantly in Daily / Weekly / Monthly attendance, and can self clock-in.</p>

          <div className="hat-reg">
            {/* LEFT PANEL — Employee Selector Dropdown */}
            <div>
              <div className="hat-filter-h" style={{ marginBottom: 8 }}>
                <UserCheck size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Select Employee to Link / Register
              </div>

              {/* Dropdown — all active HR employees */}
              <div className="hat-field">
                <label>Active Employees</label>
                <select
                  className="hat-input"
                  style={{ width: '100%', fontWeight: 600 }}
                  value={regForm.user_id || ''}
                  onChange={e => {
                    // Find in allEmps first (full profile autofill)
                    const empId = e.target.selectedOptions[0]?.dataset?.empid;
                    if (empId) { pickEmpFromDropdown(empId); return; }
                    // Else it's an unregistered system user candidate
                    const candId = e.target.value;
                    if (!candId) { clearRegForm(); return; }
                    const cand = regCands.find(u => String(u.id) === String(candId));
                    if (cand) pickRegCandidate(cand);
                  }}
                >
                  <option value="">— Select an employee —</option>
                  {allEmps.length > 0 && (
                    <optgroup label={`✓ Registered Employees (${allEmps.length})`}>
                      {allEmps.map(emp => (
                        <option
                          key={emp.employee_id}
                          value={emp.user_id || emp.employee_id}
                          data-empid={emp.employee_id}
                        >
                          {emp.full_name} — {emp.employee_id} {emp.dept_name ? `(${emp.dept_name})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {regCands.length > 0 && (
                    <optgroup label={`⚠ Not Yet Registered (${regCands.length})`}>
                      {regCands.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email} — {u.roles || 'System User'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {regLoading && <div className="hat-empty" style={{ padding: '10px 0' }}>Loading employees…</div>}

              {/* Selected employee preview card */}
              {regForm.full_name && (
                <div style={{
                  marginTop: 12, padding: '12px 14px', background: '#eff6ff',
                  border: '1px solid #bfdbfe', borderRadius: 10
                }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1d4ed8' }}>{regForm.full_name}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{regForm.personal_email || regForm.email}</div>
                  {regForm.dept_id && (
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      Dept ID: {regForm.dept_id} &nbsp;·&nbsp; {regForm.employment_type}
                    </div>
                  )}
                  <button className="hat-btn" style={{ marginTop: 8, fontSize: 12 }} onClick={clearRegForm}>
                    ✕ Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANEL — Full Registration Form */}
            <div className="hat-reg-form">
              <div className="hat-filter-h" style={{ marginBottom: 12 }}>
                <UserPlus size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Employee Registration Form — Auto-filled from selection above
              </div>

              {/* ── PERSONAL INFO ── */}
              <div style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Personal Information</div>
              <div className="hat-field">
                <label>Full Name *</label>
                <input className="hat-input" value={regForm.full_name} onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Login / Personal Email</label>
                  <input className="hat-input" value={regForm.personal_email || regForm.email} onChange={e => setRegForm(f => ({ ...f, personal_email: e.target.value, email: e.target.value }))} placeholder="Email address" />
                </div>
                <div className="hat-field">
                  <label>Phone</label>
                  <input className="hat-input" value={regForm.personal_phone} onChange={e => setRegForm(f => ({ ...f, personal_phone: e.target.value }))} placeholder="+251..." />
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Gender</label>
                  <select className="hat-input" value={regForm.gender} onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="hat-field">
                  <label>Marital Status</label>
                  <select className="hat-input" value={regForm.marital_status} onChange={e => setRegForm(f => ({ ...f, marital_status: e.target.value }))}>
                    <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                  </select>
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Date of Birth</label>
                  <input type="date" className="hat-input" value={regForm.date_of_birth} onChange={e => setRegForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div className="hat-field">
                  <label>National ID</label>
                  <input className="hat-input" value={regForm.national_id} onChange={e => setRegForm(f => ({ ...f, national_id: e.target.value }))} placeholder="ID number" />
                </div>
              </div>
              <div className="hat-field">
                <label>Physical Address</label>
                <input className="hat-input" value={regForm.physical_address} onChange={e => setRegForm(f => ({ ...f, physical_address: e.target.value }))} placeholder="Home address" />
              </div>

              {/* ── JOB INFO ── */}
              <div style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px' }}>Job Information</div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Department</label>
                  <select className="hat-input" value={regForm.dept_id} onChange={e => setRegForm(f => ({ ...f, dept_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {depts.map(dp => <option key={dp.id ?? dp.dept_id} value={dp.id ?? dp.dept_id}>{dp.name || dp.dept_name}</option>)}
                  </select>
                </div>
                <div className="hat-field">
                  <label>Position</label>
                  <select className="hat-input" value={regForm.position_id} onChange={e => setRegForm(f => ({ ...f, position_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_title}</option>)}
                  </select>
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Hire Date *</label>
                  <input type="date" className="hat-input" value={regForm.hire_date} onChange={e => setRegForm(f => ({ ...f, hire_date: e.target.value }))} />
                </div>
                <div className="hat-field">
                  <label>Employment Type</label>
                  <select className="hat-input" value={regForm.employment_type} onChange={e => setRegForm(f => ({ ...f, employment_type: e.target.value }))}>
                    <option>Permanent</option><option>Contract</option><option>Probation</option><option>Part-time</option><option>Temporary</option>
                  </select>
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label><Clock size={12} style={{ verticalAlign: -2, marginRight: 3 }} />Shift Start</label>
                  <input type="time" className="hat-input" value={regForm.shift_start_time} onChange={e => setRegForm(f => ({ ...f, shift_start_time: e.target.value }))} />
                </div>
                <div className="hat-field">
                  <label><Clock size={12} style={{ verticalAlign: -2, marginRight: 3 }} />Shift End</label>
                  <input type="time" className="hat-input" value={regForm.shift_end_time} onChange={e => setRegForm(f => ({ ...f, shift_end_time: e.target.value }))} />
                </div>
              </div>
              <div className="hat-field">
                <label>PC / System Access</label>
                <select className="hat-input" value={regForm.has_pc_access} onChange={e => setRegForm(f => ({ ...f, has_pc_access: e.target.value }))}>
                  <option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>

              {/* ── SALARY ── */}
              <div style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px' }}>Salary & Allowances</div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Base Salary</label>
                  <input type="number" className="hat-input" min="0" value={regForm.base_salary} onChange={e => setRegForm(f => ({ ...f, base_salary: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="hat-field">
                  <label>Housing Allowance</label>
                  <input type="number" className="hat-input" min="0" value={regForm.housing_allowance} onChange={e => setRegForm(f => ({ ...f, housing_allowance: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Transport Allowance</label>
                  <input type="number" className="hat-input" min="0" value={regForm.transport_allowance} onChange={e => setRegForm(f => ({ ...f, transport_allowance: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="hat-field">
                  <label>Payment Method</label>
                  <select className="hat-input" value={regForm.payment_method} onChange={e => setRegForm(f => ({ ...f, payment_method: e.target.value }))}>
                    <option>Bank Transfer</option><option>Cash</option><option>Mobile Money</option>
                  </select>
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Bank Name</label>
                  <input className="hat-input" value={regForm.bank_name} onChange={e => setRegForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. CBE" />
                </div>
                <div className="hat-field">
                  <label>Bank Account Number</label>
                  <input className="hat-input" value={regForm.bank_account_number} onChange={e => setRegForm(f => ({ ...f, bank_account_number: e.target.value }))} placeholder="Account no." />
                </div>
              </div>

              {/* ── EMERGENCY CONTACT ── */}
              <div style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px' }}>Emergency Contact</div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Contact Name</label>
                  <input className="hat-input" value={regForm.emergency_contact_name} onChange={e => setRegForm(f => ({ ...f, emergency_contact_name: e.target.value }))} placeholder="Name" />
                </div>
                <div className="hat-field">
                  <label>Contact Phone</label>
                  <input className="hat-input" value={regForm.emergency_contact_phone} onChange={e => setRegForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} placeholder="+251..." />
                </div>
              </div>

              {/* ── EDUCATION ── */}
              <div style={{ fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px' }}>Education</div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Education Level</label>
                  <select className="hat-input" value={regForm.education_level} onChange={e => setRegForm(f => ({ ...f, education_level: e.target.value }))}>
                    <option value="">— Select —</option>
                    <option>Primary</option><option>Secondary</option><option>Diploma</option><option>Bachelor</option><option>Masters</option><option>PhD</option>
                  </select>
                </div>
                <div className="hat-field">
                  <label>Field of Study</label>
                  <input className="hat-input" value={regForm.field_of_study} onChange={e => setRegForm(f => ({ ...f, field_of_study: e.target.value }))} placeholder="e.g. Accounting" />
                </div>
              </div>
              <div className="hat-reg-row">
                <div className="hat-field">
                  <label>Institution Name</label>
                  <input className="hat-input" value={regForm.institution_name} onChange={e => setRegForm(f => ({ ...f, institution_name: e.target.value }))} placeholder="University / College" />
                </div>
                <div className="hat-field">
                  <label>Graduation Year</label>
                  <input type="number" className="hat-input" value={regForm.graduation_year} onChange={e => setRegForm(f => ({ ...f, graduation_year: e.target.value }))} placeholder="e.g. 2020" min="1980" max="2030" />
                </div>
              </div>

              {/* ── SUBMIT ── */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <button className="hat-btn primary" onClick={submitReg} disabled={regBusy || !regForm.full_name}>
                  <UserPlus size={15} /> {regBusy ? 'Registering…' : 'Register for Attendance'}
                </button>
                {regForm.full_name && (
                  <button className="hat-btn" onClick={clearRegForm}>Clear form</button>
                )}
                {!regForm.full_name && !regLoading && (
                  <span className="hat-step" style={{ margin: 0 }}>← Select an employee from the dropdown to auto-fill.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY (SRS 4.1) ─────────────────────────────── */}
      {tab === 'daily' && (
        <div className="hat-panel">
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftDay(-1)} title="Previous day"><ChevronLeft size={16} /></button>
              <input type="date" className="hat-input" value={date} onChange={e => setDate(e.target.value)} />
              <button className="hat-nav-btn" onClick={() => shiftDay(1)} title="Next day"><ChevronRight size={16} /></button>
            </div>
            <div>
              <div className="hat-filter-h">Department</div>
              {deptOpts(dept, setDept)}
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
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportDaily}><Download size={14} /> CSV</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={pdfDaily}><FileText size={14} /> PDF</button>
            </div>
          </div>

          <div className="hat-stats">
            <div className="hat-stat"><b>{s.total ?? 0}</b><span>Total Active</span></div>
            <div className="hat-stat green"><b>{s.present_pa ?? 0}</b><span>Present (P)</span></div>
            <div className="hat-stat red"><b>{s.absent_pa ?? 0}</b><span>Absent (A)</span></div>
            <div className="hat-stat blue"><b>{s.ashara_scans ?? 0}</b><span>Ashara Scans</span></div>
            <div className="hat-stat amber"><b>{s.card_face_scans ?? 0}</b><span>Face / Card Scans</span></div>
          </div>

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
      )}

      {/* ── WEEKLY (SRS 1.3 / 3 — Mon–Sun P/A rollup) ───── */}
      {tab === 'weekly' && (
        <div className="hat-panel">
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftWeek(-1)}><ChevronLeft size={16} /></button>
              <span className="hat-date">{weekly.overview.week_label || `Week ${wk.week} · ${toDateStr(wk.monday)} to ${toDateStr(wk.sunday)}`}</span>
              <button className="hat-nav-btn" onClick={() => shiftWeek(1)}><ChevronRight size={16} /></button>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="hat-btn" onClick={loadWeekly}><RefreshCw size={14} /> Refresh</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportWeekly}><Download size={14} /> CSV</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={pdfWeekly}><FileText size={14} /> PDF</button>
            </div>
          </div>

          <div className="hat-stats">
            <div className="hat-stat"><b>{weekly.overview.total_employees ?? 0}</b><span>Total Active</span></div>
            <div className="hat-stat green"><b>{wRows.reduce((s, e) => s + (e.total_p || 0), 0)}</b><span>Present (P)</span></div>
            <div className="hat-stat red"><b>{weekly.overview.total_absences ?? 0}</b><span>Absent (A)</span></div>
            <div className="hat-stat blue"><b>{(weekly.overview.avg_present_rate ?? 0).toFixed(1)}%</b><span>Avg. Rate</span></div>
            <div className="hat-stat amber"><b>{weekly.overview.total_records ?? 0}</b><span>Scans Logged</span></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr><th>Employee ID</th><th>Employee Name</th><th>Department</th><th>Work Days</th><th>Present (P)</th><th>Absent (A)</th><th>Rate</th><th>Methods</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="hat-empty">Loading weekly summary…</td></tr>
                ) : wRows.length === 0 ? (
                  <tr><td colSpan={8} className="hat-empty">No attendance for {weekly.overview.week_label || `Week ${wk.week}`}.</td></tr>
                ) : wRows.map((e, i) => (
                  <tr key={e.employee_id || i} className={e.is_me ? 'hat-me' : ''}>
                    <td style={{ fontWeight: 700 }}>{e.employee_id}</td>
                    <td style={{ fontWeight: 600 }}>{e.full_name}{e.is_me && <span className="hat-you">You</span>}</td>
                    <td>{e.dept_name || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{e.total_working_days}</td>
                    <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{e.total_p}</td>
                    <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{e.total_a}</td>
                    <td>
                      <span className="hat-rate" style={{ color: e.attendance_rate >= 90 ? '#059669' : e.attendance_rate >= 75 ? '#d97706' : '#dc2626' }}>
                        {e.total_working_days ? `${e.attendance_rate}%` : '—'}
                      </span>
                    </td>
                    <td>
                      {Object.entries(e.auth_breakdown || {}).map(([k, v]) => (
                        <span key={k} className="hat-auth">{k} {v}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MONTHLY (SRS 4.2) ───────────────────────────── */}
      {tab === 'monthly' && (
        <div className="hat-panel">
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
              <span className="hat-date">{mDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
              <button className="hat-nav-btn" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
            </div>
            <div>
              <div className="hat-filter-h">Department</div>
              {deptOpts(mDept, setMDept)}
            </div>
            <div>
              <div className="hat-filter-h">Search Employee</div>
              <input className="hat-input" placeholder="Search employee…" value={mSearch} onChange={e => setMSearch(e.target.value)} />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="hat-btn" onClick={loadMonthly}><RefreshCw size={14} /> Refresh</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportMonthly}><Download size={14} /> CSV</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={pdfMonthly}><FileText size={14} /> PDF</button>
            </div>
          </div>

          <div className="hat-ov">
            <div className="ov-card"><b>{monthly.overview.total_working_days ?? 0}</b><span>Total Working Days</span></div>
            <div className="ov-card">
              <b style={{ color: '#0284c7' }}>{(monthly.overview.avg_present_rate ?? 0).toFixed(1)}%</b><span>Avg. Present Rate</span>
              <div className="hat-bar"><div className="hat-bar-fill" style={{ width: `${Math.min(monthly.overview.avg_present_rate ?? 0, 100)}%`, background: '#0284c7' }} /></div>
            </div>
            <div className="ov-card"><b style={{ color: '#dc2626' }}>{monthly.overview.total_absences ?? 0}</b><span>Total Unexcused Absences</span></div>
          </div>

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

      {/* ── YEARLY (SRS 1.3 / 3 — Jan–Dec rollup) ────────── */}
      {tab === 'yearly' && (
        <div className="hat-panel">
          <div className="hat-controls">
            <div className="hat-nav">
              <button className="hat-nav-btn" onClick={() => shiftYear(-1)}><ChevronLeft size={16} /></button>
              <span className="hat-date">{yr}</span>
              <button className="hat-nav-btn" onClick={() => shiftYear(1)}><ChevronRight size={16} /></button>
            </div>
            <div>
              <div className="hat-filter-h">Department</div>
              {deptOpts(yDept, setYDept)}
            </div>
            <div>
              <div className="hat-filter-h">Search Employee</div>
              <input className="hat-input" placeholder="Search employee…" value={ySearch} onChange={e => setYSearch(e.target.value)} />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="hat-btn" onClick={loadYearly}><RefreshCw size={14} /> Refresh</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={exportYearly}><Download size={14} /> CSV</button>
              <button className="hat-btn" style={{ marginLeft: 8 }} onClick={pdfYearly}><FileText size={14} /> PDF</button>
            </div>
          </div>

          <div className="hat-ov">
            <div className="ov-card"><b>{yearly.overview.total_employees ?? 0}</b><span>Total Employees</span></div>
            <div className="ov-card">
              <b style={{ color: '#0284c7' }}>{(yearly.overview.avg_annual_rate ?? 0).toFixed(1)}%</b><span>Avg. Annual Rate</span>
              <div className="hat-bar"><div className="hat-bar-fill" style={{ width: `${Math.min(yearly.overview.avg_annual_rate ?? 0, 100)}%`, background: '#0284c7' }} /></div>
            </div>
            <div className="ov-card"><b style={{ color: '#dc2626' }}>{yearly.overview.total_absences ?? 0}</b><span>Total Absences</span></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr><th>Employee ID</th><th>Employee Name</th><th>Department</th><th>Months (P per month)</th><th>Days Present</th><th>Days Absent</th><th>Annual Rate</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="hat-empty">Loading yearly summary…</td></tr>
                ) : yRows.length === 0 ? (
                  <tr><td colSpan={7} className="hat-empty">No attendance data for {yr}.</td></tr>
                ) : yRows.map((e, i) => {
                  const rr = e.annual_attendance_rate;
                  const maxP = Math.max(1, ...(e.months || []).map(m => m.present));
                  return (
                    <tr key={e.employee_id || i} className={e.is_me ? 'hat-me' : ''}>
                      <td style={{ fontWeight: 700 }}>{e.employee_id}</td>
                      <td style={{ fontWeight: 600 }}>{e.full_name}{e.is_me && <span className="hat-you">You</span>}</td>
                      <td>{e.dept_name || '—'}</td>
                      <td>
                        <div className="hat-yrgrid" title="Present days per month — Jan to Dec">
                          {(e.months || []).map((m, mi) => {
                            const c = m.present === 0 ? '#e2e8f0' : m.present >= maxP * 0.8 ? '#059669' : m.present >= maxP * 0.5 ? '#d97706' : '#eab308';
                            return <div key={mi} className="hat-ym" style={{ background: c, color: m.present === 0 ? '#94a3b8' : '#fff' }}>{m.present}</div>;
                          })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>{e.total_days_present}</td>
                      <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{e.total_days_absent}</td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="hat-rate" style={{ color: rr >= 90 ? '#059669' : rr >= 75 ? '#d97706' : rr > 0 ? '#dc2626' : '#94a3b8', width: 46 }}>
                            {e.total_working_days ? `${rr}%` : '—'}
                          </span>
                          <div className="hat-bar" style={{ flex: 1, marginTop: 0 }}>
                            <div className="hat-bar-fill" style={{ width: `${Math.min(rr || 0, 100)}%`, background: rr >= 90 ? '#059669' : rr >= 75 ? '#d97706' : rr > 0 ? '#dc2626' : '#cbd5e1' }} />
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

      {/* ── IP TERMINALS (SRS 5.1 / 6.1 — HR System Settings panel) ── */}
      {tab === 'ip' && (
        <div className="hat-panel">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>System Settings — IP Management Panel</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Authorized attendance computers. Only scans from <b>Active</b> terminals are accepted (SRS §5). A green <span className="hat-status-dot on" /> Active badge confirms the terminal is authorized.
            </p>
          </div>

          <form className="hat-ip-form" onSubmit={addComputer}>
            <div>
              <div className="hat-filter-h">Computer Name</div>
              <input className="hat-input" style={{ width: 220 }} placeholder="e.g. Gate 1 PC" value={compName} onChange={e => setCompName(e.target.value)} />
            </div>
            <div>
              <div className="hat-filter-h">IP Address</div>
              <input className="hat-input" style={{ width: 170 }} placeholder="e.g. 192.168.1.10" value={compIp} onChange={e => setCompIp(e.target.value)} />
            </div>
            <div>
              <div className="hat-filter-h">Location (optional)</div>
              <input className="hat-input" style={{ width: 170 }} placeholder="e.g. Main Entrance" value={compLoc} onChange={e => setCompLoc(e.target.value)} />
            </div>
            <button className="hat-btn primary" disabled={ipBusy}><PlusCircle size={15} /> {ipBusy ? 'Saving…' : 'Add Computer'}</button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr><th>Computer Name</th><th>IP Address</th><th>Location</th><th>Status</th><th>Added By (HR)</th><th>Action</th></tr>
              </thead>
              <tbody>
                {comps.length === 0 ? (
                  <tr><td colSpan={6} className="hat-empty">No authorized computers yet — add one above (e.g. IP 127.0.0.1 for this PC).</td></tr>
                ) : comps.map(c => (
                  <tr key={c.computer_id}>
                    <td style={{ fontWeight: 600 }}>{c.computer_name}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.ip_address || c.ip_range || '—'}</td>
                    <td>{c.location || '—'}</td>
                    <td>
                      <span className={`hat-ip-badge ${c.status === 'Active' ? 'on' : 'off'}`}>
                        <span className={`hat-status-dot ${c.status === 'Active' ? 'on' : 'off'}`} /> {c.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{c.added_by_hr_id || '—'}</td>
                    <td>
                      <button className="hat-btn" onClick={() => toggleComp(c)} disabled={ipBusy}>
                        {c.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol className="hat-step">
            <li><b>Step 1 (HR):</b> Register the employee once in HR → Employee management (SRS §5).</li>
            <li><b>Step 2 (HR):</b> Register allowed IP addresses here in System Settings. Only scans from these IPs are accepted.</li>
            <li><b>Step 3 (Employee):</b> The employee scans fingerprint (Ashara), face, or card on an authorized computer.</li>
            <li><b>Step 4 (System):</b> Backend verifies the terminal IP against this list in under 1 second.</li>
            <li><b>Step 5 (System):</b> If valid → logs <b>P</b> (Present) with timestamp + auth method on this dashboard instantly. No scan by end of day → <b>A</b> (Absent).</li>
          </ol>
        </div>
      )}

      {tab === 'biometrics' && (
        <div className="hat-panel">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>Biometric Enrollment (Ashara)</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              Step 1 Prerequisite: Assign a fingerprint ID to each employee. Their fingerprint is registered in the system once by the administrator, linking their physical print to their name and ID in the database.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="hat-t">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Current Fingerprint ID</th>
                  <th>Enroll New Fingerprint ID</th>
                </tr>
              </thead>
              <tbody>
                {bioLoading ? (
                  <tr><td colSpan={5} className="hat-empty">Loading employees...</td></tr>
                ) : bioEmps.length === 0 ? (
                  <tr><td colSpan={5} className="hat-empty">No registered ETP employees found.</td></tr>
                ) : bioEmps.map(emp => (
                  <tr key={emp.employee_id}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{emp.employee_id}</td>
                    <td style={{ fontWeight: 600 }}>{emp.full_name}</td>
                    <td>{emp.dept_name || '-'}</td>
                    <td>
                      {emp.fingerprint_id ? (
                        <span className="hat-pill P">
                          <Fingerprint size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> 
                          {emp.fingerprint_id}
                        </span>
                      ) : (
                        <span className="hat-pill NR">Not Enrolled</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="hat-input"
                          style={{ width: '150px' }}
                          placeholder="Scan Fingerprint..."
                          value={bioInput[emp.employee_id] || ''}
                          onChange={e => setBioInput(p => ({ ...p, [emp.employee_id]: e.target.value }))}
                        />
                        <button 
                          className="hat-btn primary"
                          onClick={() => handleEnrollBio(emp.employee_id)}
                        >
                          Enroll
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAttendance;