const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const smsQueue = [];
const MAX_RETRIES = 5;
const RETRY_DELAYS = [300, 600, 1200, 2400, 4800];
const RATE_LIMIT_PER_SECOND = 10;
let requestTimestamps = [];

// Africa's Talking base URLs
const AT_LIVE_BASE = 'https://api.africastalking.com/version1';
const AT_SANDBOX_BASE = 'https://api.sandbox.africastalking.com/version1';
const DEFAULT_FROM = 'SUTANA';

// Africa's Talking recipient status codes (from provider docs)
const STATUS_MESSAGES = {
  100: 'Accepted and processing',
  101: 'Sent to the mobile network (success)',
  102: 'Queued',
  403: 'Invalid phone number',
  405: 'Insufficient balance',
  500: 'Internal server error on provider side',
  502: 'Rejected by the gateway (telco)'
};

const initSmsService = async () => {
  logger.info('✅ SMS service initialized');
  return true;
};

const validatePhoneNumber = (phone) => {
  const ethiopianRegex = /^09[0-9]{8}$/;
  return ethiopianRegex.test(phone);
};

const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  // Ethiopian format: 09xxxxxxxx -> 251xxxxxxxx
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return `251${cleaned.substring(1)}`;
  }
  return cleaned;
};

/**
 * Resolve SMS configuration from the Admin → Integrations settings (DB) with
 * env (.env AFRICA_TALKING_*) as a fallback so the admin dashboard config is
 * what actually drives every send.
 */
const loadSmsConfig = async () => {
  let dbConfig = {};
  let dbEnabled = false;
  try {
    const row = await db('integration_settings').where('integration_key', 'sms').first();
    if (row && row.config) {
      try { dbConfig = JSON.parse(row.config); } catch (_) { dbConfig = {}; }
      dbEnabled = !!(row.enabled && row.status === 'connected');
    }
  } catch (e) {
    logger.warn('SMS settings read failed (using env fallback): ' + e.message);
  }
  const cfg = {
    username: (dbConfig.username || config.sms?.username || '').trim(),
    apiKey: (dbConfig.apiKey || config.sms?.apiKey || '').trim(),
    senderId: (dbConfig.senderId || config.sms?.senderId || DEFAULT_FROM).trim(),
    endpoint: (dbConfig.endpoint || config.sms?.endpoint || '').trim(),
    environment: (dbConfig.environment || 'Sandbox').toString().toLowerCase(),
    enabled: dbEnabled || (config.sms?.enabled === true)
  };
  if (cfg.endpoint) cfg.endpoint = cfg.endpoint.replace(/\/+$/, '');
  return cfg;
};

const baseUrl = (cfg) => {
  if (cfg.endpoint) return cfg.endpoint;
  const live = cfg.environment === 'live' || cfg.environment === 'production';
  return live ? AT_LIVE_BASE : AT_SANDBOX_BASE;
};

const applyRateLimit = async () => {
  const now = Date.now();
  const oneSecondAgo = now - 1000;
  requestTimestamps = requestTimestamps.filter(ts => ts > oneSecondAgo);
  if (requestTimestamps.length >= RATE_LIMIT_PER_SECOND) {
    const oldestTimestamp = requestTimestamps[0];
    const waitTime = 1000 - (now - oldestTimestamp);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    return applyRateLimit();
  }
  requestTimestamps.push(now);
};

/**
 * Map a provider error to a human-readable message (incl. auth failures such
 * as "Supplied authentication is invalid").
 */
const mapSendError = (err, fallback) => {
  const body = err && err.response ? err.response.data : null;
  if (body) {
    if (typeof body === 'string') return body.substring(0, 300);
    const msg = (body && (body.error?.message || body.errorMessage || body.error || body.message));
    if (msg) {
      if (/authentication is invalid|invalid.*(auth|api)|unauthorized|forbidden/i.test(String(msg))) {
        return 'Supplied authentication is invalid. Check your AT username and API key in Admin → Integrations → SMS.';
      }
      return String(msg).substring(0, 300);
    }
  }
  if (err && err.response && err.response.status === 401) {
    return 'Supplied authentication is invalid. Check your AT username and API key in Admin → Integrations → SMS.';
  }
  if (err && err.code === 'ECONNABORTED') return 'Timed out contacting the SMS provider.';
  if (err && err.code === 'ENOTFOUND') return 'Could not reach the SMS provider endpoint.';
  return (err && err.message) || fallback || 'Unknown SMS error';
};

/**
 * Parse the Africa's Talking send response body:
 * { "SMSMessageData": { "Message": "...", "Recipients": [ { statusCode, number, cost, status, messageId } ] } }
 */
const parseSendResponse = (data) => {
  const recs = (data && data.SMSMessageData && data.SMSMessageData.Recipients) || [];
  const parsed = {
    summary: (data && data.SMSMessageData && data.SMSMessageData.Message) || '',
    recipients: [],
    okCount: 0,
    failedCount: 0,
    statusCounts: {}
  };
  for (const r of recs) {
    const code = Number(r.statusCode) || 0;
    const ok = [100, 101, 102].includes(code);
    const label = STATUS_MESSAGES[code] || r.status || 'Unknown';
    parsed.statusCounts[code] = (parsed.statusCounts[code] || 0) + 1;
    if (ok) parsed.okCount++;
    else parsed.failedCount++;
    parsed.recipients.push({
      number: r.number,
      statusCode: code,
      status: r.status,
      messageId: r.messageId,
      cost: r.cost,
      ok,
      detail: `${r.status || 'Unknown'} (code ${code} — ${label})${r.messageId ? ' · msgId ' + r.messageId : ''}`
    });
  }
  if (recs.length === 0) {
    parsed.summary = typeof data === 'string' ? data
      : (data && (data.error?.message || data.errorMessage || data.message)) || parsed.summary || 'No recipient details returned';
  }
  return parsed;
};

const sendSMS = async (options) => {
  const cfg = await loadSmsConfig();
  const { to, message, senderId = cfg.senderId } = options;
  if (!cfg.enabled) {
    logger.info(`SMS disabled. Would send to ${to}: ${String(message).substring(0, 50)}...`);
    return { mock: true, to, message: String(message).substring(0, 50) };
  }
  if (!cfg.username || !cfg.apiKey) {
    throw new Error('SMS is not configured. Add your Africa\u2019s Talking username and API key in Admin \u2192 Integrations \u2192 SMS.');
  }
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = [];
  const invalidRecipients = [];
  for (const recipient of recipients) {
    const clean = String(recipient || '').trim();
    if (validatePhoneNumber(clean)) {
      validRecipients.push(formatPhoneNumber(clean));
    } else {
      invalidRecipients.push(clean);
      logger.warn(`Invalid phone number format: ${clean}`);
    }
  }
  if (validRecipients.length === 0) {
    throw new Error('No valid phone numbers provided');
  }
  await applyRateLimit();
  const payload = {
    username: cfg.username,
    to: validRecipients.join(','),
    message: String(message).substring(0, 480),
    from: senderId || cfg.senderId
  };
  try {
    const response = await axios.post(
      `${baseUrl(cfg)}/messaging`,
      new URLSearchParams(payload),
      {
        headers: {
          apiKey: cfg.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );
    const parsed = parseSendResponse(response.data);
    for (const rec of parsed.recipients) {
      await logSmsCommunication(rec.number, message, rec.ok ? 'sent' : 'failed', rec.detail);
    }
    for (const invalid of invalidRecipients) {
      await logSmsCommunication(invalid, message, 'failed', 'Invalid phone number format');
    }
    logger.info(`SMS -> ${validRecipients.length} recipient(s): ${parsed.summary || message.substring(0, 50)}`);
    if (parsed.failedCount > 0 && parsed.okCount === 0) {
      throw new Error(`SMS rejected by provider: ${parsed.summary || 'all recipients failed'}`);
    }
    return {
      success: true,
      recipients: parsed.recipients.map(r => r.number),
      invalid: invalidRecipients,
      summary: parsed.summary,
      statusCounts: parsed.statusCounts,
      response: response.data
    };
  } catch (error) {
    const errorMessage = mapSendError(error, '');   // if throw err above, it's already a clean msg
    const finalMsg = /^SMS rejected by provider/.test(errorMessage) ? errorMessage.replace(/^SMS rejected by provider: /, '') : errorMessage;
    logger.error(`SMS send failed: ${finalMsg}`);
    for (const recipient of validRecipients) {
      await logSmsCommunication(recipient, message, 'failed', finalMsg);
    }
    for (const invalid of invalidRecipients) {
      await logSmsCommunication(invalid, message, 'failed', 'Invalid phone number format');
    }
    await queueSmsForRetry({ to: validRecipients, message, senderId });
    throw new Error(`SMS send failed: ${finalMsg}`);
  }
};

/**
 * Validate Africa's Talking credentials without sending an SMS. Calls the
 * account balance endpoint; invalid credentials return the provider's
 * "Supplied authentication is invalid" message.
 */
const testConnection = async (credentials = {}) => {
  const cfg = await loadSmsConfig();
  const username = (credentials.username || cfg.username || '').trim();
  const apiKey = (credentials.apiKey || cfg.apiKey || '').trim();
  const environment = (credentials.environment || cfg.environment || 'Sandbox').toString().toLowerCase();
  const endpoint = (credentials.endpoint || '').trim().replace(/\/+$/, '');
  if (!username || !apiKey) {
    return { success: false, message: 'Missing credentials. Provide your Africa\u2019s Talking username and API key.' };
  }
  const base = endpoint || (environment === 'live' || environment === 'production' ? AT_LIVE_BASE : AT_SANDBOX_BASE);
  try {
    const res = await axios.get(`${base}/user?username=${encodeURIComponent(username)}`, {
      headers: { apiKey, Accept: 'application/json' },
      timeout: 20000
    });
    const balance = res.data && res.data.UserData && res.data.UserData.balance;
    return {
      success: true,
      message: `Connected to Africa\u2019s Talking (${environment === 'live' ? 'live' : 'sandbox'}). Wallet balance: ${balance || 'n/a'}`
    };
  } catch (err) {
    return { success: false, message: mapSendError(err, 'Connection test failed.') };
  }
};

const queueSmsForRetry = async (smsData) => {
  smsQueue.push({
    ...smsData,
    retryCount: 0,
    queuedAt: new Date().toISOString()
  });
  logger.info(`SMS queued for retry. Queue size: ${smsQueue.length}`);
};

const processSmsRetryQueue = async () => {
  let processed = 0;
  const now = Date.now();
  for (let i = smsQueue.length - 1; i >= 0; i--) {
    const sms = smsQueue[i];
    const queuedTime = new Date(sms.queuedAt).getTime();
    const nextRetryDelay = RETRY_DELAYS[sms.retryCount] * 1000;
    if (now - queuedTime >= nextRetryDelay) {
      try {
        await sendSMS({
          to: sms.to,
          message: sms.message,
          senderId: sms.senderId
        });
        smsQueue.splice(i, 1);
        processed++;
      } catch (error) {
        sms.retryCount++;
        sms.lastAttemptAt = new Date().toISOString();
        if (sms.retryCount >= MAX_RETRIES) {
          logger.error(`SMS permanently failed after ${MAX_RETRIES} retries: ${sms.to}`);
          for (const recipient of sms.to) {
            await logSmsCommunication(recipient, sms.message, 'permanently_failed', 'Max retries exceeded');
          }
          smsQueue.splice(i, 1);
        }
      }
    }
  }
  if (processed > 0) {
    logger.info(`Processed ${processed} SMS from retry queue`);
  }
  return processed;
};

const logSmsCommunication = async (recipient, message, status, response) => {
  try {
    await db('communication_logs').insert({
      type: 'sms',
      recipient,
      content: String(message).substring(0, 1000),
      status,
      provider_response: typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response),
      retry_count: 0,
      created_at: db.fn.now(),
      sent_at: status === 'sent' ? db.fn.now() : null
    });
  } catch (error) {
    logger.error('Failed to log SMS communication:', error.message);
  }
};

const sendOrderConfirmationSMS = async (phone, orderNumber, totalPrice, dueDate) => {
  const message = `Order ${orderNumber} confirmed. Total: ${totalPrice} ETB. Due date: ${dueDate}. Track at: ${config.frontendUrl}/track`;
  return sendSMS({ to: phone, message });
};
const sendOrderStatusUpdateSMS = async (phone, orderNumber, status) => {
  const statusMessage = status === 'ready'
    ? 'Your order is ready for pickup!'
    : status === 'delivered'
      ? 'Your order has been delivered. Thank you!'
      : `Your order is now ${status}`;
  const message = `Order ${orderNumber}: ${statusMessage}`;
  return sendSMS({ to: phone, message });
};
const sendPaymentConfirmationSMS = async (phone, amount, reference) => {
  const message = `Payment of ${amount} ETB confirmed. Reference: ${reference}. Thank you!`;
  return sendSMS({ to: phone, message });
};
const sendLowStockAlertSMS = async (phone, productName, currentStock, reorderLevel) => {
  const message = `ALERT: ${productName} is low on stock! Current: ${currentStock}, Reorder level: ${reorderLevel}. Please restock immediately.`;
  return sendSMS({ to: phone, message });
};
const sendWelcomeSMS = async (phone, name, email) => {
  const message = `Welcome ${name} to Sutana EMS! Use email ${email} and the temporary password sent to your email to login.`;
  return sendSMS({ to: phone, message });
};
const sendOverdueReminderSMS = async (phone, customerName, amount, daysOverdue) => {
  const message = `Dear ${customerName}, your payment of ${amount} ETB is ${daysOverdue} days overdue. Please settle your account to avoid service interruption.`;
  return sendSMS({ to: phone, message });
};
const sendBulkSMS = async (recipients, message) => {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };
  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    try {
      await sendSMS({ to: batch, message });
      results.sent += batch.length;
    } catch (error) {
      results.failed += batch.length;
      results.errors.push({ batch: i / batchSize, error: error.message });
    }
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
};
const testSMSConfig = async (testPhone) => {
  const message = 'Sutana EMS - SMS configuration test. Your SMS service is working correctly!';
  return sendSMS({ to: testPhone, message });
};
const getSMSStats = async (days = 7) => {
  const stats = await db('communication_logs')
    .where('type', 'sms')
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
      db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
    )
    .first();
  return {
    total: parseInt(stats?.total || 0),
    sent: parseInt(stats?.sent || 0),
    failed: parseInt(stats?.failed || 0),
    successRate: stats?.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0,
    queueSize: smsQueue.length
  };
};
const verifyWebhookSignature = async (payload, signature) => {
  const cfg = await loadSmsConfig();
  const expectedSignature = crypto
    .createHmac('sha256', cfg.apiKey || '')
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
  return signature === expectedSignature;
};
const handleDeliveryWebhook = async (data) => {
  const { messageId, status, reason, recipient } = data;
  await db('communication_logs')
    .where('provider_response', 'like', `%${messageId}%`)
    .orWhere('recipient', recipient)
    .update({
      status: status === 'delivered' ? 'sent' : 'failed',
      provider_response: db.raw(`CONCAT(provider_response, ' - Delivery: ${status}, Reason: ${reason || 'N/A'}')`)
    });
  logger.info(`SMS delivery webhook processed for ${recipient}: ${status}`);
};
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    processSmsRetryQueue().catch(err => logger.error('SMS retry processor error:', err.message));
  }, 60000);
}
module.exports = {
  initSmsService,
  sendSMS,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS,
  sendPaymentConfirmationSMS,
  sendLowStockAlertSMS,
  sendWelcomeSMS,
  sendOverdueReminderSMS,
  sendBulkSMS,
  testSMSConfig,
  testConnection,
  getSMSStats,
  validatePhoneNumber,
  formatPhoneNumber,
  processSmsRetryQueue,
  verifyWebhookSignature,
  handleDeliveryWebhook
};