const express = require('express');
const router  = express.Router();
const C       = require('../controllers/printingAssets.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Stats (all roles)
router.get('/stats', C.getStats);

// Movement Log (all roles)
router.get('/log', C.getMovementLog);

// ─── Store Machines ────────────────────────────────────────────────────────
router.get('/store/machines',                  C.listStoreMachines);
router.post('/store/machines',                 C.registerMachine);
router.patch('/store/machines/:id/status',     C.updateMachineStatus);
router.patch('/store/machines/:id/value',      C.updateMachineValue);   // Finance only

// ─── Store Materials ────────────────────────────────────────────────────────
router.get('/store/materials',                 C.listStoreMaterials);
router.post('/store/materials',                C.registerMaterial);
router.patch('/store/materials/:id/quantity',  C.updateMaterialQuantity);
router.patch('/store/materials/:id/value',     C.updateMaterialValue);  // Finance only
router.put('/store/materials/:id',             C.updateMaterialFull);

// ─── Incoming Shipments (from converted purchase quotations) ─────────────────
router.get('/store/incoming',                  C.listIncoming);
router.post('/store/incoming/:id/accept',      C.acceptIncoming);

// ─── Movement Requests (Store Keeper initiates) ─────────────────────────────
router.post('/move/machine',                   C.initiateMachineMoveRequest);
router.post('/move/material',                  C.initiateMaterialMoveRequest);
router.post('/issue/material',                 C.directIssueMaterial);

// ─── Supervisor: Pending & Approve ──────────────────────────────────────────
router.get('/moves/pending',                   C.listPendingMoves);
router.post('/moves/:log_id/approve',          C.approveMove);

// ─── Production Machines ─────────────────────────────────────────────────────
router.get('/production/machines',             C.listProductionMachines);
router.patch('/production/machines/:id/status',C.updateProductionMachineStatus);

// ─── Production Materials ─────────────────────────────────────────────────────
router.get('/production/materials',            C.listProductionMaterials);
router.post('/production/materials/:id/consume', C.consumeMaterial);

// ─── Printing Material Transfer Requests (Pharmacy-style) ──────────────────────
router.post('/material-requests',                  C.createMaterialRequest);       // Supervisor creates
router.get('/material-requests',                   C.listMaterialRequests);        // All roles can list
router.post('/material-requests/:id/decide',       C.decideMaterialRequest);       // CEO approve/reject
router.post('/material-requests/:id/ship',         C.shipMaterialRequest);         // General Store Keeper ships
router.post('/material-requests/:id/receive',      C.receiveMaterialRequest);      // Supervisor receives
router.post('/material-requests/:id/cancel',       C.cancelMaterialRequest);       // Supervisor cancels

module.exports = router;
