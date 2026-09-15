import React, { useState } from 'react';
import {
  Search, Printer, CheckCircle2, Circle, ArrowRight,
  FileText, ListOrdered, Pencil, FileCheck, Scissors, PackageCheck,
  AlertCircle, Loader2, TreePine, Leaf, Package, Clock, Phone,
  Download, Lock
} from 'lucide-react';
import axios from 'axios';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

const G = {
  forest:   '#228B22', dark: '#1B5E20', emerald: '#2E8B57',
  leaf:     '#4CAF50', sage: '#A5D6A7', olive:   '#6B8E23',
  mint:     '#98FF98', lime: '#8BC34A', brown:   '#8D6E63',
  sky:      '#87CEEB', white: '#FFFFFF', lightGray: '#F5F5F5',
  darkGray: '#424242', orange: '#FF9800', red:   '#F44336',
};

const STEP_ICONS = {
  received:    FileText,
  in_queue:    ListOrdered,
  in_design:   Pencil,
  file_check:  FileCheck,
  in_printing: Printer,
  finishing:   Scissors,
  ready:       PackageCheck,
  delivered:   CheckCircle2,
};

const STEP_COLORS = {
  received:    G.sky,    in_queue:    G.lime,   in_design:   G.olive,
  file_check:  G.orange, in_printing: G.emerald, finishing:  G.forest,
  ready:       G.leaf,   delivered:   G.dark,
};

const api = axios.create({ baseURL: '' });

const PrintingPublicTrack = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true); setError(''); setResult(null); setSearched(true);
    try {
      const { data } = await api.get(`/api/v1/printing/public/track/${orderNumber.trim().toUpperCase()}`, {
        params: { phone: phone.trim() || undefined }
      });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeStep = result?.steps?.find(s => s.active);
  const completedCount = result?.steps?.filter(s => s.completed || s.active).length || 0;
  const totalSteps = result?.steps?.length || 8;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #1B5E20 0%, #2E7D32 30%, #388E3C 55%, #A5D6A7 80%, #E8F5E9 100%)`, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(3deg); }
          66% { transform: translateY(-4px) rotate(-2deg); }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4); } 50% { box-shadow: 0 0 0 12px rgba(76,175,80,0); } }
        @keyframes slideRight { from { width:0; } to { width: 100%; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .track-input:focus { outline: none; border-color: ${G.leaf} !important; box-shadow: 0 0 0 4px ${G.leaf}33 !important; }
        .track-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px ${G.forest}66 !important; }
        .step-node { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .step-node:hover { transform: scale(1.05); }
        .leaf-deco { animation: float 4s ease-in-out infinite; }
      `}</style>

      {/* Decorative floating leaves */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[
          { top: '10%', left: '5%', size: 60, delay: '0s', opacity: 0.12 },
          { top: '20%', right: '8%', size: 45, delay: '1.5s', opacity: 0.1 },
          { top: '60%', left: '3%', size: 35, delay: '3s', opacity: 0.08 },
          { top: '75%', right: '5%', size: 55, delay: '2s', opacity: 0.12 },
          { top: '40%', right: '2%', size: 30, delay: '4s', opacity: 0.07 },
        ].map((l, i) => (
          <div key={i} className="leaf-deco" style={{
            position: 'absolute', ...{ top: l.top, left: l.left, right: l.right },
            animationDelay: l.delay, opacity: l.opacity,
          }}>
            <Leaf size={l.size} color="#fff" />
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header ─────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
            borderRadius: 20, padding: '16px 28px', marginBottom: 32,
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${G.leaf}, ${G.lime})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${G.leaf}66`, animation: 'pulse 2s ease infinite',
            }}>
              <TreePine size={26} color="#fff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>University Print Center</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Surrounded by Nature · Powered by Excellence</div>
            </div>
          </div>

          <h1 style={{
            fontSize: 48, fontWeight: 900, color: '#fff', margin: '0 0 12px',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)', letterSpacing: -1,
            lineHeight: 1.1,
          }}>
            Track Your Print Order
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Enter your order number to see real-time progress from intake to delivery.
          </p>

          {/* Search Box */}
          <form onSubmit={handleTrack} style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 20, padding: 8, display: 'flex', gap: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: G.olive }} />
                <input
                  className="track-input"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  placeholder="Enter order number (e.g. PRT-20260720-001)"
                  style={{
                    width: '100%', padding: '14px 14px 14px 46px',
                    border: `2px solid ${G.sage}`, borderRadius: 14,
                    fontSize: 15, color: G.darkGray, fontWeight: 500,
                    boxSizing: 'border-box', background: 'transparent',
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <div style={{ position: 'relative', width: 220 }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: G.olive }} />
                <input
                  className="track-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Mobile (09XXXXXXXX)"
                  inputMode="tel"
                  style={{
                    width: '100%', padding: '14px 14px 14px 42px',
                    border: `2px solid ${G.sage}`, borderRadius: 14,
                    fontSize: 15, color: G.darkGray, fontWeight: 500,
                    boxSizing: 'border-box', background: 'transparent',
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderNumber.trim()}
                className="track-btn"
                style={{
                  padding: '14px 28px',
                  background: `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
                  color: '#fff', border: 'none', borderRadius: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: `0 6px 20px ${G.forest}66`, transition: 'all 0.25s',
                  opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap',
                }}
              >
                {loading ? <SegmentedSpinner size={18} /> : <Search size={18} />}
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Results Area ──────────────────────── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>

          {/* Error */}
          {error && searched && (
            <div style={{
              background: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: '24px 28px',
              border: `2px solid ${G.red}44`, marginBottom: 20,
              display: 'flex', gap: 16, alignItems: 'flex-start',
              animation: 'fadeUp 0.4s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              <AlertCircle size={24} color={G.red} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: G.red, fontSize: 16, marginBottom: 4 }}>Order Not Found</div>
                <div style={{ color: G.darkGray, fontSize: 14 }}>{error}</div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ animation: 'fadeUp 0.5s ease' }}>
              {/* Order Summary Card */}
              <div style={{
                background: 'rgba(255,255,255,0.97)', borderRadius: 20, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.5)',
                marginBottom: 20,
              }}>
                {/* Card Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${G.dark}, ${G.forest})`,
                  padding: '24px 28px', color: '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.75, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Order Number</div>
                      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{result.order.order_number}</div>
                    </div>
                    <div style={{
                      padding: '8px 16px', borderRadius: 20,
                      background: `${STEP_COLORS[result.order.status_code] || G.leaf}33`,
                      border: `1.5px solid ${STEP_COLORS[result.order.status_code] || G.leaf}`,
                      color: '#fff', fontWeight: 800, fontSize: 14,
                    }}>
                      {result.order.status_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.85 }}>
                      <span>Progress</span>
                      <span>{progressPct}% Complete</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 10,
                        background: `linear-gradient(90deg, ${G.mint}, ${G.lime})`,
                        width: `${progressPct}%`,
                        transition: 'width 1.5s cubic-bezier(0.34,1.56,0.64,1)',
                        boxShadow: `0 0 10px ${G.lime}88`,
                      }} />
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {[
                    ['Customer', result.order.customer_name || '—'],
                    ['Product Type', result.order.product_type],
                    ['Quantity', result.order.quantity?.toLocaleString()],
                    ['Paper Type', result.order.paper_type],
                    ['Color Printing', result.order.color_printing ? 'Yes (Color)' : 'No (B&W)'],
                    ['Due Date', result.order.due_date ? new Date(result.order.due_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '12px 14px', borderRadius: 12, background: `${G.sage}22`, border: `1px solid ${G.sage}55` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: G.olive, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontWeight: 700, color: G.darkGray, fontSize: 14 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Card */}
              <div style={{
                background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}>
                <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 800, color: G.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={20} color={G.emerald} /> Order Journey Timeline
                </h2>

                <div style={{ position: 'relative' }}>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute', left: 22, top: 22, bottom: 22,
                    width: 3, background: `linear-gradient(180deg, ${G.leaf}, ${G.sage})`,
                    borderRadius: 4, zIndex: 0,
                  }} />

                  {result.steps.map((step, idx) => {
                    const Icon = STEP_ICONS[step.code] || Circle;
                    const stepColor = STEP_COLORS[step.code] || G.sage;
                    const isDone = step.completed;
                    const isActive = step.active;
                    const isPending = !isDone && !isActive;

                    return (
                      <div key={step.code} className="step-node" style={{
                        display: 'flex', gap: 20, marginBottom: 16,
                        opacity: isPending ? 0.45 : 1,
                        position: 'relative', zIndex: 1,
                      }}>
                        {/* Node */}
                        <div style={{
                          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                          background: isDone
                            ? `linear-gradient(135deg, ${G.leaf}, ${G.emerald})`
                            : isActive
                              ? `linear-gradient(135deg, ${stepColor}, ${stepColor}bb)`
                              : '#f0f0f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isActive
                            ? `0 4px 16px ${stepColor}55, 0 0 0 4px ${stepColor}22`
                            : isDone ? `0 2px 8px ${G.leaf}44` : 'none',
                          border: `3px solid ${isDone ? G.leaf : isActive ? stepColor : '#ddd'}`,
                          transition: 'all 0.4s',
                        }}>
                          {isDone
                            ? <CheckCircle2 size={20} color="#fff" />
                            : <Icon size={20} color={isActive ? '#fff' : '#ccc'} />
                          }
                        </div>

                        {/* Content */}
                        <div style={{
                          flex: 1, background: isActive ? `${stepColor}12` : isDone ? `${G.leaf}0a` : 'transparent',
                          borderRadius: 12, padding: '10px 16px',
                          border: isActive ? `1.5px solid ${stepColor}44` : isDone ? `1px solid ${G.leaf}33` : '1px solid transparent',
                          transition: 'all 0.3s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: isActive ? 800 : isDone ? 700 : 500, color: isActive ? stepColor : isDone ? G.dark : '#aaa', fontSize: 15 }}>
                              {step.name}
                              {isActive && (
                                <span style={{
                                  marginLeft: 10, fontSize: 11, fontWeight: 700,
                                  background: stepColor, color: '#fff',
                                  padding: '2px 8px', borderRadius: 10,
                                  animation: 'pulse 2s ease infinite',
                                }}>CURRENT</span>
                              )}
                            </div>
                            {(isDone || isActive) && step.timestamp && (
                              <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>
                                {new Date(step.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          {step.notes && (
                            <div style={{ fontSize: 12, color: G.olive, marginTop: 4 }}>{step.notes}</div>
                          )}
                          {isPending && (
                            <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>Awaiting this stage...</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom CTA */}
                <div style={{
                  marginTop: 24, padding: '16px 20px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${G.sage}33, ${G.mint}22)`,
                  border: `1px solid ${G.sage}66`,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <Leaf size={20} color={G.emerald} />
                  <div style={{ fontSize: 13, color: G.dark, fontWeight: 500 }}>
                    Questions about your order? Contact the University Print Center or visit us on campus.
                  </div>
                </div>
              </div>

              {/* Uploaded Work Files */}
              <div style={{
                background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.5)', marginTop: 20,
              }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: G.dark, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Download size={20} color={G.emerald} /> Your Uploaded Work Files
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: G.olive, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={13} /> Shown only when the order number is checked with the mobile number registered for this order.
                </p>

                {result.works?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.works.map(w => (
                      <div key={w.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', borderRadius: 14, background: `${G.sage}1a`,
                        border: `1px solid ${G.sage}55`,
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: `linear-gradient(135deg, ${G.emerald}, ${G.leaf})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={20} color="#fff" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: G.dark, fontSize: 14, wordBreak: 'break-word' }}>{w.originalName}</div>
                          <div style={{ fontSize: 12, color: G.olive, marginTop: 2 }}>
                            {w.size ? `${(w.size / 1024 / 1024).toFixed(2)} MB` : ''}
                            {w.uploadedAt ? ` · uploaded ${new Date(w.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                          </div>
                        </div>
                        <a
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          className="track-btn"
                          style={{
                            padding: '10px 18px', borderRadius: 10, flexShrink: 0,
                            background: `linear-gradient(135deg, ${G.forest}, ${G.emerald})`,
                            color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 13,
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            boxShadow: `0 4px 14px ${G.forest}55`,
                          }}
                        >
                          <Download size={15} /> Open File
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '18px', borderRadius: 12, background: '#f9fafb',
                    border: `1.5px dashed ${G.sage}`, color: G.olive, fontSize: 13,
                    textAlign: 'center',
                  }}>
                    No work files to show yet{phone.trim() ? ' — either none are uploaded or the mobile number does not match this order.' : ' — add the mobile number you used for this order to see them.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state before search */}
          {!searched && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, opacity: 0.5 }}>
                {[G.leaf, G.lime, G.emerald].map((c, i) => (
                  <div key={i} className="leaf-deco" style={{ animationDelay: `${i * 0.8}s` }}>
                    <TreePine size={40} color={c} />
                  </div>
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 16 }}>
                Your order number was provided when your order was submitted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintingPublicTrack;
