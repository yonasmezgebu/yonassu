import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/apiClient";
import {
  XCircle, Printer, RefreshCw,
  ArrowLeft, Calendar, FileText, BookOpen,
  CreditCard, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import SegmentedSpinner from "../../components/ui/SegmentedSpinner";
import styles from "./CustomerPrintingOrders.module.css";

const BASE = "http://localhost:5000";

const JOB_STATUS_CONFIG = {
  received:    { label: "Received — Awaiting Finance",  color: "#92400e", bg: "#fffbeb", dot: "#d97706" },
  in_queue:    { label: "Job Queue — In Production",    color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6" },
  in_design:   { label: "In Design",                    color: "#5b21b6", bg: "#f5f3ff", dot: "#7c3aed" },
  file_check:  { label: "File Check",                   color: "#92400e", bg: "#fff7ed", dot: "#f59e0b" },
  in_printing: { label: "In Printing",                  color: "#065f46", bg: "#ecfdf5", dot: "#059669" },
  finishing:   { label: "Finishing",                    color: "#065f46", bg: "#f0fdf4", dot: "#16a34a" },
  ready:       { label: "Ready for Pickup",             color: "#14532d", bg: "#dcfce7", dot: "#22c55e" },
  delivered:   { label: "Delivered",                    color: "#14532d", bg: "#d1fae5", dot: "#10b981" },
  cancelled:   { label: "Cancelled",                    color: "#7f1d1d", bg: "#fef2f2", dot: "#ef4444" },
};

const getJobCfg = (code) => JOB_STATUS_CONFIG[code] || JOB_STATUS_CONFIG.received;

const PAY_CFG = {
  Confirmed: { label: "Payment Confirmed by Finance", color: "#14532d", bg: "#dcfce7", border: "#86efac" },
  Pending:   { label: "Awaiting Finance Confirmation", color: "#92400e", bg: "#fffbeb", border: "#fcd34d" },
  Rejected:  { label: "Payment Rejected by Finance",  color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5" },
};
const getPayCfg = (s) => PAY_CFG[s] || PAY_CFG.Pending;

const STATUS_TABS = [
  { key: "all",       label: "All Orders" },
  { key: "received",  label: "Received" },
  { key: "in_queue",  label: "In Production" },
  { key: "ready",     label: "Ready for Pickup" },
  { key: "delivered", label: "Delivered" },
];

export default function CustomerPrintingOrders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [imgError, setImgError]           = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
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

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this printing order?")) return;
    try {
      await axios.delete(`/printing/orders/${id}/cancel`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || "Cancellation requires contacting support for printing orders.");
    }
  };

  const filtered = activeTab === "all"
    ? orders
    : orders.filter(o =>
        activeTab === "in_queue"
          ? ["in_queue","in_design","file_check","in_printing","finishing"].includes(o.status_code)
          : o.status_code === activeTab
      );

  const o      = selectedOrder;
  const jobCfg = o ? getJobCfg(o.status_code) : null;
  const payCfg = o ? getPayCfg(o.payment_status) : null;
  let attachment = null, docSrc = null, isImage = false;
  if (o && o.attachments) {
    try {
      const atts = JSON.parse(o.attachments);
      if (atts && atts.length > 0) attachment = atts[0];
    } catch (_) {}
    if (attachment?.path) {
      docSrc = attachment.path.startsWith("http")
        ? attachment.path
        : `${BASE}/${attachment.path.replace(/\\/g, "/")}`;
    }
    isImage = !!(attachment && attachment.mimeType?.startsWith("image/"));
  }

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "0 0 48px" },
    wrap: { maxWidth: 920, margin: "0 auto", padding: "24px 20px" },
    hdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" },
    title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 },
    backBtn: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, marginBottom: 16, padding: 0 },
    actRow: { display: "flex", gap: 10, alignItems: "center" },
    btnPri: { padding: "9px 18px", borderRadius: 9, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" },
    btnDgr: { padding: "9px 18px", borderRadius: 9, background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
    btnIco: { padding: 8, borderRadius: 9, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
    tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    list: { display: "flex", flexDirection: "column", gap: 14 },
    sec: { background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: 20, marginBottom: 16 },
    secTit: { margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" },
    it: { display: "flex", flexDirection: "column", gap: 3 },
    itF: { display: "flex", flexDirection: "column", gap: 3, gridColumn: "1 / -1" },
    lbl: { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
    val: { fontSize: 14, color: "#1e293b", fontWeight: 600 },
    valLg: { fontSize: 20, color: "#059669", fontWeight: 800 },
    chip: { display: "inline-block", marginLeft: 8, padding: "2px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600, verticalAlign: "middle" },
    empty: { textAlign: "center", padding: "60px 20px", color: "#94a3b8" },
  };

  const tabStyle = (a) => ({
    padding: "7px 16px", borderRadius: 8,
    border: `1.5px solid ${a ? "#2563eb" : "#e2e8f0"}`,
    background: a ? "#eff6ff" : "#fff",
    color: a ? "#2563eb" : "#64748b",
    fontWeight: 700, fontSize: 13, cursor: "pointer"
  });

  return (
    <div style={S.page}>
      {selectedImage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedImage(null)}>
          <button style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", cursor: "pointer" }} onClick={() => setSelectedImage(null)}>
            <XCircle size={32} />
          </button>
          <img src={selectedImage} alt="Doc" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      {selectedOrder ? (
        <div style={S.wrap}>
          <button style={S.backBtn} onClick={() => setSelectedOrder(null)}>
            <ArrowLeft size={16} /> Back to Printing Orders
          </button>
          <div style={S.hdr}>
            <h1 style={S.title}><Printer size={22} /> Order #{o.order_number}</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: jobCfg.bg, color: jobCfg.color, fontWeight: 700, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: jobCfg.dot, display: "inline-block" }} />
              {jobCfg.label}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", borderRadius: 12, background: payCfg.bg, border: `1.5px solid ${payCfg.border}`, color: payCfg.color, fontWeight: 700, fontSize: 14, marginBottom: 20 }}>
            {o.payment_status === "Confirmed" ? <CheckCircle2 size={20} style={{ flexShrink: 0 }} /> : o.payment_status === "Rejected" ? <AlertTriangle size={20} style={{ flexShrink: 0 }} /> : <Clock size={20} style={{ flexShrink: 0 }} />}
            <div>
              {o.payment_status === "Confirmed"
                ? "✅ Payment Confirmed by Finance — Your order is being processed by the printing team."
                : o.payment_status === "Rejected"
                ? "❌ Payment Rejected by Finance — Please contact support."
                : "⏳ Awaiting Finance Confirmation — Your payment is under review. Printing will start once Finance approves."}
            </div>
          </div>

          <div style={S.sec}>
            <h3 style={S.secTit}><BookOpen size={16} /> Printing Details</h3>
            <div style={S.grid2}>
              <div style={S.it}><div style={S.lbl}>Service Type</div><div style={S.val}>{o.product_type}</div></div>
              <div style={S.it}><div style={S.lbl}>Paper Type</div><div style={S.val}>{o.paper_type}</div></div>
              <div style={S.it}><div style={S.lbl}>Binding</div><div style={S.val}>{o.binding_type || "None"}</div></div>
              <div style={S.it}><div style={S.lbl}>Color Printing</div><div style={S.val}>{o.color_printing ? "Yes — Color" : "No — Black & White"}</div></div>
              <div style={S.it}><div style={S.lbl}>Quantity</div><div style={S.val}>{o.quantity} copy × {o.pages_per_copy} pages</div></div>
              <div style={S.it}><div style={S.lbl}>Due Date</div><div style={S.val}>{o.due_date ? new Date(o.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set"}</div></div>
              <div style={S.it}><div style={S.lbl}>Subtotal</div><div style={S.val}>{parseFloat(o.subtotal || 0).toFixed(2)} ETB</div></div>
              <div style={S.it}><div style={S.lbl}>VAT</div><div style={S.val}>{parseFloat(o.vat_amount || 0).toFixed(2)} ETB</div></div>
              <div style={S.itF}>
                <div style={S.lbl}>Total Amount (incl. VAT)</div>
                <div style={S.valLg}>{parseFloat(o.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB</div>
              </div>
              {o.special_instructions && (
                <div style={S.itF}>
                  <div style={S.lbl}>Special Instructions</div>
                  <div style={{ ...S.val, color: "#92400e", background: "#fffbeb", padding: "8px 12px", borderRadius: 8 }}>{o.special_instructions}</div>
                </div>
              )}
            </div>
          </div>

          <div style={S.sec}>
            <h3 style={S.secTit}><CreditCard size={16} /> Payment Details</h3>
            <div style={S.grid2}>
              <div style={S.it}><div style={S.lbl}>Payment Method</div><div style={S.val}>{o.payment_method || "Not specified"}</div></div>
              <div style={S.it}>
                <div style={S.lbl}>Finance Status</div>
                <div style={{ ...S.val, color: payCfg.color, fontWeight: 800 }}>
                  {o.payment_status === "Confirmed" ? "✅ Confirmed" : o.payment_status === "Rejected" ? "❌ Rejected" : "⏳ Pending"}
                </div>
              </div>
              {o.payment_reference && (
                <div style={S.it}>
                  <div style={S.lbl}>Transaction Reference</div>
                  <div style={{ ...S.val, fontFamily: "monospace", background: "#f8fafc", padding: "4px 8px", borderRadius: 6 }}>{o.payment_reference}</div>
                </div>
              )}
              <div style={S.it}><div style={S.lbl}>Order Placed</div><div style={S.val}>{new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</div></div>
            </div>
          </div>

          <div style={S.sec}>
            <h3 style={S.secTit}><FileText size={16} /> Document Attachment</h3>
            {!docSrc ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                <FileText size={36} /><div style={{ marginTop: 8 }}>No document attached — bring it to the shop.</div>
              </div>
            ) : imgError || !isImage ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileText size={36} color="#64748b" />
                <div>
                  <div style={{ fontWeight: 700 }}>{attachment?.originalName || "Document File"}</div>
                  <a href={docSrc} target="_blank" rel="noreferrer" style={{ ...S.btnPri, display: "inline-block", marginTop: 8, textDecoration: "none" }}>Download File</a>
                </div>
              </div>
            ) : (
              <div onClick={() => setSelectedImage(docSrc)} style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", maxWidth: 360 }}>
                <img src={docSrc} alt="Attached Document" style={{ width: "100%" }} onError={() => setImgError(true)} />
              </div>
            )}
          </div>

          {o.status_code === "received" && (
            <button style={S.btnDgr} onClick={() => handleCancel(o.id)}>
              <XCircle size={16} /> Cancel Order
            </button>
          )}
        </div>

      ) : (
        <div style={S.wrap}>
          <div style={S.hdr}>
            <h1 style={S.title}><Printer size={24} /> My Printing Orders</h1>
            <div style={S.actRow}>
              <button style={S.btnIco} onClick={handleRefresh} disabled={refreshing} title="Refresh">
                {refreshing ? <SegmentedSpinner size={18} /> : <RefreshCw size={18} />}
              </button>
              <button style={S.btnPri} onClick={() => navigate("/services/printing")}>+ New Order</button>
            </div>
          </div>
          <div style={S.tabs}>
            {STATUS_TABS.map(t => (
              <button key={t.key} style={tabStyle(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
            ))}
          </div>
          {loading ? (
            <div style={S.empty}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div style={S.empty}>
              <Printer size={48} />
              <div style={{ fontWeight: 700, margin: "12px 0" }}>No printing orders found.</div>
              <button style={S.btnPri} onClick={() => navigate("/services/printing")}>Order Print Service</button>
            </div>
          ) : (
            <div style={S.list}>
              {filtered.map(order => {
                const jCfg = getJobCfg(order.status_code);
                const pCfg = getPayCfg(order.payment_status);
                return (
                  <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    onClick={() => { setImgError(false); setSelectedOrder(order); }} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setSelectedOrder(order)}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#2563eb", letterSpacing: 0.5, marginBottom: 4 }}>ORDER #{order.order_number}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        {order.product_type}
                        <span style={S.chip}>{order.color_printing ? "Color" : "B&W"}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", gap: 4, alignItems: "center" }}><BookOpen size={12} />{order.paper_type}</span>
                        <span>|</span>
                        <span>Qty {order.quantity} x {order.pages_per_copy}pp</span>
                        <span>|</span>
                        <span style={{ fontWeight: 700, color: "#059669", fontSize: 13 }}>{parseFloat(order.total_price || 0).toFixed(2)} ETB</span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: pCfg.bg, border: `1px solid ${pCfg.border}`, color: pCfg.color, fontSize: 11, fontWeight: 700 }}>
                        {order.payment_status === "Confirmed" ? <CheckCircle2 size={12} /> : order.payment_status === "Rejected" ? <AlertTriangle size={12} /> : <Clock size={12} />}
                        {pCfg.label}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 4, alignItems: "center" }}>
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: jCfg.bg, color: jCfg.color, fontWeight: 700, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: jCfg.dot, display: "inline-block" }} />
                        {jCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
