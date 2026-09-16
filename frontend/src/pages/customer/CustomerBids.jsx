import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import {
  FileText, Calendar, Clock, CheckCircle, XCircle, Activity,
  RefreshCw, Edit3, Save, X, ChevronDown, ChevronUp,
  ExternalLink, User, Building, Trash2, Ban, CreditCard, ShieldCheck, ShieldX, ShieldAlert
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerBids.module.css';

// ─── Status Badge helper ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = String(status).toLowerCase();
  if (['awarded', 'accepted', 'approved', 'winner'].includes(s)) {
    return <span className={`${styles.badge} ${styles.badgeSuccess}`}><CheckCircle size={12} /> {status}</span>;
  }
  if (['pending', 'under_review', 'recommended'].includes(s)) {
    return <span className={`${styles.badge} ${styles.badgeWarning}`}><Clock size={12} /> {status}</span>;
  }
  if (['not_selected', 'disqualified', 'rejected', 'cancelled'].includes(s)) {
    return <span className={`${styles.badge} ${styles.badgeError}`}><XCircle size={12} /> {status}</span>;
  }
  if (['open'].includes(s)) {
    return <span className={`${styles.badge} ${styles.badgeInfo}`}><Activity size={12} /> {status}</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeNeutral}`}>{status || 'Unknown'}</span>;
};

// ─── Payment Status Badge ─────────────────────────────────────────────────
const PaymentStatusBadge = ({ status }) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'confirmed') {
    return (
      <span className={`${styles.badge} ${styles.badgeSuccess}`} title="Finance confirmed this payment">
        <ShieldCheck size={12} /> Payment Confirmed
      </span>
    );
  }
  if (s === 'rejected') {
    return (
      <span className={`${styles.badge} ${styles.badgeError}`} title="Finance rejected this payment">
        <ShieldX size={12} /> Payment Rejected
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeWarning}`} title="Finance is reviewing this payment">
      <ShieldAlert size={12} /> Awaiting Confirmation
    </span>
  );
};

// ─── Update Form for a Public Tender Bid ───────────────────────────────────
const UpdatePublicBidForm = ({ bid, onClose, onSaved }) => {
  const [form, setForm] = useState({
    competitorName: bid.competitor_name || '',
    phone: bid.phone || '',
    deliveryTime: bid.delivery_time || '',
    paymentTerms: bid.payment_terms || '',
    items: (bid.items || []).map(it => ({
      tenderItemId: it.public_tender_item_id,
      objectType: it.object_type,
      unit: it.unit,
      tenderQty: it.tender_quantity,
      priceBirr: it.price_birr || '',
      priceCent: it.price_cent || '',
    }))
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleItemChange = (idx, field, val) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, items };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient.put(`/public-tenders/customer/bids/${bid.id}`, {
        competitorName: form.competitorName,
        phone: form.phone,
        deliveryTime: form.deliveryTime,
        paymentTerms: form.paymentTerms,
        items: form.items.map(it => ({
          tenderItemId: it.tenderItemId,
          priceBirr: parseInt(it.priceBirr) || 0,
          priceCent: parseInt(it.priceCent) || 0,
          totalBirr: (parseInt(it.priceBirr) || 0) * (it.tenderQty || 1),
          totalCent: (parseInt(it.priceCent) || 0) * (it.tenderQty || 1),
        })),
      });
      onSaved();
    } catch (e) {
      setError(e?.message || 'Failed to update bid. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Update Your Bid</h3>
            <p className={styles.modalSub}>{bid.tender_title}</p>
          </div>
          <button onClick={onClose} className={styles.btnIcon}>
            <X size={24} />
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.formGrid}>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Your Name / Company</label>
            <input className={styles.input} value={form.competitorName} onChange={e => setForm(f => ({ ...f, competitorName: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Phone</label>
            <input className={styles.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Delivery Time</label>
            <input className={styles.input} value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Payment Terms</label>
            <input className={styles.input} value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 className={styles.sectionTitle}>Item Pricing</h4>
            {form.items.map((it, idx) => (
              <div key={idx} className={styles.pricingItem}>
                <div className={styles.pricingItemTitle}>
                  {it.objectType} <span className={styles.pricingItemSub}>({it.unit} × {it.tenderQty})</span>
                </div>
                <div className={styles.pricingInputRow}>
                  <div className={styles.pricingInputCol}>
                    <label className={styles.label}>Birr</label>
                    <input className={styles.input} type="number" min="0" value={it.priceBirr} onChange={e => handleItemChange(idx, 'priceBirr', e.target.value)} />
                  </div>
                  <span className={styles.pricingDot}>.</span>
                  <div className={styles.pricingInputCol}>
                    <label className={styles.label}>Cent</label>
                    <input className={styles.input} type="number" min="0" max="99" value={it.priceCent} onChange={e => handleItemChange(idx, 'priceCent', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? <SegmentedSpinner size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Update Form for a Sale Bid (from tenders table) ────────────────────────
const UpdateSaleBidForm = ({ bid, onClose, onSaved }) => {
  const [form, setForm] = useState({
    bid_price_per_unit: bid.bid_price_per_unit || '',
    digital_signature: bid.digital_signature || '',
    notes: bid.notes || '',
    proposed_pickup_date: bid.proposed_pickup_date ? bid.proposed_pickup_date.slice(0, 10) : '',
    bidder_full_name: bid.bidder_full_name || '',
    bidder_email: bid.bidder_email || '',
    bidder_phone: bid.bidder_phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient.put(`/tenders/${bid.tender_id}/bid`, form);
      onSaved();
    } catch (e) {
      setError(e?.message || 'Failed to update bid. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Update Your Bid</h3>
            <p className={styles.modalSub}>{bid.tender_title}</p>
          </div>
          <button onClick={onClose} className={styles.btnIcon}>
            <X size={24} />
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.inputGroup}>
          <label className={styles.label}>Full Name</label>
          <input className={styles.input} value={form.bidder_full_name} onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))} />
        </div>
        
        <div className={styles.formGrid}>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={form.bidder_email} onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Phone</label>
            <input className={styles.input} type="tel" value={form.bidder_phone} onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Bid Price (ETB/unit)</label>
            <input className={styles.input} type="number" step="0.01" value={form.bid_price_per_unit} onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))} />
          </div>
          <div className={styles.inputGroup} style={{ margin: 0 }}>
            <label className={styles.label}>Proposed Pickup Date</label>
            <input className={styles.input} type="date" value={form.proposed_pickup_date} onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))} />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Notes</label>
          <textarea className={styles.input} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
          <label className={styles.label}>Digital Signature *</label>
          <input className={styles.input} required type="text" value={form.digital_signature} placeholder="Type your full name as signature" onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))} />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? <SegmentedSpinner size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Public Bid Card (General Tenders) ──────────────────────────────────────
const PublicBidCard = ({ bid, onUpdate, onHide, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const canUpdate = bid.bid_status === 'pending';

  const isAwarded = ['winner', 'awarded', 'recommended', 'accepted', 'approved'].includes(
    (bid.bid_status || '').toLowerCase()
  );
  const canCancel = !['cancelled', 'rejected', 'not_selected', 'disqualified'].includes(
    (bid.bid_status || '').toLowerCase()
  );

  return (
    <>
      {editing && (
        <UpdatePublicBidForm
          bid={bid}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdate(); }}
        />
      )}
      <div className={styles.card}>
        <div className={styles.bidHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.bidMeta}>
              <span className={styles.bidRef}>{bid.tender_number}</span>
              <span className={`${styles.badge} ${styles.badgeInfo}`}>
                {bid.tender_category === 'sell' ? 'Procurement Request' : 'Offering to Sell'}
              </span>
            </div>
            <h4 className={styles.bidTitle}>{bid.tender_title}</h4>

            <div className={styles.bidInfoRow}>
              <span className={styles.bidInfoItem}>
                <Calendar size={14} color="hsl(var(--primary))" />
                {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : '—'}
              </span>
              <span className={styles.bidInfoItem}>
                <Building size={14} color="hsl(var(--primary))" />
                {bid.competitor_name}
              </span>
            </div>
          </div>

          <div className={styles.bidActions}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
              <StatusBadge status={bid.bid_status} />
            </div>
            <div className={styles.bidActionBtns}>
              {canUpdate && (
                <button onClick={() => setEditing(true)} className={styles.btnSmall}>
                  <Edit3 size={14} /> Update Bid
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => isAwarded && onCancel(bid.id, bid.tender_title || `Bid #${bid.id}`, 'public')}
                  disabled={!isAwarded}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.375rem 0.625rem', borderRadius: 8,
                    border: '1.5px solid #e53e3e', background: 'none',
                    color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem',
                    cursor: isAwarded ? 'pointer' : 'not-allowed',
                    opacity: isAwarded ? 1 : 0.5
                  }}
                  title={isAwarded ? "Cancel this awarded bid" : "You can only cancel after being awarded"}
                >
                  <Ban size={13} /> Cancel
                </button>
              )}
              {['awarded', 'accepted', 'approved', 'winner'].includes((bid.bid_status || '').toLowerCase()) && (
                <button
                  onClick={(e) => onHide(e, bid.id)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Remove from dashboard"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className={styles.btnSmall} style={{ padding: '0.375rem 0.5rem' }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>

        {isAwarded && (
          <div style={{
            marginTop: '0.875rem', padding: '0.875rem 1rem',
            background: 'linear-gradient(135deg,#dcfce7,#f0fdf4)',
            borderRadius: 10,
            border: '1.5px solid #86efac',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <CreditCard size={18} style={{ flexShrink: 0, marginTop: 2, color: '#16a34a' }} />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Your bid was awarded</div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 2 }}>
                Congratulations! Your bid has been selected as the winning offer. A representative will contact you shortly to process your payment and finalize the contract.
              </div>
            </div>
          </div>
        )}

        {expanded && bid.items && (
          <div className={styles.bidExpanded}>
            <h5 className={styles.sectionTitle}>Bid Items</h5>
            <div className={styles.itemList}>
              {bid.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div>
                    <div className={styles.itemName}>{item.object_type}</div>
                    <div className={styles.itemQty}>Qty: {item.tender_quantity} {item.unit}</div>
                  </div>
                  <div className={styles.itemPrice}>
                    {item.price_birr?.toLocaleString()}.{String(item.price_cent || 0).padStart(2, '0')} ETB/unit
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{bid.email || bid.bidder_email || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone</span>
                <span className={styles.detailValue}>{bid.phone || bid.bidder_phone || '—'}</span>
              </div>
              {bid.delivery_time && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Delivery Time</span>
                  <span className={styles.detailValue}>{bid.delivery_time}</span>
                </div>
              )}
              {bid.payment_terms && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Payment Terms</span>
                  <span className={styles.detailValue}>{bid.payment_terms}</span>
                </div>
              )}
              {bid.payment_method && (
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                  <span className={styles.detailLabel}>Payment Method</span>
                  <span className={styles.detailValue}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bid.payment_method.toLowerCase().startsWith('internal') ? '#dcfce7' : bid.payment_method.startsWith('Telebirr') ? '#fef3c7' : '#eff6ff', color: bid.payment_method.toLowerCase().startsWith('internal') ? '#166534' : bid.payment_method.startsWith('Telebirr') ? '#92400e' : '#1d4ed8' }}>
                      {bid.payment_method.toLowerCase().startsWith('internal') ? '🛎️' : bid.payment_method.startsWith('Telebirr') ? '📱' : '🏦'} {bid.payment_method.split('::')[0]}
                    </span>
                    {bid.payment_method.includes('::') && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Ref: {bid.payment_method.split('::')[1]}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Direct Sales Bid Card ────────────────────────────────────────────────
const SalesBidCard = ({ bid, onUpdate, onHide, onCancel }) => {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const canUpdate = bid.status === 'pending' && bid.tender_status === 'open' && new Date(bid.deadline) > new Date();
  const isAwarded = ['awarded', 'accepted', 'approved', 'winner'].includes((bid.status || '').toLowerCase());
  const canCancel = !['cancelled', 'rejected', 'not_selected', 'disqualified'].includes((bid.status || '').toLowerCase());

  return (
    <>
      {editing && (
        <UpdateSaleBidForm
          bid={bid}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdate(); }}
        />
      )}
      <div className={styles.card}>
        <div className={styles.bidHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.bidMeta}>
              <span className={styles.bidRef}>{bid.reference_number}</span>
              <span className={`${styles.badge} ${styles.badgeInfo}`}>Direct Sales Event</span>
            </div>
            <h4 className={styles.bidTitle}>{bid.tender_title}</h4>
            
            <div className={styles.bidInfoRow}>
              <span className={styles.bidInfoItem}>
                <Clock size={14} color="hsl(var(--primary))" /> 
                Deadline: {new Date(bid.deadline).toLocaleDateString()}
              </span>
              <span className={styles.bidInfoItem}>
                <User size={14} color="hsl(var(--primary))" /> 
                {bid.bidder_full_name}
              </span>
            </div>
          </div>
          
          <div className={styles.bidActions}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
              <StatusBadge status={bid.status} />
              <PaymentStatusBadge status={bid.payment_status} />
            </div>
            <div className={styles.bidActionBtns}>
              {canUpdate && (
                <button onClick={() => setEditing(true)} className={styles.btnSmall}>
                  <Edit3 size={14} /> Update Bid
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => isAwarded && onCancel(bid.id, bid.tender_title || `Bid #${bid.id}`, 'sales')}
                  disabled={!isAwarded}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.375rem 0.625rem', borderRadius: 8,
                    border: '1.5px solid #e53e3e', background: 'none',
                    color: '#e53e3e', fontWeight: 600, fontSize: '0.8rem',
                    cursor: isAwarded ? 'pointer' : 'not-allowed',
                    opacity: isAwarded ? 1 : 0.5
                  }}
                  title={isAwarded ? "Cancel this awarded bid" : "You can only cancel after being awarded"}
                >
                  <Ban size={13} /> Cancel
                </button>
              )}
              {['awarded', 'accepted', 'approved'].includes((bid.status || '').toLowerCase()) && (
                <button 
                  onClick={(e) => onHide(e, bid.id)} 
                  style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                  title="Delete from dashboard"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className={styles.btnSmall} style={{ padding: '0.375rem 0.5rem' }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>

        {isAwarded && (
          <div style={{
            marginTop: '0.875rem', padding: '0.875rem 1rem',
            background: bid.payment_status === 'confirmed'
              ? 'linear-gradient(135deg,#dcfce7,#f0fdf4)'
              : bid.payment_status === 'rejected'
              ? 'linear-gradient(135deg,#fee2e2,#fff5f5)'
              : 'linear-gradient(135deg,#fef9c3,#fefce8)',
            borderRadius: 10,
            border: bid.payment_status === 'confirmed' ? '1.5px solid #86efac'
              : bid.payment_status === 'rejected' ? '1.5px solid #fca5a5'
              : '1.5px solid #fde68a',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <CreditCard size={18} style={{ flexShrink: 0, marginTop: 2, color: bid.payment_status === 'confirmed' ? '#16a34a' : bid.payment_status === 'rejected' ? '#dc2626' : '#d97706' }} />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Your bid was awarded</div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: 2 }}>
                {bid.payment_status === 'confirmed'
                  ? 'Finance confirmed your payment. Proceed to fulfil the order.'
                  : bid.payment_status === 'rejected'
                  ? 'Finance rejected your payment. Contact the finance department.'
                  : 'Finance is reviewing your payment. You will be notified once confirmed.'}
              </div>
              {bid.payment_method && (
                <div style={{ fontSize: '0.8125rem', marginTop: 4, color: '#64748b' }}>
                  <strong>Payment via:</strong> {bid.payment_method.replace('::', ' — Account ID: ')}
                </div>
              )}
            </div>
          </div>
        )}

        {expanded && (
          <div className={styles.bidExpanded}>
            <div className={styles.priceBox}>
              <div>
                <div className={styles.priceBoxLabel}>My Proposed Price</div>
                <div className={styles.priceBoxSub}>Total Value: {parseFloat(bid.total_bid_value || 0).toLocaleString()} ETB</div>
              </div>
              <div className={styles.priceBoxValue}>
                {parseFloat(bid.bid_price_per_unit || 0).toLocaleString()} <span className={styles.priceBoxUnit}>ETB/unit</span>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{bid.bidder_email || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone</span>
                <span className={styles.detailValue}>{bid.bidder_phone || '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Submitted On</span>
                <span className={styles.detailValue}>{bid.submitted_at ? new Date(bid.submitted_at).toLocaleString() : '—'}</span>
              </div>
              {bid.payment_method && (
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                  <span className={styles.detailLabel}>Payment Method</span>
                  <span className={styles.detailValue}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bid.payment_method.toLowerCase().startsWith('internal') ? '#dcfce7' : bid.payment_method.startsWith('Telebirr') ? '#fef3c7' : '#eff6ff', color: bid.payment_method.toLowerCase().startsWith('internal') ? '#166534' : bid.payment_method.startsWith('Telebirr') ? '#92400e' : '#1d4ed8' }}>
                      {bid.payment_method.toLowerCase().startsWith('internal') ? '🛎️' : bid.payment_method.startsWith('Telebirr') ? '📱' : '🏦'} {bid.payment_method.split('::')[0]}
                    </span>
                    {bid.payment_method.includes('::') && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>Ref: {bid.payment_method.split('::')[1]}</span>}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.actionRow}>
              <button className={styles.btnSecondary} onClick={() => navigate(`/tenders/${bid.tender_id || bid.id}`)}>
                <ExternalLink size={16} /> View Original Tender Details
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Main CustomerBids component ───────────────────────────────────────────
export default function CustomerBids() {
  const navigate = useNavigate();
  const [publicBids, setPublicBids] = useState([]);
  const [salesBids, setSalesBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label, type }
  const [confirmCancel, setConfirmCancel] = useState(null); // { id, label }
  const [cancelling, setCancelling] = useState(false);

  const handleHideBid = (e, id, type, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, type, label });
  };

  const handleCancelBid = (id, label, type = 'public') => {
    setConfirmCancel({ id, label, type });
  };

  const confirmCancelBid = async () => {
    if (!confirmCancel) return;
    setCancelling(true);
    try {
      if (confirmCancel.type === 'public') {
        await apiClient.put(`/public-tenders/customer/bids/${confirmCancel.id}/cancel`);
        setPublicBids(prev => prev.map(b => b.id === confirmCancel.id
          ? { ...b, bid_status: 'cancelled', customer_cancelled: true }
          : b
        ));
      } else {
        await apiClient.put(`/tenders/my-bids/${confirmCancel.id}/cancel`);
        setSalesBids(prev => prev.map(b => b.id === confirmCancel.id
          ? { ...b, status: 'cancelled', customer_cancelled: true }
          : b
        ));
      }
      setSuccessMessage('Bid cancelled successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel bid');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setCancelling(false);
      setConfirmCancel(null);
    }
  };

  const confirmHideBid = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;
    setConfirmDelete(null);
    try {
      if (type === 'public') {
        await apiClient.delete(`/public-tenders/customer/bids/${id}/hide`);
        setPublicBids(prev => prev.filter(b => b.id !== id));
      } else {
        await apiClient.delete(`/tenders/my-bids/${id}/hide`);
        setSalesBids(prev => prev.filter(b => b.id !== id));
      }
      setSuccessMessage('Bid removed successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove bid');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleBidUpdated = () => {
    fetchBids();
    setSuccessMessage('Bid updated successfully!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const fetchBids = useCallback(async () => {
    setLoading(true);
    try {
      const [pubRes, salesRes] = await Promise.allSettled([
        apiClient.get('/public-tenders/customer/bids'),
        apiClient.get('/tenders/my-bids'),
      ]);
      if (pubRes.status === 'fulfilled' && pubRes.value?.status === 'success') {
        setPublicBids(pubRes.value.data || []);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value?.status === 'success') {
        setSalesBids(salesRes.value.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  const total = publicBids.length + salesBids.length;
  const tabs = [
    { key: 'all',    label: 'All Bids',    count: total },
    { key: 'public', label: 'Compete & Sell Bids', count: publicBids.length },
    { key: 'sales',  label: 'Compete & Buy Bids', count: salesBids.length },
  ];

  const showPublic = activeTab === 'all' || activeTab === 'public';
  const showSales  = activeTab === 'all' || activeTab === 'sales';

  return (
    <>
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.wrap}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>My Tender Bids</h2>
            <p className={styles.subTitle}>Manage your bids for public and direct tenders</p>
          </div>
          <button onClick={fetchBids} className={styles.btnSecondary} disabled={loading}>
            <SegmentedSpinner size={16} />
            {loading ? 'Syncing...' : 'Refresh Data'}
          </button>
        </div>

        {successMessage && (
          <div className={styles.toast}>
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} <span className={styles.tabCount}>({t.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <SegmentedSpinner size={32} />
            <div className={styles.loadingText}>Loading your bids...</div>
          </div>
        ) : total === 0 ? (
          <div className={styles.empty}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No bids found</h3>
            <p className={styles.emptyDesc}>You haven't placed any bids yet. Browse our active tenders to get started.</p>
            
            <div className={styles.emptyActions}>
              <button className={styles.btnPrimary} onClick={() => navigate('/tenders/smart-bids')}>
                Compete & Sell
              </button>
              <button className={styles.btnSecondary} onClick={() => navigate('/tenders/buy')}>
                Compete & Buy
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Section: Compete & Sell Bids */}
            {showPublic && publicBids.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                {activeTab === 'all' && <h3 className={styles.sectionTitle} style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Compete & Sell Bids</h3>}
                {publicBids.map(b => <PublicBidCard key={`pub-${b.id}`} bid={b} onUpdate={handleBidUpdated} onCancel={handleCancelBid} onHide={(e, id) => handleHideBid(e, id, 'public', b.item_name || `Bid #${b.id}`)} />)}
              </div>
            )}

            {/* Section: Compete & Buy Bids */}
            {showSales && salesBids.length > 0 && (
              <div>
                {activeTab === 'all' && <h3 className={styles.sectionTitle} style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Compete & Buy Bids</h3>}
                {salesBids.map(b => <SalesBidCard key={`sale-${b.id}`} bid={b} onUpdate={handleBidUpdated} onHide={(e, id) => handleHideBid(e, id, 'sales', b.tender_title || b.item_name || `Bid #${b.id}`)} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ── In-app confirmation dialog for HIDE ── */}
    {confirmDelete && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🗑️</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Remove Bid?</h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
            <strong>{confirmDelete.label}</strong> will be removed from your dashboard.<br />
            This only hides it for you — the tender records remain intact.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setConfirmDelete(null)}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmHideBid}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Cancel Bid confirmation dialog ── */}
    {confirmCancel && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Cancel This Bid?</h3>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
            Are you sure you want to cancel your bid for <strong>{confirmCancel.label}</strong>?<br />
            This action cannot be undone and the bid will be marked as <strong>cancelled</strong>.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setConfirmCancel(null)}
              disabled={cancelling}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Keep Bid
            </button>
            <button
              onClick={confirmCancelBid}
              disabled={cancelling}
              style={{ padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {cancelling ? <SegmentedSpinner size={16} /> : <Ban size={16} />}
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Bid'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
