import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';

const ReceivablePayableCard = ({ title, amount, outstandingSubAmount, overdueCount, colorMode }) => {
  const fmt = (val) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val);

  // Styling based on colorMode
  const isPayable = colorMode === 'payable'; // Payables typically use orange/red tones
  const isReceivable = colorMode === 'receivable'; // Receivables typically use blue/green tones

  const mainColor = isPayable ? '#ea580c' : '#0284c7'; // Orange vs Blue
  const bgMain = isPayable ? '#fff7ed' : '#f0f9ff';
  
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <FileText size={16} color={mainColor} />
      </div>
      
      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.02em' }}>
        {fmt(amount)}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding</span>
          <span style={{ fontSize: 14, fontWeight: 'bold', color: mainColor }}>{fmt(outstandingSubAmount)}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Overdue</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 'bold', color: overdueCount > 0 ? '#dc2626' : '#16a34a' }}>
            {overdueCount > 0 && <AlertCircle size={14} />} {overdueCount} Invoices
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReceivablePayableCard;
