const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/adminSystemJobs.controller');
const importCtrl = require('../controllers/adminDataImportExport.controller');
const maintCtrl = require('../controllers/adminMaintenance.controller');

// ── System Jobs ───────────────────────────────────────────────
router.get('/system-jobs', authenticate, authorize(['admin:system']), ctrl.getSystemJobs);
router.get('/system-jobs/:id', authenticate, authorize(['admin:system']), ctrl.getSystemJobById);
router.post('/system-jobs/:id/retry', authenticate, authorize(['admin:system']),
  param('id').isInt(), validate, ctrl.retrySystemJob);
router.post('/system-jobs/:id/pause', authenticate, authorize(['admin:system']),
  param('id').isInt(), validate, ctrl.pauseSystemJob);
router.post('/system-jobs/:id/resume', authenticate, authorize(['admin:system']),
  param('id').isInt(), validate, ctrl.resumeSystemJob);
router.get('/system-jobs/:id/history', authenticate, authorize(['admin:system']),
  param('id').isInt(), validate, ctrl.getSystemJobHistory);
router.put('/system-jobs/:id/schedule', authenticate, authorize(['admin:system']),
  param('id').isInt(), body('schedule').isString(), validate, ctrl.updateSystemJobSchedule);

// ── Data Import / Export ──────────────────────────────────────
router.post('/import', authenticate, authorize(['admin:system']), importCtrl.importData);
router.post('/import/validate', authenticate, authorize(['admin:system']), importCtrl.validateImportFile);
router.get('/import/history', authenticate, authorize(['admin:system']), importCtrl.getImportHistory);
router.get('/import/history/:id', authenticate, authorize(['admin:system']), importCtrl.getImportJobById);
router.get('/import/:jobId/preview', authenticate, authorize(['admin:system']), importCtrl.previewImport);
router.post('/import/:jobId/confirm', authenticate, authorize(['admin:system']), importCtrl.confirmImport);
router.get('/export/permissions', authenticate, authorize(['admin:system']), importCtrl.getExportPermissions);
router.get('/export/:dataType', authenticate, authorize(['admin:system', 'reports:export']), importCtrl.exportData);

// ── Maintenance (frontend URL format) ─────────────────────────
router.get('/maintenance/tasks', authenticate, authorize(['admin:maintenance']), maintCtrl.getMaintenanceTasks);
router.post('/maintenance/database', authenticate, authorize(['admin:maintenance']), maintCtrl.runDatabaseMaintenance);
router.post('/maintenance/storage/cleanup', authenticate, authorize(['admin:maintenance']), maintCtrl.runStorageCleanup);
router.get('/maintenance/storage', authenticate, authorize(['admin:maintenance']), maintCtrl.getStorageUsage);
router.post('/maintenance/cache/clear', authenticate, authorize(['admin:maintenance']), maintCtrl.clearCache);
router.get('/maintenance/cache', authenticate, authorize(['admin:maintenance']), maintCtrl.getCacheStatus);
router.get('/maintenance/logs', authenticate, authorize(['admin:maintenance']), maintCtrl.getLogManagement);
router.post('/maintenance/logs/prune', authenticate, authorize(['admin:maintenance']), maintCtrl.pruneLogs);
router.post('/maintenance/integrity', authenticate, authorize(['admin:maintenance']), maintCtrl.runDataIntegrityCheck);
router.post('/maintenance/diagnostics', authenticate, authorize(['admin:maintenance']), maintCtrl.runSystemDiagnostics);
router.get('/maintenance/archive/rules', authenticate, authorize(['admin:maintenance']), maintCtrl.getArchiveRules);
router.post('/maintenance/archive', authenticate, authorize(['admin:maintenance']), maintCtrl.runArchive);
router.get('/maintenance/updates', authenticate, authorize(['admin:maintenance']), maintCtrl.getSystemUpdates);
router.post('/maintenance/updates/:id/apply', authenticate, authorize(['admin:maintenance']), maintCtrl.applySystemUpdate);
router.post('/maintenance/restart', authenticate, authorize(['admin:maintenance']), maintCtrl.restartService);

module.exports = router;
