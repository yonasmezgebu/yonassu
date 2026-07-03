const boardService = require('../../services/board.service');
const { catchAsync } = require('../../utils/catchAsync');
const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');

const BOARD_ROLES = ['Board Member', 'Admin', 'CEO'];

function requireBoardAccess(req) {
  const roles = req.user?.roles || [];
  if (!roles.some((r) => BOARD_ROLES.includes(r))) {
    throw new AppError('Access denied — Board access required', 403);
  }
}


exports.getBoardMeetings = catchAsync(async (req, res) => {
  const data = await boardService.getBoardMeetings();
  res.json({ success: true, data });
});

exports.getBoardPack = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const data = await boardService.getBoardPack(meetingId);
  if (!data) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, data });
});

exports.getShareholderRegistry = catchAsync(async (req, res) => {
  const data = await boardService.getShareholderRegistry();
  res.json({ success: true, data });
});

exports.getDividendStatus = catchAsync(async (req, res) => {
  const data = await boardService.getDividendStatus();
  res.json({ success: true, data });
});

exports.getBoardResolutions = catchAsync(async (req, res) => {
  const data = await boardService.getBoardResolutions();
  res.json({ success: true, data });
});

exports.createBoardMeeting = catchAsync(async (req, res) => {
  const { title, meeting_date, meeting_time, venue, agenda } = req.body;
  if (!title || !meeting_date) {
    return res.status(400).json({ success: false, message: 'Title and meeting date are required' });
  }
  const meeting = await boardService.createBoardMeeting({ title, meeting_date, meeting_time, venue, agenda });
  res.status(201).json({ success: true, data: meeting });
});

exports.createShareholder = catchAsync(async (req, res) => {
  const { name, email, phone, share_percentage, shares_count, share_type, joined_date } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Shareholder name is required' });
  }
  const shareholder = await boardService.createShareholder({ name, email, phone, share_percentage, shares_count, share_type, joined_date });
  res.status(201).json({ success: true, data: shareholder });
});

exports.createBoardResolution = catchAsync(async (req, res) => {
  const { title, description, meeting_id, resolution_date, proposed_by, outcome } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Resolution title is required' });
  }
  const resolution = await boardService.createBoardResolution({ title, description, meeting_id, resolution_date, proposed_by, outcome });
  res.status(201).json({ success: true, data: resolution });
});

exports.updateBoardMeeting = catchAsync(async (req, res) => {
  const { id } = req.params;
  const meeting = await boardService.updateBoardMeeting(id, req.body);
  if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
  res.json({ success: true, data: meeting });
});

exports.deleteBoardMeeting = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteBoardMeeting(id);
  res.json({ success: true, message: 'Meeting deleted' });
});

exports.updateShareholder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const shareholder = await boardService.updateShareholder(id, req.body);
  if (!shareholder) return res.status(404).json({ success: false, message: 'Shareholder not found' });
  res.json({ success: true, data: shareholder });
});

exports.deleteShareholder = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteShareholder(id);
  res.json({ success: true, message: 'Shareholder deleted' });
});

exports.updateBoardResolution = catchAsync(async (req, res) => {
  const { id } = req.params;
  const resolution = await boardService.updateBoardResolution(id, req.body);
  if (!resolution) return res.status(404).json({ success: false, message: 'Resolution not found' });
  res.json({ success: true, data: resolution });
});

exports.deleteBoardResolution = catchAsync(async (req, res) => {
  const { id } = req.params;
  await boardService.deleteBoardResolution(id);
  res.json({ success: true, message: 'Resolution deleted' });
});

exports.getOverview = catchAsync(async (req, res) => {
  requireBoardAccess(req);

  const [
    boardsCount,
    membersCount,
    activitiesCount,
    recentActivities,
  ] = await Promise.all([
    db('boards').count('board_id as c').first(),
    db('board_members').count('member_id as c').first(),
    db('board_activities').count('activity_id as c').first(),
    db('board_activities')
      .join('boards', 'board_activities.board_id', 'boards.board_id')
      .select('board_activities.*', 'boards.board_name')
      .orderBy('board_activities.activity_date', 'desc')
      .limit(5),
  ]);

  res.json({
    status: 'success',
    data: {
      totalBoards: boardsCount?.c || 0,
      totalMembers: membersCount?.c || 0,
      totalActivities: activitiesCount?.c || 0,
      recentActivities,
    },
  });
});

exports.getFinancials = catchAsync(async (req, res) => {
  requireBoardAccess(req);

  const [revenue, expenses, purchases] = await Promise.all([
    db('pos_transactions')
      .sum('total_amount as total')
      .where('status', 'completed')
      .first()
      .catch(() => ({ total: 0 })),
    db('expenses')
      .sum('amount as total')
      .first()
      .catch(() => ({ total: 0 })),
    db('purchase_orders')
      .sum('total_amount as total')
      .whereIn('status', ['received', 'approved', 'completed'])
      .first()
      .catch(() => ({ total: 0 })),
  ]);

  const trend = await db('pos_transactions')
    .select(
      db.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
      db.raw('SUM(total_amount) as revenue'),
      db.raw('COUNT(*) as transactions'),
    )
    .where('status', 'completed')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 6 MONTH)'))
    .groupByRaw('DATE_FORMAT(created_at, "%Y-%m")')
    .orderBy('month', 'asc')
    .catch(() => []);

  const netProfit = (parseFloat(revenue?.total) || 0) - (parseFloat(expenses?.total) || 0);

  res.json({
    status: 'success',
    data: {
      totalRevenue: parseFloat(revenue?.total) || 0,
      totalExpenses: parseFloat(expenses?.total) || 0,
      totalPurchases: parseFloat(purchases?.total) || 0,
      netProfit,
      profitMargin: revenue?.total > 0 ? ((netProfit / parseFloat(revenue?.total)) * 100).toFixed(1) : 0,
      monthlyTrend: trend,
    },
  });
});

exports.getBoards = catchAsync(async (req, res) => {
  requireBoardAccess(req);

  const boards = await db('boards')
    .select('boards.*')
    .orderBy('boards.board_id');

  const enriched = await Promise.all(
    boards.map(async (b) => {
      const [mc, lastAct] = await Promise.all([
        db('board_members').where('board_id', b.board_id).count('member_id as c').first(),
        db('board_activities')
          .where('board_id', b.board_id)
          .orderBy('activity_date', 'desc')
          .first(),
      ]);
      return { ...b, member_count: mc?.c || 0, last_activity: lastAct || null };
    }),
  );

  res.json({ status: 'success', data: enriched });
});

exports.getBoardMembersList = catchAsync(async (req, res) => {
  requireBoardAccess(req);
  const { id } = req.params;

  const members = await db('board_members')
    .join('users', 'board_members.user_id', 'users.id')
    .where('board_members.board_id', id)
    .select(
      'board_members.member_id',
      'board_members.position',
      'board_members.joined_at',
      'users.id as user_id',
      'users.full_name',
      'users.email',
      'users.phone',
    );

  res.json({ status: 'success', data: members });
});

exports.getActivitiesList = catchAsync(async (req, res) => {
  requireBoardAccess(req);
  const { board_id, limit = 20 } = req.query;

  let query = db('board_activities')
    .join('boards', 'board_activities.board_id', 'boards.board_id')
    .select('board_activities.*', 'boards.board_name', 'boards.role as board_role')
    .orderBy('board_activities.activity_date', 'desc')
    .limit(parseInt(limit, 10));

  if (board_id) query = query.where('board_activities.board_id', board_id);

  const activities = await query;
  res.json({ status: 'success', data: activities });
});

exports.addActivity = catchAsync(async (req, res) => {
  requireBoardAccess(req);
  const { board_id, activity_type, details } = req.body;
  if (!board_id || !activity_type) throw new AppError('board_id and activity_type are required', 400);

  const [id] = await db('board_activities').insert({ board_id, activity_type, details });
  const created = await db('board_activities').where('activity_id', id).first();
  res.status(201).json({ status: 'success', data: created });
});

exports.getKPIs = catchAsync(async (req, res) => {
  requireBoardAccess(req);

  const [
    activeEmployees,
    totalCustomers,
    pharmacyProducts,
    farmingProducts,
    pendingOrders,
    lowStockItems,
  ] = await Promise.all([
    db('users').where('status_id', 1).whereNull('deleted_at').count('id as c').first().catch(() => ({ c: 0 })),
    db('users').whereExists(db('user_roles').whereRaw('user_roles.user_id = users.id').where('role_id', 8)).count('id as c').first().catch(() => ({ c: 0 })),
    db('pharmacy_medications').where('is_active', 1).count('id as c').first().catch(() => ({ c: 0 })),
    db('farming_products').where('is_active', 1).count('id as c').first().catch(() => ({ c: 0 })),
    db('farming_orders').where('status', 'pending').count('order_id as c').first().catch(() => ({ c: 0 })),
    db('pharmacy_medications').whereRaw('stock_quantity <= reorder_level').count('id as c').first().catch(() => ({ c: 0 })),
  ]);

  res.json({
    status: 'success',
    data: {
      activeEmployees: parseInt(activeEmployees?.c) || 0,
      totalCustomers: parseInt(totalCustomers?.c) || 0,
      pharmacyProducts: parseInt(pharmacyProducts?.c) || 0,
      farmingProducts: parseInt(farmingProducts?.c) || 0,
      pendingOrders: parseInt(pendingOrders?.c) || 0,
      lowStockAlerts: parseInt(lowStockItems?.c) || 0,
    },
  });
});
