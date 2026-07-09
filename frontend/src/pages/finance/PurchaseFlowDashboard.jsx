import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { playSound } from '../../services/notificationManager';

const API = '/api/v1/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function FinanceDashboard({ user }) {
  const [tab, setTab] = useState('fund-requests');
  const [fundRequests, setFundRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ fund_request_id: '', supplier_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [fRes, dRes, pRes] = await Promise.all([
        axios.get(`${API}/fund-requests`, token()),
        axios.get(`${API}/deliveries`, token()),
        axios.get(`${API}/payments`, token()),
      ]);
      setFundRequests(fRes.data.data);
      setDeliveries(dRes.data.data);
      setPayments(pRes.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAll();
    window.addEventListener('new-notification', fetchAll);
    return () => window.removeEventListener('new-notification', fetchAll);
  }, []);

  const markReadyForPayment = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`${API}/fund-requests/${id}/ready-for-payment`, {}, token());
      playSound('success');
      fetchAll();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  const createPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API}/payments`, {
        fund_request_id: parseInt(paymentForm.fund_request_id),
        supplier_id: parseInt(paymentForm.supplier_id),
      }, token());
      playSound('success');
      setPaymentForm({ fund_request_id: '', supplier_id: '' });
      fetchAll();
      setTab('payments');
    } catch (e) {
      setError(e.response?.data?.error || 'Payment failed');
      playSound('info');
    } finally { setSubmitting(false); }
  };

  const approvedFundRequests = fundRequests.filter(f => f.status === 'APPROVED');
  const readyForPayment = fundRequests.filter(f => f.status === 'READY_FOR_PAYMENT');

  const TabBtn = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${tab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {label}{count !== undefined && count > 0 && <span className="ml-2 bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Manager Dashboard</h1>
        <p className="text-gray-500 mt-1">Flow 2: Verify budgets, manage deliveries, and process payments.</p>
      </div>

      <div className="border-b flex gap-2">
        <TabBtn id="fund-requests" label="Fund Requests" count={approvedFundRequests.length} />
        <TabBtn id="deliveries" label="Deliveries" />
        <TabBtn id="make-payment" label="Make Payment" count={readyForPayment.length} />
        <TabBtn id="payments" label="Payment History" />
      </div>

      {/* ── Fund Requests ── */}
      {tab === 'fund-requests' && (
        <div className="space-y-4">
          {fundRequests.map(fr => (
            <div key={fr.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-bold text-gray-900 text-lg">{fr.fund_request_code}</div>
                  <div className="text-3xl font-bold text-teal-700">ETB {parseFloat(fr.total_amount).toFixed(2)}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${fr.status === 'APPROVED' ? 'bg-green-100 text-green-700' : fr.status === 'READY_FOR_PAYMENT' ? 'bg-teal-100 text-teal-700' : fr.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{fr.status}</span>
                </div>
                {fr.status === 'APPROVED' && (
                  <button onClick={() => markReadyForPayment(fr.id)} disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                    ✓ Verify Budget & Mark Ready
                  </button>
                )}
                {fr.status === 'READY_FOR_PAYMENT' && (
                  <button onClick={() => { setPaymentForm(f => ({ ...f, fund_request_id: String(fr.id) })); setTab('make-payment'); }}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                    Process Payment →
                  </button>
                )}
              </div>
              {fr.items && fr.items.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  {fr.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1 border-b last:border-0">
                      <span>{item.drug_name} — {item.quantity} units @ ETB {parseFloat(item.unit_price).toFixed(2)} ({item.tender_code})</span>
                      <span className="font-semibold">ETB {parseFloat(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {fundRequests.length === 0 && <div className="text-center py-12 text-gray-400">No fund requests yet.</div>}
        </div>
      )}

      {/* ── Deliveries ── */}
      {tab === 'deliveries' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Tender', 'Drug', 'Qty', 'Delivery Type', 'Status', 'Notes'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {deliveries.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.tender_code}</td>
                  <td className="px-4 py-3">{d.drug_name || '—'}</td>
                  <td className="px-4 py-3">{d.quantity}</td>
                  <td className="px-4 py-3 text-xs">{d.delivery_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : d.status === 'ISSUE_REPORTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.notes || '—'}</td>
                </tr>
              ))}
              {deliveries.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No deliveries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Make Payment ── */}
      {tab === 'make-payment' && (
        <div className="bg-white rounded-xl shadow border-t-4 border-teal-600 p-6 max-w-lg">
          <h2 className="text-lg font-semibold mb-2">Process Payment</h2>
          <p className="text-sm text-gray-500 mb-4">Payment is only possible when the fund request is READY_FOR_PAYMENT and all goods have been received. The server enforces this — double payments are blocked.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <form onSubmit={createPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund Request ID</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" required value={paymentForm.fund_request_id} onChange={e => setPaymentForm(f => ({ ...f, fund_request_id: e.target.value }))}>
                <option value="">Select a Fund Request</option>
                {readyForPayment.map(fr => (
                  <option key={fr.id} value={fr.id}>{fr.fund_request_code} — ETB {parseFloat(fr.total_amount).toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID</label>
              <input type="number" required className="w-full border rounded-lg px-3 py-2 text-sm" value={paymentForm.supplier_id} onChange={e => setPaymentForm(f => ({ ...f, supplier_id: e.target.value }))} placeholder="Enter supplier user ID" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-60">
              {submitting ? 'Processing...' : 'Process Payment & Generate Receipt'}
            </button>
          </form>
        </div>
      )}

      {/* ── Payment History ── */}
      {tab === 'payments' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{['Receipt Code', 'Fund Request', 'Supplier', 'Amount', 'Paid At', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-teal-700">{p.receipt_code}</td>
                  <td className="px-4 py-3">{p.fund_request_code}</td>
                  <td className="px-4 py-3">{p.supplier_name || p.supplier_id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">ETB {parseFloat(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.paid_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{p.status}</span></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payments processed yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
