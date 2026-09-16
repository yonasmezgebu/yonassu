import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/apiClient";
import {
  XCircle, Printer, RefreshCw,
  Calendar, FileText, BookOpen,
  CreditCard, CheckCircle2, Clock,
  Trash2, Package, Mail, Phone, Download, ChevronDown
} from "lucide-react";
import SegmentedSpinner from "../../components/ui/SegmentedSpinner";
import FileViewer from "../../components/ui/FileViewer";
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
  ready_for_pickup: { label: "Ready for Pickup", color: "#14532d", bg: "#dcfce7", dot: "#22c55e" },
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

/* One quiet status line for every order — the same shape for all. */
const PROCESSING_CODES = ["in_queue", "in_design", "file_check", "in_printing", "finishing", "in_progress"];
const PROGRESS_STAGES = [
  { key: "received",   label: "Received" },
  { key: "processing", label: "In Production" },
  { key: "ready",      label: "Ready for Pickup" },
  { key: "delivered",  label: "Delivered" },
];
const progressIndex = (code) => {
  const c = String(code || "").toLowerCase();
  if (c === "received") return 0;
  if (PROCESSING_CODES.includes(c)) return 1;
  if (c === "ready" || c === "ready_for_pickup") return 2;
  if (c === "delivered" || c === "completed") return 3;
  return -1;
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

const initialsOf = (name) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";

export default function CustomerPrintingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [openId, setOpenId]               = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWork, setSelectedWork]   = useState(null);
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

  const handleHideOrder = (id, orderNumber) => {
    setConfirmDelete({ id, orderNumber });
  };

  const confirmHideOrder = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`/printing/customer/orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (openId === id) setOpenId(null);
      showToast("Order removed from your dashboard.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove order.", "error");
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`/printing/orders/${id}/cancel`);
      fetchOrders();
      setOpenId(null);
      showToast("Order cancelled successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Cancellation failed — contact support.", "error");
    }
  };

  const toggleOrder = (id) => {
    setImgError(false);
    setOpenId(prev => (prev === id ? null : id));
  };

  const filtered = activeTab === "all"
    ? orders
    : orders.filter(o =>
        activeTab === "in_queue"
          ? ["in_queue", "in_design", "file_check", "in_printing", "finishing"].includes(o.status_code)
          : o.status_code === activeTab
      );

  const renderDetail = (o) => {
    const jobCfg = getJobCfg(o.status_code);
    const payCfg = getPayCfg(o.payment_status);

    let attachment = null, docSrc = null, isImage = false, isDocxDoc = false;
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
      isDocxDoc = String(attachment?.path || "").toLowerCase().endsWith(".docx");
    }

    const curProgress = progressIndex(o.status_code);
    const isTerminal = TERMINAL.includes((o.status_code || "").toLowerCase());

    return (
      <div className={styles.detail}>
        <div className={styles.detailInner}>
          <div className={styles.detailHead}>
            <div className={styles.detailMeta}>
              <span><Calendar size={13} /> Placed {new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span>·</span>
              <span><Clock size={13} /> Due {fmtDate(o.due_date)}</span>
              <span>·</span>
              <span style={{ color: payCfg.color, fontWeight: 600 }}>{payCfg.label}</span>
            </div>
            <span className={styles.statusBadge} style={{ background: jobCfg.bg, color: jobCfg.color }}>
              <span className={styles.rowStatusDot} style={{ background: jobCfg.dot }} />
              {jobCfg.label}
            </span>
          </div>

          {/* Identity — name, email, phone at every order */}
          <div className={styles.contactStrip}>
            <div className={styles.avatar}>{initialsOf(o.customer_name)}</div>
            <div className={styles.contactMain}>
              <div className={styles.contactName}>{o.customer_name || "Customer"}</div>
              <div className={styles.contactLine}>
                <Mail size={14} />
                <a href={o.customer_email ? `mailto:${o.customer_email}` : undefined}>
                  {o.customer_email || "No email on file"}
                </a>
              </div>
              <div className={styles.contactLine}>
                <Phone size={14} />
                <a href={o.customer_phone ? `tel:${o.customer_phone}` : undefined}>
                  {o.customer_phone || "No phone on file"}
                </a>
              </div>
            </div>
          </div>

          <div className={styles.detailBody}>
            {/* Left — print job + payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0 }}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <BookOpen size={17} /> Print Job
                </h3>
                <div className={styles.specList}>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Service type</span>
                    <span className={styles.specValue}>{o.product_type || "—"}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Paper</span>
                    <span className={styles.specValue}>{o.paper_type || "—"}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Binding</span>
                    <span className={styles.specValue}>{o.binding_type || "None"}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Printing</span>
                    <span className={styles.specValue}>{o.color_printing ? "Color" : "Black & White"}</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Quantity</span>
                    <span className={styles.specValue}>{o.quantity} copy × {o.pages_per_copy} pages</span>
                  </div>
                </div>
                {o.special_instructions && (
                  <div className={styles.specialNote}>
                    <strong style={{ fontWeight: 700 }}>Special instructions: </strong>
                    {o.special_instructions}
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <CreditCard size={17} /> Payment
                </h3>
                <div className={styles.specList}>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Method</span>
                    <span className={styles.specValue}>{o.payment_method || "Not specified"}</span>
                  </div>
                  {o.payment_reference && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Reference</span>
                      <span className={styles.mono}>{o.payment_reference}</span>
                    </div>
                  )}
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Subtotal</span>
                    <span className={styles.specValue}>{parseFloat(o.subtotal || 0).toFixed(2)} ETB</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>VAT</span>
                    <span className={styles.specValue}>{parseFloat(o.vat_amount || 0).toFixed(2)} ETB</span>
                  </div>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Total</span>
                    <span className={styles.specValuePrice}>
                      {parseFloat(o.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                    </span>
                  </div>
                </div>
              </section>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {o.status_code === "received" && (
                  <button className={`${styles.btnGhost} ${styles.btnGhostDanger}`} onClick={() => handleCancel(o.id)}>
                    <XCircle size={15} /> Cancel Order
                  </button>
                )}
                {isTerminal && (
                  <button className={styles.btnGhost} onClick={() => handleHideOrder(o.id, o.order_number)}>
                    <Trash2 size={15} /> Hide from dashboard
                  </button>
                )}
              </div>
            </div>

            {/* Right — progress + files */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0 }}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Clock size={17} /> Progress
                </h3>
                <div className={styles.progress}>
                  {PROGRESS_STAGES.map((stage, idx) => {
                    const completed = curProgress >= 0 && idx < curProgress && o.status_code !== "cancelled";
                    const active = o.status_code === "cancelled" ? false : idx === curProgress;
                    return (
                      <div
                        key={stage.key}
                        className={`${styles.progressNode}${completed ? ` ${styles.progressCompleted}` : ""}${active ? ` ${styles.progressActive}` : ""}`}
                      >
                        <span className={styles.progressDot} />
                        <div>
                          <div className={styles.progressLabel}>{stage.label}</div>
                          {active && <div className={styles.progressMeta}>Current stage</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <FileText size={17} /> Order Document
                </h3>
                {!docSrc ? (
                  <div className={styles.attachEmpty}>
                    <FileText size={28} style={{ color: "hsl(40 6% 40%)" }} />
                    <div>No file attached with this order — bring your document to the print shop when you call in.</div>
                  </div>
                ) : imgError || !isImage ? (
                  <button className={styles.fileOpen} style={{ alignSelf: "flex-start", margin: 0 }} onClick={() => {
                    if (isDocxDoc) setSelectedWork({ originalName: attachment?.name || "Order Document", url: docSrc });
                    else window.open(docSrc, "_blank", "noopener,noreferrer");
                  }}>
                    <Download size={15} /> {isDocxDoc ? "Preview document" : "Download document"}
                  </button>
                ) : (
                  <div className={styles.attachImg} onClick={() => setSelectedImage(docSrc)}>
                    <img src={docSrc} alt="Attached Document" onError={() => setImgError(true)} />
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Package size={17} /> Your Work Files
                </h3>
                {o.works?.length > 0 ? (
                  <div className={styles.filesGrid}>
                    {o.works.map(w => {
                      const wUrl = w.url?.startsWith("http") ? w.url : `${BASE}${w.url || ""}`;
                      const isImg = String(w.mimeType || "").toLowerCase().startsWith("image/");
                      return (
                        <div key={w.id} className={styles.fileCard}>
                          <div className={styles.fileThumb}>
                            {isImg ? (
                              <img src={wUrl} alt={w.originalName} loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} />
                            ) : (
                              <div className={styles.fileFallback}>
                                <FileText size={24} />
                              </div>
                            )}
                          </div>
                          <div className={styles.fileMeta}>
                            <span className={styles.fileName}>{w.originalName}</span>
                            <span className={styles.fileSize}>
                              {w.size ? `${(w.size / 1024 / 1024).toFixed(2)} MB` : ""}
                              {w.uploadedAt ? ` · ${new Date(w.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                            </span>
                            {w.message && <span className={styles.fileMsg}>{w.message}</span>}
                          </div>
                          <button className={styles.fileOpen} onClick={() => setSelectedWork({ originalName: w.originalName, url: wUrl })}>
                            <Download size={13} /> Open
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.attachEmpty}>
                    <Package size={28} style={{ color: "hsl(40 6% 40%)" }} />
                    <div>Nothing finished yet — when the print shop uploads your work, the files will appear here.</div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {selectedImage && (
        <div className={styles.modal} onClick={() => setSelectedImage(null)}>
          <button className={styles.modalClose} onClick={() => setSelectedImage(null)} aria-label="Close preview">
            <XCircle size={32} />
          </button>
          <img src={selectedImage} alt="Preview" className={styles.modalImg} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <FileViewer file={selectedWork} onClose={() => setSelectedWork(null)} />

      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              <Printer size={22} /> Print Orders
            </h1>
            <div className={styles.actions}>
              <button className={styles.btnIcon} onClick={handleRefresh} disabled={refreshing} title="Refresh">
                {refreshing ? <SegmentedSpinner size={17} /> : <RefreshCw size={17} />}
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate("/services/printing")}>
                New order
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs} role="tablist">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`${styles.tab}${activeTab === t.key ? ` ${styles.tabActive}` : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.loading}>
              <SegmentedSpinner size={32} />
              <span>Loading orders…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Printer size={40} style={{ color: "hsl(40 6% 40%)" }} />
              <div className={styles.emptyTitle}>No printing orders yet</div>
              <p style={{ fontSize: "0.875rem", maxWidth: "20rem" }}>Orders you place from the Printing service will appear here.</p>
              <button className={styles.btnPrimary} style={{ marginTop: "0.75rem" }} onClick={() => navigate("/services/printing")}>
                Order print service
              </button>
            </div>
          ) : (
            <div className={styles.listStack}>
              {filtered.map(order => {
                const jCfg = getJobCfg(order.status_code);
                const isOpen = openId === order.id;
                return (
                  <div key={order.id} className={`${styles.orderBlock}${isOpen ? ` ${styles.orderOpen}` : ""}`}>
                    {/* Row — one line per order */}
                    <div className={styles.orderRow}>
                      <div className={styles.rowMain}>
                        <div className={styles.rowTop}>
                          <span className={styles.orderNum}>#{order.order_number}</span>
                          <span className={styles.rowStatus} style={{ background: jCfg.bg, color: jCfg.color }}>
                            <span className={styles.rowStatusDot} style={{ background: jCfg.dot }} />
                            {jCfg.label}
                          </span>
                        </div>
                        <div className={styles.rowMeta}>
                          <span>{order.product_type}</span>
                          <span>·</span>
                          <span>{order.quantity} × {order.pages_per_copy} pp</span>
                          <span>·</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <Calendar size={12} /> {fmtDate(order.created_at)}
                          </span>
                        </div>
                        <div className={styles.rowMeta}>
                          <span className={styles.rowMetaStrong}>{initialsOf(order.customer_name)} · {order.customer_name || "—"}</span>
                          <span>·</span>
                          <span>{order.customer_phone || "No phone"}</span>
                        </div>
                        {order.works?.length > 0 && (
                          <span className={styles.rowFiles}>
                            <CheckCircle2 size={13} /> {order.works.length} file{order.works.length > 1 ? "s" : ""} ready
                          </span>
                        )}
                      </div>

                      {/* Far-right end — price + chevron toggle */}
                      <div className={styles.rowEnd}>
                        <span className={styles.rowPrice}>
                          {parseFloat(order.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                        </span>
                        <button
                          className={`${styles.toggle}${isOpen ? ` ${styles.toggleOpen}` : ""}`}
                          onClick={() => toggleOrder(order.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? `Hide details for order ${order.order_number}` : `Show details for order ${order.order_number}`}
                          title={isOpen ? "Hide details" : "Show details"}
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Detail — expands below the row, chevron hides it */}
                    {isOpen && renderDetail(order)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── In-app confirmation modal ── */}
      {confirmDelete && (
        <div className={styles.modal} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <span className={styles.modalEmoji}>🗑️</span>
            <h3 className={styles.modalTitle}>Remove order?</h3>
            <p className={styles.modalText}>
              Order <strong>#{confirmDelete.orderNumber}</strong> will be hidden from your dashboard.<br />
              The print shop still keeps your order — this only cleans up your view.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button className={`${styles.btnGhost} ${styles.btnGhostDanger}`} onClick={confirmHideOrder}>Yes, hide</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          <span>{toast.type === "success" ? "✓" : "!"}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}