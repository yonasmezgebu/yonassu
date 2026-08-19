import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { EmployeeOverview } from './overview/EmployeeOverview';
import { TodayTasks, MyTasks, InProgressTasks, CompletedTasks } from './tasks/TaskViews';
import { SubmitWork, DailyReport } from './work/WorkPages';
import { AttendancePage } from './attendance/AttendancePage';
import ManagerChat from '../../components/ManagerChat';
import { NotificationsInbox } from './communication/CommunicationPages';
import EmployeePayslips from './EmployeePayslips';
import CentralAuditLog from '../admin/CentralAuditLog';

const EmployeePortalDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/employee/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'My Work', icon: 'briefcase',
      children: [
        { label: 'My Tasks',     path: '/employee/tasks/mine',          icon: 'list' },
        { label: 'Daily Report', path: '/employee/work/daily-report',   icon: 'file-text' },
        { label: 'My Payslips',  path: '/employee/payslips',            icon: 'banknote', color: '#059669' },
      ]
    },
    { type: 'divider' },
    { label: 'Communication', icon: 'message-circle',
      children: [
        { label: 'Chat', path: '/employee/comm/chat', icon: 'message-square', color: '#6366f1' },
      ]
    },
    { type: 'divider' },
    { label: 'Audit Log', path: '/employee/audit-log', icon: 'clipboard', color: '#6366f1' },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="Employee Portal">
      <Routes>
        {/* Dashboard */}
        <Route path="overview"            element={<EmployeeOverview />} />
        <Route path="notifications"       element={<NotificationsInbox />} />

        {/* Tasks */}
        <Route path="tasks/today"         element={<TodayTasks />} />
        <Route path="tasks/mine"          element={<MyTasks />} />
        <Route path="tasks/in-progress"   element={<InProgressTasks />} />
        <Route path="tasks/completed"     element={<CompletedTasks />} />

        {/* Work */}
        <Route path="work/submit"         element={<SubmitWork />} />
        <Route path="work/daily-report"   element={<DailyReport />} />
        <Route path="attendance"          element={<AttendancePage />} />
        <Route path="payslips"            element={<EmployeePayslips />} />

        {/* Communication */}
        <Route path="comm/chat"           element={<ManagerChat />} />
        <Route path="audit-log"           element={<CentralAuditLog />} />

        <Route path="/"                   element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default EmployeePortalDashboard;
