import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Printer, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { createCount, getInventory } from '../../utils/storeApi';

const REASON_CODES = ['Counting Error', 'Damage/Breakage', 'Theft/Loss', 'Supplier Short-Shipment', 'Misidentification', 'System Data Entry Error', 'Other'];

const StorePhysicalCount = () => {
  const [countType, setCountType] = useState('Full Store Count');
  const [counts, setCounts] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await getInventory();
        const inventoryData = res.data || [];
        setInventory(inventoryData);
        const mappedItems = (inventoryData || []).map(item => ({
          drug_id: item.drug_id,
          name: item.drug_name + (item.strength ? ' ' + item.strength : ''),
          systemQty: Number(item.quantity),
          physicalQty: '',
          reasonCode: ''
        }));
        setCounts(mappedItems);
      } catch (err) {
        setError(err.message || 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const updateCount = (idx, field, value) => {
    setCounts(c => c.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const getVariance = (item) => {
    if (item.physicalQty === '' || isNaN(item.physicalQty)) return null;
    return +item.physicalQty - item.systemQty;
  };

  const validate = () => {
    const e = {};
    counts.forEach((item, i) => {
      if (item.physicalQty === '' || isNaN(item.physicalQty)) {
        e[`qty_${i}`] = 'Physical count required';
      } else {
        const variance = getVariance(item);
        if (variance !== 0 && !item.reasonCode) {
          e[`reason_${i}`] = 'Reason required when variance ≠ 0';
        }
      }
    });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const totalVariance = counts.reduce((s, item) => {
      const v = getVariance(item);
      return s + (v !== null ? Math.abs(v) : 0);
    }, 0);

    try {
      const count_no = 'CNT-' + Date.now().toString().slice(-6);
      const payload = {
        count_no,
        count_type: countType,
        count_date: new Date().toISOString().split('T')[0],
        items: counts
          .filter(item => item.physicalQty !== '' && !isNaN(item.physicalQty))
          .map(item => ({
            drug_id: Number(item.drug_id || item.id),
            physical_quantity: Number(item.physicalQty),
            reason_code: item.reasonCode || null,
          }))
      };
      const res = await createCount(payload);
      if (!res.success) throw new Error(res.message);
      setSubmitted({
        reportNumber: count_no,
        countType,
        counts,
        totalVariance,
        date: new Date().toISOString()
      });
    } catch (err) {
      setError(err.message || 'Failed to submit count');
    }
  };

  const resetCounts = () => {
    setCounts(inventory.map(item => ({
      drug_id: item.drug_id,
      name: item.drug_name + (item.strength ? ' ' + item.strength : ''),
      systemQty: Number(item.quantity),
      physicalQty: '',
      reasonCode: ''
    })));
    setErrors({});
  };

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 16 }}>Loading inventory...</p>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <AlertTriangle color="#b91c1c" size={24} />
          <p style={{ color: '#b91c1c', fontWeight: 600, marginTop: 8 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 20px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 12, border: '2px solid #06b6d4', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle size={56} color="#06b6d4" />
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#164e63', margin: '12px 0 4px' }}>Physical Count Submitted</h2>
            <p style={{ color: '#64748b' }}>Count Report generated and submitted to Internal Auditor for review.</p>
          </div>
          <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 20, border: '1px solid #bae6fd', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 14, marginBottom: 16 }}>
              <div><strong>Count #:</strong> <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{submitted.reportNumber}</span></div>
              <div><strong>Type:</strong> {submitted.countType}</div>
              <div><strong>Date:</strong> {new Date(submitted.date).toLocaleDateString()}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#e0f2fe' }}>
                {['Item Name', 'System Qty', 'Physical Qty', 'Variance', 'Reason Code'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>{submitted.counts.map((item, i) => {
                const v = item.physicalQty - item.systemQty;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: v !== 0 ? '#fff7ed' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '8px 10px' }}>{item.systemQty}</td>
                    <td style={{ padding: '8px 10px' }}>{item.physicalQty}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: v < 0 ? '#b91c1c' : v > 0 ? '#166534' : '#475569' }}>
                      {v > 0 ? `+${v}` : v}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{item.reasonCode || '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{ marginTop: 16, padding: 12, background: submitted.totalVariance > 0 ? '#fee2e2' : '#dcfce7', border: `1px solid ${submitted.totalVariance > 0 ? '#fca5a5' : '#86efac'}`, borderRadius: 6, fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
              Total Absolute Variance: {submitted.totalVariance} units | Status: Submitted to Auditor ✓
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
              <Printer size={15} /> Print Report
            </button>
            <button onClick={() => { setSubmitted(null); resetCounts(); }} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              + New Count
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck color="#06b6d4" size={28} /> PHYSICAL COUNT
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: Count Report — Manager Access Only</p>
      </div>

      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
        <AlertTriangle color="#0284c7" size={18} />
        <span><strong>Validation Rule:</strong> Any item with a non-zero variance MUST have a Reason Code before the count can be submitted.</span>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Count Configuration</h3>
            <select value={countType} onChange={e => setCountType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
              <option>Full Store Count</option>
              <option>Category-wise Count</option>
              <option>Spot Check</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>Item Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>System Qty</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Physical Qty *</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Variance</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>Reason Code (if Variance ≠ 0)</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((item, i) => {
                const variance = getVariance(item);
                const hasVariance = variance !== null && variance !== 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: hasVariance ? '#fff7ed' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b' }}>{item.systemQty}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input type="number" value={item.physicalQty} onChange={e => updateCount(i, 'physicalQty', e.target.value)} placeholder="0" style={{ width: 80, padding: '6px 8px', border: `1px solid ${errors[`qty_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, textAlign: 'center', fontSize: 13 }} />
                      {errors[`qty_${i}`] && <div style={{ color: '#ef4444', fontSize: 11 }}>{errors[`qty_${i}`]}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: variance === null ? '#94a3b8' : variance < 0 ? '#b91c1c' : variance > 0 ? '#166534' : '#475569' }}>
                      {variance === null ? '—' : variance > 0 ? `+${variance}` : variance}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {hasVariance ? (
                        <div>
                          <select value={item.reasonCode} onChange={e => updateCount(i, 'reasonCode', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: `1px solid ${errors[`reason_${i}`] ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6, fontSize: 13 }}>
                            <option value="">— Select Reason Code —</option>
                            {REASON_CODES.map(r => <option key={r}>{r}</option>)}
                          </select>
                          {errors[`reason_${i}`] && <div style={{ color: '#ef4444', fontSize: 11 }}>{errors[`reason_${i}`]}</div>}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={resetCounts} style={{ padding: '10px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Reset</button>
          <button type="submit" style={{ padding: '10px 28px', background: '#164e63', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Submit Count & Generate Report</button>
        </div>
      </form>
    </div>
  );
};

export default StorePhysicalCount;
