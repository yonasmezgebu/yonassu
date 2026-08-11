import React from 'react';

/* ─── Shared Enterprise Design System for the 6 Job Stage pages ───────────
   CSS-only, scoped under .stg-root. Rules applied: 2,3,4,5,6,7,8,9,12,14,
   17,18,20,21,24. No logic/state/data/routes touched. */

export const StageStyles = () => (
  <style>{`
    @keyframes stgIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

    .stg-root {
      --primary:#2563EB; --primary-hover:#1D4ED8; --primary-tint:#EFF6FF;
      --bg-page:#F5F6FA; --bg-card:#FFFFFF; --border:#E5E7EB;
      --text-1:#111827; --text-2:#6B7280; --text-3:#9CA3AF;
      --success:#16A34A; --success-bg:#DCFCE7;
      --danger:#DC2626; --danger-bg:#FEE2E2;
      --warning:#D97706; --warning-bg:#FEF3C7;
      --info:#0284C7; --info-bg:#E0F2FE;
      --violet:#7C3AED; --violet-bg:#EDE9FE;
      --cyan:#0891B2; --cyan-bg:#CFFAFE;
      --purple:#C026D3; --purple-bg:#FAE8FF;
      --gold:#EAB308; --gold-wipe:rgba(234,179,8,.5); --gold-bg:#FEF3C7;
      --radius:10px; --radius-sm:8px; --radius-xs:6px;
      --shadow:0 1px 3px rgba(0,0,0,.06);
      --shadow-hover:0 4px 12px rgba(0,0,0,.08);
      font-family:'Inter','Segoe UI',Roboto,-apple-system,sans-serif;
      font-size:14px; line-height:1.5; color:var(--text-1);
      background:var(--bg-page); padding:12px; overflow-x:hidden;
    }
    .stg-root *, .stg-root *::before, .stg-root *::after { box-sizing:border-box; }

    /* ── Typography (rule 2) ── */
    .stg-head { margin:0 0 16px; }
    .stg-title { display:flex; align-items:center; gap:10px; margin:0; font-size:clamp(22px,2.4vw,26px); font-weight:600; letter-spacing:-0.01em; line-height:1.3; color:var(--text-1); }
    .stg-title svg { width:26px; height:26px; flex-shrink:0; }
    .stg-sub { margin:6px 0 0; font-size:13px; color:var(--text-2); }

    /* ── Toolbar / filters (rule 5, 12) ── */
    .stg-toolbar { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin:0 0 16px; box-shadow:var(--shadow); animation:stgIn .4s ease both; }
    .stg-field { display:flex; flex-direction:column; gap:6px; min-width:160px; }
    .stg-field--grow { flex:1 1 220px; }
    .stg-label { font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-2); }
    .stg-input, .stg-select, .stg-textarea {
      width:100%; height:36px; padding:0 12px; font-family:inherit; font-size:14px; color:var(--text-1);
      background:var(--bg-card); border:1px solid #D1D5DB; border-radius:var(--radius-sm);
      outline:none; transition:border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
    }
    .stg-input::placeholder { color:var(--text-3); }
    .stg-input:hover, .stg-select:hover { border-color:var(--primary); }
    .stg-input:focus, .stg-select:focus, .stg-textarea:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,.10); }
    .stg-select { padding-right:32px; cursor:pointer; appearance:none; -webkit-appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-repeat:no-repeat; background-position:right 12px center; }
    .stg-textarea { height:auto; min-height:36px; padding:10px 12px; resize:vertical; }
    .stg-input--sm { height:32px; font-size:13px; padding:0 10px; border-radius:var(--radius-xs); }
    .stg-select.stg-input--sm { padding-right:32px; }

    /* ── Buttons (rules 3 + 7): hover wipe spreads from a point across the whole button ── */
    .stg-btn {
      position:relative; overflow:hidden; display:inline-flex; align-items:center; justify-content:center;
      gap:6px; height:36px; padding:0 16px; font-family:inherit; font-size:13px; font-weight:500;
      border-radius:var(--radius-sm); border:1px solid transparent; cursor:pointer; white-space:nowrap;
      box-shadow:var(--shadow); transition:box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
      --wipe:var(--gold-wipe); z-index:1;
    }
    .stg-btn::before { content:''; position:absolute; top:0; left:0; width:100%; height:100%; border-radius:inherit; background:var(--wipe); transform:scale(0); transform-origin:top left; transition:transform 320ms cubic-bezier(.4,0,.2,1); z-index:0; }
    .stg-btn:hover::before { transform:scale(1); }
    .stg-btn:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); }
    .stg-btn:active { transform:translateY(0) scale(.98); }
    .stg-btn:disabled { opacity:.5; cursor:not-allowed; box-shadow:none; transform:none; }
    .stg-btn:disabled::before { display:none; }
    .stg-btn > * { position:relative; z-index:1; }
    .stg-btn svg { width:15px; height:15px; flex-shrink:0; }
    .stg-btn--sm { height:32px; padding:0 12px; font-size:12px; gap:5px; }
    .stg-btn--block { width:100%; }

    .stg-btn--ghost { background:var(--bg-card); border-color:var(--border); color:var(--text-2); }
    .stg-btn--ghost:hover { border-color:var(--gold); color:var(--gold); }
    .stg-btn--primary { background:var(--primary); color:#fff; }
    .stg-btn--success { background:var(--success); color:#fff; }
    .stg-btn--danger { background:var(--danger); color:#fff; }
    .stg-btn--violet { background:var(--violet); color:#fff; }
    .stg-btn--cyan { background:var(--cyan); color:#fff; }
    .stg-btn--purple { background:var(--purple); color:#fff; }
    .stg-btn--info { background:var(--info); color:#fff; }
    .stg-btn--soft-blue { background:var(--primary-tint); border-color:#BFDBFE; color:var(--primary); }
    .stg-btn--soft-green { background:var(--success-bg); border-color:#BBF7D0; color:var(--success); }
    .stg-btn--soft-red { background:var(--danger-bg); border-color:#FECACA; color:var(--danger); }
    .stg-btn--soft-violet { background:var(--violet-bg); border-color:#DDD6FE; color:var(--violet); }
    .stg-btn--soft-cyan { background:var(--cyan-bg); border-color:#A5F3FC; color:var(--cyan); }
    .stg-btn--soft-purple { background:var(--purple-bg); border-color:#F5D0FE; color:var(--purple); }

    /* ── Cards (rule 6) ── */
    .stg-card-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    .stg-job-card { display:grid; grid-template-columns:1fr; gap:16px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; box-shadow:var(--shadow); animation:stgIn .4s ease both; transition:box-shadow 150ms ease, transform 150ms ease; }
    .stg-job-card:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); }
    .stg-job-id { font-size:18px; font-weight:600; color:var(--text-1); margin:0 0 8px; }
    .stg-job-meta { font-size:13px; color:var(--text-2); margin:0 0 4px; }
    .stg-job-meta strong { color:var(--text-1); font-weight:600; }
    .stg-job-file { font-size:13px; color:var(--text-2); margin:0 0 12px; }
    .stg-job-file a { color:var(--info); text-decoration:none; font-weight:500; }
    .stg-job-file a:hover { color:var(--gold); text-decoration:underline; }

    /* ── Checklist (Prepress detail view) ── */
    .stg-checklist { background:#F9FAFB; border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; }
    .stg-check-title { margin:0 0 12px; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-2); }
    .stg-check-grid { display:grid; grid-template-columns:1fr; gap:10px; }
    .stg-check-item { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; color:var(--text-2); transition:color 150ms ease; }
    .stg-check-item input { width:16px; height:16px; accent-color:var(--success); flex-shrink:0; cursor:pointer; }
    .stg-check-item.stg-checked { color:var(--success); font-weight:600; }
    .stg-actions-col { display:flex; flex-direction:column; gap:12px; }
    .stg-divider { border:none; border-top:1px solid var(--border); margin:4px 0; }

    /* ── Badges / chips (rule 8) ── */
    .stg-pill { display:inline-flex; align-items:center; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:500; line-height:1.6; white-space:nowrap; }
    .stg-chip { display:inline-flex; align-items:center; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:500; white-space:nowrap; }

    /* ── Tables (rule 9) ── */
    .stg-table-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow); animation:stgIn .4s ease both; }
    .stg-table-scroll { overflow-x:auto; }
    .stg-table { width:100%; border-collapse:collapse; min-width:720px; font-size:14px; }
    .stg-th { background:#F9FAFB; border-bottom:1px solid var(--border); padding:0 16px; height:48px; text-align:left; font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-2); white-space:nowrap; }
    .stg-th--num { text-align:right; }
    .stg-td { padding:0 16px; height:52px; border-bottom:1px solid #F1F5F9; color:var(--text-1); vertical-align:middle; }
    .stg-table tbody tr:last-child .stg-td { border-bottom:none; }
    .stg-table tbody tr { transition:background 150ms ease; }
    .stg-table tbody tr:hover { background:#F9FAFB; }
    .stg-table tbody tr.stg-row--overdue { background:#FEF2F2; }
    .stg-table tbody tr.stg-row--overdue:hover { background:#FDE8E8; }
    .stg-table tbody tr.stg-row--due { background:#FFFBEB; }
    .stg-table tbody tr.stg-row--due:hover { background:#FEF3C7; }
    .stg-num { text-align:right; font-variant-numeric:tabular-nums; }
    .stg-strong { font-weight:700; color:var(--text-1); }
    .stg-muted { color:var(--text-2); }
    .stg-accent { font-weight:600; }
    .stg-note { font-size:12px; color:var(--text-3); }

    /* ── Progress (range) ── */
    .stg-progress { display:flex; align-items:center; gap:10px; min-width:140px; }
    .stg-range { flex:1; min-width:0; height:6px; accent-color:var(--primary); cursor:pointer; }
    .stg-range-val { font-size:12px; font-weight:700; min-width:32px; text-align:right; color:var(--text-1); font-variant-numeric:tabular-nums; }

    /* ── In-cell actions / empty state ── */
    .stg-cell-btns { display:flex; gap:8px; flex-wrap:wrap; }
    .stg-empty { padding:48px 16px; text-align:center; color:var(--text-3); font-size:14px; }
    .stg-empty--card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); }

    /* ── Stage navigation bar (6 stage buttons) ── */
    .stg-nav { display:flex; align-items:center; gap:8px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:8px; margin:0 0 16px; box-shadow:var(--shadow); overflow-x:auto; scroll-snap-type:x proximity; animation:stgIn .4s ease both; }
    .stg-nav-track { display:flex; align-items:center; gap:6px; flex:1; min-width:0; }
    .stg-nav-item { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; border:none; border-radius:var(--radius-sm); background:transparent; color:var(--text-2); font-family:inherit; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap; transition:background 150ms ease, color 150ms ease; scroll-snap-align:start; }
    .stg-nav-item:hover { background:var(--gold-bg); color:var(--gold); }
    .stg-nav-item.is-active { background:var(--primary-tint); color:var(--primary); font-weight:600; }
    .stg-nav-dot { width:6px; height:6px; border-radius:50%; background:currentColor; opacity:.35; flex-shrink:0; }
    .stg-nav-arrow { color:var(--text-3); font-size:12px; flex-shrink:0; }
    .stg-nav-new { margin-left:auto; flex-shrink:0; }

    /* ── Intake cards / forms (New Job page) ── */
    .stg-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; box-shadow:var(--shadow); animation:stgIn .4s ease both; }
    .stg-card-head { display:flex; align-items:center; gap:10px; margin:0 0 18px; }
    .stg-card-icon { font-size:18px; line-height:1; }
    .stg-card-title { font-size:16px; font-weight:600; color:var(--text-1); margin:0; }
    .stg-form-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    .stg-form-field { display:flex; flex-direction:column; gap:6px; }
    .stg-form-field--full { grid-column:1/-1; }
    .stg-check { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-1); cursor:pointer; }
    .stg-check input { width:16px; height:16px; accent-color:var(--primary); cursor:pointer; }
    .stg-intake-grid { display:grid; grid-template-columns:1fr; gap:16px; margin:0 0 16px; }
    .stg-order-row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; padding:14px 16px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-card); transition:box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease; }
    .stg-order-row:hover { box-shadow:var(--shadow-hover); transform:translateY(-1px); border-color:var(--gold); }
    .stg-order-main { flex:1; min-width:220px; }
    .stg-order-id { font-size:13px; font-weight:700; color:var(--text-1); }
    .stg-order-sub { font-size:12px; color:var(--text-2); margin-top:2px; }
    .stg-alert { padding:12px 16px; border-radius:var(--radius-sm); font-size:13px; font-weight:500; background:var(--danger-bg); color:var(--danger); border:1px solid #FECACA; margin:0 0 16px; }

    /* ── Record / history detail blocks ── */
    .stg-record-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin:0 0 16px; }
    .stg-record-id { font-size:22px; font-weight:600; color:var(--text-1); margin:6px 0 0; letter-spacing:-0.01em; }
    .stg-detail-grid { display:grid; grid-template-columns:1fr; gap:12px 16px; background:#F9FAFB; border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; }
    .stg-detail-label { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-2); margin:0 0 4px; }
    .stg-detail-value { font-size:14px; font-weight:600; color:var(--text-1); margin:0; }

    .stg-note-box { margin-top:16px; padding:14px 16px; border:1px dashed #FCD34D; border-radius:var(--radius-sm); background:#FFFBEB; }
    .stg-note-box--info { border-style:solid; border-color:#BAE6FD; background:var(--info-bg); }
    .stg-note-label { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-2); margin:0 0 6px; }
    .stg-note-text { font-size:13px; color:var(--text-1); margin:0; line-height:1.6; }
    .stg-file-chips { display:flex; gap:10px; flex-wrap:wrap; }
    .stg-file-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:var(--bg-card); border:1px solid #BAE6FD; border-radius:var(--radius-xs); color:var(--text-1); text-decoration:none; font-size:12px; font-weight:500; box-shadow:var(--shadow); transition:border-color 150ms ease, box-shadow 150ms ease; }
    .stg-file-chip:hover { border-color:var(--gold); color:var(--gold); box-shadow:var(--shadow-hover); }
    .stg-file-chip svg { width:14px; height:14px; color:var(--info); }

    .stg-search { position:relative; flex:1 1 260px; display:flex; flex-direction:column; gap:6px; }
    .stg-search svg { position:absolute; left:12px; bottom:10px; color:var(--text-3); pointer-events:none; width:16px; height:16px; }
    .stg-search .stg-input { padding-left:36px; }

    .stg-pill--success { background:var(--success-bg); color:var(--success); }
    .stg-pill--warning { background:var(--warning-bg); color:var(--warning); }
    .stg-pill--danger { background:var(--danger-bg); color:var(--danger); }
    .stg-pill--info { background:var(--info-bg); color:var(--info); }
    .stg-pill--violet { background:var(--violet-bg); color:var(--violet); }
    .stg-pill--neutral { background:#F1F5F9; color:var(--text-2); }

    .stg-pager { display:flex; justify-content:center; align-items:center; gap:12px; margin:24px 0 8px; flex-wrap:wrap; }
    .stg-pager-page { display:inline-flex; align-items:center; padding:0 16px; height:32px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:13px; font-weight:500; color:var(--text-1); box-shadow:var(--shadow); }

    /* ── Responsive (rules 14/18, mobile-first) ── */
    @media (min-width:480px) {
      .stg-root { padding:16px; }
      .stg-check-grid { grid-template-columns:1fr 1fr; }
      .stg-form-grid { grid-template-columns:1fr 1fr; }
      .stg-detail-grid { grid-template-columns:1fr 1fr; }
    }
    @media (min-width:768px) {
      .stg-root { padding:16px; }
      .stg-head { margin-bottom:24px; }
      .stg-toolbar { gap:20px; }
      .stg-job-card { grid-template-columns:1fr 1.6fr 1fr; gap:20px; }
      .stg-btn { height:32px; font-size:12px; padding:0 14px; }
      .stg-btn--sm { height:32px; }
      .stg-detail-grid { grid-template-columns:repeat(4,1fr); }
    }
    @media (min-width:1024px) {
      .stg-root { padding:24px; }
      .stg-intake-grid { grid-template-columns:1fr 1fr; gap:20px; }
    }
    @media (min-width:1280px) {
      .stg-root { padding:24px; }
      .stg-card-grid { gap:20px; }
    }
    @media (max-width:479px) {
      .stg-btn, .stg-btn--sm { height:44px; font-size:14px; padding:0 16px; }
      .stg-input, .stg-select, .stg-textarea { height:44px; }
      .stg-title { font-size:22px; }
      .stg-toolbar, .stg-job-card { padding:16px; }
      .stg-td { height:auto; padding-top:12px; padding-bottom:12px; }
      .stg-nav-item { height:44px; padding:0 16px; font-size:13px; }
      .stg-form-grid { grid-template-columns:1fr; }
      .stg-card { padding:16px; }
    }
  `}</style>
);
