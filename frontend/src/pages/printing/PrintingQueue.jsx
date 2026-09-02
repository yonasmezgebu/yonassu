import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { List, RefreshCw, Lock } from "lucide-react";
import { StageStyles } from "./printingStageStyles";
import StageNav from "./StageNav";

const priorityColors = { Normal: "#64748b", Urgent: "#f59e0b", Rush: "#dc2626" };
const priorityRank   = { Rush: 1, Urgent: 2, Normal: 3 };

const STATUS_LABELS = {
  received:    "Received",
  in_queue:    "Job Queue",
  in_design:   "In Design",
  file_check:  "File Check",
  in_printing: "In Printing",
  finishing:   "Finishing",
  ready:       "Ready for Delivery",
  delivered:   "Delivered",
  cancelled:   "Cancelled",
};
const STATUS_COLORS = {
  received:    { bg: "#fffbeb", color: "#92400e" },
  in_queue:    { bg: "#eff6ff", color: "#1e40af" },
  in_design:   { bg: "#f5f3ff", color: "#5b21b6" },
  file_check:  { bg: "#fff7ed", color: "#92400e" },
  in_printing: { bg: "#ecfdf5", color: "#065f46" },
  finishing:   { bg: "#f0fdf4", color: "#065f46" },
  ready:       { bg: "#dcfce7", color: "#14532d" },
  delivered:   { bg: "#d1fae5", color: "#14532d" },
  cancelled:   { bg: "#fef2f2", color: "#7f1d1d" },
};
const getStatusStyle = (code) => STATUS_COLORS[code] || { bg: "#f1f5f9", color: "#475569" };

const NEXT_STATUS = {
  received:    "in_queue",
  in_queue:    "in_design",
  in_design:   "file_check",
  file_check:  "in_printing",
  in_printing: "finishing",
  finishing:   "ready",
  ready:       "delivered",
};

const getDaysRemaining = (due_date) => {
  if (!due_date) return null;
  const ms = new Date(due_date) - new Date();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const PrintingQueue = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [movingId, setMovingId]       = useState(null);
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPayment, setFilterPayment]   = useState("All");
  const [search, setSearch]           = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/printing/orders", { params: { limit: 200 } });
      const rawOrders = res.data?.orders || res.data || [];
      setOrders(rawOrders.filter(o => o.status_code !== "delivered" && o.status_code !== "cancelled"));
    } catch (err) {
      console.error("Failed to load printing orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMove = async (order) => {
    const nextStatus = NEXT_STATUS[order.status_code];
    if (!nextStatus) return;
    if (order.payment_status !== "Confirmed") {
      alert("Cannot advance order: Payment has not been confirmed by Finance yet.\n\nPlease wait for Finance to approve the payment first.");
      return;
    }
    if (!window.confirm(`Move order ${order.order_number} to "${STATUS_LABELS[nextStatus] || nextStatus}"?`)) return;
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: nextStatus });
      await load();
    } catch (err) {
      alert(err?.message || "Failed to update order status.");
    } finally {
      setMovingId(null);
    }
  };

  const filtered = orders
    .filter(o => {
      const matchStatus  = filterStatus  === "All" || o.status_code === filterStatus;
      const matchPayment = filterPayment === "All" || (o.payment_status || "Pending") === filterPayment;
      const matchSearch  = !search ||
        (o.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchPayment && matchSearch;
    })
    .sort((a, b) => {
      if ((a.due_date ? 1 : 0) !== (b.due_date ? 1 : 0)) return (a.due_date ? 1 : 0) - (b.due_date ? 1 : 0);
      return new Date(a.due_date || 0) - new Date(b.due_date || 0);
    });

  const pendingPayCount = orders.filter(o => !o.payment_status || o.payment_status === "Pending").length;

  return (
    <div className="stg-root" style={{ margin: "-24px", minHeight: "calc(100vh - 64px)" }}>
      <StageStyles />
      <StageNav current="queue" />
      <div className="stg-head">
        <h1 className="stg-title">
          <List color="#2563EB" /> JOB QUEUE
        </h1>
        <p className="stg-sub">All active orders. Payment must be confirmed by Finance before production can start.</p>
      </div>

      {pendingPayCount > 0 && (
        <div style={{ margin: "0 24px 16px", padding: "12px 18px", borderRadius: 10, background: "#fffbeb", border: "1.5px solid #fcd34d", color: "#92400e", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          <Lock size={16} />
          {pendingPayCount} order{pendingPayCount > 1 ? "s" : ""} awaiting Finance payment confirmation — they cannot be moved to production yet.
        </div>
      )}

      <div className="stg-toolbar">
        <div className="stg-field stg-field--grow">
          <label className="stg-label">Search</label>
          <input className="stg-input" placeholder="Order # or Customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stg-field">
          <label className="stg-label">Job Status</label>
          <select className="stg-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            {Object.entries(STATUS_LABELS).filter(([k]) => k !== "delivered" && k !== "cancelled").map(([code, lbl]) => (
              <option key={code} value={code}>{lbl}</option>
            ))}
          </select>
        </div>
        <div className="stg-field">
          <label className="stg-label">Payment</label>
          <select className="stg-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            style={{ borderColor: filterPayment === "Pending" ? "#f59e0b" : undefined }}>
            <option value="All">All Payments</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="stg-field" style={{ alignSelf: "flex-end" }}>
          <button className="stg-btn stg-btn--soft-blue stg-btn--sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} style={{ marginRight: 4 }} /> {refreshing ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="stg-table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading orders...</div>
        ) : (
          <div className="stg-table-scroll">
            <table className="stg-table">
              <thead>
                <tr>
                  {["Order #", "Customer", "Service", "Qty", "Total (ETB)", "Payment Status", "Job Status", "Due Date", "Action"].map(col => (
                    <th key={col} className="stg-th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const days     = getDaysRemaining(order.due_date);
                  const stStyle  = getStatusStyle(order.status_code);
                  const isPaid   = order.payment_status === "Confirmed";
                  const nextSt   = NEXT_STATUS[order.status_code];
                  const isMoving = movingId === order.id;

                  return (
                    <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/printing/orders/${order.id}`)}>
                      <td className="stg-td stg-strong" onClick={e => e.stopPropagation()} style={{ cursor: "default" }}>{order.order_number}</td>
                      <td className="stg-td">{order.customer_name || "Walk-in"}</td>
                      <td className="stg-td stg-muted">{order.product_type || "—"}</td>
                      <td className="stg-td" style={{ textAlign: "right" }}>{order.quantity}</td>
                      <td className="stg-td" style={{ textAlign: "right", fontWeight: 700 }}>{parseFloat(order.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })}</td>

                      {/* Payment status */}
                      <td className="stg-td" onClick={e => e.stopPropagation()} style={{ cursor: "default", background: isPaid ? "rgba(220,252,231,0.3)" : "rgba(255,237,213,0.4)", minWidth: 170 }}>
                        {isPaid ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#14532d", fontWeight: 700, fontSize: 12 }}>
                            ✅ Confirmed
                          </span>
                        ) : (
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#fffbeb", color: "#92400e", fontWeight: 700, fontSize: 12 }}>
                              ⏳ Awaiting Finance
                            </span>
                            <div style={{ fontSize: 10, color: "#c2410c", marginTop: 4, fontWeight: 700 }}>
                              <Lock size={10} style={{ verticalAlign: "middle", marginRight: 2 }} />
                              Cannot process yet
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Job status */}
                      <td className="stg-td" onClick={e => e.stopPropagation()} style={{ cursor: "default" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: stStyle.bg, color: stStyle.color, fontWeight: 700, fontSize: 12 }}>
                          {STATUS_LABELS[order.status_code] || order.status_name || order.status_code}
                        </span>
                      </td>

                      {/* Due date */}
                      <td className="stg-td">
                        {order.due_date ? (
                          <span style={{ color: days !== null && days < 0 ? "#dc2626" : days === 0 ? "#d97706" : "#16a34a", fontWeight: 700, fontSize: 12 }}>
                            {days !== null && days < 0 ? `Overdue (${Math.abs(days)}d)` : days === 0 ? "Due Today" : days !== null ? `${days}d` : "—"}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Action */}
                      <td className="stg-td" onClick={e => e.stopPropagation()}>
                        {nextSt ? (
                          isPaid ? (
                            <button
                              className="stg-btn stg-btn--soft-blue stg-btn--sm"
                              disabled={isMoving}
                              onClick={() => handleMove(order)}
                            >
                              {isMoving ? "Moving..." : `→ ${STATUS_LABELS[nextSt] || nextSt}`}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                              <Lock size={12} /> Locked
                            </span>
                          )
                        ) : (
                          <span className="stg-note">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="stg-td" colSpan={9}>
                      <div className="stg-empty">No orders in queue matching your filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintingQueue;
