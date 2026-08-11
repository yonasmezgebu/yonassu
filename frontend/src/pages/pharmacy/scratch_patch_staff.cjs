const fs = require('fs');
const path = require('path');

const file = path.join('D:', 'SUTANA', 'frontend', 'src', 'pages', 'pharmacy', 'PharmacyStaff.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove SHARED_CSS entirely
content = content.replace(/const SHARED_CSS = `[\s\S]*?`;/, "import './StockOperations.css';\n");

// 2. Remove <style>{SHARED_CSS}</style>
content = content.replace(/<style>\{SHARED_CSS\}<\/style>/g, '');

// 3. Replace .artistic-3d-title with .pso-title
content = content.replace(/className="artistic-3d-title"/g, 'className="pso-title"');
content = content.replace(/className="artistic-3d-subtitle"/g, 'className="pso-subtitle"');

// 4. Replace btn-3d and btn-3d-primary with btn-action-secondary and btn-action-primary
content = content.replace(/className="btn-3d"/g, 'className="btn-action-secondary"');
content = content.replace(/className="btn-3d-primary"/g, 'className="btn-action-primary"');

// 5. Replace d-card and d-card-no-hover with card-container pub-card
content = content.replace(/className="d-card"/g, 'className="card-container pub-card pso-card"');
content = content.replace(/className="d-card-no-hover"/g, 'className="card-container pso-card"');
// pso-card should have border and radius

// 6. Replace input field classes
content = content.replace(/className="inp-field"/g, 'className="pso-input"');

// 7. Table styles
content = content.replace(/className="staff-th"/g, '');
content = content.replace(/className="staff-td"/g, '');
content = content.replace(/className="staff-row"/g, '');

// 8. Replace action-btn
content = content.replace(/className="action-btn"/g, 'className="btn-action-secondary" style={{ padding: "4px 8px", fontSize: 12 }}');

// 9. Root wrapper
content = content.replace(/<div style=\{\{ padding: '0', minHeight: 'calc\(100vh - 64px\)', background: '#E0EFF3', fontFamily: "'Inter','Segoe UI',sans-serif" \}\}>/g, '<div className="pso-root">');
content = content.replace(/<div style=\{\{ padding: 40, background: '#E0EFF3', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' \}\}>/g, '<div className="pso-root" style={{ alignItems: "center", justifyContent: "center" }}>');

// 10. Header layout
content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2.5rem', marginTop: '0.5rem', animation: 'fadeUp 0.35s ease', width: '100%' \}\}>/g, '<div className="pso-header">');

content = content.replace(/<div style=\{\{ justifySelf: 'start' \}\}>/g, '<div className="pso-header-left">');
content = content.replace(/<div style=\{\{ justifySelf: 'center' \}\}>/g, '<div>');
content = content.replace(/<div style=\{\{ justifySelf: 'end', display: 'flex', gap: 12 \}\}>/g, '<div className="pso-header-right">');

// 11. Modal classes
content = content.replace(/className="modal-overlay"/g, 'className="pso-modal-overlay"');
content = content.replace(/className="modal-box"/g, 'className="pso-modal-content"');

// 12. Task card
content = content.replace(/className="task-card"/g, 'className="card-container pub-card pso-card" style={{ marginBottom: 12, padding: 16 }}');

// Save it back
fs.writeFileSync(file, content, 'utf8');

// PharmacyContact.jsx
const contactFile = path.join('D:', 'SUTANA', 'frontend', 'src', 'pages', 'pharmacy', 'PharmacyContact.jsx');
let contactContent = fs.readFileSync(contactFile, 'utf8');
contactContent = contactContent.replace(/const STYLES = `[\s\S]*?`;/, "import './StockOperations.css';\n");
contactContent = contactContent.replace(/<style>\{STYLES\}<\/style>/g, '');
contactContent = contactContent.replace(/className="pc-root"/g, 'className="pso-root"');
contactContent = contactContent.replace(/className="pc-topbar"/g, 'className="pso-header"');
contactContent = contactContent.replace(/className="pc-topbar-icon"/g, 'className="pso-header-icon"');
contactContent = contactContent.replace(/className="pc-topbar-title"/g, 'className="pso-title"');
contactContent = contactContent.replace(/className="pc-topbar-sub"/g, 'className="pso-subtitle"');
contactContent = contactContent.replace(/className="pc-body"/g, 'className="pso-content"');
contactContent = contactContent.replace(/className="pc-section"/g, 'className="card-container pub-card pso-card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}');
contactContent = contactContent.replace(/className="pc-section-inner"/g, 'style={{ padding: 24 }}');
contactContent = contactContent.replace(/className="pc-section-label"/g, 'style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-page)", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}');
contactContent = contactContent.replace(/color="#FFFFFF"/g, 'color="var(--color-primary)"');
contactContent = contactContent.replace(/className="pc-form-grid"/g, 'style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}');
contactContent = contactContent.replace(/className="pc-field"/g, '');
contactContent = contactContent.replace(/className="pc-field-wrap"/g, 'style={{ position: "relative" }}');
contactContent = contactContent.replace(/className="pc-field-icon"/g, 'style={{ position: "absolute", left: 12, top: 10, color: "var(--color-text-muted)", background: "transparent", border: "none" }}');
contactContent = contactContent.replace(/<input\s+id=/g, '<input className="pso-input" style={{ paddingLeft: 36 }} id=');
contactContent = contactContent.replace(/className="pc-save-row"/g, 'style={{ display: "flex", gap: 16, marginTop: 24 }}');
contactContent = contactContent.replace(/className="pc-btn-save"/g, 'className="btn-action-primary"');
contactContent = contactContent.replace(/className="pc-status success"/g, 'className="pso-badge" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}');
contactContent = contactContent.replace(/className="pc-status error"/g, 'className="pso-badge" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}');
contactContent = contactContent.replace(/className="pc-stats-bar"/g, 'style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}');
contactContent = contactContent.replace(/className="pc-stat-cell"/g, 'className="card-container pub-card pso-card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}');
contactContent = contactContent.replace(/className="pc-stat-icon"/g, 'style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}');
contactContent = contactContent.replace(/className="pc-stat-num"/g, 'style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}');
contactContent = contactContent.replace(/className="pc-stat-lbl"/g, 'style={{ fontSize: 13, color: "var(--color-text-secondary)" }}');
contactContent = contactContent.replace(/className="pc-empty"/g, 'style={{ padding: "60px 20px", textAlign: "center", color: "var(--color-text-muted)" }}');
contactContent = contactContent.replace(/className="pc-empty-icon"/g, 'style={{ opacity: 0.5, marginBottom: 12 }}');
contactContent = contactContent.replace(/className="pc-empty-title"/g, 'style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}');
contactContent = contactContent.replace(/className="pc-empty-sub"/g, 'style={{ fontSize: 14, margin: 0 }}');
contactContent = contactContent.replace(/className="pc-table-wrap"/g, 'style={{ overflowX: "auto" }}');
contactContent = contactContent.replace(/className="pc-table"/g, 'className="pso-table" style={{ width: "100%", minWidth: 600 }}');
contactContent = contactContent.replace(/className="pc-sender-name"/g, 'style={{ fontWeight: 600, color: "var(--color-text-primary)" }}');
contactContent = contactContent.replace(/className="pc-sender-email"/g, 'style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none" }}');
contactContent = contactContent.replace(/className="pc-sender-phone"/g, 'style={{ fontSize: 12, color: "var(--color-text-secondary)" }}');
contactContent = contactContent.replace(/className="pc-msg-text"/g, 'style={{ margin: 0, lineHeight: 1.5, color: "var(--color-text-secondary)" }}');
contactContent = contactContent.replace(/className="pc-time"/g, 'style={{ fontSize: 12, color: "var(--color-text-muted)" }}');
contactContent = contactContent.replace(/className="pc-unread-dot"/g, 'style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", flexShrink: 0, marginTop: 6 }}');
contactContent = contactContent.replace(/<label htmlFor="pc-phone1">Primary Phone<\/label>/g, '<label className="pso-label" htmlFor="pc-phone1">Primary Phone</label>');
contactContent = contactContent.replace(/<label htmlFor="pc-phone2">Secondary Phone<\/label>/g, '<label className="pso-label" htmlFor="pc-phone2">Secondary Phone</label>');
contactContent = contactContent.replace(/<label htmlFor="pc-email">Pharmacy Email Address<\/label>/g, '<label className="pso-label" htmlFor="pc-email">Pharmacy Email Address</label>');
fs.writeFileSync(contactFile, contactContent, 'utf8');

console.log("Patched successfully");
