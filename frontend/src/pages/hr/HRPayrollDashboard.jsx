import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import styles from './HREmployees.module.css';

const HRPayrollDashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchPayroll = async () => {
    setLoading(true);
    setSummary(null);
    setEmployees([]);
    try {
      const res = await apiClient.get(`/hr/etp/payroll/summary/${month}/${year}`);
      // apiClient interceptor returns response.data directly, so res IS the JSON body
      console.log('[Payroll] response:', res);
      const payload = res?.data || res; // handle both wrapped and unwrapped
      if (payload) {
        const s = payload.payrollSummary || payload.company;
        const e = payload.employees || [];
        console.log('[Payroll] summary:', s, 'employees count:', e.length);
        setSummary(s);
        setEmployees(e);
      }
    } catch (err) {
      console.error('[Payroll] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Separated confirm handlers — no double-click pattern
  const handleCalculate = () => {
    setConfirmModal({
      title: 'Calculate Payroll',
      message: `Calculate payroll for ${month}/${year}? This will overwrite any current draft data.`,
      onConfirm: async () => {
        setConfirmModal(null);
        setCalculating(true);
        try {
          await apiClient.post('/hr/etp/payroll/calculate', { month, year });
          showToast('Payroll calculated successfully!');
          await fetchPayroll();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to calculate payroll', 'error');
        } finally {
          setCalculating(false);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (!summary) return;
    setConfirmModal({
      title: 'Submit Payroll',
      message: 'Submit this payroll to the CEO for approval?',
      onConfirm: async () => {
        setConfirmModal(null);
        setSubmitting(true);
        try {
          await apiClient.post('/hr/etp/payroll/submit', { month, year });
          showToast('Payroll submitted for CEO approval!');
          await fetchPayroll();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to submit payroll', 'error');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const isEditable = !summary || summary.approval_status === 'Draft' || summary.approval_status === 'Rejected';
  const statusColor = (s) => {
    switch (s) {
      case 'Draft': return '#6b7280';
      case 'Pending CEO Approval': return '#d97706';
      case 'Approved': return '#2563eb';
      case 'Paid': return '#059669';
      case 'Rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: 8,
          fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px 0', color: '#475569' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => confirmModal.onConfirm()}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ WORLD-CLASS HERO HEADER — MONTHLY PAYROLL ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #6d28d9 70%, #9333ea 100%)',
        borderRadius: 0,
        padding: '36px 24px 52px',
        overflow: 'hidden',
        marginBottom: '-24px',
      }}>
        {/* Glowing orbs — amethyst & gold tones */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,121,249,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 10, left: '50%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(216,180,254,0.2)', border: '1px solid rgba(216,180,254,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15', display: 'inline-block', boxShadow: '0 0 8px #facc15' }} />
              <span style={{ color: '#e9d5ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Finance · Payroll</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Monthly
              <span style={{ background: 'linear-gradient(90deg, #facc15, #fef08a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Payroll</span>
            </h1>
            <p style={{ margin: 0, color: '#d8b4fe', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              Prepare, calculate, and submit monthly salary sheets for CEO approval.
            </p>
          </div>

          {/* Right side controls (Month/Year) */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '8px 12px' }}>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontWeight: 600 }}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m} style={{ color: '#000' }}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', width: 70, fontWeight: 600, textAlign: 'center' }} />
            <button onClick={fetchPayroll} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 700, color: '#fff', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'}>
              Load
            </button>
          </div>
        </div>

        {/* Dashboard Cards Row */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 36, display: 'flex', gap: 20, alignItems: 'stretch' }}>
          
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Approval Status</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: summary?.approval_status === 'Approved' ? '#34d399' : summary?.approval_status === 'Pending CEO Approval' ? '#fbbf24' : '#94a3b8', boxShadow: `0 0 10px ${summary?.approval_status === 'Approved' ? '#34d399' : summary?.approval_status === 'Pending CEO Approval' ? '#fbbf24' : '#94a3b8'}` }}></span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{summary ? summary.approval_status : 'Not Generated'}</span>
            </div>
          </div>

          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Net Pay</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#facc15', textShadow: '0 2px 10px rgba(250,204,21,0.3)' }}>
              {summary ? formatCurrency(summary.company_net_pay) : '—'} <span style={{ fontSize: 16, color: '#fef08a' }}>ETB</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            {isEditable && (
              <>
                <button onClick={handleCalculate} disabled={calculating}
                  style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {calculating ? 'Calculating...' : '⚡ Calculate Payroll'}
                </button>
                {summary && (
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {submitting ? 'Submitting...' : '↗ Submit to CEO'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Spacer */}
      <div style={{ height: 28 }} />

      {summary && summary.rejection_reason && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          <strong style={{ color: '#991b1b' }}>CEO Feedback: </strong>
          <span style={{ color: '#b91c1c' }}>{summary.rejection_reason}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading payroll data...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db', color: '#6b7280' }}>
          <p style={{ fontSize: 16 }}>No payroll data generated for {month}/{year}.</p>
          {isEditable && <p>Click "Calculate Payroll" to draft the salary sheet.</p>}
        </div>
      ) : (
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '24px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.03)', 
          overflow: 'hidden', 
          border: '1px solid rgba(226, 232, 240, 0.8)',
          fontFamily: "'Inter', sans-serif"
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Employee</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Base Salary</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Allowances</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Extras</th>
                <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Deductions</th>
                <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => {
                const totalAllowances = Number(emp.housing_allowance) + Number(emp.transport_allowance) + Number(emp.communication_allowance);
                const totalExtras = Number(emp.overtime_pay) + Number(emp.bonus_pay);
                const totalDeductions = Number(emp.deduction_absent) + Number(emp.deduction_loan) + Number(emp.deduction_tax) + Number(emp.deduction_pension);
                return (
                  <tr key={emp.employee_id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.2s ease',
                        background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                  >
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{emp.full_name}</div>
                      <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>#{emp.employee_id}</div>
                    </td>
                    <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                      {formatCurrency(emp.base_salary)}
                    </td>
                    <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                      {totalAllowances > 0 ? `+${formatCurrency(totalAllowances)}` : '—'}
                    </td>
                    <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                      {totalExtras > 0 ? `+${formatCurrency(totalExtras)}` : '—'}
                    </td>
                    <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                      {totalDeductions > 0 ? `-${formatCurrency(totalDeductions)}` : '—'}
                    </td>
                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                        color: '#16a34a', padding: '6px 12px', borderRadius: '8px', 
                        fontWeight: 800, fontSize: '15px', border: '1px solid #bbf7d0' 
                      }}>
                        {formatCurrency(emp.net_pay)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HRPayrollDashboard;
