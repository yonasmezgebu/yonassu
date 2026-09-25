const { db } = require('../config/database');
const env = require('../config/env');

/**
 * Central integration registry + persistence.
 * Adding a new integration later = add an entry to KNOWN_INTEGRATIONS and it will
 * automatically appear in the admin UI with its own configuration form.
 */
const KNOWN_INTEGRATIONS = [
  {
    key: 'sms', title: 'SMS', icon: '📱',
    desc: 'Send alerts, OTPs, and payment reminders directly to phones.',
    fields: [
      { key: 'provider', label: 'SMS Provider', type: 'select', required: true, options: ["Africa's Talking", 'AfroMessage', 'Twilio', 'Nexmo', 'Custom'], help: 'Select your SMS gateway provider.' },
      { key: 'environment', label: 'Environment', type: 'select', options: ['Sandbox', 'Live'], help: 'Africa\u2019s Talking only. Sandbox = free testing (username "sandbox"). Ignored by AfroMessage.' },
      { key: 'username', label: 'AT Username', type: 'text', placeholder: 'e.g. sandbox or yourAppUsername', help: 'Africa\u2019s Talking only. Ignored by AfroMessage.' },
      { key: 'identifier', label: 'Identifier ID', type: 'text', placeholder: 'e.g. e80ad9d8-adf3-463f-80f4-7c4b39f7f164', help: 'AfroMessage only (optional). Sent as the "from" parameter alongside the sender name.' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Enter API key', secret: true, help: 'AfroMessage: your Bearer API token from the dashboard. Africa\u2019s Talking: your app API key.' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter API secret', secret: true, help: 'Only used by non-Africa\u2019s-Talking/non-AfroMessage providers.' },
      { key: 'senderId', label: 'Sender Name', type: 'text', placeholder: 'e.g. SUTANA', help: 'AfroMessage: your sender name, requested and verified on the dashboard before production. Sent as "sender".' },
    ]
  },
  {
    key: 'email', title: 'Email', icon: '✉️',
    desc: 'Send invoices, reports, and notifications to users and customers.',
    fields: [
      { key: 'provider', label: 'Email Provider', type: 'select', required: true, options: ['SMTP', 'SendGrid', 'Mailgun', 'AWS SES'], help: 'Select your email delivery service.' },
      { key: 'host', label: 'SMTP Host', type: 'text', placeholder: 'e.g. smtp.example.com', help: 'Incoming mail server hostname.' },
      { key: 'port', label: 'Port', type: 'text', placeholder: 'e.g. 587', help: 'SMTP port (typically 587 for TLS).' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'SMTP username' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'SMTP password', secret: true, help: 'Stored securely.' },
      { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'e.g. noreply@myerp.com' },
      { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'e.g. MyERP System' },
    ]
  },
  {
    key: 'payment', title: 'Payment Services', icon: '💳',
    desc: 'Connect Ethiopian payment providers for receiving and processing payments.',
    fields: [
      { key: 'provider', label: 'Payment Provider', type: 'select', required: true, options: ['Telebirr', 'CBE Birr', 'Amole', 'HelloCash', 'Custom'], help: 'Select your payment gateway.' },
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true, placeholder: 'Your merchant ID' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'API key', secret: true },
      { key: 'callbackUrl', label: 'Callback URL', type: 'text', placeholder: 'https://yourerp.com/api/payment/callback', help: 'URL where payment confirmations are sent.' },
    ]
  },
  {
    key: 'banking', title: 'Banking Systems', icon: '🏦',
    desc: 'Connect to bank APIs for reconciliation and transfers.',
    fields: [
      { key: 'bank', label: 'Bank', type: 'select', required: true, options: ['Commercial Bank of Ethiopia', 'Dashen Bank', 'Awash Bank', 'Wegagen Bank', 'Custom'], help: 'Select the bank to connect.' },
      { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', required: true, placeholder: 'https://api.bank.com/v1' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Client secret', secret: true },
    ]
  },
  {
    key: 'storage', title: 'Object Storage', icon: '☁️',
    desc: 'Store PDFs, images, and documents in dedicated file storage.',
    fields: [
      { key: 'provider', label: 'Storage Provider', type: 'select', required: true, options: ['AWS S3', 'Google Cloud Storage', 'Azure Blob', 'MinIO', 'Custom'], help: 'Select your object storage provider.' },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'e.g. myerp-documents' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. us-east-1' },
      { key: 'accessKey', label: 'Access Key', type: 'password', required: true, placeholder: 'Access key ID', secret: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'Secret access key', secret: true },
    ]
  },
  {
    key: 'tax', title: 'Tax / Government', icon: '🏛️',
    desc: 'Connect to official APIs for tax reporting and compliance.',
    fields: [
      { key: 'authority', label: 'Tax Authority', type: 'select', required: true, options: ['Ethiopian Revenue Authority', 'Custom'], help: 'Select the government/tax authority.' },
      { key: 'tin', label: 'TIN Number', type: 'text', required: true, placeholder: 'Your TIN' },
      { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', placeholder: 'Official API endpoint URL' },
      { key: 'certPath', label: 'Certificate Path', type: 'text', placeholder: 'Path to client certificate', help: 'Required for official government API connections.' },
    ]
  },
  {
    key: 'accounting', title: 'Accounting Systems', icon: '📊',
    desc: 'Exchange financial data with external accounting systems.',
    fields: [
      { key: 'system', label: 'Accounting System', type: 'select', required: true, options: ['QuickBooks', 'Xero', 'Sage', 'Custom'], help: 'Select the external accounting system.' },
      { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', required: true, placeholder: 'API base URL' },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'OAuth client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'OAuth client secret', secret: true },
    ]
  },
];

const SECRET_KEYS = ['apiKey', 'apiSecret', 'password', 'clientSecret', 'secretKey', 'accessKey'];
const MASK = '••••••••';

const getMeta = (key) => KNOWN_INTEGRATIONS.find(i => i.key === key) || null;

const parseConfig = (val) => {
  if (!val) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return val || {};
};

const maskConfig = (configObj = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(configObj)) {
    out[k] = SECRET_KEYS.includes(k) && v ? MASK : v;
  }
  return out;
};

/**
 * Merge incoming (possibly masked) credentials with existing stored values.
 * - Secret fields left empty or still showing the mask placeholder keep the stored value.
 * - Non-secret fields are updated whenever provided.
 */
const normalizeConfig = (meta, incoming = {}, existing = {}) => {
  const out = { ...existing };
  for (const field of meta.fields) {
    const v = incoming[field.key];
    if (v === undefined || v === null) continue;
    const str = String(v).trim();
    if (SECRET_KEYS.includes(field.key)) {
      if (str === '' || str === MASK) continue;
      out[field.key] = str;
    } else {
      out[field.key] = str;
    }
  }
  return out;
};

const envSeedStatus = (key) => {
  switch (key) {
    case 'sms': return { enabled: !!env.sms?.enabled, status: env.sms?.enabled ? 'connected' : 'disconnected', config: {} };
    case 'email': return { enabled: !!env.email?.enabled, status: env.email?.enabled ? 'connected' : 'disconnected', config: {} };
    case 'banking': return { enabled: !!env.banks?.telebirr?.enabled, status: env.banks?.telebirr?.enabled ? 'connected' : 'disconnected', config: {} };
    default: return { enabled: false, status: 'disconnected', config: {} };
  }
};

const ensureSeed = async () => {
  for (const meta of KNOWN_INTEGRATIONS) {
    const existing = await db('integration_settings').where('integration_key', meta.key).first();
    if (existing) continue;
    const seed = envSeedStatus(meta.key);
    await db('integration_settings').insert({
      integration_key: meta.key,
      config: seed.config ? JSON.stringify(seed.config) : null,
      status: seed.status,
      enabled: seed.enabled
    });
  }
};

const getRow = async (key) => db('integration_settings').where('integration_key', key).first();

const upsert = async (key, patch) => {
  const existing = await getRow(key);
  const data = { ...patch, updated_at: db.fn.now() };
  if (existing) {
    await db('integration_settings').where('integration_key', key).update(data);
  } else {
    await db('integration_settings').insert({ integration_key: key, ...data, created_at: db.fn.now() });
  }
  return getRow(key);
};

const recordSync = async (key, action, status, detail) => {
  await db('integration_sync_logs').insert({ integration_key: key, action, status, detail });
  await db('integration_settings').where('integration_key', key).update({ last_sync_at: db.fn.now(), updated_at: db.fn.now() });
};

const getHistory = async (key, limit = 50) => {
  return db('integration_sync_logs').where('integration_key', key).orderBy('timestamp', 'desc').limit(limit);
};

module.exports = {
  KNOWN_INTEGRATIONS,
  getMeta,
  parseConfig,
  maskConfig,
  normalizeConfig,
  ensureSeed,
  getRow,
  upsert,
  recordSync,
  getHistory
};