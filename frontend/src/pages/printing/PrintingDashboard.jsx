import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingHome from './PrintingHome';

// Jobs (1-8)
import PrintingNewJob from './PrintingNewJob';
import PrintingQueue from './PrintingQueue';
import PrintingDesign from './PrintingDesign';
import PrintingPrepress from './PrintingPrepress';
import PrintingInPrint from './PrintingInPrint';
import PrintingFinishing from './PrintingFinishing';
import PrintingDelivery from './PrintingDelivery';
import PrintingHistory from './PrintingHistory';

// Design & Files (9-13)
import PrintingDesignRequests from './PrintingDesignRequests';
import PrintingUploadArtwork from './PrintingUploadArtwork';
import PrintingFileReview from './PrintingFileReview';

// Production (14-18)
import PrintingMachineAllocation from './PrintingMachineAllocation';
import PrintingPrintSchedule from './PrintingPrintSchedule';
import PrintingJobProgressTracking from './PrintingJobProgressTracking';
import PrintingMaterialUsage from './PrintingMaterialUsage';
import PrintingReprintRequests from './PrintingReprintRequests';


// Reports (31-35)
import PrintingDailyProductionReport from './PrintingDailyProductionReport';
import PrintingJobCostReport from './PrintingJobCostReport';
import PrintingMaterialConsumptionReport from './PrintingMaterialConsumptionReport';
import PrintingMonthlySummaryReport from './PrintingMonthlySummaryReport';


import styles from './PrintingDashboard.module.css';

const PrintingDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/printing-manager/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Jobs', icon: 'folder',
      children: [
        { label: 'Job Process',            path: '/printing-manager/jobs/new',        icon: 'plus-circle',  color: '#22c55e' },
        { label: 'Job History',            path: '/printing-manager/jobs/history',    icon: 'archive',      color: '#64748b' },
        { label: 'Redo Request',           path: '/printing-manager/prod/reprints',   icon: 'rotate-ccw',   color: '#ec4899' },
      ]
    },
    { type: 'divider' },
    { label: 'Design & Files', icon: 'image',
      children: [
        { label: 'Design Requests',        path: '/printing-manager/design/requests', icon: 'inbox',        color: '#f43f5e' },
        { label: 'Upload Artwork',         path: '/printing-manager/design/upload',   icon: 'upload-cloud', color: '#3b82f6' },
        { label: 'File Review',            path: '/printing-manager/design/review',   icon: 'eye',          color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },
    { label: 'Production', icon: 'tool',
      children: [
        { label: 'Printing Store Machine',      path: '/printing-manager/prod/machines',   icon: 'cpu',          color: '#ef4444' },
        { label: 'Printing Production Machine', path: '/printing-manager/prod/schedule',   icon: 'calendar',     color: '#f97316' },
        { label: 'Printing Store Material',     path: '/printing-manager/prod/progress',   icon: 'bar-chart',    color: '#10b981' },
        { label: 'Printing Production Material',path: '/printing-manager/prod/materials',  icon: 'package',      color: '#6366f1' },
      ]
    },

    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'Daily Production',      path: '/printing-manager/reports/daily',    icon: 'activity',    color: '#0ea5e9' },
        { label: 'Job Cost Report',       path: '/printing-manager/reports/costs',    icon: 'dollar-sign', color: '#10b981' },
        { label: 'Material Consumption',  path: '/printing-manager/reports/materials',icon: 'layers',      color: '#f97316' },
        { label: 'Monthly Summary',       path: '/printing-manager/reports/summary',  icon: 'pie-chart',   color: '#8b5cf6' },
      ]
    },

  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Printing Supervisor Dashboard — 26 Links">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="overview" element={<PrintingHome />} />

            {/* Jobs */}
            <Route path="jobs/new" element={<PrintingNewJob />} />
            <Route path="jobs/queue" element={<PrintingQueue />} />
            <Route path="jobs/design" element={<PrintingDesign />} />
            <Route path="jobs/prepress" element={<PrintingPrepress />} />
            <Route path="jobs/printing" element={<PrintingInPrint />} />
            <Route path="jobs/finishing" element={<PrintingFinishing />} />
            <Route path="jobs/delivery" element={<PrintingDelivery />} />
            <Route path="jobs/history" element={<PrintingHistory />} />

            {/* Design & Files */}
            <Route path="design/requests" element={<PrintingDesignRequests />} />
            <Route path="design/upload" element={<PrintingUploadArtwork />} />
            <Route path="design/review" element={<PrintingFileReview />} />

            {/* Production */}
            <Route path="prod/machines" element={<PrintingMachineAllocation />} />
            <Route path="prod/schedule" element={<PrintingPrintSchedule />} />
            <Route path="prod/progress" element={<PrintingJobProgressTracking />} />
            <Route path="prod/materials" element={<PrintingMaterialUsage />} />
            <Route path="prod/reprints" element={<PrintingReprintRequests />} />


            {/* Reports */}
            <Route path="reports/daily" element={<PrintingDailyProductionReport />} />
            <Route path="reports/costs" element={<PrintingJobCostReport />} />
            <Route path="reports/materials" element={<PrintingMaterialConsumptionReport />} />
            <Route path="reports/summary" element={<PrintingMonthlySummaryReport />} />


            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PrintingDashboard;
