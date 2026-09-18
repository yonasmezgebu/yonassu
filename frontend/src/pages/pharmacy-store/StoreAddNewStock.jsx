import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, CheckCircle, AlertTriangle, Truck, ArrowLeft, Trash2 } from 'lucide-react';
import { NotifStore } from './StoreHomeNew';
import { addNewStock, getPharmacyIncomingList, getPharmacyIncoming, receivePharmacyIncoming } from '../../utils/storeApi';

/* ── Enterprise CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --cp:           #2563EB;
    --cp-h:         #1D4ED8;
    --cbg:          #F5F6FA;
    --ccard:        #FFFFFF;
    --cborder:      #E5E7EB;
    --ct1:          #111827;
    --ct2:          #6B7280;
    --ctm:          #9CA3AF;
    --cok:          #16A34A;
    --cok-bg:       #DCFCE7;
    --cdanger:      #DC2626;
    --cdanger-bg:   #FEE2E2;
    --cwarn:        #D97706;
    --cwarn-bg:     #FEF3C7;
    --cinfo:        #0284C7;
    --cinfo-bg:     #E0F2FE;
    --gold:         #F59E0B;
    --gold-text:    #111827;
  }

  /* ── Page Wrapper ── */
  .ans-page {
    box-sizing: border-box;
    margin: 10px auto;
    width: calc(100% - 20px);
    max-width: 1400px;
    min-height: calc(100vh - 20px);
    padding: 24px;
    background: var(--cbg);
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    color: var(--ct1);
    line-height: 1.5;
    padding-bottom: 48px;
  }
  @media (max-width: 1024px) {
    .ans-page { margin: 6px auto; width: calc(100% - 12px); padding: 16px; }
  }
  @media (max-width: 480px) {
    .ans-page { margin: 4px auto; width: calc(100% - 8px); padding: 12px; }
  }

  /* ── Page Header ── */
  .ans-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--cborder);
  }
  .ans-header-icon {
    background: #EFF6FF;
    color: var(--cp);
    padding: 10px;
    border-radius: 10px;
    display: flex;
    flex-shrink: 0;
  }
  .ans-page-title {
    font-size: clamp(22px, 3vw, 28px);
    font-weight: 600;
    line-height: 1.3;
    margin: 0 0 2px;
    color: var(--ct1);
  }
  .ans-page-sub {
    font-size: 13px;
    color: var(--ct2);
    margin: 0;
  }

  /* ── Success Banner ── */
  .ans-confirm {
    background: var(--cok-bg);
    border: 1px solid var(--cok);
    border-radius: 10px;
    margin-bottom: 24px;
    overflow: hidden;
    animation: ansSlideIn 300ms ease-out;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  @keyframes ansSlideIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ans-confirm-hd {
    background: var(--cok);
    color: #fff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  .ans-confirm-body { padding: 20px; }
  .ans-confirm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  .ans-confirm-item {
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 8px;
    padding: 12px 14px;
  }
  .ans-confirm-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--ctm);
    margin-bottom: 4px;
  }
  .ans-confirm-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--ct1);
  }
  .ans-confirm-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── Form Card ── */
  .ans-card {
    background: var(--ccard);
    border: 1px solid var(--cborder);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    margin-bottom: 20px;
    overflow: hidden;
    transition: box-shadow 150ms ease;
  }
  .ans-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }

  /* ── Section Header ── */
  .ans-sec-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: #F9FAFB;
    border-bottom: 1px solid var(--cborder);
  }
  .ans-sec-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ct1);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .ans-sec-sub {
    font-size: 12px;
    color: var(--ctm);
    font-weight: 400;
  }

  .ans-sec-body { padding: 20px 24px; }
  @media (max-width: 480px) { .ans-sec-body { padding: 16px; } }

  /* ── Alert Row inside section ── */
  .ans-info-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--cwarn-bg);
    border: 1px solid var(--cwarn);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #78350F;
    font-weight: 500;
    line-height: 1.5;
  }
  .ans-info-row svg { flex-shrink: 0; margin-top: 2px; }

  /* ── Form Grid ── */
  .ans-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  .ans-fg { display: flex; flex-direction: column; gap: 5px; }
  .ans-fg.full { grid-column: 1 / -1; }

  /* ── Labels ── */
  .ans-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .03em;
    color: var(--ct2);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ans-req { color: var(--cdanger); font-weight: 600; }

  /* ── Inputs ── */
  .ans-input {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid var(--cborder);
    font-size: 14px;
    font-family: inherit;
    color: var(--ct1);
    background: var(--ccard);
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .ans-input:focus {
    border-color: var(--cp);
    box-shadow: 0 0 0 3px rgba(37,99,235,.10);
  }
  .ans-input.required-field { border-color: rgba(37,99,235,.35); }
  .ans-input.required-field:focus { border-color: var(--cp); }
  select.ans-input { appearance: auto; cursor: pointer; }

  /* ── Action Bar ── */
  .ans-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  /* ── Buttons ── */
  .ans-btn {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--cborder);
    background: var(--ccard);
    color: var(--ct1);
    font-family: inherit;
    transition: all 150ms ease-in-out;
    white-space: nowrap;
    min-width: 44px;
    justify-content: center;
  }
  .ans-btn:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0,0,0,.10);
    transform: translateY(-1px);
  }
  .ans-btn:disabled { opacity: .5; cursor: not-allowed; }

  .ans-btn-primary {
    background: var(--cp);
    color: #fff;
    border-color: var(--cp);
  }
  .ans-btn-primary:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
  }

  .ans-btn-success {
    background: var(--cok);
    color: #fff;
    border-color: var(--cok);
  }
  .ans-btn-success:hover:not(:disabled) {
    background: var(--gold);
    color: var(--gold-text);
    border-color: transparent;
  }

  /* ── Spinner ── */
  .ans-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    animation: ans-spin 700ms linear infinite;
    flex-shrink: 0;
  }
  @keyframes ans-spin { to { transform: rotate(360deg); } }

  /* ── Pending Deliveries from Purchasing ── */
  .ans-delivery {
    background: #FFF7ED;
    border: 1px solid #FDBA74;
    border-radius: 10px;
    margin-bottom: 24px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .ans-delivery-hd {
    background: #F97316;
    color: #fff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  .ans-delivery-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    padding: 16px;
  }
  .ans-delivery-card {
    text-align: left;
    background: #fff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 14px 16px;
    cursor: pointer;
    font-family: inherit;
    transition: all 150ms ease;
  }
  .ans-delivery-card:hover {
    border-color: #F97316;
    box-shadow: 0 4px 12px rgba(249,115,22,.16);
    transform: translateY(-1px);
  }
  .ans-delivery-card:hover .ans-delivery-link { color: #C2410C; }
  .ans-delivery-qno {
    font-family: monospace;
    font-weight: 700;
    font-size: 15px;
    color: #111827;
    margin-bottom: 6px;
  }
  .ans-delivery-meta { font-size: 12.5px; color: #4B5563; margin: 2px 0; }
  .ans-delivery-link {
    margin-top: 10px;
    font-size: 12.5px;
    font-weight: 700;
    color: #EA580C;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  /* ── Receive Delivery Mode ── */
  .ans-recv-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .ans-recv-title { font-size: 18px; font-weight: 700; color: var(--ct1); }
  .ans-recv-sub { font-size: 13px; color: var(--ct2); margin-top: 2px; }
  .ans-recv-body { padding: 16px; overflow-x: auto; }
  .ans-recv-tbl { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1100px; }
  .ans-recv-tbl th {
    text-align: left;
    padding: 8px 6px;
    background: #F9FAFB;
    color: #4B5563;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .03em;
    border-bottom: 2px solid #E5E7EB;
    white-space: nowrap;
  }
  .ans-recv-tbl td { padding: 8px 6px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
  .ans-recv-tbl .ans-recvin { 
    width: 100%; min-width: 90px; box-sizing: border-box;
    padding: 7px 9px; border: 1px solid #E5E7EB; border-radius: 7px;
    font-size: 13px; font-family: inherit; color: #111827;
  }
  .ans-recv-tbl .ans-recvin:focus { outline: none; border-color: var(--cp); box-shadow: 0 0 0 3px rgba(37,99,235,.10); }
  .ans-recv-extra td { background: #F0FDF4; }
  .ans-recv-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ans-recv-rm {
    border: 1px solid #FCA5A5; background: #FEF2F2; color: #DC2626;
    width: 30px; height: 30px; border-radius: 7px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .ans-recv-rm:disabled { opacity: .4; cursor: not-allowed; }
  .ans-recv-add { margin-top: 12px; }
  .ans-recv-totals {
    display: flex; gap: 24px; flex-wrap: wrap;
    margin-top: 16px; padding: 14px 16px;
    background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 10px;
  }
  .ans-recv-totals > div { font-size: 13.5px; color: var(--ct1); }
  .ans-recv-totals b { font-size: 15px; }
  .ans-recv-receipt { margin-top: 20px; }
  .ans-recv-extraflag { font-size: 10.5px; font-weight: 700; color: #15803D; }
`;

/* ─── Constants ─────────────────────────────────────────────────── */
const EMPTY = {
  name: '', strength: '', unit: '', unitPrice: '', category: '',
  therapeuticUse: '', requiresPrescription: false,
  batchNo: '', expiryDate: '', nearExpiryDays: '90',
  initialQty: '', minLevel: '', maxLevel: '', storageLocation: '',
};

const DEFAULT_VAT = 15;

const toDateOnly = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const StoreAddNewStock = () => {
  const [form, setForm]         = useState({ ...EMPTY });
  const [loading, setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  // ── Deliveries sent by Purchasing (pharmacy quotations) ──
  const [shipments, setShipments] = useState([]);
  const [openingId, setOpeningId] = useState(null);
  const [receiveShipment, setReceiveShipment] = useState(null);
  const [rows, setRows] = useState([]);
  const [receiving, setReceiving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const resetForm = () => { setForm({ ...EMPTY }); setConfirmed(null); };

  const loadShipments = useCallback(async () => {
    try {
      const res = await getPharmacyIncomingList();
      const pending = (res.data || []).filter(sh => sh.status === 'pending' || sh.status === 'partial');
      setShipments(pending);
    } catch (e) {
      setShipments([]);
    }
  }, []);

  useEffect(() => { loadShipments(); }, [loadShipments]);

  const rowFromItem = (it) => ({
    itemId: it.id,
    isExtra: false,
    name: it.item_description || '',
    strength: it.strength || '',
    category: it.category || '',
    batchNo: it.batch_no || '',
    expiryDate: it.expiry_date ? toDateOnly(it.expiry_date) : '',
    quantity: it.quantity ?? '',
    unit: it.unit || 'Tablets',
    unitPrice: it.unit_price ?? '',
    vatRate: it.vat_rate ?? DEFAULT_VAT,
  });

  const openReceive = async (sh) => {
    setOpeningId(sh.id);
    try {
      const detail = await getPharmacyIncoming(sh.id);
      const items = (detail.data.items || []).filter(it => String(it.status) !== 'received');
      setRows(items.map(rowFromItem));
      setReceiveShipment(detail.data);
    } catch (e) {
      NotifStore.push(e.message || 'Failed to load delivery', 'error');
    } finally {
      setOpeningId(null);
    }
  };

  const cancelReceive = () => { setReceiveShipment(null); setRows([]); setReceipt(null); };

  const updateRow = (i, field, val) => setRows(p => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const addRow = () => setRows(p => [...p, {
    itemId: null, isExtra: true, name: '', strength: '', category: '', batchNo: '',
    expiryDate: '', quantity: '', unit: 'Tablets', unitPrice: '', vatRate: DEFAULT_VAT,
  }]);
  const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));

  const rowSub = (r) => (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0);
  const rowVat = (r) => {
    const v = r.vatRate === '' || r.vatRate === null || r.vatRate === undefined ? 0 : (parseFloat(r.vatRate) || 0);
    return rowSub(r) * v / 100;
  };
  const totals = rows.reduce((acc, r) => ({ sub: acc.sub + rowSub(r), vat: acc.vat + rowVat(r) }), { sub: 0, vat: 0 });
  const currency = (n) => `ETB ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const validateReceive = () => {
    if (!rows.length) { NotifStore.push('Add at least one item to receive', 'warning'); return false; }
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      if (!r.name.trim()) { NotifStore.push(`Row ${i + 1}: Drug name is required`, 'warning'); return false; }
      if (!r.batchNo.trim()) { NotifStore.push(`Row ${i + 1} (${r.name}): Batch No is required`, 'warning'); return false; }
      if (!r.expiryDate) { NotifStore.push(`Row ${i + 1} (${r.name}): Expiry Date is required`, 'warning'); return false; }
      if ((parseFloat(r.quantity) || 0) <= 0) { NotifStore.push(`Row ${i + 1} (${r.name}): Quantity must be greater than 0`, 'warning'); return false; }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(r.expiryDate) <= today) { NotifStore.push(`Row ${i + 1} (${r.name}): Expiry date must be in the future`, 'warning'); return false; }
    }
    return true;
  };

  const handleReceiveAll = async () => {
    if (!validateReceive()) return;
    setReceiving(true);
    try {
      const entries = rows.map(r => ({
        itemId: r.itemId,
        name: r.name.trim(),
        strength: r.strength || null,
        category: r.category || null,
        batch_no: r.batchNo.trim(),
        expiry_date: r.expiryDate,
        quantity: parseFloat(r.quantity),
        unit: r.unit,
        unit_price: parseFloat(r.unitPrice) || 0,
        vat_rate: r.vatRate === '' ? 0 : (parseFloat(r.vatRate) || 0),
      }));
      const res = await receivePharmacyIncoming(receiveShipment.id, entries);
      setReceipt({ data: res.data, message: res.message });
      NotifStore.push(res.message || 'Delivery received into inventory', 'success');
      setReceiveShipment(null);
      setRows([]);
      await loadShipments();
    } catch (e) {
      NotifStore.push(e.message || 'Failed to receive delivery', 'error');
    } finally {
      setReceiving(false);
    }
  };

  /* ── Validation ── */
  const validate = () => {
    if (!form.name.trim())    { NotifStore.push('Drug name is required', 'warning'); return false; }
    if (!form.batchNo.trim()) { NotifStore.push('Batch No is required', 'warning'); return false; }
    if (!form.expiryDate)     { NotifStore.push('Expiry Date is required', 'warning'); return false; }
    if (!form.unit)           { NotifStore.push('Unit is required', 'warning'); return false; }
    if (!form.initialQty || Number(form.initialQty) <= 0) {
      NotifStore.push('Initial Quantity must be greater than 0', 'warning');
      return false;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(form.expiryDate) <= today) {
      NotifStore.push('Expiry date must be in the future', 'warning');
      return false;
    }
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await addNewStock({
        name:                  form.name.trim(),
        strength:              form.strength || null,
        unit:                  form.unit,
        unit_price:            form.unitPrice ? parseFloat(form.unitPrice) : 0,
        category:              form.category || null,
        therapeutic_use:       form.therapeuticUse || null,
        requires_prescription: form.requiresPrescription,
        batch_no:              form.batchNo.trim(),
        expiry_date:           form.expiryDate,
        near_expiry_days:      form.nearExpiryDays ? Number(form.nearExpiryDays) : 90,
        initial_quantity:      Number(form.initialQty),
        min_level:             form.minLevel ? Number(form.minLevel) : 0,
        max_level:             form.maxLevel ? Number(form.maxLevel) : 0,
        storage_location:      form.storageLocation || null,
      });
      if (!res.success) throw new Error(res.message || 'Registration failed');
      setConfirmed({
        name:       form.name.trim(),
        batchNo:    form.batchNo.trim(),
        expiryDate: form.expiryDate,
        unit:       form.unit,
        category:   form.category,
        initialQty: form.initialQty,
        unitPrice:  form.unitPrice,
        storage:    form.storageLocation,
      });
      NotifStore.push(`✅ "${form.name.trim()}" registered (Batch: ${form.batchNo.trim()})`, 'success');
      setForm({ ...EMPTY });
    } catch (err) {
      NotifStore.push(err.message || 'Failed to register new stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ans-page">
      <style>{CSS}</style>

      {/* ── PAGE HEADER ── */}
      <div className="ans-header">
        <div className="ans-header-icon">
          <Package size={26} color="var(--cp)" />
        </div>
        <div>
          <h1 className="ans-page-title">Register New Stock</h1>
          <p className="ans-page-sub">
            Catalog a new drug with batch tracking — Batch No &amp; Expiry Date are required
          </p>
        </div>
      </div>

      {/* ── RECEIVE DELIVERY MODE ── */}
      {receiveShipment ? (
        <div className="ans-recv">
          <div className="ans-recv-hd">
            <div>
              <div className="ans-recv-title">Receive Delivery — {receiveShipment.quotation_no}</div>
              <div className="ans-recv-sub">
                {receiveShipment.supplier_name || 'Supplier'} · Delivery{' '}
                {receiveShipment.delivery_note_no || '—'} · Shipment value{' '}
                {currency(parseFloat(receiveShipment.total_amount || 0))}
              </div>
            </div>
            <button type="button" className="ans-btn" onClick={cancelReceive} disabled={receiving}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div className="ans-info-row">
            <AlertTriangle size={16} color="var(--cwarn)" />
            These items were sent by Purchasing. Every field is pre-filled and can be edited; you may also add extra
            new catalog items. Submit once — everything is received into your inventory in a single action
            (no per-item Accept clicks). VAT&nbsp;% is applied per item.
          </div>

          {receipt && (
            <div className="ans-confirm ans-recv-receipt">
              <div className="ans-confirm-hd">
                <CheckCircle size={20} /> Delivery Received
              </div>
              <div className="ans-confirm-body">
                <div className="ans-confirm-grid">
                  <div className="ans-confirm-item"><div className="ans-confirm-label">Delivery Status</div><div className="ans-confirm-val">{receipt.data.incoming_status}</div></div>
                  <div className="ans-confirm-item"><div className="ans-confirm-label">Shipment Lines Received</div><div className="ans-confirm-val">{receipt.data.received}</div></div>
                  <div className="ans-confirm-item"><div className="ans-confirm-label">New Items Registered</div><div className="ans-confirm-val">{receipt.data.registered}</div></div>
                  <div className="ans-confirm-item"><div className="ans-confirm-label">Finance Marked Paid</div><div className="ans-confirm-val">{receipt.data.finance_paid ? 'Yes' : 'No'}</div></div>
                </div>
                <div className="ans-confirm-actions">
                  <button type="button" className="ans-btn ans-btn-success" onClick={() => setReceipt(null)}>
                    <CheckCircle size={16} /> Ok
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="ans-card">
            <div className="ans-sec-hd">
              <h2 className="ans-sec-title">Items — {rows.length} row{rows.length !== 1 ? 's' : ''}</h2>
              <span className="ans-sec-sub">Green rows are extra new catalog items added by you</span>
            </div>
            <div className="ans-sec-body ans-recv-body">
              <table className="ans-recv-tbl">
                <thead>
                  <tr>
                    <th>Drug Name</th><th>Strength</th><th>Category</th><th>Batch No</th><th>Expiry</th>
                    <th>Qty</th><th>Unit</th><th>Cost (ETB)</th><th>VAT %</th><th>VAT Amt</th><th>Total</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const sub = rowSub(r);
                    const vat = rowVat(r);
                    return (
                      <tr key={i} className={r.isExtra ? 'ans-recv-extra' : ''}>
                        <td>
                          <input className="ans-recvin" value={r.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Drug name" />
                          {r.isExtra && <div className="ans-recv-extraflag">NEW CATALOG ITEM</div>}
                        </td>
                        <td><input className="ans-recvin" value={r.strength} onChange={e => updateRow(i, 'strength', e.target.value)} placeholder="500mg" /></td>
                        <td><input className="ans-recvin" value={r.category} onChange={e => updateRow(i, 'category', e.target.value)} placeholder="Antibiotics" /></td>
                        <td><input className="ans-recvin" value={r.batchNo} onChange={e => updateRow(i, 'batchNo', e.target.value)} placeholder="BT-…" /></td>
                        <td><input className="ans-recvin" type="date" value={r.expiryDate} onChange={e => updateRow(i, 'expiryDate', e.target.value)} /></td>
                        <td><input className="ans-recvin" type="number" min="0" step="any" value={r.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} placeholder="0" /></td>
                        <td>
                          <select className="ans-recvin" value={r.unit} onChange={e => updateRow(i, 'unit', e.target.value)}>
                            {['Tablets','Capsules','Bottles','Vials','Ampoules','Sachets','Pieces','Packs','Boxes','Syringes','Tubes'].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td><input className="ans-recvin" type="number" min="0" step="0.01" value={r.unitPrice} onChange={e => updateRow(i, 'unitPrice', e.target.value)} placeholder="0.00" /></td>
                        <td><input className="ans-recvin" type="number" min="0" step="0.01" value={r.vatRate} onChange={e => updateRow(i, 'vatRate', e.target.value)} placeholder="15" /></td>
                        <td className="ans-recv-num">{currency(vat)}</td>
                        <td className="ans-recv-num"><b>{currency(sub + vat)}</b></td>
                        <td>
                          <button type="button" className="ans-recv-rm" onClick={() => removeRow(i)} disabled={receiving} title="Remove row">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button type="button" className="ans-btn ans-recv-add" onClick={addRow} disabled={receiving}>
                <Plus size={16} /> Add Another Item (new catalog)
              </button>

              <div className="ans-recv-totals">
                <div>Lines: <b>{rows.length}</b></div>
                <div>Subtotal: <b>{currency(totals.sub)}</b></div>
                <div>Total VAT: <b>{currency(totals.vat)}</b></div>
                <div>Grand Total: <b>{currency(totals.sub + totals.vat)}</b></div>
              </div>
            </div>
          </div>

          <div className="ans-actions">
            <button type="button" className="ans-btn" onClick={cancelReceive} disabled={receiving}>Cancel</button>
            <button type="button" className="ans-btn ans-btn-success" onClick={handleReceiveAll} disabled={receiving}>
              {receiving ? (
                <><span className="ans-spinner" /> Receiving…</>
              ) : (
                <><CheckCircle size={16} /> Receive All &amp; Add to Catalog</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── PENDING DELIVERIES FROM PURCHASING ── */}
          {shipments.length > 0 && (
            <div className="ans-delivery">
              <div className="ans-delivery-hd">
                <Truck size={18} /> Pending Deliveries from Purchasing ({shipments.length})
              </div>
              <div className="ans-delivery-cards">
                {shipments.map(sh => (
                  <button key={sh.id} type="button" className="ans-delivery-card" onClick={() => openReceive(sh)} disabled={openingId === sh.id}>
                    <div className="ans-delivery-qno">{sh.quotation_no}</div>
                    <div className="ans-delivery-meta">Supplier: {sh.supplier_name || '—'}</div>
                    <div className="ans-delivery-meta">{sh.total_lines} line(s) · Value {currency(parseFloat(sh.total_amount || 0))}</div>
                    <div className="ans-delivery-meta" style={{ color: sh.status === 'partial' ? '#B45309' : '#C2410C' }}>
                      {sh.status === 'partial' ? 'Partially received — continue receiving' : 'Waiting to be received'}
                    </div>
                    <div className="ans-delivery-link">
                      {openingId === sh.id ? <><span className="ans-spinner" style={{ borderColor: 'rgba(0,0,0,.2)', borderTopColor: '#333' }} /> Loading…</> : <><ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} /> Click to receive &amp; add to catalog</>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

      {/* ── SUCCESS CONFIRMATION PANEL ── */}
      {confirmed && (
        <div className="ans-confirm">
          <div className="ans-confirm-hd">
            <CheckCircle size={20} />
            Stock Successfully Registered
          </div>
          <div className="ans-confirm-body">
            <div className="ans-confirm-grid">
              {[
                { label: 'Drug Name',   val: confirmed.name },
                { label: 'Batch No',    val: confirmed.batchNo },
                { label: 'Expiry Date', val: confirmed.expiryDate ? new Date(confirmed.expiryDate).toLocaleDateString() : '—' },
                { label: 'Unit',        val: confirmed.unit || '—' },
                { label: 'Initial Qty', val: confirmed.initialQty || '—' },
                { label: 'Cost Price',  val: confirmed.unitPrice ? `ETB ${parseFloat(confirmed.unitPrice).toFixed(2)}` : '—' },
                { label: 'Category',    val: confirmed.category || '—' },
                { label: 'Storage',     val: confirmed.storage || '—' },
              ].map(({ label, val }) => (
                <div key={label} className="ans-confirm-item">
                  <div className="ans-confirm-label">{label}</div>
                  <div className="ans-confirm-val">{val}</div>
                </div>
              ))}
            </div>
            <div className="ans-confirm-actions">
              <button onClick={() => setConfirmed(null)} className="ans-btn ans-btn-success">
                <Plus size={16} /> Register Another Drug
              </button>
              <button onClick={() => setConfirmed(null)} className="ans-btn">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit}>

        {/* ── SECTION 1: Drug Information ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">Drug Information</h2>
            <span className="ans-sec-sub">* Required fields</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Drug Name <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Amoxicillin"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Strength</label>
                <input
                  className="ans-input"
                  value={form.strength}
                  onChange={set('strength')}
                  placeholder="e.g. 500mg"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Unit <span className="ans-req">*</span></label>
                <select
                  className="ans-input required-field"
                  value={form.unit}
                  onChange={set('unit')}
                  required
                >
                  <option value="">Select unit…</option>
                  {['Tablets','Capsules','Bottles','Vials','Ampoules','Sachets','Pieces','Packs','Boxes','Syringes','Tubes'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="ans-fg">
                <label className="ans-label">Cost Price (ETB)</label>
                <input
                  className="ans-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unitPrice}
                  onChange={set('unitPrice')}
                  placeholder="0.00"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Category</label>
                <input
                  className="ans-input"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="e.g. Antibiotics"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Requires Prescription</label>
                <select
                  className="ans-input"
                  value={form.requiresPrescription}
                  onChange={e => setForm(p => ({ ...p, requiresPrescription: e.target.value === 'true' }))}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="ans-fg full">
                <label className="ans-label">Therapeutic Use / Description</label>
                <input
                  className="ans-input"
                  value={form.therapeuticUse}
                  onChange={set('therapeuticUse')}
                  placeholder="e.g. Treatment of bacterial infections"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── SECTION 2: Batch & Traceability ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">📦 Batch &amp; Traceability — Required</h2>
            <span className="ans-sec-sub">Links stock to its delivery for full recall &amp; expiry tracking</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-info-row">
              <AlertTriangle size={16} color="var(--cwarn)" />
              Batch No and Expiry Date are required. Each delivery batch must be recorded separately for expiry tracking, audit, and recall capability.
            </div>
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Batch No <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  value={form.batchNo}
                  onChange={set('batchNo')}
                  placeholder="e.g. BT-2025-0042"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Expiry Date <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  type="date"
                  value={form.expiryDate}
                  onChange={set('expiryDate')}
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Alert Days Before Expiry</label>
                <input
                  className="ans-input"
                  type="number"
                  min="1"
                  value={form.nearExpiryDays}
                  onChange={set('nearExpiryDays')}
                  placeholder="e.g. 90"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── SECTION 3: Initial Inventory ── */}
        <div className="ans-card">
          <div className="ans-sec-hd">
            <h2 className="ans-sec-title">Initial Inventory</h2>
            <span className="ans-sec-sub">Opening stock quantity for this batch</span>
          </div>
          <div className="ans-sec-body">
            <div className="ans-form-grid">

              <div className="ans-fg">
                <label className="ans-label">Initial Quantity <span className="ans-req">*</span></label>
                <input
                  className="ans-input required-field"
                  type="number"
                  min="1"
                  value={form.initialQty}
                  onChange={set('initialQty')}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Min Reorder Level</label>
                <input
                  className="ans-input"
                  type="number"
                  min="0"
                  value={form.minLevel}
                  onChange={set('minLevel')}
                  placeholder="e.g. 50"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Max Stock Level</label>
                <input
                  className="ans-input"
                  type="number"
                  min="0"
                  value={form.maxLevel}
                  onChange={set('maxLevel')}
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="ans-fg">
                <label className="ans-label">Storage Location</label>
                <input
                  className="ans-input"
                  value={form.storageLocation}
                  onChange={set('storageLocation')}
                  placeholder="e.g. Rack A-1, Shelf 3"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="ans-actions">
          <button type="button" onClick={resetForm} className="ans-btn" disabled={loading}>
            Clear Form
          </button>
          <button type="submit" className="ans-btn ans-btn-primary" disabled={loading}>
            {loading ? (
              <><span className="ans-spinner" /> Registering…</>
            ) : (
              <><Plus size={16} /> Register Stock</>
            )}
          </button>
        </div>

      </form>
        </>
      )}
    </div>
  );
};

export default StoreAddNewStock;
