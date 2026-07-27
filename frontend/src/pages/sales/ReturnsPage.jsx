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
        const saleData = res.data;
        if (saleData.sale_type === 'CANCELED' || saleData.sale_type === 'RETURNED') {
          setError('This sale has already been fully canceled or returned.');
          setSaleFound(null);
        } else {
          setSaleFound(saleData);
          // Initialize return items state based on sale items
          const initialReturnItems = (saleData.items || []).map(item => ({
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
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCcw size={24} color="#f97316" /> SALES RETURN
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Process Sales Returns, Cancellations, and Refunds</p>
        </div>
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 16px', borderRadius: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={20} /> Manager / Authorized Role Required
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 0, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: 32, maxWidth: 900, margin: '0 auto' }}>
        
        {/* STEP 1: Search */}
        {step === 1 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, background: '#fff7ed', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Receipt size={32} color="#f97316" />
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 8, color: '#0f172a' }}>Locate Original Sale</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Enter the Receipt No. or Sale ID to begin the return process.</p>
            
            <div style={{ display: 'flex', gap: 12, maxWidth: 500, margin: '0 auto' }}>
              <input 
                type="text" 
                placeholder="e.g. RCP-1002" 
                value={searchSale}
                onChange={e => setSearchSale(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, padding: '14px 16px', borderRadius: 0, border: '1px solid #cbd5e1', fontSize: 16 }}
              />
              <button 
                onClick={handleSearch} 
                disabled={isLoading || !searchSale.trim()}
                style={{ background: '#f97316', color: 'white', padding: '0 24px', border: 'none', borderRadius: 0, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16, opacity: isLoading || !searchSale.trim() ? 0.7 : 1 }}
              >
                {isLoading ? <Loader size={18} className="spin" /> : <Search size={18} />} 
                Find Sale
              </button>
            </div>
            {error && (
              <div style={{ marginTop: 16, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Process */}
        {step === 2 && saleFound && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Sale Information</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Receipt: {saleFound.receipt_no || saleFound.id}</div>
                <div style={{ color: '#475569', marginTop: 4 }}>
                  Date: {new Date(saleFound.created_at).toLocaleDateString()} | Type: {saleFound.sale_type}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Amount</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>ETB {saleFound.total_amount}</div>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 20, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 0, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} color="#475569" /> Select Items to Return
            </h3>
            
            <div style={{ overflowX: 'auto', marginBottom: 32 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600, borderRadius: 0 }}>Item Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Original Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Return Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Condition</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600, borderRadius: 0 }}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>ETB {item.price} / unit</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                        {item.originalQty}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max={item.originalQty}
                          value={item.returnQty}
                          onChange={e => handleReturnQtyChange(idx, e.target.value)}
                          style={{ width: 70, padding: '8px', textAlign: 'center', borderRadius: 0, border: '1px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <select 
                          value={item.condition}
                          onChange={e => handleConditionChange(idx, e.target.value)}
                          disabled={item.returnQty === 0}
                          style={{ padding: '8px 12px', borderRadius: 0, border: '1px solid #cbd5e1', width: '100%', background: item.returnQty === 0 ? '#f8fafc' : 'white', opacity: item.returnQty === 0 ? 0.6 : 1 }}
                        >
                          <option value="GOOD">GOOD (Return to stock)</option>
                          <option value="DAMAGED">DAMAGED (Write-off)</option>
                          <option value="EXPIRED">EXPIRED (Write-off)</option>
                        </select>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: item.returnQty > 0 ? '#10b981' : '#94a3b8' }}>
                        ETB {(item.returnQty * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Refund Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' }}>Refund Method</label>
                <select 
                  value={refundMethod} 
                  onChange={e => setRefundMethod(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: 0, border: '1px solid #cbd5e1', fontSize: 15 }}
                >
                  <option value="">Select Method...</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="TELBIR">Telbir</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' }}>Return Reason <span style={{color:'#ef4444'}}>*</span></label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="e.g. Customer changed mind, Defective..." 
                  style={{ width: '100%', padding: '12px', borderRadius: 0, border: '1px solid #cbd5e1', fontSize: 15 }} 
                />
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 24, borderRadius: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#c2410c', fontWeight: 600, textTransform: 'uppercase', fontSize: 13, marginBottom: 4 }}>Total Refund Amount</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#9a3412' }}>ETB {refundTotal.toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleReset} 
                  style={{ background: 'white', color: '#475569', padding: '14px 24px', borderRadius: 0, border: '1px solid #cbd5e1', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessReturnClick} 
                  disabled={!isValidReturn || isLoading}
                  style={{ background: '#f97316', color: 'white', padding: '14px 32px', borderRadius: 0, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: !isValidReturn || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: !isValidReturn || isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? <Loader size={20} className="spin" /> : 'PROCESS RETURN'} <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && returnProcessed && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 80, height: 80, background: '#dcfce7', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={40} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', marginBottom: 12 }}>Return Processed Successfully!</h2>
            <p style={{ color: '#475569', fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
              A refund of <strong style={{color: '#0f172a'}}>ETB {returnProcessed.refundTotal.toFixed(2)}</strong> has been issued via {returnProcessed.method}. The items have been processed and inventory/totals are updated.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button 
                onClick={handleReset} 
                style={{ padding: '14px 32px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 0, fontWeight: 600, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RefreshCcw size={18} /> Process Another Return
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 0, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <AlertCircle size={48} color="#f97316" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Confirm Return</h3>
            <p style={{ color: '#475569', marginBottom: 24, fontSize: 15 }}>
              Are you sure you want to process a return of <strong>ETB {refundTotal.toFixed(2)}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ padding: '10px 20px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 0, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={executeProcessReturn}
                style={{ padding: '10px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: 0, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Yes, Process
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReturnsPage;
