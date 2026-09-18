const API = '/api/v1/store-inventory';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
  };
}

export async function getDashboardStats() {
  const r = await fetch(API + '/dashboard', { headers: headers() });
  if (!r.ok) throw new Error((await r.json()).message || 'Failed to fetch dashboard');
  return r.json();
}

export async function getInventory(params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(API + '/inventory?' + q, { headers: headers() });
  if (!r.ok) throw new Error('Failed to fetch inventory');
  return r.json();
}

export async function getInventoryItem(id) {
  const r = await fetch(API + '/inventory/' + id, { headers: headers() });
  return r.json();
}

export async function updateInventoryItem(id, data) {
  const r = await fetch(API + '/inventory/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getMovements() {
  const r = await fetch(API + '/movements', { headers: headers() });
  if (!r.ok) throw new Error('Failed to fetch movements');
  return r.json();
}

// Receipts
export async function createReceipt(data) {
  const r = await fetch(API + '/receipts', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getReceipts() {
  const r = await fetch(API + '/receipts', { headers: headers() });
  return r.json();
}

// Issues
export async function createIssue(data) {
  const r = await fetch(API + '/issues', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getIssues() {
  const r = await fetch(API + '/issues', { headers: headers() });
  return r.json();
}

// Transfers
export async function createTransfer(data) {
  const r = await fetch(API + '/transfers', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getTransfers() {
  const r = await fetch(API + '/transfers', { headers: headers() });
  return r.json();
}

// Adjustments
export async function createAdjustment(data) {
  const r = await fetch(API + '/adjustments', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getAdjustments() {
  const r = await fetch(API + '/adjustments', { headers: headers() });
  return r.json();
}

export async function getPendingAdjustments() {
  const r = await fetch(API + '/adjustments/pending', { headers: headers() });
  return r.json();
}

export async function approveAdjustment(id) {
  const r = await fetch(API + '/adjustments/' + id + '/approve', { method: 'PATCH', headers: headers() });
  return r.json();
}

export async function rejectAdjustment(id, reason) {
  const r = await fetch(API + '/adjustments/' + id + '/reject', { method: 'PATCH', headers: headers(), body: JSON.stringify({ reason }) });
  return r.json();
}

// Counts
export async function createCount(data) {
  const r = await fetch(API + '/counts', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getCounts() {
  const r = await fetch(API + '/counts', { headers: headers() });
  return r.json();
}

// Requisitions
export async function createRequisition(data) {
  const r = await fetch(API + '/requisitions', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getRequisitions(params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(API + '/requisitions?' + q, { headers: headers() });
  return r.json();
}

export async function updateRequisitionStatus(id, data) {
  const r = await fetch(API + '/requisitions/' + id + '/status', { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

// Approved Requests
export async function createApprovedRequest(data) {
  const r = await fetch(API + '/approved-requests', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function getApprovedRequests(params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(API + '/approved-requests?' + q, { headers: headers() });
  return r.json();
}

// Get all drugs (from pharmacy-sales endpoint)
export async function getAllDrugs() {
  const r = await fetch('/api/v1/pharmacy-sales/drugs', {
    headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return r.json();
}

// Suppliers
export async function getSuppliers() {
  const r = await fetch(API + '/suppliers', { headers: headers() });
  return r.json();
}
export async function createSupplier(data) {
  const r = await fetch(API + '/suppliers', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateSupplier(id, data) {
  const r = await fetch(API + '/suppliers/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}
export async function toggleSupplierStatus(id) {
  const r = await fetch(API + '/suppliers/' + id + '/status', { method: 'PATCH', headers: headers() });
  return r.json();
}

// Deliveries
export async function getDeliveries() {
  const r = await fetch(API + '/deliveries', { headers: headers() });
  return r.json();
}
export async function createDelivery(data) {
  const r = await fetch(API + '/deliveries', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateDeliveryStatus(id, data) {
  const r = await fetch(API + '/deliveries/' + id + '/status', { method: 'PATCH', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

// Today's Receipts & Issues + CRUD
export async function getTodayReceipts() {
  const r = await fetch(API + '/receipts/today', { headers: headers() });
  return r.json();
}

export async function getTodayIssues() {
  const r = await fetch(API + '/issues/today', { headers: headers() });
  return r.json();
}

export async function updateReceipt(id, data) {
  const r = await fetch(API + '/receipts/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function deleteReceipt(id) {
  const r = await fetch(API + '/receipts/' + id, { method: 'DELETE', headers: headers() });
  return r.json();
}

export async function updateIssue(id, data) {
  const r = await fetch(API + '/issues/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

export async function deleteIssue(id) {
  const r = await fetch(API + '/issues/' + id, { method: 'DELETE', headers: headers() });
  return r.json();
}

export async function getRecentActivities() {
  const r = await fetch(API + '/activities/recent', { headers: headers() });
  return r.json();
}

// Overstock
export async function getOverstock() {
  const r = await fetch(API + '/overstock', { headers: headers() });
  if (!r.ok) throw new Error('Failed to fetch overstock');
  return r.json();
}

// Store Staff
export async function getStoreStaff() {
  const r = await fetch(API + '/staff', { headers: headers() });
  return r.json();
}
export async function createStoreStaff(data) {
  const r = await fetch(API + '/staff', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}
export async function toggleStoreStaffStatus(id) {
  const r = await fetch(API + '/staff/' + id + '/status', { method: 'PATCH', headers: headers() });
  return r.json();
}

// Store Attendance
export async function getStoreAttendance() {
  const r = await fetch(API + '/attendance', { headers: headers() });
  return r.json();
}
export async function markStoreAttendance(data) {
  const r = await fetch(API + '/attendance', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

// Generic
export async function addNewStock(data) {
  const r = await fetch(API + '/add-stock', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  return r.json();
}

// ── Pharmacy Store: deliveries sent by Purchasing (pharmacy quotations) ──
const PURCHASE_API = '/api/v1/purchase';

export async function getPharmacyIncomingList() {
  const r = await fetch(PURCHASE_API + '/pharmacy-incoming', { headers: headers() });
  if (!r.ok) throw new Error('Failed to load incoming deliveries');
  return r.json();
}

export async function getPharmacyIncoming(id) {
  const r = await fetch(PURCHASE_API + '/pharmacy-incoming/' + id, { headers: headers() });
  if (!r.ok) throw new Error('Failed to load delivery details');
  return r.json();
}

export async function receivePharmacyIncoming(id, entries) {
  const r = await fetch(PURCHASE_API + '/pharmacy-incoming/' + id + '/receive', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ entries }),
  });
  if (!r.ok) throw new Error((await r.json()).message || 'Failed to receive delivery');
  return r.json();
}

// Stock Update Requests
export async function getPendingUpdateRequests(status = 'Pending') {
  const r = await fetch(API + `/update-requests/pending?status=${status}`, { headers: headers() });
  return r.json();
}
export async function approveUpdateRequest(id) {
  const r = await fetch(API + '/update-requests/' + id + '/approve', { method: 'PATCH', headers: headers() });
  return r.json();
}
export async function rejectUpdateRequest(id, reason) {
  const r = await fetch(API + '/update-requests/' + id + '/reject', { method: 'PATCH', headers: headers(), body: JSON.stringify({ reason }) });
  return r.json();
}

export async function apiGet(endpoint) {
  const r = await fetch(API + endpoint, { headers: headers() });
  return r.json();
}
