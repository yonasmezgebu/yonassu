import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRPayroll.module.css';

const HRPayroll = () => {
  const [salaries, setSalaries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });
  const [editForm, setEditForm] = useState({ baseSalary: 0, allowances: 0, bank_name: '', bank_account_number: '' });

  const fetchDepartments = async () => {
    try {
      const res = await hrService.etp.getDepartments();
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department) params.department = department;
      const res = await hrService.getSalaries(params);
      setSalaries(res.data?.salaries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [department]);

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setEditForm({
      baseSalary: emp.baseSalary,
      allowances: emp.allowances,
      bank_name: emp.bank_name || '',
      bank_account_number: (emp.bankAccount && emp.bankAccount !== 'N/A') ? emp.bankAccount : '',
    });
    setStatusMsg({ type: null, text: '' });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg({ type: null, text: '' });
    try {
      await hrService.updateSalary(selectedEmp.id, editForm);
      playSuccessSound();
      setStatusMsg({ type: 'success', text: `✅ Salary updated for ${selectedEmp.name}.` });
      setShowEditModal(false);
      fetchSalaries();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update salary.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredSalaries = salaries.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalNet = filteredSalaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalBase = filteredSalaries.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
  const fmtN = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={styles.container} style={{ margin: 0, padding: 0 }}>
      {/* ══ WORLD-CLASS HERO HEADER — SALARY LIST ══ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #059669 70%, #10b981 100%)',
        borderRadius: 0,
        padding: '36px 24px 40px',
        overflow: 'hidden',
      }}>
        {/* Glowing orbs — teal & gold tones */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Top Header Row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,243,208,0.2)', border: '1px solid rgba(167,243,208,0.4)', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15', display: 'inline-block', boxShadow: '0 0 8px #facc15' }} />
              <span style={{ color: '#a7f3d0', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Finance · Salary List</span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Employee
              <span style={{ background: 'linear-gradient(90deg, #facc15, #fef08a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 12 }}>Salaries</span>
            </h1>
            <p style={{ margin: 0, color: '#a7f3d0', fontSize: 15, fontWeight: 400, opacity: 0.9 }}>
              Manage base salaries, allowances, and banking information.
            </p>
          </div>

          <button onClick={() => window.print()} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Export PDF
          </button>
        </div>

        {/* Dashboard Cards Row */}
        {!loading && filteredSalaries.length > 0 && (
          <div style={{ position: 'relative', zIndex: 2, marginTop: 36, display: 'flex', gap: 20, alignItems: 'stretch' }}>
            
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Employees</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>{filteredSalaries.length}</div>
            </div>

            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Base Salary</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>{fmtN(totalBase)} <span style={{ fontSize: 16, color: '#d1fae5' }}>ETB</span></div>
            </div>

            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Net Salary</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#facc15', textShadow: '0 2px 10px rgba(250,204,21,0.3)' }}>{fmtN(totalNet)} <span style={{ fontSize: 16, color: '#fef08a' }}>ETB</span></div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px' }}>
        {statusMsg.text && (
          <div style={{
            marginTop: 20, padding: '12px 16px', borderRadius: 12,
            background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
            fontWeight: 600, fontSize: '15px', border: `1px solid ${statusMsg.type === 'success' ? '#34d399' : '#f87171'}`
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 16, top: 14, color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: 500 }}
            />
          </div>
          <select value={department} onChange={e => setDepartment(e.target.value)} style={{ padding: '14px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: 600, minWidth: 200, cursor: 'pointer' }}>
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

      <div style={{ padding: '0 24px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 18, fontWeight: 600 }}>Loading salaries...</div>
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
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Department & Role</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Base Salary</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Allowances</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Net Salary</th>
                  <th style={{ padding: '24px 20px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bank Account</th>
                  <th style={{ padding: '24px 32px', fontWeight: 700, color: '#64748b', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 16 }}>No records found.</td></tr>
                ) : (
                  filteredSalaries.map((s, index) => (
                    <tr key={s.id}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                    >
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{s.name}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>#{s.id}</div>
                      </td>
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '14px' }}>{s.department || '—'}</div>
                        <div style={{ color: '#64748b', fontSize: '13px' }}>{s.role || '—'}</div>
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                        {fmtN(s.baseSalary)} ETB
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                        {s.allowances > 0 ? `+${fmtN(s.allowances)} ETB` : '—'}
                      </td>
                      <td style={{ padding: '20px 20px', textAlign: 'right' }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                          color: '#16a34a', padding: '6px 12px', borderRadius: '8px', 
                          fontWeight: 800, fontSize: '15px', border: '1px solid #bbf7d0' 
                        }}>
                          {fmtN(s.netSalary)}
                        </span>
                      </td>
                      <td style={{ padding: '20px 20px' }}>
                        <div style={{ fontFamily: 'monospace', color: '#475569', fontSize: '13px', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{s.bankAccount || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                        <button onClick={() => openEdit(s)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}>
                          Edit
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
      </div>

      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Salary: {selectedEmp?.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12, background: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>
                <strong>Emp ID:</strong> {selectedEmp?.id} &nbsp;|&nbsp;
                <strong>Department:</strong> {selectedEmp?.department} &nbsp;|&nbsp;
                <strong>Bank:</strong> {selectedEmp?.bankAccount}
              </div>
              <div className={styles.formGroup}>
                <label>Base Salary</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.baseSalary}
                  onChange={e => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Total Allowances (Housing + Transport + Comms)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.allowances}
                  onChange={e => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  value={editForm.bank_name}
                  onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Bank Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={editForm.bank_account_number}
                  onChange={e => setEditForm({ ...editForm, bank_account_number: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                Estimated Net: {fmtN(editForm.baseSalary + editForm.allowances)} ETB
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayroll;
