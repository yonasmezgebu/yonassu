import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import {
  FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Edit3, Save, X, ChevronDown, ChevronUp, Award, Package,
  ShoppingBag, Loader2, ExternalLink, User, Phone, Mail, Truck, CreditCard
} from 'lucide-react';

// ─── Status badge styles ────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:       { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  under_review:  { bg: '#dbeafe', color: '#1e40af', label: 'Under Review' },
  awarded:       { bg: '#d1fae5', color: '#065f46', label: '🏆 Awarded' },
  not_selected:  { bg: '#fee2e2', color: '#991b1b', label: 'Not Selected' },
  disqualified:  { bg: '#f1f5f9', color: '#64748b', label: 'Disqualified' },
  open:          { bg: '#ede9fe', color: '#5b21b6', label: 'Open' },
  closed:        { bg: '#f1f5f9', color: '#64748b', label: 'Closed' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { bg: '#f1f5f9', color: '#64748b', label: status || 'Unknown' };
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      textTransform: 'capitalize', background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>{s.label}</span>
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px', overflowY: 'auto',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '28px', width: '100%',
        maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Update My Bid</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{bid.tender_title}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
            <X size={16} color="#475569" />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Contact fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Your Name</label>
            <input value={form.competitorName} onChange={e => setForm(f => ({ ...f, competitorName: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Delivery Time</label>
            <input value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Terms</label>
            <input value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Item prices */}
        {form.items.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Item Prices
            </label>
            {form.items.map((it, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                  {it.objectType} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({it.unit} × {it.tenderQty})</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Birr</label>
                    <input type="number" min="0" value={it.priceBirr}
                      onChange={e => handleItemChange(idx, 'priceBirr', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 13, paddingTop: 18 }}>.</span>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Cent</label>
                    <input type="number" min="0" max="99" value={it.priceCent}
                      onChange={e => handleItemChange(idx, 'priceCent', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ paddingTop: 18, fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>ETB</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#059669', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Public Bid Card ────────────────────────────────────────────────────────
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
      <div style={{
        background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
        overflow: 'hidden', transition: 'box-shadow 0.15s',
      }}>
        {/* Card header */}
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                background: '#ede9fe', color: '#5b21b6', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5
              }}>
                {bid.tender_category === 'sell' ? '🛒 Buy Tender' : '📦 Sell Tender'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{bid.tender_number}</span>
            </div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{bid.tender_title}</h4>
            <div style={{ marginTop: 4, display: 'flex', gap: 14, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={12} /> {bid.competitor_name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} /> {bid.phone}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <StatusBadge status={bid.bid_status} />
            {canUpdate && (
              <button onClick={() => setEditing(true)} style={{
                padding: '6px 12px', border: '1.5px solid #059669', borderRadius: 8, background: 'white',
                color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Edit3 size={12} /> Update Bid
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} style={{
              padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && bid.items && bid.items.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 18px', background: '#fafafa' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              My Bid Items
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bid.items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8,
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.object_type}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>{item.unit} × {item.tender_quantity}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                    {item.price_birr?.toLocaleString()}.{String(item.price_cent || 0).padStart(2, '0')} ETB/unit
                  </div>
                </div>
              ))}
            </div>
            {(bid.delivery_time || bid.payment_terms) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                {bid.delivery_time && <span><Truck size={12} style={{ verticalAlign: 'middle' }} /> {bid.delivery_time}</span>}
                {bid.payment_terms && <span><CreditCard size={12} style={{ verticalAlign: 'middle' }} /> {bid.payment_terms}</span>}
              </div>
            )}
          </div>
        )}

        {/* Status messages */}
        {bid.bid_status === 'awarded' && (
          <div style={{ padding: '10px 18px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} /> 🎉 Congratulations! Your bid was selected for this tender.
          </div>
        )}
        {bid.bid_status === 'not_selected' && (
          <div style={{ padding: '10px 18px', background: '#fef2f2', borderTop: '1px solid #fecaca', fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={14} /> Your bid was not selected for this tender.
          </div>
        )}
      </div>
    </>
  );
};

// ─── Sales Bid Card (from tenders table) ───────────────────────────────────
const SalesBidCard = ({ bid }) => {
  const navigate = useNavigate();
  const st = STATUS_MAP[bid.status] || { bg: '#f1f5f9', color: '#64748b', label: bid.status };

  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '14px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s',
    }}
      onClick={() => navigate(`/tenders/${bid.tender_id || bid.id}`)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5
            }}>🏷️ Sale Bid</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{bid.reference_number}</span>
          </div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{bid.tender_title}</h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
          <ExternalLink size={14} color="#94a3b8" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, fontSize: 13, flexWrap: 'wrap' }}>
        <span style={{ color: '#059669', fontWeight: 700 }}>
          {parseFloat(bid.bid_price_per_unit || 0).toLocaleString()} ETB/unit × {bid.quantity_requested}
        </span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>
          Total: {parseFloat(bid.total_bid_value || 0).toLocaleString()} ETB
        </span>
        {bid.deadline && (
          <span style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} /> Deadline: {new Date(bid.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      {bid.status === 'awarded' && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={14} /> 🎉 Your bid was selected!
        </div>
      )}
    </div>
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
    setSuccessMessage('✅ Bid updated successfully!');
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
    { key: 'public', label: '📦 Sell / Buy Tenders', count: publicBids.length },
    { key: 'sales',  label: '🏷️ Sale Bids', count: salesBids.length },
  ];

  const showPublic = activeTab === 'all' || activeTab === 'public';
  const showSales  = activeTab === 'all' || activeTab === 'sales';

  return (
    <div style={{ padding: '0 24px' }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>My Tender Bids</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Track, view and update all your bids</p>
        </div>
        <button onClick={fetchBids} title="Refresh" style={{
          padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 600,
        }}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #10b981', color: '#047857',
          padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.3s ease'
        }}>
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: activeTab === t.key ? '2px solid #059669' : '1.5px solid #e2e8f0',
            background: activeTab === t.key ? '#f0fdf4' : 'white',
            color: activeTab === t.key ? '#059669' : '#475569',
          }}>
            {t.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: 14 }}>
          <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
          <div>Loading your bids...</div>
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <FileText size={44} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#475569' }}>No bids yet</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>Browse available tenders and place your first bid.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/smart-tenders')} style={{
              padding: '9px 18px', background: '#059669', color: 'white', border: 'none',
              borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Browse Sell Tenders</button>
            <button onClick={() => navigate('/buy-tenders')} style={{
              padding: '9px 18px', background: '#3b82f6', color: 'white', border: 'none',
              borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Browse Buy Tenders</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Section: Public Bids (Buy/Sell tenders from public_bids) */}
          {showPublic && publicBids.length > 0 && (
            <>
              {activeTab === 'all' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, padding: '4px 0 6px' }}>
                  📦 Sell / Buy Tender Bids
                </div>
              )}
              {publicBids.map(b => (
                <PublicBidCard key={`pub-${b.id}`} bid={b} onUpdate={handleBidUpdated} />
              ))}
            </>
          )}

          {/* Section: Sales Bids (from tenders table) */}
          {showSales && salesBids.length > 0 && (
            <>
              {activeTab === 'all' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, padding: '12px 0 6px' }}>
                  🏷️ Sale Bids
                </div>
              )}
              {salesBids.map(b => (
                <SalesBidCard key={`sale-${b.id}`} bid={b} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
