import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playInfoSound, playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRDeductions.module.css';

const INIT_FORM = {
  employeeId: '', type: 'Tax/PAYE', amountType: 'Fixed', amount: '', frequency: 'Monthly',
  startDate: '', endDate: '', description: ''
};

const HRDeductions = () => {
  const [deductions, setDeductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, dedRes] = await Promise.all([
        hrService.etp.listEmployees(),
        hrService.getDeductions()
      ]);
      setEmployees(empRes.data?.data || empRes.data || []);
      setDeductions(dedRes.data?.deductions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      let finalAmount = parseFloat(formData.amount);
      if (formData.amountType === 'Percentage') {
        const selectedEmp = employees.find(emp => emp.employee_id === formData.employeeId);
        if (selectedEmp && selectedEmp.base_salary) {
          finalAmount = (parseFloat(selectedEmp.base_salary) * finalAmount) / 100;
        } else {
          throw new Error('Employee base salary not found for percentage calculation.');
        }
      }

      const payload = { ...formData, amount: finalAmount };
      await hrService.createDeduction(payload);
      playSuccessSound();
      setStatusMsg({ type: 'success', text: '✅ Deduction added successfully.' });
      setShowAddModal(false);
      setFormData(INIT_FORM);
      fetchAll();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to add deduction.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this deduction?')) return;
    try {
      await hrService.deleteDeduction(id);
      playInfoSound();
      fetchAll();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to cancel deduction.' });
    }
  };

  const statusColor = (s) => {
    if (s === 'Active') return { background: '#d1fae5', color: '#065f46' };
    if (s === 'Cancelled') return { background: '#fee2e2', color: '#991b1b' };
    return {};
  };

  return (
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* ══ WORLD-CLASS HERO HEADER — DEDUCTIONS ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #831843 0%, #be123c 40%, #e11d48 70%, #f43f5e 100%)',
        borderRadius: 0,
        padding: '36px 24px 40px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Glowing orbs */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,113,133,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,205,211,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(254,226,226,0.2)', border: '1px solid rgba(254,226,226,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fef08a', display: 'inline-block', boxShadow: '0 0 8px #fef08a' }} />
              <span style={{ color: '#ffe4e6', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Finance · Deductions</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Manage
              <span style={{ background: 'linear-gradient(90deg, #fecdd3, #fff1f2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Deductions</span>
            </h1>
            <p style={{ margin: 0, color: '#fecdd3', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              Manage employee salary deductions, taxes, and loans.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              Export PDF
            </button>
            <button onClick={() => { setShowAddModal(true); setStatusMsg({ type: null, text: '' }); }} style={{ padding: '12px 20px', background: '#ffffff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, color: '#e11d48', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              + Add Deduction
            </button>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 12,
          background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
          fontWeight: 500, fontSize: '0.9rem'
        }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ padding: '0 24px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 18, fontWeight: 600 }}>Loading deductions...</div>
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
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Type & Freq</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Period</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No deductions found.</td></tr>
                ) : (
                  deductions.map((d, index) => (
                    <tr key={d.id}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                    >
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{d.employeeName || 'Unknown'}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>#{d.employee_id}</div>
                      </td>
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{d.type}</div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>{d.frequency}</div>
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right' }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                          color: '#e11d48', padding: '6px 12px', borderRadius: '8px', 
                          fontWeight: 800, fontSize: '15px', border: '1px solid #fecaca' 
                        }}>
                          {parseFloat(d.amount).toLocaleString()} ETB
                        </span>
                      </td>
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>From:</span> {d.start_date ? new Date(d.start_date).toLocaleDateString() : '—'}
                        </div>
                        <div style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                          <span style={{ color: '#94a3b8' }}>To:</span> {d.end_date ? new Date(d.end_date).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 20px', maxWidth: 180 }}>
                        <div style={{ color: '#475569', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.description || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'center' }}>
                        <span style={{ 
                          ...statusColor(d.status), 
                          padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' 
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                        {d.status === 'Active' && (
                          <button onClick={() => handleCancel(d.id)} style={{ padding: '6px 12px', background: '#ffffff', color: '#e11d48', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }} onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalWide} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Add New Deduction</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Fill in all fields to assign a deduction to an employee</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalGridBody}>

                {/* Row 1: Employee | Type | Amount Type */}
                <div className={styles.formGroup}>
                  <label>Employee *</label>
                  <select required className={styles.input} value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}>
                    <option value="">Select Employee...</option>
                    {employees.filter(emp => emp.employment_status === 'Active' && String(emp.employee_id || '').startsWith('EMP-')).map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} ({emp.employee_id}) - {parseFloat(emp.base_salary || 0).toLocaleString()} ETB
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select className={styles.input} value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Tax/PAYE</option>
                    <option>Pension</option>
                    <option>Loan</option>
                    <option>Insurance</option>
                    <option>Union Dues</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Deduction Format</label>
                  <select className={styles.input} value={formData.amountType || 'Fixed'}
                    onChange={e => setFormData({ ...formData, amountType: e.target.value })}>
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage of Salary (%)</option>
                  </select>
                </div>

                {/* Row 2: Amount | Frequency | Start Date */}
                <div className={styles.formGroup}>
                  <label>{formData.amountType === 'Percentage' ? 'Percentage (%) *' : 'Amount (ETB) *'}</label>
                  <input required type="number" step="0.01" min="0" className={styles.input}
                    placeholder={formData.amountType === 'Percentage' ? "e.g. 5" : "e.g. 500.00"}
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>

                {/* Row 2: Frequency | Start Date | End Date */}
                <div className={styles.formGroup}>
                  <label>Frequency</label>
                  <select className={styles.input} value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                    <option>Monthly</option>
                    <option>One-time</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Start Date *</label>
                  <input required type="date" className={styles.input} value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label>End Date (Optional)</label>
                  <input type="date" className={styles.input} value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>

                {/* Row 3: Description full width */}
                <div className={styles.formGroupFull}>
                  <label>Description</label>
                  <input type="text" className={styles.input} placeholder="Brief reason (e.g. Employee loan repayment)"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

              </div>

              {/* Footer: status message + buttons inline */}
              <div className={styles.modalFooter}>
                <div className={styles.footerStatus}>
                  {statusMsg.text && (
                    <span style={{
                      padding: '8px 14px', borderRadius: 6,
                      background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                      color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
                      fontSize: 13, fontWeight: 500
                    }}>
                      {statusMsg.text}
                    </span>
                  )}
                </div>
                <div className={styles.footerBtns}>
                  <button type="button" className={styles.cancelBtn} onClick={() => { setShowAddModal(false); setStatusMsg({ type: null, text: '' }); }}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? 'Saving...' : '+ Add Deduction'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDeductions;
