import React, { useState, useEffect, useRef } from 'react';
import { Printer, ChevronRight, FileText, CheckCircle } from 'lucide-react';
import apiClient from "../../services/apiClient";
import { playSound } from '../../services/notificationManager';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const val = (v) => (v === null || v === undefined || String(v).trim() === '' ? '—' : v);

/* Full CSS shared by the in-app view AND the print tab so the printed
   payslip keeps the exact same clean layout. */
const PS_CSS = `
  .ps-page {
    --primary:#2563EB; --bg-page:#F5F6FA; --bg-card:#FFFFFF; --border:#E5E7EB;
    --text-primary:#111827; --text-secondary:#6B7280; --text-muted:#9CA3AF;
    --success:#16A34A; --success-bg:#DCFCE7;
    --danger:#DC2626; --danger-bg:#FEE2E2;
    --warning:#D97706; --warning-bg:#FEF3C7;
    --info:#0284C7; --info-bg:#E0F2FE;
    --gold:#D99E0B; --gold-text:#1F2937;
    display:flex; flex-direction:column;
    min-height:calc(100vh - 60px);
    background:var(--bg-page); color:var(--text-primary);
    font-family:'Inter','Segoe UI',Roboto,-apple-system,sans-serif;
    font-size:16px; line-height:1.5;
    padding:10px; box-sizing:border-box;
  }
  .ps-page *, .ps-page *::before, .ps-page *::after { box-sizing:border-box; }

  .ps-pagehead { padding:8px 4px 16px; }
  .ps-h1 { margin:0; font-size:clamp(26px,2.4vw,30px); font-weight:600; line-height:1.3; letter-spacing:-.02em; }
  .ps-h1sub { margin:2px 0 0; font-size:14px; color:var(--text-secondary); }

  .ps-layout { display:flex; gap:16px; flex:1; min-width:0; min-height:0; align-items:stretch; }

  /* History panel */
  .ps-history {
    width:300px; flex-shrink:0; display:flex; flex-direction:column;
    background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.06); overflow:hidden;
  }
  .ps-history-head { padding:20px 24px 16px; border-bottom:1px solid var(--border); }
  .ps-history-title { margin:0; font-size:18px; font-weight:600; line-height:1.3; }
  .ps-history-sub { margin:4px 0 0; font-size:13px; color:var(--text-secondary); }
  .ps-history-list { padding:12px; overflow-y:auto; flex:1; }
  .ps-empty { padding:32px 24px; text-align:center; color:var(--text-muted); font-size:14px; }
  .ps-item {
    padding:10px 16px; margin-bottom:8px; border-radius:8px; cursor:pointer;
    border:1px solid transparent; border-left:3px solid transparent;
    transition:background .15s ease-in-out, border-color .15s ease-in-out;
  }
  .ps-item:hover { background:#F9FAFB; }
  .ps-item.active { background:#EFF6FF; border-color:#BFDBFE; border-left:3px solid var(--primary); }
  .ps-item-top { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:14px; font-weight:600; }
  .ps-item.active .ps-item-top { color:var(--primary); }
  .ps-item-bottom { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:6px; }
  .ps-item-net { font-size:14px; font-weight:600; color:var(--success); font-variant-numeric:tabular-nums; white-space:nowrap; }

  .ps-badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:500; line-height:18px; text-transform:uppercase; letter-spacing:.03em; white-space:nowrap; }
  .ps-badge.paid   { background:var(--success-bg); color:var(--success); }
  .ps-badge.draft  { background:var(--warning-bg); color:var(--warning); }
  .ps-badge.info   { background:var(--info-bg); color:var(--info); }

  .ps-main { flex:1; min-width:0; display:flex; justify-content:center; align-items:flex-start; }
  .ps-content { width:100%; max-width:920px; }
  .ps-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-bottom:16px; }

  .ps-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    height:36px; padding:0 16px; border-radius:8px; border:none;
    font-family:inherit; font-size:14px; font-weight:500; cursor:pointer;
    transition:background .15s ease-in-out, color .15s ease-in-out, box-shadow .15s ease-in-out, transform .15s ease-in-out;
  }
  .ps-btn.primary { background:var(--primary); color:#fff; box-shadow:0 2px 4px rgba(37,99,235,.2); }
  .ps-btn.primary:hover { background:var(--gold); color:var(--gold-text); box-shadow:0 3px 10px rgba(217,158,11,.35); transform:translateY(-1px); }
  .ps-btn.primary:active { transform:translateY(0); }

  /* Document */
  .ps-doc {
    background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
    box-shadow:0 1px 3px rgba(0,0,0,.06);
    padding:32px 40px; color:var(--text-primary); min-width:0;
    transition:box-shadow .15s ease-in-out;
  }
  .ps-doc:hover { box-shadow:0 4px 12px rgba(0,0,0,.08); }

  .ps-dochead {
    display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;
    border-bottom:2px solid var(--text-primary); padding-bottom:20px; margin-bottom:24px;
  }
  .ps-brand { font-size:26px; font-weight:700; letter-spacing:-.5px; line-height:1.3; }
  .ps-loc { font-size:13px; color:var(--text-secondary); margin-top:2px; }
  .ps-docperiod { text-align:right; }
  .ps-doclabel { display:block; font-size:18px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text-secondary); line-height:1.3; }
  .ps-docmonth { display:block; font-size:15px; font-weight:700; margin-top:4px; }
  .ps-docstatus { display:inline-block; margin-top:8px; }

  /* Details */
  .ps-details {
    display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
    gap:12px 20px; background:#F9FAFB; border:1px solid var(--border);
    border-radius:10px; padding:16px 20px; margin-bottom:20px; min-width:0;
  }
  .ps-field { display:flex; flex-direction:column; gap:2px; min-width:0; }
  .ps-flabel { font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-secondary); }
  .ps-fvalue { font-size:15px; color:var(--text-primary); overflow-wrap:anywhere; word-break:break-word; }
  .ps-fvalue.strong { font-weight:600; font-size:16px; }
  .ps-fvalue.mono { font-family:'Consolas','Courier New',monospace; letter-spacing:.02em; }

  /* Smart totals: Earnings − Deductions = Net Pay (full-width bar below columns) */
  .ps-equation {
    display:flex; align-items:stretch; gap:12px; flex-wrap:wrap;
    margin-bottom:20px;
  }
  .eq-item {
    flex:1; min-width:170px; background:#fff; border:1px solid var(--border);
    border-radius:10px; padding:12px 16px; display:flex; flex-direction:column; justify-content:center; gap:2px;
  }
  .eq-item .k { font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.03em; color:var(--text-secondary); }
  .eq-item .v { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap; line-height:1.3; }
  .eq-item.gross .v { color:var(--success); }
  .eq-item.deduct .v { color:var(--danger); }
  .eq-op {
    align-self:center; flex-shrink:0; width:32px; height:32px;
    display:flex; align-items:center; justify-content:center;
    background:var(--bg-page); border:1px solid var(--border); border-radius:50%;
    font-size:18px; font-weight:700; color:var(--text-secondary);
  }
  .eq-net {
    flex:1.4; min-width:200px; background:var(--text-primary); border-radius:10px;
    padding:12px 20px; display:flex; flex-direction:column; justify-content:center; gap:2px;
  }
  .eq-net .k { font-size:12px; font-weight:500; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
  .eq-net .v { font-size:24px; font-weight:700; color:#34D399; font-variant-numeric:tabular-nums; white-space:nowrap; line-height:1.3; }

  /* Sections: Earnings & Deductions as tile grids — 3 columns each */
  .ps-block {
    border:1px solid var(--border); border-radius:10px;
    margin-bottom:20px; overflow:hidden;
    transition:box-shadow .15s ease-in-out;
  }
  .ps-block:hover { box-shadow:0 4px 12px rgba(0,0,0,.08); }
  .ps-block.earn   { border-top:4px solid var(--success); }
  .ps-block.deduct { border-top:4px solid var(--danger); }

  .ps-sectitle {
    margin:0; padding:12px 20px;
    font-size:16px; font-weight:600; text-transform:uppercase; letter-spacing:.03em;
    line-height:1.3; display:flex; justify-content:space-between; align-items:center; gap:8px;
  }
  .ps-block.earn   .ps-sectitle { background:#F0FDF4; color:var(--success); border-bottom:1px solid #BBF7D0; }
  .ps-block.deduct .ps-sectitle { background:#FEF2F2; color:var(--danger);   border-bottom:1px solid #FECACA; }
  .ps-sechead-amt { font-size:13px; font-weight:600; color:var(--text-secondary); font-variant-numeric:tabular-nums; white-space:nowrap; }

  /* 3-column value tiles */
  .ps-tiles {
    display:grid; grid-template-columns:repeat(3, minmax(0,1fr));
    gap:12px; padding:16px 20px;
  }
  .ps-tile {
    background:#fff; border:1px solid var(--border); border-radius:10px;
    padding:12px 14px; min-width:0;
    display:flex; flex-direction:column; gap:4px;
    transition:box-shadow .15s ease-in-out, transform .15s ease-in-out, border-color .15s ease-in-out;
  }
  .ps-tile:hover { box-shadow:0 4px 12px rgba(0,0,0,.08); transform:translateY(-1px); }
  .ps-block.earn   .ps-tile { border-left:3px solid #86EFAC; }
  .ps-block.deduct .ps-tile { border-left:3px solid #FCA5A5; }
  .t-label { font-size:13px; font-weight:600; color:var(--text-primary); line-height:1.35; overflow-wrap:anywhere; }
  .t-value {
    font-size:19px; font-weight:700; color:var(--text-primary);
    font-variant-numeric:tabular-nums; white-space:nowrap; line-height:1.3;
  }
  .t-hint { font-size:11.5px; color:var(--text-muted); line-height:1.4; overflow-wrap:anywhere; }

  .ps-tile.zero { background:#FAFAFA; border-style:dashed; border-left-style:solid; }
  .ps-tile.zero .t-value { color:var(--text-muted); font-weight:500; }
  .ps-tile.zero .t-label { color:var(--text-secondary); }

  .ps-foot { border-top:1px solid var(--border); padding-top:16px; text-align:center; color:var(--text-muted); font-size:12.5px; }
  .ps-foot p { margin:0 0 4px; }

  .ps-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%; padding:64px 24px; color:var(--text-muted); font-size:15px; background:var(--bg-card); border:1px dashed var(--border); border-radius:10px; }
  .ps-errorbox { margin:auto; background:var(--danger-bg); color:var(--danger); border:1px solid var(--border); border-radius:10px; padding:24px 32px; font-size:15px; }

  .ps-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; flex:1; min-height:70vh; color:var(--text-secondary); font-size:14px; }
  .ps-gear { position:relative; width:52px; height:52px; animation:ps-rot 1s linear infinite; }
  .ps-gear span { position:absolute; left:50%; top:50%; width:6px; height:15px; margin-left:-3px; margin-top:-26px; background:var(--primary); border-radius:3px; transform-origin:50% 26px; opacity:.9; }
  .ps-gear i { position:absolute; left:50%; top:50%; width:22px; height:22px; margin:-11px 0 0 -11px; border:3px solid var(--primary); border-radius:50%; }
  @keyframes ps-rot { to { transform:rotate(360deg); } }

  .ps-toast {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    display:flex; align-items:center; gap:10px;
    max-width:min(380px, calc(100vw - 32px));
    background:#fff; border:1px solid var(--border); border-left:4px solid var(--success);
    border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.12);
    padding:12px 16px; font-size:14px; animation:ps-slide .25s ease-out;
  }
  .ps-toast svg { color:var(--success); flex-shrink:0; }
  .ps-toast.warn { border-left-color:var(--warning); }
  .ps-toast.warn svg { color:var(--warning); }
  @keyframes ps-slide { from { transform:translateX(24px); opacity:0; } to { transform:none; opacity:1; } }

  @media (max-width:1280px) { .ps-history { width:270px; } }
  @media (max-width:1024px) {
    .ps-page { padding:6px; }
    .ps-layout { gap:12px; }
    .ps-doc { padding:24px; }
  }
  @media (max-width:900px) {
    /* Tiles drop to 2 per row on smaller screens */
    .ps-tiles { grid-template-columns:repeat(2, minmax(0,1fr)); padding:12px 16px; }
  }
  @media (max-width:768px) {
    .ps-page { padding:4px; }
    .ps-layout { flex-direction:column; }
    .ps-history { width:100%; max-height:264px; }
    .ps-main { width:100%; }
    .ps-docperiod { text-align:left; }
    .ps-btn { height:44px; width:100%; }
    .ps-details { padding:12px 16px; }
    .ps-tiles { gap:10px; padding:12px; }
    .t-value { font-size:17px; }
    .eq-op { display:none; }
    .eq-item, .eq-net { min-width:100%; }
  }
  @media (max-width:480px) {
    .ps-h1 { font-size:24px; }
    .ps-doc { padding:16px 12px; }
    .ps-tbl col.c-amt { width:108px; }
  }

  @media print {
    .ps-page { background:#fff; padding:0; }
    .no-print, .ps-actions, .ps-toast, .ps-pagehead { display:none !important; }
    .ps-layout { display:block; }
    .ps-doc { border:none; box-shadow:none; }
    .ps-colcard:hover, .ps-doc:hover { box-shadow:none; transform:none; }
  }
`;

const PayslipStyles = () => <style>{PS_CSS}</style>;

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState(null);

  const printRef = useRef();
  const toastTimer = useRef(null);

  const showToastMsg = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const res = await apiClient.get('/hr/etp/my-payslips');
        const data = res?.data?.data?.payslips || res?.data?.data || res?.data || [];
        setPayslips(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelected(data[0]);
      } catch (err) {
        setError('Could not load payslips. Please contact HR.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const handlePrint = () => {
    playSound('ready');
    const content = printRef.current;
    if (!content) return;

    const win = window.open('', '_blank', 'width=920,height=1100');
    if (!win) {
      showToastMsg('Pop-up blocked — please allow pop-ups to print.');
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Payslip — ${val(selected.full_name)} — ${MONTH_NAMES[selected.month_number - 1]} ${selected.year_number}</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; padding:24px; font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif; color:#111827; background:#fff; font-size:14px; line-height:1.5; }
  .doc { max-width:850px; margin:0 auto; }
  .doc .ps-actions, .doc .no-print { display:none !important; }
  @page { size:A4; margin:12mm; }
  .hint { text-align:center; color:#9CA3AF; font-size:12px; margin-top:16px; }
</style>
<style>${PS_CSS.replace(/\.ps-page\s*\{/, '.print-root {')}</style>
</head>
<body>
<div class="doc print-root">${content.innerHTML}</div>
<p class="hint">If the print dialog did not open automatically, press Ctrl+P to print or save as PDF.</p>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},350);});<\/script>
</body>
</html>`);
    win.document.close();
    showToastMsg('Payslip opened in a new tab for printing.');
  };

  if (loading) return (
    <div className="ps-page">
      <div className="ps-loading">
        <div className="ps-gear">
          {[...Array(8)].map((_, i) => <span key={i} style={{ transform: `rotate(${i * 45}deg)` }} />)}
          <i />
        </div>
        <p>Loading your payslips…</p>
      </div>
      <PayslipStyles />
    </div>
  );

  if (error) return (
    <div className="ps-page">
      <div className="ps-errorbox">{error}</div>
      <PayslipStyles />
    </div>
  );

  const totalDeductions =
    Number(selected.deduction_tax) +
    Number(selected.deduction_pension) +
    Number(selected.deduction_absent) +
    Number(selected.deduction_loan);

  const badgeClass =
    selected.status === 'Paid' ? 'paid' :
    selected.status === 'Draft' ? 'draft' : 'info';

  /* Every salary component — label, exact value, and a short explanation.
     Zeros are still rendered (dimmed) so no data is ever hidden. */
  const earningsRows = [
    ['Basic Salary',            selected.base_salary,            'Monthly base salary'],
    ['Housing Allowance',       selected.housing_allowance,      'Allowance'],
    ['Transport Allowance',     selected.transport_allowance,    'Allowance'],
    ['Communication Allowance', selected.communication_allowance,'Allowance'],
    ['Overtime Pay',            selected.overtime_pay,           'Extra hours worked'],
    ['Bonus Pay',               selected.bonus_pay,              'Performance bonus'],
  ];

  const deductionRows = [
    ['Income Tax',        selected.deduction_tax,   'PAYE income tax'],
    ['Pension (7%)',      selected.deduction_pension,'Employee share — 7% of basic'],
    ['Absence Deduction', selected.deduction_absent,'Unpaid absence days'],
    ['Loan Repayment',    selected.deduction_loan,  'Monthly loan installment'],
  ];

  const renderRows = null; // replaced by tile grids

  return (
    <div className="ps-page">

      <div className="ps-pagehead no-print">
        <h1 className="ps-h1">My Payslips</h1>
        <p className="ps-h1sub">Monthly salary statements — full breakdown of earnings, deductions and payment details</p>
      </div>

      <div className="ps-layout">

        {/* History */}
        <aside className="ps-history no-print">
          <div className="ps-history-head">
            <h2 className="ps-history-title">Payslip History</h2>
            <p className="ps-history-sub">Select a month to view details</p>
          </div>

          {payslips.length === 0 ? (
            <div className="ps-empty">No payslips available yet.</div>
          ) : (
            <div className="ps-history-list">
              {payslips.map((p, idx) => (
                <div
                  key={p.component_id || idx}
                  className={`ps-item${selected && selected.component_id === p.component_id ? ' active' : ''}`}
                  onClick={() => setSelected(p)}
                >
                  <div className="ps-item-top">
                    <span>{MONTH_NAMES[p.month_number - 1]} {p.year_number}</span>
                    {(selected && selected.component_id === p.component_id) && <ChevronRight size={18} />}
                  </div>
                  <div className="ps-item-bottom">
                    <span className="ps-item-net">{fmt(p.net_pay)} ETB</span>
                    <span className={`ps-badge ${p.status === 'Paid' ? 'paid' : p.status === 'Draft' ? 'draft' : 'info'}`}>
                      {val(p.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Document */}
        <main className="ps-main">
          {selected ? (
            <div className="ps-content">

              <div className="ps-actions no-print">
                <button className="ps-btn primary" onClick={handlePrint}>
                  <Printer size={17} /> Print Payslip
                </button>
              </div>

              <div className="ps-doc" ref={printRef}>

                {/* Header */}
                <div className="ps-dochead">
                  <div>
                    <div className="ps-brand">SUTANA</div>
                    <div className="ps-loc">Addis Ababa, Ethiopia</div>
                  </div>
                  <div className="ps-docperiod">
                    <span className="ps-doclabel">Payslip</span>
                    <span className="ps-docmonth">{MONTH_NAMES[selected.month_number - 1]} {selected.year_number}</span>
                    <span className={`ps-badge ${badgeClass} ps-docstatus`}>{val(selected.status)}</span>
                  </div>
                </div>

                {/* Employee + account details */}
                <div className="ps-details">
                  <div className="ps-field"><span className="ps-flabel">Employee Name</span><span className="ps-fvalue strong">{val(selected.full_name)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Employee ID</span><span className="ps-fvalue mono">{val(selected.employee_id)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Department</span><span className="ps-fvalue">{val(selected.department_name)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Designation</span><span className="ps-fvalue">{val(selected.position_title)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Payment Method</span><span className="ps-fvalue">{selected.payment_method ? String(selected.payment_method).replace(/_/g, ' ') : 'Bank Transfer'}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Bank Name</span><span className="ps-fvalue">{val(selected.bank_name)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Account Number</span><span className="ps-fvalue mono">{val(selected.bank_account_number)}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Hire Date</span><span className="ps-fvalue">{selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : '—'}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Calculated On</span><span className="ps-fvalue">{selected.calculated_date ? new Date(selected.calculated_date).toLocaleDateString() : '—'}</span></div>
                  <div className="ps-field"><span className="ps-flabel">Approved On</span><span className="ps-fvalue">{selected.approved_date ? new Date(selected.approved_date).toLocaleDateString() : 'Pending approval'}</span></div>
                </div>

                {/* Earnings — 3-column value tiles */}
                <section className="ps-block earn">
                  <h3 className="ps-sectitle">
                    <span>Earnings</span>
                    <span className="ps-sechead-amt">ETB {fmt(selected.gross_pay)}</span>
                  </h3>
                  <div className="ps-tiles">
                    {earningsRows.map(([label, v, hint]) => (
                      <div key={label} className={`ps-tile${!Number(v) ? ' zero' : ''}`}>
                        <div className="t-label">{label}</div>
                        <div className="t-value">{fmt(v)}</div>
                        <div className="t-hint">{hint}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Deductions — 3-column value tiles */}
                <section className="ps-block deduct">
                  <h3 className="ps-sectitle">
                    <span>Deductions</span>
                    <span className="ps-sechead-amt">ETB {fmt(totalDeductions)}</span>
                  </h3>
                  <div className="ps-tiles">
                    {deductionRows.map(([label, v, hint]) => (
                      <div key={label} className={`ps-tile${!Number(v) ? ' zero' : ''}`}>
                        <div className="t-label">{label}</div>
                        <div className="t-value">{fmt(v)}</div>
                        <div className="t-hint">{hint}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Final: Total Earnings − Total Deductions = Net Pay */}
                <div className="ps-equation">
                  <div className="eq-item gross">
                    <span className="k">Total Earnings</span>
                    <span className="v">{fmt(selected.gross_pay)} ETB</span>
                  </div>
                  <span className="eq-op">−</span>
                  <div className="eq-item deduct">
                    <span className="k">Total Deductions</span>
                    <span className="v">{fmt(totalDeductions)} ETB</span>
                  </div>
                  <span className="eq-op">=</span>
                  <div className="eq-net">
                    <span className="k">Net Pay (Transferable Amount)</span>
                    <span className="v">{fmt(selected.net_pay)} ETB</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="ps-foot">
                  <p>This is a system generated document and does not require a signature.</p>
                  <p>Generated on {new Date().toLocaleDateString()} via SUTANA HR &amp; Payroll System · Payslip #{val(selected.component_id)}</p>
                </div>

              </div>
            </div>
          ) : (
            <div className="ps-placeholder">
              <FileText size={48} />
              <p>Select a payslip from the list to view details</p>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className={`ps-toast${toast.includes('blocked') ? ' warn' : ''}`}>
          <CheckCircle size={18} /> <span>{toast}</span>
        </div>
      )}

      <PayslipStyles />
    </div>
  );
};

export default EmployeePayslips;
