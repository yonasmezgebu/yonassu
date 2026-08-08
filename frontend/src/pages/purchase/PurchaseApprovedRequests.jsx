import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Clipboard, Clock, FileText, AlertTriangle,
  Plus, ChevronDown, ChevronRight, Eye, X, Send, Package,
  RefreshCw, Search, Tag, Hash, Calendar, DollarSign
} from 'lucide-react';
import apiClient from '../../services/apiClient';

// ── Status Badge ──
const StatusBadge = ({ status }) => {
  const map = {
    APPROVED_FOR_PURCHASE: { bg: '#DCFCE7', color: '#166534', text: 'Accepted' },
    IN_MARKET: { bg: '#DCFCE7', color: '#166534', text: 'Accepted' },
    TENDER_CREATED: { bg: '#DBEAFE', color: '#1e40af', text: 'Tender Created' },
    OPEN: { bg: '#CFFAFE', color: '#0e7490', text: 'Open' },
    AWARDED: { bg: '#D1FAE5', color: '#065F46', text: 'Awarded' },
    CLOSED: { bg: '#F1F5F9', color: '#475569', text: 'Closed' },
    PENDING_CEO_REVIEW: { bg: '#FEF3C7', color: '#92400E', text: 'Pending CEO' },
    CEO_REJECTED: { bg: '#FEE2E2', color: '#991B1B', text: 'CEO Rejected' },
  };
  const s = map[status] || { bg: '#F1F5F9', color: '#64748B', text: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.text}
    </span>
  );
};

// ── Create Tender Modal ──
const CreateTenderModal = ({ pr, onClose, onCreated }) => {
  const [closingDate, setClosingDate] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState(pr.estimated_total || '');
  const [terms, setTerms] = useState('Standard government pharmaceutical procurement terms apply.');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!closingDate) { setError('Closing date is required'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/procurement/tenders', {
        procurementRequestId: pr.id,
        budgetEstimate: parseFloat(budgetEstimate) || pr.estimated_total,
        openingDate: new Date().toISOString().split('T')[0],
        closingDate,
        termsAndConditions: terms,
        notes
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create tender');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clipboard size={20} /> Create Tender
            </div>
            <div style={{ fontSize: 12, color: '#a5f3fc', marginTop: 4 }}>PR: {pr.pr_no} — {pr.drug_name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white' }}>
            <X size={16} />
          </button>
        </div>

        {/* Pre-filled from approved PR */}
        <div style={{ padding: '16px 24px', background: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12 }}>
            <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Drug / Item</span><strong style={{ color: '#0e7490' }}>{pr.drug_name}</strong></div>
            <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Quantity</span><strong style={{ color: '#0e7490' }}>{pr.quantity_requested} {pr.unit_of_measure}</strong></div>
            <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>CEO Notes</span><strong style={{ color: '#0e7490', fontSize: 11 }}>{pr.ceo_notes || 'Approved'}</strong></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Budget Estimate (ETB)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="number" step="0.01"
                  value={budgetEstimate}
                  onChange={e => setBudgetEstimate(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Tender Closing Date *</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="date"
                  value={closingDate}
                  onChange={e => setClosingDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 10px 10px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Terms &amp; Conditions</label>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Special Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes for suppliers..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
            />
          </div>

          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: loading ? '#94a3b8' : '#0891b2', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
              {loading ? <><SegmentedSpinner size={14} /> Creating...</> : <><Send size={14} /> Post Tender</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Detail Modal ──
const DetailModal = ({ pr, onClose, onCreateTender }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
    <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #224f94, #1e40af)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>PR: {pr.pr_no}</div>
          <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>{pr.drug_name} — Accepted for Purchase</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Drug / Item', value: pr.drug_name },
            { label: 'Quantity', value: `${pr.quantity_requested} ${pr.unit_of_measure}` },
            { label: 'Category', value: pr.drug_category || '—' },
            { label: 'Urgency', value: pr.urgency },
            { label: 'Estimated Total', value: `${parseFloat(pr.estimated_total || 0).toFixed(2)} ETB` },
            { label: 'Requested By', value: pr.requested_by_name },
            { label: 'CEO Decision', value: pr.ceo_decision },
            { label: 'Decided At', value: pr.ceo_decided_at ? new Date(pr.ceo_decided_at).toLocaleDateString() : '—' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.value}</div>
            </div>
          ))}
        </div>
        {pr.justification && (
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid #224f94', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>Justification</div>
            <div style={{ fontSize: 13, color: '#334155' }}>{pr.justification}</div>
          </div>
        )}
        {pr.ceo_notes && (
          <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid #16a34a', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>CEO Notes</div>
            <div style={{ fontSize: 13, color: '#166534' }}>{pr.ceo_notes}</div>
          </div>
        )}
        {pr.manager_signature && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Manager Signature</div>
            <img src={pr.manager_signature} alt="Signature" style={{ height: 80, objectFit: 'contain', filter: 'contrast(1.15)' }} />
          </div>
        )}
        {(pr.status === 'APPROVED_FOR_PURCHASE' || pr.status === 'IN_MARKET') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { onClose(); onCreateTender(pr); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              <Clipboard size={16} /> Accepted — Create Tender
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Main Component ──
const PurchaseApprovedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending'); // 'pending' | 'tendered'
  const [selected, setSelected] = useState(null);
  const [createTenderFor, setCreateTenderFor] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prRes, tRes] = await Promise.all([
        apiClient.get('/procurement/approved-for-purchase'),
        apiClient.get('/procurement/tenders'),
      ]);
      setRequests(Array.isArray(prRes?.data) ? prRes.data : (prRes?.data?.data || []));
      setTenders(Array.isArray(tRes?.data) ? tRes.data : (tRes?.data?.data || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const handleTenderCreated = () => {
    setCreateTenderFor(null);
    setRefresh(r => r + 1);
  };

  const pending = requests.filter(r =>
    (r.status === 'APPROVED_FOR_PURCHASE' || r.status === 'IN_MARKET') &&
    (search === '' || r.drug_name?.toLowerCase().includes(search.toLowerCase()) || r.pr_no?.toLowerCase().includes(search.toLowerCase()))
  );

  const tenderedList = tenders.filter(t =>
    search === '' || t.drug_name?.toLowerCase().includes(search.toLowerCase()) || t.tender_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0e7490', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={28} /> Accepted Procurement Requests
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
              All requests accepted by CEO for tender creation.
            </p>
          </div>
          <button onClick={() => setRefresh(r => r + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #0891b2' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0891b2' }}>{pending.length}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Awaiting Tender Creation</div>
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{tenders.filter(t => t.status === 'OPEN').length}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Open Tenders</div>
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E8F0', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>{tenders.filter(t => t.status === 'AWARDED').length}</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Awarded Tenders</div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #E2E8F0' }}>
          {[
            { key: 'pending', label: 'Accepted Requests', icon: <Clock size={14} />, count: pending.length },
            { key: 'tendered', label: 'Tenders', icon: <Clipboard size={14} />, count: tenders.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t.key ? 700 : 500, fontSize: 13,
                background: tab === t.key ? '#0891b2' : 'transparent', color: tab === t.key ? 'white' : '#64748b' }}>
              {t.icon} {t.label}
              {t.count > 0 && <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#E2E8F0', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by drug name or PR/tender no..."
            style={{ paddingLeft: 30, padding: '9px 14px 9px 32px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', width: 280 }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <SegmentedSpinner size={32} />
          <div>Loading...</div>
        </div>
      ) : tab === 'pending' ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {pending.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle size={40} style={{ marginBottom: 12, color: '#10B981' }} />
              <div style={{ fontWeight: 600 }}>All accepted requests have been tendered!</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['PR No.', 'Drug / Item', 'Qty', 'Est. Total (ETB)', 'Urgency', 'Requested By', 'Accepted Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((pr, i) => (
                  <tr key={pr.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0891b2' }}>{pr.pr_no}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {pr.drug_name}
                      {pr.new_drug_flag === 'YES' && <span style={{ marginLeft: 6, fontSize: 10, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>NEW DRUG</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{pr.quantity_requested} {pr.unit_of_measure}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#059669' }}>{parseFloat(pr.estimated_total || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: pr.urgency === 'URGENT' ? '#FEE2E2' : '#F1F5F9', color: pr.urgency === 'URGENT' ? '#991B1B' : '#64748b' }}>
                        {pr.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{pr.requested_by_name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{pr.ceo_decided_at ? new Date(pr.ceo_decided_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelected(pr)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#F1F5F9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => setCreateTenderFor(pr)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#0891b2', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'white' }}>
                          <Plus size={12} /> Accept &amp; Create Tender
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {tenderedList.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <Clipboard size={40} style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 600 }}>No tenders created yet.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['Tender No.', 'PR No.', 'Drug / Item', 'Qty', 'Budget (ETB)', 'Closing Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenderedList.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0891b2' }}>{t.tender_no}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.pr_no}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{t.drug_name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{t.quantity} {t.unit_of_measure}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#059669' }}>{parseFloat(t.budget_estimate || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: 500 }}>{t.closing_date ? new Date(t.closing_date).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {selected && <DetailModal pr={selected} onClose={() => setSelected(null)} onCreateTender={(pr) => { setSelected(null); setCreateTenderFor(pr); }} />}
      {createTenderFor && <CreateTenderModal pr={createTenderFor} onClose={() => setCreateTenderFor(null)} onCreated={handleTenderCreated} />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PurchaseApprovedRequests;
