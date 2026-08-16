const vatConfigService = require('../../services/vatConfig.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getAll = catchAsync(async (req, res) => {
  const configs = await vatConfigService.getAll();
  res.json({ status: 'success', data: configs });
});

exports.getById = catchAsync(async (req, res) => {
  const config = await vatConfigService.getById(req.params.id);
  if (!config) return res.status(404).json({ status: 'error', message: 'VAT configuration not found' });
  res.json({ status: 'success', data: config });
});

exports.getHistory = catchAsync(async (req, res) => {
  const vatConfigId = req.params.vatConfigId || null;
  const history = await vatConfigService.getHistory(vatConfigId);
  res.json({ status: 'success', data: history });
});

exports.createConfig = catchAsync(async (req, res) => {
  const config = await vatConfigService.createConfig({ ...req.body, ip: req.ip }, req.user);
  res.status(201).json({ status: 'success', data: config });
});

exports.updateConfig = catchAsync(async (req, res) => {
  const config = await vatConfigService.updateConfig(req.params.id, { ...req.body, ip: req.ip }, req.user);
  res.json({ status: 'success', data: config });
});

exports.approveConfig = catchAsync(async (req, res) => {
  const config = await vatConfigService.approveConfig(req.params.id, req.user, req.body.notes);
  res.json({ status: 'success', data: config });
});

exports.rejectConfig = catchAsync(async (req, res) => {
  const result = await vatConfigService.rejectConfig(req.params.id, req.user, req.body.notes);
  res.json({ status: 'success', data: result });
});

exports.toggleActive = catchAsync(async (req, res) => {
  const config = await vatConfigService.toggleActive(req.params.id, req.user);
  res.json({ status: 'success', data: config });
});

/* ── Product / Service Tax Mapping ──────────────────────────────────────────── */

exports.getMappings = catchAsync(async (req, res) => {
  const mappings = await vatConfigService.getMappings();
  res.json({ status: 'success', data: mappings });
});

exports.getMappingProducts = catchAsync(async (req, res) => {
  const products = await vatConfigService.getMappingProducts();
  res.json({ status: 'success', data: products });
});

exports.getCatalog = catchAsync(async (req, res) => {
  const catalog = await vatConfigService.getCatalog();
  res.json({ status: 'success', data: catalog });
});

exports.upsertMapping = catchAsync(async (req, res) => {
  const mapping = await vatConfigService.upsertMapping(req.body, req.user);
  res.status(201).json({ status: 'success', data: mapping });
});

exports.removeMapping = catchAsync(async (req, res) => {
  const result = await vatConfigService.removeMapping(req.params.id, req.user);
  res.json({ status: 'success', data: result });
});

exports.getMappingHistory = catchAsync(async (req, res) => {
  const history = await vatConfigService.getMappingHistory();
  res.json({ status: 'success', data: history });
});
