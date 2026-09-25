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
// AfroMessage (Ethiopian provider) endpoints — per official docs
const AFROMESSAGE_SEND_URL = 'https://api.afromessage.com/api/send';
const AFROMESSAGE_BALANCE_URL = 'https://api.afromessage.com/api/balance';
const DEFAULT_FROM = 'SUTANA';
const MAX_MESSAGE_LENGTH = 480;

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

/**
 * Normalize any common Ethiopian phone input to the standard E.164 form
 * 2519… (used by Ethiopian providers like AfroMessage):
 *   - 09xxxxxxxx  -> 2519…
 *   - 9xxxxxxxx   -> 2519…
 *   - 2519…       -> kept
 *   - +2519…      -> kept (plus sign dropped for providers expecting plain digits)
 *   - 251 91 234 5678 / 09-1234-5678 / (spaces, dashes, parens) -> separated digits are stripped
 * Returns the standardized digits, or null when it is not a valid Ethiopian mobile number.
 * In sandbox mode any international test number (+254… etc.) is accepted and preserved.
 */
const normalizeNumber = (phone, opts = {}) => {
  const raw = String(phone || '').trim();
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (opts.sandbox) {
    return /^\d{9,15}$/.test(digits) ? (hasPlus ? `+${digits}` : digits) : null;
  }
  if (!/^\d{9,14}$/.test(digits)) return null;
  if (/^251[1-9]\d{8}$/.test(digits)) return digits;           // 2519… (12 digits)
  if (/^09\d{8}$/.test(digits)) return `251${digits.slice(1)}`;  // 09…  -> 2519…
  if (/^9\d{8}$/.test(digits)) return `251${digits}`;            // 9…   -> 2519…
  return null;
};

const validatePhoneNumber = (phone, opts = {}) => !!normalizeNumber(phone, opts);

const formatPhoneNumber = (phone, opts = {}) => normalizeNumber(phone, opts) || phone.replace(/[^\d]/g, '');

/**
 * Resolve SMS configuration from the Admin → Integrations settings (DB) with
 * env (.env) as a fallback so the admin dashboard config drives every send.
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
  const provider = String(dbConfig.provider || config.sms?.provider || "Africa's Talking").trim();
  const cfg = {
    provider: /afromessage/i.test(provider) ? 'afromessage'
      : /africa/i.test(provider) ? 'africastalking'
      : provider,
    username: (dbConfig.username || config.sms?.username || '').trim(),
    identifier: (dbConfig.identifier || config.sms?.identifier || '').trim(),
    apiKey: (dbConfig.apiKey || config.sms?.apiKey || '').trim(),
    senderId: (dbConfig.senderId || config.sms?.senderId || DEFAULT_FROM).trim(),
    endpoint: (dbConfig.endpoint || config.sms?.endpoint || '').trim(),
    environment: (dbConfig.environment || 'Sandbox').toString().toLowerCase(),
    enabled: dbEnabled || (config.sms?.enabled === true)
  };
  if (cfg.endpoint) cfg.endpoint = cfg.endpoint.replace(/\/+$/, '');
  return cfg;
};

const atBaseUrl = (cfg) => {
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

const AUTH_MSG = 'Supplied authentication is invalid. Check your API key and username/identifier in Admin \u2192 Integrations \u2192 SMS.';

/**
 * Map a provider error to a human-readable message (incl. auth failures).
 */
const mapSendError = (err, fallback) => {
  const body = err && err.response ? err.response.data : null;
  if (body) {
    if (typeof body === 'string') {
      return /authentication is invalid|invalid.*(auth|api|token|key)|unauthorized|forbidden/i.test(body) ? AUTH_MSG : body.substring(0, 300);
    }
    // AfroMessage wrapper: { response: { status, message, data } }
    const inner = body.response || body;
    const msg = (body && (body.error?.message || body.errorMessage || body.error || body.message))
      || (inner && (inner.message || inner.error));
    if (msg) {
      return /authentication is invalid|invalid.*(auth|api|token|key)|unauthorized|forbidden/i.test(String(msg)) ? AUTH_MSG : String(msg).substring(0, 300);
    }
  }
  if (err && err.response && err.response.status === 401) return AUTH_MSG;
  if (err && err.code === 'ECONNABORTED') return 'Timed out contacting the SMS provider.';
  if (err && err.code === 'ENOTFOUND') return 'Could not reach the SMS provider endpoint.';
  return (err && err.message) || fallback || 'Unknown SMS error';
};

/**
 * Parse the Africa's Talking send response body.
 */
const parseSendResponse = (data) => {
  const recs = (data && data.SMSMessageData && data.SMSMessageData.Recipients) || [];
  const parsed = {
    summary: (data && data.SMSMessageData && data.SMSMessageData.Message) || '',
    recipients: [],
    providers: [],
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

/**
 * Parse an AfroMessage response. All endpoints return the same envelope:
 *   { "acknowledge": "success" | "error" / "failure", "response": { ... } }
 * Only read the `response` body once acknowledge === "success".
 * Success examples:
 *   send:    { acknowledge: "success", response: { message_id: "...", status: "QUEUED" } }
 *   balance: { acknowledge: "success", response: { balance: 100 } }
 */
const parseAfroResponse = (data) => {
  data = data || {};
  const acknowledge = String(data.acknowledge || data.ack || '').toLowerCase();
  const ok = acknowledge === 'success';
  const response = data.response || {};
  return { ok, acknowledge, response, raw: data, message: response.message || response.error || '' };
};

const sendAfroMessage = async (cfg, payload) => {
  // Official POST /api/send body: { to, message, sender, from, callback }
  // sender = the sender name verified on the dashboard; from = optional identifier.
  const body = {
    to: payload.to,
    message: payload.message
  };
  if (cfg.senderId) body.sender = cfg.senderId;
  else if (cfg.identifier) body.sender = cfg.identifier;
  else body.sender = DEFAULT_FROM;
  if (cfg.identifier) body.from = cfg.identifier;
  const response = await axios.post(
    AFROMESSAGE_SEND_URL,
    body,
    {
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000
    }
  );
  const parsed = parseAfroResponse(response.data);
  if (!parsed.ok) {
    const err = new Error(parsed.message || `AfroMessage send failed (acknowledge: ${parsed.acknowledge})`);
    err.response = { data: response.data };
    throw err;
  }
  const messageId = parsed.response.message_id || parsed.data?.message_id || null;
  return {
    success: true,
    summary: parsed.message || 'SMS sent successfully',
    recipients: payload.toFull,
    messageId,
    ack: messageId,
    response: response.data
  };
};

const sendSMS = async (options) => {
  const cfg = await loadSmsConfig();
  const { to, message, senderId = cfg.senderId } = options;
  if (!cfg.enabled) {
    logger.info(`SMS disabled. Would send to ${to}: ${String(message).substring(0, 50)}...`);
    return { mock: true, to, message: String(message).substring(0, 50) };
  }
  const afromessage = cfg.provider === 'afromessage';
  if (afromessage && (!cfg.apiKey || (!cfg.identifier && !cfg.senderId))) {
    throw new Error('AfroMessage is not fully configured. Add your API key and Identifier ID in Admin \u2192 Integrations \u2192 SMS.');
  }
  if (!afromessage && (!cfg.username || !cfg.apiKey)) {
    throw new Error('SMS is not configured. Add your Africa\u2019s Talking username and API key in Admin \u2192 Integrations \u2192 SMS.');
  }
  const recipients = Array.isArray(to) ? to : [to];
  const sandbox = !afromessage && (cfg.environment === 'sandbox' || cfg.environment === 'test');
  const validRecipients = [];
  const invalidRecipients = [];
  for (const recipient of recipients) {
    const clean = String(recipient || '').trim();
    if (validatePhoneNumber(clean, { sandbox })) {
      validRecipients.push(formatPhoneNumber(clean, { sandbox }));
    } else {
      invalidRecipients.push(clean);
      logger.warn(`Invalid phone number format: ${clean}`);
    }
  }
  if (validRecipients.length === 0) {
    throw new Error('No valid phone numbers provided. Use Ethiopian format like 0912345678 or 2519XXXXXXXX.');
  }
  await applyRateLimit();
  const text = String(message).substring(0, MAX_MESSAGE_LENGTH);
  const payload = {
    to: afromessage ? validRecipients[0] : validRecipients.join(','),
    toFull: validRecipients,
    from: senderId || cfg.senderId,
    message: text
  };
  try {
    const result = afromessage
      ? await sendAfroMessage(cfg, payload)
      : await sendAfrcaTalking(cfg, payload);
    const recipientsProcessed = afromessage ? result.recipients : result.recipients;
    for (const rec of recipientsProcessed) {
      await logSmsCommunication(rec, text, 'sent', result.summary || 'sent');
    }
    for (const invalid of invalidRecipients) {
      await logSmsCommunication(invalid, text, 'failed', 'Invalid phone number format');
    }
    logger.info(`SMS -> ${validRecipients.length} recipient(s): ${result.summary || text.substring(0, 50)}`);
    if (result.success && result.failedCount > 0 && result.okCount === 0) {
      throw new Error(`SMS rejected by provider: ${result.summary || 'all recipients failed'}`);
    }
    return result;
  } catch (error) {
    const raw = mapSendError(error, '');
    const finalMsg = /^SMS rejected by provider/.test(raw) ? raw.replace(/^SMS rejected by provider: /, '') : raw;
    logger.error(`SMS send failed: ${finalMsg}`);
    for (const recipient of validRecipients) {
      await logSmsCommunication(recipient, text, 'failed', finalMsg);
    }
    for (const invalid of invalidRecipients) {
      await logSmsCommunication(invalid, text, 'failed', 'Invalid phone number format');
    }
    await queueSmsForRetry({ to: validRecipients, message: text, senderId });
    const wrapped = new Error(`SMS send failed: ${finalMsg}`);
    wrapped.providerData = (error && error.response && error.response.data);
    throw wrapped;
  }
};

const sendAfrcaTalking = async (cfg, payload) => {
  const response = await axios.post(
    `${atBaseUrl(cfg)}/messaging`,
    new URLSearchParams({
      username: cfg.username,
      to: typeof payload.to === 'string' ? payload.to : payload.to.join(','),
      message: payload.message,
      from: payload.from || cfg.senderId
    }),
    {
      headers: { apiKey: cfg.apiKey, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      timeout: 30000
    }
  );
  const parsed = parseSendResponse(response.data);
  const result = {
    success: true,
    summary: parsed.summary,
    recipients: parsed.recipients.map(r => r.number),
    okCount: parsed.okCount,
    failedCount: parsed.failedCount,
    statusCounts: parsed.statusCounts,
    response: response.data
  };
  if (parsed.failedCount > 0 && parsed.okCount === 0) {
    const err = new Error(`SMS rejected by provider: ${parsed.summary || 'all recipients failed'}`);
    err.response = { data: response.data };
    throw err;
  }
  return result;
};

/**
 * Validate provider credentials without requiring a send:
 *  - Africa's Talking: account balance endpoint.
 *  - AfroMessage: balance endpoint (graceful fallback message if unavailable).
 */
const testConnection = async (credentials = {}) => {
  const cfg = await loadSmsConfig();
  const provider = /afromessage/i.test(credentials.provider || cfg.provider || '') ? 'afromessage' : 'africastalking';
  const apiKey = (credentials.apiKey || cfg.apiKey || '').trim();
  if (!apiKey) {
    return { success: false, message: 'Missing credentials. Provide your API key in Admin \u2192 Integrations \u2192 SMS.' };
  }
  if (provider === 'afromessage') {
    try {
      const res = await axios.get(AFROMESSAGE_BALANCE_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 20000
      });
      const parsed = parseAfroResponse(res.data);
      if (!parsed.ok) {
        return { success: false, message: mapSendError({ response: { data: res.data } }) };
      }
      const balance = parsed.response.balance ?? parsed.response.due;
      return {
        success: true,
        message: `Connected to AfroMessage — account OK.${balance !== undefined ? ` Balance: ${balance}` : ''}`
      };
    } catch (err) {
      if (err.response || (err.code && err.code !== 'ECONNREFUSED')) {
        return { success: false, message: mapSendError(err) };
      }
      return { success: true, message: 'Key format looks valid — enter a phone number under Test to confirm delivery with a real SMS.' };
    }
  }
  const username = (credentials.username || cfg.username || '').trim();
  if (!username) {
    return { success: false, message: 'Missing credentials. Provide your Africa\u2019s Talking username and API key.' };
  }
  const environment = (credentials.environment || cfg.environment || 'Sandbox').toString().toLowerCase();
  const endpoint = (credentials.endpoint || '').trim().replace(/\/+$/, '');
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
  smsQueue.push({ ...smsData, retryCount: 0, queuedAt: new Date().toISOString() });
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
        await sendSMS({ to: sms.to, message: sms.message, senderId: sms.senderId });
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
  if (processed > 0) logger.info(`Processed ${processed} SMS from retry queue`);
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
  const results = { total: recipients.length, sent: 0, failed: 0, errors: [] };
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
const testSMSConfig = async (testPhone, message) => {
  const text = (message && String(message).trim()) || 'Sutana EMS - SMS configuration test. Your SMS service is working correctly!';
  return sendSMS({ to: testPhone, message: text });
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