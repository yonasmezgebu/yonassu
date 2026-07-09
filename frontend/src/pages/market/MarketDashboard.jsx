import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { playSound } from '../../services/notificationManager';

const API = '/api/purchase-flow';
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function MarketDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/market-tasks`, token());
      setTasks(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTasks();
    window.addEventListener('new-notification', fetchTasks);
    return () => window.removeEventListener('new-notification', fetchTasks);
  }, []);

  const markReady = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`${API}/market-tasks/${id}/complete`, {}, token());
      playSound('success');
      fetchTasks();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Market Research Tasks</h1>
        <p className="text-gray-500 mt-1">Complete assigned market research tasks so Purchase can proceed with tenders.</p>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => (
          <div key={task.id} className={`bg-white rounded-xl shadow border-l-4 p-6 ${task.status === 'READY_FOR_PURCHASE' ? 'border-green-500' : 'border-orange-400'}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{task.request_code}</span>
                  <span className="text-gray-500 text-sm">— {task.drug_name || 'Drug'}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Instructions from CEO</div>
                  <div className="text-sm text-gray-700 bg-orange-50 px-3 py-2 rounded">{task.instructions}</div>
                </div>
                {task.document_url && (
                  <a href={task.document_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">📎 View Reference Document</a>
                )}
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'READY_FOR_PURCHASE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{task.status}</span>
                </div>
              </div>
              {task.status === 'IN_PROGRESS' && (
                <button onClick={() => markReady(task.id)} disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
                  Mark Ready for Purchase
                </button>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div>No market research tasks assigned yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
