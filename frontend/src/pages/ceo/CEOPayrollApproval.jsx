import React, { useState, useEffect, useCallback } from 'react';
import CEOApprovalNav from './CEOApprovalNav';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import { CheckCircle, XCircle, Clock, Users, DollarSign, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const monthName = (m) => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

const StatusBadge = ({ status }) => {
  const map = {
    'Draft':                { bg:'#F3F4F6', color:'#374151' },
    'Pending CEO Approval': { bg:'#FEF3C7', color:'#92400E' },
    'Approved':             { bg:'#D1FAE5', color:'#065F46' },
    'Rejected':             { bg:'#FEE2E2', color:'#991B1B' },
    'Paid':                 { bg:'#DBEAFE', color:'#1E40AF' },
  };
  const s = map[status] || map['Draft'];
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:4, fontSize:12, fontWeight:600, background:s.bg, color:s.color }}>{status}</span>;
};

const CEOPayrollApproval = () => {
  const [payrolls, setPayrolls]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expanded, setExpanded]           = useState(null);
  const [detail, setDetail]               = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [actionModal, setActionModal]     = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [acting, setActing]               = useState(false);
  const [toast, setToast]                 = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),4500); };

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hr/etp/payroll/approved-list');
      setPayrolls(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch { showToast('Failed to load payrolls','error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const loadDetail = async (p) => {
    const key = `${p.month_number}-${p.year_number}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (detail[key]) return;
    setLoadingDetail(key);
    try {
      const res = await apiClient.get(`/hr/etp/payroll/summary/${p.month_number}/${p.year_number}`);
      const d = res?.data || res;
      setDetail(prev => ({ ...prev, [key]: { employees: d.employees || [] } }));
    } catch { showToast('Failed to load detail','error'); }
    finally { setLoadingDetail(null); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { payroll, type } = actionModal;
    if (type==='reject' && !rejectReason.trim()) { showToast('Please enter a rejection reason','error'); return; }
    setActing(true);
    try {
      await apiClient.post('/hr/etp/payroll/approve', { month:payroll.month_number, year:payroll.year_number, action:type==='approve'?'approve':'reject', reason:rejectReason||undefined });
      showToast(type==='approve' ? `Payroll for ${monthName(payroll.month_number)} ${payroll.year_number} approved ✓` : 'Payroll rejected', type==='approve'?'success':'error');
      setActionModal(null); setRejectReason(''); setDetail({}); setExpanded(null); fetchPayrolls();
    } catch(err) { showToast(err?.response?.data?.message||'Action failed','error'); }
    finally { setActing(false); }
  };

  const pending  = payrolls.filter(p=>p.approval_status==='Pending CEO Approval');
  const approved = payrolls.filter(p=>['Approved','Paid'].includes(p.approval_status));
  const totalNetPending = pending.reduce((s,p)=>s+parseFloat(p.company_net_pay||0),0);

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", color:'#111827' }}>
      <CEOApprovalNav />

      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, background:toast.type==='success'?'#16A34A':'#DC2626', color:'#fff', padding:'12px 20px', borderRadius:8, fontSize:14, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.type==='success'?<CheckCircle size={16}/>:<AlertTriangle size={16}/>} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Salary Approvals</h1>
          <p style={{ color:'#6B7280', fontSize:14, margin:'4px 0 0' }}>Review and approve monthly payroll submissions from HR</p>
        </div>
        <button onClick={fetchPayrolls} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:1, background:'#E5E7EB', border:'1px solid #E5E7EB', borderRadius:10, overflow:'hidden', marginBottom:24 }}>
        {[
          { label:'Pending Approval',  value:pending.length,                  icon:<Clock size={20} color="#D97706"/>,      bg:'#FFFBEB' },
          { label:'Approved / Paid',   value:approved.length,                 icon:<CheckCircle size={20} color="#16A34A"/>, bg:'#F0FDF4' },
          { label:'Pending Net Value', value:formatCurrency(totalNetPending), icon:<DollarSign size={20} color="#2563EB"/>, bg:'#EFF6FF' },
          { label:'Total Records',     value:payrolls.length,                 icon:<Users size={20} color="#7C3AED"/>,      bg:'#FAF5FF' },
        ].map((k,i) => (
          <div key={i} style={{ background:k.bg, padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              {k.icon}
              <span style={{ fontSize:12, fontWeight:500, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em' }}>{k.label}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'#111827' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <SegmentedSpinner size={48} center label="Loading payroll records…" />
        </div>
      ) : payrolls.length===0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, color:'#6B7280' }}>
          <Clock size={40} style={{ marginBottom:12, opacity:0.4 }}/>
          <p style={{ fontWeight:600, fontSize:16 }}>No payroll submissions yet</p>
          <p style={{ fontSize:14 }}>HR will submit payrolls for your review here.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {payrolls.map((p) => {
            const key = `${p.month_number}-${p.year_number}`;
            const isExpanded = expanded===key;
            const d = detail[key];
            const isPending = p.approval_status==='Pending CEO Approval';
            return (
              <div key={key} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, overflow:'hidden', boxShadow:isPending?'0 0 0 2px #FEF3C7':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', flexWrap:'wrap' }}>
                  <div style={{ flex:'1 1 160px' }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{monthName(p.month_number)} {p.year_number}</div>
                    <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{p.total_employees} employee{p.total_employees!==1?'s':''}</div>
                  </div>
                  <div style={{ flex:'1 1 120px', textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'#6B7280' }}>Total Net Pay</div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{formatCurrency(p.company_net_pay)}</div>
                  </div>
                  <div style={{ flex:'1 1 120px', textAlign:'center' }}><StatusBadge status={p.approval_status}/></div>
                  {isPending && (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>setActionModal({payroll:p,type:'approve'})} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#16A34A', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}><CheckCircle size={14}/> Approve</button>
                      <button onClick={()=>setActionModal({payroll:p,type:'reject'})} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#DC2626', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}><XCircle size={14}/> Reject</button>
                    </div>
                  )}
                  <button onClick={()=>loadDetail(p)} style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:6, padding:'6px 10px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}>
                    {isExpanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
                    <span style={{ fontSize:12 }}>Details</span>
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:'1px solid #E5E7EB', padding:'16px 20px', background:'#FAFAFA' }}>
                    {loadingDetail===key ? (
                      <div style={{ textAlign:'center', padding:24, color:'#6B7280', fontSize:14 }}>Loading breakdown…</div>
                    ) : d ? (
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                          <thead>
                            <tr style={{ background:'#F3F4F6' }}>
                              {['#','Employee','Base Salary','Allowances','Extras','Deductions','Net Pay'].map(h=>(
                                <th key={h} style={{ padding:'10px 12px', textAlign:(h==='#'||h==='Employee')?'left':'right', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em', color:'#6B7280', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {d.employees.map((emp,idx)=>{
                              const allow = parseFloat(emp.housing_allowance||0)+parseFloat(emp.transport_allowance||0)+parseFloat(emp.communication_allowance||0);
                              const extra = parseFloat(emp.overtime_pay||0)+parseFloat(emp.bonus_pay||0);
                              const deduct= parseFloat(emp.deduction_absent||0)+parseFloat(emp.deduction_loan||0)+parseFloat(emp.deduction_tax||0)+parseFloat(emp.deduction_pension||0);
                              return (
                                <tr key={emp.employee_id} style={{ borderBottom:'1px solid #F3F4F6' }}>
                                  <td style={{ padding:'10px 12px', color:'#9CA3AF', fontSize:12 }}>{idx+1}</td>
                                  <td style={{ padding:'10px 12px' }}><div style={{ fontWeight:600 }}>{emp.full_name}</div><div style={{ fontSize:11, color:'#9CA3AF' }}>#{emp.employee_id}</div></td>
                                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:500 }}>{formatCurrency(emp.base_salary)}</td>
                                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#16A34A' }}>{allow>0?`+${formatCurrency(allow)}`:'—'}</td>
                                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#0284C7' }}>{extra>0?`+${formatCurrency(extra)}`:'—'}</td>
                                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#DC2626' }}>{deduct>0?`-${formatCurrency(deduct)}`:'—'}</td>
                                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700 }}>{formatCurrency(emp.net_pay)}</td>
                                </tr>
                              );
                            })}
                            <tr style={{ background:'#F9FAFB', borderTop:'2px solid #E5E7EB' }}>
                              <td colSpan={2} style={{ padding:'12px', fontWeight:700, fontSize:12, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em' }}>Total ({d.employees.length})</td>
                              <td style={{ padding:'12px', textAlign:'right', fontWeight:700 }}>{formatCurrency(d.employees.reduce((s,e)=>s+parseFloat(e.base_salary||0),0))}</td>
                              <td style={{ padding:'12px', textAlign:'right', fontWeight:700, color:'#16A34A' }}>{formatCurrency(d.employees.reduce((s,e)=>s+parseFloat(e.housing_allowance||0)+parseFloat(e.transport_allowance||0)+parseFloat(e.communication_allowance||0),0))}</td>
                              <td style={{ padding:'12px', textAlign:'right', fontWeight:700, color:'#0284C7' }}>{formatCurrency(d.employees.reduce((s,e)=>s+parseFloat(e.overtime_pay||0)+parseFloat(e.bonus_pay||0),0))}</td>
                              <td style={{ padding:'12px', textAlign:'right', fontWeight:700, color:'#DC2626' }}>{formatCurrency(d.employees.reduce((s,e)=>s+parseFloat(e.deduction_absent||0)+parseFloat(e.deduction_loan||0)+parseFloat(e.deduction_tax||0)+parseFloat(e.deduction_pension||0),0))}</td>
                              <td style={{ padding:'12px', textAlign:'right', fontWeight:700, fontSize:15, color:'#16A34A' }}>{formatCurrency(d.employees.reduce((s,e)=>s+parseFloat(e.net_pay||0),0))}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {actionModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:actionModal.type==='approve'?'#16A34A':'#DC2626' }}>
              {actionModal.type==='approve'?'✓ Approve Payroll':'✗ Reject Payroll'}
            </h3>
            <p style={{ color:'#6B7280', fontSize:14, margin:'0 0 20px' }}>
              {monthName(actionModal.payroll.month_number)} {actionModal.payroll.year_number} — <strong>{formatCurrency(actionModal.payroll.company_net_pay)}</strong> net pay for <strong>{actionModal.payroll.total_employees}</strong> employees.
            </p>
            {actionModal.type==='reject' && (
              <textarea placeholder="Reason for rejection (required)…" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3}
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:14, fontFamily:'inherit', resize:'vertical', marginBottom:16 }}/>
            )}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>{setActionModal(null);setRejectReason('');}} style={{ padding:'9px 18px', background:'#F3F4F6', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAction} disabled={acting} style={{ padding:'9px 20px', background:actionModal.type==='approve'?'#16A34A':'#DC2626', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:acting?'not-allowed':'pointer', opacity:acting?0.7:1, display:'flex', alignItems:'center', gap:8 }}>
                {acting
                  ? <><SegmentedSpinner size={18} color="#fff" trackColor="rgba(255,255,255,0.3)" speed={1.2} /> Processing…</>
                  : actionModal.type==='approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default CEOPayrollApproval;

