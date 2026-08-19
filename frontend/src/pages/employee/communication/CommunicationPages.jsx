import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { Bell } from 'lucide-react';




// ─── Notifications Inbox ────────────────────────────────────────────────────
export const NotificationsInbox = () => {
  const [notifications, setNotifications] = useState([]);

  const fetch = () => setNotifications(employeePortalState.getNotifications(SESSION_EMPLOYEE_ID));
  useEffect(() => { fetch(); return employeePortalState.subscribe(fetch); }, []);

  const handleMarkRead = (id) => employeePortalState.markNotificationRead(SESSION_EMPLOYEE_ID, id);
  const handleMarkAll = () => employeePortalState.markAllNotificationsRead(SESSION_EMPLOYEE_ID);
  const handleClear = () => employeePortalState.clearNotifications(SESSION_EMPLOYEE_ID);

  const typeIcon = { task_assigned: '📋', deadline_approaching: '⏰', task_approved: '✅', task_rejected: '❌', attendance_verified: '🕐', submission_approved: '✅', submission_rejected: '❌', material_requested: '📝', material_returned: '🔄' };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Notifications
            {unreadCount > 0 && <span style={{ backgroundColor: '#3b82f6', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '14px', fontWeight: '700' }}>{unreadCount}</span>}
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Your activity and event inbox.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleMarkAll} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#475569' }}>Mark All Read</button>
          <button onClick={handleClear} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#ef4444' }}>Clear All</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map(n => (
          <div key={n.id} onClick={() => handleMarkRead(n.id)} style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: n.is_read ? '1px solid #e2e8f0' : '4px solid #3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background 0.1s' }}>
            <div style={{ fontSize: '22px', flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? '600' : '800', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>{n.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{n.body}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{new Date(n.created_at).toLocaleString()}</div>
            {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }} />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div>You are all caught up!</div>
          </div>
        )}
      </div>
    </div>
  );
};
