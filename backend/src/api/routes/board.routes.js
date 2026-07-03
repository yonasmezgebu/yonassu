const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/overview', boardController.getOverview);
router.get('/financials', boardController.getFinancials);
router.get('/boards', boardController.getBoards);
router.get('/boards/:id/members', boardController.getBoardMembersList);
router.get('/activities', boardController.getActivitiesList);
router.post('/activities', boardController.addActivity);
router.get('/kpis', boardController.getKPIs);

module.exports = router;
