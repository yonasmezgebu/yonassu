import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = '/api/v1/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Tab = ({ label, active, onClick, badge }) => (
  <button onClick={onClick}
    className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${active ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {label}
    {badge > 0 && (
      <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </button>
);

const statusBadge = (status) => {
  const map = {
    PENDING_DECISION: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    WAIT: 'bg-blue-100 text-blue-700',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    OPEN: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-orange-100 text-orange-700',
    AWARDED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export default function CEOPurchaseFlowDashboard({ user }) {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);

  const fetchAll = async () => {
    try {
      const [rRes, tRes, fRes] = await Promise.all([
        axios.get(`${API}/purchase-requests`, token()),
        axios.get(`${API}/tenders`, token()),
        axios.get(`${API}/fund-requests`, token()),
      ]);
      setRequests(rRes.data.data || []);
      setTenders(tRes.data.data || []);
      setFundRequests(fRes.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchBids = async (tenderId) => {
    setSelectedTender(tenderId);
    const res = await axios.get(`${API}/tenders/${tenderId}/bids`, token());
    setBids(res.data.data || []);
  };

  useEffect(() => {
    fetchAll();
    window.addEventListener('new-notification', fetchAll);
    return () => window.removeEventListener('new-notification', fetchAll);
  }, []);

  const decideRequest = async (id, decision) => {
    let body = { decision };
    if (decision === 'REJECT') {
      body.reason = prompt('Mandatory: Enter rejection reason:');
      if (!body.reason) return;
    }
    if (decision === 'WAIT') {
      body.wait_instructions = prompt('Mandatory: Enter research instructions for Market Team:');
      if (!body.wait_instructions) return;
      body.wait_document_url = prompt('Mandatory: Enter document URL:') || 'https://placeholder.doc';
    }
    setLoading(true);
    try {
      await axios.patch(`${API}/purchase-requests/${id}/decision`, body, token());
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const awardTender = async (tenderId, bidId) => {
    const lowestBid = bids[0];
    let body = { bid_id: bidId };
    if (bidId !== lowestBid?.id) {
      body.override_reason = prompt('Mandatory: Why are you selecting a non-lowest bid?');
      if (!body.override_reason) return;
    }
    setLoading(true);
    try {
      await axios.patch(`${API}/tenders/${tenderId}/award`, body, token());
      setSelectedTender(null);
      setBids([]);
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const cancelTender = async (tenderId) => {
    const reason = prompt('Mandatory: Reason for cancelling all bids?');
    if (!reason) return;
    try {
      await axios.patch(`${API}/tenders/${tenderId}/cancel`, { reason }, token());
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  const decideFundRequest = async (id, decision) => {
    let body = { decision };
    if (decision === 'REJECTED') {
      body.reason = prompt('Mandatory: Rejection reason?');
      if (!body.reason) return;
    }
    setLoading(true);
    try {
      await axios.patch(`${API}/fund-requests/${id}/decision`, body, token());
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING_DECISION');
  const closedTenders = tenders.filter(t => t.status === 'CLOSED');
  const pendingFunds = fundRequests.filter(f => f.status === 'PENDING_APPROVAL');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CEO Purchase Flow Dashboard</h1>
        <div className="flex flex-wrap gap-3 mt-3 text-sm">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">{pendingRequests.length} Pending Decisions</span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">{closedTenders.length} Tenders to Award</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">{pendingFunds.length} Fund Requests</span>
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-medium">
            🆕 {requests.filter(r => r.is_new_drug && r.status === 'PENDING_DECISION').length} New Drug Approvals
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-2">
        <Tab label="Purchase Requests" active={tab === 'requests'} onClick={() => setTab('requests')} badge={pendingRequests.length} />
        <Tab label="Tender Awards" active={tab === 'tenders'} onClick={() => setTab('tenders')} badge={closedTenders.length} />
        <Tab label="Fund Requests" active={tab === 'fund-requests'} onClick={() => setTab('fund-requests')} badge={pendingFunds.length} />
      </div>

      {/* ── Tab: Purchase Requests ── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {requests.map(r => (
            <div
              key={r.id}
              className={`bg-white rounded-xl shadow border-l-4 transition ${r.is_new_drug ? 'border-purple-500' : 'border-blue-500'}`}
            >
              {/* Summary row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedRequest(expandedRequest === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {r.is_new_drug && (
                    <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">🆕 NEW DRUG</span>
                  )}
                  <span className="font-mono text-xs text-gray-500">{r.request_code}</span>
                  <span className="font-semibold text-gray-800">
                    {r.is_new_drug ? `${r.new_drug_name} ${r.new_drug_strength}` : (r.drug_name || `Drug #${r.drug_id}`)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
                  <span className="text-xs text-gray-400">Qty: {r.requested_qty}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${r.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : r.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {r.urgency}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">{expandedRequest === r.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded detail */}
              {expandedRequest === r.id && (
                <div className="border-t px-6 py-5 bg-gray-50 space-y-4">
                  {r.is_new_drug ? (
                    /* Flow 3 detail view — no stock history to show */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 md:col-span-2">
                        <div className="text-xs font-bold text-amber-700 mb-1">⚠ NEW DRUG — No Stock History</div>
                        <div className="text-sm text-amber-800">
                          This drug does not exist in Store or Pharmacy inventory. Approval will activate it as a new catalog entry.
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Drug Name</div>
                        <div className="font-semibold text-gray-800">{r.new_drug_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Strength</div>
                        <div className="font-semibold text-gray-800">{r.new_drug_strength}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Category</div>
                        <div className="text-gray-700">{r.new_drug_category || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Classification</div>
                        <div className="text-gray-700">{r.new_drug_classification || '—'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Therapeutic Use</div>
                        <div className="text-gray-700">{r.new_drug_therapeutic_use || '—'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Purpose / Reasoning</div>
                        <div className="text-gray-800 bg-white border rounded-lg p-3 text-sm">{r.purpose_reason || '—'}</div>
                      </div>
                    </div>
                  ) : (
                    /* Flow 2 detail view — show inventory snapshot */
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Store Qty</div>
                        <div className="text-2xl font-bold text-red-700">{r.store_qty_at_request ?? '—'}</div>
                        <div className="text-xs text-red-500 mt-1">Min level: {r.store_min_level ?? '—'}</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">Pharmacy Qty</div>
                        <div className="text-2xl font-bold text-yellow-700">{r.pharmacy_qty_at_request ?? '—'}</div>
                        <div className="text-xs text-yellow-500 mt-1">Reorder level: {r.pharmacy_reorder_level ?? '—'}</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Requested Qty</div>
                        <div className="text-2xl font-bold text-blue-700">{r.requested_qty}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Scenario</div>
                        <div className="text-sm font-semibold text-gray-700">{r.scenario?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {r.status === 'PENDING_DECISION' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => decideRequest(r.id, 'APPROVE')} disabled={loading}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-700 transition font-medium disabled:opacity-60"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => decideRequest(r.id, 'REJECT')} disabled={loading}
                        className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-red-700 transition font-medium disabled:opacity-60"
                      >
                        ❌ Reject
                      </button>
                      {!r.is_new_drug && (
                        <button
                          onClick={() => decideRequest(r.id, 'WAIT')} disabled={loading}
                          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-medium disabled:opacity-60"
                        >
                          ⏳ Wait (Market Research)
                        </button>
                      )}
                    </div>
                  )}
                  {r.decision_reason && (
                    <div className="text-sm text-gray-500 pt-1">
                      <strong>Reason:</strong> {r.decision_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">No purchase requests yet.</div>
          )}
        </div>
      )}

      {/* ── Tab: Tender Awards ── */}
      {tab === 'tenders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{['Tender Code', 'Drug', 'Type', 'Qty', 'Delivery', 'Closing', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {tenders.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.tender_code}</td>
                    <td className="px-4 py-3">
                      {t.is_new_drug && <span className="mr-1 text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">NEW</span>}
                      {t.drug_name || `Drug #${t.drug_id}`}
                    </td>
                    <td className="px-4 py-3 text-xs">{t.request_code}</td>
                    <td className="px-4 py-3">{t.quantity}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{t.delivery_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(t.closing_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'CLOSED' && (
                        <div className="flex gap-2">
                          <button onClick={() => fetchBids(t.id)} className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition">View Bids</button>
                          <button onClick={() => cancelTender(t.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition">Reject All</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {tenders.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No tenders yet.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Bid decision panel */}
          {selectedTender && bids.length > 0 && (
            <div className="bg-white rounded-xl shadow border-t-4 border-purple-500 p-6">
              <h3 className="font-bold text-gray-800 mb-1">Bids — Sorted Lowest to Highest Cost</h3>
              <p className="text-xs text-gray-500 mb-4">The lowest valid bid is highlighted. Selecting a higher bid requires a written override reason.</p>
              <div className="space-y-3">
                {bids.map((b, i) => (
                  <div key={b.id} className={`flex items-center justify-between p-4 rounded-lg border ${i === 0 ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                    <div>
                      <div className="font-semibold text-gray-800">{b.supplier_name || `Supplier #${b.supplier_id}`}</div>
                      <div className="text-sm text-gray-500">
                        Unit: ETB {parseFloat(b.unit_price).toFixed(2)} | Total: <span className="font-bold text-gray-800">ETB {parseFloat(b.total_cost).toFixed(2)}</span>
                      </div>
                      {!b.is_valid && <div className="text-xs text-red-600 mt-1">⚠ Invalid bid</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Lowest</span>}
                      {b.is_valid && (
                        <button onClick={() => awardTender(selectedTender, b.id)} disabled={loading}
                          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition">
                          Award This Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelectedTender(null); setBids([]); }} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
                ← Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Fund Requests ── */}
      {tab === 'fund-requests' && (
        <div className="space-y-4">
          {fundRequests.map(fr => (
            <div key={fr.id} className={`bg-white rounded-xl shadow p-6 border-l-4 ${fr.is_new_drug ? 'border-purple-500' : 'border-blue-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {fr.is_new_drug && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">🆕 New Drug</span>}
                    <div className="font-bold text-gray-800">{fr.fund_request_code}</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mt-1">ETB {parseFloat(fr.total_amount).toFixed(2)}</div>
                  <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(fr.status)}`}>{fr.status}</span>
                </div>
                {fr.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-2">
                    <button onClick={() => decideFundRequest(fr.id, 'APPROVED')} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-medium">Approve</button>
                    <button onClick={() => decideFundRequest(fr.id, 'REJECTED')} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 font-medium">Reject</button>
                  </div>
                )}
              </div>
              {fr.items && fr.items.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">Line Items</div>
                  {fr.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1 border-b last:border-0">
                      <span>{item.drug_name} — {item.quantity} units @ ETB {parseFloat(item.unit_price).toFixed(2)}</span>
                      <span className="font-semibold">ETB {parseFloat(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {fundRequests.length === 0 && <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">No fund requests yet.</div>}
        </div>
      )}
    </div>
  );
}
