import React, { useState } from 'react';
import { boardAggregationService } from '../../../utils/boardAggregationService';
import CurrencyDisplay from '../../sales/components/CurrencyDisplay';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare, 
  User, Calendar, DollarSign, Briefcase, FileText, PauseCircle, Edit
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: '#fffbeb', color: '#d97706', icon: <Clock size={12} /> },
    approved: { bg: '#ecfdf5', color: '#059669', icon: <CheckCircle size={12} /> },
    rejected: { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={12} /> },
    amended: { bg: '#eff6ff', color: '#2563eb', icon: <Edit size={12} /> },
    held: { bg: '#f3f4f6', color: '#4b5563', icon: <PauseCircle size={12} /> }
  };
  const s = styles[status] || styles.pending;
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      backgroundColor: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      {s.icon} {status}
    </span>
  );
};

const ApprovalQueue = ({ items, title, description, allowAmend = false, allowHold = false }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [notes, setNotes] = useState('');
  const [amendAmount, setAmendAmount] = useState('');
  
  // Board Member 1 is our simulated logged-in board member
  const currentUserId = 'Board Member 1';

  const handleAction = (action) => {
    if (!selectedItem) return;
    try {
      if (action === 'approve') boardAggregationService.approveItem(selectedItem.id, currentUserId, notes);
      else if (action === 'reject') boardAggregationService.rejectItem(selectedItem.id, currentUserId, notes);
      else if (action === 'hold') boardAggregationService.holdItem(selectedItem.id, currentUserId, notes);
      else if (action === 'amend') boardAggregationService.amendItem(selectedItem.id, currentUserId, notes, parseInt(amendAmount, 10));
      
      setSelectedItem(null);
      setNotes('');
      setAmendAmount('');
    } catch (err) {
      alert(err.message);
    }
  };

  const renderDetails = (item) => {
    return Object.entries(item.details).map(([key, value]) => {
      if (key === 'amended_amount_cents') return null; // handled separately
      return (
        <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ color: '#64748b', fontSize: '13px', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
          <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '500' }}>{value}</span>
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
        <p style={{ color: '#64748b', margin: 0 }}>{description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 400px' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              style={{
                backgroundColor: 'white', border: `1px solid ${selectedItem?.id === item.id ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '20px', cursor: 'pointer',
                boxShadow: selectedItem?.id === item.id ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
              }}
            >
              {selectedItem?.id === item.id && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#3b82f6' }} />
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{item.item_number}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{item.title}</div>
                </div>
                {item.amount_cents !== null && (
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    <CurrencyDisplay amountCents={item.amount_cents} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b' }}>
                {item.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14} /> {item.department}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {item.requested_by}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(item.requested_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#475569' }}>No pending items</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>The queue is currently empty.</div>
            </div>
          )}
        </div>

        {/* Details Column */}
        {selectedItem && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Review Details</h2>
              <StatusBadge status={selectedItem.status} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              {renderDetails(selectedItem)}
              {selectedItem.details.amended_amount_cents && (
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', padding: '8px 0', borderBottom: '1px solid #f1f5f9', backgroundColor: '#eff6ff' }}>
                  <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: '600', paddingLeft: '8px' }}>Amended Amount</span>
                  <span style={{ color: '#1d4ed8', fontSize: '13px', fontWeight: '700' }}><CurrencyDisplay amountCents={selectedItem.details.amended_amount_cents} /></span>
                </div>
              )}
            </div>

            {selectedItem.decided_by && (
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Decision Audit</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                  <User size={14} color="#64748b" /> {selectedItem.decided_by}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                  <Clock size={14} /> {new Date(selectedItem.decided_at).toLocaleString()}
                </div>
                {selectedItem.decision_notes && (
                  <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {selectedItem.decision_notes}
                  </div>
                )}
              </div>
            )}

            {(selectedItem.status === 'pending' || selectedItem.status === 'held') && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Decision Notes</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Required for rejections or amendments..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '16px', minHeight: '80px', boxSizing: 'border-box' }}
                />

                {allowAmend && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Amend Amount (if counter-proposing)</label>
                    <input 
                      type="number" 
                      value={amendAmount} 
                      onChange={e => setAmendAmount(e.target.value)}
                      placeholder="e.g. 5000000"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: allowAmend || allowHold ? '1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => handleAction('approve')} style={{ padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleAction('reject')} style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={16} /> Reject
                  </button>
                  {allowHold && (
                    <button onClick={() => handleAction('hold')} style={{ padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                      <PauseCircle size={16} /> Place on Hold
                    </button>
                  )}
                  {allowAmend && (
                    <button onClick={() => handleAction('amend')} disabled={!amendAmount} style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: amendAmount ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', gridColumn: '1 / -1', opacity: amendAmount ? 1 : 0.5 }}>
                      <Edit size={16} /> Amend Proposal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;
