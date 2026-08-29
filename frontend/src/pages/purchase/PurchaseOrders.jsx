import React, { useState, useEffect } from 'react';
import { ShoppingCart, Download, Plus, Send, AlertCircle, FileText, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './PurchaseOrders.module.css';

const statusColors = {
  Draft:     { bg: '#f1f5f9', color: '#475569' },
  Pending:   { bg: '#fef3c7', color: '#92400e' },
  Approved:  { bg: '#e0e7ff', color: '#3730a3' },
  Sent:      { bg: '#eff6ff', color: '#2563eb' },
  Received:  { bg: '#dcfce7', color: '#16a34a' },
  Cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

const emptyForm = {
  supplierId: 1, // default for now, could be loaded from API
  expectedDeliveryDate: '',
  sectorId: 1,
  notes: '',
  items: [{ productName: '', quantityOrdered: '', unitPrice: '' }]
};

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/purchase/orders');
      const data = res.data;
      const ordersArray = Array.isArray(data) ? data : (data?.orders || data?.purchaseOrders || []);
      setOrders(ordersArray);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Format payload
      const payload = {
        ...form,
        items: form.items.map(item => ({
          productName: item.productName,
          quantityOrdered: parseInt(item.quantityOrdered, 10),
          unitPrice: parseFloat(item.unitPrice)
        }))
      };
      await apiClient.post('/purchase/orders', payload);
      showToast('Purchase Order created successfully');
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to create PO', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orders.filter(o => {
    const sName = o.supplier_name || 'Supplier';
    return (filterStatus === 'All' || o.status_name === filterStatus) &&
           (!filterSupplier || sName.toLowerCase().includes(filterSupplier.toLowerCase()));
  });

  const calcFormTotal = () => {
    return form.items.reduce((sum, item) => {
      const q = parseFloat(item.quantityOrdered) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + (q * p);
    }, 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            <ShoppingCart size={26} /> PURCHASE ORDERS
          </h1>
          <p className={styles.subtitle}>Create and track POs sent to suppliers.</p>
          
          <div className={styles.navTabs}>
            <button className={`${styles.navTab} ${styles.navTabInactive}`} onClick={() => navigate('/purchase/requests')}>
              <FileText size={16} /> Purchase Requests
            </button>
            <button className={`${styles.navTab} ${styles.navTabActive}`} onClick={() => navigate('/purchase/orders')}>
              <ShoppingCart size={16} /> Purchase Orders
            </button>
            <button className={`${styles.navTab} ${styles.navTabInactive}`} onClick={() => navigate('/purchase/returns')}>
              <RotateCcw size={16} /> Purchase Returns
            </button>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleOpenModal}>
            <Plus size={16} /> Create PO
          </button>
          <button className={styles.btnSecondary}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Supplier Name</label>
            <input 
              className={styles.inputFilter}
              placeholder="Search Supplier..." 
              value={filterSupplier} 
              onChange={e => setFilterSupplier(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Status</label>
            <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>PO #</th>
              <th>Date</th>
              <th>Supplier</th>
              <th className={styles.textRight}>Total Amount</th>
              <th>Expected By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.emptyState}>Loading orders...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className={styles.emptyState} style={{ color: '#ef4444' }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyState}>No purchase orders found.</td></tr>
            ) : (
              filtered.map(o => {
                const sc = statusColors[o.status_name] || statusColors.Draft;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.po_number}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{o.supplier_name || 'Supplier'}</td>
                    <td className={styles.textRight} style={{ fontWeight: 700 }}>ETB {parseFloat(o.total_amount).toLocaleString()}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>
                        {o.status_name}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3><ShoppingCart size={20} /> Create Purchase Order</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePO}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Expected Delivery Date <span className={styles.required}>*</span></label>
                    <input 
                      type="date" 
                      className={styles.inputField} 
                      value={form.expectedDeliveryDate} 
                      onChange={e => setForm({...form, expectedDeliveryDate: e.target.value})}
                      required 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Item / Product Name <span className={styles.required}>*</span></label>
                    <input 
                      className={styles.inputField} 
                      value={form.items[0].productName} 
                      onChange={e => setForm({
                        ...form, 
                        items: [{...form.items[0], productName: e.target.value}]
                      })}
                      placeholder="Product details..."
                      required 
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quantity <span className={styles.required}>*</span></label>
                    <input 
                      type="number" 
                      min="1"
                      className={styles.inputField} 
                      value={form.items[0].quantityOrdered} 
                      onChange={e => setForm({
                        ...form, 
                        items: [{...form.items[0], quantityOrdered: e.target.value}]
                      })}
                      required 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Unit Price (ETB) <span className={styles.required}>*</span></label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className={styles.inputField} 
                      value={form.items[0].unitPrice} 
                      onChange={e => setForm({
                        ...form, 
                        items: [{...form.items[0], unitPrice: e.target.value}]
                      })}
                      required 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Notes</label>
                  <textarea 
                    className={styles.inputField} 
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    value={form.notes} 
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Additional details..."
                  />
                </div>
                
                <div className={styles.totalBox}>
                  <div className={styles.totalBoxLabel}>Total Amount (Excl. Tax)</div>
                  <div className={styles.totalBoxValue}>
                    ETB {calcFormTotal().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  <Send size={15} /> {submitting ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
