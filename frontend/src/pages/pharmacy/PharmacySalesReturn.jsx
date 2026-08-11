import React, { useState } from 'react';
import { RefreshCcw, Search, ArrowRight, ShieldAlert, CheckCircle, Package, Receipt, AlertCircle, Loader } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';
import styles from './PharmacySalesReturn.module.css';

const PharmacySalesReturn = () => {
  const [step, setStep] = useState(1);
  const [searchSale, setSearchSale] = useState('');
  const [saleFound, setSaleFound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState('');
  const [reason, setReason] = useState('');
  const [returnProcessed, setReturnProcessed] = useState(null);

  const handleSearch = async () => {
    if (!searchSale.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/pharmacy/sales/${searchSale.trim()}`);
      if (res?.status === 'success' && res?.data) {
        const saleData = res.data;
        if (saleData.sale_type === 'CANCELED' || saleData.sale_type === 'RETURNED') {
          setError('This sale has already been fully canceled or returned.');
          setSaleFound(null);
        } else {
          setSaleFound(saleData);
          const initialReturnItems = (saleData.items || []).map(item => ({
            id: item.id,
            name: item.drug_name,
            originalQty: item.quantity,
            price: item.unit_price,
            returnQty: 0,
            condition: 'GOOD'
          }));
          setReturnItems(initialReturnItems);
          setStep(2);
        }
      } else {
        setError('Sale not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Sale not found or error fetching sale.');
      setSaleFound(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnQtyChange = (idx, value) => {
    const item = returnItems[idx];
    const newQty = Math.min(Math.max(0, parseInt(value) || 0), item.originalQty);
    const newItems = [...returnItems];
    newItems[idx].returnQty = newQty;
    setReturnItems(newItems);
  };

  const handleConditionChange = (idx, value) => {
    const newItems = [...returnItems];
    newItems[idx].condition = value;
    setReturnItems(newItems);
  };

  const refundTotal = returnItems.reduce((sum, item) => sum + (item.returnQty * item.price), 0);
  const isValidReturn = returnItems.some(i => i.returnQty > 0) && reason.trim() && refundMethod;

  const handleProcessReturnClick = () => {
    if (!isValidReturn) {
      setError('Please select items to return, provide a reason, and select a refund method.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const executeProcessReturn = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const payload = {
        items: returnItems.filter(i => i.returnQty > 0).map(i => ({
          id: i.id,
          returnQty: i.returnQty,
          condition: i.condition
        })),
        reason,
        refundMethod
      };

      const res = await apiClient.post(`/pharmacy/sales/${saleFound.id}/return`, payload);
      if (res?.status === 'success') {
        submitNotification('Return Processed', `Refund of ETB ${refundTotal} issued. Inventory & totals updated.`);
        setReturnProcessed({
          refundTotal,
          method: refundMethod,
          receiptNo: saleFound.receipt_no || saleFound.id
        });
        setStep(3);
      } else {
        setError('Failed to process return.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing return.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSearchSale('');
    setSaleFound(null);
    setReturnItems([]);
    setRefundMethod('');
    setReason('');
    setError(null);
    setReturnProcessed(null);
  };

  return (
    <div className={styles.pageWrapper}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <RefreshCcw size={24} color="#2563EB" />
            Sales Return
          </h1>
          <p className={styles.pageSubtitle}>Process Sales Returns, Cancellations, and Refunds</p>
        </div>
        <div className={styles.authBadge}>
          <ShieldAlert size={16} /> Manager / Authorized Role Required
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className={styles.mainCard}>

        {/* ── STEP 1: SEARCH ── */}
        {step === 1 && (
          <div className={styles.step1Wrapper}>
            <div className={styles.iconCircle}>
              <Receipt size={28} color="#2563EB" />
            </div>
            <h2 className={styles.step1Title}>Locate Original Sale</h2>
            <p className={styles.step1Sub}>
              Enter the Receipt No. or Sale ID to begin the return process.
            </p>

            <div className={styles.searchRow}>
              <input
                type="text"
                placeholder="e.g. RCP-1002"
                value={searchSale}
                onChange={e => setSearchSale(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className={styles.searchInput}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchSale.trim()}
                className={styles.searchBtn}
              >
                {isLoading
                  ? <Loader size={16} className={styles.spin} />
                  : <Search size={16} />
                }
                Find Sale
              </button>
            </div>

            {error && (
              <div className={styles.errorInline}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PROCESS ── */}
        {step === 2 && saleFound && (
          <div>

            {/* Sale info banner */}
            <div className={styles.saleBanner}>
              <div>
                <div className={styles.saleBannerLabel}>Sale Information</div>
                <div className={styles.saleBannerTitle}>
                  Receipt: {saleFound.receipt_no || saleFound.id}
                </div>
                <div className={styles.saleBannerMeta}>
                  Date: {new Date(saleFound.created_at).toLocaleDateString()} &nbsp;·&nbsp; Type: {saleFound.sale_type}
                </div>
              </div>
              <div className={styles.saleBannerRight}>
                <div className={styles.saleBannerLabel}>Total Amount</div>
                <div className={styles.saleBannerTotal}>ETB {saleFound.total_amount}</div>
              </div>
            </div>

            {error && (
              <div className={styles.errorPanel}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <h3 className={styles.sectionTitle}>
              <Package size={18} color="#6B7280" /> Select Items to Return
            </h3>

            {/* Items table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Item Name</th>
                    <th className={styles.thCenter}>Original Qty</th>
                    <th className={styles.thCenter}>Return Qty</th>
                    <th className={styles.th}>Condition</th>
                    <th className={styles.thRight}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item, idx) => (
                    <tr key={item.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemSub}>ETB {item.price} / unit</div>
                      </td>
                      <td className={styles.tdCenter}>
                        <span className={styles.qtyBadge}>{item.originalQty}</span>
                      </td>
                      <td className={styles.tdCenter}>
                        <input
                          type="number"
                          min="0"
                          max={item.originalQty}
                          value={item.returnQty}
                          onChange={e => handleReturnQtyChange(idx, e.target.value)}
                          className={styles.qtyInput}
                        />
                      </td>
                      <td className={styles.td}>
                        <select
                          value={item.condition}
                          onChange={e => handleConditionChange(idx, e.target.value)}
                          disabled={item.returnQty === 0}
                          className={styles.condSelect}
                        >
                          <option value="GOOD">GOOD (Return to stock)</option>
                          <option value="DAMAGED">DAMAGED (Write-off)</option>
                          <option value="EXPIRED">EXPIRED (Write-off)</option>
                        </select>
                      </td>
                      <td className={styles.tdRight}>
                        <span className={item.returnQty > 0 ? styles.refundAmtActive : styles.refundAmtZero}>
                          ETB {(item.returnQty * item.price).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Refund details */}
            <h3 className={styles.sectionTitle}>Refund Details</h3>
            <div className={styles.refundDetailsGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="">Select Method…</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="TELBIR">Telbir</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Return Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Customer changed mind, Defective…"
                  className={styles.formInput}
                />
              </div>
            </div>

            {/* Refund total bar */}
            <div className={styles.refundBar}>
              <div>
                <div className={styles.refundBarLabel}>Total Refund Amount</div>
                <div className={styles.refundBarAmount}>ETB {refundTotal.toFixed(2)}</div>
              </div>
              <div className={styles.refundBarActions}>
                <button onClick={handleReset} className={styles.btnSecondary}>
                  Cancel
                </button>
                <button
                  onClick={handleProcessReturnClick}
                  disabled={!isValidReturn || isLoading}
                  className={styles.btnDanger}
                >
                  {isLoading
                    ? <Loader size={16} className={styles.spin} />
                    : null
                  }
                  Process Return <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 3 && returnProcessed && (
          <div className={styles.step3Wrapper}>
            <div className={styles.successCircle}>
              <CheckCircle size={40} color="#16A34A" />
            </div>
            <h2 className={styles.successTitle}>Return Processed Successfully!</h2>
            <p className={styles.successBody}>
              A refund of{' '}
              <strong className={styles.successBodyStrong}>
                ETB {returnProcessed.refundTotal.toFixed(2)}
              </strong>{' '}
              has been issued via {returnProcessed.method}. The items have been processed and inventory / totals are updated.
            </p>
            <div className={styles.successActions}>
              <button onClick={handleReset} className={styles.btnDark}>
                <RefreshCcw size={16} /> Process Another Return
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalIconWrap}>
              <AlertCircle size={28} color="#D97706" />
            </div>
            <h3 className={styles.modalTitle}>Confirm Return</h3>
            <p className={styles.modalBody}>
              Are you sure you want to process a return of{' '}
              <strong className={styles.modalBodyStrong}>ETB {refundTotal.toFixed(2)}</strong>?
            </p>
            <div className={styles.modalBtns}>
              <button onClick={() => setShowConfirm(false)} className={styles.modalBtnCancel}>
                Cancel
              </button>
              <button onClick={executeProcessReturn} className={styles.modalBtnConfirm}>
                Yes, Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySalesReturn;
