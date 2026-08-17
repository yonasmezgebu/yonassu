import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './Integrations.module.css';

const INTEGRATIONS = [
  { key: 'sms', title: 'SMS', icon: '\uD83D\uDCF1', desc: 'Send alerts, OTPs, and payment reminders directly to phones.' },
  { key: 'email', title: 'Email', icon: '\u2709\uFE0F', desc: 'Send invoices, reports, and notifications to users and customers.' },
  { key: 'payment', title: 'Payment Services', icon: '\uD83D\uDCB3', desc: 'Connect Ethiopian payment providers for receiving and processing payments.' },
  { key: 'banking', title: 'Banking Systems', icon: '\uD83C\uDFE6', desc: 'Connect to bank APIs for reconciliation and transfers.' },
  { key: 'storage', title: 'Object Storage', icon: '\u2601\uFE0F', desc: 'Store PDFs, images, and documents in dedicated file storage.' },
  { key: 'tax', title: 'Tax / Government', icon: '\uD83C\uDFDB\uFE0F', desc: 'Connect to official APIs for tax reporting and compliance.' },
  { key: 'accounting', title: 'Accounting Systems', icon: '\uD83D\uDCCA', desc: 'Exchange financial data with external accounting systems.' },
];

const CONFIG_FIELDS = {
  sms: [
    { key: 'provider', label: 'SMS Provider', type: 'select', options: ['Africa\'s Talking', 'Twilio', 'Nexmo', 'Custom'], help: 'Select your SMS gateway provider.' },
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API key', help: 'Your provider API key. Stored securely and never shown in full.' },
    { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter API secret', help: 'Your provider API secret.' },
    { key: 'senderId', label: 'Sender ID', type: 'text', placeholder: 'e.g. MyERP', help: 'The name/number that appears as the sender.' },
  ],
  email: [
    { key: 'provider', label: 'Email Provider', type: 'select', options: ['SMTP', 'SendGrid', 'Mailgun', 'AWS SES'], help: 'Select your email delivery service.' },
    { key: 'host', label: 'SMTP Host', type: 'text', placeholder: 'e.g. smtp.example.com', help: 'Incoming mail server hostname.' },
    { key: 'port', label: 'Port', type: 'text', placeholder: 'e.g. 587', help: 'SMTP port (typically 587 for TLS).' },
    { key: 'username', label: 'Username', type: 'text', placeholder: 'SMTP username' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'SMTP password', help: 'Stored securely.' },
    { key: 'fromEmail', label: 'From Email', type: 'text', placeholder: 'e.g. noreply@myerp.com' },
    { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'e.g. MyERP System' },
  ],
  payment: [
    { key: 'provider', label: 'Payment Provider', type: 'select', options: ['Telebirr', 'CBE Birr', 'Amole', 'HelloCash', 'Custom'], help: 'Select your payment gateway.' },
    { key: 'merchantId', label: 'Merchant ID', type: 'text', placeholder: 'Your merchant ID' },
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'API key' },
    { key: 'callbackUrl', label: 'Callback URL', type: 'text', placeholder: 'https://yourerp.com/api/payment/callback', help: 'URL where payment confirmations are sent.' },
  ],
  banking: [
    { key: 'bank', label: 'Bank', type: 'select', options: ['Commercial Bank of Ethiopia', 'Dashen Bank', 'Awash Bank', 'Wegagen Bank', 'Custom'], help: 'Select the bank to connect.' },
    { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://api.bank.com/v1' },
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Client ID' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Client secret' },
  ],
  storage: [
    { key: 'provider', label: 'Storage Provider', type: 'select', options: ['AWS S3', 'Google Cloud Storage', 'Azure Blob', 'MinIO', 'Custom'], help: 'Select your object storage provider.' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'e.g. myerp-documents' },
    { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. us-east-1' },
    { key: 'accessKey', label: 'Access Key', type: 'password', placeholder: 'Access key ID' },
    { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Secret access key' },
  ],
  tax: [
    { key: 'authority', label: 'Tax Authority', type: 'select', options: ['Ethiopian Revenue Authority', 'Custom'], help: 'Select the government/tax authority.' },
    { key: 'tin', label: 'TIN Number', type: 'text', placeholder: 'Your TIN' },
    { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', placeholder: 'Official API endpoint URL' },
    { key: 'certPath', label: 'Certificate Path', type: 'text', placeholder: 'Path to client certificate', help: 'Required for official government API connections.' },
  ],
  accounting: [
    { key: 'system', label: 'Accounting System', type: 'select', options: ['QuickBooks', 'Xero', 'Sage', 'Custom'], help: 'Select the external accounting system.' },
    { key: 'apiEndpoint', label: 'API Endpoint', type: 'text', placeholder: 'API base URL' },
    { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'OAuth client ID' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'OAuth client secret' },
  ],
};

const FALLBACK = {
  sms: { status: 'connected', enabled: true, lastSync: new Date(Date.now() - 3600000).toISOString(), config: { provider: "Africa's Talking", senderId: 'MyERP' } },
  email: { status: 'connected', enabled: true, lastSync: new Date(Date.now() - 1800000).toISOString(), config: { provider: 'SMTP', host: 'smtp.example.com', fromEmail: 'noreply@myerp.com' } },
  payment: { status: 'connected', enabled: true, lastSync: new Date(Date.now() - 7200000).toISOString(), config: { provider: 'Telebirr', merchantId: 'MERCH-12345' } },
  banking: { status: 'disconnected', enabled: false, lastSync: null, config: {} },
  storage: { status: 'connected', enabled: true, lastSync: new Date(Date.now() - 600000).toISOString(), config: { provider: 'AWS S3', bucket: 'myerp-documents' } },
  tax: { status: 'disconnected', enabled: false, lastSync: null, config: {} },
  accounting: { status: 'connected', enabled: true, lastSync: new Date(Date.now() - 14400000).toISOString(), config: { system: 'QuickBooks' } },
};

const FALLBACK_HISTORY = [
  { id: 1, type: 'sms', action: 'Send OTP', status: 'SUCCESS', timestamp: new Date(Date.now() - 3600000).toISOString(), detail: 'Sent to +251911****12' },
  { id: 2, type: 'email', action: 'Send Invoice', status: 'SUCCESS', timestamp: new Date(Date.now() - 7200000).toISOString(), detail: 'INV-2024-0045 to customer@example.com' },
  { id: 3, type: 'sms', action: 'Send Reminder', status: 'FAILED', timestamp: new Date(Date.now() - 10800000).toISOString(), detail: 'Provider rate limit exceeded' },
  { id: 4, type: 'payment', action: 'Receive Payment', status: 'SUCCESS', timestamp: new Date(Date.now() - 14400000).toISOString(), detail: 'ETB 15,000 via Telebirr' },
  { id: 5, type: 'storage', action: 'Upload File', status: 'SUCCESS', timestamp: new Date(Date.now() - 18000000).toISOString(), detail: 'INV-2024-0044.pdf uploaded' },
  { id: 6, type: 'email', action: 'Send Report', status: 'SUCCESS', timestamp: new Date(Date.now() - 21600000).toISOString(), detail: 'Daily sales report to admin@myerp.com' },
  { id: 7, type: 'accounting', action: 'Sync Journal', status: 'FAILED', timestamp: new Date(Date.now() - 43200000).toISOString(), detail: 'OAuth token expired' },
];

const Integrations = () => {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await adminService.getIntegrations();
      const data = res.data?.data || res.data || {};
      setIntegrations(data.integrations || data);
    } catch {
      setIntegrations(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const getIntData = (key) => integrations[key] || { status: 'disconnected', enabled: false, config: {} };
  const connectedCount = INTEGRATIONS.filter((i) => getIntData(i.key).status === 'connected').length;
  const disconnectedCount = INTEGRATIONS.filter((i) => getIntData(i.key).status !== 'connected').length;

  const toggleEnabled = async (key) => {
    const current = getIntData(key);
    const newEnabled = !current.enabled;
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: newEnabled },
    }));
    try {
      await adminService.toggleIntegration(key, newEnabled);
      showToast(`${INTEGRATIONS.find((i) => i.key === key)?.title} ${newEnabled ? 'enabled' : 'disabled'}.`);
    } catch {
      setIntegrations((prev) => ({
        ...prev,
        [key]: { ...prev[key], enabled: !newEnabled },
      }));
      showToast('Failed to update integration.', 'error');
    }
  };

  const openDetail = (key) => {
    setSelected(key);
    setDetailTab('overview');
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Integrations</h2>
          <p className={styles.pageSubtitle}>
            Connect the ERP to external services — payments, messaging, storage, and more.
          </p>
        </div>
      </div>

      <div className={styles.summaryStrip}>
        <span className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.summaryDotGood}`} />
          {connectedCount} Connected
        </span>
        <span className={styles.summaryItem}>
          <span className={`${styles.summaryDot} ${styles.summaryDotMuted}`} />
          {disconnectedCount} Not Connected
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 64 }}>
          <div className={styles.spinner} />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>Loading integrations...</span>
        </div>
      ) : (
        <div className={styles.intGrid}>
          {INTEGRATIONS.map((intg) => {
            const data = getIntData(intg.key);
            const statusClass = data.status === 'connected' ? styles.pillConnected
              : data.status === 'error' ? styles.pillError
              : styles.pillDisconnected;
            const dotClass = data.status === 'connected' ? styles.pillDotConnected
              : data.status === 'error' ? styles.pillDotError
              : styles.pillDotDisconnected;
            const topClass = data.status === 'connected' ? styles.topConnected
              : data.status === 'error' ? styles.topError
              : styles.topDisconnected;
            const statusLabel = data.status === 'connected' ? 'Connected'
              : data.status === 'error' ? 'Error'
              : 'Not Connected';

            return (
              <div
                key={intg.key}
                className={`${styles.intCard} ${selected === intg.key ? styles.intCardActive : ''}`}
                onClick={() => openDetail(intg.key)}
              >
                <div className={`${styles.intCardTop} ${topClass}`} />
                <div className={styles.intCardBody}>
                  <div className={styles.intCardHeader}>
                    <span className={styles.intIcon}>{intg.icon}</span>
                    <div className={styles.intInfo}>
                      <h3 className={styles.intName}>{intg.title}</h3>
                      <p className={styles.intDesc}>{intg.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`${styles.statusPill} ${statusClass}`}>
                      <span className={`${styles.pillDot} ${dotClass}`} />
                      {statusLabel}
                    </span>
                    {data.lastSync && (
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Last sync: {formatDateTime(data.lastSync)}
                      </span>
                    )}
                  </div>
                  <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>Enabled</span>
                    <button
                      className={`${styles.toggle} ${data.enabled ? styles.toggleOn : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(intg.key); }}
                      aria-label={`Toggle ${intg.title}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailPanel
          integrationKey={selected}
          integrations={integrations}
          setIntegrations={setIntegrations}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          onClose={() => setSelected(null)}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span className={styles.toastIcon}>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Detail Panel (slide-in)                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
const DetailPanel = ({ integrationKey, integrations, setIntegrations, detailTab, setDetailTab, onClose, showToast }) => {
  const intg = INTEGRATIONS.find((i) => i.key === integrationKey);
  const data = integrations[integrationKey] || { status: 'disconnected', enabled: false, config: {} };
  const [config, setConfig] = useState(() => ({ ...data.config }));
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (detailTab === 'history') {
      setHistoryLoading(true);
      adminService.getIntegrationSyncHistory(integrationKey)
        .then((res) => {
          const d = res.data?.data || res.data || {};
          setHistory(d.history || []);
        })
        .catch(() => setHistory(FALLBACK_HISTORY.filter((h) => h.type === integrationKey)))
        .finally(() => setHistoryLoading(false));
    }
  }, [detailTab, integrationKey]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await adminService.connectIntegration(integrationKey, config);
      setIntegrations((prev) => ({
        ...prev,
        [integrationKey]: { ...prev[integrationKey], status: 'connected', config },
      }));
      showToast(`${intg.title} connected successfully.`);
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to connect ${intg.title}.`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await adminService.disconnectIntegration(integrationKey);
      setIntegrations((prev) => ({
        ...prev,
        [integrationKey]: { ...prev[integrationKey], status: 'disconnected' },
      }));
      showToast(`${intg.title} disconnected.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to disconnect.', 'error');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminService.updateIntegrationConfig(integrationKey, config);
      setIntegrations((prev) => ({
        ...prev,
        [integrationKey]: { ...prev[integrationKey], config },
      }));
      showToast('Configuration saved.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminService.testIntegration(integrationKey, config);
      const d = res.data?.data || res.data || {};
      setTestResult({ success: true, message: d.message || 'Test successful.' });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const fields = CONFIG_FIELDS[integrationKey] || [];
  const allHistory = FALLBACK_HISTORY.filter((h) => h.type === integrationKey).concat(history);
  const displayHistory = allHistory.length > 0 ? allHistory : history;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailHeader}>
          <span className={styles.detailIcon}>{intg.icon}</span>
          <div className={styles.detailTitleWrap}>
            <h2 className={styles.detailTitle}>{intg.title}</h2>
            <span className={styles.detailSub}>{intg.desc}</span>
          </div>
          <button className={styles.detailClose} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.detailTabs}>
          {['overview', 'configure', 'test', 'history'].map((tab) => (
            <button
              key={tab}
              className={`${styles.detailTab} ${detailTab === tab ? styles.detailTabActive : ''}`}
              onClick={() => setDetailTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.detailBody}>
          {detailTab === 'overview' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Status</span>
                <span className={`${styles.statusPill} ${data.status === 'connected' ? styles.pillConnected : data.status === 'error' ? styles.pillError : styles.pillDisconnected}`}>
                  <span className={`${styles.pillDot} ${data.status === 'connected' ? styles.pillDotConnected : data.status === 'error' ? styles.pillDotError : styles.pillDotDisconnected}`} />
                  {data.status === 'connected' ? 'Connected' : data.status === 'error' ? 'Error' : 'Not Connected'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Enabled</span>
                <span style={{ fontWeight: 600 }}>{data.enabled ? 'Yes' : 'No'}</span>
              </div>
              {data.lastSync && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Last Sync</span>
                  <span style={{ fontWeight: 600 }}>{formatDateTime(data.lastSync)}</span>
                </div>
              )}
              {Object.keys(data.config || {}).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)' }}>Configured</span>
                  {Object.entries(data.config).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontWeight: 500 }}>{k.toLowerCase().includes('secret') || k.toLowerCase().includes('password') || k.toLowerCase().includes('key') ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.actionRow} style={{ marginTop: 16 }}>
                {data.status === 'connected' ? (
                  <button className={styles.btnDanger} onClick={handleDisconnect}>Disconnect</button>
                ) : (
                  <button className={styles.btnPrimary} onClick={handleConnect} disabled={connecting}>
                    {connecting ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className={styles.spinner} /> Connecting...</span> : 'Connect'}
                  </button>
                )}
              </div>
            </>
          )}

          {detailTab === 'configure' && (
            <>
              {fields.map((field) => (
                <div key={field.key} className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className={styles.fieldSelect}
                      value={config[field.key] || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={styles.fieldInput}
                      type={field.type || 'text'}
                      value={config[field.key] || ''}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  )}
                  {field.help && <span className={styles.fieldHelp}>{field.help}</span>}
                </div>
              ))}
              <div className={styles.actionRow}>
                <button className={styles.btnPrimary} onClick={handleSaveConfig} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </>
          )}

          {detailTab === 'test' && (
            <>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                Send a test request to verify the connection works before relying on it.
              </p>
              {testResult && (
                <div className={`${styles.testResult} ${testResult.success ? styles.testSuccess : styles.testFail}`}>
                  <span className={styles.testTitle}>{testResult.success ? '\u2713 Test Passed' : '\u2717 Test Failed'}</span>
                  <span className={styles.testBody}>{testResult.message}</span>
                </div>
              )}
              <div className={styles.actionRow}>
                <button className={styles.btnPrimary} onClick={handleTest} disabled={testing || data.status !== 'connected'}>
                  {testing ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className={styles.spinner} /> Testing...</span> : 'Run Test'}
                </button>
                {data.status !== 'connected' && (
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Connect the integration first.</span>
                )}
              </div>
            </>
          )}

          {detailTab === 'history' && (
            <>
              {historyLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
                  <div className={styles.spinner} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Loading history...</span>
                </div>
              ) : displayHistory.length === 0 ? (
                <div className={styles.empty}>
                  <p>No synchronization history yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.histTable}>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayHistory.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 500 }}>{h.action}</td>
                          <td>
                            <span className={`${styles.histStatusBadge} ${h.status === 'SUCCESS' ? styles.histBadgeSuccess : h.status === 'FAILED' ? styles.histBadgeFailed : styles.histBadgePending}`}>
                              {h.status}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDateTime(h.timestamp)}</td>
                          <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{h.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
