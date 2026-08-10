import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { Search, Filter, Mail, CheckCircle, XCircle, Send, Download, Eye, MessageSquare, User, Calendar } from 'lucide-react';
import styles from './ContactMessagesManager.module.css';

const STATUS_STYLES = {
  unread:  { class: styles.statusunread,  icon: '🔵' },
  read:    { class: styles.statusread,    icon: '🟢' },
  replied: { class: styles.statusreplied, icon: '✅' },
  closed:  { class: styles.statusclosed,  icon: '✅' },
};

const DEPARTMENTS = ['', 'General Inquiry', 'Sales', 'Support', 'Complaint', 'Partnership'];

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDept) params.set('department', filterDept);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      const r = await axios.get(`/contact?${params}`);
      if (r.status === 'success') setMessages(r.data);
    } catch (_) {} finally { setLoading(false); }
  }, [filterDept, filterStatus, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const viewDetail = async (msg) => {
    try { const r = await axios.get(`/contact/${msg.id}`); if (r.status === 'success') setDetail(r.data); }
    catch (_) { setDetail(msg); }
  };

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    try { const r = await axios.put(`/contact/${detail.id}/reply`, { reply_body: replyBody }); if (r.status === 'success') { setReplyBody(''); setDetail(null); fetch(); } }
    catch (_) {}
  };

  const handleClose = async (id) => {
    try { const r = await axios.put(`/contact/${id}/close`); if (r.status === 'success') { setDetail(null); fetch(); } }
    catch (_) {}
  };

  const handleBulk = async (action) => {
    if (!selected.length) return;
    try { const r = await axios.post('/contact/bulk', { ids: selected, action }); if (r.status === 'success') { setSelected([]); fetch(); } }
    catch (_) {}
  };

  const filtered = messages.filter(m => {
    if (filterDept && m.department !== filterDept) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeTxt}>Administration</span>
          </div>
          <h1 className={styles.pageTitle}>Contact <span>Messages</span></h1>
          <p className={styles.pageSubtitle}>Manage and reply to inquiries from the public portal.</p>
        </div>
        <div className={styles.headerActions}>
          <a href="/api/v1/contact/export/csv" target="_blank" rel="noopener noreferrer" className={styles.exportBtn}>
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      <div className={styles.bodyArea}>
        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkLabel}>{selected.length} message(s) selected</span>
            <button onClick={() => handleBulk('read')} className={`${styles.bulkBtn} ${styles.bulkBtnPrimary}`}>Mark Read</button>
            <button onClick={() => handleBulk('close')} className={`${styles.bulkBtn} ${styles.bulkBtnSecondary}`}>Close</button>
            <button onClick={() => setSelected([])} className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}>Clear</button>
          </div>
        )}

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.searchWrap}>
            <Search size={16} color="var(--color-text-muted)" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, email, or subject..."
              className={styles.searchInput} 
            />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className={styles.select}>
            <option value="">All Departments</option>
            {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.select}>
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }} className={styles.center}>
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(m => m.id) : [])} checked={selected.length === filtered.length && filtered.length > 0} />
                </th>
                {['Status', 'Date', 'From', 'Department', 'Subject', 'Action'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className={styles.loading}><span className={styles.segSpinnerLg} aria-hidden="true" /><span>Loading messages...</span></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><div className={styles.empty}>No messages found matching criteria.</div></td></tr>
              ) : (
                filtered.map(m => {
                  const st = STATUS_STYLES[m.status] || {};
                  return (
                    <tr key={m.id} className={m.status === 'unread' ? styles.rowUnread : ''}>
                      <td className={styles.center}>
                        <input type="checkbox" checked={selected.includes(m.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, m.id] : prev.filter(x => x !== m.id))} />
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${st.class}`}>
                          {st.icon} {m.status}
                        </span>
                      </td>
                      <td>
                        {new Date(m.created_at).toLocaleDateString('en-CA')}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userName}>{m.full_name}</span>
                          <span className={styles.userEmail}>{m.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.deptTag}>{m.department}</span>
                      </td>
                      <td>
                        <div className={styles.subjectCell} title={m.subject}>{m.subject}</div>
                      </td>
                      <td>
                        <button onClick={() => viewDetail(m)} className={styles.actionBtn}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {detail && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Message Detail</h3>
              <button onClick={() => setDetail(null)} className={styles.closeBtn}>
                <XCircle size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>From</span>
                  <span className={styles.metaValue}>{detail.full_name}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Email</span>
                  <span className={styles.metaValue}>{detail.email}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Phone</span>
                  <span className={styles.metaValue}>{detail.phone || '—'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Department</span>
                  <span className={styles.metaValue}>{detail.department}</span>
                </div>
                <div className={`${styles.metaItem} ${styles.metaItemFull}`}>
                  <span className={styles.metaLabel}>Subject</span>
                  <span className={styles.metaValue}>{detail.subject}</span>
                </div>
                <div className={`${styles.metaItem} ${styles.metaItemFull}`}>
                  <span className={styles.metaLabel}>Date</span>
                  <span className={styles.metaValue}>{new Date(detail.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className={styles.metaLabel} style={{display:'block', marginBottom:'6px'}}>Message</span>
                <div className={styles.messageBlock}>{detail.message}</div>
              </div>

              {detail.attachment && (
                <div>
                  <a href={`/uploads/contact/${detail.attachment}`} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                    <Download size={14} /> View Attachment ({detail.attachment})
                  </a>
                </div>
              )}

              <div className={styles.replySection}>
                <label>Reply to User</label>
                <textarea 
                  value={replyBody} 
                  onChange={e => setReplyBody(e.target.value)} 
                  placeholder="Type your reply here... (Will send an email)"
                  className={styles.replyTextarea}
                />
                <button 
                  onClick={handleReply} 
                  disabled={!replyBody.trim()} 
                  className={styles.sendReplyBtn}
                >
                  <Send size={14} /> Send Reply
                </button>
              </div>

              {detail.admin_notes && (
                <div className={styles.adminNotes}>
                  <strong>Admin Notes:</strong> {detail.admin_notes}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setDetail(null)} className={styles.cancelBtn}>Close</button>
              {detail.status !== 'closed' && (
                <button onClick={() => handleClose(detail.id)} className={styles.bulkBtnDanger} style={{height:'36px', padding:'0 16px', borderRadius:'8px', display:'inline-flex', alignItems:'center', gap:'6px', fontWeight:500, fontSize:'14px'}}>
                  <XCircle size={14} /> Mark as Closed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

