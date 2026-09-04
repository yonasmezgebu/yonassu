import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  ClipboardList, Clock, CheckSquare, XSquare, Package, RefreshCw,
  ArrowLeft, User, Mail, Phone, MapPin, Truck, Hash, Calendar,
  DollarSign, Image as ImageIcon, AlertCircle, Upload, FileText, CheckCircle, Trash2
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { useToast } from '../../components/Toast';
import styles from './CustomerPrescriptions.module.css';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? path : '/' + path}`.replace(/\\/g, '/');
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n) => parseFloat(n || 0).toFixed(2);

const STATUS_CONFIG = {
  pending:          { label: 'Pending Review',   styleClass: styles.statusPending },
  approved:         { label: 'Approved',         styleClass: styles.statusApproved },
  rejected:         { label: 'Rejected',         styleClass: styles.statusRejected },
  ready_for_pickup: { label: 'Ready for Pickup', styleClass: styles.statusReady },
  picked_up:        { label: 'Picked Up',        styleClass: styles.statusDelivered },
  delivered:        { label: 'Delivered',        styleClass: styles.statusDelivered },
};

const STATUS_TABS = [
  { key: 'all',       label: 'All Orders', Icon: ClipboardList },
  { key: 'pending',   label: 'Pending',    Icon: Clock },
  { key: 'approved',  label: 'Approved',   Icon: CheckCircle },
  { key: 'delivered', label: 'Delivered',  Icon: Truck },
];

export default function CustomerPrescriptions() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  
  const [imgError, setImgError]     = useState(false);
  const [lightbox, setLightbox]     = useState(null);

  // action states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [cancelOpen, setCancelOpen]     = useState(false);
  const fileRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/pharmacy/requests/my-requests');
      const list = res.data?.data || res.data || [];
      setRequests(Array.isArray(list) ? list : []);
      if (selectedOrder) {
        const updated = (Array.isArray(list) ? list : []).find(r => r.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('Failed to load prescription requests', err);
      showToast('Failed to load prescription requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOrder, showToast]);

  useEffect(() => { fetchRequests(); }, []); // eslint-disable-line

  const handleHideRequest = (e, id, label) => {
    e.stopPropagation();
    setConfirmDelete({ id, label });
  };

  const confirmHideRequest = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/pharmacy/requests/${id}/hide`);
      setRequests(prev => prev.filter(r => r.id !== id));
      showToast('Order removed from your dashboard.', 'success');
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove order.', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/pharmacy/requests/my-requests');
      const list = res.data?.data || res.data || [];
      setRequests(Array.isArray(list) ? list : []);
      if (selectedOrder) {
        const updated = (Array.isArray(list) ? list : []).find(r => r.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      showToast('Orders refreshed.', 'success');
    } catch {
      showToast('Failed to refresh.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    try {
      await axios.delete(`/pharmacy/requests/${selectedOrder.id}/cancel`);
      showToast('Request cancelled successfully.', 'success');
      setCancelOpen(false);
      fetchRequests();
      setSelectedOrder(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel request.';
      showToast(msg, 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedOrder) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('prescription_image', selectedFile);
      await axios.post(`/pharmacy/requests/${selectedOrder.id}/upload`, formData);
      showToast('Prescription image uploaded!', 'success');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload image.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const openDetail = (req) => {
    setSelectedOrder(req);
    setImgError(false);
    setCancelOpen(false);
    setSelectedFile(null);
  };

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW
  ═══════════════════════════════════════════════════════════ */
  if (selectedOrder) {
    const o = selectedOrder;
    const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
    
    const medImgSrc = getImageUrl(o.medication_image);
    const rxImgSrc = getImageUrl(o.prescription_image);
    
    const canCancel = o.status === 'pending';
    const canUpload = o.status === 'pending' || o.status === 'approved';

    return (
      <div className={styles.page}>
        <ToastContainer />
        <div className={styles.wrap}>
          
          <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to Orders
          </button>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>#{o.request_number || o.id}</h1>
              <p className={styles.subtitle}>Requested on {fmtDateTime(o.requested_at)}</p>
            </div>
            <div className={styles.headerActions}>
              <span className={`${styles.badge} ${cfg.styleClass}`}>
                <span className={styles.badgeDot}></span>
                {cfg.label}
              </span>
              {canCancel && !cancelOpen && (
                <button className={styles.btnDanger} onClick={() => setCancelOpen(true)}>
                  <XSquare size={16} /> Cancel Order
                </button>
              )}
            </div>
          </div>

          <div className={styles.detailGrid}>
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Medication Details Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailSectionTitle}>
                  <Package size={20} className={styles.emptyIcon} style={{ margin: 0 }} /> 
                  Medication Details
                </div>
                
                <div className={styles.imageContainer}>
                  {medImgSrc ? (
                    <img src={medImgSrc} alt={o.medication_name} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--muted-foreground))' }}>
                      <ImageIcon size={48} />
                      <span style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>No Image Available</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Medication</span>
                    <span className={styles.infoValueLarge}>{o.medication_name || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Quantity</span>
                    <span className={styles.infoValue}>{o.quantity} unit(s)</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Unit Price</span>
                    <span className={styles.infoValue}>{fmtMoney(o.price_per_unit)} ETB</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}><Truck size={14} /> Delivery Option</span>
                    <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{o.delivery_option || 'Pickup'}</span>
                  </div>
                  {o.delivery_address && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}><MapPin size={14} /> Delivery Address</span>
                      <span className={styles.infoValue}>{o.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Image Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailSectionTitle}>
                  <FileText size={20} className={styles.emptyIcon} style={{ margin: 0 }} /> 
                  Prescription Image
                </div>
                
                <div className={styles.rxImageContainer} onClick={() => rxImgSrc && !imgError && setLightbox(rxImgSrc)}>
                  {!rxImgSrc ? (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
                       <FileText size={48} className={styles.emptyIcon} />
                       <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>No Prescription Attached</div>
                       <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', maxWidth: '240px', marginTop: '0.5rem' }}>
                         If a physical prescription is required, upload it here or present it upon pickup.
                       </div>
                     </div>
                  ) : imgError ? (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
                       <AlertCircle size={48} color="hsl(0 72% 50%)" />
                       <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', margin: '0.5rem 0' }}>Image Failed to Load</div>
                       <a href={rxImgSrc} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--primary))', fontSize: '0.875rem', textDecoration: 'underline' }}>Open Image Directly</a>
                     </div>
                  ) : (
                    <img src={rxImgSrc} alt="Prescription" onError={() => setImgError(true)} />
                  )}
                </div>

                {canUpload && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <input
                      type="file"
                      ref={fileRef}
                      accept="image/*,.pdf"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      className={styles.inputFile}
                    />
                    <button
                      className={styles.btnPrimary}
                      style={{ width: '100%' }}
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                    >
                      <Upload size={16} /> {uploading ? 'Uploading…' : (rxImgSrc ? 'Update Prescription' : 'Upload Prescription')}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Payment Summary */}
              <div className={styles.detailCard}>
                <div className={styles.detailSectionTitle}>
                  <DollarSign size={20} className={styles.emptyIcon} style={{ margin: 0 }} /> 
                  Payment Summary
                </div>
                
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Subtotal ({o.quantity} units)</span>
                    <span className={styles.infoValue}>{fmtMoney(o.quantity * (o.price_per_unit || 0))} ETB</span>
                  </div>
                  {o.delivery_fee > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Delivery Fee</span>
                      <span className={styles.infoValue}>{fmtMoney(o.delivery_fee)} ETB</span>
                    </div>
                  )}
                  <div className={styles.infoRow} style={{ borderTop: '2px solid hsl(var(--border))', marginTop: '0.5rem', paddingTop: '1rem', borderBottom: 'none' }}>
                    <span className={styles.infoLabel} style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>Total Due</span>
                    <span className={styles.infoTotal}>{fmtMoney(o.total_amount)} ETB</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className={styles.detailCard}>
                <div className={styles.detailSectionTitle}>
                  <User size={20} className={styles.emptyIcon} style={{ margin: 0 }} /> 
                  Customer Info
                </div>
                
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Name</span>
                    <span className={styles.infoValue}>{o.customer_name || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue} style={{ wordBreak: 'break-all' }}>{o.customer_email || '—'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{o.customer_phone || '—'}</span>
                  </div>
                </div>

                {o.rejection_reason && (
                  <div className={styles.alertError} style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <AlertCircle size={16} /> Rejection Reason
                    </div>
                    {o.rejection_reason}
                  </div>
                )}
              </div>

              {/* Cancel Action Box */}
              {canCancel && cancelOpen && (
                <div className={styles.detailCard} style={{ borderColor: 'hsl(0 72% 80%)', backgroundColor: 'hsl(0 86% 98%)' }}>
                  <div className={styles.detailSectionTitle} style={{ color: 'hsl(0 72% 38%)' }}>
                    <AlertCircle size={20} /> Cancel Order?
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(0 72% 38%)', marginBottom: '1.5rem' }}>
                    Are you sure you want to cancel this pharmacy order? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className={styles.btnDanger} onClick={handleCancel}>Confirm Cancel</button>
                    <button className={styles.btnSecondary} onClick={() => setCancelOpen(false)}>Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Lightbox */}
        {lightbox && (
          <div className={styles.modal} onClick={() => setLightbox(null)}>
            <button className={styles.modalClose} onClick={() => setLightbox(null)}><XSquare size={32} /></button>
            <img src={lightbox} alt="Full view" className={styles.modalImage} onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className={styles.page}>
      <ToastContainer />
      <div className={styles.wrap}>
        
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Pharmacy Orders</h1>
            <p className={styles.subtitle}>Track and manage your medication requests</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? styles.spin : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/pharmacy')}>
              Browse Medications
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {STATUS_TABS.map(({ key, label, Icon }) => (
            <button 
              key={key} 
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`} 
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.emptyState}>
            <SegmentedSpinner size={32} />
            <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No Orders Found</h2>
            <p className={styles.emptyDesc}>You don't have any pharmacy requests in this category.</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/services/pharmacy')}>Browse Medications</button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <div>Order</div>
                <div>Medication</div>
                <div>Delivery</div>
                <div>Amount & Date</div>
                <div>Status</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>
              {filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const canDelete = ['delivered', 'picked_up', 'completed', 'ready_for_pickup'].includes((req.status || '').toLowerCase());
                
                return (
                  <div key={req.id} className={styles.tableRow} onClick={() => openDetail(req)}>
                    <div className={styles.tableCol}>
                      <span className={styles.textPrimary}>#{req.request_number || req.id}</span>
                    </div>
                    
                    <div className={styles.tableCol}>
                      <span className={styles.textPrimary} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.medication_name || 'Prescription'}
                      </span>
                      <span className={styles.textSecondary}>Qty: {req.quantity || 1}</span>
                    </div>

                    <div className={styles.tableCol}>
                      <span className={styles.textPrimary} style={{ textTransform: 'capitalize' }}>
                        {req.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                    </div>

                    <div className={styles.tableCol}>
                      <span className={styles.textPrice}>{fmtMoney(req.total_amount)} ETB</span>
                      <span className={styles.textSecondary}>{fmtDate(req.requested_at)}</span>
                    </div>

                    <div className={styles.tableCol}>
                      <span className={`${styles.badge} ${cfg.styleClass}`}>
                        <span className={styles.badgeDot}></span>
                        {cfg.label}
                      </span>
                    </div>

                    <div className={styles.tableCol} style={{ alignItems: 'flex-end' }}>
                      {canDelete && (
                        <button 
                          onClick={(e) => handleHideRequest(e, req.id, req.tracking_number || `Request #${req.id}`)}
                          className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                          title="Remove from dashboard"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Card View */}
            <div className={styles.cardList}>
              {filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const canDelete = ['delivered', 'picked_up', 'completed', 'ready_for_pickup'].includes((req.status || '').toLowerCase());

                return (
                  <div key={req.id} className={styles.card} onClick={() => openDetail(req)}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.cardTitle}>{req.medication_name || 'Prescription'}</div>
                        <div className={styles.cardSub}>#{req.request_number || req.id}</div>
                      </div>
                      <span className={`${styles.badge} ${cfg.styleClass}`}>
                        <span className={styles.badgeDot}></span>
                        {cfg.label}
                      </span>
                    </div>
                    
                    <div className={styles.cardMeta}>
                      <div className={styles.cardMetaRow}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Delivery</span>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{req.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Quantity</span>
                        <span style={{ fontWeight: 500 }}>{req.quantity || 1} units</span>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Date</span>
                        <span style={{ fontWeight: 500 }}>{fmtDate(req.requested_at)}</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardFooter}>
                      <div className={styles.textPrice} style={{ fontSize: '1rem' }}>{fmtMoney(req.total_amount)} ETB</div>
                      {canDelete && (
                        <button 
                          onClick={(e) => handleHideRequest(e, req.id, req.tracking_number || `Request #${req.id}`)}
                          className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                          title="Remove from dashboard"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {confirmDelete && (
        <div className={styles.modal}>
          <div className={styles.detailCard} style={{ width: '100%', maxWidth: '400px' }}>
            <div className={styles.detailSectionTitle} style={{ color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
              <Trash2 size={20} /> Remove Order?
            </div>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              Are you sure you want to remove <strong>{confirmDelete.label}</strong> from your dashboard? This won't cancel the order if it's already in progress.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className={styles.btnDanger} style={{ flex: 1, backgroundColor: 'hsl(0 86% 97%)' }} onClick={confirmHideRequest}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
