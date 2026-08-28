import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import s from './EmailSubscribers.module.css';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusMap = {
  active: { bg: '#DCFCE7', color: '#166534', label: 'Active', key: 'active' },
  unsubscribed: { bg: '#FEE2E2', color: '#991B1B', label: 'Unsubscribed', key: 'unsubscribed' },
  bounced: { bg: '#FEF3C7', color: '#92400E', label: 'Bounced', key: 'bounced' },
  spam: { bg: '#F3F4F6', color: '#6B7280', label: 'Spam', key: 'spam' },
};

const EmailSubscribers = () => {
  const [subs, setSubs] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, bounced: 0, spam: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [confirm, setConfirm] = useState(null); // { id, email, action }

  const notify = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const closeConfirm = () => setConfirm(null);

  const runConfirmed = async () => {
    if (!confirm) return;
    const { id, email, action } = confirm;
    closeConfirm();
    try {
      if (action === 'delete') {
        await api.delete(`/email-subscribers/admin/${id}`);
        notify(`${email} deleted`);
      } else {
        await api.put(`/email-subscribers/admin/${id}/status`, { status: action });
        notify(`${email} marked as ${action}`);
      }
      load();
    } catch (err) {
      notify(action === 'delete' ? 'Delete failed' : 'Update failed', 'error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/email-subscribers/admin', { params: { page, limit: 20, status: filter, search } });
      setSubs(res?.data?.subscribers || []);
      setStats(res?.data?.stats || stats);
      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    }
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(`${api.defaults?.baseURL || 'http://localhost:5000/api/v1'}/email-subscribers/admin/export?status=${filter}&token=${token}`, '_blank');
  };

  const statCards = [
    { label: 'Total', value: stats.total, bg: '#F3F4F6', color: '#374151', key: 'all' },
    { label: 'Active', ...statusMap.active, key: 'active' },
    { label: 'Unsubscribed', ...statusMap.unsubscribed, key: 'unsubscribed' },
    { label: 'Bounced', ...statusMap.bounced, key: 'bounced' },
    { label: 'Spam', ...statusMap.spam, key: 'spam' },
  ];

  return (
    <div className={s.subscribePage}>
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Email Subscribers</h2>
          <p className={s.pageSubtitle}>Manage newsletter subscribers from the public landing page</p>
        </div>
        <button onClick={handleExport} className={s.btnPrimary}>Export CSV</button>
      </div>

      {msg && (
        <div className={s.toast} style={msgType === 'error' ? { background: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' } : undefined}>
          {msg}
        </div>
      )}

      <div className={s.statsGrid}>
        {statCards.map(sc => (
          <div
            key={sc.key}
            onClick={() => { setFilter(sc.key); setPage(1); }}
            className={`${s.statCard} ${filter === sc.key ? s.statCardActive : ''}`}
            style={{ background: sc.bg, color: sc.color }}
          >
            <div className={s.statLabel}>{sc.label}</div>
            <div className={s.statValue}>{sc.value}</div>
          </div>
        ))}
      </div>

      <div className={s.searchWrap}>
        <input
          type="text"
          placeholder="Search email or name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className={s.inputField}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem' }}><SegmentedSpinner size={24} /></div>
      ) : subs.length === 0 ? (
        <div className={s.card} style={{ textAlign: 'center', padding: '2.5rem', color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))', fontSize: '0.875rem' }}>
          No subscribers found. Submissions from the landing page footer will appear here.
        </div>
      ) : (
        <div className={s.card}>
          <div className={s.updateBanner}>
            {subs.length} subscriber{subs.length === 1 ? '' : 's'} · actions below broadcast in-app notifications to CEO &amp; Admin
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'hsl(var(--muted, 210 40% 96.1%))' }}>
                <th style={thStyle('#')}>#</th>
                <th style={thStyle('Email')}>Email</th>
                <th style={thStyle('Name')}>Name</th>
                <th style={thStyle('Source')}>Source</th>
                <th style={thStyle('Subscribed')}>Subscribed</th>
                <th style={{ ...thStyle('Status'), textAlign: 'center' }}>Status</th>
                <th style={{ ...thStyle('Actions'), textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub, i) => {
                const sc = statusMap[sub.status] || { bg: '#F3F4F6', color: '#6B7280', label: sub.status };
                return (
                  <tr key={sub.id} style={{ borderTop: '1px solid hsl(var(--border, 214.3 31.8% 91.4%))' }}>
                    <td style={tdStyle()}><span style={{ color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))', fontSize: '0.75rem' }}>{(page - 1) * 20 + i + 1}</span></td>
                    <td style={tdStyle()}><span style={{ fontWeight: 600 }}>{sub.email}</span></td>
                    <td style={tdStyle()}><span style={{ color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))' }}>{sub.full_name || '—'}</span></td>
                    <td style={tdStyle()}>
                      <span className={s.pill} style={{ background: '#EFF6FF', color: '#2563EB' }}>{sub.source || 'landing_page'}</span>
                    </td>
                    <td style={tdStyle()}>{fmtDate(sub.created_at)}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <span className={s.pill} style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                        {sub.status === 'active' ? (
                          <button onClick={() => setConfirm({ id: sub.id, email: sub.email, action: 'unsubscribed' })} className={`${s.btn} ${s.btnDanger}`}>Unsub</button>
                        ) : sub.status === 'unsubscribed' ? (
                          <button onClick={() => setConfirm({ id: sub.id, email: sub.email, action: 'active' })} className={`${s.btn} ${s.btnSuccess}`}>Restore</button>
                        ) : null}
                        <button onClick={() => setConfirm({ id: sub.id, email: sub.email, action: 'delete' })} className={`${s.btn} ${s.btnDanger}`}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={s.btn} style={{ opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))' }}>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={s.btn} style={{ opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
        </div>
      )}

      {confirm && (
        <div className={s.overlay} onClick={closeConfirm}>
          <div className={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className={s.modalTitle}>{confirm.action === 'delete' ? 'Delete Subscriber' : confirm.action === 'active' ? 'Restore Subscriber' : 'Unsubscribe Subscriber'}</h3>
            <p className={s.modalText}>
              {confirm.action === 'delete'
                ? `Permanently remove ${confirm.email} from the subscriber list?`
                : confirm.action === 'active'
                ? `Reactivate ${confirm.email} and mark them as an active subscriber?`
                : `Unsubscribe ${confirm.email} from the newsletter? They can re-subscribe anytime.`}
            </p>
            <div className={s.modalActions}>
              <button className={`${s.btn} ${s.btnPrimaryOutline}`} onClick={closeConfirm}>Cancel</button>
              <button
                className={`${s.btn} ${confirm.action === 'active' ? s.btnSuccess : s.btnDanger}`}
                style={{ fontWeight: 700, color: '#fff', background: confirm.action === 'active' ? '#059669' : '#DC2626', borderColor: 'transparent' }}
                onClick={runConfirmed}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = (label) => ({
  padding: '0.625rem 1rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
});

const tdStyle = () => ({
  padding: '0.625rem 1rem',
  color: 'hsl(var(--foreground, 222.2 84% 4.9%))',
  verticalAlign: 'middle',
});

export default EmailSubscribers;
