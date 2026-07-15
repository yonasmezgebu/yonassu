import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + ' ETB';
};

const Row = ({ label, value, color, bold }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
  }}>
    <span style={{ fontSize: 14, color: '#475569' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: color || '#1e293b' }}>{value}</span>
  </div>
);

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const res = await apiClient.get('/hr/etp/my-payslips');
        const data = res?.data?.data?.payslips || res?.data?.data || res?.data || [];
        setPayslips(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Could not load payslips. Please contact HR.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p>Loading your payslips...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#dc2626', fontFamily: "'Inter', sans-serif" }}>
      <p>{error}</p>
    </div>
  );

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>My Payslips</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Your salary payment history — all processed payrolls</p>
      </div>

      {payslips.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderRadius: 16, border: '1px dashed #cbd5e1',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>💼</div>
          <h3 style={{ color: '#475569', fontWeight: 600 }}>No Payslips Yet</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 320, margin: '8px auto 0' }}>
            Once your salary is processed and paid by Finance, your payslips will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {payslips.map((p, idx) => {
            const totalAllowances = Number(p.housing_allowance) + Number(p.transport_allowance) + Number(p.communication_allowance);
            const totalDeductions = Number(p.deduction_tax) + Number(p.deduction_pension) + Number(p.deduction_absent) + Number(p.deduction_loan);
            const isOpen = selected === idx;

            return (
              <div key={p.component_id || idx} style={{
                background: '#fff',
                borderRadius: 12,
                border: `1px solid ${isOpen ? '#93c5fd' : '#e2e8f0'}`,
                overflow: 'hidden',
                boxShadow: isOpen ? '0 8px 24px rgba(37,99,235,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.25s ease',
              }}>
                {/* Payslip header - always visible */}
                <div
                  onClick={() => setSelected(isOpen ? null : idx)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 24px', cursor: 'pointer',
                    background: isOpen ? 'linear-gradient(135deg, #eff6ff, #f8fafc)' : '#fff',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 13,
                    }}>
                      {MONTH_NAMES[p.month_number - 1]?.slice(0, 3).toUpperCase()}<br/>
                      <span style={{ fontSize: 10 }}>{p.year_number}</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                        {MONTH_NAMES[p.month_number - 1]} {p.year_number}
                      </h3>
                      <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>Salary Payslip</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Net Pay</p>
                      <h3 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: '#059669' }}>{fmt(p.net_pay)}</h3>
                    </div>
                    <span style={{
                      background: '#d1fae5', color: '#065f46',
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>✓ Paid</span>
                    <svg style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }}
                      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#f1f5f9' }}>
                      {/* Earnings */}
                      <div style={{ background: '#fff', padding: 0 }}>
                        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            💰 Earnings
                          </h4>
                        </div>
                        <Row label="Basic Salary"         value={fmt(p.base_salary)} />
                        <Row label="Housing Allowance"    value={fmt(p.housing_allowance)} color="#059669" />
                        <Row label="Transport Allowance"  value={fmt(p.transport_allowance)} color="#059669" />
                        <Row label="Communication Allow." value={fmt(p.communication_allowance)} color="#059669" />
                        <Row label="Overtime Pay"         value={fmt(p.overtime_pay)} color="#059669" />
                        <Row label="Bonus"                value={fmt(p.bonus_pay)} color="#059669" />
                        <div style={{ padding: '12px 16px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Gross Pay</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{fmt(p.gross_pay)}</span>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div style={{ background: '#fff', padding: 0 }}>
                        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📉 Deductions
                          </h4>
                        </div>
                        <Row label="Income Tax"        value={fmt(p.deduction_tax)} color="#dc2626" />
                        <Row label="Pension (7%)"      value={fmt(p.deduction_pension)} color="#dc2626" />
                        <Row label="Absence Deduction" value={fmt(p.deduction_absent)} color="#dc2626" />
                        <Row label="Loan Deduction"    value={fmt(p.deduction_loan)} color="#dc2626" />
                        <div style={{ padding: '12px 16px', background: '#fff5f5', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Total Deductions</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>- {fmt(totalDeductions)}</span>
                        </div>
                        {/* Summary net pay at bottom */}
                        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>NET PAY</span>
                          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{fmt(p.net_pay)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                        Payroll processed and approved by Finance
                      </p>
                      <button
                        onClick={() => window.print()}
                        style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeePayslips;
