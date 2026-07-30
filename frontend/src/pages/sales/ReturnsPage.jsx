import React, { useState } from 'react';
import { RefreshCcw, Search, ArrowRight, ShieldAlert, CheckCircle, Package, Receipt, AlertCircle, Loader } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { submitNotification } from '../../utils/pharmacyNotifications';

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
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* ── NATURE THEME HEADER ── */}
      <div style={{
        width: '100%',
        background: '#1B5E20',
        padding: '0 32px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
             🌿
           </div>
           <div>
             <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '0.05em' }}>SALES RETURN</h2>
             <div style={{ color: '#A5D6A7', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>PROCESS CANCELLATIONS & REFUNDS</div>
           </div>
        </div>
        <div style={{ background: '#FF9800', color: 'white', padding: '8px 16px', borderRadius: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <ShieldAlert size={16} /> MANAGER AUTHORIZED
        </div>
      </div>

      <div className="returns-container">
        <div className="returns-card">
          {/* STEP 1: Search */}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '40px 0', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, background: '#E8F5E9', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Receipt size={40} color="#228B22" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#1B5E20' }}>Locate Original Sale</h3>
              <p style={{ color: '#424242', marginBottom: 32, fontSize: 16 }}>Enter the Receipt No. or Sale ID to begin the return process.</p>
              
              <div style={{ display: 'flex', gap: 0, width: '100%', flexDirection: 'row' }} className="mobile-col">
                <input 
                  type="text" 
                  placeholder="e.g. RCP-1002" 
                  value={searchSale}
                  onChange={e => setSearchSale(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1, padding: '16px 20px', borderRadius: 0, border: '2px solid #8D6E63', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isLoading || !searchSale.trim()}
                  style={{ background: '#2E8B57', color: 'white', padding: '0 32px', border: 'none', borderRadius: 0, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, opacity: isLoading || !searchSale.trim() ? 0.7 : 1 }}
                  className="search-btn"
                >
                  {isLoading ? <Loader size={20} className="spin" /> : <Search size={20} />} 
                  SEARCH
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 24, padding: 16, background: '#F44336', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}>
                  <AlertCircle size={20} /> {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Process */}
          {step === 2 && saleFound && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, padding: 24, background: '#F5F5F5', borderLeft: '4px solid #228B22', borderRadius: 0 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#1B5E20', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Sale Information</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#424242' }}>Receipt: {saleFound.receipt_no || saleFound.id}</div>
                  <div style={{ color: '#6B8E23', marginTop: 6, fontWeight: 600, fontSize: 14 }}>
                    Date: {new Date(saleFound.created_at).toLocaleDateString()} | Type: {saleFound.sale_type}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#1B5E20', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Total Amount</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#228B22' }}>ETB {saleFound.total_amount}</div>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: 24, padding: 16, background: '#F44336', color: 'white', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#1B5E20' }}>
                <Package size={20} color="#228B22" /> Select Items to Return
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
                          <div style={{ fontWeight: 700, color: '#424242', fontSize: 15 }}>{item.name}</div>
                          <div style={{ color: '#6B8E23', fontSize: 13, fontWeight: 600, marginTop: 4 }}>ETB {item.price} / unit</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#424242', fontSize: 16 }}>
                          {item.originalQty}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="0" 
                            max={item.originalQty}
                            value={item.returnQty}
                            onChange={e => handleReturnQtyChange(idx, e.target.value)}
                            style={{ width: 80, padding: '10px', textAlign: 'center', borderRadius: 0, border: '2px solid #8D6E63', fontWeight: 800, fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td>
                          <select 
                            value={item.condition}
                            onChange={e => handleConditionChange(idx, e.target.value)}
                            disabled={item.returnQty === 0}
                            style={{ padding: '10px 14px', borderRadius: 0, border: '2px solid #8D6E63', width: '100%', background: item.returnQty === 0 ? '#F5F5F5' : 'white', opacity: item.returnQty === 0 ? 0.5 : 1, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                          >
                            <option value="GOOD">GOOD (Return to stock)</option>
                            <option value="DAMAGED">DAMAGED (Write-off)</option>
                            <option value="EXPIRED">EXPIRED (Write-off)</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: item.returnQty > 0 ? '#228B22' : '#A5D6A7' }}>
                          ETB {(item.returnQty * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#1B5E20' }}>Refund Details</h3>
              <div className="flex-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 800, color: '#424242', fontSize: 13, textTransform: 'uppercase' }}>Refund Method</label>
                  <select 
                    value={refundMethod} 
                    onChange={e => setRefundMethod(e.target.value)} 
                    style={{ width: '100%', padding: '14px', borderRadius: 0, border: '2px solid #8D6E63', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Select Method...</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="TELBIR">Telbir</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 800, color: '#424242', fontSize: 13, textTransform: 'uppercase' }}>Return Reason <span style={{color:'#F44336'}}>*</span></label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="e.g. Customer changed mind, Defective..." 
                    style={{ width: '100%', padding: '14px', borderRadius: 0, border: '2px solid #8D6E63', fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ background: '#E8F5E9', border: 'none', padding: 32, borderRadius: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
                <div>
                  <div style={{ color: '#1B5E20', fontWeight: 800, textTransform: 'uppercase', fontSize: 13, marginBottom: 6 }}>Total Refund Amount</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#228B22' }}>ETB {refundTotal.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleReset} 
                    style={{ background: 'white', color: '#424242', padding: '16px 32px', borderRadius: 0, border: '1px solid #E2E8F0', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleProcessReturnClick} 
                    disabled={!isValidReturn || isLoading}
                    style={{ background: '#2E8B57', color: 'white', padding: '16px 32px', borderRadius: 0, border: 'none', fontWeight: 800, fontSize: 16, cursor: !isValidReturn || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: !isValidReturn || isLoading ? 0.6 : 1 }}
                  >
                    {isLoading ? <Loader size={20} className="spin" /> : 'PROCESS RETURN'} <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && returnProcessed && (
            <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ width: 100, height: 100, background: '#4CAF50', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <CheckCircle size={50} color="white" />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#1B5E20', marginBottom: 16 }}>Return Processed!</h2>
              <p style={{ color: '#424242', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
                A refund of <strong style={{color: '#228B22', fontSize: 20}}>ETB {returnProcessed.refundTotal.toFixed(2)}</strong> has been issued via <strong>{returnProcessed.method}</strong>. The items have been processed and inventory is updated.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button 
                  onClick={handleReset} 
                  style={{ padding: '16px 40px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: 0, fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <RefreshCcw size={20} /> NEW RETURN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'white', padding: 40, borderRadius: 0, maxWidth: 450, width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <AlertCircle size={60} color="#FF9800" style={{ margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#1B5E20', marginBottom: 16 }}>Confirm Return</h3>
            <p style={{ color: '#424242', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
              Are you sure you want to process a return of <br/>
              <strong style={{fontSize: 24, color: '#228B22', display: 'block', marginTop: 8}}>ETB {refundTotal.toFixed(2)}</strong>
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ padding: '16px 24px', background: '#F5F5F5', color: '#424242', border: 'none', borderRadius: 0, fontWeight: 800, fontSize: 16, cursor: 'pointer', flex: 1 }}
              >
                CANCEL
              </button>
              <button 
                onClick={executeProcessReturn}
                style={{ padding: '16px 24px', background: '#FF9800', color: 'white', border: 'none', borderRadius: 0, fontWeight: 800, fontSize: 16, cursor: 'pointer', flex: 1 }}
              >
                YES, PROCESS
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .returns-container {
          padding: 24px 32px;
          min-height: calc(100vh - 68px);
          background-color: #F5F5F5;
          box-sizing: border-box;
          width: 100%;
        }
        .returns-card {
          background: white;
          border-radius: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          padding: 32px;
          width: 100%;
          border: 2px solid #8D6E63;
          box-sizing: border-box;
        }
        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 32px;
          border: none;
          width: 100%;
        }
        .styled-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        .styled-table th {
          background: #1B5E20;
          color: white;
          padding: 14px 16px;
          text-align: left;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 13px;
        }
        .styled-table td {
          padding: 16px;
          border-bottom: 1px solid #E2E8F0;
        }
        .flex-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .returns-container { padding: 12px; }
          .returns-card { padding: 16px; border: 1px solid #8D6E63; }
          .flex-grid { grid-template-columns: 1fr; gap: 16px; }
          .mobile-col { flex-direction: column !important; gap: 12px !important; }
          .search-btn { width: 100%; padding: 16px !important; justify-content: center; }
          .styled-table { min-width: 500px; }
          .styled-table th, .styled-table td { padding: 10px; font-size: 13px; }
        }
        @media (max-width: 480px) {
          .styled-table { min-width: 100%; }
          .styled-table th, .styled-table td { padding: 8px; font-size: 12px; }
          h2 { font-size: 18px !important; }
          h3 { font-size: 18px !important; }
        }
      `}</style>
    </div>
  );
};

export default ReturnsPage;
