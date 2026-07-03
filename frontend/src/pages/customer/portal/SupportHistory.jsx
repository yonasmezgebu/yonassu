import React, { useState, useEffect } from 'react';
import { customerState } from '../../../utils/customerPortalState';
import SalesStatusBadge from '../../sales/components/SalesStatusBadge';
import { MessageSquare, User, Headphones } from 'lucide-react';

const SupportHistory = () => {
  const [tickets, setTickets] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = () => {
      setTickets(customerState.getSupportTickets());
      customerState.notify('SUPPORT_HISTORY');
    };
    load();
    return customerState.subscribe(load);
  }, []);

  const CATEGORY_LABELS = {
    order_issue: 'Order Issue',
    payment_issue: 'Payment Issue',
    delivery_issue: 'Delivery Issue',
    product_issue: 'Product Issue',
    general_inquiry: 'General Inquiry',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Support History</h1>
        <p style={{ color: '#64748b', margin: 0 }}>View all your support requests and staff replies.</p>
      </div>

      {tickets.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '48px', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <p>No support tickets yet. Need help? Contact us!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tickets.map(ticket => {
            const isOpen = expanded === ticket.id;
            return (
              <div key={ticket.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${isOpen ? '#3b82f6' : '#e2e8f0'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Ticket Header */}
                <div 
                  onClick={() => setExpanded(isOpen ? null : ticket.id)} 
                  style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>{ticket.ticket_number}</span>
                      <SalesStatusBadge status={ticket.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                      <span>📂 {CATEGORY_LABELS[ticket.subject_category] || ticket.subject_category}</span>
                      {ticket.related_order_id && <span>🔗 Order: {ticket.related_order_id}</span>}
                      <span>📅 {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {ticket.replies?.length > 0 && (
                      <span style={{ fontSize: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                        {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '18px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Thread — shown when expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 24px', backgroundColor: '#fafafa' }}>
                    {/* Original message */}
                    <ThreadMessage
                      authorType="customer"
                      message={ticket.message}
                      date={ticket.created_at}
                    />
                    {/* Replies in chronological order */}
                    {ticket.replies?.map(reply => (
                      <ThreadMessage
                        key={reply.id}
                        authorType={reply.author_type}
                        message={reply.message}
                        date={reply.created_at}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ThreadMessage = ({ authorType, message, date }) => {
  const isStaff = authorType === 'staff';
  return (
    <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexDirection: isStaff ? 'row' : 'row-reverse' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isStaff ? '#eff6ff' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isStaff ? <Headphones size={18} color="#3b82f6" /> : <User size={18} color="#10b981" />}
      </div>
      <div style={{ maxWidth: '75%' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textAlign: isStaff ? 'left' : 'right' }}>
          {isStaff ? 'Support Team' : 'You'} · {new Date(date).toLocaleString()}
        </div>
        <div style={{ padding: '14px 18px', backgroundColor: isStaff ? '#eff6ff' : 'white', border: `1px solid ${isStaff ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: isStaff ? '4px 12px 12px 12px' : '12px 4px 12px 12px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default SupportHistory;
