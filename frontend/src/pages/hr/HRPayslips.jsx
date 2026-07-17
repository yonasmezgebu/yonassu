import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayslips.module.css';

const HRPayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState({ type: null, text: '' });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewPayslip, setViewPayslip] = useState(null);

  const fetchPayslips = async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await hrService.getPayslips(params);
      setPayslips(res.data?.payslips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips('');
  }, []);

  useEffect(() => {
    fetchPayslips(selectedMonth);
  }, [selectedMonth]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!generateMonth) return;
    setGenerating(true);
    setGenMsg({ type: null, text: '' });
    try {
      await hrService.generatePayslips({ month: generateMonth });
      playSuccessSound();
      setGenMsg({ type: 'success', text: `✅ Payslips generated for ${generateMonth}.` });
      setShowGenerateModal(false);
      setGenerateMonth('');
      setSelectedMonth(generateMonth);
      fetchPeriods();
    } catch (err) {
      setGenMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to generate payslips.' });
    } finally {
      setGenerating(false);
    }
  };

  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  const openView = (ps) => {
    const gross = parseFloat(ps.base_salary || 0) + parseFloat(ps.performance_bonus || 0) + parseFloat(ps.overtime_pay || 0);
    const deductions = [
      { name: 'Absence Deduction', amount: parseFloat(ps.absence_deduction || 0) },
      { name: 'Tax Deduction', amount: parseFloat(ps.tax_deduction || 0) },
      { name: 'Pension Deduction', amount: parseFloat(ps.pension_deduction || 0) },
      { name: 'Manual Deduction (Loan/Other)', amount: parseFloat(ps.loan_deduction || 0) },
    ].filter(d => d.amount > 0);
    const earnings = [
      { name: 'Base Salary', amount: parseFloat(ps.base_salary || 0) },
      { name: 'Performance Bonus', amount: parseFloat(ps.performance_bonus || 0) },
      { name: 'Overtime Pay', amount: parseFloat(ps.overtime_pay || 0) },
    ].filter(e => e.amount > 0);
    setViewPayslip({ ...ps, grossCalc: gross, deductionsList: deductions, earningsList: earnings });
  };

  const statusColor = (s) => {
    if (s === 'Paid' || s === 'Finalized') return { background: '#d1fae5', color: '#065f46' };
    if (s === 'Approved') return { background: '#dbeafe', color: '#1e3a8a' };
    if (s === 'Payslips Generated') return { background: '#fef9c3', color: '#713f12' };
    return { background: '#f1f5f9', color: '#475569' };
  };

  return (
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* ══ WORLD-CLASS HERO HEADER — PAYSLIPS ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 70%, #475569 100%)',
        borderRadius: 0,
        padding: '36px 24px 40px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Glowing orbs */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,163,184,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(203,213,225,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(241,245,249,0.2)', border: '1px solid rgba(241,245,249,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f8fafc', display: 'inline-block', boxShadow: '0 0 8px #f8fafc' }} />
              <span style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Finance · History</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Payroll
              <span style={{ background: 'linear-gradient(90deg, #cbd5e1, #f8fafc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>History</span>
            </h1>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              View and distribute completed employee payslips.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              Export History
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 700, fontSize: '14px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 600, color: '#0f172a', outline: 'none' }}
          />

          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginLeft: 'auto' }}>
            {payslips.filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status)).length} completed payslip(s) found
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 18, fontWeight: 600 }}>Loading payslips...</div>
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
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Period</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Base Salary</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Deductions</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Net Pay</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status)).length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No completed payslips found.</td></tr>
                ) : (
                  payslips
                    .filter(ps => ['Paid', 'Finalized'].includes(ps.payroll_status))
                    .map((ps, index) => (
                    <tr key={ps.id}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                    >
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{ps.full_name || '—'}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>#{ps.employee_id}</div>
                      </td>
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{ps.payroll_month || '—'}</div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>{ps.days_present ?? '—'} days</div>
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                        {fmtN(ps.base_salary)} ETB
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        -{fmtN((parseFloat(ps.absence_deduction || 0) + parseFloat(ps.tax_deduction || 0) + parseFloat(ps.pension_deduction || 0) + parseFloat(ps.loan_deduction || 0)))} ETB
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right' }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                          color: '#16a34a', padding: '6px 12px', borderRadius: '8px', 
                          fontWeight: 800, fontSize: '15px', border: '1px solid #bbf7d0' 
                        }}>
                          {fmtN(ps.net_salary)} ETB
                        </span>
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'center' }}>
                        <span style={{ 
                          ...statusColor(ps.payroll_status), 
                          padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' 
                        }}>
                          {ps.payroll_status || 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        <button onClick={() => openView(ps)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Payslip Modal */}
      {viewPayslip && (
        <div className={styles.modalOverlay} onClick={() => setViewPayslip(null)}>
          <div className={styles.payslipModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Payslip Details</h2>
              <div className={styles.payslipActions}>
                <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
                <button className={styles.closeBtn} onClick={() => setViewPayslip(null)}>×</button>
              </div>
            </div>
            <div className={styles.payslipBody} id="payslip-print-area">
              <div className={styles.psHeader}>
                <h2>Sutana Enterprise</h2>
                <p>Payslip for {viewPayslip.payroll_month}</p>
              </div>
              <div className={styles.psGrid}>
                <div className={styles.psBlock}>
                  <strong>Employee:</strong> {viewPayslip.full_name} ({viewPayslip.employee_id})<br />
                  <strong>Department:</strong> {viewPayslip.department || '—'}
                </div>
                <div className={styles.psBlock}>
                  <strong>Days Present:</strong> {viewPayslip.days_present ?? '—'} / {viewPayslip.days_absent !== undefined ? (viewPayslip.days_present + viewPayslip.days_absent) : '—'}<br />
                  <strong>Bank Account:</strong> {viewPayslip.bank_account_number || '—'}
                </div>
              </div>

              <table className={styles.psTable}>
                <thead><tr><th>Earnings</th><th>Amount</th></tr></thead>
                <tbody>
                  {viewPayslip.earningsList.map((e, i) => (
                    <tr key={i}><td>{e.name}</td><td>{fmtN(e.amount)} ETB</td></tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}><td>Gross Pay</td><td>{fmtN(viewPayslip.grossCalc)} ETB</td></tr>
                </tbody>
              </table>

              <table className={styles.psTable}>
                <thead><tr><th>Deductions</th><th>Amount</th></tr></thead>
                <tbody>
                  {viewPayslip.deductionsList.length === 0
                    ? <tr><td colSpan={2} style={{ color: '#64748b', fontStyle: 'italic' }}>No deductions</td></tr>
                    : viewPayslip.deductionsList.map((d, i) => (
                        <tr key={i}><td>{d.name}</td><td style={{ color: '#dc2626' }}>-{fmtN(d.amount)} ETB</td></tr>
                      ))
                  }
                </tbody>
              </table>

              <div className={styles.psTotal}>
                Net Pay: {fmtN(viewPayslip.net_salary)} ETB
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayslips;
