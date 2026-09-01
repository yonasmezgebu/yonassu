// storeNotifications.js
// Global notification utility for Inventory (Store) Dashboard
// Rule: success.mp3 = completed transactions; info.mp3 = informational/pending

const playSound = (type) => {
  try {
    const file = type === 'success' ? '/sounds/info.mp3' : '/sounds/info.mp3';
    const audio = new Audio(file);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
};

const showBrowserNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      }
    });
  }
};

// Toast system (in-app)
let toastContainer = null;
const ensureToastContainer = () => {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'store-toast-container';
    toastContainer.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const showToast = (message, type = 'info') => {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  const bg = type === 'success' ? '#166534' : '#1e3a8a';
  const border = type === 'success' ? '#22c55e' : '#3b82f6';
  toast.style.cssText = `
    background: ${bg}; color: white; padding: 12px 20px; border-radius: 8px;
    border-left: 4px solid ${border}; font-family: Inter, sans-serif;
    font-size: 14px; font-weight: 500; max-width: 360px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3); pointer-events: auto;
    animation: slideIn 0.3s ease; line-height: 1.4;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
};

// Inject CSS animation once
if (!document.getElementById('store-toast-styles')) {
  const style = document.createElement('style');
  style.id = 'store-toast-styles';
  style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
  document.head.appendChild(style);
}

// ─── Public API ───────────────────────────────────────────────────

/** Success notification: completed transactions (receive, issue, transfer, adjust, count, approve) */
export const storeSuccess = (inAppMsg, browserTitle, browserBody) => {
  showToast(inAppMsg, 'success');
  showBrowserNotification(browserTitle, browserBody);
  playSound('success');
};

/** Info notification: informational alerts, pending items, low stock */
export const storeInfo = (inAppMsg, browserTitle, browserBody) => {
  showToast(inAppMsg, 'info');
  showBrowserNotification(browserTitle, browserBody);
  playSound('info');
};

// ─── Pre-built notification helpers ──────────────────────────────

export const notifyGoodsReceived = (supplier, item, qty) =>
  storeSuccess(
    `📥 Goods Received - ${supplier} - ${item} - ${qty}`,
    '📥 New Stock Added - Click to View',
    `${qty} units of ${item} received from ${supplier}`
  );

export const notifyGoodsIssued = (dept, item, qty) =>
  storeSuccess(
    `📤 Goods Issued - ${dept} - ${item} - ${qty}`,
    '📤 Stock Issued - Click to View',
    `${qty} units of ${item} issued to ${dept}`
  );

export const notifyStockTransfer = (item, qty) =>
  storeSuccess(
    `🔄 Stock Transfer Completed - ${item} - ${qty}`,
    '🔄 Transfer Confirmed - Click to View',
    `${qty} units of ${item} transferred successfully`
  );

export const notifyStockAdjustment = (type, item, qty) =>
  storeSuccess(
    `⚙️ Stock Adjustment - ${type} - ${item} - ${qty}`,
    '⚙️ Adjustment Made - Click to View',
    `Stock adjusted: ${qty} units of ${item} (${type})`
  );

export const notifyPhysicalCount = (variance) =>
  storeSuccess(
    `📋 Physical Count Completed - Variance: ${variance}`,
    '📋 Count Ready for Review - Click to View',
    `Physical count submitted. Variance: ${variance}`
  );

export const notifyNewRequisition = (dept, item, qty) =>
  storeInfo(
    `📝 New Requisition - ${dept} - ${item} - ${qty}`,
    '📝 Request Received - Click to Process',
    `${dept} requested ${qty} units of ${item}`
  );

export const notifyPendingRequests = (count) =>
  storeInfo(
    `⏳ ${count} Pending Requests`,
    '⏳ Pending Requests - Click to Review',
    `${count} requests awaiting your action`
  );

export const notifyApprovedRequests = (count) =>
  storeSuccess(
    `✅ ${count} Requests Approved Today`,
    '✅ Approval Summary - Click to View',
    `${count} requests have been approved today`
  );

export const notifyRequestHistory = () =>
  storeInfo(
    '📊 Request History Report Ready',
    '📊 Request History - Click to View',
    'Request history report is ready to view'
  );

export const notifyCountHistory = () =>
  storeInfo(
    '📋 Physical Count History Ready',
    '📋 Count History - Click to View',
    'Physical count history report is ready to view'
  );

export const notifyLowStock = (item, qty) =>
  storeInfo(
    `⚠️ Low Stock Alert - ${item} - ${qty} remaining`,
    '⚠️ Reorder Required - Click to View',
    `${item} has dropped to ${qty} units. Reorder required.`
  );

export const notifyMovementReport = () =>
  storeInfo(
    '📦 Stock Movement Report Ready',
    '📦 Movement Log - Click to View',
    'Stock movement report has been generated'
  );
