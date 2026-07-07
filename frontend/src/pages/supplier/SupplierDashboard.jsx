import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { playSound } from '../../services/notificationManager';

const API = '/api/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function SupplierDashboard({ user }) {
  const [tenders, setTenders] = useState([]);
  const [bidForm, setBidForm] = useState({ tenderId: null, unit_price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTenders = async () => {
    try {
      const res = await axios.get(`${API}/tenders?status=OPEN`, token());
      setTenders(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTenders();
    window.addEventListener('new-notification', fetchTenders);
    return () => window.removeEventListener('new-notification', fetchTenders);
  }, []);

  const submitBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await axios.post(`${API}/tenders/${bidForm.tenderId}/bids`, { unit_price: parseFloat(bidForm.unit_price) }, token());
      playSound('success');
      setSuccess('Bid submitted successfully!');
      setBidForm({ tenderId: null, unit_price: '' });
      fetchTenders();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit bid');
      playSound('info');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Open Tenders</h1>
        <p className="text-gray-500 mt-1">View available tenders and submit your bids. You cannot see other suppliers' bids.</p>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="grid gap-6">
        {tenders.map(t => (
          <div key={t.id} className="bg-white rounded-xl shadow border overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-lg">{t.tender_code}</div>
                <div className="text-blue-100 text-sm">{t.drug_name || `Drug ID: ${t.drug_id}`}</div>
              </div>
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">OPEN</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Quantity Required</div>
                  <div className="font-bold text-gray-900 text-xl">{t.quantity}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Delivery Type</div>
                  <div className="font-semibold text-gray-700">{t.delivery_type?.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Closing At</div>
                  <div className="font-semibold text-gray-700 text-sm">{new Date(t.closing_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time Remaining</div>
                  <div className="font-semibold text-orange-600 text-sm">
                    {Math.max(0, Math.floor((new Date(t.closing_at) - new Date()) / 1000 / 60 / 60))}h {Math.max(0, Math.floor(((new Date(t.closing_at) - new Date()) / 1000 / 60) % 60))}m
                  </div>
                </div>
              </div>

              {t.terms && (
                <div className="mb-4 bg-gray-50 rounded px-4 py-3">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Terms & Conditions</div>
                  <div className="text-sm text-gray-700">{t.terms}</div>
                </div>
              )}

              {bidForm.tenderId === t.id ? (
                <form onSubmit={submitBid} className="flex gap-3 items-end mt-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Unit Price (ETB)</label>
                    <input type="number" required min="0.01" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 15.50"
                      value={bidForm.unit_price} onChange={e => setBidForm(f => ({ ...f, unit_price: e.target.value }))} />
                  </div>
                  {bidForm.unit_price && (
                    <div className="text-sm text-gray-600 mb-2">
                      Total: <span className="font-bold">ETB {(parseFloat(bidForm.unit_price || 0) * t.quantity).toFixed(2)}</span>
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Bid'}
                  </button>
                  <button type="button" onClick={() => setBidForm({ tenderId: null, unit_price: '' })} className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                </form>
              ) : (
                <button onClick={() => setBidForm({ tenderId: t.id, unit_price: '' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                  Place Bid
                </button>
              )}
            </div>
          </div>
        ))}
        {tenders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📦</div>
            <div>No open tenders available at this time.</div>
          </div>
        )}
      </div>
    </div>
  );
}
