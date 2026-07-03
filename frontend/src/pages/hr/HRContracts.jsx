import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRContracts.module.css';

const HRContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    contractType: 'Permanent',
    startDate: '',
    endDate: '',
    baseSalary: '',
    workingHours: '40',
    leaveEntitlement: '20',
    probationPeriod: '',
    specialTerms: ''
  });

  const [expiringContracts, setExpiringContracts] = useState([]);
  const [expiredContracts, setExpiredContracts] = useState([]);
  const [hideExpiring, setHideExpiring] = useState(false);
  const [hideExpired, setHideExpired] = useState(false);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await hrService.getContracts();
      const data = res.data?.data?.contracts || [];
      setContracts(data);
      
      // Calculate expiring and expired
      const now = new Date();
      const expSoon = [];
      const exp = [];
      data.forEach(c => {
        if (c.status !== 'Terminated' && c.endDate) {
          const end = new Date(c.endDate);
          const diffDays = (end - now) / (1000 * 60 * 60 * 24);
          if (diffDays < 0 && c.status !== 'Expired') {
            exp.push(c);
          } else if (diffDays >= 0 && diffDays <= 30) {
            expSoon.push(c);
          }
        }
      });
      setExpiringContracts(expSoon);
      setExpiredContracts(exp);
      
      // Load employees for the dropdown
      const empRes = await hrService.getEmployees();
      setEmployees(empRes.data?.data?.employees || []);
    } catch (err) {
      console.error("Failed to fetch contracts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleExport = () => {
    window.open(hrService.getExportUrl('contracts'), '_blank');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await hrService.createContract(formData);
      playSuccessSound();
      setShowModal(false);
      fetchContracts();
    } catch (err) {
      alert("Failed to create contract");
    }
  };

  const handleApprove = async (id) => {
    try {
      await hrService.approveContract(id);
      fetchContracts();
    } catch (err) {
      alert("Failed to approve contract");
    }
  };

  const handleRenew = async (id) => {
    try {
      await hrService.renewContract(id, {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      });
      playSuccessSound();
      fetchContracts();
    } catch (err) {
      alert("Failed to renew contract");
    }
  };

  const handleTerminate = async (id) => {
    const reason = window.prompt("Reason for termination:");
    if (!reason) return;
    try {
      await hrService.terminateContract(id, { reason });
      fetchContracts();
    } catch (err) {
      alert("Failed to terminate contract");
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Active': return styles.badgeActive;
      case 'Expired': return styles.badgeExpired;
      case 'Terminated': return styles.badgeTerminated;
      default: return styles.badgeDefault;
    }
  };

  const filtered = contracts.filter(c => {
    const emp = employees.find(e => e.employee_id === c.employeeId) || {};
    const matchSearch = (emp.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Contracts</h1>
          <p className={styles.pageSubtitle}>Manage employment contracts, renewals, and expirations</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.exportBtn} onClick={handleExport}>Export PDF/Excel</button>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Create Contract</button>
        </div>
      </div>

      <div className={styles.alertsContainer}>
        {expiringContracts.length > 0 && !hideExpiring && (
          <div className={`${styles.alertBanner} ${styles.alertExpiring}`}>
            <span>⚠️ <strong>{expiringContracts.length}</strong> contracts are expiring within the next 30 days.</span>
            <button className={styles.closeAlertBtn} onClick={() => setHideExpiring(true)}>×</button>
          </div>
        )}
        {expiredContracts.length > 0 && !hideExpired && (
          <div className={`${styles.alertBanner} ${styles.alertExpired}`}>
            <span>🚨 <strong>{expiredContracts.length}</strong> contracts have already expired and need attention!</span>
            <button className={styles.closeAlertBtn} onClick={() => setHideExpired(true)}>×</button>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search by employee name..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading contracts...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>No contracts found.</td></tr>
            ) : (
              filtered.map(c => {
                const emp = employees.find(e => e.employee_id === c.employeeId) || {};
                return (
                  <tr key={c.id}>
                    <td><strong>{emp.full_name || 'Unknown'}</strong><br/><small>{c.employeeId}</small></td>
                    <td>{emp.department || 'N/A'}</td>
                    <td>{c.contractType}</td>
                    <td>{formatDate(c.startDate, 'short')}</td>
                    <td>{c.endDate ? formatDate(c.endDate, 'short') : 'Indefinite'}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(c.status)}`}>{c.status}</span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {c.status === 'Pending' && <button className={`${styles.btnSmall} ${styles.btnApprove}`} onClick={() => handleApprove(c.id)}>Approve</button>}
                        {(c.status === 'Active' || c.status === 'Expired') && <button className={`${styles.btnSmall} ${styles.btnOutline}`} onClick={() => handleRenew(c.id)}>Renew</button>}
                        {c.status === 'Active' && <button className={`${styles.btnSmall} ${styles.btnTerminate}`} onClick={() => handleTerminate(c.id)}>Terminate</button>}
                        <a href={hrService.getContractDocumentUrl(c.id)} target="_blank" rel="noreferrer" className={`${styles.btnSmall} ${styles.btnOutline}`} style={{textDecoration: 'none'}}>View Doc</a>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create Contract</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="contractForm" onSubmit={handleCreate}>
                <div className={styles.formGroup}>
                  <label>Employee</label>
                  <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{display: 'flex', gap: '16px'}}>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Contract Type</label>
                    <select required value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})}>
                      <option>Permanent</option>
                      <option>Temporary</option>
                      <option>Probation</option>
                      <option>Consultant</option>
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Base Salary (Base truth for Payroll)</label>
                    <input type="number" required value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
                  </div>
                </div>
                
                {formData.contractType === 'Probation' && (
                  <div className={styles.formGroup}>
                    <label>Probation Period (Months)</label>
                    <input type="number" value={formData.probationPeriod} onChange={e => setFormData({...formData, probationPeriod: e.target.value})} />
                  </div>
                )}

                <div style={{display: 'flex', gap: '16px'}}>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>Start Date</label>
                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label>End Date (Optional for Permanent)</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Special Terms / Conditions</label>
                  <textarea rows="3" value={formData.specialTerms} onChange={e => setFormData({...formData, specialTerms: e.target.value})}></textarea>
                </div>

                <div className={styles.formGroup}>
                  <label>Upload Contract Document (PDF/Word)</label>
                  <div className={styles.fileUploadBox}>
                    Click to browse or drag and drop file here
                  </div>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="contractForm" className={styles.btnSave}>Create Contract</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRContracts;
