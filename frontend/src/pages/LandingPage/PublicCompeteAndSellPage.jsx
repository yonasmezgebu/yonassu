import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SignatureCanvas from '../../components/SignatureCanvas';
import { PublicNav } from './PublicNavFooter';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';
import confetti from 'canvas-confetti';
import tenderHero from '../../assets/hero-section/tender2.jpg';
import clumpSound from '../../assets/notification/clump.mp3';
import {
  FileText, Calendar, Box, Activity, Briefcase, Clock, FileCheck, CheckCircle,
  Send, AlertCircle, Mail, Award, Check, Flame, ArrowLeft, Lock, User,
  ChevronRight, Package, Tag,
} from 'lucide-react';
import './PublicLayout.css';
import './PublicCompeteAndSellPage.css';

// =========================================================================
// CELEBRATION MODAL
// =========================================================================
const CelebrationModal = ({ onClose, name }) => {
  useEffect(() => {
    const end = Date.now() + 3000;
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pcas-overlay">
      <div className="pcas-celebrate-card">
        <div className="pcas-emoji-lg">🎉</div>
        <h2 className="pcas-celebrate-title">Bid Submitted!</h2>
        <p className="pcas-celebrate-desc">
          Congratulations{name ? `, ${name}` : ''}! Your bid has been successfully submitted to SUTANA.
          Our Purchase team will review it within 3–5 business days.
        </p>
        <button className="pcas-btn-primary" onClick={onClose} style={{ maxWidth: '12rem', margin: '0 auto' }}>
          Back to Tenders
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN PAGE COMPONENT
// =========================================================================
const PublicCompeteAndSellPage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [biddingStep, setBiddingStep] = useState(0); // 0: list, 2: bid form, 3: celebration
  const [roleWarning, setRoleWarning] = useState(false);

  // Bid form state
  const [bidItems, setBidItems] = useState({});
  const [competitorName, setCompetitorName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [bidError, setBidError] = useState(null);
  const [handSignature, setHandSignature] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myExistingBid, setMyExistingBid] = useState(null); // existing bid for update mode
  const [paymentMethod, setPaymentMethod] = useState(''); // Telebirr / Bank
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [vatCtx, setVatCtx] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  useEffect(() => { fetchTenders(); }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/finance-bank');
        setFinanceAccounts(res.data || []);
      } catch (e) {
        console.error('Failed to fetch finance accounts', e);
      }
    };
    fetchAccounts();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await api.get('/public-tenders/public');
      const fetchedTenders = response.data || [];
      setTenders(fetchedTenders);

      // Auto-open tender if redirected back from login
      if (isAuthenticated && location.state?.tenderId) {
        const target = fetchedTenders.find(t => t.id === location.state.tenderId);
        if (target) {
          setSelectedTender(target);
          setBiddingStep(1); // show detail view first
          // Clear state so it doesn't reopen on refresh
          window.history.replaceState({}, document.title);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const scrollToWorkArea = () => {
    const el = document.getElementById('working-area');
    if (el) {
      // scroll slightly below the hero so the header doesn't cover it
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTender = (tender) => {
    // Step 1: always show detail view first (no auth required)
    setSelectedTender(tender);
    setBidError(null);
    setBiddingStep(1);
    scrollToWorkArea();
  };

  const handleStartBidding = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, tenderId: selectedTender.id } });
      return;
    }
    // Bidding is available only to Customer accounts — staff and other roles
    // must sign out and sign in with a customer account to participate.
    const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
    if (!userRoles.includes('customer')) {
      setRoleWarning(true);
      return;
    }
    // Reset form defaults from user profile
    setBidItems({});
    setHandSignature('');
    setDeliveryTime('');
    setPaymentTerms('');
    setPaymentMethod('');
    setCompetitorName(user?.name || user?.full_name || '');
    setBidderEmail(user?.email || '');
    setBidderPhone(user?.phone || '');
    setBidError(null);
    setMyExistingBid(null);

    // Check if user already has a bid for this tender
    try {
      const res = await api.get(`/public-tenders/public/${selectedTender.id}/my-bid`);
      if (res?.status === 'success' && res?.data) {
        const existing = res.data;
        setMyExistingBid(existing);
        // Pre-fill form from existing bid
        setCompetitorName(existing.competitor_name || user?.name || user?.full_name || '');
        setBidderEmail(existing.email || user?.email || '');
        setBidderPhone(existing.phone || user?.phone || '');
        setDeliveryTime(existing.delivery_time || '');
        setPaymentTerms(existing.payment_terms || '');
        setPaymentMethod(existing.payment_method || '');
        setHandSignature(existing.hand_signature_path || '');
        // Pre-fill item bids if available
        if (existing.items?.length) {
          const prefilled = {};
          existing.items.forEach(bi => {
            prefilled[bi.public_tender_item_id ?? bi.tender_item_id] = {
              priceBirr: String(bi.price_birr ?? ''),
              priceCent: String(bi.price_cent ?? ''),
              checkup: bi.checkup || '',
            };
          });
          setBidItems(prefilled);
        }
      }
    } catch (_) {
      // No existing bid or endpoint not available — proceed with fresh form
    }

    setBiddingStep(2);
    scrollToWorkArea();
  };

  const handleBidItemChange = (itemId, field, value) => {
    setBidItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const calculateTotal = (itemId) => {
    const item = bidItems[itemId] || {};
    const birr = parseInt(item.priceBirr || 0);
    const cent = parseInt(item.priceCent || 0);
    const qty = selectedTender?.items?.find(i => i.id === itemId)?.quantity || 1;
    const totalCents = ((birr * 100) + cent) * qty;
    return { totalB: Math.floor(totalCents / 100), totalC: totalCents % 100 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Defensive guard — bids may only be submitted by Customer accounts.
    const submitRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
    if (!submitRoles.includes('customer')) {
      setBidError('⚠️ Only customer accounts can submit bids. Please sign out and log in as a customer.');
      setRoleWarning(true);
      return;
    }
    setSubmitting(true);
    setBidError(null);

    const itemsPayload = Object.keys(bidItems).map(itemId => {
      const { totalB, totalC } = calculateTotal(parseInt(itemId));
      return {
        tenderItemId: parseInt(itemId),
        priceBirr: bidItems[itemId].priceBirr,
        priceCent: bidItems[itemId].priceCent,
        totalBirr: totalB,
        totalCent: totalC,
        checkup: bidItems[itemId].checkup || ''
      };
    }).filter(i => i.priceBirr !== undefined);

    const payload = {
      competitorName,
      email: bidderEmail,
      phone: bidderPhone,
      deliveryTime,
      paymentTerms,
      paymentMethod,
      handSignaturePath: handSignature,
      items: itemsPayload
    };

    try {
      let res;
      if (myExistingBid) {
        // UPDATE existing bid via PUT
        res = await api.put(`/public-tenders/public/${selectedTender.id}/bid`, payload);
      } else {
        // SUBMIT new bid via POST
        res = await api.post(`/public-tenders/public/${selectedTender.id}/bid`, payload);
      }

      // If backend still returns duplicate (fallback safety), silently switch to update
      if (res && res.status === 'duplicate') {
        setMyExistingBid({ id: true }); // mark as existing
        setBidError('⚠️ Your bid already exists. Your form is now in Update mode — adjust your prices and submit again.');
        setSubmitting(false);
        return;
      }

      // Play clump.mp3
      try {
        const audio = new Audio(clumpSound);
        audio.volume = 0.8;
        audio.play();
      } catch (e) { console.warn('Audio blocked:', e); }

      setBiddingStep(3); // show celebration
      scrollToWorkArea();

    } catch (err) {
      // If HTTP 409 Conflict — switch to update mode automatically
      if (err?.statusCode === 409 || err?.status === 409 || String(err?.message).toLowerCase().includes('already')) {
        setMyExistingBid({ id: true });
        setBidError('✅ Your form has been switched to Update mode. Adjust your prices and click Update Bid.');
      } else {
        setBidError(err?.message || '⚠️ Error submitting bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCelebrationClose = () => {
    setBiddingStep(0);
    setSelectedTender(null);
    setMyExistingBid(null);
    setBidderEmail('');
    setBidderPhone('');
    setDeliveryTime('');
    setPaymentTerms('');
    fetchTenders(); // Refresh tenders to update bid counts
  };

  return (
    <div className="pcas-root">
      <PublicNav />

      {/* ===== Celebration Overlay ===== */}
      {biddingStep === 3 && (
        <CelebrationModal onClose={handleCelebrationClose} name={competitorName} />
      )}

      {/* ===== Customer-Only Warning Overlay ===== */}
      {roleWarning && (
        <div className="pcas-overlay" onClick={() => setRoleWarning(false)}>
          <div className="pcas-celebrate-card" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="pcas-emoji-lg" style={{ position: 'static', animation: 'none' }}>🔒</div>
            <h2 className="pcas-celebrate-title">Customer Account Required</h2>
            <p className="pcas-celebrate-desc">
              You're currently signed in as <strong>{user?.fullName || user?.full_name || user?.name || 'a staff account'}</strong>.
              Bidding on SUTANA tenders is available only to <strong>Customer</strong> accounts.<br />
              Please <strong>sign out</strong> and log in as a customer to start bidding.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '17rem', margin: '0 auto' }}>
              <button className="pcas-btn-primary" onClick={() => { setRoleWarning(false); logout(); }}>
                <User size={16} /> Sign Out &amp; Switch to Customer
              </button>
              <button
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setRoleWarning(false)}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Hero ===== */}
      <div className="pcas-hero-wrap">
        <img className="pcas-hero-img" src={tenderHero} alt="Compete & Sell hero" />
        <div className="pcas-hero-overlay">
          <h1 className="pcas-hero-title">Compete &amp; Sell</h1>
          <p className="pcas-hero-subtitle">
            Submit your competitive bids and supply products directly to SUTANA
          </p>
        </div>
      </div>

      <div id="working-area" className="pcas-main-layout">
        {loading ? (
          <div className="pcas-section-container" style={{ textAlign: 'center', color: 'hsl(215.4 16.3% 46.9%)' }}>
            ⏳ Loading Tenders...
          </div>
        ) : (
          <div>

            {/* ===== Tender Cards List ===== */}
            {biddingStep === 0 && (
              <>
                <section className="pcas-section-container">
                  <div className="pcas-section-header">
                    <div>
                      <h2 className="pcas-section-title">Open Tenders</h2>
                      <p className="pcas-section-subtitle">
                        {tenders.length} tender{tenders.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <div className="pcas-live-badge">
                      <Flame size={14} /> Live bidding open
                    </div>
                  </div>

                  <div className="pcas-grid-container">
                    {tenders.map(tender => (
                      <div key={tender.id} className="pcas-tender-card">
                        <div className="pcas-tender-card-inner">
                          {/* Top row */}
                          <div className="pcas-card-top-row">
                            <span className="pcas-open-badge">
                              <CheckCircle size={11} /> Open
                            </span>
                            {tender.tender_number && (
                              <span className="pcas-tender-number">{tender.tender_number}</span>
                            )}
                          </div>

                          {/* Category */}
                          {tender.category && (
                            <div>
                              <span className="pcas-category-badge">
                                <FileText size={10} /> {tender.category}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="pcas-card-title">{tender.title}</h3>

                          {/* Description */}
                          <p className="pcas-card-desc">{tender.description}</p>

                          {/* Dates */}
                          <div className="pcas-dates-grid">
                            {tender.opening_date && (
                              <div className="pcas-date-box">
                                <span className="pcas-date-label">
                                  <Calendar size={11} /> Opens
                                </span>
                                <span className="pcas-date-value">
                                  {new Date(tender.opening_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {tender.closing_date && (
                              <div className="pcas-date-box pcas-closes">
                                <span className="pcas-date-label pcas-closes-label">
                                  <Clock size={11} /> Closes
                                </span>
                                <strong className="pcas-date-value pcas-closes-value">
                                  {new Date(tender.closing_date).toLocaleDateString()}
                                </strong>
                              </div>
                            )}
                          </div>

                          {/* Footer row */}
                          <div className="pcas-card-footer">
                            <span className="pcas-footer-stat"><Box size={13} /> {tender.items?.length || 0} items</span>
                            <span className="pcas-footer-stat"><Send size={13} /> {tender.bids_count || 0} bids</span>
                          </div>

                          <button
                            className="pcas-btn-primary"
                            onClick={() => handleSelectTender(tender)}
                          >
                            <FileText size={18} /> View Tender Details <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {tenders.length === 0 && (
                      <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'hsl(215.4 16.3% 46.9%)', fontSize: '1.125rem', padding: '2.5rem 0' }}>
                        No active tenders currently available.
                      </p>
                    )}
                  </div>
                </section>

                <hr className="pcas-divider" />

                {/* ===== How It Works ===== */}
                <section className="pcas-info-section">
                  <h2 className="pcas-section-heading">How It Works</h2>
                  <p className="pcas-section-subheading">Four simple steps from tender discovery to award</p>
                  <div className="pcas-steps-grid">
                    {[
                      { step: '01', icon: <FileText size={28} />, title: 'Browse Tenders', desc: 'Review all open tenders above. Each listing includes item details, quantities, and the closing deadline.' },
                      { step: '02', icon: <FileCheck size={28} />, title: 'Register & Bid', desc: 'Click "Start Bidding", provide your email and phone, then fill in your unit prices for each requested item.' },
                      { step: '03', icon: <Activity size={28} />, title: 'Evaluation', desc: 'Our Purchase team analyses all submitted bids, comparing price, delivery time and payment terms.' },
                      { step: '04', icon: <Award size={28} />, title: 'Award & Contract', desc: 'The best-value supplier is recommended and approved by our CEO. You will be notified within 3–5 business days.' },
                    ].map(s => (
                      <div key={s.step} className="pcas-step-card">
                        <div className="pcas-step-number">{s.step}</div>
                        <div className="pcas-step-icon-wrap">{s.icon}</div>
                        <h3 className="pcas-step-title">Step {s.step}: {s.title}</h3>
                        <p className="pcas-step-desc">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <hr className="pcas-divider" />

                {/* ===== Why Bid ===== */}
                <section className="pcas-info-section-alt">
                  <h2 className="pcas-section-heading">Why Bid with SUTANA?</h2>
                  <p className="pcas-section-subheading">Trusted by suppliers across Ethiopia</p>
                  <div className="pcas-steps-grid">
                    {[
                      { icon: <Activity size={26} />, title: 'Fast Process', desc: 'Digital submission — no paperwork, no queues. Submit your bid in minutes from anywhere.' },
                      { icon: <FileCheck size={26} />, title: 'Fair & Transparent', desc: 'Every bid is evaluated on merit. Lowest price, delivery, and payment terms are all scored objectively.' },
                      { icon: <Briefcase size={26} />, title: 'Timely Payment', desc: 'SUTANA is committed to paying awarded suppliers on time, as per the agreed payment schedule.' },
                      { icon: <CheckCircle size={26} />, title: 'Long-Term Partnerships', desc: 'Top-performing suppliers are prioritized for future tenders and ongoing procurement contracts.' },
                      { icon: <Send size={26} />, title: 'Open to All', desc: 'Any registered business or individual can participate. No entry fee, no hidden requirements.' },
                      { icon: <Mail size={26} />, title: 'Instant Confirmation', desc: 'Receive immediate bid confirmation and status updates directly to your registered email and phone.' },
                    ].map(b => (
                      <div key={b.title} className="pcas-feature-item">
                        <div className="pcas-feature-icon-wrap">{b.icon}</div>
                        <h3 className="pcas-feature-title">{b.title}</h3>
                        <p className="pcas-feature-desc">{b.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <hr className="pcas-divider" />

                {/* ===== Requirements & FAQ ===== */}
                <div className="pcas-split-grid" style={{ padding: '4rem 1.5rem' }}>
                  <div className="pcas-info-box">
                    <h3 className="pcas-info-box-title">
                      <FileCheck size={20} /> What You Need to Bid
                    </h3>
                    <ul className="pcas-req-list">
                      {[
                        'Valid email address and phone number',
                        'Your company or business name',
                        'Unit price per item (in Ethiopian Birr and Cent)',
                        'Estimated delivery time',
                        'Your preferred payment terms',
                        'Hand-drawn signature',
                      ].map(r => (
                        <li key={r} className="pcas-req-item">
                          <span className="pcas-req-icon"><Check size={16} /></span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pcas-info-box">
                    <h3 className="pcas-info-box-title">
                      <AlertCircle size={20} /> Frequently Asked Questions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[
                        { q: 'Can I bid on multiple tenders?', a: 'Yes. You can submit separate bids for as many open tenders as you qualify for.' },
                        { q: 'What happens after I submit?', a: 'Our Purchase team will review, compare, and rank all bids. You will be contacted if your bid is selected.' },
                        { q: 'Is there a cost to bid?', a: 'No. Bidding on SUTANA tenders is completely free of charge.' },
                        { q: 'Can I update my bid?', a: 'Once submitted, bids are final. Please review all pricing carefully before submitting.' },
                      ].map(faq => (
                        <details key={faq.q} className="pcas-faq-details">
                          <summary className="pcas-faq-summary">
                            {faq.q}
                            <span className="pcas-faq-icon">+</span>
                          </summary>
                          <p className="pcas-faq-text">{faq.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== Tender Detail Step (step 1) ===== */}
            {biddingStep === 1 && selectedTender && (
              <div style={{ padding: '2rem 1.5rem', maxWidth: '860px', margin: '0 auto' }}>
                <button className="pcas-btn-ghost" onClick={() => setBiddingStep(0)}>
                  <ArrowLeft size={15} /> Back to Tenders
                </button>

                <div className="pcas-form-container" style={{ marginTop: '1.25rem' }}>
                  {/* Header */}
                  <div className="pcas-form-header">
                    {selectedTender.tender_number && (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                        {selectedTender.tender_number}
                      </span>
                    )}
                    {selectedTender.category && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: '0.375rem', padding: '0.25rem 0.625rem', display: 'inline-block', marginBottom: '0.75rem', marginLeft: '0.5rem' }}>
                        {selectedTender.category}
                      </span>
                    )}
                    <h2 className="pcas-form-title">{selectedTender.title}</h2>
                    <p className="pcas-form-desc">{selectedTender.description}</p>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {selectedTender.opening_date && (
                      <div style={{ background: 'hsl(var(--muted))', borderRadius: '0.75rem', padding: '1rem', border: '1px solid hsl(var(--border))' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={12} /> Opens
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{new Date(selectedTender.opening_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {selectedTender.closing_date && (
                      <div style={{ background: 'hsl(0 86% 97%)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid hsl(0 86% 90%)' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(0 72% 38%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={12} /> Closes
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'hsl(0 72% 38%)' }}>{new Date(selectedTender.closing_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    <div style={{ background: 'hsl(var(--muted))', borderRadius: '0.75rem', padding: '1rem', border: '1px solid hsl(var(--border))' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Package size={12} /> Items
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{selectedTender.items?.length || 0} item{(selectedTender.items?.length || 0) !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ background: 'hsl(var(--muted))', borderRadius: '0.75rem', padding: '1rem', border: '1px solid hsl(var(--border))' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Send size={12} /> Bids
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{selectedTender.bids_count || 0} submitted</div>
                    </div>
                  </div>

                  {/* Items preview */}
                  {selectedTender.items?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--foreground))' }}>
                        <Box size={16} /> Items in This Tender
                      </h3>
                      <div style={{ overflowX: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                          <thead>
                            <tr style={{ background: 'hsl(var(--muted))' }}>
                              {['#', 'Object Type', 'Unit', 'Qty'].map((h, i) => (
                                <th key={i} style={{ padding: '0.625rem 0.875rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', textAlign: i > 2 ? 'right' : 'left', borderBottom: '1px solid hsl(var(--border))' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTender.items.map((item, idx) => (
                              <tr key={item.id} style={{ borderBottom: '1px solid hsl(var(--border))', background: idx % 2 === 0 ? 'white' : 'hsl(var(--muted))' }}>
                                <td style={{ padding: '0.625rem 0.875rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{idx + 1}</td>
                                <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600 }}>{item.object_type}</td>
                                <td style={{ padding: '0.625rem 0.875rem', color: 'hsl(var(--muted-foreground))' }}>{item.unit}</td>
                                <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', fontWeight: 700, color: 'hsl(var(--primary))' }}>{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Terms & Conditions announced by SUTANA */}
                  {selectedTender.terms_conditions && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--foreground))' }}>
                        <FileCheck size={16} /> Terms &amp; Conditions
                      </h3>
                      <div className="pcas-terms-readonly" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedTender.terms_conditions}
                      </div>
                    </div>
                  )}

                  {/* CTA Section */}
                  <div style={{ background: 'linear-gradient(135deg, hsl(142 76% 25%), hsl(142 76% 18%))', borderRadius: '0.75rem', padding: '1.75rem', textAlign: 'center' }}>
                    <Award size={32} color="rgba(255,255,255,0.85)" style={{ marginBottom: '0.75rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem' }}>Ready to Submit Your Bid?</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                      {isAuthenticated
                        ? `You are signed in as ${user?.name || user?.full_name || user?.email}. Click below to fill in your prices.`
                        : 'Sign in to your account or create a free account to participate in this tender.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
                      <button
                        className="pcas-btn-primary"
                        onClick={handleStartBidding}
                        style={{ background: 'white', color: 'hsl(var(--primary))', fontWeight: 800 }}
                      >
                        {isAuthenticated
                          ? <><Award size={18} /> Start Bidding Now<ChevronRight size={16} /></>
                          : <><Lock size={16} /> Sign In to Bid<ChevronRight size={16} /></>}
                      </button>
                      {!isAuthenticated && (
                        <Link
                          to="/auth/register"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <User size={16} /> Create Free Account
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Bid Form Step ===== */}
            {biddingStep === 2 && selectedTender && (
              <div style={{ padding: '2rem 1.5rem' }}>
                <div className="pcas-form-container">
                  <button className="pcas-btn-ghost" onClick={() => setBiddingStep(1)}>
                    <ArrowLeft size={15} /> Back to Details
                  </button>

                  <div className="pcas-form-header">
                    <h2 className="pcas-form-title">{selectedTender.title}</h2>
                    <p className="pcas-form-desc">{selectedTender.description}</p>
                    <div className="pcas-bidder-badge">
                      👤 Bidder: <strong>{bidderEmail}</strong> · 📱 {bidderPhone}
                    </div>
                  </div>

                  {/* Update mode banner */}
                  {myExistingBid && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
                      background: 'hsl(35 100% 95%)', border: '1px solid hsl(35 100% 75%)',
                      borderRadius: '0.75rem', fontSize: '0.875rem', color: 'hsl(35 90% 30%)',
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>✏️</span>
                      <div>
                        <strong>Update Mode — You have already submitted a bid.</strong><br />
                        <span style={{ opacity: 0.85 }}>Your previous prices are pre-filled below. Edit any values and click <strong>Update Bid</strong> to save changes.</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Smart Table */}
                    <div className="pcas-table-wrap">
                      <table className="pcas-table">
                        <thead>
                          <tr>
                            <th className="pcas-th-dark">No</th>
                            <th className="pcas-th-dark">Object Type</th>
                            <th className="pcas-th-dark">Unit</th>
                            <th className="pcas-th-dark">Qty</th>
                            <th colSpan="2" className="pcas-th-accent">Price / Object</th>
                            <th colSpan="2" className="pcas-th-accent" style={{ color: 'hsl(160 84% 39%)' }}>Total Value</th>
                            <th className="pcas-th-dark">Checkup</th>
                          </tr>
                          <tr style={{ background: 'hsl(210 40% 96.1%)', fontSize: '0.75rem', color: 'hsl(215.4 16.3% 46.9%)', fontWeight: 700 }}>
                            <th colSpan="4" style={{ padding: '0.5rem 0.75rem' }}></th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Birr</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Cent</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid hsl(160 84% 39%)' }}>Birr</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid hsl(160 84% 39%)' }}>Cent</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTender.items?.map((item, index) => {
                            const { totalB, totalC } = calculateTotal(item.id);
                            return (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 700, color: 'hsl(215.4 16.3% 46.9%)' }}>{index + 1}</td>
                                <td style={{ fontWeight: 600 }}>{item.object_type}</td>
                                <td style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>{item.unit}</td>
                                <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    onChange={e => handleBidItemChange(item.id, 'priceBirr', e.target.value)}
                                    className="pcas-input-field"
                                    style={{ minWidth: '80px', textAlign: 'right' }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    placeholder="00"
                                    onChange={e => handleBidItemChange(item.id, 'priceCent', e.target.value)}
                                    className="pcas-input-field"
                                    style={{ minWidth: '60px', textAlign: 'right' }}
                                  />
                                </td>
                                <td className="pcas-td-readonly">{totalB}</td>
                                <td className="pcas-td-readonly">{totalC.toString().padStart(2, '0')}</td>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="Remarks..."
                                    onChange={e => handleBidItemChange(item.id, 'checkup', e.target.value)}
                                    className="pcas-input-field"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* VAT Summary */}
                    <div className="pcas-summary-box">
                      {selectedTender.items?.map((item) => {
                        const itemBid = bidItems[item.id] || {};
                        const birr = parseInt(itemBid.priceBirr || 0, 10);
                        const cent = parseInt(itemBid.priceCent || 0, 10);
                        const unitPrice = (birr + cent / 100);
                        const lineValue = unitPrice * parseFloat(item.quantity || 1);
                        const v = getVatForItem(vatCtx, 'tender_buy', item.id != null ? item.id : null, lineValue);
                        return (
                          <div key={item.id} className="pcas-summary-row">
                            <span>{item.object_type} — VAT ({fmtPct(v.rate)})</span>
                            <span className="pcas-summary-val">{v.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                          </div>
                        );
                      })}
                      <div className="pcas-summary-total">
                        <span>Grand Total (incl. VAT)</span>
                        <span>{selectedTender.items?.reduce((sum, item) => {
                          const itemBid = bidItems[item.id] || {};
                          const birr = parseInt(itemBid.priceBirr || 0, 10);
                          const cent = parseInt(itemBid.priceCent || 0, 10);
                          const unitPrice = (birr + cent / 100);
                          const lineValue = unitPrice * parseFloat(item.quantity || 1);
                          return sum + getVatForItem(vatCtx, 'tender_buy', item.id != null ? item.id : null, lineValue).total;
                        }, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="pcas-form-section">
                      <h3 className="pcas-section-title-sm">Terms &amp; Conditions</h3>
                      <div className="pcas-grid-2">
                        <div>
                          <label className="pcas-label">
                            Estimated Delivery Time <span className="pcas-required">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={deliveryTime}
                            onChange={e => setDeliveryTime(e.target.value)}
                            className="pcas-input-field"
                            placeholder="e.g., 30 days after order"
                          />
                        </div>
                        <div>
                          <label className="pcas-label">
                            Payment Terms <span className="pcas-required">*</span>
                          </label>
                          <select
                            required
                            value={paymentTerms}
                            onChange={e => setPaymentTerms(e.target.value)}
                            className="pcas-input-field"
                          >
                            <option value="">-- Select Payment Terms --</option>
                            <option value="100% upfront">100% upfront</option>
                            <option value="50% upfront, 50% on delivery">50% upfront, 50% on delivery</option>
                            <option value="100% on delivery">100% on delivery</option>
                            <option value="Net 30 days">Net 30 days</option>
                            <option value="Net 60 days">Net 60 days</option>
                            <option value="Letter of Credit">Letter of Credit</option>
                          </select>
                        </div>
                      </div>

                      {/* Conditions set by SUTANA when the tender was posted */}
                      <div style={{ marginTop: '0.25rem' }}>
                        <label className="pcas-label">
                          Announced Conditions (set by SUTANA at tender post)
                        </label>
                        <div className="pcas-terms-readonly">
                          {selectedTender.terms_conditions
                            ? selectedTender.terms_conditions
                            : 'No additional conditions have been set for this tender.'}
                        </div>
                      </div>

                      {/* Acceptance — marked on the public side only */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.75rem' }}>
                        <input
                          type="checkbox"
                          id="pcas-agree-terms"
                          checked={agreedToTerms}
                          onChange={e => setAgreedToTerms(e.target.checked)}
                          style={{ width: '1rem', height: '1rem', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                        />
                        <label htmlFor="pcas-agree-terms" style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', cursor: 'pointer', fontWeight: 500 }}>
                          I have read and accept the tender terms above, including the stated delivery and payment terms.
                        </label>
                      </div>
                    </div>

                    {/* Competitor Details & Hand Signature */}
                    <div className="pcas-form-section">
                      <h3 className="pcas-section-title-sm">Competitor Details</h3>
                      <div className="pcas-grid-2">
                        <div>
                          <label className="pcas-label">
                            Competitor Name (Fill Part) <span className="pcas-required">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={competitorName}
                            onChange={e => setCompetitorName(e.target.value)}
                            className="pcas-input-field"
                            placeholder="Enter company / person name"
                          />
                        </div>
                        <div>
                          <label className="pcas-label">Date (Auto from Server)</label>
                          <input
                            type="text"
                            disabled
                            value={new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                            className="pcas-input-field"
                            style={{ cursor: 'not-allowed', opacity: 0.7 }}
                          />
                        </div>
                      </div>
                      {/* ── Payment Summary + Method (above signature) ── */}
                      {(() => {
                        const grandTotal = selectedTender.items?.reduce((sum, item) => {
                          const itemBid = bidItems[item.id] || {};
                          const birr = parseInt(itemBid.priceBirr || 0, 10);
                          const cent = parseInt(itemBid.priceCent || 0, 10);
                          const unitPrice = (birr + cent / 100);
                          const lineValue = unitPrice * parseFloat(item.quantity || 1);
                          return sum + getVatForItem(vatCtx, 'tender_buy', item.id != null ? item.id : null, lineValue).total;
                        }, 0) || 0;

                        const telebirrAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Mobile Wallet');
                        const bankAccounts = financeAccounts.filter(a => a.status === 'Active' && a.account_type === 'Bank');
                        const selectedAccObj = financeAccounts.find(a => paymentMethod && paymentMethod === `${a.account_type === 'Mobile Wallet' ? 'Telebirr' : 'Bank Transfer'}::${a.id}`);

                        return (
                          <div style={{ margin: '1.25rem 0', padding: '1.25rem', background: 'hsl(152 76% 97%)', border: '2px solid hsl(152 69% 75%)', borderRadius: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'hsl(152 76% 25%)' }}>💵 Total Bid Payment (incl. VAT)</span>
                              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'hsl(152 76% 20%)', fontFamily: 'monospace' }}>
                                ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <label className="pcas-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                Payment Method &amp; Account <span className="pcas-required">*</span>
                              </label>
                              <select
                                required
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                className="pcas-input-field"
                                style={{ maxWidth: '460px', fontWeight: 600 }}
                              >
                                <option value="">-- Select Account to Pay Into --</option>
                                {telebirrAccounts.length > 0 && (
                                  <optgroup label="📱 Telebirr Accounts">
                                    {telebirrAccounts.map(acc => (
                                      <option key={acc.id} value={`Telebirr::${acc.id}`}>
                                        📱 Telebirr {`{${acc.account_number}}`} — {acc.account_name}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {bankAccounts.length > 0 && (
                                  <optgroup label="🏦 Bank Transfer Accounts">
                                    {bankAccounts.map(acc => (
                                      <option key={acc.id} value={`Bank Transfer::${acc.id}`}>
                                        🏦 Bank {`{${acc.account_number}}`} — {acc.account_name}{acc.bank_provider ? ` (${acc.bank_provider})` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {telebirrAccounts.length === 0 && bankAccounts.length === 0 && (
                                  <option value="" disabled>No accounts configured yet</option>
                                )}
                              </select>
                              {!paymentMethod && <p style={{ fontSize: '0.75rem', color: 'hsl(0 72% 38%)', marginTop: '0.25rem' }}>Select the account you will transfer your bid payment into if awarded.</p>}

                              {selectedAccObj && (
                                <div style={{ marginTop: '0.875rem', padding: '1rem 1.125rem', background: 'white', borderRadius: '0.625rem', border: '2px solid hsl(152 69% 60%)', boxShadow: '0 2px 8px rgba(16,185,129,0.12)' }}>
                                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(152 76% 35%)', marginBottom: '0.625rem' }}>
                                    ✅ Transfer Payment To This Account
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '0.75rem', rowGap: '0.35rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                    <span style={{ fontWeight: 600, color: '#64748b' }}>Account Name</span>
                                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedAccObj.account_name}</span>

                                    <span style={{ fontWeight: 600, color: '#64748b' }}>Account No.</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: 'hsl(152 76% 22%)', background: 'hsl(152 76% 95%)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', letterSpacing: '0.04em' }}>
                                      {selectedAccObj.account_number}
                                    </span>

                                    {selectedAccObj.bank_provider && (
                                      <>
                                        <span style={{ fontWeight: 600, color: '#64748b' }}>Bank / Provider</span>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedAccObj.bank_provider}</span>
                                      </>
                                    )}

                                    <span style={{ fontWeight: 600, color: '#64748b' }}>Method</span>
                                    <span style={{ fontWeight: 700, color: selectedAccObj.account_type === 'Mobile Wallet' ? '#D97706' : '#0284C7' }}>
                                      {selectedAccObj.account_type === 'Mobile Wallet' ? '📱 Telebirr' : '🏦 Bank Transfer'}
                                    </span>
                                  </div>
                                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'hsl(152 76% 30%)', fontWeight: 600, background: 'hsl(152 76% 94%)', padding: '0.4rem 0.75rem', borderRadius: '0.375rem' }}>
                                    ⚠️ Finance will verify this payment against the above account before your bid is approved.
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Hand signature only — signed as the competitor above */}
                      <div>
                        <label className="pcas-label">
                          Hand Signature <span className="pcas-required">*</span>
                        </label>
                        <div className="pcas-signature-pad">
                          <SignatureCanvas
                            onSave={dataUrl => setHandSignature(dataUrl)}
                            onClear={() => setHandSignature(null)}
                            label={competitorName ? `Signature of ${competitorName}` : 'Competitor Signature'}
                            subtitle={
                              competitorName
                                ? `Sign here with your hand — it will be captured automatically as you draw. By signing, ${competitorName} certifies that the prices, delivery time, payment terms and conditions stated in this bid are accurate and binding if awarded.`
                                : 'Sign here with your hand — it will be captured automatically as you draw. Your signature certifies that the information in this bid is accurate.'
                            }
                            autoSave
                          />
                        </div>
                      </div>
                    </div>

                    {bidError && (
                      <div className={`pcas-error-box${bidError.startsWith('✅') ? ' pcas-info-box-inline' : ''}`}
                        style={bidError.startsWith('✅') ? { background: 'hsl(152 69% 95%)', border: '1px solid hsl(152 69% 75%)', color: 'hsl(152 76% 25%)' } : {}}
                      >
                        {bidError.startsWith('✅') ? <CheckCircle size={20} /> : <AlertCircle size={22} />}
                        <span style={{ flex: 1 }}>{bidError}</span>
                      </div>
                    )}

                    <div className="pcas-form-actions">
                      <button
                        type="submit"
                        className="pcas-btn-primary"
                        disabled={submitting || !competitorName || !handSignature || !agreedToTerms || !paymentMethod || Object.keys(bidItems).length === 0}
                        style={{ maxWidth: '18rem', marginLeft: 'auto' }}
                      >
                        {submitting
                          ? (myExistingBid ? '⏳ Updating Bid...' : '⏳ Submitting Bid...')
                          : myExistingBid
                            ? '✏️ Update Bid'
                            : '🚀 Submit Bid to SUTANA'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCompeteAndSellPage;
