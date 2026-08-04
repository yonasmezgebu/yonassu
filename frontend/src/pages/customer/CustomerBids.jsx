import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import {
  FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Edit3, Save, X, ChevronDown, ChevronUp, Award, Package,
  ShoppingBag, Loader2, ExternalLink, User, Phone, Mail, Truck, CreditCard,
  Building
} from 'lucide-react';

/* ─── shared CSS ──────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .cp-page {
    padding: 32px;
    background: #F5F5F5;
    min-height: calc(100vh - 60px);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #424242;
  }
  @media (max-width: 720px) { .cp-page { padding: 16px; } }

  .cp-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
  .cp-title { font-size: 2.2rem; font-weight: 800; color: #1B5E20; margin: 0; letter-spacing: -0.02em; }
  .cp-sub { font-size: 1rem; color: #6B8E23; margin: 4px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  .cp-card {
    background: #FFFFFF;
    border: 1px solid #8D6E63;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    transition: all 0.15s ease;
  }
  .cp-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

  .cp-btn-primary { background: #2E8B57; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .cp-btn-primary:hover:not(:disabled) { background: #246e45; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(46,139,87,0.2); }
  .cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .cp-btn-secondary { background: #FFFFFF; color: #6B8E23; border: 1px solid #6B8E23; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.15s ease; }
  .cp-btn-secondary:hover:not(:disabled) { background: #F5F5F5; transform: translateY(-1px); }
  .cp-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

  .cp-btn-small { background: #FFFFFF; color: #1B5E20; border: 1px solid #1B5E20; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease; }
  .cp-btn-small:hover { background: #F5F5F5; transform: translateY(-1px); }

  .cp-badge { padding: 4px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; }
  .cp-badge-success { background: #E8F5E9; color: #4CAF50; border: 1px solid #4CAF50; }
  .cp-badge-warning { background: #FFF3E0; color: #FF9800; border: 1px solid #FF9800; }
  .cp-badge-error { background: #FFEBEE; color: #F44336; border: 1px solid #F44336; }
  .cp-badge-info { background: #E3F2FD; color: #2196F3; border: 1px solid #2196F3; }
  .cp-badge-neutral { background: #F5F5F5; color: #757575; border: 1px solid #BDBDBD; }

  .cp-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .cp-tab { padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: all 0.15s ease; font-size: 0.95rem; }
  .cp-tab.active { background: #2E8B57; color: #FFFFFF; }
  .cp-tab:not(.active) { background: #FFFFFF; color: #424242; border-color: #8D6E63; }
  .cp-tab:not(.active):hover { background: #F5F5F5; }

  /* Form Elements */
  .cp-input-group { margin-bottom: 16px; }
  .cp-label { display: block; font-size: 0.85rem; font-weight: 700; color: #424242; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .cp-input { width: 100%; padding: 10px 12px; border: 1px solid #8D6E63; border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 0.95rem; box-sizing: border-box; background: #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: all 0.15s ease; }
  .cp-input:focus { outline: none; border-color: #2E8B57; box-shadow: 0 0 0 3px rgba(46,139,87,0.15); }

  .cp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .cp-modal { background: #FFFFFF; border-radius: 14px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
  .cp-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .cp-modal-title { font-size: 1.5rem; font-weight: 800; color: #1B5E20; margin: 0; }

  .cp-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E0E0E0; }
  .cp-detail-item { display: flex; flex-direction: column; gap: 4px; }
  .cp-detail-label { font-size: 0.75rem; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.05em; }
  .cp-detail-value { font-size: 0.95rem; font-weight: 600; color: #424242; }

  .cp-toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 10px; background: #E8F5E9; color: #4CAF50; border: 1px solid #4CAF50; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 2000; display: flex; align-items: center; gap: 8px; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .cp-spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;

// ─── Status Badge helper ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = String(status).toLowerCase();
  if (['awarded', 'accepted', 'approved'].includes(s)) {
    return <span className="cp-badge cp-badge-success"><CheckCircle size={12} /> {status}</span>;
  }
  if (['pending', 'under_review'].includes(s)) {
    return <span className="cp-badge cp-badge-warning"><Clock size={12} /> {status}</span>;
  }
  if (['not_selected', 'disqualified', 'rejected'].includes(s)) {
    return <span className="cp-badge cp-badge-error"><XCircle size={12} /> {status}</span>;
  }
  if (['open'].includes(s)) {
    return <span className="cp-badge cp-badge-info"><Activity size={12} /> {status}</span>;
  }
  return <span className="cp-badge cp-badge-neutral">{status || 'Unknown'}</span>;
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
    <div className="cp-modal-overlay">
      <div className="cp-modal">
        <div className="cp-modal-header">
          <div>
            <h3 className="cp-modal-title">Update Your Bid</h3>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: '0.9rem' }}>{bid.tender_title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#757575' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#F44336', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Your Name / Company</label>
            <input className="cp-input" value={form.competitorName} onChange={e => setForm(f => ({ ...f, competitorName: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Phone</label>
            <input className="cp-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Delivery Time</label>
            <input className="cp-input" value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Payment Terms</label>
            <input className="cp-input" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
        </div>

        {form.items.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#1B5E20' }}>Item Pricing</h4>
            {form.items.map((it, idx) => (
              <div key={idx} style={{ background: '#F5F5F5', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #E0E0E0' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>{it.objectType} <span style={{ fontWeight: 400, color: '#757575' }}>({it.unit} × {it.tenderQty})</span></div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label className="cp-label">Birr</label>
                    <input className="cp-input" type="number" min="0" value={it.priceBirr} onChange={e => handleItemChange(idx, 'priceBirr', e.target.value)} />
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#BDBDBD', marginTop: '16px' }}>.</span>
                  <div style={{ flex: 1 }}>
                    <label className="cp-label">Cent</label>
                    <input className="cp-input" type="number" min="0" max="99" value={it.priceCent} onChange={e => handleItemChange(idx, 'priceCent', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="cp-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="cp-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className="cp-spin" /> : <Save size={18} />}
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
    <div className="cp-modal-overlay">
      <div className="cp-modal">
        <div className="cp-modal-header">
          <div>
            <h3 className="cp-modal-title">Update Your Bid</h3>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: '0.9rem' }}>{bid.tender_title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#757575' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#F44336', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="cp-input-group">
          <label className="cp-label">Full Name</label>
          <input className="cp-input" value={form.bidder_full_name} onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Email</label>
            <input className="cp-input" type="email" value={form.bidder_email} onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Phone</label>
            <input className="cp-input" type="tel" value={form.bidder_phone} onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Bid Price (ETB/unit)</label>
            <input className="cp-input" type="number" step="0.01" value={form.bid_price_per_unit} onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))} />
          </div>
          <div className="cp-input-group" style={{ margin: 0 }}>
            <label className="cp-label">Proposed Pickup Date</label>
            <input className="cp-input" type="date" value={form.proposed_pickup_date} onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))} />
          </div>
        </div>

        <div className="cp-input-group">
          <label className="cp-label">Notes</label>
          <textarea className="cp-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="cp-input-group" style={{ marginBottom: '24px' }}>
          <label className="cp-label">Digital Signature *</label>
          <input className="cp-input" required type="text" value={form.digital_signature} placeholder="Type your full name as signature" onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="cp-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="cp-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className="cp-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Public Bid Card (General Tenders) ──────────────────────────────────────
const PublicBidCard = ({ bid, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const canUpdate = bid.bid_status === 'pending';

  return (
    <>
      {editing && (
        <UpdatePublicBidForm
          bid={bid}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdate(); }}
        />
      )}
      <div className="cp-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#757575', fontFamily: 'monospace' }}>{bid.tender_number}</span>
              <span className="cp-badge cp-badge-info">{bid.tender_category === 'sell' ? 'Procurement Request' : 'Offering to Sell'}</span>
            </div>
            <h4 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>{bid.tender_title}</h4>
            
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#424242', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#2E8B57" /> {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : '—'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={14} color="#2E8B57" /> {bid.competitor_name}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <StatusBadge status={bid.bid_status} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {canUpdate && (
                <button onClick={() => setEditing(true)} className="cp-btn-small">
                  <Edit3 size={14} /> Update Bid
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className="cp-btn-small" style={{ padding: '6px 8px' }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>

        {expanded && bid.items && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E0E0E0' }}>
            <h5 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1B5E20' }}>Bid Items</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bid.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F5F5F5', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#424242' }}>{item.object_type}</div>
                    <div style={{ fontSize: '0.85rem', color: '#757575' }}>Qty: {item.tender_quantity} {item.unit}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#2E8B57' }}>
                    {item.price_birr?.toLocaleString()}.{String(item.price_cent || 0).padStart(2, '0')} ETB/unit
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cp-detail-grid">
              {bid.delivery_time && (
                <div className="cp-detail-item">
                  <span className="cp-detail-label">Delivery Time</span>
                  <span className="cp-detail-value">{bid.delivery_time}</span>
                </div>
              )}
              {bid.payment_terms && (
                <div className="cp-detail-item">
                  <span className="cp-detail-label">Payment Terms</span>
                  <span className="cp-detail-value">{bid.payment_terms}</span>
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
const SalesBidCard = ({ bid, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const canUpdate = bid.status === 'pending' && bid.tender_status === 'open' && new Date(bid.deadline) > new Date();

  return (
    <>
      {editing && (
        <UpdateSaleBidForm
          bid={bid}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdate(); }}
        />
      )}
      <div className="cp-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#757575', fontFamily: 'monospace' }}>{bid.reference_number}</span>
              <span className="cp-badge cp-badge-info">Direct Sales Event</span>
            </div>
            <h4 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>{bid.tender_title}</h4>
            
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#424242', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} color="#2E8B57" /> Deadline: {new Date(bid.deadline).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="#2E8B57" /> {bid.bidder_full_name}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <StatusBadge status={bid.status} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {canUpdate && (
                <button onClick={() => setEditing(true)} className="cp-btn-small">
                  <Edit3 size={14} /> Update Bid
                </button>
              )}
              <button onClick={() => setExpanded(!expanded)} className="cp-btn-small" style={{ padding: '6px 8px' }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#E8F5E9', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1B5E20' }}>My Proposed Price</div>
                <div style={{ fontSize: '0.85rem', color: '#2E8B57' }}>Total Value: {parseFloat(bid.total_bid_value || 0).toLocaleString()} ETB</div>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20' }}>
                {parseFloat(bid.bid_price_per_unit || 0).toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ETB/unit</span>
              </div>
            </div>

            <div className="cp-detail-grid">
              <div className="cp-detail-item">
                <span className="cp-detail-label">Email</span>
                <span className="cp-detail-value">{bid.bidder_email || '—'}</span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Phone</span>
                <span className="cp-detail-value">{bid.bidder_phone || '—'}</span>
              </div>
              <div className="cp-detail-item">
                <span className="cp-detail-label">Submitted On</span>
                <span className="cp-detail-value">{bid.submitted_at ? new Date(bid.submitted_at).toLocaleString() : '—'}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
              <button className="cp-btn-secondary" onClick={() => navigate(`/tenders/${bid.tender_id || bid.id}`)}>
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
    <div className="cp-page">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="cp-header-row">
        <div>
          <h2 className="cp-title">My Tender Bids</h2>
          <p className="cp-sub">Manage your bids for public and direct tenders</p>
        </div>
        <button onClick={fetchBids} className="cp-btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'cp-spin' : ''} />
          {loading ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {successMessage && (
        <div className="cp-toast">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="cp-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`cp-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#757575' }}>
          <Loader2 size={32} className="cp-spin" style={{ marginBottom: '16px' }} />
          <div style={{ fontWeight: 600 }}>Loading your bids...</div>
        </div>
      ) : total === 0 ? (
        <div className="cp-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} color="#BDBDBD" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#424242' }}>No bids found</h3>
          <p style={{ margin: '0 0 24px', color: '#757575' }}>You haven't placed any bids yet. Browse our active tenders to get started.</p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* 
                Re-named empty state buttons to match the public drop-down exactly.
                /tenders/smart-bids -> "Compete & Sell"
                /tenders/buy -> "Compete & Buy"
             */}
            <button className="cp-btn-primary" onClick={() => navigate('/tenders/smart-bids')}>
              Compete & Sell
            </button>
            <button className="cp-btn-secondary" onClick={() => navigate('/tenders/buy')}>
              Compete & Buy
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Section: Compete & Sell Bids */}
          {showPublic && publicBids.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              {activeTab === 'all' && <h3 style={{ fontSize: '1.1rem', color: '#1B5E20', margin: '0 0 16px' }}>Compete & Sell Bids</h3>}
              {publicBids.map(b => <PublicBidCard key={`pub-${b.id}`} bid={b} onUpdate={handleBidUpdated} />)}
            </div>
          )}

          {/* Section: Compete & Buy Bids */}
          {showSales && salesBids.length > 0 && (
            <div>
              {activeTab === 'all' && <h3 style={{ fontSize: '1.1rem', color: '#1B5E20', margin: '0 0 16px' }}>Compete & Buy Bids</h3>}
              {salesBids.map(b => <SalesBidCard key={`sale-${b.id}`} bid={b} onUpdate={handleBidUpdated} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
