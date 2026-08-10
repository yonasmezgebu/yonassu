import React, { useState } from 'react';
import { RefreshCcw, Search, ArrowRight, ShieldAlert, CheckCircle, Package, Receipt, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const ReturnsPage = () => {
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
      const res = await apiClient.get(`/pos/sales/${searchSale.trim()}`);
      if (res?.status === 'success' && res?.data) {
        const saleData = res.data.sale || res.data;
        const saleItems = res.data.items || saleData.items || [];
        if (saleData.sale_type === 'CANCELED' || saleData.sale_type === 'RETURNED') {
          setError('This sale has already been fully canceled or returned.');
          setSaleFound(null);
        } else {
          setSaleFound({ ...saleData, items: saleItems });
          const initialReturnItems = saleItems.map(item => ({
            id: item.id,
            name: item.product_name,
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
        saleId: saleFound.id,
        items: returnItems.filter(i => i.returnQty > 0).map(i => ({
          itemId: i.id,
          productId: i.id,
          quantity: i.returnQty,
          reasonCode: i.condition
        })),
        notes: reason,
        refundMethod
      };

      const res = await apiClient.post(`/pos/returns`, payload);
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
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', width: '100%', background: 'var(--color-bg-page)' }}>
      {/* ── PAGE HEADER ── */}
      <div style={{
        width: '100%',
        background: '#1D4ED8',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        flexShrink: 0,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
           <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
             🌿
           </div>
           <div>
             <h2 style={{ fontSize: 20, fontWeight: 600, color: 'white', margin: 0, letterSpacing: '0.01em', lineHeight: 1.3 }}>SALES RETURN</h2>
             <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', marginTop: 2 }}>PROCESS CANCELLATIONS & REFUNDS</div>
           </div>
        </div>
        <div style={{ background: '#FEF3C7', color: '#B45309', padding: '6px 14px', borderRadius: 999, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <ShieldAlert size={15} /> MANAGER AUTHORIZED
        </div>
      </div>

      <div className="returns-container">
        <div className="returns-card">
          {/* STEP 1: Search */}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '40px 0', maxWidth: 560, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Receipt size={40} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 10, color: '#111827', lineHeight: 1.3 }}>Locate Original Sale</h3>
              <p style={{ color: '#6B7280', margin: '0 0 32px', fontSize: 14, lineHeight: 1.5 }}>Enter the Receipt No. or Sale ID to begin the return process.</p>
              
              <div style={{ display: 'flex', gap: 12, width: '100%', flexDirection: 'row' }} className="mobile-col">
                <input 
                  type="text" 
                  placeholder="e.g. RCP-1002" 
                  value={searchSale}
                  onChange={e => setSearchSale(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                  style={{ flex: 1, height: 44, padding: '0 16px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isLoading || !searchSale.trim()}
                  style={{ height: 44, padding: '0 24px', background: '#2563EB', color: 'white', border: '1px solid #2563EB', borderRadius: 8, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500, fontSize: 14, opacity: isLoading || !searchSale.trim() ? 0.5 : 1, transition: 'all 0.15s ease' }}
                  className="search-btn"
                >
                  {isLoading ? <SegmentedSpinner size={18} /> : <Search size={18} />} 
                  SEARCH
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 24, padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Process */}
          {step === 2 && saleFound && (
            <div>
              <div className="sale-panel" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, padding: '20px 24px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderLeft: '4px solid #2563EB', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div>
                  <div className="panel-label">Sale Information</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>Receipt: {saleFound.receipt_no || saleFound.id}</div>
                  <div style={{ color: '#6B7280', marginTop: 6, fontWeight: 500, fontSize: 13 }}>
                    Date: {new Date(saleFound.created_at).toLocaleDateString()} | Type: {saleFound.sale_type}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="panel-label">Total Amount</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#2563EB', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>ETB {saleFound.total_amount}</div>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <h3 className="section-title">
                <Package size={18} color="#2563EB" /> Select Items to Return
              </h3>
              
              <div className="table-wrapper">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th style={{textAlign: 'center'}}>Original Qty</th>
                      <th style={{textAlign: 'center'}}>Return Qty</th>
                      <th>Condition</th>
                      <th style={{textAlign: 'right'}}>Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{item.name}</div>
                          <div style={{ color: '#6B7280', fontSize: 13, fontWeight: 500, marginTop: 2 }}>ETB {item.price} / unit</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                          {item.originalQty}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="0" 
                            max={item.originalQty}
                            value={item.returnQty}
                            onChange={e => handleReturnQtyChange(idx, e.target.value)}
                            className="qty-input"
                            style={{ width: 80, height: 36, padding: '0 8px', textAlign: 'center', borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 600, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                          />
                        </td>
                        <td>
                          <select 
                            value={item.condition}
                            onChange={e => handleConditionChange(idx, e.target.value)}
                            disabled={item.returnQty === 0}
                            className="cond-select"
                            style={{ padding: '0 12px', height: 36, borderRadius: 8, border: '1px solid #D1D5DB', width: '100%', background: item.returnQty === 0 ? '#F9FAFB' : 'white', opacity: item.returnQty === 0 ? 0.5 : 1, fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontSize: 13, fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                          >
                            <option value="GOOD">GOOD (Return to stock)</option>
                            <option value="DAMAGED">DAMAGED (Write-off)</option>
                            <option value="EXPIRED">EXPIRED (Write-off)</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: item.returnQty > 0 ? '#2563EB' : '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                          ETB {(item.returnQty * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="section-title">Refund Details</h3>
              <div className="flex-grid">
                <div>
                  <label className="form-label">Refund Method</label>
                  <select 
                    value={refundMethod} 
                    onChange={e => setRefundMethod(e.target.value)} 
                    className="method-select"
                    style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white', color: '#111827', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                  >
                    <option value="">Select Method...</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="TELBIR">Telbir</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Return Reason <span style={{color:'#DC2626'}}>*</span></label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="e.g. Customer changed mind, Defective..." 
                    className="reason-input"
                    style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }} 
                  />
                </div>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '24px 28px', borderRadius: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                <div>
                  <div className="panel-label" style={{ color: '#1D4ED8' }}>Total Refund Amount</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#2563EB', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>ETB {refundTotal.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleReset} 
                    className="btn-secondary"
                    style={{ height: 44, padding: '0 24px', background: 'white', color: '#374151', borderRadius: 8, border: '1px solid #D1D5DB', fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleProcessReturnClick} 
                    disabled={!isValidReturn || isLoading}
                    className="btn-primary"
                    style={{ height: 44, padding: '0 24px', background: '#2563EB', color: 'white', border: '1px solid #2563EB', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: !isValidReturn || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: !isValidReturn || isLoading ? 0.5 : 1, transition: 'all 0.15s ease' }}
                  >
                    {isLoading ? <SegmentedSpinner size={18} /> : 'PROCESS RETURN'} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && returnProcessed && (
            <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 560, margin: '0 auto' }}>
              <div style={{ width: 88, height: 88, background: '#16A34A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}>
                <CheckCircle size={46} color="white" />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 600, color: '#111827', marginBottom: 12, lineHeight: 1.3 }}>Return Processed!</h2>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
                A refund of <strong style={{color: '#2563EB', fontSize: 18, fontVariantNumeric: 'tabular-nums'}}>ETB {returnProcessed.refundTotal.toFixed(2)}</strong> has been issued via <strong>{returnProcessed.method}</strong>. The items have been processed and inventory is updated.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button 
                  onClick={handleReset} 
                  className="btn-primary"
                  style={{ height: 44, padding: '0 28px', background: '#2563EB', color: 'white', border: '1px solid #2563EB', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s ease' }}
                >
                  <RefreshCcw size={18} /> NEW RETURN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', padding: '28px 28px 24px', borderRadius: 12, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <AlertCircle size={52} color="#D97706" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 12, lineHeight: 1.3 }}>Confirm Return</h3>
            <p style={{ color: '#6B7280', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
              Are you sure you want to process a return of <br/>
              <strong style={{fontSize: 22, color: '#2563EB', display: 'block', marginTop: 8, fontVariantNumeric: 'tabular-nums'}}>ETB {refundTotal.toFixed(2)}</strong>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
                style={{ minHeight: 44, padding: '0 24px', background: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, transition: 'all 0.15s ease' }}
              >
                CANCEL
              </button>
              <button 
                onClick={executeProcessReturn}
                className="btn-primary"
                style={{ minHeight: 44, padding: '0 24px', background: '#2563EB', color: 'white', border: '1px solid #2563EB', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
              >
                YES, PROCESS
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root {
          --color-primary: #2563EB;
          --color-primary-hover: #1D4ED8;
          --color-bg-page: #F5F6FA;
          --color-bg-card: #FFFFFF;
          --color-border: #E5E7EB;
          --color-text-primary: #111827;
          --color-text-secondary: #6B7280;
          --color-text-muted: #9CA3AF;
          --color-success: #16A34A;
          --color-success-bg: #DCFCE7;
          --color-danger: #DC2626;
          --color-danger-bg: #FEE2E2;
          --color-warning: #D97706;
          --color-warning-bg: #FEF3C7;
          --color-info: #0284C7;
          --color-info-bg: #E0F2FE;
          --amber: #F59E0B;
          --amber-bg: #FEFCE8;
          --ring: rgba(37,99,235,0.1);
        }
        .returns-container {
          padding: 24px;
          min-height: calc(100vh - 64px);
          background-color: var(--color-bg-page);
          box-sizing: border-box;
          width: 100%;
        }
        .returns-card {
          background: var(--color-bg-card);
          border-radius: 10px;
          border: 1px solid var(--color-border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 24px;
          width: 100%;
          box-sizing: border-box;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .returns-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .panel-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 6px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.3;
        }
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--color-text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 32px;
          border: 1px solid var(--color-border);
          border-radius: 10px;
          width: 100%;
          background: white;
        }
        .styled-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        .styled-table th {
          background: #F9FAFB;
          color: var(--color-text-secondary);
          padding: 12px 16px;
          text-align: left;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.03em;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .styled-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .styled-table tbody tr { transition: background 0.15s ease; }
        .styled-table tbody tr:hover { background: var(--amber-bg); }
        .styled-table tbody tr:last-child td { border-bottom: none; }
        .flex-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .sale-panel { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
        .sale-panel:hover { border-color: var(--amber); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .search-input:hover { border-color: #9CA3AF; }
        .search-input:focus,
        .qty-input:focus,
        .cond-select:focus,
        .method-select:focus,
        .reason-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--ring);
        }
        .search-btn:hover:not(:disabled) { background: var(--color-primary-hover); border-color: var(--color-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); border-color: var(--color-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .btn-secondary:hover:not(:disabled) { background: #F9FAFB; border-color: #9CA3AF; transform: translateY(-1px); }
        @media (max-width: 1280px) {
          .returns-container { padding: 20px; }
        }
        @media (max-width: 1024px) {
          .returns-container { padding: 16px; }
          .returns-card { padding: 20px; }
        }
        @media (max-width: 768px) {
          .returns-container { padding: 12px; }
          .returns-card { padding: 16px; }
          .flex-grid { grid-template-columns: 1fr; gap: 16px; }
          .mobile-col { flex-direction: column !important; gap: 12px !important; }
          .search-btn { width: 100%; }
          .styled-table { min-width: 600px; }
          .styled-table th, .styled-table td { padding: 12px; font-size: 13px; }
        }
        @media (max-width: 480px) {
          .returns-container { padding: 8px; }
          .returns-card { padding: 12px; }
          .styled-table { min-width: 100%; }
          .styled-table th, .styled-table td { padding: 10px; font-size: 13px; }
          .qty-input, .cond-select, .method-select, .reason-input { height: 44px; }
        }
      `}</style>
    </div>
  );
};

export default ReturnsPage;
