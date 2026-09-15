import React from 'react';

/* ─── Shared Enterprise Design System for the 6 Job Stage pages ───────────
   Updated to match the "DESIGN & CSS MASTER NOTE — REVISED"
   Removes generic SaaS-card kits and implements a more distinct, 
   editorial layout with Fraunces & Inter fonts and warm off-white palette.
*/

export const StageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

    .stg-root {
      /* 1. Foundation & Architecture */
      --background: 45 25% 97%;    /* warm off-white, not pure #FFF */
      --foreground: 40 8% 12%;     /* warm near-black, not #000 */
      --accent: 162 48% 22%;       /* deliberate deep forest green */
      --accent-foreground: 45 25% 97%;
      --muted: 42 18% 91%;
      --muted-foreground: 40 6% 40%;
      --border: 42 16% 84%;
      --radius: 0.5rem;
      
      --success: 162 48% 22%; 
      --danger: 350 60% 45%;
      --warning: 40 80% 40%;
      --info: 210 60% 40%;

      --font-display: "Fraunces", Georgia, serif;
      --font-body: "Inter", -apple-system, sans-serif;
      
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-family: var(--font-body);
      font-size: 1rem;
      line-height: 1.6;
      padding: 1.5rem;
      min-height: calc(100vh - 64px);
    }
    .stg-root *, .stg-root *::before, .stg-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Typography ── */
    .stg-head { margin-bottom: 2rem; }
    .stg-title { 
      font-family: var(--font-display); 
      font-size: 2.5rem; 
      font-weight: 500; 
      line-height: 1.1; 
      color: hsl(var(--foreground)); 
      display: flex; align-items: center; gap: 0.75rem; 
      margin-bottom: 0.5rem;
    }
    .stg-title svg { width: 32px; height: 32px; flex-shrink: 0; }
    .stg-sub { font-size: 1.125rem; color: hsl(var(--muted-foreground)); line-height: 1.6; }

    /* ── Toolbar / filters ── */
    .stg-toolbar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem; margin-bottom: 2rem; }
    .stg-field { display: flex; flex-direction: column; gap: 0.5rem; min-width: 160px; }
    .stg-field--grow { flex: 1 1 220px; }
    .stg-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--foreground)); }
    .stg-input, .stg-select, .stg-textarea {
      width: 100%; height: 2.5rem; padding: 0 0.75rem;
      font-family: var(--font-body); font-size: 1rem; color: hsl(var(--foreground));
      background: transparent; border: 1px solid hsl(var(--border)); border-radius: var(--radius);
      outline: none;
    }
    .stg-input::placeholder { color: hsl(var(--muted-foreground)); }
    .stg-input:focus, .stg-select:focus, .stg-textarea:focus { border-color: hsl(var(--accent)); box-shadow: 0 0 0 2px hsla(var(--accent), 0.2); }
    .stg-textarea { height: auto; min-height: 2.5rem; padding: 0.5rem 0.75rem; resize: vertical; }
    .stg-input--sm { height: 2rem; font-size: 0.875rem; }

    /* ── Buttons ── */
    .stg-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.5rem 1.5rem; height: 2.5rem;
      font-family: var(--font-body); font-size: 1rem; font-weight: 500;
      border-radius: var(--radius); border: none; cursor: pointer; white-space: nowrap;
      transition: background-color 0.2s ease-in-out;
      background: hsl(var(--accent)); color: hsl(var(--accent-foreground));
    }
    .stg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .stg-btn svg { width: 1.125rem; height: 1.125rem; flex-shrink: 0; }
    .stg-btn--sm { height: 2rem; padding: 0.25rem 0.75rem; font-size: 0.875rem; gap: 0.25rem; }
    .stg-btn--block { width: 100%; }

    .stg-btn--ghost, .stg-btn--soft-blue, .stg-btn--soft-green, .stg-btn--soft-red, .stg-btn--soft-violet, .stg-btn--soft-cyan, .stg-btn--soft-purple, .stg-btn--soft-amber { 
      background: transparent; border: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); 
    }
    .stg-btn--ghost:hover:not(:disabled), .stg-btn--soft-blue:hover:not(:disabled), .stg-btn--soft-violet:hover:not(:disabled) { background: hsl(var(--muted)); }
    
    .stg-btn--primary { background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
    .stg-btn--success { background: hsl(var(--success)); color: #fff; }
    .stg-btn--danger { background: hsl(var(--danger)); color: #fff; }
    .stg-btn--violet { background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
    .stg-btn--cyan { background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
    .stg-btn--purple { background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }
    .stg-btn--info { background: hsl(var(--info)); color: #fff; }

    /* ── Cards / Panels (Replaced rounded SaaS cards with standard document blocks) ── */
    .stg-card-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
    .stg-job-card { 
      display: grid; grid-template-columns: 1fr; gap: 1rem; 
      padding: 1.5rem 0; border-bottom: 1px solid hsl(var(--border));
    }
    .stg-job-id { font-family: var(--font-display); font-size: 1.5rem; font-weight: 500; color: hsl(var(--foreground)); margin-bottom: 0.5rem; }
    .stg-job-meta { font-size: 1rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.25rem; }
    .stg-job-meta strong { color: hsl(var(--foreground)); font-weight: 500; }
    .stg-job-file { font-size: 1rem; color: hsl(var(--muted-foreground)); margin-bottom: 1rem; }
    .stg-job-file a { color: hsl(var(--accent)); text-decoration: none; font-weight: 500; }
    .stg-job-file a:hover { text-decoration: underline; }

    /* ── Checklist ── */
    .stg-checklist { margin: 1.5rem 0; }
    .stg-check-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; color: hsl(var(--foreground)); margin-bottom: 1rem; }
    .stg-check-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    .stg-check-item { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; cursor: pointer; color: hsl(var(--foreground)); }
    .stg-check-item input { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: hsl(var(--accent)); }
    .stg-check-item.stg-checked { color: hsl(var(--accent)); }
    .stg-actions-col { display: flex; flex-direction: column; gap: 0.75rem; }
    .stg-divider { border: none; border-top: 1px solid hsl(var(--border)); margin: 1.5rem 0; }

    /* ── Badges / chips ── */
    .stg-pill, .stg-chip { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border: 1px solid hsl(var(--border)); border-radius: 9999px; font-size: 0.875rem; font-weight: 500; white-space: nowrap; background: transparent; }

    /* ── Tables ── */
    .stg-table-card { margin-bottom: 2rem; overflow-x: auto; }
    .stg-table-scroll { overflow-x: auto; }
    .stg-table { width: 100%; border-collapse: collapse; min-width: 720px; font-size: 1rem; }
    .stg-th { border-bottom: 2px solid hsl(var(--foreground)); padding: 1rem 0.5rem; text-align: left; font-weight: 500; color: hsl(var(--foreground)); }
    .stg-th--num { text-align: right; }
    .stg-td { padding: 1rem 0.5rem; border-bottom: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); vertical-align: middle; }
    .stg-table tbody tr { transition: background-color 0.2s ease; }
    .stg-table tbody tr:hover { background-color: hsla(var(--accent), 0.05); }
    .stg-table tbody tr.stg-row--overdue { background: hsla(var(--danger), 0.1); }
    .stg-table tbody tr.stg-row--due { background: hsla(var(--warning), 0.1); }
    .stg-num { text-align: right; font-variant-numeric: tabular-nums; }
    .stg-strong { font-weight: 500; color: hsl(var(--foreground)); }
    .stg-muted { color: hsl(var(--muted-foreground)); }
    .stg-accent { font-weight: 500; }
    .stg-note { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }

    /* ── Progress ── */
    .stg-progress { display: flex; align-items: center; gap: 0.75rem; min-width: 140px; }
    .stg-range { flex: 1; min-width: 0; height: 4px; accent-color: hsl(var(--accent)); cursor: pointer; }
    .stg-range-val { font-size: 0.875rem; font-weight: 500; min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

    /* ── In-cell actions / empty state ── */
    .stg-cell-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stg-empty { padding: 3rem 1rem; text-align: left; font-size: 1.125rem; color: hsl(var(--muted-foreground)); }
    .stg-empty--card { border-bottom: 1px solid hsl(var(--border)); padding-bottom: 3rem; }

    /* ── Stage navigation bar ── */
    .stg-nav { display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; margin-bottom: 2rem; border-bottom: 1px solid hsl(var(--border)); overflow-x: auto; }
    .stg-nav-track { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
    .stg-nav-item { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border: none; background: transparent; color: hsl(var(--muted-foreground)); font-family: var(--font-body); font-size: 1rem; font-weight: 400; cursor: pointer; white-space: nowrap; }
    .stg-nav-item:hover { color: hsl(var(--foreground)); }
    .stg-nav-item.is-active { color: hsl(var(--accent)); font-weight: 500; border-bottom: 2px solid hsl(var(--accent)); margin-bottom: -1px; }
    .stg-nav-dot, .stg-nav-arrow { display: none; }
    .stg-nav-new { margin-left: auto; }

    /* ── Intake cards / forms ── */
    .stg-card { margin-bottom: 2rem; }
    .stg-card-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .stg-card-icon { font-size: 1.5rem; }
    .stg-card-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 500; color: hsl(var(--foreground)); }
    .stg-form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    .stg-form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .stg-form-field--full { grid-column: 1 / -1; }
    .stg-check { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; cursor: pointer; }
    .stg-check input { width: 1.25rem; height: 1.25rem; cursor: pointer; accent-color: hsl(var(--accent)); }
    .stg-intake-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .stg-order-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 0; border-bottom: 1px solid hsl(var(--border)); }
    .stg-order-main { flex: 1; min-width: 220px; }
    .stg-order-id { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; }
    .stg-order-sub { font-size: 1rem; color: hsl(var(--muted-foreground)); margin-top: 0.25rem; }
    .stg-alert { padding: 1rem; border-left: 4px solid hsl(var(--danger)); background: transparent; font-size: 1rem; margin-bottom: 1.5rem; }

    /* ── Record / history detail blocks ── */
    .stg-record-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .stg-record-id { font-family: var(--font-display); font-size: 2.5rem; font-weight: 500; margin-top: 0.5rem; line-height: 1.1; }
    .stg-detail-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; padding: 1.5rem 0; border-top: 1px solid hsl(var(--border)); border-bottom: 1px solid hsl(var(--border)); margin-bottom: 2rem; }
    .stg-detail-label { font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.25rem; }
    .stg-detail-value { font-size: 1.125rem; font-weight: 400; color: hsl(var(--foreground)); margin: 0; }

    .stg-note-box { margin-top: 1.5rem; padding: 1.5rem 0; border-top: 1px solid hsl(var(--border)); }
    .stg-note-box--info { }
    .stg-note-label { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; margin-bottom: 0.5rem; }
    .stg-note-text { font-size: 1rem; line-height: 1.6; margin: 0; }
    .stg-file-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stg-file-chip { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); text-decoration: none; font-size: 0.875rem; }
    .stg-file-chip:hover { border-color: hsl(var(--accent)); color: hsl(var(--accent)); }
    .stg-file-chip svg { width: 1rem; height: 1rem; }

    .stg-search { position: relative; flex: 1 1 260px; display: flex; flex-direction: column; gap: 0.5rem; }
    .stg-search svg { position: absolute; left: 0.75rem; bottom: 0.625rem; color: hsl(var(--muted-foreground)); width: 1.25rem; height: 1.25rem; }
    .stg-search .stg-input { padding-left: 2.5rem; }

    .stg-pill--success, .stg-pill--warning, .stg-pill--danger, .stg-pill--info, .stg-pill--violet, .stg-pill--neutral {
      background: transparent; border: 1px solid hsl(var(--border)); color: hsl(var(--foreground));
    }

    .stg-pager { display: flex; justify-content: center; align-items: center; gap: 1rem; margin: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .stg-pager-page { display: inline-flex; align-items: center; padding: 0 1rem; height: 2rem; border: 1px solid hsl(var(--border)); font-size: 0.875rem; font-weight: 500; color: hsl(var(--foreground)); }

    /* ── Responsive ── */
    @media (min-width: 480px) {
      .stg-check-grid { grid-template-columns: 1fr 1fr; }
      .stg-form-grid { grid-template-columns: 1fr 1fr; }
      .stg-detail-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (min-width: 768px) {
      .stg-root { padding: 2rem; }
      .stg-job-card { grid-template-columns: 2fr 1fr 1fr; align-items: center; }
      .stg-detail-grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 1024px) {
      .stg-root { padding: 3rem 4rem; }
      .stg-intake-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
    }
    @media (max-width: 479px) {
      .stg-btn, .stg-btn--sm { height: 2.75rem; font-size: 1rem; padding: 0 1rem; }
      .stg-input, .stg-select, .stg-textarea { height: 2.75rem; }
      .stg-title { font-size: 2rem; }
      .stg-td { height: auto; padding-top: 0.75rem; padding-bottom: 0.75rem; }
      .stg-nav-item { height: 2.75rem; padding: 0 1rem; font-size: 1rem; }
      .stg-form-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);
