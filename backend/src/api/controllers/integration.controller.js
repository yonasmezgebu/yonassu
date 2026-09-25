const { db } = require('../../config/database');
const { audit, logger } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const integrationService = require('../../services/integration.service');
const smsService = require('../../services/sms.service');

const dumpSmsError = (err) => {
  console.log('==== SMS ERROR ====');
  console.log('error.message:', err && err.message);
  console.log('error.response?.data:', err && err.response ? err.response.data : (err && err.providerData !== undefined ? err.providerData : null));
  console.log('===================');
  logger.error(err && err.message, { providerResponse: err && err.response ? err.response.data : (err && err.providerData !== undefined ? err.providerData : null) });
};

const smsErrorMessage = (err, fallback) => {
  const providerRaw = err && err.providerData !== undefined
    ? err.providerData
    : (err && err.response && err.response.data);
  const clean = String(err && err.message || fallback).replace(/^SMS send failed: /, '');
  const echo = providerRaw
    ? (typeof providerRaw === 'string' ? providerRaw : JSON.stringify(providerRaw)).substring(0, 400)
    : '';
  return { clean, echo, providerRaw };
};

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

  // Provider-specific required credentials for SMS.
  if (key === 'sms') {
    const provider = String(config.provider || '').toLowerCase();
    if (provider.includes('afromessage')) {
      if (!String(config.senderId || config.identifier || '').trim()) {
        throw new AppError('AfroMessage requires a Sender Name (verified on the AfroMessage dashboard) or an Identifier ID. Add one in the Configure tab.', 400);
      }
    } else if (!String(config.username || '').trim()) {
      throw new AppError(`Africa's Talking requires a username (sandbox uses "sandbox"). Add it under Configure.`, 400);
    }
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

  // SMS: actually validate the credentials against the provider (Africa's Talking).
  if (key === 'sms') {
    const testPhone = String((req.body && req.body.testPhone) || '').trim();
    let result;
    if (!testPhone) {
      try {
        result = await smsService.testConnection(body);
      } catch (err) {
        dumpSmsError(err);
        await integrationService.recordSync(key, 'Test', 'FAILED', err.message || 'Connection test error');
        throw new AppError(`Test failed — ${err.message || 'could not reach the provider.'}`, 400);
      }
      if (!result || !result.success) {
        console.log('==== SMS CONNECTION TEST FAILED ====');
        console.log('message:', result && result.message);
        console.log('=====================================');
        await integrationService.recordSync(key, 'Test', 'FAILED', (result && result.message) || 'Connection test failed');
        throw new AppError(`Test failed — ${(result && result.message) || 'invalid provider response.'}`, 400);
      }
      await integrationService.recordSync(key, 'Test', 'SUCCESS', result.message);
      return res.json({
        status: 'success',
        message: result.message,
        data: { key, success: true, detail: result.message }
      });
    }

    const isAfro = /afromessage/i.test(String(body.provider || '').trim());
    const sandbox = !isAfro && /^(sandbox|test)$/i.test(String(body.environment || '').trim());
    if (!smsService.validatePhoneNumber(testPhone, { sandbox })) {
      const expected = sandbox
        ? 'international format like +254722343343'
        : 'Ethiopian format like 0912345678';
      throw new AppError(`Test failed — invalid phone number: ${testPhone}. Use ${expected}.`, 400);
    }
    let sent;
    try {
      const testMessage = String((req.body && req.body.testMessage) || '').trim();
      sent = await smsService.testSMSConfig(testPhone, testMessage);
    } catch (err) {
      dumpSmsError(err);
      const { clean, echo, providerRaw } = smsErrorMessage(err, 'SMS could not be sent.');
      await integrationService.recordSync(key, 'Test', 'FAILED', `${clean}${echo ? ` — ${echo}` : ''}`);
      throw new AppError(`Test failed — ${clean}${echo ? ` [provider: ${echo}]` : ''}`, 400, echo ? [{ field: 'provider', message: echo, raw: providerRaw }] : null);
    }
    const detail = sent.mock
      ? 'Test SMS logged as mock (integration disabled). Enable SMS in Integrations to send real messages.'
      : `Test SMS ${sent && sent.statusCounts ? JSON.stringify(sent.statusCounts) : 'sent'} to ${testPhone} via ${body.environment || 'Sandbox'}`;
    await integrationService.recordSync(key, 'Test', 'SUCCESS', detail);
    return res.json({
      status: 'success',
      message: detail,
      data: { key, success: true, mock: !!sent.mock, detail, recipient: testPhone, statusCounts: sent && sent.statusCounts }
    });
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