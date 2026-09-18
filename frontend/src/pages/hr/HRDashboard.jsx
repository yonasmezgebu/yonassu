import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HRHome from './HRHome';
import HRActivities from './HRActivities';
import HREmployeesWrapper from './HREmployeesWrapper';
import HRDepartments from './HRDepartments';
import HREmployeeStatus from './HREmployeeStatus';
// Payroll
import HRPayroll from './HRPayroll';
import HRPayrollDashboard from './HRPayrollDashboard';
import HRDeductions from './HRDeductions';
import HRPayslips from './HRPayslips';
// Recruitment
import HRJobPosts from './HRJobPosts';
import HRApplications from './HRApplications';
import HRInterviews from './HRInterviews';
import HRHiringStatus from './HRHiringStatus';
// Performance
import HREvaluations from './HREvaluations';
import HRPerformanceReview from './HRPerformanceReview';
import HRFeedback from './HRFeedback';
import HRPolicies from './HRPolicies';
import HRAnnouncements from './HRAnnouncements';
import HRAttendance from './HRAttendance';
import HRNotices from './HRNotices';
import NewsManager from '../admin/NewsManager';
import GalleryManager from '../admin/GalleryManager';
import JobApplicationsManager from './JobApplicationsManager';
import HRContact from './HRContact';
import ManagerChat from '../../components/ManagerChat';
import CentralAuditLog from '../admin/CentralAuditLog';
import styles from './HRDashboard.module.css';

const HRDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/hr/employee-summary', icon: 'home' },
    { type: 'divider' },
    { label: 'Employees', path: '/hr/employees', icon: 'users' },
    { type: 'divider' },
    { label: 'Attendance', path: '/hr/attendance', icon: 'clock', color: '#0f172a' },
    { type: 'divider' },
    {
      label: 'Payroll', icon: 'wallet',
      children: [
        { label: 'Monthly Payroll',     path: '/hr/monthly-payroll',    icon: 'bar-chart' },
        { label: 'Salary List',         path: '/hr/salary-list',        icon: 'wallet' },
        { label: 'Deductions',          path: '/hr/deductions',         icon: 'credit-card' },
        { label: 'Payroll History',     path: '/hr/payslips',           icon: 'file-text' },
      ]
    },

    { type: 'divider' },
    {
      label: 'Documents & Comms', icon: 'folder',
      children: [
        { label: 'Employee Info',       path: '/hr/employee-info',      icon: 'clipboard' },
        { label: 'HR Policies',         path: '/hr/hr-policies',        icon: 'shield' },
        { label: 'Announcements',       path: '/hr/announcements',      icon: 'bell' },
      ]
    },
    { type: 'divider' },
    { label: 'Job Applications', path: '/hr/applications', icon: 'briefcase' },
    { label: 'News & Notices',   path: '/hr/news',         icon: 'file-text' },
    { label: 'Public Gallery',   path: '/hr/gallery',      icon: 'image' },
    { type: 'divider' },
    { label: 'Setting Contact', icon: 'settings', children: [
      { label: 'Contact Settings', path: '/hr/settings-contact', icon: 'settings' },
      { label: 'Chat', path: '/hr/chat', icon: 'message-circle', color: '#6B8E23' }
    ] },
    { type: 'divider' },
    { label: 'Audit Log', path: '/hr/audit-log', icon: 'clipboard', color: '#6366f1' },
  ];

  const location = useLocation();
  const noPaddingPaths = [
    '/hr/employee-summary',
    '/hr/overview',
    '/hr/employees',
    '/hr/attendance',
    '/hr/monthly-payroll',
    '/hr/salary-list',
    '/hr/deductions',
    '/hr/payslips',
    '/hr/employee-info',
    '/hr/hr-policies',
    '/hr/announcements',
    '/hr/applications',
    '/hr/news',
    '/hr/gallery',
    '/hr/internal-notices',
    '/hr/settings-contact',
  ];
  const isNoPadding = noPaddingPaths.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="overview"            element={<HRHome />} />
      <Route path="employee-summary"    element={<HRHome />} />
      <Route path="todays-activities"   element={<HRActivities />} />
      <Route path="employees"           element={<HREmployeesWrapper />} />
      <Route path="attendance"          element={<HRAttendance />} />
      <Route path="salary-list"         element={<HRPayroll />} />
        <Route path="monthly-payroll"      element={<HRPayrollDashboard />} />
        <Route path="deductions"          element={<HRDeductions />} />
      <Route path="payslips"            element={<HRPayslips />} />
      <Route path="job-posts"           element={<HRJobPosts />} />
      <Route path="applications"        element={<HRApplications />} />
      <Route path="interviews"          element={<HRInterviews />} />
      <Route path="hiring-status"       element={<HRHiringStatus />} />
      <Route path="evaluations"         element={<HREvaluations />} />
      <Route path="performance-review"  element={<HRPerformanceReview />} />
      <Route path="feedback"            element={<HRFeedback />} />
      <Route path="contracts"           element={<HRPolicies />} />
      <Route path="employee-info"       element={<HREmployeeStatus />} />
      <Route path="hr-policies"         element={<HRPolicies />} />
      <Route path="announcements"       element={<HRAnnouncements />} />
      <Route path="internal-notices"    element={<HRNotices />} />
      <Route path="hr-messages"         element={<HRPolicies />} />
      <Route path="news"                element={<NewsManager />} />
      <Route path="gallery"             element={<GalleryManager />} />
      <Route path="job-applications"    element={<JobApplicationsManager />} />
      <Route path="settings-contact"    element={<HRContact />} />
      <Route path="chat"                element={<ManagerChat />} />
      <Route path="audit-log"           element={<CentralAuditLog />} />
      <Route path="/"                   element={<Navigate to="employee-summary" replace />} />
    </Routes>
  );

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <DashboardLayout menuItems={menuItems} title="HR Dashboard" noPadding={isNoPadding}>
        {isNoPadding
          ? routes
          : <div className={styles.dashboardContent}>{routes}</div>
        }
      </DashboardLayout>
    </div>
  );
};

export default HRDashboard;
