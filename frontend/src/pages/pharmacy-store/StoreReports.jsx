import React, { useState, useEffect, useCallback } from "react";

const G = {
  forest: "#228B22", dark: "#1B5E20", emerald: "#2E8B57", leaf: "#4CAF50",
  sage: "#A5D6A7", olive: "#6B8E23", mint: "#98FF98", brown: "#8D6E63",
  sky: "#87CEEB", white: "#FFFFFF", light: "#F5F5F5", darkGray: "#424242",
  orange: "#FF9800", red: "#F44336", purple: "#7C3AED",
};

const TABS = ["Current Stock", "Issued Items", "Low Stock", "Movements", "Audit Log"];

let _listeners = [];
let _notifications = [];
export const NotifStore = {
  push(msg, type = "info") {
    const n = { id: Date.now(), msg, type, time: new Date() };
    _notifications = [n, ..._notifications].slice(0, 20);
    _listeners.forEach(fn => fn([..._notifications]));
    return n.id;
  },
  subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; },
  get() { return [..._notifications]; },
  dismiss(id) {
    _notifications = _notifications.filter(n => n.id !== id);
    _listeners.forEach(fn => fn([..._notifications]));
  }
};

export function NotifToastContainer() {
  const [notes, setNotes] = useState(NotifStore.get());
  useEffect(() => NotifStore.subscribe(setNotes), []);
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 360, width: "90%" }}>
      {notes.map(n => {
        const c = { success: { bg: G.leaf, border: G.dark }, warning: { bg: G.orange, border: "#E65100" }, error: { bg: G.red, border: "#B71C1C" }, info: { bg: G.emerald, border: G.dark } }[n.type] || { bg: G.emerald, border: G.dark };
        return (
          <div key={n.id} style={{ background: c.bg, border: `2px solid ${c.border}`, color: "#fff", padding: "12px 16px", boxShadow: `4px 4px 0 ${c.border}`, fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1 }}>{n.msg}</span>
            <button onClick={() => NotifStore.dismiss(n.id)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 900, padding: 0 }}>X</button>
          </div>
        );
      })}
    </div>
  );
}

const API = "/api/v1/store-inventory";
function hdrs() { return { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("token") || "") }; }
async function apiFetch(url, opts = {}) {
  const r = await fetch(url, { headers: hdrs(), ...opts });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}

const fmtDate = (v) => v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "---";

const ROW_HDR = (cols, tpl, bg) => (
  <div style={{ display: "grid", gridTemplateColumns: tpl, background: bg || G.forest, color: "#fff", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
    {cols.map(h => <div key={h} style={{ padding: "12px 12px" }}>{h}</div>)}
  </div>
);

const StoreReports = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, movData] = await Promise.all([
        apiFetch(API + "/inventory"),
        apiFetch(API + "/movements"),
      ]);
      setInventory(invData.data || invData || []);
      setMovements(movData.data || movData || []);
    } catch (e) {
      NotifStore.push("Failed to load: " + e.message, "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // The /movements API returns { movement_type, drug_name, strength, reference_no,
  // batch_no, quantity_in, quantity_out, performed_by, remarks, created_at, unit }
  const issuedItems = movements.filter(m => (m.movement_type || "").toUpperCase() === "ISSUE");

  // ---------- ISSUED ITEMS ----------
  const renderIssuedItems = () => (
    <div style={{ border: `3px solid ${G.sage}`, background: "#fff", overflow: "hidden" }}>
      <div style={{ background: G.sage, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: G.dark, textTransform: "uppercase" }}>Issued Items</div>
        <div style={{ fontWeight: 800, fontSize: 13, color: G.dark }}>{issuedItems.length} record(s)</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 980 }}>
          {ROW_HDR(["Date & Time", "Issue No", "Drug Name", "Strength", "Batch No", "Qty Out", "Dept / Remarks", "Processed By"], "1.6fr 1fr 1.6fr 0.8fr 1fr 0.8fr 1.5fr 1.4fr")}
          {issuedItems.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: G.olive, fontWeight: 700 }}>No items issued yet.</div>
            : issuedItems.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1.6fr 0.8fr 1fr 0.8fr 1.5fr 1.4fr", borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, background: i % 2 === 0 ? "#fff" : "#f9fff9" }}>
                <div style={{ padding: "11px 12px", fontWeight: 700 }}>{fmtDate(m.created_at)}</div>
                <div style={{ padding: "11px 12px", color: G.olive, fontFamily: "monospace", fontWeight: 700 }}>{m.reference_no || "---"}</div>
                <div style={{ padding: "11px 12px", fontWeight: 800, color: G.dark }}>{m.drug_name || "---"}</div>
                <div style={{ padding: "11px 12px", color: G.olive, fontSize: 12 }}>{m.strength || "---"}</div>
                <div style={{ padding: "11px 12px" }}>{m.batch_no || "---"}</div>
                <div style={{ padding: "11px 12px", fontWeight: 900, color: G.red }}>
                  {m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---"}
                </div>
                <div style={{ padding: "11px 12px", fontSize: 12 }}>{m.remarks || "---"}</div>
                <div style={{ padding: "11px 12px" }}>{m.performed_by || "---"}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  // ---------- CURRENT STOCK ----------
  const renderCurrentStock = () => {
    const grouped = inventory.reduce((acc, m) => {
      const cat = m.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { items: [], count: 0, totalValue: 0 };
      acc[cat].items.push(m);
      acc[cat].count += parseFloat(m.quantity || 0);
      acc[cat].totalValue += parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0);
      return acc;
    }, {});
    const grand = inventory.reduce((s, m) => s + parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0), 0);
    return (
      <div>
        <div style={{ background: G.dark, color: "#fff", padding: "20px", marginBottom: 24, border: `3px solid ${G.sage}`, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: G.sage }}>Grand Total Value</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>ETB {grand.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        {Object.keys(grouped).length === 0 && <div style={{ padding: 40, textAlign: "center", color: G.olive }}>Inventory is empty.</div>}
        {Object.entries(grouped).map(([cat, g]) => (
          <div key={cat} style={{ marginBottom: 32, border: `3px solid ${G.sage}`, background: "#fff", overflow: "hidden" }}>
            <div style={{ background: G.sage, padding: "12px 20px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, color: G.dark, textTransform: "uppercase" }}>{cat}</div>
              <div style={{ fontWeight: 800, color: G.dark }}>Units: {g.count.toLocaleString()} | ETB {g.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 800 }}>
                {ROW_HDR(["Drug Name", "Batch No", "Quantity", "Expiry", "Unit", "Unit Price", "Total Value"], "2fr 1fr 1fr 1.3fr 0.7fr 1fr 1fr")}
                {g.items.map((m, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.3fr 0.7fr 1fr 1fr", borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, background: i % 2 === 0 ? "#fff" : "#f9fff9" }}>
                    <div style={{ padding: "11px 12px", fontWeight: 800 }}>{m.drug_name || m.name || "---"}</div>
                    <div style={{ padding: "11px 12px" }}>{m.batch_no || m.batch_number || "---"}</div>
                    <div style={{ padding: "11px 12px", fontWeight: 800, color: G.forest }}>{parseFloat(m.quantity || 0).toLocaleString()}</div>
                    <div style={{ padding: "11px 12px", color: m.expiry_date && new Date(m.expiry_date) < new Date() ? G.red : "inherit" }}>{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : "---"}</div>
                    <div style={{ padding: "11px 12px" }}>{m.unit || "---"}</div>
                    <div style={{ padding: "11px 12px" }}>ETB {parseFloat(m.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div style={{ padding: "11px 12px", fontWeight: 800 }}>ETB {(parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------- LOW STOCK ----------
  const renderLowStock = () => {
    const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: "#fff", overflow: "hidden" }}>
        {low.length > 0 && <div style={{ background: "#FFEBEE", padding: "12px 20px", borderBottom: `2px solid ${G.red}`, fontWeight: 800, color: G.red }}>Warning: {low.length} item(s) need restocking</div>}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 800 }}>
            {ROW_HDR(["Drug Name", "Category", "Current Qty", "Min Level", "Unit", "Status"], "2fr 1fr 1fr 1fr 0.8fr 1.5fr", G.red)}
            {low.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: G.olive, fontWeight: 700 }}>All items have adequate stock.</div>
              : low.map((m, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 0.8fr 1.5fr", borderBottom: `1px solid ${G.light}`, fontSize: 13, color: G.darkGray, background: i % 2 === 0 ? "#fff" : "#fff5f5" }}>
                  <div style={{ padding: "11px 12px", fontWeight: 800 }}>{m.drug_name || m.name || "---"}</div>
                  <div style={{ padding: "11px 12px" }}>{m.category || "---"}</div>
                  <div style={{ padding: "11px 12px", fontWeight: 900, color: G.red }}>{parseFloat(m.quantity || 0).toLocaleString()}</div>
                  <div style={{ padding: "11px 12px", fontWeight: 800 }}>{m.min_level || m.reorder_level || 10}</div>
                  <div style={{ padding: "11px 12px" }}>{m.unit || "---"}</div>
                  <div style={{ padding: "11px 12px", color: G.red, fontWeight: 800 }}>Reorder Now!</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  // ---------- MOVEMENTS ----------
  const renderMovements = () => {
    const typeColor = { RECEIPT: G.forest, ISSUE: G.orange, ADJUSTMENT: "#00838F", COUNT: "#0288D1" };
    const typeBg    = { RECEIPT: "#E8F5E9", ISSUE: "#FFF3E0", ADJUSTMENT: "#E0F7FA", COUNT: "#E3F2FD" };
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: "#fff", overflow: "hidden" }}>
        <div style={{ background: G.sage, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: G.dark, textTransform: "uppercase" }}>All Stock Movements</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: G.dark }}>{movements.length} record(s)</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1100 }}>
            {ROW_HDR(["Date & Time", "Type", "Reference", "Drug Name", "Strength", "Batch No", "Qty In", "Qty Out", "Details", "Performed By"], "1.5fr 0.9fr 1fr 1.6fr 0.8fr 1fr 0.8fr 0.8fr 1.6fr 1.4fr", G.dark)}
            {movements.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: G.olive, fontWeight: 700 }}>No movement records found.</div>
              : movements.map((m, i) => {
                const type = (m.movement_type || "").toUpperCase();
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.9fr 1fr 1.6fr 0.8fr 1fr 0.8fr 0.8fr 1.6fr 1.4fr", borderBottom: `1px solid ${G.light}`, fontSize: 12, color: G.darkGray, background: i % 2 === 0 ? "#fff" : "#f9fff9" }}>
                    <div style={{ padding: "11px 10px", whiteSpace: "nowrap", fontWeight: 700 }}>{fmtDate(m.created_at)}</div>
                    <div style={{ padding: "11px 10px" }}>
                      <span style={{ display: "inline-block", padding: "3px 8px", background: typeBg[type] || "#eee", color: typeColor[type] || G.darkGray, fontWeight: 900, fontSize: 10, border: `1.5px solid ${typeColor[type] || G.darkGray}` }}>{type || "---"}</span>
                    </div>
                    <div style={{ padding: "11px 10px", fontFamily: "monospace", color: G.olive, fontWeight: 700 }}>{m.reference_no || "---"}</div>
                    <div style={{ padding: "11px 10px", fontWeight: 800, color: G.dark }}>{m.drug_name || "---"}</div>
                    <div style={{ padding: "11px 10px", color: G.olive, fontSize: 11 }}>{m.strength || "---"}</div>
                    <div style={{ padding: "11px 10px" }}>{m.batch_no || "---"}</div>
                    <div style={{ padding: "11px 10px", fontWeight: 900, color: G.forest }}>
                      {m.quantity_in ? <span style={{ background: "#E8F5E9", padding: "2px 6px" }}>+{Number(m.quantity_in).toLocaleString()}</span> : <span style={{ color: "#bbb" }}>---</span>}
                    </div>
                    <div style={{ padding: "11px 10px", fontWeight: 900, color: G.red }}>
                      {m.quantity_out ? <span style={{ background: "#FFEBEE", padding: "2px 6px" }}>-{Number(m.quantity_out).toLocaleString()}</span> : <span style={{ color: "#bbb" }}>---</span>}
                    </div>
                    <div style={{ padding: "11px 10px", fontSize: 11, color: G.olive, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.remarks || ""}>{m.remarks || "---"}</div>
                    <div style={{ padding: "11px 10px" }}>{m.performed_by || "---"}</div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  };

  // ---------- AUDIT LOG ----------
  const renderAuditLog = () => {
    const typeColor = { RECEIPT: G.forest, ISSUE: G.orange, ADJUSTMENT: "#00838F", COUNT: "#0288D1" };
    return (
      <div style={{ border: `3px solid ${G.sage}`, background: "#fff", overflow: "hidden" }}>
        <div style={{ background: G.dark, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: G.sage, textTransform: "uppercase" }}>Complete Audit Trail</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{movements.length} entries</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1000 }}>
            {ROW_HDR(["Timestamp", "Action", "Reference", "Drug Name", "Strength", "Batch No", "Qty Change", "Details", "User"], "1.5fr 0.8fr 1fr 1.6fr 0.8fr 1fr 1fr 1.6fr 1.3fr", "#263238")}
            {movements.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: G.olive, fontWeight: 700 }}>Audit log is empty.</div>
              : movements.map((m, i) => {
                const type = (m.movement_type || "").toUpperCase();
                const change = m.quantity_out ? -Number(m.quantity_out) : Number(m.quantity_in || 0);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1fr 1.6fr 0.8fr 1fr 1fr 1.6fr 1.3fr", borderBottom: `1px solid ${G.light}`, fontSize: 12, color: G.darkGray, background: i % 2 === 0 ? "#fff" : "#f9fff9" }}>
                    <div style={{ padding: "11px 10px", whiteSpace: "nowrap", fontWeight: 700 }}>{fmtDate(m.created_at)}</div>
                    <div style={{ padding: "11px 10px" }}>
                      <span style={{ display: "inline-block", padding: "3px 7px", background: typeColor[type] || G.darkGray, color: "#fff", fontWeight: 900, fontSize: 10 }}>{type || "---"}</span>
                    </div>
                    <div style={{ padding: "11px 10px", fontFamily: "monospace", color: G.olive, fontWeight: 700 }}>{m.reference_no || "---"}</div>
                    <div style={{ padding: "11px 10px", fontWeight: 800 }}>{m.drug_name || "---"}</div>
                    <div style={{ padding: "11px 10px", color: G.olive, fontSize: 11 }}>{m.strength || "---"}</div>
                    <div style={{ padding: "11px 10px" }}>{m.batch_no || "---"}</div>
                    <div style={{ padding: "11px 10px", fontWeight: 900, color: change < 0 ? G.red : G.forest }}>
                      {change > 0 ? "+" + change.toLocaleString() : change < 0 ? change.toLocaleString() : "---"}
                    </div>
                    <div style={{ padding: "11px 10px", fontSize: 11, color: G.olive, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.remarks || ""}>{m.remarks || "---"}</div>
                    <div style={{ padding: "11px 10px" }}>{m.performed_by || "---"}</div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  };

  // ---------- PRINT ----------
  const handlePrint = () => {
    const pw = window.open("", "_blank");
    if (!pw) { NotifStore.push("Allow popups to print.", "error"); return; }
    const dt = new Date().toLocaleString();
    const TH = (t) => `<th style="padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;border:1px solid #aaa;background:#1B5E20;color:#fff;">${t}</th>`;
    const TD = (t) => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:11px;word-break:break-word;">${t ?? "---"}</td>`;
    const fmt2 = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
    let body = "";

    if (activeTab === "Current Stock") {
      const grouped = inventory.reduce((acc, m) => { const c = m.category || "Uncategorized"; if (!acc[c]) acc[c] = []; acc[c].push(m); return acc; }, {});
      const grand = inventory.reduce((s, m) => s + parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0), 0);
      body += `<p style="font-size:15px;font-weight:bold;color:#1B5E20;margin-bottom:10px">Grand Total: ETB ${fmt2(grand)}</p>`;
      Object.entries(grouped).forEach(([cat, items]) => {
        body += `<h3 style="background:#c8e6c9;padding:7px 12px;margin:18px 0 0">${cat}</h3>`;
        body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH("Drug")}${TH("Batch")}${TH("Qty")}${TH("Expiry")}${TH("Unit")}${TH("Unit Price")}${TH("Total")}</tr></thead><tbody>`;
        items.forEach(m => {
          body += `<tr>${TD(m.drug_name || m.name)}${TD(m.batch_no || m.batch_number)}${TD(parseFloat(m.quantity || 0).toLocaleString())}${TD(m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : "---")}${TD(m.unit)}${TD("ETB " + fmt2(m.unit_price))}${TD("ETB " + fmt2(parseFloat(m.quantity || 0) * parseFloat(m.unit_price || 0)))}</tr>`;
        });
        body += "</tbody></table>";
      });
    } else if (activeTab === "Issued Items") {
      body += `<p style="font-weight:bold;margin-bottom:8px">Total: ${issuedItems.length} records</p>`;
      body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH("Date")}${TH("Issue No")}${TH("Drug")}${TH("Strength")}${TH("Batch")}${TH("Qty Out")}${TH("Dept/Remarks")}${TH("By")}</tr></thead><tbody>`;
      issuedItems.forEach(m => {
        body += `<tr>${TD(fmtDate(m.created_at))}${TD(m.reference_no)}${TD(m.drug_name)}${TD(m.strength)}${TD(m.batch_no)}${TD(m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---")}${TD(m.remarks)}${TD(m.performed_by)}</tr>`;
      });
      body += "</tbody></table>";
    } else if (activeTab === "Low Stock") {
      const low = inventory.filter(m => parseFloat(m.quantity || 0) <= parseFloat(m.min_level || m.reorder_level || 10));
      body += `<p style="font-weight:bold;color:#c62828;margin-bottom:8px">Warning: ${low.length} item(s)</p>`;
      body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH("Drug")}${TH("Category")}${TH("Qty")}${TH("Min Level")}${TH("Unit")}${TH("Status")}</tr></thead><tbody>`;
      low.forEach(m => {
        body += `<tr>${TD(m.drug_name || m.name)}${TD(m.category)}${TD(parseFloat(m.quantity || 0).toLocaleString())}${TD(m.min_level || m.reorder_level || 10)}${TD(m.unit)}<td style="color:#c62828;font-weight:bold;border:1px solid #ddd;padding:6px 10px">Reorder Now!</td></tr>`;
      });
      body += "</tbody></table>";
    } else {
      body += `<p style="font-weight:bold;margin-bottom:8px">Total: ${movements.length} records</p>`;
      body += `<table style="width:100%;border-collapse:collapse"><thead><tr>${TH("Date")}${TH("Type")}${TH("Reference")}${TH("Drug")}${TH("Strength")}${TH("Batch")}${TH("Qty In")}${TH("Qty Out")}${TH("Details")}${TH("By")}</tr></thead><tbody>`;
      movements.forEach(m => {
        body += `<tr>${TD(fmtDate(m.created_at))}${TD(m.movement_type)}${TD(m.reference_no)}${TD(m.drug_name)}${TD(m.strength)}${TD(m.batch_no)}${TD(m.quantity_in ? "+" + Number(m.quantity_in).toLocaleString() : "---")}${TD(m.quantity_out ? "-" + Number(m.quantity_out).toLocaleString() : "---")}${TD(m.remarks)}${TD(m.performed_by)}</tr>`;
      });
      body += "</tbody></table>";
    }

    pw.document.write(`<html><head><title>Pharmacy ${activeTab}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial;font-size:12px;padding:20px}h1{color:#1B5E20;border-bottom:3px solid #228B22;padding-bottom:6px;margin-bottom:4px;font-size:18px}h3{font-size:13px}.meta{font-size:11px;color:#555;margin-bottom:14px}tr:nth-child(even)td{background:#f0fdf4}tr{page-break-inside:avoid}@page{margin:10mm;size:A4 landscape}</style></head><body><h1>Pharmacy Store — ${activeTab}</h1><div class="meta">Generated: ${dt} | Sutana University</div>${body}<script>window.onload=function(){window.print();}<\/script></body></html>`);
    pw.document.close();
  };

  return (
    <div style={{ minHeight: "100vh", background: G.forest, fontFamily: "Inter,sans-serif" }}>
      <NotifToastContainer />
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .artistic-3d-title{font-size:2.2rem;font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase;text-shadow:2px 2px 0 #1B5E20,4px 4px 0 rgba(0,0,0,.2);margin:0}
        @media(min-width:768px){.artistic-3d-title{font-size:2.8rem}}
      `}</style>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(90deg, ${G.dark} 0%, ${G.forest} 100%)`, padding: "24px", borderBottom: `6px solid ${G.emerald}`, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 40 }}>📊</span>
          <div>
            <h1 className="artistic-3d-title">Pharmacy Reports</h1>
            <p style={{ margin: "6px 0 0", color: G.mint, fontSize: 14, fontWeight: 600 }}>Comprehensive stock, value and audit tracking</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadData} style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding: "10px 18px", fontSize: 13, fontWeight: 800, border: "2px solid rgba(255,255,255,.4)", cursor: "pointer", boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}>
            Refresh
          </button>
          <button onClick={handlePrint} style={{ background: "#fff", color: G.dark, padding: "12px 24px", fontSize: 14, fontWeight: 900, textTransform: "uppercase", border: "none", cursor: "pointer", boxShadow: `4px 4px 0 ${G.sage}` }}>
            Print Report
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: 24, background: G.light, minHeight: "calc(100vh - 90px)" }}>
        {/* TABS */}
        <div style={{ display: "flex", marginBottom: 24, overflowX: "auto", background: "#fff", border: `3px solid ${G.sage}` }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, minWidth: 140, padding: "14px 10px", fontSize: 13, fontWeight: 900,
              textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", border: "none",
              background: activeTab === t ? G.forest : "#fff",
              color: activeTab === t ? "#fff" : G.darkGray,
              borderRight: `1px solid ${G.light}`, whiteSpace: "nowrap"
            }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 100, fontSize: 20, fontWeight: 900, color: G.forest }}>Loading {activeTab}...</div>
        ) : (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {activeTab === "Current Stock" && renderCurrentStock()}
            {activeTab === "Issued Items"  && renderIssuedItems()}
            {activeTab === "Low Stock"     && renderLowStock()}
            {activeTab === "Movements"     && renderMovements()}
            {activeTab === "Audit Log"     && renderAuditLog()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreReports;
