import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import styles from './HRJobPosts.module.css';

const HRJobPosts = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '', department: '', location: '', description: '', requirements: '', 
    experience: 'Entry', salaryRange: '', deadline: '', isInternal: false
  });

  const fetchData = async () => {
    try {
      const [jRes, dRes] = await Promise.all([
        hrService.getJobPosts(),
        hrService.getDepartmentsDashboard()
      ]);
      setJobs(jRes.data?.data?.jobs || []);
      setDepartments(dRes.data?.data?.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await hrService.createJobPost(formData);
      playSuccessSound();
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to post job');
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
    try {
      await hrService.updateJobPost(job.id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Job Posts</h1>
          <p className={styles.pageSubtitle}>Manage internal and external job listings.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn} onClick={() => window.print()}>Export PDF</button>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Post Job</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading jobs...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Post Date</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th>Status</th>
                <th className={styles.noPrint}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={8} className={styles.empty}>No job posts found.</td></tr>
              ) : (
                jobs.map(j => (
                  <tr key={j.id}>
                    <td className={styles.jobTitle}>{j.title} {j.isInternal && <span className={styles.internalBadge}>Internal</span>}</td>
                    <td>{j.department}</td>
                    <td>{j.location}</td>
                    <td>{new Date(j.postDate).toLocaleDateString()}</td>
                    <td className={styles.deadline}>{j.deadline}</td>
                    <td><span className={styles.appCount}>{j.applicantCount}</span></td>
                    <td>
                      <span className={styles.statusBadge + ' ' + styles[j.status]}>{j.status}</span>
                    </td>
                    <td className={styles.noPrint}>
                      <button className={styles.actionBtn} onClick={() => handleToggleStatus(j)}>
                        {j.status === 'Open' ? 'Close Job' : 'Reopen'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Post New Job</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Job Title *</label>
                    <input required type="text" className={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Department *</label>
                    <select required className={styles.input} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option value="">Select...</option>
                      {departments.map(d => (
                        <option key={d.dept_id} value={d.dept_name}>{d.dept_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input type="text" className={styles.input} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Experience Level</label>
                    <select className={styles.input} value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})}>
                      <option>Entry Level</option>
                      <option>Mid Level</option>
                      <option>Senior</option>
                      <option>Executive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Salary Range</label>
                    <input type="text" placeholder="e.g. $50k - $70k" className={styles.input} value={formData.salaryRange} onChange={e => setFormData({...formData, salaryRange: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Application Deadline</label>
                    <input type="date" required className={styles.input} value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea required className={styles.input} rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Requirements</label>
                  <textarea required className={styles.input} rows="3" value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})}></textarea>
                </div>

                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="internalOnly" checked={formData.isInternal} onChange={e => setFormData({...formData, isInternal: e.target.checked})} />
                  <label htmlFor="internalOnly">Internal Post Only (Company Portal)</label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Publish Job</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRJobPosts;
