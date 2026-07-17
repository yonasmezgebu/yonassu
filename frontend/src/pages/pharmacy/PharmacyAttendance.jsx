import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, ShieldCheck, Users, Zap, CheckCircle2, Save, Send, RotateCcw } from 'lucide-react';
import apiClient from '../../services/apiClient';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const COLORS = ['#4FA3C3', '#5BAD8A', '#E07B54', '#9B72CF', '#D4A843', '#4A90C4', '#58B09C'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.9)} }
  
  .artistic-3d-title { font-size:2.8rem; font-weight:900; color:#0d3349; letter-spacing:-0.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 #fff,4px 4px 0 #4FA3C3,5px 5px 0 #4FA3C3,6px 6px 0 #2d7da0,7px 7px 0 #2d7da0,8px 8px 15px rgba(0,0,0,0.2);
    margin:0;display:flex;align-items:center;gap:12px;line-height:1.1 }
  .artistic-3d-subtitle { font-size:0.95rem;color:#4A7A9B;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:0.15em;margin:0;text-shadow:1px 1px 0px rgba(255,255,255,0.9) }
  
  .btn-3d-primary { background:linear-gradient(135deg,#4FA3C3,#2d7da0);color:white;border:2px solid #2d7da0;border-radius:14px;padding:12px 28px;font-weight:900;font-size:15px;cursor:pointer;
    box-shadow:0px 5px 0px #1e5a78,0px 8px 15px rgba(0,80,120,0.25),inset 0px 2px 0px rgba(255,255,255,0.2);
    transition:all 0.1s;display:inline-flex;align-items:center;justify-content:center;gap:10px;text-transform:uppercase;letter-spacing:1.5px }
  .btn-3d-primary:active:not(:disabled) { transform:translateY(6px);box-shadow:0px 0px 0px #1e5a78 }
  .btn-3d-primary:hover:not(:disabled)  { filter:brightness(1.08) }
  .btn-3d-primary:disabled { filter: grayscale(0.8) opacity(0.7); cursor: not-allowed; transform: translateY(6px); box-shadow: 0 0 0 transparent; }

  .d-card-no-hover {
    --hover-color:#4FA3C3;
    position:relative;overflow:hidden;background:white;border-radius:0;
    box-shadow:0 2px 14px rgba(0,80,120,0.08);transition:background-size 0.4s,box-shadow 0.4s;animation:fadeUp 0.5s ease both;
    background-image:linear-gradient(to right,var(--hover-color),var(--hover-color)),linear-gradient(to bottom,var(--hover-color),var(--hover-color)),linear-gradient(to left,var(--hover-color),var(--hover-color)),linear-gradient(to top,var(--hover-color),var(--hover-color));
    background-position:0 0,100% 0,100% 100%,0 100%;background-repeat:no-repeat;background-size:0% 4px,4px 0%,0% 4px,4px 0% }
  .d-card-no-hover:hover { box-shadow:0 6px 20px rgba(0,80,120,0.12),0 0 14px var(--hover-color);background-size:100% 4px,4px 100%,100% 4px,4px 100% }

  .att-grid { display: grid; grid-template-columns: 2fr repeat(7, 1fr) 0.8fr 0.8fr; border-bottom: 2px solid rgba(79,163,195,0.2); }
  .att-grid-header { background: rgba(224,239,243,0.7); font-weight: 900; font-size: 11px; text-transform: uppercase; color: #4A7A9B; letter-spacing: 0.05em; }
  .att-cell { padding: 14px 8px; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(79,163,195,0.1); }
  .att-cell.left { justify-content: flex-start; padding-left: 24px; }
  .att-row { transition: background 0.2s; border-bottom: 1px solid rgba(79,163,195,0.1); }
  .att-row:hover { background: rgba(224,239,243,0.3); }
  
  .att-input { width: 44px; height: 44px; text-align: center; font-size: 18px; font-weight: 900; border-radius: 8px; border: 2px solid transparent; background: rgba(0,0,0,0.03); color: #0d3349; transition: all 0.2s; outline: none; font-family: 'Inter', sans-serif; text-transform: uppercase; }
  .att-input:focus { border-color: #4FA3C3; background: white; box-shadow: 0 4px 12px rgba(79,163,195,0.2); }
  .att-input.present { color: #5BAD8A; background: rgba(91,173,138,0.1); border-color: rgba(91,173,138,0.3); }
  .att-input.absent { color: #E07B54; background: rgba(224,123,84,0.1); border-color: rgba(224,123,84,0.3); }

  .lock-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; animation: fadeIn 0.4s forwards; }
  @keyframes fadeIn { to { opacity: 1; } }
`;

export default function PharmacyAttendance() {
  const [workers, setWorkers] = useState([]);
  const [grid, setGrid] = useState({}); // { workerId: { Sunday: 'P', Monday: 'A' } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const weekDates = useMemo(() => getWeekDates(), []);
  const lockKey = useMemo(() => `attendance_locked_pharmacy_${weekDates[0].replace('/', '-')}`, [weekDates]);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/pharmacy-workers');
      let data = res?.data?.data || res?.data || [];
      if (!Array.isArray(data)) data = [];
      setWorkers(data);

      if (localStorage.getItem(lockKey)) {
        setIsSubmitted(true);
        const saved = JSON.parse(localStorage.getItem(`attendance_data_pharmacy_${weekDates[0].replace('/', '-')}`) || '{}');
        setGrid(saved);
      }
    } catch (err) {
      console.error('Failed to load pharmacy workers', err);
    } finally {
      setLoading(false);
    }
  }, [lockKey, weekDates]);

  useEffect(() => { loadWorkers(); }, [loadWorkers]);

  const [message, setMessage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCellChange = (workerId, day, val) => {
    if (isSubmitted) return;
    const char = val.toUpperCase();
    if (char === 'P' || char === 'A' || char === '') {
      setGrid(prev => ({ ...prev, [workerId]: { ...(prev[workerId] || {}), [day]: char } }));
    }
  };

  const calculateTotals = (workerId) => {
    const row = grid[workerId] || {};
    let p = 0, a = 0;
    Object.values(row).forEach(v => { if (v === 'P') p++; if (v === 'A') a++; });
    return { p, a };
  };

  const triggerSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmitToHR = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setMessage(null);
    try {
      await new Promise(r => setTimeout(r, 1200)); // Mock backend delay
      localStorage.setItem(lockKey, 'true');
      localStorage.setItem(`attendance_data_pharmacy_${weekDates[0].replace('/', '-')}`, JSON.stringify(grid));
      setIsSubmitted(true);
      setMessage({ type: 'success', text: 'Attendance locked and forwarded to HR Manager.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit attendance. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '0', minHeight: 'calc(100vh - 64px)', background: '#E0EFF3', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{SHARED_CSS}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' }}>
        <div style={{ justifySelf: 'start' }}>
          <h1 className="artistic-3d-title">
            Roll Call. <Calendar style={{ color: '#4FA3C3', filter: 'drop-shadow(0 0 8px rgba(79,163,195,0.6))' }} size={38} />
          </h1>
        </div>
        <div style={{ justifySelf: 'center' }}>
          <p className="artistic-3d-subtitle">Level 1: Department Manager</p>
        </div>
        <div style={{ justifySelf: 'end' }}>
          <button
            onClick={() => { setWorkers([]); setGrid({}); setIsSubmitted(false); setMessage(null); loadWorkers(); }}
            title="Refresh roster"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px',
              background: 'linear-gradient(135deg, #ffffff, #e0eff3)',
              color: '#0d3349',
              border: '2px solid #4FA3C3',
              borderRadius: 14,
              fontWeight: 900, fontSize: 14,
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0px 5px 0px #4FA3C3, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1)',
              transition: 'all 0.1s',
              fontFamily: "'Inter','Segoe UI',sans-serif"
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(5px)'; e.currentTarget.style.boxShadow = '0px 0px 0px #4FA3C3'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0px 5px 0px #4FA3C3, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0px 5px 0px #4FA3C3, 0px 8px 15px rgba(0,80,120,0.15), inset 0px 2px 0px rgba(255,255,255,1)'; }}
          >
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── INFO ALERT ── */}
      <div style={{ background: 'rgba(255,255,255,0.6)', border: '2px solid rgba(255,255,255,1)', borderRadius: 16, padding: '20px 28px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 10px 30px rgba(0,80,120,0.05)', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ background: '#4FA3C3', color: 'white', padding: 12, borderRadius: '50%', boxShadow: '0 4px 12px rgba(79,163,195,0.4)' }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#0d3349', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacy Department Attendance</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#4A7A9B', fontWeight: 600, lineHeight: 1.5 }}>
            Fill attendance for your pharmacy employees using <strong>P</strong> (Present) or <strong>A</strong> (Absent), then submit to HR. 
            Leave blank if it is not a working day. Once submitted, records are locked for HR review.
          </p>
        </div>
      </div>

      {/* ── STAFF GRID ── */}
      <div className="d-card-no-hover" style={{ padding: 0, animationDelay: '0.2s', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', background: 'linear-gradient(135deg, #4FA3C3, #2d7da0)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={24} />
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Weekly Sheet</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 20 }}>
            Week of {weekDates[0]}
          </div>
        </div>

        <div style={{ position: 'relative' }}>

          <div className="att-grid att-grid-header">
            <div className="att-cell left">Staff Member</div>
            {DAYS.map((day, i) => (
              <div key={day} className="att-cell" style={{ flexDirection: 'column', gap: 4 }}>
                <span>{day.slice(0, 3)}</span>
                <span style={{ fontSize: 10, color: '#7DA8C0' }}>{weekDates[i]}</span>
              </div>
            ))}
            <div className="att-cell" style={{ color: '#5BAD8A' }}>Present</div>
            <div className="att-cell" style={{ color: '#E07B54' }}>Absent</div>
          </div>

          {loading ? (
             <div style={{ padding: '60px 20px', textAlign: 'center', color: '#7DA8C0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <Zap size={36} style={{ color: '#4FA3C3', marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
               <div style={{ fontSize: 16, color: '#0d3349', fontWeight: 800 }}>Loading Roster...</div>
             </div>
          ) : (
            workers.map((w, idx) => {
              const avatarColor = COLORS[idx % COLORS.length];
              const totals = calculateTotals(w.id);
              
              return (
                <div key={w.id} className="att-grid att-row" style={{ animationDelay: `${0.05 * idx}s` }}>
                  <div className="att-cell left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', flexShrink: 0, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {w.profile_photo ? <img src={resolvePhoto(w.profile_photo)} alt={w.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} /> : (w.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0d3349', fontSize: 14 }}>{w.full_name}</div>
                        <div style={{ fontSize: 11, color: '#4A7A9B', marginTop: 2, fontWeight: 600 }}>{w.branch_name || 'Pharmacy'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {DAYS.map(day => {
                    const val = grid[w.id]?.[day] || '';
                    return (
                      <div key={day} className="att-cell">
                        <input 
                          type="text" 
                          maxLength={1} 
                          value={val}
                          onChange={e => handleCellChange(w.id, day, e.target.value)}
                          disabled={isSubmitted}
                          className={`att-input ${val === 'P' ? 'present' : val === 'A' ? 'absent' : ''}`}
                        />
                      </div>
                    );
                  })}

                  <div className="att-cell">
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#5BAD8A' }}>{totals.p > 0 ? totals.p : '-'}</div>
                  </div>
                  <div className="att-cell">
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#E07B54' }}>{totals.a > 0 ? totals.a : '-'}</div>
                  </div>
                </div>
              );
            })
          )}
          
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, animation: 'fadeUp 0.6s ease', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: '#7DA8C0', fontWeight: 600 }}>
          * Records format is compatible with HR Attendance API standard.
        </div>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {message && (
             <div style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, 
                background: message.type === 'success' ? '#dcfce7' : '#fee2e2', 
                color: message.type === 'success' ? '#166534' : '#991b1b',
                animation: 'fadeUp 0.3s ease' }}>
               {message.text}
             </div>
          )}
          <button 
            onClick={triggerSubmit} 
            disabled={isSubmitted || submitting || workers.length === 0}
            className="btn-3d-primary"
            style={{ transform: isSubmitted ? 'translateY(6px)' : 'none' }}
          >
            {isSubmitted ? (
              <><ShieldCheck size={20} /> Locked & Submitted</>
            ) : (
              <><Send size={20} /> {submitting ? 'Submitting...' : 'Submit to HR Manager'}</>
            )}
          </button>
        </div>
      </div>

      {/* ── CUSTOM CONFIRM MODAL ── */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,51,73,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'white', padding: '32px 40px', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: 450, animation: 'fadeUp 0.3s ease' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 900, color: '#0d3349' }}>Confirm Submission</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#4A7A9B', lineHeight: 1.6 }}>Are you sure you want to submit this weekly attendance report to HR? Once submitted, it will be permanently locked and you will not be able to edit it.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '2px solid #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmSubmitToHR} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#5BAD8A', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(91,173,138,0.3)' }}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
