import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PrintingHome from './PrintingHome';
import PrintingTasks from './PrintingTasks';

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

import PrintingProdMachines from './PrintingProdMachines';
import PrintingProdMaterials from './PrintingProdMaterials';
import PrintingStoreMaterials from './PrintingStoreMaterials';
import PrintingReprintRequests from './PrintingReprintRequests';

// Reports (31-35)
import PrintingDailyProductionReport from './PrintingDailyProductionReport';
import PrintingJobCostReport from './PrintingJobCostReport';
import PrintingMaterialConsumptionReport from './PrintingMaterialConsumptionReport';
import PrintingCEOReport from './PrintingCEOReport';
import PrintingFinanceReview from './PrintingFinanceReview';

import PrintingContact from './PrintingContact';
import ManagerChat from '../../components/ManagerChat';
import CentralAuditLog from '../admin/CentralAuditLog';
import styles from './PrintingDashboard.module.css';

const PrintingDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/printing-manager/overview', icon: 'home' },
    { type: 'divider' },
    { label: 'Jobs', icon: 'printer',
      children: [
        { label: 'Job Process',            path: '/printing-manager/jobs/queue',     icon: 'list',         color: '#228B22' },
        { label: 'Job History',            path: '/printing-manager/jobs/history',    icon: 'archive',      color: '#1B5E20' },
        { label: 'Redo Request',           path: '/printing-manager/prod/reprints',   icon: 'rotate-ccw',   color: '#6B8E23' },
      ]
    },
    { type: 'divider' },
    { label: 'Design & Files', icon: 'image',
      children: [
        { label: 'Design Requests',        path: '/printing-manager/design/requests', icon: 'inbox',        color: '#2E8B57' },
        { label: 'Upload Artwork',         path: '/printing-manager/design/upload',   icon: 'upload-cloud', color: '#4CAF50' },
        { label: 'File Review',            path: '/printing-manager/design/review',   icon: 'eye',          color: '#8BC34A' },
      ]
    },
    { type: 'divider' },
    { label: 'Production', icon: 'tool',
      children: [
        { label: 'Production Machines',   path: '/printing-manager/prod/machines',  icon: 'cpu',       color: '#228B22' },
        { label: 'Production Materials',  path: '/printing-manager/prod/materials', icon: 'package',   color: '#2E8B57' },
        { label: 'Store Material',        path: '/printing-manager/prod/store-materials', icon: 'box', color: '#1B5E20' },
      ]
    },

    { type: 'divider' },
    { label: 'Reports', icon: 'bar-chart',
      children: [
        { label: 'Daily Production',      path: '/printing-manager/reports/daily',    icon: 'activity',    color: '#87CEEB' },
        { label: 'Job Cost Report',       path: '/printing-manager/reports/costs',    icon: 'dollar-sign', color: '#4CAF50' },
        { label: 'Material Consumption',  path: '/printing-manager/reports/materials',icon: 'layers',      color: '#8D6E63' },
        { label: 'CEO Report',            path: '/printing-manager/reports/ceo',      icon: 'briefcase',   color: '#10B981' },
        { label: 'Finance Review',        path: '/printing-manager/reports/finance',  icon: 'file-text',   color: '#3B82F6' }
      ]
    },

    { type: 'divider' },
    { label: 'Contact', icon: 'phone', children: [ { label: 'Setting Contact', path: '/printing-manager/contact', icon: 'settings' }, { label: 'Chat', path: '/printing-manager/chat', icon: 'message-circle', color: '#6B8E23' } ] },
    { type: 'divider' },
    { label: 'Employee', icon: 'briefcase',
      children: [
        { label: 'Tasks', path: '/printing-manager/jobs/tasks', icon: 'check-square', color: '#16a34a' },
        { label: 'Reports', path: '/printing-manager/jobs/tasks', icon: 'file-text', color: '#0ea5e9' }
      ]
    },
    { type: 'divider' },
    { label: 'Audit Log', path: '/printing-manager/audit-log', icon: 'clipboard', color: '#6366f1' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      <DashboardLayout menuItems={menuItems} title="Printing Supervisor Dashboard">
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="overview" element={<PrintingHome />} />

            {/* Jobs */}
            <Route path="jobs/tasks" element={<PrintingTasks />} />
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
            <Route path="prod/machines" element={<PrintingProdMachines />} />
            <Route path="prod/materials" element={<PrintingProdMaterials />} />
            <Route path="prod/store-materials" element={<PrintingStoreMaterials />} />
            <Route path="prod/reprints" element={<PrintingReprintRequests />} />

            {/* Reports */}
            <Route path="reports/daily" element={<PrintingDailyProductionReport />} />
            <Route path="reports/costs" element={<PrintingJobCostReport />} />
            <Route path="reports/materials" element={<PrintingMaterialConsumptionReport />} />
            <Route path="reports/ceo" element={<PrintingCEOReport />} />
            <Route path="reports/finance" element={<PrintingFinanceReview />} />

            {/* Contact Settings */}
            <Route path="contact" element={<PrintingContact />} />
            <Route path="chat" element={<ManagerChat />} />
            <Route path="audit-log" element={<CentralAuditLog />} />


            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default PrintingDashboard;
