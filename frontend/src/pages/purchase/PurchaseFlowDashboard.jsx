import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { playSound } from '../../services/notificationManager';

const API = '/api/v1/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function PurchaseManagerDashboard({ user }) {
  const [tab, setTab] = useState('approved-requests');
  const [requests, setRequests] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [selectedForFund, setSelectedForFund] = useState([]);
  const [tenderForm, setTenderForm] = useState({ purchase_request_id: '', quantity: '', closing_at: '', terms: '', delivery_type: 'VIA_STORE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [rRes, tRes, fRes] = await Promise.all([
        axios.get(`${API}/purchase-requests`, token()),
        axios.get(`${API}/tenders`, token()),
        axios.get(`${API}/fund-requests`, token()),
      ]);
      setRequests(rRes.data.data);
      setTenders(tRes.data.data);
      setFundRequests(fRes.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAll();
    window.addEventListener('new-notification', fetchAll);
    return () => window.removeEventListener('new-notification', fetchAll);
  }, []);

  const createTender = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/tenders`, { ...tenderForm, purchase_request_id: parseInt(tenderForm.purchase_request_id), quantity: parseInt(tenderForm.quantity) }, token());
      playSound('success');
      setTenderForm({ purchase_request_id: '', quantity: '', closing_at: '', terms: '', delivery_type: 'VIA_STORE' });
      fetchAll();
      setTab('tenders');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create tender');
      playSound('info');
    } finally { setLoading(false); }
  };

  const toggleFundSelection = (tenderId) => {
    setSelectedForFund(prev => prev.includes(tenderId) ? prev.filter(id => id !== tenderId) : [...prev, tenderId]);
  };

  const createFundRequest = async () => {
    if (selectedForFund.length === 0) return alert('Select at least one AWARDED tender');
    setLoading(true);
    try {
      await axios.post(`${API}/fund-requests`, { tender_ids: selectedForFund }, token());
      playSound('success');
      setSelectedForFund([]);
      fetchAll();
      setTab('fund-requests');
    } catch (e) { alert(e.response?.data?.error || 'Error creating fund request'); }
    finally { setLoading(false); }
  };

  const awardedTenders = tenders.filter(t => t.status === 'AWARDED');

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Manager Dashboard</h1>
        <p className="text-gray-500 mt-1">Flow 2: Manage tenders and fund requests.</p>
      </div>

      <div className="border-b flex gap-2">
        <TabBtn id="approved-requests" label="Approved Requests" />
        <TabBtn id="create-tender" label="Create Tender" />
        <TabBtn id="tenders" label="Tenders" />
        <TabBtn id="fund-requests" label="Fund Requests" />
      </div>

      {tab === 'approved-requests' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Code', 'Drug', 'Qty', 'Status', 'Urgency'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setTenderForm(f => ({ ...f, purchase_request_id: String(r.id), quantity: String(r.requested_qty) })); setTab('create-tender'); }}>
                  <td className="px-4 py-3 font-mono text-xs">{r.request_code}</td>
                  <td className="px-4 py-3">{r.drug_name || r.drug_id}</td>
                  <td className="px-4 py-3">{r.requested_qty}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{r.status}</span></td>
                  <td className="px-4 py-3">{r.urgency}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No approved requests waiting for a tender.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'create-tender' && (
        <div className="bg-white rounded-xl shadow border-t-4 border-indigo-600 p-6">
          <h2 className="text-lg font-semibold mb-4">Create & Post New Tender</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <form onSubmit={createTender} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Request ID</label>
              <input type="number" required className="w-full border rounded-lg px-3 py-2 text-sm" value={tenderForm.purchase_request_id} onChange={e => setTenderForm(f => ({ ...f, purchase_request_id: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" required min="1" className="w-full border rounded-lg px-3 py-2 text-sm" value={tenderForm.quantity} onChange={e => setTenderForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date & Time</label>
              <input type="datetime-local" required className="w-full border rounded-lg px-3 py-2 text-sm" value={tenderForm.closing_at} onChange={e => setTenderForm(f => ({ ...f, closing_at: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={tenderForm.delivery_type} onChange={e => setTenderForm(f => ({ ...f, delivery_type: e.target.value }))}>
                <option value="VIA_STORE">Via Store (Store Manager receives)</option>
                <option value="DIRECT_TO_PHARMACY">Direct to Pharmacy (CEO confirms)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={tenderForm.terms} onChange={e => setTenderForm(f => ({ ...f, terms: e.target.value }))} placeholder="Specify any delivery/quality terms suppliers must meet..." />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition font-medium disabled:opacity-60">
                {loading ? 'Posting...' : 'Post Tender'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'tenders' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Code', 'Drug', 'Qty', 'Closes', 'Delivery', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {tenders.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.tender_code}</td>
                  <td className="px-4 py-3">{t.drug_name || t.drug_id}</td>
                  <td className="px-4 py-3">{t.quantity}</td>
                  <td className="px-4 py-3 text-xs">{new Date(t.closing_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{t.delivery_type}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : t.status === 'CLOSED' ? 'bg-orange-100 text-orange-700' : t.status === 'AWARDED' ? 'bg-green-100 text-green-700' : t.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span></td>
                </tr>
              ))}
              {tenders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tenders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fund-requests' && (
        <div className="space-y-6">
          {awardedTenders.length > 0 && (
            <div className="bg-white rounded-xl shadow border-t-4 border-indigo-500 p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Bundle AWARDED Tenders into Fund Request</h2>
              <p className="text-sm text-gray-500 mb-4">Select one or more awarded tenders. The server will compute the total from stored bids.</p>
              <div className="space-y-2">
                {awardedTenders.map(t => (
                  <label key={t.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${selectedForFund.includes(t.id) ? 'border-indigo-400 bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedForFund.includes(t.id)} onChange={() => toggleFundSelection(t.id)} className="w-4 h-4 text-indigo-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{t.tender_code} — {t.drug_name || t.drug_id}</div>
                      <div className="text-xs text-gray-500">Qty: {t.quantity} | Delivery: {t.delivery_type}</div>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={createFundRequest} disabled={loading || selectedForFund.length === 0} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition font-medium disabled:opacity-60">
                {loading ? 'Creating...' : `Create Fund Request (${selectedForFund.length} selected)`}
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50"><h2 className="font-semibold">Fund Requests</h2></div>
            {fundRequests.map(fr => (
              <div key={fr.id} className="p-6 border-b">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold">{fr.fund_request_code}</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">ETB {parseFloat(fr.total_amount).toFixed(2)}</div>
                  </div>
                  <span className={`self-start px-3 py-1 rounded-full text-sm font-medium ${fr.status === 'APPROVED' ? 'bg-green-100 text-green-700' : fr.status === 'REJECTED' ? 'bg-red-100 text-red-700' : fr.status === 'READY_FOR_PAYMENT' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}`}>{fr.status}</span>
                </div>
                {fr.decision_reason && <div className="mt-2 text-sm text-red-600">Reason: {fr.decision_reason}</div>}
              </div>
            ))}
            {fundRequests.length === 0 && <div className="p-8 text-center text-gray-400">No fund requests yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
