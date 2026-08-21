import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';
import styles from './Integrations.module.css';
import { playSound } from '../../services/notificationManager';

const MASK = '••••••••';

// Local metadata used as a fallback / to keep the grid intact if the backend is
// temporarily unreachable. Statuses always come from the backend — never faked.
const INTEGRATION_META = [
  {
    key: 'sms', title: 'SMS', icon: '📱',
    desc: 'Send alerts, OTPs, and payment reminders directly to phones.',
    fields: [
      { key: 'provider', label: 'SMS Provider', type: 'select', required: true, options: ["Africa's Talking", 'Twilio', 'Nexmo', 'Custom'], help: 'Select your SMS gateway provider.' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Enter API key', help: 'Your provider API key. Stored securely and never shown in full.' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter API secret', help: 'Your provider API secret.' },
      { key: 'senderId', label: 'Sender ID', type: 'text', placeholder: 'e.g. MyERP', help: 'The name/number that appears as the sender.' },
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
      { key: 'password', label: 'Password', type: 'password', placeholder: 'SMTP password', help: 'Stored securely.' },
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
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'API key' },
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
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Client secret' },
    ]
  },
  {
    key: 'storage', title: 'Object Storage', icon: '☁️',
    desc: 'Store PDFs, images, and documents in dedicated file storage.',
    fields: [
      { key: 'provider', label: 'Storage Provider', type: 'select', required: true, options: ['AWS S3', 'Google Cloud Storage', 'Azure Blob', 'MinIO', 'Custom'], help: 'Select your object storage provider.' },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'e.g. myerp-documents' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. us-east-1' },
      { key: 'accessKey', label: 'Access Key', type: 'password', required: true, placeholder: 'Access key ID' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'Secret access key' },
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
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'OAuth client secret' },
    ]
  },
];

const disconnectedEntry = (meta) => ({
  key: meta.key, title: meta.title, icon: meta.icon, desc: meta.desc,
  status: 'disconnected', enabled: false, config: {}, fields: meta.fields, lastSync: null, connectedAt: null
});

const emptyState = () => Object.fromEntries(INTEGRATION_META.map(m => [m.key, disconnectedEntry(m)]));

const isSecret = (key) => ['apiKey', 'apiSecret', 'password', 'clientSecret', 'secretKey', 'accessKey'].includes(key);

// Replace masked secret placeholders with empty so users re-enter only when changing.
const initConfig = (cfg = {}) => {
  const out = { ...cfg };
  for (const k of Object.keys(out)) {
    if (out[k] === MASK) out[k] = '';
  }
  return out;
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success') => {
    playSound(type === 'error' ? 'error' : 'success');
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await adminService.getIntegrations();
      const data = res.data?.data || res.data || {};
      const list = data.integrations || {};
      if (Object.keys(list).length > 0) {
        setIntegrations(list);
        setLoadError(false);
      } else {
        setIntegrations(emptyState());
        setLoadError(false);
      }
    } catch {
      setIntegrations(emptyState());
      setLoadError(true);
      showToast('Failed to load integration statuses from the server.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const integrationList = Object.values(integrations);
  const connectedCount = integrationList.filter((i) => i.status === 'connected').length;
  const disconnectedCount = integrationList.filter((i) => i.status !== 'connected').length;

  const toggleEnabled = async (key) => {
    const current = integrations[key];
    if (!current) return;
    const newEnabled = !current.enabled;
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: newEnabled },
    }));
    try {
      await adminService.toggleIntegration(key, newEnabled);
      showToast(`${current.title} ${newEnabled ? 'enabled' : 'disabled'}.`);
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
        {loadError && (
          <span className={styles.summaryItem} style={{ color: 'var(--color-danger)', fontSize: 13 }}>
            Server unreachable — statuses shown as not connected
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 64 }}>
          <div className={styles.spinner} />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>Loading integrations...</span>
        </div>
      ) : (
        <div className={styles.intGrid}>
          {integrationList.map((data) => {
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
                key={data.key}
                className={`${styles.intCard} ${selected === data.key ? styles.intCardActive : ''}`}
                onClick={() => openDetail(data.key)}
              >
                <div className={`${styles.intCardTop} ${topClass}`} />
                <div className={styles.intCardBody}>
                  <div className={styles.intCardHeader}>
                    <span className={styles.intIcon}>{data.icon}</span>
                    <div className={styles.intInfo}>
                      <h3 className={styles.intName}>{data.title}</h3>
                      <p className={styles.intDesc}>{data.desc}</p>
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
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(data.key); }}
                      aria-label={`Toggle ${data.title}`}
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
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          onClose={() => setSelected(null)}
          showToast={showToast}
          onRefresh={fetchIntegrations}
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
const DetailPanel = ({ integrationKey, integrations, detailTab, setDetailTab, onClose, showToast, onRefresh }) => {
  const data = integrations[integrationKey] || disconnectedEntry(INTEGRATION_META.find((m) => m.key === integrationKey) || { key: integrationKey, title: integrationKey, icon: '🔌', desc: '', fields: [] });
  const meta = INTEGRATION_META.find((m) => m.key === integrationKey) || { key: integrationKey, title: integrationKey, icon: '🔌', desc: '', fields: [] };
  const fields = data.fields && data.fields.length ? data.fields : meta.fields;
  const [config, setConfig] = useState(() => initConfig(data.config));
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
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [detailTab, integrationKey]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await adminService.connectIntegration(integrationKey, config);
      showToast(`${data.title} connected successfully.`);
      setTestResult(null);
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to connect ${data.title}.`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await adminService.disconnectIntegration(integrationKey);
      showToast(`${data.title} disconnected.`);
      setTestResult(null);
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to disconnect.', 'error');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminService.updateIntegrationConfig(integrationKey, config);
      showToast('Configuration saved.');
      onRefresh();
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

  const renderFields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {fields.map((field) => (
        <div key={field.key} className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {field.label}
            {field.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
          </label>
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
          {isSecret(field.key) && (data.config || {})[field.key] === MASK && (
            <span className={styles.fieldHelp} style={{ color: 'var(--color-success)' }}>
              Already saved — leave empty to keep the existing value.
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailHeader}>
          <span className={styles.detailIcon}>{data.icon}</span>
          <div className={styles.detailTitleWrap}>
            <h2 className={styles.detailTitle}>{data.title}</h2>
            <span className={styles.detailSub}>{data.desc}</span>
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
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.status !== 'connected' && (
                <>
                  <div style={{ marginTop: 16, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-text-muted)' }}>
                      Enter connection credentials
                    </span>
                  </div>
                  {renderFields()}
                </>
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
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
                Update connection details. Secret fields left empty keep their saved value.
              </p>
              <div style={{ marginTop: 14 }}>{renderFields()}</div>
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
                Verify the saved configuration is valid before relying on it.
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
              ) : history.length === 0 ? (
                <div className={styles.empty}>
                  <p>No synchronization history yet. Activity appears here after you connect or run a test.</p>
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
                      {history.map((h) => (
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