import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SignatureCanvas from '../../components/SignatureCanvas';
import { PublicNav } from './PublicNavFooter';
import confetti from 'canvas-confetti';
import tenderHero from '../../assets/hero-section/tender2.jpg';
import clumpSound from '../../assets/notification/clump.mp3';
import { 
  FileText, Calendar, Box, Activity, User, Briefcase, Clock, FileCheck, CheckCircle, 
  MessageCircle, Send, X, AlertCircle, Phone, Mail, Award, Check,
  PartyPopper, Trophy, Sparkles, Star, Gift, Rocket, ClipboardList, Smartphone, Sparkle, Flame
} from 'lucide-react';
import './PublicLayout.css';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@keyframes glowBlink {
  0%, 100% { box-shadow: 0 0 4px 1px rgba(139,195,74,0.5); border-color: #8BC34A; }
  50%       { box-shadow: 0 0 12px 4px rgba(139,195,74,0.9); border-color: #fff176; }
}
.open-badge-blink {
  animation: glowBlink 1.2s ease-in-out infinite;
  font-weight: 900;
  border: 2px solid #8BC34A;
}

.tender-hero-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 580px;
}
.tender-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.tender-hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.tender-page-root {
  background: #F5F5F5;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}
.tender-main-layout {
  width: 100%;
  padding: 0 0 80px;
}
@media (max-width: 640px) {
  .tender-hero-wrap { height: 340px; }
}

/* ===== MODAL OVERLAY ===== */
.t-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
  overflow-y: auto;
  padding: 80px 16px 40px;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

/* ===== CONTACT CARD ===== */
.contact-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  animation: popUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popUp { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }

/* ===== CELEBRATION CARD ===== */
.celebrate-card {
  background: white;
  padding: 48px 40px;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
  animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}
.celebrate-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #2E8B57, #3b82f6, #a855f7);
}

/* ===== TENDER CARD (Dark Hero Style) ===== */
.tender-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #8D6E63;
  display: flex;
  flex-direction: column;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  overflow: hidden;
  position: relative;
}
.tender-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.tender-card-inner {
  padding: 24px 26px 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ===== INPUT STYLES ===== */
.t-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1.5px solid #8D6E63;
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
  font-family: inherit;
}
.t-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}

/* ===== BID BUTTON ===== */
.bid-btn {
  background: #1B5E20;
  color: white;
  border: none;
  padding: 13px 22px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(27,94,32,0.3);
}
.bid-btn:hover {
  background: #D4AF37;
  color: #1B1B1B;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(212,175,55,0.5);
}

.submit-bid-btn {
  padding: 14px 36px;
  background: #2E8B57;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 15px rgba(16,185,129,0.3);
}
.submit-bid-btn:hover:not(:disabled) { transform: scale(1.03); opacity: 0.9; }
.submit-bid-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Floating emoji animation */
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) scale(1.6); opacity: 0; }
}
.float-emoji {
  display: inline-block;
  animation: floatUp 2s ease-out infinite;
}
`;

// =========================================================================
// MAIN PAGE COMPONENT
// =========================================================================
const PublicSmartTendersPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [biddingStep, setBiddingStep] = useState(0); // 0: list, 2: bid form, 3: celebration
  
  // Bid form state
  const [bidItems, setBidItems] = useState({});
  const [competitorName, setCompetitorName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [bidError, setBidError] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [handSignature, setHandSignature] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Procurement contact info derived from tenders (first tender with contact data set by Purchase team)

  useEffect(() => { fetchTenders(); }, []);

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
          setBidItems({});
          setCompetitorName(user?.name || user?.full_name || '');
          setDigitalSignature('');
          setHandSignature('');
          setDeliveryTime('');
          setPaymentTerms('');
          setBidderEmail(user?.email || '');
          setBidderPhone(user?.phone || '');
          setBiddingStep(2);
          
          // Clear state so it doesn't reopen on refresh
          window.history.replaceState({}, document.title);
        }
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const handleSelectTender = (tender) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, tenderId: tender.id } });
      return;
    }
    
    setSelectedTender(tender);
    setBidItems({});
    setDigitalSignature('');
    setHandSignature('');
    setDeliveryTime('');
    setPaymentTerms('');
    
    // Auto-fill from user context
    setCompetitorName(user?.name || user?.full_name || '');
    setBidderEmail(user?.email || '');
    setBidderPhone(user?.phone || '');
    
    setBidError(null);
    setBiddingStep(2); // Go directly to bid form
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
    setSubmitting(true);

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

    try {
      const res = await api.post(`/public-tenders/public/${selectedTender.id}/bid`, {
        competitorName,
        email: bidderEmail,
        phone: bidderPhone,
        deliveryTime,
        paymentTerms,
        digitalSignatureText: digitalSignature,
        handSignaturePath: handSignature,
        items: itemsPayload
      });

      // Handle duplicate bid (409)
      if (res && res.status === 'duplicate') {
        setBidError('⚠️ You have already submitted a bid for this tender. To update it, go to: Customer Portal → Tender Bids → Update Bid');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      if (err?.message) {
        setBidError(err.message);
      } else {
        setBidError('⚠️ Error submitting bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleCelebrationClose = () => {
    setBiddingStep(0);
    setSelectedTender(null);
    setBidderEmail('');
    setBidderPhone('');
    setDeliveryTime('');
    setPaymentTerms('');
    fetchTenders(); // Refresh tenders to update bid counts
  };

  return (
    <div className="tender-page-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ===== Celebration Overlay ===== */}
      {biddingStep === 3 && (
        <CelebrationModal onClose={handleCelebrationClose} name={competitorName} />
      )}


      {/* Hero */}
      <div className="tender-hero-wrap">
        <img className="tender-hero-img" src={tenderHero} alt="Tenders hero" />
        <div className="tender-hero-overlay">
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, color: '#fbbf24', margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.5px', textShadow: '2px 4px 12px rgba(0,0,0,0.8)' }}>
            Compete &amp; Sell Our Product
          </h1>
          <p style={{ color: '#fff', fontSize: 'clamp(16px, 2vw, 22px)', margin: 0, maxWidth: 640, fontWeight: 600, textShadow: '1px 2px 8px rgba(0,0,0,0.9)', letterSpacing: '0.5px' }}>
            Submit your competitive bids and supply products directly to SUTANA
          </p>
        </div>
      </div>

      <div className="tender-main-layout">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '18px' }}>
            ⏳ Loading Tenders...
          </div>
        ) : (
          <div>

            {/* ===== Tender Cards List ===== */}
            {biddingStep !== 2 && (
              <>
                {/* Laser Banner & Cards Combined Section */}
                <div style={{ padding: '60px 24px', background: '#F5F5F5', minHeight: '100vh' }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B5E20', margin: 0 }}>Open Tenders</h2>
                      <p style={{ fontSize: 13, color: '#424242', margin: '4px 0 0', fontWeight: 600 }}>{tenders.length} tender{tenders.length !== 1 ? 's' : ''} available</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#228B22', fontSize: 13, fontWeight: 700 }}>
                      <Flame size={14} /> Live bidding open
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '28px', width: '100%' }}>
                  {tenders.map(tender => (
                    <div key={tender.id} className="tender-card">
                      <div className="tender-card-inner">
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span className="open-badge-blink" style={{ fontSize: '11px', fontWeight: 800, background: '#F5F5F5', color: '#228B22', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={11} /> Open
                          </span>
                          {tender.tender_number && (
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#424242', background: '#F5F5F5', padding: '3px 10px', borderRadius: '6px', border: '1px solid #8D6E63' }}>{tender.tender_number}</span>
                          )}
                        </div>

                        {/* Category */}
                        {tender.category && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, background: '#F5F5F5', color: '#424242', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #8D6E63' }}>
                              <FileText size={10} /> {tender.category}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1B5E20', marginBottom: '12px', lineHeight: 1.25, letterSpacing: '-0.3px' }}>{tender.title}</h3>

                        {/* Description - full text, no truncation */}
                        <p style={{ color: '#424242', marginBottom: '18px', lineHeight: 1.7, flex: 1, fontSize: '14px', fontWeight: 600 }}>
                          {tender.description}
                        </p>

                        {/* Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                          {tender.opening_date && (
                            <div style={{ fontSize: '12px', color: '#424242', background: '#F5F5F5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #8D6E63' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#424242', marginBottom: '3px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}><Calendar size={11} /> Opens</span>
                              {new Date(tender.opening_date).toLocaleDateString()}
                            </div>
                          )}
                          {tender.closing_date && (
                            <div style={{ fontSize: '12px', background: '#FFF3E0', padding: '10px 12px', borderRadius: '8px', border: '1px solid #8D6E63' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#D84315', marginBottom: '3px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}><Clock size={11} /> Closes</span>
                              <strong style={{ color: '#D84315' }}>{new Date(tender.closing_date).toLocaleDateString()}</strong>
                            </div>
                          )}
                        </div>

                        {/* Footer row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #8D6E63', marginBottom: '16px' }}>
                          <span style={{ fontSize: '12px', color: '#424242', display: 'flex', alignItems: 'center', gap: '4px' }}><Box size={13} /> {tender.items?.length || 0} items</span>
                          <span style={{ fontSize: '12px', color: '#424242', display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={13} /> {tender.bids_count || 0} bids</span>
                        </div>

                        <button
                          className="bid-btn"
                          style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                          onClick={() => handleSelectTender(tender)}
                        >
                          <Award size={18} /> Start Bidding
                        </button>
                      </div>
                    </div>
                  ))}
                  {tenders.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#8D6E63', fontSize: '18px', padding: '40px 0' }}>
                      No active tenders currently available.
                    </p>
                  )}
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #228B22', margin: 0 }} />
              </>
            )}

            {/* ===== INFO SECTIONS (visible only on list view) ===== */}
            {biddingStep !== 2 && (
              <div style={{ background: '#F5F5F5' }}>
                {/* How It Works */}
                <div style={{ padding: 'clamp(32px, 5vw, 64px) clamp(16px, 5vw, 40px)' }}>
                  <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#1B5E20', marginBottom: '8px' }}>How It Works</h2>
                  <p style={{ textAlign: 'center', color: '#424242', marginBottom: '40px', fontSize: '16px' }}>Four simple steps from tender discovery to award</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '24px' }}>
                    {[
                      { step: '01', icon: <FileText size={32} color="#228B22" />, title: 'Browse Tenders', desc: 'Review all open tenders above. Each listing includes item details, quantities, and the closing deadline.' },
                      { step: '02', icon: <FileCheck size={32} color="#228B22" />, title: 'Register & Bid', desc: 'Click "Start Bidding", provide your email and phone, then fill in your unit prices for each requested item.' },
                      { step: '03', icon: <Activity size={32} color="#228B22" />, title: 'Evaluation', desc: 'Our Purchase team analyses all submitted bids, comparing price, delivery time and payment terms.' },
                      { step: '04', icon: <Award size={32} color="#228B22" />, title: 'Award & Contract', desc: 'The best-value supplier is recommended and approved by our CEO. You will be notified within 3–5 business days.' },
                    ].map(s => (
                      <div key={s.step} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #8D6E63', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}>
                        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '48px', opacity: 0.04, fontWeight: 900, color: '#1B5E20' }}>{s.step}</div>
                        <div style={{ marginBottom: '16px', background: '#E8F5E9', display: 'inline-block', padding: '12px', borderRadius: '50%' }}>{s.icon}</div>
                        <h3 style={{ fontWeight: 700, fontSize: '17px', color: '#1B5E20', marginBottom: '8px' }}>Step {s.step}: {s.title}</h3>
                        <p style={{ color: '#424242', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #228B22', margin: 0 }} />
                {/* Why Bid Section */}
                <div style={{ background: '#FFFFFF', padding: 'clamp(32px, 5vw, 64px) clamp(16px, 5vw, 40px)' }}>
                  <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, marginBottom: '8px', color: '#1B5E20' }}>Why Bid with SUTANA?</h2>
                  <p style={{ textAlign: 'center', color: '#424242', marginBottom: '40px', fontSize: '15px' }}>Trusted by suppliers across Ethiopia</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '28px' }}>
                    {[
                      { icon: <Activity size={28} color="#2E8B57" />, title: 'Fast Process', desc: 'Digital submission — no paperwork, no queues. Submit your bid in minutes from anywhere.' },
                      { icon: <FileCheck size={28} color="#2E8B57" />, title: 'Fair & Transparent', desc: 'Every bid is evaluated on merit. Lowest price, delivery, and payment terms are all scored objectively.' },
                      { icon: <Briefcase size={28} color="#2E8B57" />, title: 'Timely Payment', desc: 'SUTANA is committed to paying awarded suppliers on time, as per the agreed payment schedule.' },
                      { icon: <CheckCircle size={28} color="#2E8B57" />, title: 'Long-Term Partnerships', desc: 'Top-performing suppliers are prioritized for future tenders and ongoing procurement contracts.' },
                      { icon: <User size={28} color="#2E8B57" />, title: 'Open to All', desc: 'Any registered business or individual can participate. No entry fee, no hidden requirements.' },
                      { icon: <Mail size={28} color="#2E8B57" />, title: 'Instant Confirmation', desc: 'Receive immediate bid confirmation and status updates directly to your registered email and phone.' },
                    ].map(b => (
                      <div key={b.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ marginBottom: '12px', background: '#F5F5F5', padding: '14px', borderRadius: '50%', border: '1px solid #8D6E63' }}>{b.icon}</div>
                        <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#1B5E20' }}>{b.title}</h3>
                        <p style={{ color: '#424242', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #228B22', margin: 0 }} />
                {/* Requirements */}
                <div style={{ padding: 'clamp(32px, 5vw, 64px) clamp(16px, 5vw, 40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', marginBottom: '0' }}>
                  <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #8D6E63', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1B5E20', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileCheck size={20} color="#228B22" /> What You Need to Bid</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        'Valid email address and phone number',
                        'Your company or business name',
                        'Unit price per item (in Ethiopian Birr and Cent)',
                        'Estimated delivery time',
                        'Your preferred payment terms',
                        'Digital or hand-drawn signature',
                      ].map(r => (
                        <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#424242' }}>
                          <span style={{ marginTop: '2px' }}><Check size={16} color="#4CAF50" /></span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* FAQs with Accordion */}
                  <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', border: '1px solid #8D6E63', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1B5E20', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} color="#2E8B57" /> Frequently Asked Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { q: 'Can I bid on multiple tenders?', a: 'Yes. You can submit separate bids for as many open tenders as you qualify for.' },
                        { q: 'What happens after I submit?', a: 'Our Purchase team will review, compare, and rank all bids. You will be contacted if your bid is selected.' },
                        { q: 'Is there a cost to bid?', a: 'No. Bidding on SUTANA tenders is completely free of charge.' },
                        { q: 'Can I update my bid?', a: 'Once submitted, bids are final. Please review all pricing carefully before submitting.' },
                      ].map(faq => (
                        <details key={faq.q} style={{ borderBottom: '1px solid #F5F5F5', paddingBottom: '8px' }}>
                          <summary style={{ fontWeight: 700, color: '#424242', fontSize: '14px', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {faq.q}
                            <span style={{ color: '#228B22', fontSize: '18px' }}>+</span>
                          </summary>
                          <p style={{ color: '#424242', margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>{faq.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ===== Bid Form Step ===== */}
            {biddingStep === 2 && selectedTender && (
              <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(20px, 5vw, 40px)', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #8D6E63' }}>
                <button onClick={() => setBiddingStep(0)}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '24px', fontWeight: 600, fontSize: '15px' }}>
                  ← Back to Tenders
                </button>

                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: '#424242' }}>{selectedTender.title}</h2>
                  <p style={{ color: '#64748b' }}>{selectedTender.description}</p>
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '14px', color: '#0369a1' }}>
                    👤 Bidder: <strong>{bidderEmail}</strong> · 📱 {bidderPhone}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Smart Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '32px', border: '1px solid #8D6E63', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #424242, #1B5E20)' }}>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>No</th>
                          <th style={{ padding: '14px 12px', color: 'white', fontWeight: 700, fontSize: '13px' }}>Object Type</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Unit</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Qty</th>
                          <th colSpan="2" style={{ padding: '14px 12px', color: '#fbbf24', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>Price / Object</th>
                          <th colSpan="2" style={{ padding: '14px 12px', color: '#34d399', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>Total Value</th>
                          <th style={{ padding: '14px 12px', color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>Checkup</th>
                        </tr>
                        <tr style={{ background: '#f8fafc', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                          <th colSpan="4" style={{ padding: '8px 12px' }}></th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Birr</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #fbbf24' }}>Cent</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #34d399' }}>Birr</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #34d399' }}>Cent</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTender.items?.map((item, index) => {
                          const { totalB, totalC } = calculateTotal(item.id);
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '14px 12px', fontWeight: 700, color: '#94a3b8' }}>{index + 1}</td>
                              <td style={{ padding: '14px 12px', fontWeight: 700, color: '#424242' }}>{item.object_type}</td>
                              <td style={{ padding: '14px 12px', color: '#64748b' }}>{item.unit}</td>
                              <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.quantity}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="number" min="0" placeholder="0"
                                  onChange={e => handleBidItemChange(item.id, 'priceBirr', e.target.value)}
                                  className="t-input" style={{ minWidth: '80px', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="number" min="0" max="99" placeholder="00"
                                  onChange={e => handleBidItemChange(item.id, 'priceCent', e.target.value)}
                                  className="t-input" style={{ minWidth: '60px', textAlign: 'right' }}
                                />
                              </td>
                              <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#2E8B57', background: '#f0fdf4' }}>{totalB}</td>
                              <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#2E8B57', background: '#f0fdf4' }}>{totalC.toString().padStart(2, '0')}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <input type="text" placeholder="Remarks..."
                                  onChange={e => handleBidItemChange(item.id, 'checkup', e.target.value)}
                                  className="t-input"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Terms & Conditions (Delivery & Payment) */}
                  <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '12px', border: '1px solid #8D6E63', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#424242' }}>Terms &amp; Conditions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>Estimated Delivery Time <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="text" required value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                          className="t-input" placeholder="e.g., 30 days after order" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>Payment Terms <span style={{ color: '#ef4444' }}>*</span></label>
                        <select required value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="t-input">
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
                  </div>

                  {/* Footer: Name, Signature, Date */}
                  <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '12px', border: '1px solid #8D6E63', marginBottom: '32px' }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#424242' }}>Competitor Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Competitor Name (Fill Part) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="text" required value={competitorName}
                          onChange={e => setCompetitorName(e.target.value)}
                          className="t-input" placeholder="Enter company / person name"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Date (Auto from Server)
                        </label>
                        <input type="text" disabled value={new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                          className="t-input" style={{ background: '#8D6E63', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Digital Signature <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="text" required value={digitalSignature}
                          onChange={e => setDigitalSignature(e.target.value)}
                          className="t-input"
                          style={{ fontFamily: 'cursive', fontSize: '20px', color: '#1e40af' }}
                          placeholder="Type your signature..."
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#334155' }}>
                          Signature with Hand
                        </label>
                        <div style={{ border: '1.5px solid #8D6E63', background: 'white', borderRadius: '8px' }}>
                          <SignatureCanvas onSave={dataUrl => setHandSignature(dataUrl)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {bidError && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
                      padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', fontSize: '15px',
                      display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600,
                      boxShadow: '0 4px 6px rgba(220, 38, 38, 0.1)', animation: 'fadeIn 0.3s ease'
                    }}>
                      <AlertCircle size={24} color="#dc2626" />
                      <span style={{ flex: 1 }}>{bidError}</span>
                      {(bidError.toLowerCase().includes('already') || bidError.toLowerCase().includes('customer portal')) && (
                        <button type="button" onClick={() => navigate('/customer')} style={{
                          background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px',
                          borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                        }}>Go to Portal</button>
                      )}
                    </div>
                  )}

                  <div style={{ textAlign: 'right' }}>
                    <button type="submit" className="submit-bid-btn"
                      disabled={submitting || !competitorName || !digitalSignature || Object.keys(bidItems).length === 0}
                    >
                      {submitting ? '⏳ Submitting Bid...' : '🚀 Submit Bid to SUTANA'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSmartTendersPage;
