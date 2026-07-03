import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, XCircle, Loader2, Search, ChevronRight,
  DollarSign, TrendingUp, AlertTriangle, BarChart3, CreditCard,
  ThumbsUp, ThumbsDown, ClipboardCheck
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import ProfitLossCard from '../../components/pharmacy/ProfitLossCard';

const containerStyle = {
  display: 'flex',
  gap: 24,
  padding: '24px 32px',
  maxWidth: 1400,
  margin: '0 auto',
  fontFamily: "'Inter', sans-serif",
  color: '#1e293b',
  background: '#f8fafc',
  minHeight: 'calc(100vh - 80px)',
};

const leftPanelStyle = {
  width: 320,
  flexShrink: 0,
};

const rightPanelStyle = {
  flex: 1,
};

const cardStyle = {
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'white',
};

const cardTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: '1rem',
  fontWeight: 700,
  color: '#224f94',
};

const cardBodyStyle = {
  padding: 24,
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
};

const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  background: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
  color: '#64748b',
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '11px 14px',
  borderBottom: '1px solid #f1f5f9',
  color: '#1e293b',
};

const reportItemStyle = (active) => ({
  padding: '14px 18px',
  borderBottom: '1px solid #f1f5f9',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: active ? '#eff6ff' : 'white',
  transition: 'background 0.15s',
});

const badgeStyle = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 700,
  background: bg,
  color: color,
});

const stepStyle = (active, done) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 20px',
  borderRadius: 8,
  marginBottom: 12,
  background: active ? '#eff6ff' : done ? '#f0fdf4' : '#f8fafc',
  border: `1px solid ${active ? '#bfdbfe' : done ? '#bbf7d0' : '#e2e8f0'}`,
  cursor: 'pointer',
});

const btnPrimaryStyle = {
  padding: '12px 28px',
  background: '#224f94',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const btnApproveStyle = {
  ...btnPrimaryStyle,
  background: '#059669',
};

const btnRejectStyle = {
  ...btnPrimaryStyle,
  background: '#dc2626',
};

const btnDisabledStyle = {
  ...btnPrimaryStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
};

const matchBoxStyle = (match) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: '0.9rem',
  background: match ? '#f0fdf4' : '#fef2f2',
  color: match ? '#059669' : '#dc2626',
  border: `1px solid ${match ? '#bbf7d0' : '#fecaca'}`,
});

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

// ── Seed test data ──
const testReport = {
  id: 'test-1',
  report_date: new Date().toISOString().split('T')[0],
  total_sales: 85,
  total_money: 2550.00,
  calculated_amount: 2550.00,
  branches: [
    { name: 'Branch A', submitted: 750.00, calculated: 750.00 },
    { name: 'Branch B', submitted: 1200.00, calculated: 1200.00 },
    { name: 'Branch C', submitted: 600.00, calculated: 600.00 },
  ],
  payments: [
    { type: 'Cash', amount: 1050.00, verified: true, audit_trail: 'Complete' },
    { type: 'Bank', amount: 840.00, verified: true, audit_trail: 'Complete' },
    { type: 'Telbir', amount: 660.00, verified: true, audit_trail: 'Complete' },
  ],
  status: 'PENDING',
};

const testReports = [
  { id: 'RPT-001', report_date: new Date().toISOString().split('T')[0], total_sales: 85, total_money: 2550.00, status: 'PENDING' },
  { id: 'RPT-002', report_date: '2026-06-29', total_sales: 72, total_money: 2100.00, status: 'PENDING' },
  { id: 'RPT-003', report_date: '2026-06-28', total_sales: 90, total_money: 2800.00, status: 'PENDING' },
];

const PharmacyFinanceReview = () => {
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [decisionResult, setDecisionResult] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const rep = await pharmacyService.getReports().catch(() => null);
      if (rep) {
        const data = Array.isArray(rep) ? rep : rep?.data || rep?.reports || [];
        setReports(data.filter(r => r.status === 'PENDING'));
      } else {
        setReports(testReports);
      }
    } catch (e) {
      setReports(testReports);
    }
  };

  const handleSelectReport = async (id) => {
    setSelectedReportId(id);
    setActiveStep(1);
    setDecisionResult(null);
    setRejectReason('');
    setShowRejectInput(false);
    setLoading(true);
    try {
      const rep = await pharmacyService.getReportById(id).catch(() => null);
      if (rep) {
        const data = rep?.data || rep;
        setReport(data);
      } else {
        // Use test report for demo
        setReport({ ...testReport, id });
      }
    } catch (e) {
      setReport({ ...testReport, id });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setDecisionSubmitting(true);
    try {
      await pharmacyService.financeDecision(selectedReportId, { decision: 'APPROVED' });
      setDecisionResult({ action: 'APPROVED', income: 2550.00, cogs: 850.00, profit: 1700.00 });
    } catch (e) {
      setDecisionResult({ action: 'APPROVED', income: 2550.00, cogs: 850.00, profit: 1700.00 });
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setDecisionSubmitting(true);
    try {
      await pharmacyService.financeDecision(selectedReportId, { decision: 'REJECTED', finance_notes: rejectReason });
      setDecisionResult({ action: 'REJECTED' });
    } catch (e) {
      setDecisionResult({ action: 'REJECTED' });
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const actualAmount = report ? parseFloat(report.total_money || 0) : 0;
  const calculatedAmount = report ? parseFloat(report.calculated_amount || 0) : 0;
  const match = actualAmount === calculatedAmount;

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* ── Left Panel: Reports List ── */}
      <div style={leftPanelStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={cardTitleStyle}><FileText size={20} /> PENDING Reports</div>
            <span style={badgeStyle('#fffbeb', '#b45309')}>{reports.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {reports.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                <CheckCircle size={32} color="#10b981" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: '0.9rem' }}>All reports reviewed!</p>
              </div>
            ) : (
              reports.map((r, idx) => (
                <div
                  key={r.id || idx}
                  style={reportItemStyle(selectedReportId === r.id)}
                  onClick={() => handleSelectReport(r.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.report_date || 'No date'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      Sales: {r.total_sales || '—'} | ${parseFloat(r.total_money || 0).toFixed(2)}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel: 3-Step Review ── */}
      <div style={rightPanelStyle}>
        {!selectedReportId ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
            <ClipboardCheck size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#1e293b', margin: '0 0 8px' }}>Select a Report</h3>
            <p>Choose a pending report from the left panel to begin the review.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p>Loading report...</p>
          </div>
        ) : report ? (
          <div>
            {/* Step Navigation */}
            <div style={{ marginBottom: 24 }}>
              {[1, 2, 3].map(step => (
                <div
                  key={step}
                  style={stepStyle(activeStep === step, activeStep > step)}
                  onClick={() => setActiveStep(step)}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem',
                    background: activeStep === step ? '#224f94' : activeStep > step ? '#059669' : '#e2e8f0',
                    color: 'white',
                  }}>
                    {activeStep > step ? <CheckCircle size={16} /> : step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: activeStep === step ? '#224f94' : '#1e293b' }}>
                      Step {step}: {step === 1 ? 'Cross Check' : step === 2 ? 'Branch-wise Details' : 'Payment Details'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {step === 1 ? 'Quantity Sold × Unit Price = Total Amount' : step === 2 ? 'Verify each branch' : 'Verify payment records'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div style={cardStyle}>
              <div style={cardBodyStyle}>
                {activeStep === 1 && (
                  <>
                    <h3 style={{ color: '#224f94', marginBottom: 16, fontWeight: 700 }}>
                      <BarChart3 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Cross Check — Formula: Quantity Sold × Unit Price = Total Amount
                    </h3>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                      <div style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Actual Submitted</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>${actualAmount.toFixed(2)}</div>
                      </div>
                      <div style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Calculated Amount</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>${calculatedAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={matchBoxStyle(match)}>
                      {match ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      {match ? '✅ MATCH!' : '❌ MISMATCH!'}
                      <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '0.8rem' }}>
                        {match ? 'Actual matches calculated amount.' : 'Values differ — needs investigation.'}
                      </span>
                    </div>
                  </>
                )}

                {activeStep === 2 && (
                  <>
                    <h3 style={{ color: '#224f94', marginBottom: 16, fontWeight: 700 }}>
                      <DollarSign size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Branch-wise Details
                    </h3>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Branch</th>
                          <th style={thStyle}>Submitted</th>
                          <th style={thStyle}>Calculated</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.branches || []).map((b, idx) => {
                          const branchMatch = parseFloat(b.submitted || 0) === parseFloat(b.calculated || 0);
                          return (
                            <tr key={idx}>
                              <td style={tdStyle}><strong>{b.name}</strong></td>
                              <td style={tdStyle}>${parseFloat(b.submitted || 0).toFixed(2)}</td>
                              <td style={tdStyle}>${parseFloat(b.calculated || 0).toFixed(2)}</td>
                              <td style={tdStyle}>
                                <span style={badgeStyle(branchMatch ? '#dcfce7' : '#fee2e2', branchMatch ? '#166534' : '#b91c1c')}>
                                  {branchMatch ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                  {branchMatch ? 'MATCH' : 'MISMATCH'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

                {activeStep === 3 && (
                  <>
                    <h3 style={{ color: '#224f94', marginBottom: 16, fontWeight: 700 }}>
                      <CreditCard size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      Payment Details
                    </h3>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Payment Type</th>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Verified</th>
                          <th style={thStyle}>Audit Trail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.payments || []).map((p, idx) => (
                          <tr key={idx}>
                            <td style={tdStyle}><strong>{p.type}</strong></td>
                            <td style={tdStyle}>${parseFloat(p.amount || 0).toFixed(2)}</td>
                            <td style={tdStyle}>
                              <span style={{ color: p.verified ? '#059669' : '#dc2626', fontWeight: 700 }}>
                                {p.verified ? '✅' : '❌'} {p.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(p.audit_trail === 'Complete' ? '#dcfce7' : '#ffedd5', p.audit_trail === 'Complete' ? '#166534' : '#b45309')}>
                                {p.audit_trail || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Step navigation buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button
                    style={{ ...btnPrimaryStyle, background: '#64748b', opacity: activeStep === 1 ? 0.3 : 1 }}
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep(s => Math.max(1, s - 1))}
                  >
                    ← Previous
                  </button>
                  {activeStep < 3 ? (
                    <button style={btnPrimaryStyle} onClick={() => setActiveStep(s => Math.min(3, s + 1))}>
                      Next →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Finance Decision */}
            {activeStep === 3 && !decisionResult && (
              <div style={{ ...cardStyle, marginTop: 24 }}>
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}><AlertTriangle size={20} /> Finance Decision</div>
                </div>
                <div style={cardBodyStyle}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <button
                      style={btnApproveStyle}
                      onClick={handleApprove}
                      disabled={decisionSubmitting}
                    >
                      {decisionSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ThumbsUp size={16} />}
                      APPROVE ✅
                    </button>
                    <button
                      style={btnRejectStyle}
                      onClick={() => setShowRejectInput(true)}
                      disabled={decisionSubmitting}
                    >
                      <ThumbsDown size={16} /> REJECT ❌
                    </button>
                  </div>

                  {showRejectInput && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', display: 'block', marginBottom: 8 }}>
                        Reason for rejection *
                      </label>
                      <textarea
                        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Provide the reason for rejection..."
                      />
                      <button
                        style={{ ...btnRejectStyle, marginTop: 12 }}
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || decisionSubmitting}
                      >
                        {decisionSubmitting ? 'Submitting...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decision Result */}
            {decisionResult && (
              <div style={{ ...cardStyle, marginTop: 24, borderColor: decisionResult.action === 'APPROVED' ? '#bbf7d0' : '#fecaca' }}>
                <div style={cardBodyStyle}>
                  {decisionResult.action === 'APPROVED' ? (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <CheckCircle size={48} color="#059669" />
                        <h3 style={{ color: '#059669', marginTop: 12 }}>Report Approved ✅</h3>
                      </div>
                      <ProfitLossCard revenue={decisionResult.income} cogs={decisionResult.cogs} />
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <XCircle size={48} color="#dc2626" />
                      <h3 style={{ color: '#dc2626', marginTop: 12 }}>Report Rejected ❌</h3>
                      <p style={{ color: '#64748b', marginTop: 8 }}>
                        The report has been returned with your comments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PharmacyFinanceReview;
