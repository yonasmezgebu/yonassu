import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HRHome from './HRHome';
import HRActivities from './HRActivities';
import HREmployees from './HREmployees';
import HRAddEmployee from './HRAddEmployee';
import HRDepartments from './HRDepartments';
import HREmployeeStatus from './HREmployeeStatus';
import HRAttendance from './HRAttendance';
import HRCheckInOut from './HRCheckInOut';
import HRAbsences from './HRAbsences';
import HRAttendanceReports from './HRAttendanceReports';
import HRLeaves from './HRLeaves';
// Payroll
import HRPayroll from './HRPayroll';
import HRPayrollProcess from './HRPayrollProcess';
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
// Documents & Comms
import HRContracts from './HRContracts';
import HREmployeeFiles from './HREmployeeFiles';
import HRPolicies from './HRPolicies';
import HRAnnouncements from './HRAnnouncements';
import HRNotices from './HRNotices';
import HRMessages from './HRMessages';
import styles from './HRDashboard.module.css';

const HRDashboard = () => {
  const menuItems = [
    {
      label: 'Dashboard', icon: 'home',
      children: [
        { label: 'Overview',            path: '/hr/overview',          icon: 'home' },
        { label: 'Employee Summary',    path: '/hr/employee-summary',  icon: 'bar-chart' },
        { label: "Today's Activities",  path: '/hr/todays-activities', icon: 'clock' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Employees', icon: 'users',
      children: [
        { label: 'Employee List',       path: '/hr/employee-list',     icon: 'users' },
        { label: 'Add Employee',        path: '/hr/add-employee',      icon: 'user-plus' },
        { label: 'Departments',         path: '/hr/departments',       icon: 'layers' },
        { label: 'Employee Status',     path: '/hr/employee-status',   icon: 'user-check' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Attendance', icon: 'clock',
      children: [
        { label: 'Daily Attendance',    path: '/hr/daily-attendance',   icon: 'clock' },
        { label: 'Check-in / Out',      path: '/hr/check-in-out',       icon: 'check-circle' },
        { label: 'Absence Records',     path: '/hr/absence-records',    icon: 'file-text' },
        { label: 'Leaves',              path: '/hr/leaves',             icon: 'calendar' },
        { label: 'Attendance Reports',  path: '/hr/attendance-reports', icon: 'bar-chart' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Payroll', icon: 'wallet',
      children: [
        { label: 'Salary List',         path: '/hr/salary-list',        icon: 'wallet' },
        { label: 'Payroll Processing',  path: '/hr/payroll-processing', icon: 'settings' },
        { label: 'Deductions',          path: '/hr/deductions',         icon: 'credit-card' },
        { label: 'Payslips',            path: '/hr/payslips',           icon: 'file-text' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Recruitment', icon: 'briefcase',
      children: [
        { label: 'Job Posts',           path: '/hr/job-posts',          icon: 'file-plus' },
        { label: 'Applications',        path: '/hr/applications',       icon: 'clipboard' },
        { label: 'Interviews',          path: '/hr/interviews',         icon: 'users' },
        { label: 'Hiring Status',       path: '/hr/hiring-status',      icon: 'trending-up' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Performance', icon: 'target',
      children: [
        { label: 'Evaluations',         path: '/hr/evaluations',        icon: 'target' },
        { label: 'Performance Review',  path: '/hr/performance-review', icon: 'bar-chart-2' },
        { label: 'Feedback',            path: '/hr/feedback',           icon: 'message-circle' },
      ]
    },
    { type: 'divider' },
    {
      label: 'Documents & Comms', icon: 'folder',
      children: [
        { label: 'Contracts',           path: '/hr/contracts',          icon: 'file-text' },
        { label: 'Employee Files',      path: '/hr/employee-files',     icon: 'clipboard' },
        { label: 'HR Policies',         path: '/hr/hr-policies',        icon: 'shield' },
        { label: 'Announcements',       path: '/hr/announcements',      icon: 'bell' },
        { label: 'Internal Notices',    path: '/hr/internal-notices',   icon: 'file-text' },
        { label: 'HR Messages',         path: '/hr/hr-messages',        icon: 'message-circle' },
      ]
    },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="HR Dashboard">
        <div className={styles.dashboardContent}>
          <Routes>
            <Route path="overview"            element={<HRHome />} />
            <Route path="employee-summary"    element={<HRHome />} />
            <Route path="todays-activities"   element={<HRActivities />} />
            <Route path="employee-list"       element={<HREmployees />} />
            <Route path="add-employee"        element={<HRAddEmployee />} />
            <Route path="departments"         element={<HRDepartments />} />
            <Route path="employee-status"     element={<HREmployeeStatus />} />
            <Route path="daily-attendance"    element={<HRAttendance />} />
            <Route path="check-in-out"        element={<HRCheckInOut />} />
            <Route path="absence-records"     element={<HRAbsences />} />
            <Route path="leaves"              element={<HRLeaves />} />
            <Route path="attendance-reports"  element={<HRAttendanceReports />} />
            <Route path="salary-list"         element={<HRPayroll />} />
            <Route path="payroll-processing"  element={<HRPayrollProcess />} />
            <Route path="deductions"          element={<HRDeductions />} />
            <Route path="payslips"            element={<HRPayslips />} />
            <Route path="job-posts"           element={<HRJobPosts />} />
            <Route path="applications"        element={<HRApplications />} />
            <Route path="interviews"          element={<HRInterviews />} />
            <Route path="hiring-status"       element={<HRHiringStatus />} />
            <Route path="evaluations"         element={<HREvaluations />} />
            <Route path="performance-review"  element={<HRPerformanceReview />} />
            <Route path="feedback"            element={<HRFeedback />} />
            <Route path="contracts"           element={<HRContracts />} />
            <Route path="employee-files"      element={<HREmployeeFiles />} />
            <Route path="hr-policies"         element={<HRPolicies />} />
            <Route path="announcements"       element={<HRAnnouncements />} />
            <Route path="internal-notices"    element={<HRNotices />} />
            <Route path="hr-messages"         element={<HRMessages />} />
            <Route path="/"                   element={<Navigate to="employee-summary" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default HRDashboard;
