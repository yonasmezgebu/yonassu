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
import PrintingPrintSpecifications from './PrintingPrintSpecifications';
import PrintingVersionControl from './PrintingVersionControl';

// Production (14-18)
import PrintingMachineAllocation from './PrintingMachineAllocation';
import PrintingPrintSchedule from './PrintingPrintSchedule';
import PrintingJobProgressTracking from './PrintingJobProgressTracking';
import PrintingMaterialUsage from './PrintingMaterialUsage';
import PrintingReprintRequests from './PrintingReprintRequests';

// Orders / Customers (19-22)
import PrintingCustomerOrders from './PrintingCustomerOrders';
import PrintingCustomRequests from './PrintingCustomRequests';
import PrintingOrderTracking from './PrintingOrderTracking';
import PrintingDeliveryNotes from './PrintingDeliveryNotes';

// Approvals (23-26)
import PrintingDesignApproval from './PrintingDesignApproval';
import PrintingPrintApproval from './PrintingPrintApproval';
import PrintingReprintApproval from './PrintingReprintApproval';
import PrintingJobCompletionApproval from './PrintingJobCompletionApproval';

// Delivery (27-30)
import PrintingReadyForDispatch from './PrintingReadyForDispatch';
import PrintingDeliverySchedule from './PrintingDeliverySchedule';
import PrintingDriverAssignment from './PrintingDriverAssignment';
import PrintingDeliveredJobs from './PrintingDeliveredJobs';

// Reports (31-35)
import PrintingDailyProductionReport from './PrintingDailyProductionReport';
import PrintingMachinePerformanceReport from './PrintingMachinePerformanceReport';
import PrintingJobCostReport from './PrintingJobCostReport';
import PrintingMaterialConsumptionReport from './PrintingMaterialConsumptionReport';
import PrintingMonthlySummaryReport from './PrintingMonthlySummaryReport';

// Quality Control (36-39)
import PrintingInspection from './PrintingInspection';
import PrintingDefectReport from './PrintingDefectReport';
import PrintingReworkJobs from './PrintingReworkJobs';
import PrintingQualityChecklist from './PrintingQualityChecklist';

import styles from './PrintingDashboard.module.css';

const PrintingDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/printing-manager/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Jobs', icon: 'folder',
      children: [
        { label: '1. New Job Order',          path: '/printing-manager/jobs/new',        icon: 'plus-circle',  color: '#22c55e' },
        { label: '2. Job Queue',              path: '/printing-manager/jobs/queue',      icon: 'list',         color: '#3b82f6' },
        { label: '3. In Design',              path: '/printing-manager/jobs/design',     icon: 'pen-tool',     color: '#8b5cf6' },
        { label: '4. File Check (Prepress)',  path: '/printing-manager/jobs/prepress',   icon: 'check-square', color: '#f59e0b' },
        { label: '5. In Printing',            path: '/printing-manager/jobs/printing',   icon: 'printer',      color: '#06b6d4' },
        { label: '6. Finishing',              path: '/printing-manager/jobs/finishing',  icon: 'scissors',     color: '#d946ef' },
        { label: '7. Ready for Delivery',     path: '/printing-manager/jobs/delivery',   icon: 'truck',        color: '#16a34a' },
        { label: '8. Job History',            path: '/printing-manager/jobs/history',    icon: 'archive',      color: '#64748b' },
      ]
    },
    { type: 'divider' },
    { label: 'Design & Files', icon: 'image',
      children: [
        { label: '9. Design Requests',        path: '/printing-manager/design/requests', icon: 'inbox',        color: '#f43f5e' },
        { label: '10. Upload Artwork',        path: '/printing-manager/design/upload',   icon: 'upload-cloud', color: '#3b82f6' },
        { label: '11. File Review',           path: '/printing-manager/design/review',   icon: 'eye',          color: '#8b5cf6' },
        { label: '12. Print Specs',           path: '/printing-manager/design/specs',    icon: 'file-text',    color: '#eab308' },
        { label: '13. Version Control',       path: '/printing-manager/design/versions', icon: 'git-commit',   color: '#0ea5e9' },
      ]
    },
    { type: 'divider' },
    { label: 'Production', icon: 'tool',
      children: [
        { label: '14. Machine Allocation',    path: '/printing-manager/prod/machines',   icon: 'cpu',          color: '#ef4444' },
        { label: '15. Print Schedule',        path: '/printing-manager/prod/schedule',   icon: 'calendar',     color: '#f97316' },
        { label: '16. Job Progress',          path: '/printing-manager/prod/progress',   icon: 'bar-chart',    color: '#10b981' },
        { label: '17. Material Usage',        path: '/printing-manager/prod/materials',  icon: 'package',      color: '#6366f1' },
        { label: '18. Reprint Requests',      path: '/printing-manager/prod/reprints',   icon: 'rotate-ccw',   color: '#ec4899' },
      ]
    },
    { type: 'divider' },
    { label: 'Orders / Customers', icon: 'users',
      children: [
        { label: '19. Customer Orders',       path: '/printing-manager/orders/customer', icon: 'file-text',    color: '#8b5cf6' },
        { label: '20. Custom Requests',       path: '/printing-manager/orders/custom',   icon: 'star',         color: '#ec4899' },
        { label: '21. Order Tracking',        path: '/printing-manager/orders/tracking', icon: 'truck',        color: '#10b981' },
        { label: '22. Delivery Notes',        path: '/printing-manager/orders/notes',    icon: 'file',         color: '#3b82f6' },
      ]
    },
    { type: 'divider' },
    { label: 'Approvals', icon: 'check-circle',
      children: [
        { label: '23. Design Approval',       path: '/printing-manager/approvals/design',icon: 'pen-tool',     color: '#f59e0b' },
        { label: '24. Print Approval',        path: '/printing-manager/approvals/print', icon: 'printer',      color: '#06b6d4' },
        { label: '25. Reprint Approval',      path: '/printing-manager/approvals/reprint',icon:'rotate-ccw',   color: '#ef4444' },
        { label: '26. Job Completion',        path: '/printing-manager/approvals/complete',icon:'check-square',color: '#22c55e' },
      ]
    },
    { type: 'divider' },
    { label: 'Delivery', icon: 'truck',
      children: [
        { label: '27. Ready for Dispatch',    path: '/printing-manager/delivery/dispatch',icon: 'package',     color: '#f59e0b' },
        { label: '28. Delivery Schedule',     path: '/printing-manager/delivery/schedule',icon: 'calendar',    color: '#3b82f6' },
        { label: '29. Driver Assignment',     path: '/printing-manager/delivery/drivers', icon: 'user',        color: '#8b5cf6' },
        { label: '30. Delivered Jobs',        path: '/printing-manager/delivery/delivered',icon:'check-circle',color: '#10b981' },
      ]
    },
    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: '31. Daily Production',      path: '/printing-manager/reports/daily',    icon: 'activity',    color: '#0ea5e9' },
        { label: '32. Machine Performance',   path: '/printing-manager/reports/machines', icon: 'cpu',         color: '#ef4444' },
        { label: '33. Job Cost Report',       path: '/printing-manager/reports/costs',    icon: 'dollar-sign', color: '#10b981' },
        { label: '34. Material Consumption',  path: '/printing-manager/reports/materials',icon: 'layers',      color: '#f97316' },
        { label: '35. Monthly Summary',       path: '/printing-manager/reports/summary',  icon: 'pie-chart',   color: '#8b5cf6' },
      ]
    },
    { type: 'divider' },
    { label: 'Quality Control', icon: 'check-circle',
      children: [
        { label: '36. Inspection',            path: '/printing-manager/qc/inspection',    icon: 'clipboard',   color: '#0ea5e9' },
        { label: '37. Defect Report',         path: '/printing-manager/qc/defects',       icon: 'alert-triangle', color: '#ef4444' },
        { label: '38. Rework Jobs',           path: '/printing-manager/qc/rework',        icon: 'rotate-ccw',  color: '#8b5cf6' },
        { label: '39. Quality Checklist',     path: '/printing-manager/qc/checklist',     icon: 'check-square',color: '#10b981' },
      ]
    }
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
            <Route path="design/specs" element={<PrintingPrintSpecifications />} />
            <Route path="design/versions" element={<PrintingVersionControl />} />

            {/* Production */}
            <Route path="prod/machines" element={<PrintingMachineAllocation />} />
            <Route path="prod/schedule" element={<PrintingPrintSchedule />} />
            <Route path="prod/progress" element={<PrintingJobProgressTracking />} />
            <Route path="prod/materials" element={<PrintingMaterialUsage />} />
            <Route path="prod/reprints" element={<PrintingReprintRequests />} />

            {/* Orders */}
            <Route path="orders/customer" element={<PrintingCustomerOrders />} />
            <Route path="orders/custom" element={<PrintingCustomRequests />} />
            <Route path="orders/tracking" element={<PrintingOrderTracking />} />
            <Route path="orders/notes" element={<PrintingDeliveryNotes />} />

            {/* Approvals */}
            <Route path="approvals/design" element={<PrintingDesignApproval />} />
            <Route path="approvals/print" element={<PrintingPrintApproval />} />
            <Route path="approvals/reprint" element={<PrintingReprintApproval />} />
            <Route path="approvals/complete" element={<PrintingJobCompletionApproval />} />

            {/* Delivery */}
            <Route path="delivery/dispatch" element={<PrintingReadyForDispatch />} />
            <Route path="delivery/schedule" element={<PrintingDeliverySchedule />} />
            <Route path="delivery/drivers" element={<PrintingDriverAssignment />} />
            <Route path="delivery/delivered" element={<PrintingDeliveredJobs />} />

            {/* Reports */}
            <Route path="reports/daily" element={<PrintingDailyProductionReport />} />
            <Route path="reports/machines" element={<PrintingMachinePerformanceReport />} />
            <Route path="reports/costs" element={<PrintingJobCostReport />} />
            <Route path="reports/materials" element={<PrintingMaterialConsumptionReport />} />
            <Route path="reports/summary" element={<PrintingMonthlySummaryReport />} />

            {/* Quality Control */}
            <Route path="qc/inspection" element={<PrintingInspection />} />
            <Route path="qc/defects" element={<PrintingDefectReport />} />
            <Route path="qc/rework" element={<PrintingReworkJobs />} />
            <Route path="qc/checklist" element={<PrintingQualityChecklist />} />

            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PrintingDashboard;
