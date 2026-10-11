import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";
import carService from "../../services/carService";
import SegmentedSpinner from "../../components/ui/SegmentedSpinner";
import { RefreshCw, Printer, Tractor, ShoppingBag, Car, Pill, Award, MessageCircle } from 'lucide-react';
import styles from "./CustomerAllOrders.module.css";

/* ─── Color Palette ─────────────────────────────────────────────────────── */
const G = {
  emerald: "#10b981",
  orange: "#f59e0b",
  blue: "#3b82f6",
  pink: "#ec4899",
  red: "#ef4444",
  olive: "#65a30d",
};
const COLORS_ARR = [G.emerald, G.blue, G.orange, G.pink, G.olive, G.red];

const CategoryBar = ({ value, max, color }) => (
  <div
    style={{
      background: "hsl(var(--muted))",
      borderRadius: "var(--radius)",
      height: "0.5rem",
      overflow: "hidden",
      flex: 1,
    }}
  >
    <div
      style={{
        height: "100%",
        borderRadius: "var(--radius)",
        background: color,
        width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`,
        transition: "width 0.5s ease",
      }}
    />
  </div>
);

export default function CustomerAllOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () =>
      setTimeString(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const results = [];

      const printingP = apiClient
        .get("/printing/customer/orders")
        .then((r) => {
          if (r.status === "success") {
            (r.data?.orders || []).forEach((o) =>
              results.push({
                id: `prt-${o.id}`,
                type: "Printing",
                typeLabel: "Printing",
                orderNumber: o.order_number,
                date: o.created_at,
                status: o.status_name || o.status_code,
                amount: o.total_price,
                description: `${o.product_type || ""}`,
                navPath: "/customer/printing-orders",
                icon: <Printer size={16} />,
                color: G.olive,
              }),
            );
          }
        })
        .catch(() => {});

      const farmingP = apiClient
        .get("/agrirent-orders/my-orders")
        .then((r) => {
          if (r.status === "success") {
            (r.data || []).forEach((o) =>
              results.push({
                id: `farm-${o.id}`,
                type: "AgriRent",
                typeLabel: "AgriRent",
                orderNumber: o.order_number,
                date: o.created_at,
                status: o.status,
                amount: o.total_amount,
                description: `${o.tractor_name || ""}`,
                navPath: "/customer/farming-orders",
                icon: <Tractor size={16} />,
                color: G.emerald,
              }),
            );
          }
        })
        .catch(() => {});

      const retailP = apiClient
        .get("/retail/orders/my-orders")
        .then((r) => {
          if (r.status === "success") {
            (r.data || []).forEach((o) =>
              results.push({
                id: `ret-${o.id}`,
                type: "Retail",
                typeLabel: "Retail",
                orderNumber: o.invoice_number,
                date: o.created_at,
                status: o.status,
                amount: o.total_amount,
                description:
                  o.items
                    ?.map((i) => i.product_name)
                    .join(", ")
                    ?.slice(0, 80) || "",
                navPath: "/customer/retail-orders",
                icon: <ShoppingBag size={16} />,
                color: G.orange,
              }),
            );
          }
        })
        .catch(() => {});

      const rentalP = carService
        .getMyRentalOrders()
        .then((r) => {
          if (r.status === "success") {
            (r.data || []).forEach((o) =>
              results.push({
                id: `rent-${o.id}`,
                type: "Rental",
                typeLabel: "Car Rental",
                orderNumber: o.orderNumber,
                date: o.createdAt || o.created_at,
                status: (o.isCancellationRequested || o.is_cancellation_requested) ? 'Cancellation Requested' : o.status,
                amount: o.totalAmount,
                description: `${o.carName || ""}`,
                navPath: "/customer/rentals",
                icon: <Car size={16} />,
                color: G.blue,
              }),
            );
          }
        })
        .catch(() => {});

      const prescriptionP = apiClient
        .get("/pharmacy/requests/my-requests")
        .then((r) => {
          if (r.status === "success") {
            const data = r.data?.data || r.data || [];
            data.forEach((o) =>
              results.push({
                id: `rx-${o.id}`,
                type: "Pharmacy",
                typeLabel: "Pharmacy",
                orderNumber: o.request_number || `RX-${o.id}`,
                date: o.requested_at,
                status: o.status,
                amount: o.total_amount,
                description: o.medication_name,
                navPath: "/customer/prescriptions",
                icon: <Pill size={16} />,
                color: G.pink,
              }),
            );
          }
        })
        .catch(() => {});

      const tenderP = apiClient
        .get("/tenders/my-bids")
        .then((r) => {
          if (r.status === "success") {
            (r.data || []).forEach((o) =>
              results.push({
                id: `bid-${o.id}`,
                type: "Tenders",
                typeLabel: "Tender Bid",
                orderNumber: `BID-${o.id}`,
                date: o.created_at,
                status: o.status,
                amount: o.bid_amount,
                description: o.tender_title || "Tender Bid",
                navPath: "/customer/bids",
                icon: <Award size={16} />,
                color: G.red,
              }),
            );
          }
        })
        .catch(() => {});

      await Promise.all([
        printingP,
        farmingP,
        retailP,
        rentalP,
        prescriptionP,
        tenderP,
      ]);
      results.sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
      );
      setOrders(results);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = orders.length;
  const pendingOrders = orders.filter((o) => {
    const s = (o.status || "").toUpperCase();
    return ["PROCESSING", "PENDING", "SHIPPED", "APPROVED", "ACTIVE"].some(
      (x) => s.includes(x),
    );
  });
  const completedOrders = orders.filter((o) => {
    const s = (o.status || "").toUpperCase();
    return ["COMPLETED", "DELIVERED", "PAID", "PICKED_UP"].some((x) =>
      s.includes(x),
    );
  });

  const pendingCount = pendingOrders.length;
  const completedCount = completedOrders.length;
  const servicesUsedCount = new Set(orders.map((o) => o.type)).size;
  const recentActivities = orders.slice(0, 8);

  const statuses = [
    "Printing",
    "AgriRent",
    "Retail",
    "Rental",
    "Pharmacy",
    "Tenders",
  ];
  const maxStatusCount = Math.max(
    ...statuses.map((s) => orders.filter((o) => o.type === s).length),
    1,
  );
  const statusColors = {
    Printing: G.olive,
    AgriRent: G.emerald,
    Retail: G.orange,
    Rental: G.blue,
    Pharmacy: G.pink,
    Tenders: G.red,
  };

  return (
    <div className={styles.portalWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>
              Welcome back, {user?.name || "Customer"}!
            </h1>
            <p className={styles.pageSubtitle}>It's {timeString}</p>
          </div>
          <button
            onClick={load}
            className={styles.btnPrimary}
            disabled={refreshing}
          >
            {refreshing ? <SegmentedSpinner size={16} /> : <RefreshCw size={14} />}
            Sync Data
          </button>
        </div>

        {/* Top KPIs */}
        <div className={styles.gridTop}>
          <div className={`${styles.card} ${styles.cardHero}`}>
            <div
              className={styles.cardSubtitle}
              style={{ color: "inherit", opacity: 0.9 }}
            >
              Total Activity
            </div>
            <div
              style={{ fontSize: "3rem", fontWeight: 700, margin: "0.5rem 0" }}
            >
              {totalCount}
            </div>
            <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
              Lifetime requests and orders
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardSubtitle}>Completed</div>
            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                margin: "0.5rem 0",
              }}
            >
              {completedCount}
            </div>
            <div style={{ fontSize: "0.875rem", color: G.emerald }}>
              Successfully fulfilled
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardSubtitle}>In Progress</div>
            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                margin: "0.5rem 0",
              }}
            >
              {pendingCount}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: pendingCount > 0 ? G.orange : G.emerald,
              }}
            >
              Currently active or pending
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardSubtitle}>Services Used</div>
            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                margin: "0.5rem 0",
              }}
            >
              {servicesUsedCount}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              Across all departments
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className={styles.gridMain}>
          {/* Status Breakdown */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Activity Status Breakdown</h2>
            <div className={styles.gridSubKPIs}>
              <div className={styles.subKpiCard}>
                <div className={styles.subKpiLabel}>Total</div>
                <div className={styles.subKpiValue}>{totalCount}</div>
              </div>
              <div className={styles.subKpiCard}>
                <div className={styles.subKpiLabel}>Completed</div>
                <div
                  className={styles.subKpiValue}
                  style={{ color: G.emerald }}
                >
                  {completedCount}
                </div>
              </div>
              <div className={styles.subKpiCard}>
                <div className={styles.subKpiLabel}>Pending</div>
                <div className={styles.subKpiValue} style={{ color: G.orange }}>
                  {pendingCount}
                </div>
              </div>
              <div className={styles.subKpiCard}>
                <div className={styles.subKpiLabel}>Services</div>
                <div className={styles.subKpiValue} style={{ color: G.blue }}>
                  {servicesUsedCount}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              {statuses.map((status, i) => {
                const count = orders.filter((o) => o.type === status).length;
                const c =
                  statusColors[status] || COLORS_ARR[i % COLORS_ARR.length];
                return (
                  <div key={status} className={styles.catRow}>
                    <div className={styles.catRowLabel}>
                      <span
                        style={{
                          width: "0.75rem",
                          height: "0.75rem",
                          borderRadius: "50%",
                          backgroundColor: c,
                        }}
                      ></span>
                      {status}
                    </div>
                    <CategoryBar value={count} max={maxStatusCount} color={c} />
                    <div className={styles.catRowValue}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            {recentActivities.length === 0 ? (
              <p
                style={{
                  color: "hsl(var(--muted-foreground))",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                No activity yet
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentActivities.map((l) => (
                  <div
                    key={l.id}
                    className={styles.listRow}
                    onClick={() => l.navPath && navigate(l.navPath)}
                  >
                    <div
                      className={styles.iconBox}
                      style={{
                        color: l.color,
                        backgroundColor: `${l.color}22`,
                      }}
                    >
                      {l.icon}
                    </div>
                    <div className={styles.listRowContent}>
                      <div className={styles.listRowTitle}>
                        {l.typeLabel}: {l.description || `#${l.orderNumber}`}
                      </div>
                      <div className={styles.listRowSubtitle}>{l.status}</div>
                    </div>
                    <div
                      className={styles.listRowRight}
                      style={{ color: l.color }}
                    >
                      {l.date
                        ? new Date(l.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & Quick Actions */}
        <div className={styles.gridActions}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Attention Required</h2>
            {pendingOrders.length === 0 ? (
              <p style={{ color: "hsl(var(--muted-foreground))" }}>
                No pending actions required at this time.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {pendingOrders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className={styles.listRow}
                    onClick={() => o.navPath && navigate(o.navPath)}
                  >
                    <div
                      className={styles.iconBox}
                      style={{
                        color: o.color,
                        backgroundColor: `${o.color}22`,
                      }}
                    >
                      {o.icon}
                    </div>
                    <div className={styles.listRowContent}>
                      <div className={styles.listRowTitle}>
                        {o.typeLabel} #{o.orderNumber}
                      </div>
                      <div className={styles.listRowSubtitle}>{o.status}</div>
                    </div>
                    <div className={styles.listRowRight}>›</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Quick Operations</h2>
            <div className={styles.gridQuickActions}>
              {[
                {
                  label: "Retail",
                  sub: "My Orders",
                  icon: <ShoppingBag size={24} />,
                  color: G.orange,
                  href: "/customer/retail-orders",
                },
                {
                  label: "AgriRent",
                  sub: "Equipment",
                  icon: <Tractor size={24} />,
                  color: G.emerald,
                  href: "/customer/farming-orders",
                },
                {
                  label: "Pharmacy",
                  sub: "Prescriptions",
                  icon: <Pill size={24} />,
                  color: G.pink,
                  href: "/customer/prescriptions",
                },
                {
                  label: "Rentals",
                  sub: "Car Rentals",
                  icon: <Car size={24} />,
                  color: G.blue,
                  href: "/customer/rentals",
                },
                {
                  label: "Printing",
                  sub: "Orders",
                  icon: <Printer size={24} />,
                  color: G.olive,
                  href: "/customer/printing-orders",
                },
                {
                  label: "Support",
                  sub: "Tickets",
                  icon: <MessageCircle size={24} />,
                  color: "hsl(var(--foreground))",
                  href: "/customer/support",
                },
              ].map((a) => (
                <div
                  key={a.label}
                  className={styles.qaCard}
                  onClick={() => navigate(a.href)}
                >
                  <div
                    className={styles.qaIconBox}
                    style={{ color: a.color, backgroundColor: `${a.color}22` }}
                  >
                    {a.icon}
                  </div>
                  <div className={styles.qaLabel}>{a.label}</div>
                  <div className={styles.qaSub}>{a.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
