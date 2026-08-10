import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { EmployeeOverview } from './overview/EmployeeOverview';
import { TodayTasks, MyTasks, InProgressTasks, CompletedTasks } from './tasks/TaskViews';
import { SubmitWork, DailyReport, WorkHistory } from './work/WorkPages';
import { AttendancePage } from './attendance/AttendancePage';
import { AssignedMaterials, RequestMaterials, ReturnItems } from './resources/ResourcePages';
import { Messages, SupervisorNotes, Announcements, NotificationsInbox } from './communication/CommunicationPages';
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
        { label: 'Work History', path: '/employee/work/history',        icon: 'archive' },
        { label: 'My Payslips',  path: '/employee/payslips',            icon: 'banknote', color: '#059669' },
        { label: 'Material',     path: '/employee/materials/assigned',  icon: 'package' },
      ]
    },
    { type: 'divider' },
    { label: 'Communication', icon: 'message-circle',
      children: [
        { label: 'Messages',      path: '/employee/comm/messages',      icon: 'message-circle' },
        { label: 'Announcements', path: '/employee/comm/announcements', icon: 'bell' },
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
        <Route path="work/history"        element={<WorkHistory />} />
        <Route path="attendance"          element={<AttendancePage />} />
        <Route path="payslips"            element={<EmployeePayslips />} />

        {/* Resources */}
        <Route path="materials/assigned"  element={<AssignedMaterials />} />
        <Route path="materials/request"   element={<RequestMaterials />} />
        <Route path="materials/return"    element={<ReturnItems />} />

        {/* Communication */}
        <Route path="comm/messages"       element={<Messages />} />
        <Route path="comm/notes"          element={<SupervisorNotes />} />
        <Route path="comm/announcements"  element={<Announcements />} />
        <Route path="audit-log"           element={<CentralAuditLog />} />

        <Route path="/"                   element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default EmployeePortalDashboard;
