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
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(6px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFFFFF', borderRadius: 24, padding: '48px 36px',
        maxWidth: 480, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        animation: 'fadeUp 0.4s both'
      }}>
        {/* Icons row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <PartyPopper size={34} color="#fbbf24" />
          <Trophy size={40} color="#f59e0b" />
          <PartyPopper size={34} color="#fbbf24" style={{ transform: 'scaleX(-1)' }} />
        </div>

        <h2 style={{
          fontSize: 32, fontWeight: 900, margin: '0 0 10px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #2E8B57)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Bid Submitted!</h2>

        <p style={{ fontSize: 17, fontWeight: 700, color: '#424242', margin: '0 0 12px' }}>
          Congratulations! 🎉
        </p>
        <p style={{ fontSize: 14, color: '#424242', lineHeight: 1.7, margin: '0 0 28px' }}>
          Your bid has been successfully received by <strong style={{ color: '#424242' }}>SUTANA</strong>.<br/>
          Our Sales team will review all bids after the deadline and contact the winner.
        </p>

        {/* Floating icons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
          {[<PartyPopper size={26} color="#ec4899" />, <Sparkles size={26} color="#f59e0b" />,
            <Star size={26} color="#fbbf24" />, <Sparkle size={26} color="#3b82f6" />,
            <Gift size={26} color="#2E8B57" />].map((icon, i) => (
            <span key={i} style={{ animation: `fadeUp 0.5s ${i * 0.1}s both`, display: 'inline-flex' }}>{icon}</span>
          ))}
        </div>

        <button onClick={onClose} style={{
          padding: '13px 44px',
          background: 'linear-gradient(135deg, #2E8B57, #2E8B57)',
          color: 'white', border: 'none', borderRadius: 50,
          fontWeight: 700, fontSize: 16, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'inherit', transition: 'transform 0.15s'
        }}>
          <Rocket size={18} /> Awesome, Close!
        </button>
      </div>
    </div>
  );
};

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.6} }
@keyframes countdown { 0%{background-position:0 0} 100%{background-position:200% 0} }

.td-root {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

.td-back-btn {
  background: white;
  border: 1px solid #8D6E63;
  color: #424242;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  font-family: inherit;
  transition: all 0.15s ease;
}
.td-back-btn:hover {
  background: #F5F5F5;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.td-layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

@media(max-width: 900px) {
  .td-layout {
    grid-template-columns: 1fr;
  }
}

.td-main-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #8D6E63;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  animation: fadeUp 0.4s both;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.td-main-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.td-cover-img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
}

.td-content {
  padding: 28px 32px;
}

.td-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.td-ref {
  font-size: 12px;
  font-weight: 700;
  color: #424242;
  font-family: monospace;
  background: #F5F5F5;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #8D6E63;
}

.td-status {
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.td-status.open {
  background: #4CAF50;
  color: #FFFFFF;
}
.td-status.closed { background: #FF9800; color: #FFFFFF; }
.td-status.awarded { background: #8BC34A; color: #424242; }
.td-status.cancelled { background: #F44336; color: #FFFFFF; }

.td-live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #FFFFFF;
  animation: pulse-dot 1.5s infinite;
  flex-shrink: 0;
}

.td-title {
  font-size: 26px;
  font-weight: 800;
  color: #1B5E20;
  line-height: 1.25;
  margin: 0 0 20px;
}

.td-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.td-stat-box {
  background: #F5F5F5;
  border: 1px solid #8D6E63;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
}
.td-stat-label { font-size: 11px; color: #424242; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.td-stat-value { font-size: 18px; font-weight: 800; color: #1B5E20; }
.td-stat-value.green { color: #2E8B57; }

.td-section { margin-bottom: 28px; }
.td-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1B5E20;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #8D6E63;
}
.td-section-body {
  font-size: 14px;
  color: #424242;
  line-height: 1.75;
  white-space: pre-wrap;
}

.td-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.td-img-thumb {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #8D6E63;
  transition: transform 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}
.td-img-thumb:hover { transform: scale(1.03); border-color: #2E8B57; }

.td-cancel-box {
  background: #FF9800;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* ─── Sidebar ─── */
.td-sidebar { display: flex; flex-direction: column; gap: 16px; animation: fadeUp 0.4s 0.1s both; }

.td-bid-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #8D6E63;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}
.td-bid-header {
  background: #1B5E20;
  padding: 20px 24px;
  color: #FFFFFF;
}
.td-bid-body { padding: 24px; }

.td-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #8D6E63;
  border-radius: 6px;
  font-size: 14px;
  color: #424242;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}
.td-input:focus {
  border-color: #2E8B57;
  box-shadow: 0 0 0 3px rgba(46,139,87,0.15);
}

.td-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #424242;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.td-submit-btn {
  width: 100%;
  padding: 13px;
  background: #2E8B57;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.td-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(46,139,87,0.4);
  background: #228B22;
}
.td-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.td-signin-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #8D6E63;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  text-align: center;
}
.td-signin-header {
  background: #1B5E20;
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
}
.td-signin-body { padding: 24px; }

.td-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-decoration: none;
  box-sizing: border-box;
}
.td-signin-btn.primary {
  background: #2E8B57;
  color: #FFFFFF;
  border: none;
  margin-bottom: 10px;
}
.td-signin-btn.primary:hover { 
  transform: translateY(-1px); 
  box-shadow: 0 2px 8px rgba(46,139,87,0.4); 
  background: #228B22;
}
.td-signin-btn.outline {
  background: transparent;
  color: #424242;
  border: 1px solid #8D6E63;
}
.td-signin-btn.outline:hover { background: #F5F5F5; border-color: #2E8B57; color: #2E8B57; }

.td-multi-login {
  display: block;
  margin-top: 14px;
  padding: 14px 18px;
  background: #F5F5F5;
  border: 1px solid #8D6E63;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #424242;
  text-decoration: none;
  transition: all 0.15s ease;
}
.td-multi-login:hover {
  border-color: #2E8B57;
  color: #2E8B57;
  background: #FFFFFF;
}
.td-meta-card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #8D6E63;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.td-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #8D6E63;
  font-size: 13px;
}
.td-meta-row:last-child { border-bottom: none; }
.td-meta-key { color: #424242; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.td-meta-val { color: #1B5E20; font-weight: 600; text-align: right; }

.td-countdown-box {
  background: #F5F5F5;
  border: 1px solid #8D6E63;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-box {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
}
.message-box.success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.message-box.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.td-existing-bid {
  background: linear-gradient(135deg, #F5F5F5, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .td-layout {
    grid-template-columns: 1fr;
  }
  .td-cover-img { height: 220px; }
}
`;

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
        // Update existing bid via PUT
        res = await axios.put(`/tenders/${tender.id}/bid`, form);
      } else {
        // New bid via POST
        res = await axios.post(`/tenders/${tender.id}/bid`, form);
      }
      if (res.status === 'success') {
        setMessage({ type: 'success', text: res.message || (myBid ? '✅ Bid updated successfully!' : '🎉 Bid submitted successfully!') });
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
          setMessage({ type: 'error', text: `❌ Item #${i + 1} ("${item.objectType || 'Item'}") bid of ${totalBid.toLocaleString()} ETB is below the minimum start price of ${start.toLocaleString()} ETB.` });
          setSubmitting(false);
          return;
        }
      } else if (start > 0) {
        setMessage({ type: 'error', text: `❌ Please enter a bid price for Item #${i + 1} ("${item.objectType || 'Item'}"). Minimum is ${start.toLocaleString()} ETB.` });
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
        setMessage({ type: 'success', text: res.message || (myBid ? '✅ Bid updated successfully!' : '🎉 Your bid has been submitted successfully!') });
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
    <div className="td-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* 🎉 Celebration Modal */}
      {showCelebration && <CelebrationModal onClose={() => setShowCelebration(false)} />}

      {loading ? (
        <div style={{ maxWidth: 1280, margin: '40px auto', padding: '0 24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 180, background: 'linear-gradient(90deg, #8D6E63 25%, #F5F5F5 50%, #8D6E63 75%)', backgroundSize: '400px', animation: 'shimmer 1.5s infinite', borderRadius: 12, marginBottom: 16 }} />
          ))}
        </div>
      ) : !tender ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#8D6E63' }}>
          <p style={{ fontSize: 18 }}>Tender not found.</p>
          <button onClick={() => navigate('/tenders')} style={{ marginTop: 16, padding: '10px 24px', background: '#2E8B57', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Back to Tenders</button>
        </div>
      ) : (
        <>
          {/* ─── Main Layout ─── */}
          <div className="td-layout" style={isMultiTender ? { gridTemplateColumns: '1fr', maxWidth: '100%', padding: '32px 40px 80px' } : {}}>
            {/* Left Column */}
            <div>
              <button onClick={() => navigate('/tenders')} className="td-back-btn">
                <ArrowLeft size={15} /> All Tenders
              </button>
              
              <div className="td-main-card">
                {coverImg && (
                  <img
                    className="td-cover-img"
                    src={`${API_ORIGIN}/uploads/tenders/${coverImg}`}
                    alt={tender.title}
                    onError={() => setCoverImgIdx(i => i + 1)}
                  />
                )}

                <div className="td-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#424242', fontFamily: 'monospace', background: '#F5F5F5', border: '1px solid #e0e0e0', padding: '3px 10px', borderRadius: 6 }}>
                      {tender.reference_number}
                    </span>
                    <span className={`td-status ${tender.status}`}>
                      {tender.status === 'open' && <span className="td-live-dot" />}
                      {tender.status.replace('_', ' ')}
                    </span>
                    {tender.category && (
                      <span style={{ fontSize: 12, color: '#424242', background: '#F5F5F5', border: '1px solid #e0e0e0', padding: '3px 10px', borderRadius: 6 }}>
                        {tender.category}
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: 'clamp(20px,3.5vw,32px)', fontWeight: 900, color: '#1B5E20', margin: '0 0 24px', lineHeight: 1.2 }}>
                    {tender.title}
                  </h1>

                  {/* Stats */}
                <div className="td-stats-grid">
                  {(() => {
                    let parsedItems = [];
                    try { parsedItems = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                    if (parsedItems.length > 0) {
                      return (
                        <div className="td-stat-box" style={{ gridColumn: '1 / -1' }}>
                          <div className="td-stat-label">Tender Type</div>
                          <div className="td-stat-value" style={{ fontSize: 14, color: '#424242' }}>
                            📦 Multi-Item Tender &mdash; {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} (see table below)
                          </div>
                        </div>
                      );
                    }
                    return (
                      <>
                        {tender.item_name && (
                          <div className="td-stat-box">
                            <div className="td-stat-label">Item</div>
                            <div className="td-stat-value" style={{ fontSize: 14 }}>{tender.item_name}</div>
                          </div>
                        )}
                        <div className="td-stat-box">
                          <div className="td-stat-label">Quantity</div>
                          <div className="td-stat-value">{tender.quantity}</div>
                        </div>
                        <div className="td-stat-box">
                          <div className="td-stat-label">Starting Price</div>
                          <div className="td-stat-value green">{parseFloat(tender.starting_bid_price || 0).toLocaleString()}</div>
                        </div>
                      </>
                    );
                  })()}
                  <div className="td-stat-box">
                    <div className="td-stat-label">Deadline</div>
                    <div className="td-stat-value" style={{ fontSize: 13 }}>
                      {tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-CA') : '—'}
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                {isOpen && (
                  <div className="td-countdown-box" style={{ marginBottom: 24 }}>
                    <Flame size={20} color="#92400e" />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 2 }}>Time Remaining</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#78350f' }}><Countdown deadline={tender.deadline} /></div>
                    </div>
                  </div>
                )}


                {/* Description */}
                <div className="td-section">
                  <h3 className="td-section-title"><FileText size={16} color="#2E8B57" /> Description</h3>
                  <p className="td-section-body">{tender.description}</p>
                </div>

                {/* Items Table (for multiple-product tenders) */}
                {(() => {
                  let items = [];
                  try { items = typeof tender.items === 'string' ? JSON.parse(tender.items) : (tender.items || []); } catch(_){}
                  if (!items.length) return null;
                  return (
                    <div className="td-section">
                      <h3 className="td-section-title"><Package size={16} color="#2E8B57" /> Tender Items — Fill Your Bid Price ({items.length} items)</h3>
                      {isOpen && user && (
                        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#424242', background: '#F5F5F5', padding: '10px 14px', borderRadius: 8, border: '1px solid #8D6E63' }}>
                          📝 Enter your bid price for each item below, then click <strong>Submit Multi-Item Bid</strong>.
                        </p>
                      )}
                      <form onSubmit={e => handleMultiItemBidSubmit(e, items)}>
                        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #8D6E63' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(135deg,#424242,#1B5E20)' }}>
                                {['No', 'Item / Object Type', 'Unit', 'Qty', 'Start Price (ETB)', 'Your Bid / Unit (Birr)', 'Your Bid / Unit (Cent)', 'Total'].map((h, i) => (
                                  <th key={i} style={{ padding: '12px 14px', color: i >= 4 ? '#8D6E63' : 'white', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i >= 3 ? 'right' : 'left', fontStyle: i >= 5 ? 'italic' : 'normal' }}>
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
                                return (
                                  <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5', background: idx % 2 === 0 ? '#fff' : '#F5F5F5' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#8D6E63' }}>{idx + 1}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#424242' }}>{item.objectType || item.object_type || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: '#424242' }}>{item.unit || '—'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#2E8B57' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#424242' }}>
                                      {item.startPrice ? parseFloat(item.startPrice).toLocaleString() + ' ETB' : '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                      {isOpen && user ? (
                                        <input
                                          type="number" step="0.01"
                                          min={item.startPrice ? parseFloat(item.startPrice) : 0}
                                          required
                                          value={itemBids[`birr_${idx}`] || ''}
                                          onChange={e => setItemBids(prev => ({ ...prev, [`birr_${idx}`]: e.target.value }))}
                                          placeholder={item.startPrice ? `Min: ${parseFloat(item.startPrice).toLocaleString()}` : '0'}
                                          style={{ width: '110px', padding: '7px 10px', border: `2px solid ${itemBids[`birr_${idx}`] && parseFloat(itemBids[`birr_${idx}`]) < parseFloat(item.startPrice || 0) ? '#ef4444' : '#2E8B57'}`, borderRadius: 6, fontSize: 13, textAlign: 'right', background: '#F5F5F5', outline: 'none' }}
                                        />
                                      ) : <span style={{ color: '#8D6E63' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                      {isOpen && user ? (
                                        <input
                                          type="number" min="0" max="99" step="1"
                                          value={itemBids[`cent_${idx}`] || ''}
                                          onChange={e => setItemBids(prev => ({ ...prev, [`cent_${idx}`]: e.target.value }))}
                                          placeholder="0"
                                          style={{ width: '70px', padding: '7px 10px', border: '2px solid #2E8B57', borderRadius: 6, fontSize: 13, textAlign: 'right', background: '#FFFFFF', outline: 'none' }}
                                        />
                                      ) : <span style={{ color: '#8D6E63' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: totalBirr > 0 ? '#2E8B57' : '#8D6E63' }}>
                                      {totalBirr > 0 ? totalBirr.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ETB' : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* VAT Summary (central CEO tax treatment per item) */}
                        <div style={{ marginTop: 16, padding: '14px 18px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                          {items.map((item, idx) => {
                            const birr = parseFloat(itemBids[`birr_${idx}`] || 0);
                            const cent = parseFloat(itemBids[`cent_${idx}`] || 0);
                            const qty = parseFloat(item.quantity || 1);
                            const unitBid = (birr || parseFloat(item.startPrice || 0)) + cent / 100;
                            const v = getVatForItem(vatCtx, 'tender_sell', item.id != null ? item.id : idx, unitBid * qty);
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                                <span style={{ color: '#424242' }}>{item.objectType || item.object_type || `Item ${idx + 1}`} — VAT ({fmtPct(v.rate)})</span>
                                <span style={{ fontWeight: 700, color: '#1B5E20' }}>{v.vat.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
                              </div>
                            );
                          })}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, borderTop: '1px solid #D1D5DB', marginTop: 8, paddingTop: 8, color: '#424242' }}>
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
                          <>
                            <div style={{ marginTop: '24px' }}>
                              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#424242' }}>Competitor Details</h4>
                              
                              <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1B5E20', marginBottom: '8px' }}>
                                  Competitor Name (Fill Part) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input required type="text"
                                  placeholder="Enter company / person name"
                                  style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                                  value={form.bidder_full_name}
                                  onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1B5E20', marginBottom: '8px' }}>Email Address</label>
                                  <input type="email" placeholder="example@email.com"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                                    value={form.bidder_email} onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1B5E20', marginBottom: '8px' }}>Phone Number</label>
                                  <input type="tel" placeholder="0900000000"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                                    value={form.bidder_phone} onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))} />
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1B5E20', marginBottom: '8px' }}>
                                  Digital Signature <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input required type="text"
                                  placeholder="Type your signature..."
                                  style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '18px', fontFamily: '"Caveat", "Dancing Script", cursive' }}
                                  value={form.digital_signature}
                                  onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Proposed Pickup Date</label>
                                <input type="date" value={itemBids.proposed_pickup_date || ''} onChange={e => setItemBids(p => ({ ...p, proposed_pickup_date: e.target.value }))}
                                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes / Cover Letter</label>
                                <input value={itemBids.notes || ''} onChange={e => setItemBids(p => ({ ...p, notes: e.target.value }))}
                                  placeholder="Describe your offer..."
                                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                              </div>
                            </div>
                            {message && (
                              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: message.type === 'success' ? '#F5F5F5' : '#fef2f2', border: `1px solid ${message.type === 'success' ? '#8D6E63' : '#fecaca'}`, color: message.type === 'success' ? '#166534' : '#991b1b', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {message.text}
                              </div>
                            )}
                            <button type="submit" disabled={submitting} style={{ marginTop: 16, width: '100%', background: 'linear-gradient(135deg,#2E8B57,#1B5E20)', color: 'white', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 700, fontSize: 15, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}>
                              {submitting ? '⏳ Submitting...' : <><Award size={18} /> Submit Multi-Item Bid</>}
                            </button>
                          </>
                        )}
                        {!user && isOpen && (
                          <Link to={`/login?redirect=/tenders/${tender.id}`} className="td-multi-login">
                            <Lock size={16} style={{ marginBottom: 4 }} /> <strong style={{ color: 'inherit' }}>Sign in</strong> to submit your bid on these items.
                          </Link>
                        )}
                      </form>
                    </div>
                  );
                })()}

                {/* Terms */}
                <div className="td-section">
                  <h3 className="td-section-title"><CheckCircle size={16} color="#2E8B57" /> Terms &amp; Conditions</h3>
                  <p className="td-section-body">{tender.terms_conditions}</p>
                </div>

                {/* Images Gallery */}
                {images.length > 0 && (
                  <div className="td-section">
                    <h3 className="td-section-title"><Star size={16} color="#2E8B57" /> Attachments ({images.length} image{images.length !== 1 ? 's' : ''})</h3>
                    <div className="td-images-grid">
                      {images.map((f, i) => (
                        <div key={i} onClick={() => setSelectedImage(`${API_ORIGIN}/uploads/tenders/${f}`)} style={{ cursor: 'pointer' }}>
                          <img className="td-img-thumb" src={`${API_ORIGIN}/uploads/tenders/${f}`} alt={`Attachment ${i + 1}`} />
                        </div>
                      ))}
                    </div>
                    {docs.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {docs.map((f, i) => (
                          <a key={i} href={`${API_ORIGIN}/uploads/tenders/${f}`} target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                            background: '#F5F5F5', border: '1px solid #8D6E63', borderRadius: 8,
                            fontSize: 12, color: '#424242', textDecoration: 'none', fontWeight: 600,
                            transition: 'all 0.2s',
                          }}>
                            <FileText size={14} color="#2E8B57" /> {f} <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation */}
                {tender.cancellation_reason && (
                  <div className="td-cancel-box">
                    <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ fontSize: 13, color: '#991b1b' }}>Cancellation Reason</strong>
                      <p style={{ fontSize: 13, color: '#991b1b', margin: '4px 0 0', lineHeight: 1.6 }}>{tender.cancellation_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
            <div className="td-sidebar">
              {!isMultiTender && (<>
              {/* Meta Info */}
              <div className="td-meta-card">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#424242', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={16} color="#2E8B57" /> Tender Details
                </h3>
                {[
                  { key: <><Calendar size={13} /> Published</>, val: new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                  { key: <><Clock size={13} /> Deadline</>, val: tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
                  { key: <><Tag size={13} /> Category</>, val: tender.category || '—' },
                  { key: <><Building2 size={13} /> Status</>, val: <span className={`td-status ${tender.status}`} style={{ fontSize: 11, padding: '2px 10px' }}>{tender.status.replace('_', ' ')}</span> },
                  { key: <><TrendingUp size={13} /> Min. Price</>, val: <span style={{ color: '#2E8B57', fontWeight: 800 }}>{parseFloat(tender.starting_bid_price).toLocaleString()} ETB</span> },
                ].map(({ key, val }, i) => (
                  <div className="td-meta-row" key={i}>
                    <span className="td-meta-key">{key}</span>
                    <span className="td-meta-val">{val}</span>
                  </div>
                ))}
              </div>

              {/* Bid Section — Logged In User */}
              {isOpen && user && (
                <div className="td-bid-card">
                  <div className="td-bid-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Award size={18} color="#2E8B57" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {myBid ? 'Your Bid' : 'Place a Bid'}
                      </span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>
                      {myBid ? 'Update Your Application' : 'Submit Your Offer'}
                    </p>
                  </div>

                  <div className="td-bid-body">
                    {myBid && (
                      <div className="td-existing-bid">
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={14} /> Your current bid
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#2E8B57' }}>{parseFloat(myBid.bid_price_per_unit).toLocaleString()} ETB/unit</div>
                        <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Total: {parseFloat(myBid.total_bid_value || myBid.bid_price_per_unit * (tender.quantity || 1)).toLocaleString()} ETB</div>
                      </div>
                    )}

                    {message && (
                      <div className={`message-box ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {message.text}
                      </div>
                    )}

                    <form onSubmit={handleBidSubmit}>
                      {/* Contact Info */}
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Full Name *</label>
                        <input className="td-input" required type="text"
                          value={form.bidder_full_name}
                          onChange={e => setForm(f => ({ ...f, bidder_full_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div>
                          <label className="td-label">Email *</label>
                          <input className="td-input" required type="email"
                            value={form.bidder_email}
                            onChange={e => setForm(f => ({ ...f, bidder_email: e.target.value }))}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div>
                          <label className="td-label">Phone *</label>
                          <input className="td-input" required type="tel"
                            value={form.bidder_phone}
                            onChange={e => setForm(f => ({ ...f, bidder_phone: e.target.value }))}
                            placeholder="+251..."
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Bid Price (ETB/unit) *</label>
                        <input className="td-input" required type="number" step="0.01" min={tender.starting_bid_price}
                          value={form.bid_price_per_unit}
                          onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))}
                          placeholder={`Min: ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB`}
                        />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Proposed Pickup Date</label>
                        <input className="td-input" type="date" value={form.proposed_pickup_date}
                          onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))}
                        />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label className="td-label">Notes / Cover Letter</label>
                        <textarea className="td-input" value={form.notes} rows={3}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Describe your offer, qualifications, delivery terms..."
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label className="td-label">Digital Signature *</label>
                        <input className="td-input" required type="text"
                          value={form.digital_signature}
                          onChange={e => setForm(f => ({ ...f, digital_signature: e.target.value }))}
                          placeholder="Type your full name as signature"
                        />
                        <div style={{ marginTop: 6, padding: '10px 16px', background: '#F5F5F5', border: '1px dashed #cbd5e1', borderRadius: 8, fontFamily: '"Caveat", "Dancing Script", cursive', fontSize: 22, color: '#424242' }}>
                          {form.digital_signature || <span style={{ color: '#cbd5e1', fontFamily: 'sans-serif', fontSize: 13 }}>Signature preview will appear here</span>}
                        </div>
                      </div>
                      <button type="submit" className="td-submit-btn" disabled={submitting}>
                        {submitting ? '⏳ Submitting...' : myBid ? <><CheckCircle size={16} /> Update My Bid</> : <><Award size={16} /> Submit Bid</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Sign-in CTA — Not Logged In */}
              {!user && isOpen && (
                <div className="td-signin-card">
                  <div className="td-signin-header">
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'rgba(5,150,105,0.25)', border: '2px solid rgba(16,185,129,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}>
                        <Lock size={28} color="#2E8B57" />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>
                        Ready to Bid?
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                        Sign in to your account to submit a bid on this tender and compete for this contract.
                      </p>
                    </div>
                  </div>
                  <div className="td-signin-body">
                    <div style={{ background: '#F5F5F5', borderRadius: 8, padding: '14px 16px', marginBottom: 18, border: '1px solid #8D6E63' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#424242', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>This tender offers</div>
                      {[
                        { icon: <TrendingUp size={13} color="#2E8B57" />, text: `Starting at ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB/unit` },
                        { icon: <Package size={13} color="#2E8B57" />, text: `${tender.quantity} units available` },
                        { icon: <Clock size={13} color="#2E8B57" />, text: <><Countdown deadline={tender.deadline} /> remaining</> },
                      ].map(({ icon, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#424242', fontWeight: 500, marginBottom: 6 }}>
                          {icon} {text}
                        </div>
                      ))}
                    </div>
                    <Link to={`/login?redirect=/tenders/${tender.id}`} className="td-signin-btn primary" style={{ display: 'flex', textDecoration: 'none' }}>
                      <User size={16} /> Sign In to Bid <ChevronRight size={14} />
                    </Link>
                    <Link to="/auth/register" className="td-signin-btn outline" style={{ display: 'flex', textDecoration: 'none', justifyContent: 'center' }}>
                      Create Free Account
                    </Link>
                    <p style={{ fontSize: 11, color: '#8D6E63', margin: '12px 0 0', textAlign: 'center' }}>
                      By bidding you agree to Sutana's Terms of Service
                    </p>
                  </div>
                </div>
              )}

              </>)}

              {/* Tender Closed Notice */}
              {!isOpen && tender.status !== 'open' && (
                <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #8D6E63', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    {tender.status === 'awarded' ? '🏆' : tender.status === 'cancelled' ? '❌' : '🔒'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#424242', margin: '0 0 6px' }}>
                    {tender.status === 'awarded' ? 'Tender Awarded' : tender.status === 'cancelled' ? 'Tender Cancelled' : 'Bidding Closed'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#424242', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {tender.status === 'awarded'
                      ? 'This tender has been awarded to a winning bidder.'
                      : tender.status === 'cancelled'
                      ? 'This tender has been cancelled by the issuing party.'
                      : 'The bidding window for this tender has closed.'}
                  </p>
                  
                  {winner && tender.status === 'awarded' && (
                    <div style={{ background: '#F5F5F5', border: '1px solid #8D6E63', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={14} /> Winner Announced
                      </div>
                      <div style={{ fontSize: 14, color: '#424242', fontWeight: 600 }}>{winner.winner_name}</div>
                      <div style={{ fontSize: 13, color: '#2E8B57', marginTop: 4 }}>Winning Bid: {parseFloat(winner.bid_price_per_unit).toLocaleString()} ETB/unit</div>
                    </div>
                  )}

                  <button onClick={() => navigate('/tenders')} style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg,#2E8B57,#2E8B57)',
                    color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, fontFamily: 'inherit', width: '100%'
                  }}>
                    Browse Open Tenders
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            style={{
              position: 'absolute', top: 24, right: 24, background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', color: 'white', padding: 8, borderRadius: '50%', cursor: 'pointer', 
              display: 'flex', transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onClick={() => setSelectedImage(null)}
          >
            <X size={28} />
          </button>
          <img 
            src={selectedImage} 
            alt="Fullscreen Attachment" 
            style={{
              maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)', borderRadius: 12
            }} 
            onClick={e => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
