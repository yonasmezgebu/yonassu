import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    <div className="paper-card" style={{ padding: '24px' }}>
      <h2 style={styles.title}>Pending Shipments from Store</h2>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === t.key ? t.color : '#f3f4f6',
              color: activeTab === t.key ? '#fff' : '#374151',
            }}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: 16 }}>No {activeTab} shipments.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="paper-table">
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
                      <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.text }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {r.issued_at?.slice(0, 10) || r.approved_at?.slice(0, 10) || '-'}
                    </td>
                    <td>
                      {r.shipmentStatus === 'shipped' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleReceive(r.grn_id)}>
                          Receive
                        </button>
                      )}
                      {(r.shipmentStatus === 'accepted') && (
                        <span style={{ color: '#6b7280', fontSize: 12 }}>Waiting for store to ship</span>
                      )}
                      {(r.shipmentStatus === 'received') && (
                        <span style={{ color: '#22c55e', fontSize: 12 }}>Completed ✓</span>
                      )}
                      {(r.shipmentStatus === 'pending_approval' || r.shipmentStatus === 'pending_store') && (
                        <span style={{ color: '#8b5cf6', fontSize: 12 }}>Awaiting store acceptance</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{paperStyles}</style>
    </div>
  );
}

const styles = {
  title: { color: '#224f94', marginBottom: 16, fontSize: 18, fontWeight: 600 },
  tabBar: { display: 'flex', gap: 8, marginBottom: 8 },
  tab: {
    padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer',
    fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
  },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    fontSize: 12, fontWeight: 600,
  },
};

const paperStyles = `
  .paper-card {
    background: #fff; border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .paper-table {
    width: 100%; border-collapse: collapse;
    font-size: 13px;
  }
  .paper-table th {
    background: #f9fafb; padding: 10px 12px; text-align: left;
    border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;
  }
  .paper-table td {
    padding: 10px 12px; border-bottom: 1px solid #f3f4f6;
  }
  .paper-table tr:hover { background: #f9fafb; }
  .btn { padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
  .btn-primary { background: #224f94; color: #fff; }
  .btn-primary:hover { background: #1a3d73; }
  .btn-sm { padding: 4px 10px; font-size: 11px; }
`;
