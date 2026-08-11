import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PharmacyPendingShipments.css';

const STATUS_TABS = [
  { key: 'pending_store', label: 'Pending Store', color: '#8b5cf6' },
  { key: 'accepted',      label: 'Accepted',      color: '#3b82f6' },
  { key: 'shipped',       label: 'Shipped',       color: '#f59e0b' },
  { key: 'received',      label: 'Received',      color: '#22c55e' },
];

const STATUS_BADGE = {
  pending_store: { bg: '#ede9fe', text: '#5b21b6', label: 'Awaiting Store' },
  accepted:      { bg: '#dbeafe', text: '#1e40af', label: 'Accepted' },
  shipped:       { bg: '#fef3c7', text: '#92400e', label: 'Shipped' },
  received:      { bg: '#dcfce7', text: '#166534', label: 'Received' },
};

export default function PharmacyPendingShipments() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('accepted');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/v1/pharmacy/pending-shipments')
      .then(({ data: res }) => setData(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    pending_store: data.filter(d => d.shipmentStatus === 'pending_approval' || d.shipmentStatus === 'pending_store').length,
    accepted: data.filter(d => d.shipmentStatus === 'accepted').length,
    shipped:  data.filter(d => d.shipmentStatus === 'shipped').length,
    received: data.filter(d => d.shipmentStatus === 'received').length,
  };

  const filtered = data.filter(d => d.shipmentStatus === activeTab);

  const handleReceive = (grnId) => {
    navigate(`/pharmacy/grn/${grnId}`);
  };

  return (
    <div className="pps-root">
      <div className="pps-card">
        <h2 className="pps-title">Pending Shipments from Store</h2>

        {/* Tab bar */}
        <div className="pps-tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pps-tab ${activeTab === t.key ? 'active' : ''}`}
            >
              <span>{t.label} ({counts[t.key]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="pps-loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="pps-loading">No {activeTab} shipments.</p>
        ) : (
          <div className="pps-table-wrap">
            <table className="pps-table">
              <thead>
                <tr>
                  <th>Req No</th>
                  <th>Drug</th>
                  <th>Qty Approved</th>
                  <th>Qty Issued</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const badge = STATUS_BADGE[r.shipmentStatus] || STATUS_BADGE.accepted;
                  return (
                    <tr key={r.id}>
                      <td>{r.req_no}</td>
                      <td>{r.drug_name}</td>
                      <td>{r.quantity_approved}</td>
                      <td>{r.quantity_issued || '-'}</td>
                      <td>
                        <span className="pps-badge" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="pps-muted">
                        {r.issued_at?.slice(0, 10) || r.approved_at?.slice(0, 10) || '-'}
                      </td>
                      <td>
                        {r.shipmentStatus === 'shipped' && (
                          <button className="pps-btn" onClick={() => handleReceive(r.grn_id)}>
                            <span>Receive</span>
                          </button>
                        )}
                        {(r.shipmentStatus === 'accepted') && (
                          <span className="pps-muted" style={{ color: '#1e40af' }}>Waiting for store</span>
                        )}
                        {(r.shipmentStatus === 'received') && (
                          <span className="pps-muted" style={{ color: '#22c55e', fontWeight: 600 }}>Completed ✓</span>
                        )}
                        {(r.shipmentStatus === 'pending_approval' || r.shipmentStatus === 'pending_store') && (
                          <span className="pps-muted" style={{ color: '#8b5cf6' }}>Awaiting store</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
