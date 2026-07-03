import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { playSuccessSound } from '../../utils/playNotificationSound';
import { formatDate } from '../../utils/formatters';
import styles from './HRMessages.module.css';

const HRMessages = () => {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: '',
    message: ''
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const [inboxRes, sentRes, empRes] = await Promise.all([
        hrService.getInboxMessages(),
        hrService.getSentMessages(),
        hrService.getEmployees()
      ]);
      setInbox(Array.isArray(inboxRes) ? inboxRes : inboxRes.data?.data?.messages || []);
      setSent(Array.isArray(sentRes) ? sentRes : sentRes.data?.data?.messages || []);
      setEmployees(empRes.data?.data?.employees || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      // fallback for mocks
      if (Array.isArray(err)) {
        setInbox(err);
        setSent([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await hrService.sendMessage(formData);
      playSuccessSound();
      setShowModal(false);
      fetchMessages();
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const handleRead = async (id) => {
    try {
      await hrService.readMessage(id);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await hrService.deleteMessage(id);
      fetchMessages();
    } catch (err) {
      alert("Failed to delete message");
    }
  };

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.employee_id === id);
    return emp ? emp.full_name : 'System/Unknown';
  };

  const currentList = activeTab === 'inbox' ? inbox : sent;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>HR Messages</h1>
          <p className={styles.pageSubtitle}>Direct communication between HR and employees</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>+ Compose Message</button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'inbox' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox ({inbox.filter(m => m.status === 'Unread').length} unread)
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'sent' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent Items
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{activeTab === 'inbox' ? 'From' : 'To'}</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center'}}>Loading messages...</td></tr>
            ) : currentList.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center'}}>No messages found.</td></tr>
            ) : (
              currentList.map(m => {
                const isUnread = activeTab === 'inbox' && m.status === 'Unread';
                return (
                  <tr key={m.id} className={isUnread ? styles.unreadRow : ''}>
                    <td>
                      {activeTab === 'inbox' ? getEmployeeName(m.postedBy) : getEmployeeName(m.recipientId)}
                    </td>
                    <td><strong>{m.subject}</strong><br/><span style={{fontSize: '12px', color: '#64748b'}}>{(m.message || '').substring(0, 50)}...</span></td>
                    <td>{m.date ? formatDate(m.date, 'short') : '-'}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        {isUnread && <button className={`${styles.btnSmall} ${styles.btnOutline}`} onClick={() => handleRead(m.id)}>Mark Read</button>}
                        <button className={`${styles.btnSmall} ${styles.btnOutline}`}>View</button>
                        <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(m.id)}>Delete</button>
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
              <h2>Compose Message</h2>
              <button className={styles.closeModal} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <form id="messageForm" onSubmit={handleSend}>
                <div className={styles.formGroup}>
                  <label>To (Employee)</label>
                  <select required value={formData.recipientId} onChange={e => setFormData({...formData, recipientId: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {employees.map(e => (
                      <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Subject</label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>

                <div className={styles.formGroup}>
                  <label>Message</label>
                  <textarea rows="6" required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>
              </form>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="messageForm" className={styles.btnSave}>Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMessages;
