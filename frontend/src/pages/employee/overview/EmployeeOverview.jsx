import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, Calendar, User } from 'lucide-react';
import apiClient from '../../../services/apiClient';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      const fallback = {
        totalTasksAssigned: 0,
        tasksCompletedToday: 0,
        tasksPending: 0,
        tasksOverdue: 0,
        department: '—',
        manager: '—',
        todayAttendance: 'present',
        workDaysThisMonth: { worked: 0, total: 22 },
        leaveDaysTaken: 0,
        performanceScore: 'N/A'
      };
      try {
        const res = await apiClient.get('/employee-tasks/overview');
        // Normalize: API might return res.data directly or wrapped in res.data.data
        const raw = res?.data?.data || res?.data || {};
        // Validate it has the expected shape
        if (raw && typeof raw.totalTasksAssigned !== 'undefined') {
          setSummary(raw);
        } else {
          setSummary(fallback);
        }
      } catch (err) {
        console.error('Overview fetch failed:', err);
        setSummary(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
      <p style={{ color: '#64748b' }}>Loading your overview...</p>
    </div>
  );

  // Guard: should never reach here but prevents crash if summary is still null
  if (!summary) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Dashboard Overview</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Welcome back. Here is your current work status for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Total Tasks Assigned" value={summary.totalTasksAssigned} icon={ClipboardList} color="#3b82f6" />
        <StatCard title="Completed Today" value={summary.tasksCompletedToday} icon={CheckCircle} color="#10b981" />
        <StatCard title="Pending Tasks" value={summary.tasksPending} icon={Clock} color="#f59e0b" />
        <StatCard title="Overdue Tasks" value={summary.tasksOverdue} icon={AlertTriangle} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Attendance & Leave Widget */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#64748b" /> Attendance & Leave
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Today's Status</span>
              <span style={{ fontWeight: '700', padding: '4px 12px', borderRadius: '20px', backgroundColor: summary.todayAttendance === 'present' ? '#d1fae5' : '#f1f5f9', color: summary.todayAttendance === 'present' ? '#059669' : '#64748b', textTransform: 'capitalize', fontSize: '13px' }}>
                {summary.todayAttendance.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Days Worked (This Month)</span>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{summary.workDaysThisMonth.worked} / {summary.workDaysThisMonth.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Leave Days Taken</span>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{summary.leaveDaysTaken}</span>
            </div>
          </div>
        </div>

        {/* Profile Details Widget */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#64748b" /> Profile Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Department</span>
              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{summary.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Direct Manager</span>
              <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{summary.manager}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>Performance Score</span>
              <span style={{ fontWeight: '700', color: '#3b82f6', fontSize: '16px' }}>
                {summary.performanceScore || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
