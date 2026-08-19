import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import apiClient from "../../services/apiClient";

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null); // The currently viewed payslip ID
  const [error, setError]       = useState(null);
  
  const printRef = useRef();

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const res = await apiClient.get('/hr/etp/my-payslips');
        const data = res?.data?.data?.payslips || res?.data?.data || res?.data || [];
        setPayslips(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelected(data[0]); // Auto-select latest
      } catch (err) {
        setError('Could not load payslips. Please contact HR.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>
      <p style={{ fontSize: '16px', fontWeight: '500' }}>Loading your payslips...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#dc2626' }}>
      <p>{error}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar: Payslip History */}
      <div className="no-print" style={{ width: '320px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Payslip History</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Select a month to view details</p>
        </div>
        
        {payslips.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No payslips available yet.
          </div>
        ) : (
          <div style={{ padding: '12px' }}>
            {payslips.map((p, idx) => {
              const isSelected = selected && selected.component_id === p.component_id;
              return (
                <div 
                  key={p.component_id || idx}
                  onClick={() => setSelected(p)}
                  style={{
                    padding: '16px', 
                    marginBottom: '8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                      {MONTH_NAMES[p.month_number - 1]} {p.year_number}
                    </div>
                    {isSelected && <ChevronRight size={18} color="#3b82f6" />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#059669', fontWeight: '800', fontSize: '15px' }}>
                      {fmt(p.net_pay)} ETB
                    </div>
                    <div style={{ 
                      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                      padding: '4px 8px', borderRadius: '20px',
                      backgroundColor: p.status === 'Paid' ? '#d1fae5' : '#fef3c7',
                      color: p.status === 'Paid' ? '#065f46' : '#92400e'
                    }}>
                      {p.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: Formal Payslip Document */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {selected ? (
          <div style={{ maxWidth: '850px', width: '100%' }}>
            
            {/* Actions Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
              <button 
                onClick={handlePrint}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', 
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.2)'
                }}
              >
                <Printer size={18} /> Print Payslip
              </button>
            </div>

            {/* Printable Payslip Container */}
            <div 
              className="payslip-document" 
              ref={printRef}
              style={{ 
                backgroundColor: '#fff', 
                padding: '48px', 
                borderRadius: '12px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                color: '#1e293b'
              }}
            >
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '24px', marginBottom: '32px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                    SUTANA
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                    Addis Ababa, Ethiopia
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Payslip
                  </h2>
                  <p style={{ margin: '8px 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {MONTH_NAMES[selected.month_number - 1]} {selected.year_number}
                  </p>
                </div>
              </div>

              {/* Employee Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Employee Name</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{selected.full_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Employee ID</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{selected.employee_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Department</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{selected.department_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Designation</div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{selected.position_title || 'N/A'}</div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                
                {/* Earnings Column */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' }}>
                    Earnings
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 0', color: '#475569' }}>Basic Salary</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.base_salary)}</td>
                      </tr>
                      {Number(selected.housing_allowance) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Housing Allowance</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.housing_allowance)}</td>
                        </tr>
                      )}
                      {Number(selected.transport_allowance) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Transport Allowance</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.transport_allowance)}</td>
                        </tr>
                      )}
                      {Number(selected.communication_allowance) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Communication Allowance</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.communication_allowance)}</td>
                        </tr>
                      )}
                      {Number(selected.overtime_pay) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Overtime Pay</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.overtime_pay)}</td>
                        </tr>
                      )}
                      {Number(selected.bonus_pay) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Bonus Pay</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.bonus_pay)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '16px 0 0', fontWeight: '800', color: '#0f172a' }}>Total Earnings (ETB)</td>
                        <td style={{ padding: '16px 0 0', textAlign: 'right', fontWeight: '800', color: '#059669', fontSize: '15px' }}>
                          {fmt(selected.gross_pay)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions Column */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' }}>
                    Deductions
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 0', color: '#475569' }}>Income Tax</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.deduction_tax)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 0', color: '#475569' }}>Pension (7%)</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.deduction_pension)}</td>
                      </tr>
                      {Number(selected.deduction_absent) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Absence Deduction</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.deduction_absent)}</td>
                        </tr>
                      )}
                      {Number(selected.deduction_loan) > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>Loan Repayment</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{fmt(selected.deduction_loan)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '16px 0 0', fontWeight: '800', color: '#0f172a' }}>Total Deductions (ETB)</td>
                        <td style={{ padding: '16px 0 0', textAlign: 'right', fontWeight: '800', color: '#dc2626', fontSize: '15px' }}>
                          {fmt(
                            Number(selected.deduction_tax) + 
                            Number(selected.deduction_pension) + 
                            Number(selected.deduction_absent) + 
                            Number(selected.deduction_loan)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>

              {/* Net Pay Box */}
              <div style={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', opacity: 0.9 }}>
                  Net Pay (Transferable Amount)
                </div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>
                  {fmt(selected.net_pay)} <span style={{ fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>ETB</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                <p style={{ margin: 0 }}>This is a system generated document and does not require a signature.</p>
                <p style={{ margin: '4px 0 0' }}>Generated on {new Date().toLocaleDateString()} via SUTANA HR & Payroll System.</p>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '15px' }}>Select a payslip from the left to view details</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .payslip-document, .payslip-document * {
            visibility: visible;
          }
          .payslip-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeePayslips;
