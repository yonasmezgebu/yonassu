const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const integrationService = require('../../services/integration.service');

const requireMeta = (key) => {
  const meta = integrationService.getMeta(key);
  if (!meta) throw new AppError('Unknown integration key', 404);
  return meta;
};

const missingRequiredFields = (meta, body) => {
  return meta.fields
    .filter(f => f.required && !String(body[f.key] ?? '').trim())
    .map(f => f.label);
};

exports.listIntegrations = catchAsync(async (req, res) => {
  await integrationService.ensureSeed();
  const rows = await db('integration_settings').orderBy('id', 'asc');
  const integrations = {};
  for (const row of rows) {
    const meta = integrationService.getMeta(row.integration_key) || {};
    integrations[row.integration_key] = {
      key: row.integration_key,
      title: meta.title || row.integration_key,
      icon: meta.icon || '🔌',
      desc: meta.desc || '',
      status: row.status,
      enabled: !!row.enabled,
      config: integrationService.maskConfig(integrationService.parseConfig(row.config)),
      lastSync: row.last_sync_at || null,
      connectedAt: row.connected_at || null,
      fields: meta.fields || []
    };
  }
  res.json({ status: 'success', data: { integrations } });
});

exports.connectIntegration = catchAsync(async (req, res) => {
  const { key } = req.params;
  const meta = requireMeta(key);
  const body = req.body || {};
  const current = await integrationService.getRow(key);
  const existing = integrationService.parseConfig(current ? current.config : null);
  const config = integrationService.normalizeConfig(meta, body, existing);
  const missing = missingRequiredFields(meta, config);
  if (missing.length) {
    throw new AppError(`Missing required credential(s): ${missing.join(', ')}`, 400);
  }
  await integrationService.upsert(key, {
    config: JSON.stringify(config),
    status: 'connected',
    enabled: true,
    connected_at: db.fn.now(),
    updated_by: req.user.full_name || req.user.fullName || 'Admin'
  });
  await audit('INTEGRATION_CONNECTED', req.user.id, {
    ip: req.ip,
    resourceId: key,
    details: { integration: meta.title, provider: config.provider || config.system || config.bank || config.authority || '' }
  });
  await integrationService.recordSync(key, 'Connect', 'SUCCESS', `${meta.title} connected`);
  res.json({ status: 'success', message: `${meta.title} connected successfully.`, data: { key, status: 'connected' } });
});

exports.disconnectIntegration = catchAsync(async (req, res) => {
  const { key } = req.params;
  const meta = requireMeta(key);
  await integrationService.upsert(key, {
    status: 'disconnected',
    enabled: false,
    connected_at: null,
    updated_by: req.user.full_name || req.user.fullName || 'Admin'
  });
  await audit('INTEGRATION_DISCONNECTED', req.user.id, {
    ip: req.ip,
    resourceId: key,
    details: { integration: meta.title }
  });
  await integrationService.recordSync(key, 'Disconnect', 'SUCCESS', `${meta.title} disconnected`);
  res.json({ status: 'success', message: `${meta.title} disconnected.`, data: { key, status: 'disconnected' } });
});

exports.updateIntegrationConfig = catchAsync(async (req, res) => {
  const { key } = req.params;
  const meta = requireMeta(key);
  const body = req.body || {};
  const current = await integrationService.getRow(key);
  const existing = integrationService.parseConfig(current ? current.config : null);
  const config = integrationService.normalizeConfig(meta, body, existing);
  await integrationService.upsert(key, {
    config: JSON.stringify(config),
    updated_by: req.user.full_name || req.user.fullName || 'Admin'
  });
  await audit('INTEGRATION_CONFIG_UPDATED', req.user.id, {
    ip: req.ip,
    resourceId: key,
    details: { integration: meta.title, keys: Object.keys(config) }
  });
  res.json({ status: 'success', message: 'Configuration saved.', data: { key } });
});

exports.testIntegration = catchAsync(async (req, res) => {
  const { key } = req.params;
  const meta = requireMeta(key);
  const current = await integrationService.getRow(key);
  const saved = integrationService.parseConfig(current ? current.config : null);
  const body = integrationService.normalizeConfig(meta, req.body || {}, saved);
  const missing = missingRequiredFields(meta, body);
  if (missing.length) {
    await integrationService.recordSync(key, 'Test', 'FAILED', `Missing credential(s): ${missing.join(', ')}`);
    throw new AppError(`Test failed — missing credential(s): ${missing.join(', ')}`, 400);
  }
  await integrationService.recordSync(key, 'Test', 'SUCCESS', `${meta.title} configuration validated`);
  res.json({
    status: 'success',
    message: `${meta.title} configuration is valid. All required credentials are provided. Live traffic will use the configured provider endpoint.`,
    data: { key, success: true }
  });
});

exports.toggleIntegration = catchAsync(async (req, res) => {
  const { key } = req.params;
  const meta = requireMeta(key);
  const enabled = req.body && req.body.enabled !== undefined ? !!req.body.enabled : false;
  const current = await integrationService.getRow(key);
  await integrationService.upsert(key, {
    enabled,
    updated_by: req.user.full_name || req.user.fullName || 'Admin'
  });
  await audit('INTEGRATION_TOGGLED', req.user.id, {
    ip: req.ip,
    resourceId: key,
    details: { integration: meta.title, enabled, previous: current ? !!current.enabled : false }
  });
  res.json({
    status: 'success',
    message: `${meta.title} ${enabled ? 'enabled' : 'disabled'}.`,
    data: { key, enabled }
  });
});

exports.getIntegrationHistory = catchAsync(async (req, res) => {
  const { key } = req.params;
  requireMeta(key);
  const history = await integrationService.getHistory(key);
  res.json({ status: 'success', data: { history } });
});