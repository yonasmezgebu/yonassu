import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { EmployeeOverview } from './overview/EmployeeOverview';
import { TodayTasks, MyTasks, InProgressTasks, CompletedTasks } from './tasks/TaskViews';
import { SubmitWork, DailyReport, WorkHistory } from './work/WorkPages';
import { AttendancePage } from './attendance/AttendancePage';
import { AssignedMaterials, RequestMaterials, ReturnItems } from './resources/ResourcePages';
import { Messages, SupervisorNotes, Announcements, NotificationsInbox } from './communication/CommunicationPages';

const EmployeePortalDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', icon: 'home',
      children: [
        { label: 'Overview',       path: '/employee/overview',      icon: 'home' },
        { label: "Today's Tasks",  path: '/employee/tasks/today',   icon: 'clipboard' },
        { label: 'Notifications',  path: '/employee/notifications', icon: 'bell' },
      ]
    },
    { type: 'divider' },
    { label: 'Tasks', icon: 'clipboard',
      children: [
        { label: 'My Tasks',    path: '/employee/tasks/mine',        icon: 'list' },
        { label: 'In Progress', path: '/employee/tasks/in-progress', icon: 'trending-up' },
        { label: 'Completed',   path: '/employee/tasks/completed',   icon: 'check-circle' },
      ]
    },
    { type: 'divider' },
    { label: 'Work', icon: 'file-text',
      children: [
        { label: 'Submit Work',  path: '/employee/work/submit',       icon: 'upload' },
        { label: 'Daily Report', path: '/employee/work/daily-report', icon: 'file-text' },
        { label: 'Attendance',   path: '/employee/attendance',        icon: 'clock' },
        { label: 'Work History', path: '/employee/work/history',      icon: 'archive' },
      ]
    },
    { type: 'divider' },
    { label: 'Resources', icon: 'package',
      children: [
        { label: 'Assigned Materials', path: '/employee/materials/assigned', icon: 'package' },
        { label: 'Request Materials',  path: '/employee/materials/request',  icon: 'file-plus' },
        { label: 'Return Items',       path: '/employee/materials/return',   icon: 'rotate-ccw' },
      ]
    },
    { type: 'divider' },
    { label: 'Communication', icon: 'message-circle',
      children: [
        { label: 'Messages',          path: '/employee/comm/messages',      icon: 'message-circle' },
        { label: 'Supervisor Notes',  path: '/employee/comm/notes',         icon: 'file-text' },
        { label: 'Announcements',     path: '/employee/comm/announcements', icon: 'bell' },
      ]
    },
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

        {/* Resources */}
        <Route path="materials/assigned"  element={<AssignedMaterials />} />
        <Route path="materials/request"   element={<RequestMaterials />} />
        <Route path="materials/return"    element={<ReturnItems />} />

        {/* Communication */}
        <Route path="comm/messages"       element={<Messages />} />
        <Route path="comm/notes"          element={<SupervisorNotes />} />
        <Route path="comm/announcements"  element={<Announcements />} />

        <Route path="/"                   element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default EmployeePortalDashboard;
