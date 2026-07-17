import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ─────────────── Utility ─────────────── */
const getWeekDates = () => {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return DAYS.map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
};

/* ─────────────── Signature Pad (HR Level) ─────────────── */
const SignaturePad = ({ onSigned }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  const startDraw = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1b683e';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
    const blank = document.createElement('canvas');
    blank.width = canvasRef.current.width;
    blank.height = canvasRef.current.height;
    const isSigned = canvasRef.current.toDataURL() !== blank.toDataURL();
    setSigned(isSigned);
    onSigned(isSigned ? canvasRef.current.toDataURL() : null);
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSigned(false);
    onSigned(null);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
        ✍️ HR Manager Digital Signature
        {signed && <span style={{ color: '#16a34a', marginLeft: 10, fontWeight: 600 }}>✓ Signed</span>}
      </div>
      <div style={{ border: '2px solid ' + (signed ? '#16a34a' : '#d1d5db'), borderRadius: 8, display: 'inline-block', background: '#f9fafb' }}>
        <canvas
          ref={canvasRef}
          width={420}
          height={100}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          style={{ display: 'block', cursor: 'crosshair', borderRadius: 6 }}
        />
      </div>
      <button onClick={clear} style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Clear Signature
      </button>
    </div>
  );
};

/* ─────────────── Level Badge ─────────────── */
const LevelBadge = ({ level, label, active }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', borderRadius: 8,
    background: active ? '#1b683e' : '#f3f4f6',
    color: active ? '#fff' : '#9ca3af',
    fontWeight: 700, fontSize: 13,
    transition: 'all 0.2s',
    border: active ? 'none' : '1px solid #e5e7eb',
  }}>
    <span style={{
      width: 24, height: 24, borderRadius: '50%',
      background: active ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
      color: active ? '#fff' : '#9ca3af',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800,
    }}>{level}</span>
    {label}
  </div>
);

/* ─────────────── Main Component ─────────────── */
const HRAttendanceSimple = () => {
  const { user } = useAuth();

  // Role detection — broad match, case-insensitive
  const userRoles = (user?.roles || []).map(r => r.toLowerCase());
  const isCEO     = userRoles.some(r => r === 'ceo' || r.includes('ceo'));
  const isHR      = !isCEO && userRoles.some(r => r === 'hr' || r.startsWith('hr') || r.includes('hr manager') || r.includes('human resource'));
  const isManager = !isCEO && !isHR;

  // Determine level
  const level     = isCEO ? 3 : isHR ? 2 : 1;

  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [grid, setGrid]             = useState({});
  const [signature, setSignature]   = useState(null); // HR level only
  const [submitted, setSubmitted]   = useState(false);
  const [message, setMessage]       = useState(null); // { type: 'success'|'error', text: '' }

  // Footer inputs
  const [department, setDepartment] = useState('');
  const [managerName, setManagerName] = useState(user?.full_name || '');
  const [weekOf, setWeekOf]         = useState('');
  const weekDates                   = getWeekDates();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res  = await hrService.etp.listEmployees({ limit: 200 });
        const data = (res.data?.data || []).filter(e => e._source !== 'users_table');

        let list = [];

        if (isCEO) {
          // CEO: show only HR manager(s)
          list = data.filter(e => {
            const empRoles = (e.roles || e.role_names || []).map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase());
            return empRoles.includes('hr');
          });
          // Fallback: if roles not on employee object, show employees whose dept contains "hr"
          if (list.length === 0) {
            list = data.filter(e =>
              (e.dept_name || '').toLowerCase().includes('hr') ||
              (e.position_title || '').toLowerCase().includes('hr')
            );
          }
        } else if (isHR) {
          // HR: show all department managers (employees whose position/role is manager)
          list = data.filter(e => {
            const empRoles = (e.roles || e.role_names || []).map(r => (typeof r === 'string' ? r : r.name || '').toLowerCase());
            const pos = (e.position_title || '').toLowerCase();
            return empRoles.some(r => r.includes('manager') || r.includes('supervisor')) ||
              pos.includes('manager') || pos.includes('supervisor') || pos.includes('lead');
          });
          // If can't filter by role, show all non-employee roles
          if (list.length === 0) {
            list = data.filter(e =>
              (e.position_title || '').toLowerCase().match(/manager|supervisor|director|lead|head|chief/)
            );
          }
        } else {
          // Manager: show employees in same department, manager self first
          const myDept = user?.dept_id || user?.department_id;
          const myDeptName = (user?.dept_name || '').toLowerCase();

          const deptEmployees = myDept
            ? data.filter(e => String(e.dept_id) === String(myDept) && e.employee_id !== user?.employee_id)
            : data.filter(e => (e.dept_name || '').toLowerCase() === myDeptName && e.employee_id !== user?.employee_id);

          const selfEntry = { employee_id: user?.employee_id || 'self', full_name: user?.full_name || 'Manager', isManager: true };
          list = [selfEntry, ...deptEmployees];
          setDepartment(user?.dept_name || '');
        }

        // Pad to minimum 10 rows
        const minRows = 10;
        if (list.length < minRows) {
          const padding = Array.from({ length: minRows - list.length }).map((_, i) => ({
            employee_id: `empty-${i}`, full_name: '', isEmpty: true,
          }));
          list = [...list, ...padding];
        }

        setEmployees(list);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isCEO, isHR, isManager]);

  const handleCellChange = (empId, day, val) => {
    const char = val.toUpperCase();
    if (char === 'P' || char === 'A' || char === '') {
      setGrid(prev => ({ ...prev, [empId]: { ...(prev[empId] || {}), [day]: char } }));
    }
  };

  const calculateTotals = (empId) => {
    const row = grid[empId] || {};
    let present = 0, absent = 0;
    Object.values(row).forEach(v => { if (v === 'P') present++; if (v === 'A') absent++; });
    return { present, absent };
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = () => {
    if (isHR && !signature) {
      showMessage('error', '⚠ Please apply your digital signature before submitting to CEO.');
      return;
    }
    playSuccessSound();
    setSubmitted(true);
    const target = isCEO ? 'complete' : isHR ? 'CEO' : 'HR';
    setTimeout(() => {
      if (isCEO) showMessage('success', '✅ CEO has marked HR Manager attendance. Attendance cycle is now complete!');
      else showMessage('success', `✅ Attendance sheet submitted successfully to ${target}!`);
      setSubmitted(false);
    }, 300);
  };

  // Labels per level
  const levelInfo = {
    1: { badge: 'Level 1 — Department Manager', desc: 'Fill attendance for your department employees, then submit to HR.', submitLabel: 'Submit to HR', submitColor: '#1b683e' },
    2: { badge: 'Level 2 — HR Manager', desc: 'Fill attendance for all department managers. Apply your signature, then submit to CEO.', submitLabel: 'Submit to CEO', submitColor: '#1d4ed8' },
    3: { badge: 'Level 3 — CEO', desc: 'Mark attendance for the HR Manager. This completes the attendance cycle.', submitLabel: '✔ Complete Attendance Cycle', submitColor: '#7c3aed' },
  }[level];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontSize: 16 }}>Loading attendance sheet…</div>;

  return (
    <div style={{ padding: '28px 36px', fontFamily: "'Times New Roman', serif", backgroundColor: '#fff', minHeight: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Level indicator ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <LevelBadge level={1} label="Dept Manager → HR"    active={level === 1} />
          <div style={{ color: '#d1d5db', fontSize: 18, fontFamily: 'sans-serif' }}>›</div>
          <LevelBadge level={2} label="HR Manager → CEO"     active={level === 2} />
          <div style={{ color: '#d1d5db', fontSize: 18, fontFamily: 'sans-serif' }}>›</div>
          <LevelBadge level={3} label="CEO → Complete"       active={level === 3} />
        </div>

        {/* ── Info bar ── */}
        <div style={{
          padding: '12px 18px', borderRadius: 8, marginBottom: 22,
          background: level === 1 ? '#f0fdf4' : level === 2 ? '#eff6ff' : '#f5f3ff',
          border: `1px solid ${level === 1 ? '#86efac' : level === 2 ? '#93c5fd' : '#c4b5fd'}`,
          fontSize: 14, color: '#374151',
        }}>
          <strong>{levelInfo.badge}:</strong> {levelInfo.desc}
        </div>

        {/* ── Attendance Table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#1b683e', color: 'white' }}>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left', width: '20%', fontSize: '15px', fontWeight: 'bold' }}>
                Employee Name
              </th>
              {DAYS.map((day, i) => (
                <th key={day} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', width: '9%', fontSize: '13px', fontWeight: 'bold' }}>
                  {day}<br />
                  <span style={{ fontWeight: 'normal', fontSize: '11px' }}>{weekDates[i]}</span>
                </th>
              ))}
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '8%', fontSize: '14px', fontWeight: 'bold' }}>Present</th>
              <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', width: '8%', fontSize: '14px', fontWeight: 'bold' }}>Absent</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => {
              const totals = calculateTotals(emp.employee_id);
              const isEven = index % 2 === 0;
              return (
                <tr key={emp.employee_id} style={{ backgroundColor: isEven ? '#ffffff' : '#f0f5f1' }}>
                  <td style={{ border: '1px solid #000', padding: '8px 10px', fontSize: '14px', height: '36px', fontStyle: emp.isManager ? 'italic' : 'normal' }}>
                    {emp.isManager ? `(Manager — self) ${emp.full_name}` : emp.full_name}
                  </td>
                  {DAYS.map(day => (
                    <td key={day} style={{ border: '1px solid #000', padding: 0, textAlign: 'center' }}>
                      <input
                        type="text"
                        maxLength={1}
                        value={(grid[emp.employee_id]?.[day]) || ''}
                        onChange={e => handleCellChange(emp.employee_id, day, e.target.value)}
                        disabled={emp.isEmpty}
                        style={{
                          width: '100%', height: '34px', border: 'none', background: 'transparent',
                          textAlign: 'center', fontSize: '16px', fontWeight: 'bold', outline: 'none',
                          textTransform: 'uppercase', cursor: emp.isEmpty ? 'default' : 'text',
                          color: (grid[emp.employee_id]?.[day]) === 'A' ? '#dc2626' : '#166534',
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#166534' }}>
                    {totals.present > 0 ? totals.present : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#b91c1c' }}>
                    {totals.absent > 0 ? totals.absent : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Footer fields ── */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', fontSize: '15px', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span>Department / Team:</span>
            <input type="text" value={department} onChange={e => setDepartment(e.target.value)}
              style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: 180, fontSize: 15, fontFamily: "'Times New Roman', serif" }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span>Manager Name:</span>
            <input type="text" value={managerName} onChange={e => setManagerName(e.target.value)}
              style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: 180, fontSize: 15, fontFamily: "'Times New Roman', serif" }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span>Week of:</span>
            <input type="text" value={weekOf} onChange={e => setWeekOf(e.target.value)}
              placeholder={weekDates[0]}
              style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', width: 140, fontSize: 15, fontFamily: "'Times New Roman', serif" }} />
          </div>
        </div>

        {/* ── HR Signature (Level 2 only) ── */}
        {isHR && <SignaturePad onSigned={setSignature} />}

        {/* ── Legend + Submit ── */}
        <div style={{ marginTop: 22, fontSize: 14, fontStyle: 'italic', color: '#4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <span>
            Legend: &nbsp;P = Present &nbsp;|&nbsp; A = Absent &nbsp;|&nbsp; Leave blank cells only if the day is not a working day for that person.
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitted || (isHR && !signature)}
            style={{
              background: (isHR && !signature) ? '#9ca3af' : levelInfo.submitColor,
              color: 'white', border: 'none', padding: '12px 28px', borderRadius: 6,
              fontSize: 15, cursor: (isHR && !signature) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontStyle: 'normal',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)', transition: 'all 0.2s',
              opacity: submitted ? 0.7 : 1,
            }}
          >
            {submitted ? 'Submitting…' : levelInfo.submitLabel}
          </button>
        </div>

        {/* ── Inline message (replaces alert) ── */}
        {message && (
          <div style={{
            marginTop: 14,
            padding: '14px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontStyle: 'normal',
            fontSize: 15,
            fontWeight: 600,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: message.type === 'success' ? '#166534' : '#b91c1c',
            animation: 'fadeIn 0.3s ease',
          }}>
            <span style={{ fontSize: 22 }}>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{message.text.replace(/^✅|^⚠\/i/, '').trim()}</span>
            <button onClick={() => setMessage(null)} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 18, color: 'inherit', opacity: 0.6,
            }}>✕</button>
          </div>
        )}
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      </div>
    </div>
  );
};

export default HRAttendanceSimple;
