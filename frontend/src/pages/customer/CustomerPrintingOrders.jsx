import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/apiClient";
import {
  XCircle, Printer, RefreshCw,
  ArrowLeft, Calendar, FileText, BookOpen,
  CreditCard, CheckCircle2, Clock, AlertTriangle, Trash2, Package
} from "lucide-react";
import SegmentedSpinner from "../../components/ui/SegmentedSpinner";
import styles from "./CustomerPrintingOrders.module.css";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "");

const JOB_STATUS_CONFIG = {
  received:    { label: "Received",          color: "#92400e", bg: "#fffbeb", dot: "#d97706" },
  in_queue:    { label: "In Production",      color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6" },
  in_design:   { label: "In Design",          color: "#5b21b6", bg: "#f5f3ff", dot: "#7c3aed" },
  file_check:  { label: "File Check",         color: "#92400e", bg: "#fff7ed", dot: "#f59e0b" },
  in_printing: { label: "Printing",           color: "#065f46", bg: "#ecfdf5", dot: "#059669" },
  finishing:   { label: "Finishing",          color: "#065f46", bg: "#f0fdf4", dot: "#16a34a" },
  ready:       { label: "Ready for Pickup",   color: "#14532d", bg: "#dcfce7", dot: "#22c55e" },
  delivered:   { label: "Delivered",          color: "#14532d", bg: "#d1fae5", dot: "#10b981" },
  cancelled:   { label: "Cancelled",          color: "#7f1d1d", bg: "#fef2f2", dot: "#ef4444" },
};

const getJobCfg = (code) => JOB_STATUS_CONFIG[code] || JOB_STATUS_CONFIG.received;

const PAY_CFG = {
  Confirmed: { label: "Payment Confirmed",  color: "#14532d", bg: "#dcfce7", border: "#86efac" },
  Pending:   { label: "Awaiting Finance",   color: "#92400e", bg: "#fffbeb", border: "#fcd34d" },
  Rejected:  { label: "Payment Rejected",   color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5" },
};
const getPayCfg = (s) => PAY_CFG[s] || PAY_CFG.Pending;

const TERMINAL = ["delivered", "completed", "ready", "ready_for_pickup", "cancelled"];

const STATUS_TABS = [
  { key: "all",       label: "All Orders" },
  { key: "received",  label: "Received" },
  { key: "in_queue",  label: "In Production" },
  { key: "ready",     label: "Ready for Pickup" },
  { key: "delivered", label: "Delivered" },
];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

export default function CustomerPrintingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast]                 = useState(null);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get("/printing/customer/orders");
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error("Failed to load printing orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get("/printing/customer/orders");
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error("Failed to refresh", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleHideOrder = (e, id, orderNumber) => {
    e.stopPropagation();
    setConfirmDelete({ id, orderNumber });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/printing/customer/orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      showToast("Order removed from your dashboard.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove order.", "error");
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`/printing/orders/${id}/cancel`);
      fetchOrders();
      setSelectedOrder(null);
      showToast("Order cancelled successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Cancellation failed — contact support.", "error");
    }
  };

  const filtered = activeTab === "all"
    ? orders
    : orders.filter(o =>
        activeTab === "in_queue"
          ? ["in_queue", "in_design", "file_check", "in_printing", "finishing"].includes(o.status_code)
          : o.status_code === activeTab
      );

  /* ─── DETAIL VIEW ─────────────────────────────────────────────── */
  if (selectedOrder) {
    const o       = selectedOrder;
    const jobCfg  = getJobCfg(o.status_code);
    const payCfg  = getPayCfg(o.payment_status);

    let attachment = null, docSrc = null, isImage = false;
    if (o.attachments) {
      try {
        const atts = JSON.parse(o.attachments);
        if (atts?.length > 0) attachment = atts[0];
      } catch (_) {}
      if (attachment?.path) {
        docSrc = attachment.path.startsWith("http")
          ? attachment.path
          : `${BASE}/${attachment.path.replace(/\\/g, "/")}`;
      }
      isImage = !!(attachment && attachment.mimeType?.startsWith("image/"));
    }

    return (
      <>
        {selectedImage && (
          <div className={styles.modal} onClick={() => setSelectedImage(null)}>
            <button className={styles.modalClose} onClick={() => setSelectedImage(null)}>
              <XCircle size={32} />
            </button>
            <img src={selectedImage} alt="Document" className={styles.modalImg} onClick={e => e.stopPropagation()} />
          </div>
        )}

        <div className={styles.page}>
          <div className={styles.wrap}>
            <button className={styles.backBtn} onClick={() => setSelectedOrder(null)}>
              <ArrowLeft size={16} /> Back to Printing Orders
            </button>

            <div className={styles.header}>
              <h1 className={styles.pageTitle}>
                <Printer size={24} /> Order #{o.order_number}
              </h1>
              <span
                className={styles.badge}
                style={{ background: jobCfg.bg, color: jobCfg.color }}
              >
                <span className={styles.dot} style={{ background: jobCfg.dot }} />
                {jobCfg.label}
              </span>
            </div>

            {/* Payment banner */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "1rem 1.25rem", borderRadius: "0.75rem",
              background: payCfg.bg, border: `1.5px solid ${payCfg.border}`,
              color: payCfg.color, fontWeight: 600, fontSize: "0.875rem",
              marginBottom: "1.5rem", lineHeight: 1.6,
            }}>
              {o.payment_status === "Confirmed"
                ? <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                : o.payment_status === "Rejected"
                ? <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                : <Clock size={20} style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>
                {o.payment_status === "Confirmed"
                  ? "✅ Payment confirmed by Finance — your order is being processed by the printing team."
                  : o.payment_status === "Rejected"
                  ? "❌ Payment rejected by Finance — please contact support to resolve this."
                  : "⏳ Awaiting Finance confirmation — printing starts once your payment is approved."}
              </div>
            </div>

            {/* Two-column detail grid */}
            <div className={styles.detailGrid}>
              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Printing Details */}
                <div className={styles.detailCard}>
                  <h3 className={styles.detailCardTitle}>
                    <BookOpen size={16} /> Printing Details
                  </h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Service Type</div>
                      <div className={styles.infoValue}>{o.product_type || "—"}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Paper Type</div>
                      <div className={styles.infoValue}>{o.paper_type || "—"}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Binding</div>
                      <div className={styles.infoValue}>{o.binding_type || "None"}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Color</div>
                      <div className={styles.infoValue}>{o.color_printing ? "Color" : "Black & White"}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Quantity</div>
                      <div className={styles.infoValue}>{o.quantity} copy × {o.pages_per_copy} pages</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Due Date</div>
                      <div className={styles.infoValue}>{fmtDate(o.due_date)}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Subtotal</div>
                      <div className={styles.infoValue}>{parseFloat(o.subtotal || 0).toFixed(2)} ETB</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>VAT</div>
                      <div className={styles.infoValue}>{parseFloat(o.vat_amount || 0).toFixed(2)} ETB</div>
                    </div>
                    <div className={`${styles.infoItem} ${styles.infoFullRow}`}>
                      <div className={styles.infoLabel}>Total (incl. VAT)</div>
                      <div className={styles.infoValueLarge}>
                        {parseFloat(o.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                      </div>
                    </div>
                    {o.special_instructions && (
                      <div className={`${styles.infoItem} ${styles.infoFullRow}`}>
                        <div className={styles.infoLabel}>Special Instructions</div>
                        <div style={{ fontSize: "0.875rem", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "0.5rem", padding: "0.75rem 1rem", color: "#92400e", lineHeight: 1.6 }}>
                          {o.special_instructions}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className={styles.detailCard}>
                  <h3 className={styles.detailCardTitle}>
                    <CreditCard size={16} /> Payment Details
                  </h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Payment Method</div>
                      <div className={styles.infoValue}>{o.payment_method || "Not specified"}</div>
                    </div>
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Finance Status</div>
                      <div className={styles.infoValue} style={{ color: payCfg.color, fontWeight: 700 }}>
                        {o.payment_status === "Confirmed" ? "✅ Confirmed" : o.payment_status === "Rejected" ? "❌ Rejected" : "⏳ Pending"}
                      </div>
                    </div>
                    {o.payment_reference && (
                      <div className={styles.infoItem}>
                        <div className={styles.infoLabel}>Transaction Reference</div>
                        <div style={{ fontFamily: "monospace", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.375rem", padding: "0.375rem 0.625rem", fontSize: "0.875rem", color: "#0f172a" }}>
                          {o.payment_reference}
                        </div>
                      </div>
                    )}
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>Order Placed</div>
                      <div className={styles.infoValue}>
                        {new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                </div>

                {o.status_code === "received" && (
                  <div className={styles.cancelWrap}>
                    <button
                      onClick={() => handleCancel(o.id)}
                      className={styles.btnSecondary}
                      style={{ color: '#dc2626', borderColor: '#dc2626' }}
                    >
                      <XCircle size={16} /> Cancel Order
                    </button>
                  </div>
                )}
              </div>

              {/* Right column — Document */}
              <div className={styles.detailCard}>
                <h3 className={styles.detailCardTitle}>
                  <FileText size={16} /> Document Attachment
                </h3>
                {!docSrc ? (
                  <div className={styles.attachEmpty}>
                    <FileText size={40} style={{ color: "#94a3b8" }} />
                    <div className={styles.attachEmptyTitle}>No file attached</div>
                    <div className={styles.attachEmptyDesc}>Bring your document directly to the print shop.</div>
                  </div>
                ) : imgError || !isImage ? (
                  <div className={styles.attachFile}>
                    <FileText size={40} style={{ color: "#059669" }} />
                    <div className={styles.attachFileName}>{attachment?.originalName || "Document File"}</div>
                    <a
                      href={docSrc}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.btnPrimary}
                      style={{ textDecoration: "none" }}
                    >
                      Download File
                    </a>
                  </div>
                ) : (
                  <div className={styles.attachImg} onClick={() => setSelectedImage(docSrc)}>
                    <img
                      src={docSrc}
                      alt="Attached Document"
                      onError={() => setImgError(true)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9100, background: toast.type === "success" ? "#059669" : "#dc2626", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: "0.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </div>
        )}
      </>
    );
  }

  /* ─── LIST VIEW ───────────────────────────────────────────────── */
  return (
    <>
      {selectedImage && (
        <div className={styles.modal} onClick={() => setSelectedImage(null)}>
          <button className={styles.modalClose} onClick={() => setSelectedImage(null)}>
            <XCircle size={32} />
          </button>
          <img src={selectedImage} alt="Doc" className={styles.modalImg} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className={styles.page}>
        <div className={styles.wrap}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              <Printer size={24} /> My Printing Orders
            </h1>
            <div className={styles.actions}>
              <button className={styles.btnIcon} onClick={handleRefresh} disabled={refreshing} title="Refresh">
                {refreshing ? <SegmentedSpinner size={18} /> : <RefreshCw size={18} />}
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate("/services/printing")}>
                + New Order
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                className={`${styles.tab}${activeTab === t.key ? ` ${styles.tabActive}` : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.empty}>
              <SegmentedSpinner size={36} />
              <div className={styles.emptyTitle} style={{ marginTop: "1rem" }}>Loading orders…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Printer size={48} style={{ color: "#94a3b8" }} />
              <div className={styles.emptyTitle}>No printing orders found.</div>
              <button className={styles.btnPrimary} onClick={() => navigate("/services/printing")}>
                Order Print Service
              </button>
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE VIEW ── */}
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <span>Order / Date</span>
                  <span>Service</span>
                  <span>Qty / Pages</span>
                  <span>Payment</span>
                  <span>Job Status</span>
                  <span style={{ textAlign: "right" }}>Actions</span>
                </div>

                {filtered.map((order) => {
                  const jCfg = getJobCfg(order.status_code);
                  const pCfg = getPayCfg(order.payment_status);
                  const isTerminal = TERMINAL.includes((order.status_code || "").toLowerCase());
                  
                  return (
                    <div
                      key={order.id}
                      className={styles.tableRow}
                      onClick={() => { setImgError(false); setSelectedOrder(order); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setSelectedOrder(order)}
                    >
                      <div className={styles.tableCol}>
                        <div className={styles.textPrimary} style={{ color: "#2563eb", letterSpacing: "0.02em" }}>
                          #{order.order_number}
                        </div>
                        <div className={styles.textSecondary}>
                          <Calendar size={11} />
                          {fmtDate(order.created_at)}
                        </div>
                      </div>

                      <div className={styles.tableCol}>
                        <div className={styles.textPrimary} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.product_type}
                        </div>
                        <span className={styles.chip} style={{ width: "fit-content" }}>
                          {order.color_printing ? "Color" : "B&W"}
                        </span>
                      </div>

                      <div className={styles.tableCol}>
                        <div className={styles.textPrimary}>{order.quantity} copies</div>
                        <div className={styles.textSecondary}>{order.pages_per_copy} pages</div>
                      </div>

                      <div className={styles.tableCol}>
                        <div className={styles.textPrice}>
                          {parseFloat(order.total_price || 0).toFixed(2)} ETB
                        </div>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                          fontSize: "0.6875rem", fontWeight: 700,
                          padding: "0.2rem 0.5rem", borderRadius: "999px",
                          background: pCfg.bg, border: `1px solid ${pCfg.border}`, color: pCfg.color,
                          width: "fit-content",
                        }}>
                          {order.payment_status === "Confirmed"
                            ? <CheckCircle2 size={11} />
                            : order.payment_status === "Rejected"
                            ? <AlertTriangle size={11} />
                            : <Clock size={11} />}
                          {pCfg.label}
                        </span>
                      </div>

                      <div>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.3rem 0.625rem", borderRadius: "999px",
                          background: jCfg.bg, color: jCfg.color,
                          fontSize: "0.6875rem", fontWeight: 700, whiteSpace: "nowrap",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: jCfg.dot, display: "inline-block", flexShrink: 0 }} />
                          {jCfg.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.375rem" }}>
                        {isTerminal && (
                          <button
                            onClick={e => handleHideOrder(e, order.id, order.order_number)}
                            title="Remove from dashboard"
                            style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", padding: "0.375rem", borderRadius: "0.375rem", display: "flex", alignItems: "center", transition: "background 0.15s ease" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setImgError(false); setSelectedOrder(order); }}
                          title="View order details"
                          style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "0.375rem", borderRadius: "0.375rem", display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", fontWeight: 600, transition: "background 0.15s ease" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <Package size={14} /> View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── MOBILE CARD VIEW ── */}
              <div className={styles.list}>
                {filtered.map((order) => {
                  const jCfg = getJobCfg(order.status_code);
                  const pCfg = getPayCfg(order.payment_status);
                  const isTerminal = TERMINAL.includes((order.status_code || "").toLowerCase());
                  
                  return (
                    <div
                      key={order.id}
                      className={styles.card}
                      onClick={() => { setImgError(false); setSelectedOrder(order); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setSelectedOrder(order)}
                    >
                      <div className={styles.cardLeft}>
                        <div className={styles.orderNum}>#{order.order_number}</div>
                        <div className={styles.orderName}>
                          {order.product_type}
                          <span className={styles.chip}>{order.color_printing ? "Color" : "B&W"}</span>
                        </div>
                        
                        <div className={styles.meta}>
                          <div className={styles.metaIcon}>
                            <Calendar size={13} /> {fmtDate(order.created_at)}
                          </div>
                          <span className={styles.divider}>•</span>
                          <div className={styles.metaIcon}>
                            <BookOpen size={13} /> {order.paper_type}
                          </div>
                          <span className={styles.divider}>•</span>
                          <div>{order.quantity} copy × {order.pages_per_copy} pp</div>
                        </div>
                      </div>

                      <div className={styles.cardRight}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#059669' }}>
                            {parseFloat(order.total_price || 0).toFixed(2)} ETB
                          </div>
                          <div className={styles.badge} style={{ background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}` }}>
                            {order.payment_status === "Confirmed" ? <CheckCircle2 size={12} /> : order.payment_status === "Rejected" ? <AlertTriangle size={12} /> : <Clock size={12} />}
                            {pCfg.label}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={styles.badge} style={{ background: jCfg.bg, color: jCfg.color }}>
                            <span className={styles.dot} style={{ background: jCfg.dot }} />
                            {jCfg.label}
                          </span>
                          
                          {isTerminal && (
                            <button
                              onClick={e => handleHideOrder(e, order.id, order.order_number)}
                              title="Remove from dashboard"
                              style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", padding: "0.375rem", borderRadius: "0.375rem", display: "flex", alignItems: "center", transition: "background 0.15s ease" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── In-app confirmation modal ── */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", padding: "2rem", maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗑️</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Remove Order?</h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6 }}>
              Order <strong>#{confirmDelete.orderNumber}</strong> will be removed from your dashboard.<br />
              This only hides it for you — the print shop still has your order.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "0.625rem 1.5rem", borderRadius: "0.625rem", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
                Cancel
              </button>
              <button onClick={confirmHideOrder} style={{ padding: "0.625rem 1.5rem", borderRadius: "0.625rem", border: "none", background: "#e53e3e", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9100, background: toast.type === "success" ? "#059669" : "#dc2626", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: "0.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </>
  );
}
