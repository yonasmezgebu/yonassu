import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import styles from './POPayments.module.css';

const FinancePayrollPayments = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchApproved = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr/etp/payroll/approved-list');
      setPayrolls(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApproved(); }, []);

  const handleMarkPaid = async (m, y) => {
    setPaying(`${m}-${y}`);
    try {
      await apiClient.post('/hr/etp/payroll/mark-paid', { month: m, year: y, payment_method: 'Bank Transfer' });
      setSuccessMsg(`Payroll for ${m}/${y} marked as paid`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchApproved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payroll as paid');
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className={styles.loading}>Loading approved payrolls...</div>;

  return (
    <div className={styles.paymentTracking}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Payroll Payments</h2>
          <p>Review and pay approved payrolls</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {successMsg}
        </div>
      )}

      {payrolls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <p style={{ fontSize: 16 }}>No approved payrolls pending payment.</p>
        </div>
      ) : (
        <table className={styles.paymentsTable}>
          <thead>
            <tr>
              <th>Period</th>
              <th>Employees</th>
              <th>Gross Pay</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(p => (
              <tr key={`${p.month_number}-${p.year_number}`}>
                <td><strong>{p.month_number}/{p.year_number}</strong></td>
                <td>{p.total_employees}</td>
                <td>{formatCurrency(p.company_gross_pay)}</td>
                <td>{formatCurrency(p.total_deductions)}</td>
                <td><strong>{formatCurrency(p.company_net_pay)}</strong></td>
                <td>
                  <button
                    style={{
                      background: '#059669', color: '#fff', border: 'none',
                      padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 13, fontWeight: 600,
                      opacity: paying === `${p.month_number}-${p.year_number}` ? 0.6 : 1,
                    }}
                    disabled={paying === `${p.month_number}-${p.year_number}`}
                    onClick={() => handleMarkPaid(p.month_number, p.year_number)}
                  >
                    {paying === `${p.month_number}-${p.year_number}` ? 'Processing...' : 'Mark as Paid'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FinancePayrollPayments;
