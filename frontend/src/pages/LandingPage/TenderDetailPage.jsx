import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../services/apiClient';
import confetti from 'canvas-confetti';
import clumpSound from '../../assets/notification/clump.mp3';
import {
  Calendar, Clock, Tag, FileText, ArrowLeft, CheckCircle, XCircle,
  AlertCircle, User, Lock, Flame, Award, Building2, Package,
  ChevronRight, Star, TrendingUp, ExternalLink, X,
  PartyPopper, Trophy, Sparkles, Gift, Rocket, Sparkle
} from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import { loadVatSafe, getVatForItem, fmtPct } from '../../services/vatService';
import './PublicLayout.css';
import './TenderDetailPage.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

/* ─── Celebration Modal ─── */
const CelebrationModal = ({ onClose }) => {
  useEffect(() => {
    // Play clump sound
    try { const a = new Audio(clumpSound); a.volume = 0.8; a.play(); } catch (e) {}
    // Burst confetti from both sides
    const end = Date.now() + 4000;
    const colors = ['#fbbf24','#f59e0b','#2E8B57','#3b82f6','#a855f7','#ef4444','#ec4899'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors, zIndex: 10000 });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors, zIndex: 10000 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    return () => confetti.reset();
  }, []);

  return (
    <div onClick={onClose} className="tdp-modal-overlay">
      <div onClick={e => e.stopPropagation()} className="tdp-celebration-box">
        {/* Icons row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <PartyPopper size={34} color="#fbbf24" />
          <Trophy size={40} color="#f59e0b" />
          <PartyPopper size={34} color="#fbbf24" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <h2 className="tdp-celebration-title">Bid Submitted!</h2>

        <p style={{ fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 12px' }}>
          Congratulations! 🎉
        </p>
        <p style={{ fontSize: 14, color: 'hsl(var(--foreground))', lineHeight: 1.7, margin: '0 0 28px' }}>
          Your bid has been successfully received by <strong>SUTANA</strong>.<br/>
          Our Sales team will review all bids after the deadline and contact the winner.
        </p>

        {/* Floating icons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
          {[<PartyPopper size={26} color="#ec4899" />, <Sparkles size={26} color="#f59e0b" />,
            <Star size={26} color="#fbbf24" />, <Sparkle size={26} color="#3b82f6" />,
            <Gift size={26} color="#2E8B57" />].map((icon, i) => (
            <span key={i} style={{ animation: `tdpFadeUp 0.5s ${i * 0.1}s both`, display: 'inline-flex' }}>{icon}</span>
          ))}
        </div>

        <button onClick={onClose} className="tdp-btn-primary" style={{ borderRadius: 50, padding: '13px 44px', width: 'auto' }}>
          <Rocket size={18} /> Awesome, Close!
        </button>
      </div>
    </div>
  );
};

const Countdown = ({ deadline }) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) return setRemaining('CLOSED');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    tick(); const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{remaining}</span>;
};

export default () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ bid_price_per_unit: '', quantity_requested: '', proposed_pickup_date: '', notes: '', bidder_full_name: '', bidder_email: '', bidder_phone: '', digital_signature: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [itemBids, setItemBids] = useState({});
  const [vatCtx, setVatCtx] = useState(null);
  
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);

  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/tenders/public/${id}`);
        if (res.status === 'success') setTender(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user && tender?.status === 'open') {
      axios.get(`/tenders/${tender.id}/my-bid`).then(r => {
        if (r.status === 'success' && r.data) setMyBid(r.data);
      }).catch(() => {});
    }
    if (user && tender?.status === 'awarded') {
      axios.get(`/tenders/${tender.id}/my-bid`).then(r => {
        if (r.status === 'success' && r.data) setMyBid(r.data);
      }).catch(() => {});
      axios.get(`/tenders/${tender.id}/winner`).then(r => {
        if (r.status === 'success' && r.data) setWinner(r.data);
      }).catch(() => {});
    }
  }, [user, tender]);

  useEffect(() => {
    const stored = user || {};
    if (myBid) {
      setForm({
        bid_price_per_unit: myBid.bid_price_per_unit || '',
        quantity_requested: myBid.quantity_requested || 1,
        proposed_pickup_date: myBid.proposed_pickup_date ? myBid.proposed_pickup_date.slice(0, 10) : '',
        notes: myBid.notes || '',
        bidder_full_name: myBid.bidder_full_name || stored.full_name || '',
        bidder_email: myBid.bidder_email || stored.email || '',
        bidder_phone: myBid.bidder_phone || stored.phone || '',
        digital_signature: myBid.digital_signature || '',
      });
    } else if (tender) {
      setForm(f => ({ ...f,
        bid_price_per_unit: tender.starting_bid_price || '',
        quantity_requested: tender.quantity || 1,
        bidder_full_name: f.bidder_full_name || stored.full_name || '',
        bidder_email: f.bidder_email || stored.email || '',
        bidder_phone: f.bidder_phone || stored.phone || '',
        digital_signature: f.digital_signature || '',
      }));
    }

    if (myBid && myBid.items) {
      try {
        const parsed = typeof myBid.items === 'string' ? JSON.parse(myBid.items) : myBid.items;
        const initialItemBids = {
          notes: myBid.notes || '',
          proposed_pickup_date: myBid.proposed_pickup_date ? myBid.proposed_pickup_date.slice(0, 10) : ''
        };
        parsed.forEach((it, idx) => {
          initialItemBids[`birr_${idx}`] = it.bidPriceBirr || '';
          initialItemBids[`cent_${idx}`] = it.bidPriceCent || '';
        });
        setItemBids(initialItemBids);
      } catch (e) {}
    }
  }, [myBid, tender, user]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // block double-click
    setSubmitting(true);
    setMessage(null);
    try {
      let res;
      if (myBid) {
        res = await axios.put(`/tenders/${tender.id}/bid`, form);
      } else {
        res = await axios.post(`/tenders/${tender.id}/bid`, form);
      }
      if (res.status === 'success') {
        setMessage({ type: 'success', text: res.message || (myBid ? 'Bid updated successfully!' : 'Bid submitted successfully!') });
        const r = await axios.get(`/tenders/${tender.id}/my-bid`);
        if (r.status === 'success') setMyBid(r.data);
        if (!myBid) setShowCelebration(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Submission failed. Please try again.' });
    }
    finally { setSubmitting(false); }
  };

  const handleMultiItemBidSubmit = async (e, items) => {
    e.preventDefault();
    if (submitting) return; // block double-click
    setSubmitting(true);
    setMessage(null);
    const itemsWithBids = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const birrStr = itemBids[`birr_${i}`] || '';
      const centStr = itemBids[`cent_${i}`] || '';
      const start = parseFloat(item.startPrice || 0);

      if (birrStr || centStr) {
        const totalBid = parseFloat(birrStr || 0) + (parseFloat(centStr || 0) / 100);
        if (totalBid < start) {
          setMessage({ type: 'error', text: `Item #${i + 1} ("${item.objectType || 'Item'}") bid of ${totalBid.toLocaleString()} ETB is below the minimum start price of ${start.toLocaleString()} ETB.` });
          setSubmitting(false);
          return;
        }
      } else if (start > 0) {
        setMessage({ type: 'error', text: `Please enter a bid price for Item #${i + 1} ("${item.objectType || 'Item'}"). Minimum is ${start.toLocaleString()} ETB.` });
        setSubmitting(false);
        return;
      }

      itemsWithBids.push({
        ...item,
        bidPriceBirr: birrStr,
        bidPriceCent: centStr,
      });
    }

    try {
      const payload = {
        notes: itemBids.notes || '',
        proposed_pickup_date: itemBids.proposed_pickup_date || '',
        items: JSON.stringify(itemsWithBids),
        bid_price_per_unit: 0,
        quantity_requested: items.length,
        bidder_full_name: form.bidder_full_name,
        bidder_email: form.bidder_email,
        bidder_phone: form.bidder_phone,
        digital_signature: form.digital_signature,
      };
      
      let res;
      if (myBid) {
        res = await axios.put(`/tenders/${tender.id}/bid`, payload);
      } else {
        res = await axios.post(`/tenders/${tender.id}/bid`, payload);
      }
      
      if (res.status === 'success') {
        setMessage({ type: 'success', text: res.message || (myBid ? 'Bid updated successfully!' : 'Your bid has been submitted successfully!') });
        const r = await axios.get(`/tenders/${tender.id}/my-bid`);
        if (r.status === 'success') setMyBid(r.data);
        if (!myBid) setShowCelebration(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Submission failed. Please try again.' });
    }
    finally { setSubmitting(false); }
  };

  const isOpen = tender?.status === 'open' && new Date(tender.deadline) > new Date();
  const isMultiTender = !!(tender?.items && tender.items !== '' && tender.items !== 'null');
  const attachments = tender?.attachments ? (() => { try { return JSON.parse(tender.attachments); } catch { return []; } })() : [];
  const images = attachments.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const docs = attachments.filter(f => !/\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const [coverImgIdx, setCoverImgIdx] = useState(0);
  const coverImg = coverImgIdx < images.length ? images[coverImgIdx] : null;

  return (
    <div className="tdp-root">
      <PublicNav />

      {/* 🎉 Celebration Modal */}
      {showCelebration && <CelebrationModal onClose={() => setShowCelebration(false)} />}

      <div className="tdp-container">
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="tdp-card" style={{ height: 180, marginBottom: '1rem', background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)', backgroundSize: '400px', animation: 'tdpShimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : !tender ? (
          <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'hsl(var(--muted-foreground))' }}>
            <p style={{ fontSize: '1.125rem' }}>Tender not found.</p>
            <button onClick={() => navigate('/tenders')} className="tdp-btn-primary" style={{ width: 'auto', marginTop: '1rem' }}>Back to Tenders</button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/tenders/buy')} className="tdp-btn-back">
              <ArrowLeft size={16} /> All Tenders
            </button>
            
            {/* ─── Main Layout ─── */}
            <div className={`tdp-layout ${isMultiTender ? 'multi' : ''}`}>
              {/* Left Column */}
              <div className="tdp-card">
                {coverImg && (
                  <img
                    className="tdp-cover-img"
                    src={`${API_ORIGIN}/uploads/tenders/${coverImg}`}
                    alt={tender.title}
                    onError={() => setCoverImgIdx(i => i + 1)}
                  />
                )}

                <div className="tdp-content">
                  <div className="tdp-header-row">
                    <span className="tdp-ref">
                      {tender.reference_number}
                    </span>
                    <span className={`tdp-status ${tender.status}`}>
                      {tender.status === 'open' && <span className="tdp-live-dot" />}
                      {tender.status.replace('_', ' ')}
                    </span>
                    {tender.category && (
                      <span className="tdp-badge">
                        {tender.category}
                      </span>
                    )}
                  </div>

                  <h1 className="tdp-title">
                    {tender.title}
                  </h1>

                  {/* Stats */}
                  <div className="tdp-stats-grid">
                    {(() => {
                      let parsedItems = [];
                      try { parsedItems = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                      if (parsedItems.length > 0) {
                        return (
                          <div className="tdp-stat-box full-width">
                            <div className="tdp-stat-label">Tender Type</div>
                            <div className="tdp-stat-value" style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                              <Package size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                              Multi-Item Tender &mdash; {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} (see table below)
                            </div>
                          </div>
                        );
                      }
                      return (
                        <>
                          {tender.item_name && (
                            <div className="tdp-stat-box">
                              <div className="tdp-stat-label">Item</div>
                              <div className="tdp-stat-value" style={{ fontSize: '0.875rem' }}>{tender.item_name}</div>
                            </div>
                          )}
                          <div className="tdp-stat-box">
                            <div className="tdp-stat-label">Quantity</div>
                            <div className="tdp-stat-value">{tender.quantity}</div>
                          </div>
                          <div className="tdp-stat-box">
                            <div className="tdp-stat-label">Starting Price</div>
                            <div className="tdp-stat-value primary">{parseFloat(tender.starting_bid_price || 0).toLocaleString()}</div>
                          </div>
                        </>
                      );
                    })()}
                    <div className="tdp-stat-box">
                      <div className="tdp-stat-label">Deadline</div>
                      <div className="tdp-stat-value" style={{ fontSize: '0.875rem' }}>
                        {tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-CA') : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Countdown */}
                  {isOpen && (
                    <div className="tdp-countdown-box">
                      <Flame size={24} color="#92400e" />
                      <div>
                        <div className="tdp-countdown-label">Time Remaining</div>
                        <div className="tdp-countdown-value"><Countdown deadline={tender.deadline} /></div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="tdp-section">
                    <h3 className="tdp-section-title"><FileText size={18} /> Description</h3>
                    <p className="tdp-section-body">{tender.description}</p>
                  </div>

                  {/* Items Table (for multiple-product tenders) */}
                  {(() => {
                    let items = [];
                    try { items = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                    if (!items.length) return null;
                    return (
                      <div className="tdp-section">
                        <h3 className="tdp-section-title"><Package size={18} /> Tender Items — Fill Your Bid Price ({items.length} items)</h3>
                        {isOpen && user && (
                          <div className="tdp-alert info">
                            📝 Enter your bid price for each item below, then click <strong>Submit Multi-Item Bid</strong>.
                          </div>
                        )}
                        <form onSubmit={e => handleMultiItemBidSubmit(e, items)}>
                          <div className="tdp-table-wrapper">
                            <table className="tdp-table">
                              <thead>
                                <tr>
                                  {['No', 'Item / Object Type', 'Unit', 'Qty', 'Start Price (ETB)', 'Your Bid / Unit (Birr)', 'Your Bid / Unit (Cent)', 'Total'].map((h, i) => (
                                    <th key={i} className={i >= 3 ? 'right' : ''} style={{ fontStyle: i >= 5 ? 'italic' : 'normal' }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => {
                                  const birr = parseFloat(itemBids[`birr_${idx}`] || 0);
                                  const cent = parseFloat(itemBids[`cent_${idx}`] || 0);
                                  const totalBirr = (birr + cent / 100) * parseFloat(item.quantity || 1);
                                  const isError = itemBids[`birr_${idx}`] && parseFloat(itemBids[`birr_${idx}`]) < parseFloat(item.startPrice || 0);
                                  return (
                                    <tr key={idx} className={idx % 2 === 0 ? 'alt' : ''}>
                                      <td style={{ fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{idx + 1}</td>
                                      <td style={{ fontWeight: 600 }}>{item.objectType || item.object_type || '—'}</td>
                                      <td>{item.unit || '—'}</td>
                                      <td className="right" style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{item.quantity}</td>
                                      <td className="right" style={{ fontWeight: 800 }}>
                                        {item.startPrice ? parseFloat(item.startPrice).toLocaleString() + ' ETB' : '—'}
                                      </td>
                                      <td className="right">
                                        {isOpen && user ? (
                                          <input
                                            type="number" step="0.01"
                                            min={item.startPrice ? parseFloat(item.startPrice) : 0}
                                            required
                                            value={itemBids[`birr_${idx}`] || ''}
                                            onChange={e => setItemBids(prev => ({ ...prev, [`birr_${idx}`]: e.target.value }))}
                                            placeholder={item.startPrice ? `Min: ${parseFloat(item.startPrice).toLocaleString()}` : '0'}
                                            className={`tdp-input-table ${isError ? 'error' : ''}`}
                                          />
                                        ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                                      </td>
                                      <td className="right">
                                        {isOpen && user ? (
                                          <input
                                            type="number" min="0" max="99" step="1"
                                            value={itemBids[`cent_${idx}`] || ''}
                                            onChange={e => setItemBids(prev => ({ ...prev, [`cent_${idx}`]: e.target.value }))}
                                            placeholder="0"
                                            className="tdp-input-table"
                                          />
                                        ) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}
                                      </td>
                                      <td className="right" style={{ fontWeight: 700, color: totalBirr > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                                        {totalBirr > 0 ? totalBirr.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ETB' : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* VAT Summary */}
                          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                            {items.map((item, idx) => {
                              const birr = parseFloat(itemBids[`birr_${idx}`] || 0);
                              const cent = parseFloat(itemBids[`cent_${idx}`] || 0);
                              const qty = parseFloat(item.quantity || 1);
                              const unitBid = (birr || parseFloat(item.startPrice || 0)) + cent / 100;
                              const v = getVatForItem(vatCtx, 'tender_sell', item.id != null ? item.id : idx, unitBid * qty);
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem 0', color: 'hsl(var(--foreground))' }}>
                                  <span>{item.objectType || item.object_type || `Item ${idx + 1}`} — VAT ({fmtPct(v.rate)})</span>
                                  <span style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{v.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                                </div>
                              );
                            })}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 800, borderTop: '1px solid hsl(var(--border))', marginTop: '0.5rem', paddingTop: '0.5rem', color: 'hsl(var(--foreground))' }}>
                              <span>Grand Total (incl. VAT)</span>
                              <span>{items.reduce((sum, item, idx) => {
                                const birr = parseFloat(itemBids[`birr_${idx}`] || 0);
                                const cent = parseFloat(itemBids[`cent_${idx}`] || 0);
                                const qty = parseFloat(item.quantity || 1);
                                const unitBid = (birr || parseFloat(item.startPrice || 0)) + cent / 100;
                                return sum + getVatForItem(vatCtx, 'tender_sell', item.id != null ? item.id : idx, unitBid * qty).total;
                              }, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                            </div>
                          </div>

                          {isOpen && user && (
                            <div style={{ marginTop: '2rem' }}>
                              <h4 style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Competitor Details</h4>
                              
                              <div className="tdp-form-group">
                                <label className="tdp-label">
                                  Competitor Name (Fill Part) <span style={{ color: 'hsl(0 84% 60%)' }}>*</span>
                                </label>
                                <input required type="text"
                                  placeholder="Enter company / person name"
                                  className="tdp-input"
                                  value={form.bidder_full_name}
                                  onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                  <label className="tdp-label">Email Address</label>
                                  <input type="email" placeholder="example@email.com"
                                    className="tdp-input"
                                    value={form.bidder_email} onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="tdp-label">Phone Number</label>
                                  <input type="tel" placeholder="0900000000"
                                    className="tdp-input"
                                    value={form.bidder_phone} onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))} />
                                </div>
                              </div>

                              <div className="tdp-form-group">
                                <label className="tdp-label">
                                  Digital Signature <span style={{ color: 'hsl(0 84% 60%)' }}>*</span>
                                </label>
                                <input required type="text"
                                  placeholder="Type your signature..."
                                  className="tdp-input"
                                  value={form.digital_signature}
                                  onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                                />
                                <div className={`tdp-signature ${!form.digital_signature ? 'empty' : ''}`}>
                                  {form.digital_signature || 'Signature preview will appear here'}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                  <label className="tdp-label">Proposed Pickup Date</label>
                                  <input type="date" value={itemBids.proposed_pickup_date || ''} onChange={e => setItemBids(p => ({ ...p, proposed_pickup_date: e.target.value }))}
                                    className="tdp-input" />
                                </div>
                                <div>
                                  <label className="tdp-label">Notes / Cover Letter</label>
                                  <input value={itemBids.notes || ''} onChange={e => setItemBids(p => ({ ...p, notes: e.target.value }))}
                                    placeholder="Describe your offer..."
                                    className="tdp-input" />
                                </div>
                              </div>

                              {message && (
                                <div className={`tdp-alert ${message.type}`} style={{ marginTop: '1rem' }}>
                                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                  {message.text}
                                </div>
                              )}

                              <button type="submit" disabled={submitting} className="tdp-btn-primary" style={{ marginTop: '1.5rem' }}>
                                {submitting ? '⏳ Submitting...' : <><Award size={18} /> Submit Multi-Item Bid</>}
                              </button>
                            </div>
                          )}
                          {!user && isOpen && (
                            <Link to={`/login?redirect=/tenders/${tender.id}`} className="tdp-multi-login">
                              <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> <strong>Sign in</strong> to submit your bid on these items.
                            </Link>
                          )}
                        </form>
                      </div>
                    );
                  })()}

                  {/* Terms */}
                  <div className="tdp-section">
                    <h3 className="tdp-section-title"><CheckCircle size={18} /> Terms &amp; Conditions</h3>
                    <p className="tdp-section-body">{tender.terms_conditions}</p>
                  </div>

                  {/* Images Gallery */}
                  {images.length > 0 && (
                    <div className="tdp-section">
                      <h3 className="tdp-section-title"><Star size={18} /> Attachments ({images.length} image{images.length !== 1 ? 's' : ''})</h3>
                      <div className="tdp-images-grid">
                        {images.map((f, i) => (
                          <div key={i} onClick={() => setSelectedImage(`${API_ORIGIN}/uploads/tenders/${f}`)} style={{ cursor: 'pointer' }}>
                            <img className="tdp-img-thumb" src={`${API_ORIGIN}/uploads/tenders/${f}`} alt={`Attachment ${i + 1}`} />
                          </div>
                        ))}
                      </div>
                      {docs.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {docs.map((f, i) => (
                            <a key={i} href={`${API_ORIGIN}/uploads/tenders/${f}`} target="_blank" rel="noopener noreferrer" className="tdp-btn-outline" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                              <FileText size={14} /> {f} <ExternalLink size={11} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancellation */}
                  {tender.cancellation_reason && (
                    <div className="tdp-alert error">
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Cancellation Reason</strong>
                        <p style={{ margin: '0.25rem 0 0', lineHeight: 1.6 }}>{tender.cancellation_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="tdp-sidebar">
                {!isMultiTender && (
                  <>
                    {/* Meta Info */}
                    <div className="tdp-card tdp-card-sidebar">
                      <div className="tdp-content" style={{ padding: '1.25rem' }}>
                        <h3 className="tdp-section-title" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', paddingBottom: '0.75rem' }}>
                          <Package size={16} /> Tender Details
                        </h3>
                        {[
                          { key: <><Calendar size={13} /> Published</>, val: new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                          { key: <><Clock size={13} /> Deadline</>, val: tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
                          { key: <><Tag size={13} /> Category</>, val: tender.category || '—' },
                          { key: <><Building2 size={13} /> Status</>, val: <span className={`tdp-status ${tender.status}`} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.625rem' }}>{tender.status.replace('_', ' ')}</span> },
                          { key: <><TrendingUp size={13} /> Min. Price</>, val: <span style={{ color: 'hsl(var(--primary))', fontWeight: 800 }}>{parseFloat(tender.starting_bid_price).toLocaleString()} ETB</span> },
                        ].map(({ key, val }, i) => (
                          <div className="tdp-meta-row" key={i}>
                            <span className="tdp-meta-key">{key}</span>
                            <span className="tdp-meta-val">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bid Section — Logged In User */}
                    {isOpen && user && (
                      <div className="tdp-card tdp-card-sidebar">
                        <div className="tdp-bid-header">
                          <div className="tdp-bid-header-subtitle">
                            <Award size={18} />
                            {myBid ? 'Your Bid' : 'Place a Bid'}
                          </div>
                          <p className="tdp-bid-header-title">
                            {myBid ? 'Update Your Application' : 'Submit Your Offer'}
                          </p>
                        </div>

                        <div className="tdp-bid-body">
                          {myBid && (
                            <div className="tdp-existing-bid">
                              <div className="tdp-existing-bid-title">
                                <CheckCircle size={14} /> Your current bid
                              </div>
                              <div className="tdp-existing-bid-value">{parseFloat(myBid.bid_price_per_unit).toLocaleString()} ETB/unit</div>
                              <div className="tdp-existing-bid-total">Total: {parseFloat(myBid.total_bid_value || myBid.bid_price_per_unit * (tender.quantity || 1)).toLocaleString()} ETB</div>
                            </div>
                          )}

                          {message && (
                            <div className={`tdp-alert ${message.type}`}>
                              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                              {message.text}
                            </div>
                          )}

                          <form onSubmit={handleBidSubmit}>
                            <div className="tdp-form-group">
                              <label className="tdp-label">Full Name *</label>
                              <input className="tdp-input" required type="text"
                                value={form.bidder_full_name}
                                onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                                placeholder="Your full name"
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                              <div>
                                <label className="tdp-label">Email *</label>
                                <input className="tdp-input" required type="email"
                                  value={form.bidder_email}
                                  onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))}
                                  placeholder="your@email.com"
                                />
                              </div>
                              <div>
                                <label className="tdp-label">Phone *</label>
                                <input className="tdp-input" required type="tel"
                                  value={form.bidder_phone}
                                  onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))}
                                  placeholder="+251..."
                                />
                              </div>
                            </div>
                            <div className="tdp-form-group">
                              <label className="tdp-label">Bid Price (ETB/unit) *</label>
                              <input className="tdp-input" required type="number" step="0.01" min={tender.starting_bid_price}
                                value={form.bid_price_per_unit}
                                onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))}
                                placeholder={`Min: ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB`}
                              />
                            </div>
                            <div className="tdp-form-group">
                              <label className="tdp-label">Proposed Pickup Date</label>
                              <input className="tdp-input" type="date" value={form.proposed_pickup_date}
                                onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))}
                              />
                            </div>
                            <div className="tdp-form-group">
                              <label className="tdp-label">Notes / Cover Letter</label>
                              <textarea className="tdp-input tdp-textarea" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Describe your offer, qualifications, delivery terms..."
                              />
                            </div>
                            <div className="tdp-form-group">
                              <label className="tdp-label">Digital Signature *</label>
                              <input className="tdp-input" required type="text"
                                value={form.digital_signature}
                                onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                                placeholder="Type your full name as signature"
                              />
                              <div className={`tdp-signature ${!form.digital_signature ? 'empty' : ''}`}>
                                {form.digital_signature || 'Signature preview will appear here'}
                              </div>
                            </div>
                            <button type="submit" className="tdp-btn-primary" disabled={submitting}>
                              {submitting ? '⏳ Submitting...' : myBid ? <><CheckCircle size={16} /> Update My Bid</> : <><Award size={16} /> Submit Bid</>}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Sign-in CTA — Not Logged In */}
                    {!user && isOpen && (
                      <div className="tdp-card tdp-card-sidebar">
                        <div className="tdp-signin-header">
                          <div className="tdp-signin-icon">
                            <Lock size={28} color="white" />
                          </div>
                          <h3 className="tdp-signin-title">Ready to Bid?</h3>
                          <p className="tdp-signin-desc">
                            Sign in to your account to submit a bid on this tender and compete for this contract.
                          </p>
                        </div>
                        <div className="tdp-signin-body">
                          <div className="tdp-signin-stats">
                            <div className="tdp-signin-stats-label">This tender offers</div>
                            {[
                              { icon: <TrendingUp size={13} color="hsl(var(--primary))" />, text: `Starting at ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB/unit` },
                              { icon: <Package size={13} color="hsl(var(--primary))" />, text: `${tender.quantity} units available` },
                              { icon: <Clock size={13} color="hsl(var(--primary))" />, text: <><Countdown deadline={tender.deadline} /> remaining</> },
                            ].map(({ icon, text }, i) => (
                              <div key={i} className="tdp-signin-stat-row">
                                {icon} {text}
                              </div>
                            ))}
                          </div>
                          <Link to={`/login?redirect=/tenders/${tender.id}`} className="tdp-btn-primary" style={{ marginBottom: '0.5rem', textDecoration: 'none' }}>
                            <User size={16} /> Sign In to Bid <ChevronRight size={14} />
                          </Link>
                          <Link to="/auth/register" className="tdp-btn-outline">
                            Create Free Account
                          </Link>
                          <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', margin: '1rem 0 0', textAlign: 'center' }}>
                            By bidding you agree to Sutana's Terms of Service
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Tender Closed Notice */}
                {!isOpen && tender.status !== 'open' && (
                  <div className="tdp-card tdp-card-sidebar" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                      {tender.status === 'awarded' ? '🏆' : tender.status === 'cancelled' ? '❌' : '🔒'}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--foreground))', margin: '0 0 0.375rem' }}>
                      {tender.status === 'awarded' ? 'Tender Awarded' : tender.status === 'cancelled' ? 'Tender Cancelled' : 'Bidding Closed'}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 1rem', lineHeight: 1.5 }}>
                      {tender.status === 'awarded'
                        ? 'This tender has been awarded to a winning bidder.'
                        : tender.status === 'cancelled'
                        ? 'This tender has been cancelled by the issuing party.'
                        : 'The bidding window for this tender has closed.'}
                    </p>
                    
                    {winner && tender.status === 'awarded' && (
                      <div style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(152 76% 25%)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Award size={14} /> Winner Announced
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>{winner.winner_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--primary))', marginTop: '0.25rem', fontWeight: 700 }}>
                          Winning Bid: {parseFloat(winner.bid_price_per_unit).toLocaleString()} ETB/unit
                        </div>
                      </div>
                    )}

                    <button onClick={() => navigate('/tenders/buy')} className="tdp-btn-primary">
                      Browse Open Tenders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="tdp-modal-overlay" onClick={() => setSelectedImage(null)}>
          <button className="tdp-modal-close" onClick={() => setSelectedImage(null)}>
            <X size={28} />
          </button>
          <img 
            src={selectedImage} 
            alt="Fullscreen Attachment" 
            className="tdp-modal-img"
            onClick={e => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
