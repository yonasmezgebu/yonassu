import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing, Calendar, MapPin, Phone, RefreshCw, ArrowRight,
  Clock, CheckCircle2, MessageSquareText, Car as CarIcon
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { useToast } from '../../components/Toast';
import apiClient from '../../services/apiClient';
import styles from './CustomerAvailabilityRequests.module.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

const REQUEST_STATUS = {
  waiting:   { label: 'Waiting',   cls: 'statusWaiting' },
  notified:  { label: 'Notified',  cls: 'statusNotified' },
  converted: { label: 'Converted', cls: 'statusConverted' },
};

const AVAIL_CLASS = { Available: 'avail', Booked: 'booked', Maintenance: 'maintenance' };

function Badge({ label, cls }) {
  return (
    <span className={`${styles.badge} ${styles[cls]}`}>
      <span className={styles.badgeDot} />
      {label}
    </span>
  );
}

export default function CustomerAvailabilityRequests() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/car-waitlist/my');
      const list = res.data ?? [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load availability requests', err);
      showToast('Failed to load your availability requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRequests();
      showToast('Requests refreshed.', 'success');
    } catch {
      showToast('Failed to refresh.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className={styles.page}>
        <ToastContainer />
        <div className={styles.wrap}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Availability Requests</h1>
              <p className={styles.subtitle}>Vehicles you asked to be notified about, and their current status</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnSecondary} onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? styles.spin : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate('/fleet-gallery')}>
                <CarIcon size={16} /> Browse Vehicles
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <SegmentedSpinner size={32} />
              <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>Loading requests…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <BellRing size={48} className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>No Availability Requests</h2>
              <p className={styles.emptyDesc}>
                When a vehicle is fully booked or in service, head to the fleet gallery and hit
                &ldquo;Contact When Available&rdquo; to have us call you the moment it frees up.
              </p>
              <button className={styles.btnPrimary} onClick={() => navigate('/fleet-gallery')}>Browse Fleet</button>
            </div>
          ) : (
            <div className={styles.cardList}>
              {requests.map((req) => {
                const rq = REQUEST_STATUS[req.status] || REQUEST_STATUS.waiting;
                const availCls = AVAIL_CLASS[req.car_availability] || 'availability';
                const isAvailableNow = req.car_availability === 'Available';
                const isConverted = req.status === 'converted';

                return (
                  <div key={req.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.cardTitle}>{req.car_name || 'Vehicle'}</div>
                        <div className={styles.cardSub}>
                          Requested {fmtDate(req.created_at)} &middot; Status: {rq.label}
                        </div>
                      </div>
                      <div className={styles.cardBadges}>
                        <Badge label={`Vehicle: ${req.car_availability || 'Available'}`} cls={availCls} />
                        <Badge label={rq.label} cls={rq.cls} />
                      </div>
                    </div>

                    <div className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <Phone size={15} className={styles.infoLabel} />
                        <span className={styles.infoLabel}>Phone</span>
                        <span className={styles.infoValue}>{req.customer_phone || '—'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <MapPin size={15} className={styles.infoLabel} />
                        <span className={styles.infoLabel}>Pickup</span>
                        <span className={styles.infoValue}>{req.pickup_location || '—'}</span>
                      </div>
                      {req.preferred_start_date && (
                        <div className={styles.infoRow}>
                          <Calendar size={15} className={styles.infoLabel} />
                          <span className={styles.infoLabel}>Preferred</span>
                          <span className={styles.infoValue}>
                            {fmtDate(req.preferred_start_date)}{req.preferred_end_date ? ` → ${fmtDate(req.preferred_end_date)}` : ''}
                          </span>
                        </div>
                      )}
                      {req.driver_name && (
                        <div className={styles.infoRow}>
                          <CarIcon size={15} className={styles.infoLabel} />
                          <span className={styles.infoLabel}>Driver</span>
                          <span className={styles.infoValue}>{req.driver_name}{req.driver_license ? ` · ${req.driver_license}` : ''}</span>
                        </div>
                      )}
                      {req.message && (
                        <div className={styles.infoRow}>
                          <MessageSquareText size={15} className={styles.infoLabel} />
                          <span className={styles.infoLabel}>Message</span>
                          <span className={styles.infoValue}>{req.message}</span>
                        </div>
                      )}
                    </div>

                    {!isAvailableNow && req.bookingEndDate && (
                      <div className={styles.releaseNote}>
                        <Clock size={14} /> {req.car_name || 'The vehicle'} frees up around {fmtDate(req.bookingEndDate)}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <div className={styles.rate}>{fmtMoney(req.car_daily_rate)} ETB/day</div>
                      {isConverted ? (
                        <button className={styles.btnSecondary} onClick={() => navigate('/customer/rentals')}>
                          <CheckCircle2 size={16} /> View Your Order
                        </button>
                      ) : isAvailableNow ? (
                        <button className={styles.btnPrimary} onClick={() => navigate('/fleet-gallery')}>
                          <ArrowRight size={16} /> Reserve Now
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
                          We&apos;ll notify you when it&apos;s free
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}