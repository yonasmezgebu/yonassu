import React, { useState, useEffect } from 'react';
import { receiveNotification, triggerNotification } from '../../utils/ceoNotifications';
import { ClipboardList, Download, Printer, Filter, ShieldAlert } from 'lucide-react';

const CEOAuditReport = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('June 2026');
  const [filterType, setFilterType] = useState('Monthly');

  useEffect(() => {
    receiveNotification('Audit Report', `📋 Audit Report Ready - Period: ${filterPeriod} - Variance: $4,200`);
    // eslint-disable-next-line
  }, [filterPeriod, filterType, filterDept]);

  const handleExport = () => triggerNotification('Export Started', 'Exporting Audit Report as PDF...');
  const handlePrint = () => {
    triggerNotification('Print Job Started', 'Sending Audit Report to printer...');
    window.print();
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList color="#8b5cf6" size={28}/> INTERNAL AUDIT REPORT
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Review Variances, Compliance, and Corrective Actions</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Printer size={16}/> Print
          </button>
          <button onClick={handleExport} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={16}/> Export PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b"/> <span style={{ fontWeight: 'bold', fontSize: 14 }}>Filters:</span>
        </div>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option>June 2026</option>
          <option>May 2026</option>
          <option>April 2026</option>
          <option>Q2 2026</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Annual</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="All">All Departments</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Store">Store</option>
          <option value="Car Rental">Car Rental</option>
          <option value="Agri Rental">Agri Rental</option>
          <option value="Printing">Printing</option>
        </select>
      </div>

      {/* AUDIT SUMMARY & VARIANCE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#e0e7ff', padding: 20, borderRadius: 8, border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 13, color: '#3730a3', fontWeight: 'bold' }}>Audit Status</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#4338ca', marginTop: 8 }}>Completed</div>
          <div style={{ fontSize: 12, color: '#3730a3', marginTop: 8 }}>For {filterType} Period</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>Departments Audited</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>5 / 10</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>High-risk areas covered</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 20, borderRadius: 8, border: '1px solid #fecaca', gridColumn: 'span 2' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16}/> Total Financial Variance
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#b91c1c', marginTop: 8 }}>-ETB 4,200.00</div>
          <div style={{ fontSize: 12, color: '#991b1b', marginTop: 8 }}>Unexplained stock loss or cash discrepancies found across audited departments.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* VARIANCE BREAKDOWN */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Variance Breakdown by Department</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Variance Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Pharmacy</td>
                <td style={{ padding: 12, color: '#b91c1c', fontWeight: 'bold' }}>Variance Found</td>
                <td style={{ padding: 12, color: '#b91c1c', fontWeight: 'bold' }}>-ETB 3,500.00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Store</td>
                <td style={{ padding: 12, color: '#b91c1c', fontWeight: 'bold' }}>Variance Found</td>
                <td style={{ padding: 12, color: '#b91c1c', fontWeight: 'bold' }}>-ETB 700.00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Car Rental</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>Zero Variance</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>$0.00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Agri Rental</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>Zero Variance</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>$0.00</td>
              </tr>
              <tr>
                <td style={{ padding: 12, fontWeight: 'bold' }}>Printing</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>Zero Variance</td>
                <td style={{ padding: 12, color: '#166534', fontWeight: 'bold' }}>$0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* REASONS & ACTIONS */}
        <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0f172a' }}>Variance Reasons & Corrective Actions</h3>
          
          <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 4px 4px 0' }}>
            <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>Pharmacy (-$3,500)</div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}><strong>Reason:</strong> Expired stock not properly logged in M22 system; 1 batch of antibiotics damaged during transport.</div>
            <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}><strong>Action:</strong> Retrain pharmacy staff on M22 disposal logging. Implement stricter temperature control during transport.</div>
          </div>

          <div style={{ padding: 12, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 4px 4px 0' }}>
            <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>Store (-$700)</div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}><strong>Reason:</strong> Office supplies issued without approved M19 requisition.</div>
            <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}><strong>Action:</strong> Enforce strict "No Requisition, No Issue" policy. Issue formal warning to Store Manager.</div>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 28, color: '#1e3a8a', marginBottom: 8, marginTop: 16 }}>Abebe Kebede</div>
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 8, fontWeight: 'bold', fontSize: 14 }}>Internal Auditor</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Stamp ID: AUD-49912</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 28, color: '#1e3a8a', marginBottom: 8, marginTop: 16 }}>Solomon T.</div>
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 8, fontWeight: 'bold', fontSize: 14 }}>Chief Executive Officer</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Stamp ID: CEO-11001</div>
        </div>
      </div>

    </div>
  );
};

export default CEOAuditReport;
