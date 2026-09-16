import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { List, RefreshCw, Lock, Trash2 } from "lucide-react";
import { StageStyles } from "./printingStageStyles";
import StageNav from "./StageNav";
import StageConfirmModal from "./StageConfirmModal";
import { NEXT_STATUS, getStatusStyle, STATUS_LABELS } from "./printingStageConfig";

const priorityColors = { Normal: "#64748b", Urgent: "#f59e0b", Rush: "#dc2626" };
const priorityRank   = { Rush: 1, Urgent: 2, Normal: 3 };

const PENDING_CODES = ["received", "in_queue"];
const STAGE_HINT = {
  in_design:   { label: "Design stage",   path: "/printing-manager/jobs/design" },
  file_check:  { label: "Prepress stage", path: "/printing-manager/jobs/prepress" },
  in_printing: { label: "In Print stage", path: "/printing-manager/jobs/printing" },
  in_progress: { label: "In Print stage", path: "/printing-manager/jobs/printing" },
  finishing:   { label: "Finishing stage", path: "/printing-manager/jobs/finishing" },
  ready:       { label: "Delivery stage", path: "/printing-manager/jobs/delivery" },
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
  const [confirm, setConfirm]         = useState(null);
  const [lockNotice, setLockNotice]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
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
      setLockNotice(order);
      return;
    }
    setConfirm(order);
  };

  const doConfirmMove = async () => {
    if (!confirm) return;
    const order = confirm;
    setMovingId(order.id);
    try {
      await apiClient.put(`/printing/orders/${order.id}/status`, { status: NEXT_STATUS[order.status_code] });
      await load();
    } catch (err) {
      alert(err?.message || "Failed to update order status.");
    } finally {
      setMovingId(null);
      setConfirm(null);
    }
  };

  const handleDeleteRequest = (order) => {
    if (order.payment_status === "Confirmed" || order.payment_status === "PAID") return;
    setDeleteTarget(order);
  };

  const doConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    try {
      await apiClient.delete(`/printing/orders/${id}`);
      await load();
    } catch (err) {
      alert(err?.message || "Failed to delete order.");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
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
                  const isPendingStage = PENDING_CODES.includes(order.status_code);

                  return (
                    <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/printing-manager/orders/${order.id}`)}>
                      <td className="stg-td stg-strong" onClick={e => e.stopPropagation()} style={{ cursor: "default" }}>{order.order_number}</td>
                      <td className="stg-td">{order.customer_name || "Walk-in"}</td>
                      <td className="stg-td stg-muted">{order.product_type || "—"}</td>
                      <td className="stg-td" style={{ textAlign: "right" }}>{order.quantity}</td>
                      <td className="stg-td" style={{ textAlign: "right", fontWeight: 700 }}>{parseFloat(order.total_price || 0).toLocaleString("en-ET", { minimumFractionDigits: 2 })}</td>

{/* Payment status */}
                      <td className="stg-td" onClick={e => e.stopPropagation()} style={{ cursor: "default", background: isPaid ? "rgba(220,252,231,0.3)" : order.payment_status === "Rejected" ? "rgba(254,226,226,0.4)" : "rgba(255,237,213,0.4)", minWidth: 190 }}>
                        {isPaid ? (
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#14532d", fontWeight: 700, fontSize: 12 }}>
                              ✅ Confirmed
                            </span>
                            {order.payment_method && (
                              <div style={{ fontSize: 10, color: "#15803d", marginTop: 4, fontWeight: 700 }}>💳 {order.payment_method}{order.payment_reference ? ` · ${order.payment_reference}` : ''}</div>
                            )}
                          </div>
                        ) : order.payment_status === "Rejected" ? (
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#fee2e2", color: "#7f1d1d", fontWeight: 700, fontSize: 12 }}>
                              ❌ Rejected
                            </span>
                            {order.payment_method && (
                              <div style={{ fontSize: 10, color: "#b91c1c", marginTop: 4, fontWeight: 700 }}>💳 {order.payment_method}{order.payment_reference ? ` · ${order.payment_reference}` : ''}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "#fffbeb", color: "#92400e", fontWeight: 700, fontSize: 12 }}>
                              ⏳ Awaiting Finance
                            </span>
                            {order.payment_method ? (
                              <div style={{ fontSize: 10, color: "#c2410c", marginTop: 4, fontWeight: 700 }}>
                                💳 {order.payment_method}{order.payment_reference ? ` · ${order.payment_reference}` : ''}
                              </div>
                            ) : null}
                            <div style={{ fontSize: 10, color: "#c2410c", marginTop: 3, fontWeight: 700 }}>
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
                      <td className="stg-td" onClick={e => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {nextSt ? (
                            isPaid ? (
                              isPendingStage ? (
                                <button
                                  className="stg-btn stg-btn--soft-blue stg-btn--sm"
                                  disabled={isMoving}
                                  onClick={() => handleMove(order)}
                                >
                                  {isMoving ? "Moving..." : `→ ${STATUS_LABELS[nextSt] || nextSt}`}
                                </button>
                              ) : (
                                <button
                                  className="stg-btn stg-btn--soft-blue stg-btn--sm"
                                  onClick={() => navigate(STAGE_HINT[order.status_code]?.path || "/printing-manager/jobs/queue")}
                                >
                                  {isMoving ? "Moving..." : `→ ${STATUS_LABELS[nextSt] || nextSt} (${STAGE_HINT[order.status_code]?.label || "Next stage"})`}
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                                <Lock size={12} /> Locked
                              </span>
                            )
                          ) : (
                            <span className="stg-note">—</span>
                          )}
                          {!isPaid && (
                            <button
                              className="stg-btn stg-btn--danger stg-btn--sm"
                              disabled={deletingId === order.id}
                              title="Delete order (only allowed while payment is NOT confirmed)"
                              onClick={() => handleDeleteRequest(order)}
                            >
                              <Trash2 size={13} style={{ marginRight: 4 }} />
                              {deletingId === order.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
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

      <StageConfirmModal
        open={!!lockNotice}
        title={`Payment Not Confirmed — Order ${lockNotice?.order_number || ''} Locked`}
        message="This order cannot be moved to the next stage yet because Finance has not confirmed its payment. Please wait for Finance to approve the payment first."
        details={lockNotice ? `Service: ${lockNotice.product_type || '—'} · Total: ETB ${parseFloat(lockNotice.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="OK"
        onConfirm={() => setLockNotice(null)}
        onClose={() => setLockNotice(null)}
      />

      <StageConfirmModal
        open={!!confirm}
        title={`Move Order ${confirm?.order_number || ''} to "${confirm ? (STATUS_LABELS[NEXT_STATUS[confirm.status_code]] || NEXT_STATUS[confirm.status_code] || '') : ''}"`}
        message={`Confirm moving order ${confirm?.order_number || ''} to the next stage. This advances it through the printing pipeline.`}
        details={confirm ? `Customer: ${confirm.customer_name || 'Walk-in'} · Service: ${confirm.product_type || '—'} · Total: ETB ${parseFloat(confirm.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="Confirm Advance"
        busy={movingId === confirm?.id}
        onConfirm={doConfirmMove}
        onClose={() => setConfirm(null)}
      />

      <StageConfirmModal
        open={!!deleteTarget}
        title={`Delete Order ${deleteTarget?.order_number || ''}?`}
        message="This order's payment has NOT been confirmed. It will be permanently removed from the Job Queue and its invoice cancelled. This cannot be undone."
        details={deleteTarget ? `Customer: ${deleteTarget.customer_name || 'Walk-in'} · Service: ${deleteTarget.product_type || '—'} · Total: ETB ${parseFloat(deleteTarget.total_price || 0).toLocaleString()}` : ''}
        confirmLabel="Delete Order"
        busy={deletingId === deleteTarget?.id}
        onConfirm={doConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default PrintingQueue;
