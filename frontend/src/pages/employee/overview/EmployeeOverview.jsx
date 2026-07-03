import React, { useState, useEffect } from 'react';
import { employeePortalState, SESSION_EMPLOYEE_ID } from '../../../utils/employeePortalState';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={24} />
    </div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{value}</div>
    </div>
  </div>
);

export const EmployeeOverview = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetch = () => {
      try {
        setSummary(employeePortalState.getDashboardSummary(SESSION_EMPLOYEE_ID));
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
    return employeePortalState.subscribe(fetch);
  }, []);

  if (!summary) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Overview</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Welcome back. Here is your status for {summary.date}.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Tasks Assigned" value={summary.totalTasksAssigned} icon={ClipboardList} color="#3b82f6" />
        <StatCard title="Completed Today" value={summary.tasksCompletedToday} icon={CheckCircle} color="#10b981" />
        <StatCard title="Pending Tasks" value={summary.tasksPending} icon={Clock} color="#f59e0b" />
        <StatCard title="Overdue Tasks" value={summary.tasksOverdue} icon={AlertTriangle} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#64748b" /> Attendance & Leave
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569' }}>Today's Status</span>
              <span style={{ fontWeight: '600', color: summary.todayAttendance === 'present' ? '#10b981' : '#64748b', textTransform: 'capitalize' }}>
                {summary.todayAttendance.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569' }}>Days Worked (This Month)</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{summary.workDaysThisMonth.worked} / {summary.workDaysThisMonth.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Leave Days Taken</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{summary.leaveDaysTaken}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Profile Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569' }}>Department</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{summary.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569' }}>Manager</span>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{summary.manager}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Performance Score</span>
              <span style={{ fontWeight: '600', color: '#94a3b8', fontStyle: 'italic' }}>
                {summary.performanceScore || 'Not yet available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
