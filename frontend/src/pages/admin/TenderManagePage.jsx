import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import {
  Plus, Edit3, Send, Check, X, Clock, Award, Search, FileText,
  Trash2, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon,
  AlertCircle, CheckCircle2, Info, XCircle, Eye, Filter, Calendar, PlusCircle
} from 'lucide-react';

/* ─── Enterprise Blue Palette ─── */
const C = {
  forestGreen:  '#2563EB',
  darkGreen:    '#1D4ED8',
  emerald:      '#2563EB',
  leafGreen:    '#16A34A',
  sage:         '#DBEAFE',
  olive:        '#6B7280',
  mint:         '#EFF6FF',
  limeGreen:    '#8BC34A',
  earthBrown:   '#E5E7EB',
  skyBlue:      '#0284C7',
  white:        '#FFFFFF',
  lightGray:    '#F5F6FA',
  darkGray:     '#111827',
  orange:       '#D97706',
  red:          '#DC2626',
};

/* ─── Status config ─── */
const STATUS_CFG = {
  draft:            { background: '#F3F4F6', color: '#4B5563', borderColor: '#9CA3AF', label: 'Draft' },
  open:             { background: '#DCFCE7', color: '#16A34A', borderColor: '#16A34A', label: 'Open' },
  closed:           { background: '#FEF3C7', color: '#B45309', borderColor: '#D97706', label: 'Closed' },
  awarded:          { background: '#DCFCE7', color: '#166534', borderColor: '#16A34A', label: 'Winner Selected' },
  cancelled:        { background: '#FEE2E2', color: '#DC2626', borderColor: '#DC2626', label: 'Cancelled' },
  pending_approval: { background: '#E0F2FE', color: '#0284C7', borderColor: '#0284C7', label: 'Pending Approval' },
};

const BID_STATUS_CFG = {
  pending:        { background: '#E0F2FE', color: '#0284C7', borderColor: '#0284C7' },
  awarded:        { background: '#DCFCE7', color: '#166534', borderColor: '#16A34A' },
  not_selected:   { background: '#FEF3C7', color: '#B45309', borderColor: '#D97706' },
  disqualified:   { background: '#FEE2E2', color: '#DC2626', borderColor: '#DC2626' },
};

/* ─── Global styles ─── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, 'Segoe UI', system-ui, -apple-system, sans-serif; background: ${C.lightGray}; color: ${C.darkGray}; }

  input, textarea, select { border-radius: 8px !important; }

  .tm-page { width: 100%; min-height: 100vh; background: ${C.lightGray}; }

  /* Header */
  .tm-header {
    background: ${C.darkGreen};
    color: ${C.white};
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .tm-header h1 { font-size: 22px; font-weight: 600; letter-spacing: .01em; display: flex; align-items: center; gap: 10px; color: #FFFFFF !important; }

  /* Toolbar tabs */
  .tm-toolbar {
    background: ${C.white};
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid ${C.earthBrown};
  }
  .tm-tab {
    padding: 0 18px; height: 36px;
    background: transparent;
    color: ${C.darkGray};
    border: 1px solid ${C.earthBrown};
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    border-radius: 8px;
    transition: all .15s ease;
    display: inline-flex; align-items: center;
    white-space: nowrap;
  }
  .tm-tab.active { background: ${C.forestGreen}; color: ${C.white}; border-color: ${C.forestGreen}; }
  .tm-tab:hover:not(.active) { background: ${C.mint}; border-color: ${C.forestGreen}; color: ${C.darkGreen}; }
  .tm-tab-count { margin-left: auto; color: #6B7280; font-size: 12px; }

  /* Body / safe edge */
  .tm-body { max-width: 1536px; margin: 0 auto; padding: 24px; box-sizing: border-box; width: 100%; }

  /* Search */
  .tm-search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${C.white};
    border: 1px solid ${C.earthBrown};
    border-radius: 8px;
    padding: 0 14px;
    height: 40px;
    max-width: 420px;
    width: 100%;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .tm-search-bar:focus-within { border-color: ${C.forestGreen}; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .tm-search-bar input { border: none; outline: none; flex: 1; font-size: 14px; color: ${C.darkGray}; background: transparent; }
  .tm-search-clear { cursor: pointer; color: #9CA3AF; display: flex; transition: color .15s; }
  .tm-search-clear:hover { color: #111827; }

  /* Cards grid */
  .tm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 16px; }

  /* Tender Card */
  .tm-card {
    background: ${C.white};
    border: 1px solid ${C.earthBrown};
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
    cursor: pointer;
  }
  .tm-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }
  .tm-card.selected { border-color: ${C.forestGreen}; background: #EFF6FF; }

  .tm-card-img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    background: ${C.mint};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${C.sage};
    font-size: 13px;
    border-bottom: 1px solid ${C.earthBrown};
    position: relative;
  }
  .tm-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .tm-card-img .placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: ${C.forestGreen}; }

  .tm-card-body { padding: 14px 16px 10px; }
  .tm-card-ref { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
  .tm-card-title { font-size: 16px; font-weight: 600; color: ${C.darkGray}; margin-bottom: 6px; line-height: 1.3; }
  .tm-card-item { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
  .tm-card-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .tm-card-price { font-size: 16px; font-weight: 700; color: ${C.forestGreen}; font-variant-numeric: tabular-nums; }
  .tm-card-deadline { font-size: 11px; color: #6B7280; display: flex; align-items: center; gap: 4px; }

  .tm-card-footer {
    border-top: 1px solid ${C.earthBrown};
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F9FAFB;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tm-card-actions { display: flex; align-items: center; gap: 6px; }

  /* Buttons */
  .btn {
    position: relative; overflow: hidden;
    height: 36px; padding: 0 16px;
    border: none; cursor: pointer;
    font-size: 14px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: 8px;
    transition: background .15s ease, color .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
  }
  .btn-primary, .btn-emerald { background: ${C.forestGreen}; color: ${C.white}; }
  .btn-blue      { background: #1D4ED8; color: ${C.white}; }
  .btn-orange    { background: ${C.orange}; color: ${C.white}; }
  .btn-red       { background: ${C.red}; color: ${C.white}; }
  .btn-ghost     { background: ${C.white}; color: ${C.darkGray}; border: 1px solid ${C.earthBrown}; }
  .btn-sm { height: 32px; padding: 0 12px; font-size: 12px; }
  .btn-icon {
    position: relative; overflow: hidden;
    width: 32px; height: 32px; padding: 0;
    background: transparent; border: 1px solid ${C.earthBrown}; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 8px;
    transition: background .15s ease, color .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
  }
  .btn:disabled, .btn-icon:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Yellow hover + scatter-from-point on every button */
  .tm-page button { position: relative; overflow: hidden; }
  .tm-page button::after {
    content: ''; position: absolute; left: 50%; top: 50%;
    width: 160%; padding-top: 160%;
    transform: translate(-50%,-50%) scale(0);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,.12) 70%);
    opacity: 0;
    transition: transform .4s ease, opacity .2s ease;
    pointer-events: none;
  }
  .tm-page button:hover:not(:disabled)::after { transform: translate(-50%,-50%) scale(1); opacity: 1; }
  .tm-page button:hover:not(:disabled):not(.filter-pill):not(.tm-tab) {
    background: #F59E0B !important; color: #78350F !important;
    border-color: #F59E0B !important; transform: translateY(-1px);
  }

  /* Status badge */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    border-radius: 999px;
    white-space: nowrap;
    border: 1.5px solid transparent;
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    backdrop-filter: blur(2px);
  }

  /* Section panel */
  .tm-panel {
    background: ${C.white};
    border: 1px solid ${C.earthBrown};
    border-radius: 10px;
    margin-top: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    overflow: hidden;
  }
  .tm-panel-header {
    padding: 14px 20px;
    background: #F9FAFB;
    border-bottom: 1px solid ${C.earthBrown};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tm-panel-header h3 { font-size: 16px; font-weight: 600; color: ${C.darkGray}; display: flex; align-items: center; gap: 6px; }
  .tm-panel-body { padding: 16px 20px; overflow-x: auto; }

  /* Bids table */
  .bids-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 760px; }
  .bids-table th {
    padding: 12px 14px;
    text-align: left;
    background: #F9FAFB;
    color: #6B7280;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
    border-bottom: 1px solid ${C.earthBrown};
    white-space: nowrap;
  }
  .bids-table td { padding: 12px 14px; border-bottom: 1px solid ${C.earthBrown}; vertical-align: middle; line-height: 1.5; }
  .bids-table tr:hover td { background: #F9FAFB; }
  .bids-table tr.awarded td { background: #F0FDF4; }
  .bids-table tr.disqualified td { background: #FEF2F2; opacity: .75; }

  /* Bid image */
  .bid-img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    background: ${C.mint};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid ${C.earthBrown};
    border-radius: 8px;
  }

  /* Form */
  .tm-form { background: ${C.white}; border: 1px solid ${C.earthBrown}; box-shadow: 0 1px 3px rgba(0,0,0,.06); padding: 24px; border-radius: 10px; }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
  .form-grid .full { grid-column: 1 / -1; }
  .form-group label { display: block; font-size: 12px; font-weight: 500; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .03em; }
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    height: 36px;
    padding: 0 14px;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    background: ${C.white};
    font-size: 14px;
    color: ${C.darkGray};
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
    -webkit-appearance: none;
    appearance: none;
  }
  .form-group textarea { height: auto; padding: 10px 14px; resize: vertical; line-height: 1.5; }
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus { border-color: ${C.forestGreen}; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .form-group input:hover,
  .form-group textarea:hover,
  .form-group select:hover { border-color: ${C.forestGreen}; }

  /* Notification */
  .tm-notify {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
    width: 100%;
  }
  .tm-notify-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: ${C.white};
    border: 1px solid ${C.earthBrown};
    border-left: 4px solid;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    animation: slideIn .25s ease;
  }
  .tm-notify-item.success { border-left-color: #16A34A; }
  .tm-notify-item.error   { border-left-color: #DC2626; }
  .tm-notify-item.info    { border-left-color: #0284C7; }
  .tm-notify-item.warning { border-left-color: #D97706; }
  .tm-notify-text { flex: 1; font-size: 13px; font-weight: 500; color: ${C.darkGray}; line-height: 1.5; }
  .tm-notify-close { cursor: pointer; color: #9CA3AF; flex-shrink: 0; display: flex; transition: color .15s; }
  .tm-notify-close:hover { color: #111827; }

  @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

  /* Modal */
  .tm-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 24px 16px; overflow-y: auto;
  }
  .tm-modal {
    background: ${C.white}; border: 1px solid ${C.earthBrown}; border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,.15);
    width: 100%; max-width: 420px; padding: 24px;
  }
  .tm-modal h3 { font-size: 16px; font-weight: 600; color: ${C.darkGray}; margin-bottom: 16px; }
  .tm-modal textarea, .tm-modal input {
    width: 100%; height: 36px; padding: 0 14px; border: 1px solid #D1D5DB; border-radius: 8px;
    font-size: 14px; color: ${C.darkGray}; outline: none; box-sizing: border-box;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .tm-modal textarea { height: auto; padding: 10px 14px; resize: vertical; }
  .tm-modal textarea:focus, .tm-modal input:focus { border-color: ${C.forestGreen}; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }

  /* Filter pills */
  .filter-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .filter-pill {
    height: 32px; padding: 0 14px;
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    border: 1px solid ${C.earthBrown};
    background: ${C.white};
    color: ${C.darkGray};
    display: inline-flex; align-items: center;
    border-radius: 999px;
    transition: all .15s ease;
  }
  .filter-pill.active { background: ${C.forestGreen}; color: ${C.white}; border-color: ${C.forestGreen}; }
  .filter-pill:hover:not(.active) { background: #FEF3C7; border-color: #F59E0B; color: #78350F; }

  /* Attachments grid */
  .attach-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }

  /* Skeleton */
  .skeleton { background: linear-gradient(90deg, #EFF6FF 25%, #F9FAFB 50%, #EFF6FF 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: -200px 0 } 100% { background-position: calc(200px + 100%) 0 } }

  /* Responsive */
  @media (max-width: 1024px) {
    .tm-body { padding: 16px; }
  }
  @media (max-width: 768px) {
    .tm-header { padding: 12px 16px; }
    .tm-toolbar { padding: 8px 16px; overflow-x: auto; flex-wrap: nowrap; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
    .tm-tab { scroll-snap-align: start; flex-shrink: 0; }
    .tm-body { padding: 16px; }
    .tm-cards { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .form-grid { grid-template-columns: 1fr; }
    .attach-grid { grid-template-columns: repeat(2, 1fr); }
    .tm-notify { top: auto; bottom: 16px; right: 12px; left: 12px; max-width: 100%; }
  }
  @media (max-width: 480px) {
    .tm-body { padding: 12px; }
    .tm-header h1 { font-size: 18px; }
    .btn, .btn-sm, .btn-icon { height: 44px; }
    .btn-icon { width: 44px; }
    .btn-sm { padding: 0 16px; }
    .filter-bar { flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
    .filter-pill { flex-shrink: 0; scroll-snap-align: start; height: 40px; }
  }
`;

/* ─── In-app Notification ─── */
let _notifyId = 0;
function useNotify() {
  const [items, setItems] = useState([]);
  const notify = (type, text) => {
    const id = ++_notifyId;
    setItems(prev => [...prev, { id, type, text }]);
    setTimeout(() => setItems(prev => prev.filter(n => n.id !== id)), 4500);
  };
  const remove = (id) => setItems(prev => prev.filter(n => n.id !== id));
  return { items, notify, remove };
}

function NotifyIcon({ type }) {
  const s = { size: 18 };
  if (type === 'success') return <CheckCircle2 {...s} color="#16A34A" />;
  if (type === 'error')   return <XCircle {...s} color="#DC2626" />;
  if (type === 'warning') return <AlertCircle {...s} color="#D97706" />;
  return <Info {...s} color="#0284C7" />;
}

/* ─── Tender Card ─── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TenderCard({ tender, selected, onClick, onEdit, onDelete, onPublish, onClose, onCancel, onApprove, onToggleHidden, isCEOorAdmin }) {
  let st = { ...(STATUS_CFG[tender.status] || { background: '#eee', color: '#666', label: tender.status }) };
  if (tender.status === 'awarded') {
    st.label = 'Winner Selected';
  }

  /* Try to find most recent image attachment */
  let imgSrc = null;
  try {
    const atts = typeof tender.attachments === 'string' ? JSON.parse(tender.attachments) : tender.attachments;
    if (Array.isArray(atts) && atts.length > 0) {
      const images = atts.filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a));
      if (images.length > 0) {
        const imgAtt = images[images.length - 1];
        const baseUrl = API_BASE.replace('/api/v1', '');
        imgSrc = `${baseUrl}/uploads/tenders/${imgAtt.split('/').pop()}`;
      }
    }
  } catch (_) {}

  const isOpen = tender.status === 'open';
  const canClose = ['open', 'draft', 'pending_approval'].includes(tender.status);
  const canCancel = !['awarded', 'cancelled'].includes(tender.status);
  const isHidden = !!tender.is_hidden;

  const isMultiple = tender.items != null && tender.items !== '' && tender.items !== 'null';

  const getDisplayPrice = () => {
    if (tender.items && tender.items !== 'null' && tender.items !== '') {
      try {
        const parsed = typeof tender.items === 'string' ? JSON.parse(tender.items) : tender.items;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const total = parsed.reduce((sum, it) => sum + (parseFloat(it.startPrice || 0) * parseFloat(it.quantity || 1)), 0);
          if (total > 0) return `ETB ${total.toLocaleString()}`;
          return 'Multiple Items';
        }
      } catch (e) {}
    }
    return `ETB ${parseFloat(tender.starting_bid_price || 0).toLocaleString()}`;
  };

  return (
    <div className={`tm-card${selected ? ' selected' : ''}`} onClick={onClick}>
      {/* Image section */}
      {isMultiple ? (
        <div style={{ position: 'relative', height: 44, borderBottom: '1px solid #f1f5f9' }}>
          {/* Status badge */}
          <span className="status-badge" style={{
            ...st, position: 'absolute', top: 12, left: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            {st.label}
          </span>
          {/* Hidden badge */}
          {isHidden && (
            <span style={{
              position: 'absolute', top: 12, right: 16,
              background: '#424242', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              letterSpacing: 0.5,
            }}>HIDDEN</span>
          )}
        </div>
      ) : (
        <div className="tm-card-img">
          {imgSrc ? (
            <img src={imgSrc} alt={tender.title} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          ) : null}
          <div className="placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>
            <ImageIcon size={36} />
            <span style={{ fontSize: 11 }}>No Image</span>
          </div>
          {/* Status badge */}
          <span className="status-badge" style={{
            ...st, position: 'absolute', top: 8, left: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            {st.label}
          </span>
          {/* Hidden badge */}
          {isHidden && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: '#424242', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              letterSpacing: 0.5,
            }}>HIDDEN</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="tm-card-body">
        <div className="tm-card-ref">{tender.reference_number || `TND-${tender.id}`}</div>
        <div className="tm-card-title">{tender.title}</div>
        {tender.item_name && <div className="tm-card-item">📦 {tender.item_name}{tender.quantity ? ` × ${tender.quantity}` : ''}</div>}
        <div className="tm-card-meta">
          <div className="tm-card-price">{getDisplayPrice()}</div>
          {tender.deadline && (
            <div className="tm-card-deadline">
              <Calendar size={11} />
              {new Date(tender.deadline).toLocaleDateString('en-CA')}
            </div>
          )}
        </div>
        {parseFloat(tender.cpo_amount) > 0 && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#047857', marginTop: 4, background: '#d1fae5', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
            🔒 CPO: {parseFloat(tender.cpo_amount).toLocaleString()} ETB
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="tm-card-footer" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: '#888' }}>
          {tender.category || 'General'}
        </div>
        <div className="tm-card-actions">
          {/* Approve pending */}
          {tender.status === 'pending_approval' && isCEOorAdmin && (
            <button className="btn-icon" title="Approve" onClick={() => onApprove(tender.id)}
              style={{ border: '1px solid #16A34A', background: '#DCFCE7' }}>
              <Check size={14} color="#16A34A" />
            </button>
          )}
          {/* Force Close */}
          {canClose && (
            <button className="btn-icon" title="Force Close Bidding" onClick={() => onClose(tender.id)}
              style={{ border: '1px solid #D97706', background: '#FEF3C7' }}>
              <Clock size={14} color="#D97706" />
            </button>
          )}
          {/* Cancel */}
          {canCancel && (
            <button className="btn-icon" title="Cancel Tender" onClick={() => onCancel(tender)}
              style={{ border: '1px solid #DC2626', background: '#FEE2E2' }}>
              <X size={14} color="#DC2626" />
            </button>
          )}
          {/* Hide / Show toggle */}
          <button className="btn-icon" title={isHidden ? 'Show to Public' : 'Hide from Public'}
            onClick={() => onToggleHidden(tender)}
            style={{ border: `1px solid ${isHidden ? '#0284C7' : '#6B7280'}`, background: isHidden ? '#E0F2FE' : '#F3F4F6' }}>
            <Eye size={14} color={isHidden ? '#0284C7' : '#6B7280'} />
          </button>
          {/* Edit */}
          <button className="btn-icon" title="Edit Tender" onClick={() => onEdit(tender)}
            style={{ border: '1px solid #2563EB', background: '#EFF6FF' }}>
            <Edit3 size={14} color="#2563EB" />
          </button>
          {/* Delete */}
          <button className="btn-icon danger" title="Delete Tender" onClick={() => onDelete(tender)}
            style={{ border: '1px solid #DC2626', background: '#FEE2E2' }}>
            <Trash2 size={14} color="#DC2626" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TenderManagePage() {
  const [tab, setTab] = useState('list');
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTender, setSelectedTender] = useState(null);
  const [bids, setBids] = useState([]);
  const { items: notifs, notify, remove: removeNotif } = useNotify();

  const [form, setForm] = useState({
    title: '', description: '', category: '', item_name: '', quantity: '',
    starting_bid_price: '', cpo_amount: '', deadline: '', terms_conditions: '',
  });
  const [postType, setPostType] = useState('single');
  const [tenderItems, setTenderItems] = useState([
    { id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }
  ]);
  const [editId, setEditId] = useState(null);
  const [files, setFiles] = useState([null, null, null, null, null]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  /* Award & extend */

  const [extendDate, setExtendDate] = useState('');

  /* Modals */
  const [deleteModal, setDeleteModal] = useState(null);
  const [disqModal, setDisqModal] = useState(null);
  const [detailModalBid, setDetailModalBid] = useState(null);
  const [disqReason, setDisqReason] = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  /* Finance Modal */
  const [financeModalBid, setFinanceModalBid] = useState(null);
  const [financePaymentMethod, setFinancePaymentMethod] = useState('Bank');
  const [financePaymentReference, setFinancePaymentReference] = useState('');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isCEOorAdmin = user?.roles?.some?.(r => ['Admin','CEO'].includes(r)) || ['Admin','CEO'].includes(user?.role);

  /* ── Fetch ── */
  const fetchTenders = useCallback(async () => {
    try { setLoading(true); const r = await axios.get('/tenders'); if (r.status === 'success') setTenders(r.data || []); }
    catch (e) { notify('error', 'Failed to load tenders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const fetchBids = async (tid) => {
    try { const r = await axios.get(`/tenders/${tid}/bids`); if (r.status === 'success') setBids(r.data || []); }
    catch { setBids([]); }
  };

  const handleSelect = async (t) => {
    setSelectedTender(t); setExtendDate('');
    await fetchBids(t.id);
  };

  /* ── CRUD ── */
  const handleNew = () => {
    setEditId(null);
    setForm({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', cpo_amount: '', deadline: '', terms_conditions: '' });
    setFiles([null, null, null, null, null]); setExistingFiles([]); 
    setPostType('single');
    setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }]);
    setTab('form');
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description || '', category: t.category || '',
      item_name: t.item_name || '', quantity: t.quantity || '', starting_bid_price: t.starting_bid_price || '',
      cpo_amount: t.cpo_amount || '',
      deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0,16) : '',
      terms_conditions: t.terms_conditions || '',
    });
    setFiles([null, null, null, null, null]);
    try {
      const atts = typeof t.attachments === 'string' ? JSON.parse(t.attachments) : t.attachments;
      setExistingFiles(Array.isArray(atts) ? atts : []);
    } catch (_) { setExistingFiles([]); }
    
    // Parse items if available
    let parsedItems = [];
    try {
      parsedItems = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
    } catch (_) {}
    
    const isMultiple = t.items != null && t.items !== '' && t.items !== 'null';
    if (isMultiple) {
      setPostType('multiple');
      setTenderItems(parsedItems.length > 0 ? parsedItems.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })) : [{ id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }]);
    } else {
      setPostType('single');
      setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }]);
    }
    
    setTab('form');
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      
      if (postType === 'multiple') {
        fd.append('items', JSON.stringify(tenderItems));
      } else {
        const selectedFiles = files.filter(Boolean);
        if (selectedFiles.length > 0) {
          for (const f of selectedFiles) fd.append('attachments', f);
          // When editing and new files chosen, replace all old attachments
          if (editId) fd.append('replace_attachments', 'true');
        }
      }
      
      const url = editId ? `/tenders/${editId}` : '/tenders';
      const method = editId ? 'put' : 'post';
      const r = await axios[method](url, fd);
      if (r.status === 'success') {
        notify('success', editId ? 'Tender updated successfully' : 'Tender created successfully');
        setTab('list'); fetchTenders(); setSelectedTender(null);
      }
    } catch (err) { notify('error', err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handlePublish = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/publish`); if (r.status === 'success') { notify('success', 'Tender published & open for bids'); fetchTenders(); } }
    catch (err) { notify('error', err.message); }
  };

  const handleApprove = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/approve`); if (r.status === 'success') { notify('success', 'Tender approved'); fetchTenders(); } }
    catch (err) { notify('error', err.message); }
  };

  const handleClose = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/close`); if (r.status === 'success') { notify('success', 'Bidding closed'); fetchTenders(); if (selectedTender?.id === id) handleSelect({ ...selectedTender, status: 'closed' }); } }
    catch (err) { notify('error', err.message); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await axios.delete(`/tenders/${deleteModal.id}`);
      notify('success', `Tender "${deleteModal.title}" deleted`);
      setDeleteModal(null);
      if (selectedTender?.id === deleteModal.id) setSelectedTender(null);
      fetchTenders();
    } catch (err) { notify('error', err.message || 'Delete failed'); setDeleteModal(null); }
  };

  const handleExtend = async () => {
    if (!extendDate || !selectedTender) return;
    try {
      const r = await axios.put(`/tenders/${selectedTender.id}/extend`, { deadline: extendDate });
      if (r.status === 'success') {
        notify('success', 'Deadline extended');
        fetchTenders();
        if (['closed', 'cancelled'].includes(selectedTender.status) && new Date(extendDate).getTime() > Date.now()) {
          handleSelect({ ...selectedTender, status: 'open', deadline: extendDate, cancellation_reason: null });
        } else {
          handleSelect({ ...selectedTender, deadline: extendDate });
        }
        setExtendDate('');
      }
    }
    catch (err) { notify('error', err.message); }
  };

  const handleCancel = async () => {
    if (!cancelReason || !cancelModal) return;
    try {
      const r = await axios.put(`/tenders/${cancelModal.id}/cancel`, { reason: cancelReason });
      if (r.status === 'success') { notify('success', 'Tender cancelled'); fetchTenders(); setCancelModal(null); setCancelReason(''); setSelectedTender(null); }
    } catch (err) { notify('error', err.message); }
  };

  const handleToggleHidden = async (tender) => {
    try {
      const r = await axios.put(`/tenders/${tender.id}/toggle-hidden`);
      if (r.status === 'success') { notify('info', r.message); fetchTenders(); }
    } catch (err) { notify('error', err.message); }
  };

  const handleDisqualify = async () => {
    if (!disqReason || !disqModal) return;
    try {
      const r = await axios.put(`/tenders/bids/${disqModal}/disqualify`, { reason: disqReason });
      if (r.status === 'success') { notify('success', 'Bid disqualified'); setDisqModal(null); setDisqReason(''); await fetchBids(selectedTender.id); }
    } catch (err) { notify('error', err.message); }
  };

  const handleOpenBidDetail = async (bid) => {
    setDetailModalBid(bid);
    if (!bid.opened_at) {
      try {
        await axios.put(`/tenders/bids/${bid.id}/mark-opened`);
        await fetchBids(selectedTender.id);
      } catch (err) {}
    }
  };

  const handleMarkEmailSent = async (bidId) => {
    try {
      await axios.put(`/tenders/bids/${bidId}/mark-sent`);
      notify('success', 'Marked as Sent');
      await fetchBids(selectedTender.id);
    } catch (err) { notify('error', err.message); }
  };

  const handleSendAwardEmail = (bid) => {
    const subject = `Award Notification - ${selectedTender.title}`;
    const body = `Dear ${bid.bidder_full_name || bid.customer_name},\r\n\r\nWe are delighted to officially notify you that your company has been awarded the contract for the tender "${selectedTender.title}".\r\n\r\nAfter a thorough evaluation process, your bid was selected as the most competitive and suitable for our requirements. We appreciate the time and effort your team invested in preparing your proposal.\r\n\r\nPlease contact our procurement office at your earliest convenience to discuss the contract signing, delivery schedules, and the next steps for finalizing this agreement.\r\n\r\nWe look forward to a successful collaboration.\r\n\r\nBest regards,\r\nSutana Enterprise Management System`;
    const mailto = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(bid.bidder_email || bid.customer_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    handleMarkEmailSent(bid.id);
  };






  const handleForwardToCeo = async () => {
    if (!selectedTender) return;
    try {
      const r = await axios.post(`/tenders/${selectedTender.id}/bids/forward`, {});
      if (r.status === 'success') {
        notify('success', '📨 Bids forwarded to CEO for approval!');
        await fetchBids(selectedTender.id);
        await fetchTenders();
        setSelectedTender(prev => ({ ...prev, status: 'awaiting_ceo_approval' }));
      }
    } catch (err) { notify('error', err.message || 'Failed to forward'); }
  };

  const handleSubmitToFinance = (bid) => {
    setFinanceModalBid(bid);
    setFinancePaymentMethod('Bank');
    setFinancePaymentReference('');
  };

  const confirmFinanceSubmit = async () => {
    if (!selectedTender || !financeModalBid) return;
    try {
      const r = await axios.post(`/tenders/bids/${financeModalBid.id}/submit-finance`, {
        payment_method: financePaymentMethod,
        payment_reference: financePaymentReference
      });
      if (r.status === 'success') {
        notify('success', '✅ Submitted to Finance Live Income!');
        await fetchBids(selectedTender.id);
        setFinanceModalBid(null);
      }
    } catch (err) {
      notify('error', err.message || 'Failed to submit to finance');
    }
  };


  /* ── Filter & Search ── */
  const STATUS_FILTERS = ['all', 'open', 'closed', 'awarded', 'cancelled', 'pending_approval'];
  const filtered = tenders.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.reference_number?.toLowerCase().includes(q) || t.item_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* In-app notifications */}
      <div className="tm-notify">
        {notifs.map(n => (
          <div key={n.id} className={`tm-notify-item ${n.type}`}>
            <NotifyIcon type={n.type} />
            <span className="tm-notify-text">{n.text}</span>
            <span className="tm-notify-close" onClick={() => removeNotif(n.id)}><X size={14} /></span>
          </div>
        ))}
      </div>

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="tm-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Tender</h3>
            <p style={{ fontSize: 14, color: C.darkGray, marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>"{deleteModal.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-red" onClick={handleDelete}><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="tm-modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <h3>Cancel Tender</h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Cancellation Reason *</label>
              <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Provide a reason for cancellation..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setCancelModal(null); setCancelReason(''); }}>Back</button>
              <button className="btn btn-red" disabled={!cancelReason} onClick={handleCancel}><X size={14} /> Cancel Tender</button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualify modal */}
      {disqModal && (
        <div className="tm-modal-overlay" onClick={() => setDisqModal(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <h3>Disqualify Bid</h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Disqualification Reason *</label>
              <textarea rows={3} value={disqReason} onChange={e => setDisqReason(e.target.value)} placeholder="State reason for disqualification..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setDisqModal(null); setDisqReason(''); }}>Back</button>
              <button className="btn btn-red" disabled={!disqReason} onClick={handleDisqualify}><X size={14} /> Disqualify</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalBid && (
        <div className="tm-modal-overlay" onClick={() => setDetailModalBid(null)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, width: '100%', padding: 32, borderRadius: 16, background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #f0fdf4', paddingBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#064e3b', margin: 0 }}>📋 Bid Detail View</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Full bid information submitted by competitor</p>
              </div>
              <button onClick={() => setDetailModalBid(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#94a3b8" /></button>
            </div>

            {/* Bidder Info */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>👤 Competitor Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Full Name</span><br /><strong>{detailModalBid.bidder_full_name || detailModalBid.customer_name || '—'}</strong></div>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Phone</span><br /><strong>{detailModalBid.bidder_phone || 'N/A'}</strong></div>
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#94a3b8', fontSize: 11 }}>Email</span><br /><strong>{detailModalBid.bidder_email || detailModalBid.customer_email || '—'}</strong></div>
              </div>
            </div>

            {/* Bid Financials */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>💰 Bid Financials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Total Bid Value</span><br /><strong style={{ fontSize: 16, color: '#059669' }}>ETB {parseFloat(detailModalBid.total_bid_value || 0).toLocaleString()}</strong></div>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Price / Unit</span><br /><strong>{parseFloat(detailModalBid.bid_price_per_unit || 0).toLocaleString()} ETB</strong></div>
              </div>
            </div>

            {/* Payment Info */}
            <div style={{ background: detailModalBid.payment_status === 'confirmed' ? '#f0fdf4' : detailModalBid.payment_status === 'rejected' ? '#fef2f2' : '#fefce8', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${detailModalBid.payment_status === 'confirmed' ? '#86efac' : detailModalBid.payment_status === 'rejected' ? '#fca5a5' : '#fde68a'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>🏦 Payment Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>Payment Method</span><br />
                  {detailModalBid.payment_method ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: detailModalBid.payment_method.toLowerCase().startsWith('internal') ? '#dcfce7' : detailModalBid.payment_method.startsWith('Telebirr') ? '#fef3c7' : '#eff6ff', color: detailModalBid.payment_method.toLowerCase().startsWith('internal') ? '#166534' : detailModalBid.payment_method.startsWith('Telebirr') ? '#92400e' : '#1d4ed8' }}>
                      {detailModalBid.payment_method.toLowerCase().startsWith('internal') ? '🛎️' : detailModalBid.payment_method.startsWith('Telebirr') ? '📱' : '🏦'} {detailModalBid.payment_method.split('::')[0]}
                    </span>
                  ) : <span style={{ color: '#94a3b8' }}>Not specified</span>}
                  {detailModalBid.payment_method?.includes('::') && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Account/Ref: <strong>{detailModalBid.payment_method.split('::')[1]}</strong></div>
                  )}
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>Finance Status</span><br />
                  {detailModalBid.payment_status === 'confirmed' ? (
                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'#dcfce7',color:'#166534',border:'1px solid #86efac',marginTop:2 }}>✓ CONFIRMED</span>
                  ) : detailModalBid.payment_status === 'rejected' ? (
                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5',marginTop:2 }}>✕ REJECTED</span>
                  ) : (
                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'#fef9c3',color:'#854d0e',border:'1px solid #fde047',marginTop:2 }}>⏳ AWAITING FINANCE</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dates & Other */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>📅 Dates & Terms</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Save Date</span><br /><strong>{new Date(detailModalBid.submitted_at).toLocaleString()}</strong></div>
                <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Open Date</span><br /><strong>{detailModalBid.opened_at ? new Date(detailModalBid.opened_at).toLocaleString() : 'Just Opened'}</strong></div>
                {detailModalBid.delivery_time && <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Delivery Time</span><br /><strong>{detailModalBid.delivery_time}</strong></div>}
                {detailModalBid.payment_terms && <div><span style={{ color: '#94a3b8', fontSize: 11 }}>Payment Terms</span><br /><strong>{detailModalBid.payment_terms}</strong></div>}
              </div>
            </div>

            {/* Signature */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>✍️ Digital Signature</div>
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, fontFamily: '"Caveat","Dancing Script",cursive', fontSize: 24, color: '#0f172a' }}>
                {detailModalBid.digital_signature || <em style={{ fontSize: 14, color: '#94a3b8' }}>No signature provided</em>}
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {detailModalBid.status === 'awarded' && detailModalBid.payment_status !== 'confirmed' && (
                <button
                  className="btn btn-primary"
                  style={{ background: '#10B981', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => { handleSubmitToFinance(detailModalBid); setDetailModalBid(null); }}
                >
                  <CreditCard size={14} /> Submit to Finance
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailModalBid(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="tm-page">
        {/* Header */}
        <div className="tm-header">
          <h1><Award size={22} /> Bid & Tender Management</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchTenders}><RefreshCw size={13} /> Refresh</button>
            <button className="btn btn-primary" onClick={handleNew}><Plus size={15} /> New Tender</button>
          </div>
        </div>

        {/* Toolbar tabs */}
        <div className="tm-toolbar">
          {[['list', 'All Tenders'], ['form', editId ? 'Edit Tender' : 'Create Tender']].map(([key, label]) => (
            <button key={key} className={`tm-tab${tab === key ? ' active' : ''}`} onClick={() => { setTab(key); if (key === 'list') { setEditId(null); } }}>
              {label}
            </button>
          ))}
          <span className="tm-tab-count">
            {filtered.length} tender{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Body */}
        <div className="tm-body">

          {/* ── LIST TAB ── */}
          {tab === 'list' && (
            <>
              {/* Search & Filter */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div className="tm-search-bar">
                    <Search size={15} color={C.emerald} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, reference or item..." />
                    {search && <X size={14} style={{ cursor: 'pointer', color: '#888' }} onClick={() => setSearch('')} />}
                  </div>
                  <div className="filter-bar">
                    {STATUS_FILTERS.map(f => (
                      <button key={f} className={`filter-pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? 'All' : STATUS_CFG[f]?.label || f}
                        <span style={{ marginLeft: 4, fontWeight: 400 }}>
                          ({f === 'all' ? tenders.length : tenders.filter(t => t.status === f).length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cards grid */}
              {loading ? (
                <div className="tm-cards">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ background: C.white, border: `1px solid ${C.sage}`, overflow: 'hidden' }}>
                      <div className="skeleton" style={{ height: 140 }} />
                      <div style={{ padding: 14 }}>
                        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 12, width: '60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                  <Award size={48} color={C.sage} />
                  <p style={{ marginTop: 12, fontSize: 15 }}>No tenders found</p>
                </div>
              ) : (
                <div className="tm-cards">
                  {filtered.map(t => (
                    <TenderCard
                      key={t.id}
                      tender={t}
                      selected={selectedTender?.id === t.id}
                      onClick={() => handleSelect(t)}
                      onEdit={handleEdit}
                      onDelete={(td) => setDeleteModal(td)}
                      onPublish={handlePublish}
                      onClose={handleClose}
                      onCancel={(td) => setCancelModal(td)}
                      onApprove={handleApprove}
                      onToggleHidden={handleToggleHidden}
                      isCEOorAdmin={isCEOorAdmin}
                    />
                  ))}
                </div>
              )}

              {/* Bids Panel */}
              {selectedTender && (
                <div className="tm-panel">
                  <div className="tm-panel-header">
                    <div>
                      <h3><Award size={15} style={{ marginRight: 6 }} />
                        {selectedTender.reference_number} — {selectedTender.title}
                      </h3>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                        {bids.length} bid{bids.length !== 1 ? 's' : ''} received
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Extend deadline */}
                      {['open', 'closed', 'cancelled'].includes(selectedTender.status) && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                            style={{ padding: '0 10px', height: 32, border: '1px solid #D1D5DB', fontSize: 12, borderRadius: 8, outline: 'none', color: C.darkGray, background: C.white }} />
                          <button className="btn btn-blue btn-sm" disabled={!extendDate} onClick={handleExtend}>
                            <Clock size={12} /> Extend
                          </button>
                        </div>
                      )}
                      {/* Submit to CEO */}
                      {/* Submit to CEO */}
                      {['closed', 'open', 'awarded'].includes(selectedTender.status) && bids.some(b => b.status === 'awarded' || b.status === 'submitted' || b.status === 'pending' || b.status === 'under_review') && (
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ background: '#1D4ED8', border: 'none', opacity: bids.some(b => b.status === 'awarded' && b.payment_status !== 'confirmed') ? 0.5 : 1 }} 
                          disabled={bids.some(b => b.status === 'awarded' && b.payment_status !== 'confirmed')} 
                          onClick={handleForwardToCeo}
                          title={bids.some(b => b.status === 'awarded' && b.payment_status !== 'confirmed') ? "Payment must be confirmed by Finance first" : "Submit to CEO for Final Approval"}
                        >
                          <Award size={13} /> Submit to CEO
                        </button>
                      )}
                      
                      {/* Waiting for CEO */}
                      {['awaiting_ceo_approval', 'pending_approval'].includes(selectedTender.status) && (
                        <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
                          <Clock size={12} /> Waiting for CEO Approval
                        </span>
                      )}
                      {/* Cancel */}
                      {['draft', 'open', 'closed'].includes(selectedTender.status) && (
                        <button className="btn btn-red btn-sm" onClick={() => setCancelModal(selectedTender)}>
                          <X size={12} /> Cancel Tender
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTender(null)}>
                        <X size={12} /> Close
                      </button>
                    </div>
                  </div>

                  <div className="tm-panel-body" style={{ overflowX: 'auto' }}>
                    {bids.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#aaa', fontSize: 13 }}>
                        No bids submitted yet for this tender.
                      </div>
                    ) : (() => {
                      // Determine if multi-product tender
                      let tenderItems = [];
                      try { tenderItems = typeof selectedTender.items === 'string' ? JSON.parse(selectedTender.items) : (selectedTender.items || []); } catch (_) {}
                      const isMultiProduct = tenderItems.length > 0;

                      if (isMultiProduct) {
                        // Group bids per product, rank by highest bid for that product
                        return (
                          <div>
                            <div style={{ padding: '10px 16px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>
                              📦 Multi-Product Tender — Bids grouped by product, ranked highest to lowest
                            </div>
                            {tenderItems.map((item, itemIdx) => {
                              // For each product, find which bids contain a price for it
                              const productBids = bids.map(bid => {
                                let bidItems = [];
                                try { bidItems = typeof bid.items === 'string' ? JSON.parse(bid.items) : (bid.items || []); } catch (_) {}
                                const matched = bidItems.find((bi, i) => i === itemIdx || bi.objectType === item.objectType);
                                const bidPrice = matched ? (parseFloat(matched.bidPriceBirr || 0) + parseFloat(matched.bidPriceCent || 0) / 100) : 0;
                                return { ...bid, productBidPrice: bidPrice, productBidItem: matched };
                              }).filter(b => b.productBidPrice > 0).sort((a, b2) => b2.productBidPrice - a.productBidPrice);

                              return (
                                <div key={itemIdx} style={{ marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                  <div style={{ background: '#1D4ED8', color: 'white', padding: '10px 16px', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>#{itemIdx + 1} — {item.objectType || '—'} ({item.unit}, qty {item.quantity})</span>
                                    <span style={{ fontSize: 11, opacity: 0.7 }}>Start Price: {item.startPrice ? parseFloat(item.startPrice).toLocaleString() + ' ETB' : '—'} | {productBids.length} bid(s)</span>
                                  </div>
                                  {productBids.length === 0 ? (
                                    <div style={{ padding: '12px 16px', color: '#aaa', fontSize: 12 }}>No bids for this product yet.</div>
                                  ) : (
                                      <table className="bids-table" style={{ margin: 0 }}>
                                        <thead>
                                          <tr>
                                            <th>Rank</th>
                                            <th>Competitor Name</th>
                                            <th>Contact (Email/Phone)</th>
                                            <th>Save Date</th>
                                            <th>Open Date</th>
                                            <th style={{ textAlign: 'right' }}>Bid Price (ETB)</th>
                                            <th>Payment Method</th>
                                            <th>Status</th>
                                            <th>CEO Approval</th>
                                            <th>Finance</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {productBids.map((b, rank) => {
                                            const bst = BID_STATUS_CFG[b.status] || { bg: '#eee', color: '#666' };
                                            return (
                                              <tr key={b.id} style={{ background: rank === 0 ? '#f0fdf4' : undefined }}>
                                                <td>
                                                  <span style={{ fontWeight: 800, fontSize: 15, color: rank === 0 ? '#059669' : '#94a3b8' }}>
                                                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                                                  </span>
                                                  {rank === 0 && <span style={{ marginLeft: 6, fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>SUGGESTED</span>}
                                                </td>
                                                <td>
                                                  <div style={{ fontWeight: 700, color: C.darkGreen }}>{b.bidder_full_name || b.customer_name || `User #${b.customer_id}`}</div>
                                                </td>
                                                <td>
                                                  <div style={{ fontSize: 11, color: '#888' }}>{b.bidder_email || b.customer_email}</div>
                                                  <div style={{ fontSize: 11, color: '#555' }}>{b.bidder_phone || 'N/A'}</div>
                                                </td>
                                                <td style={{ fontSize: 12 }}>{new Date(b.submitted_at).toLocaleString()}</td>
                                                <td style={{ fontSize: 12 }}>{b.opened_at ? new Date(b.opened_at).toLocaleString() : 'Unopened'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: rank === 0 ? '#059669' : C.darkGray }}>
                                                  {b.productBidPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB
                                                </td>
                                                <td>
                                                  {b.payment_method ? (
                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: b.payment_method.toLowerCase().startsWith('internal') ? '#DCFCE7' : (b.payment_method.startsWith('Telebirr') ? '#FEF3C7' : '#EFF6FF'), color: b.payment_method.toLowerCase().startsWith('internal') ? '#166534' : (b.payment_method.startsWith('Telebirr') ? '#92400E' : '#1D4ED8'), textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: 160 }}>
                                                      {b.payment_method.toLowerCase().startsWith('internal') ? '🛎️' : (b.payment_method.startsWith('Telebirr') ? '📱' : '🏦')} {b.payment_method.split('::')[0]}
                                                    </span>
                                                  ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                                                </td>
                                                <td><span className="status-badge" style={{ ...bst }}>{b.status === 'awarded' && b.ceo_approval_status !== 'approved' ? 'Winner Selected' : (b.status || '').replace(/_/g, ' ')}</span></td>
                                                <td>
                                                  <span style={{ fontSize: 11, fontWeight: 700, color: b.ceo_approval_status === 'approved' ? '#059669' : b.ceo_approval_status === 'rejected' ? '#dc2626' : '#94a3b8' }}>
                                                    {b.ceo_approval_status === 'approved' ? '✅ Approved' : b.ceo_approval_status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                                  </span>
                                                </td>
                                                <td>
                                                  {b.payment_status === 'confirmed' ? (
                                                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#dcfce7',color:'#166534',border:'1px solid #86efac' }}>✓ CONFIRMED</span>
                                                  ) : b.payment_status === 'rejected' ? (
                                                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5' }}>✕ REJECTED</span>
                                                  ) : b.payment_status === 'pending_verification' ? (
                                                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#fef9c3',color:'#854d0e',border:'1px solid #fde047' }}>⏳ AWAITING FINANCE</span>
                                                  ) : (
                                                    <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#f3f4f6',color:'#4b5563',border:'1px solid #e5e7eb' }}>UNPAID</span>
                                                  )}
                                                </td>
                                                <td>
                                                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                                    <button className="btn-icon" title="View Details" onClick={() => handleOpenBidDetail(b)}>
                                                      <Eye size={13} color="#2563EB" />
                                                    </button>
                                                    {b.status === 'awarded' && (
                                                      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                                                        <button onClick={() => handleSendAwardEmail(b)} style={{ fontSize: 11, background: b.notification_sent ? '#16A34A' : '#2563EB', color: 'white', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                                          {b.notification_sent ? 'Email Sent' : 'Send Email'}
                                                        </button>
                                                        {b.payment_status !== 'confirmed' && b.payment_status !== 'pending_verification' && (
                                                          <button onClick={() => handleSubmitToFinance(b)} title="Submit to Finance" style={{ fontSize: 11, background: '#10B981', color: 'white', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <CreditCard size={12} /> Submit
                                                          </button>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Single product — flat ranked list
                      const rankedBids = [...bids].sort((a, b2) => parseFloat(b2.total_bid_value || 0) - parseFloat(a.total_bid_value || 0));
                      return (
                        <table className="bids-table">
                          <thead>
                            <tr>

                              <th>Rank</th>
                              <th>Competitor Name</th>
                              <th>Contact (Email/Phone)</th>
                              <th>Save Date</th>
                              <th>Open Date</th>
                              <th style={{ textAlign: 'right' }}>Price/Unit</th>
                              <th style={{ textAlign: 'right' }}>Total</th>
                              <th>Payment Method</th>
                              <th>Status</th>
                              <th>CEO Approval</th>
                              <th>Finance</th>
                              <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankedBids.map((b, rank) => {
                              const bst = BID_STATUS_CFG[b.status] || { bg: '#eee', color: '#666' };
                              return (
                                <tr key={b.id} style={{ background: rank === 0 ? '#f0fdf4' : undefined }} className={b.status === 'disqualified' ? 'disqualified' : b.status === 'awarded' ? 'awarded' : ''}>

                                  <td style={{ fontWeight: 800, fontSize: 16, textAlign: 'center' }}>
                                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                                    {rank === 0 && <div style={{ fontSize: 9, background: '#dcfce7', color: '#166534', padding: '1px 4px', borderRadius: 999, fontWeight: 700, marginTop: 2 }}>SUGGESTED</div>}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 700, color: C.darkGreen }}>{b.bidder_full_name || b.customer_name || `User #${b.customer_id}`}</div>
                                  </td>
                                  <td>
                                    <div style={{ fontSize: 11, color: '#888' }}>{b.bidder_email || b.customer_email}</div>
                                    <div style={{ fontSize: 11, color: '#555' }}>{b.bidder_phone || 'N/A'}</div>
                                  </td>
                                  <td style={{ fontSize: 12 }}>{new Date(b.submitted_at).toLocaleString()}</td>
                                  <td style={{ fontSize: 12 }}>{b.opened_at ? new Date(b.opened_at).toLocaleString() : 'Unopened'}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: rank === 0 ? '#059669' : C.forestGreen }}>
                                    {parseFloat(b.bid_price_per_unit || 0).toLocaleString()}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                    {parseFloat(b.total_bid_value || 0).toLocaleString()}
                                  </td>
                                  <td>
                                    {b.payment_method ? (
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: b.payment_method.toLowerCase().startsWith('internal') ? '#DCFCE7' : (b.payment_method.startsWith('Telebirr') ? '#FEF3C7' : '#EFF6FF'), color: b.payment_method.toLowerCase().startsWith('internal') ? '#166534' : (b.payment_method.startsWith('Telebirr') ? '#92400E' : '#1D4ED8'), textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: 160 }}>
                                        {b.payment_method.toLowerCase().startsWith('internal') ? '🛎️' : (b.payment_method.startsWith('Telebirr') ? '📱' : '🏦')} {b.payment_method.split('::')[0]}
                                      </span>
                                    ) : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                                  </td>
                                  <td><span className="status-badge" style={{ ...bst }}>{b.status === 'awarded' && b.ceo_approval_status !== 'approved' ? 'Winner Selected' : (b.status || '').replace(/_/g, ' ')}</span></td>
                                  <td>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: b.ceo_approval_status === 'approved' ? '#059669' : b.ceo_approval_status === 'rejected' ? '#dc2626' : '#94a3b8' }}>
                                      {b.ceo_approval_status === 'approved' ? '✅ Approved' : b.ceo_approval_status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                    </span>
                                  </td>
                                  <td>
                                    {b.payment_status === 'confirmed' ? (
                                      <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#dcfce7',color:'#166534',border:'1px solid #86efac' }}>✓ CONFIRMED</span>
                                    ) : b.payment_status === 'rejected' ? (
                                      <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5' }}>✕ REJECTED</span>
                                    ) : (
                                      <span style={{ display:'inline-flex',alignItems:'center',gap:3,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:'#fef9c3',color:'#854d0e',border:'1px solid #fde047' }}>⏳ AWAITING</span>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                      <button className="btn-icon" title="View Details" onClick={() => handleOpenBidDetail(b)}>
                                        <Eye size={13} color="#2563EB" />
                                      </button>
                                      {b.status !== 'disqualified' && b.status !== 'awarded' && (
                                        <button className="btn-icon danger" title="Disqualify"
                                          onClick={() => { setDisqModal(b.id); setDisqReason(''); }}>
                                          <X size={13} />
                                        </button>
                                      )}
                                      {b.status === 'awarded' && (
                                        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                                          <button onClick={() => handleSendAwardEmail(b)} style={{ fontSize: 11, background: b.notification_sent ? '#16A34A' : '#2563EB', color: 'white', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                            {b.notification_sent ? 'Email Sent' : 'Send Email'}
                                          </button>
                                          {b.payment_status !== 'confirmed' && (
                                            <button onClick={() => handleSubmitToFinance(b)} title="Submit to Finance" style={{ fontSize: 11, background: '#10B981', color: 'white', padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                              <CreditCard size={12} /> Submit
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── FORM TAB ── */}
          {tab === 'form' && (
            <form onSubmit={handleSave} className="tm-form">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.darkGreen, marginBottom: 24, borderBottom: `2px solid ${C.sage}`, paddingBottom: 12 }}>
                {editId ? '✏️ Edit Tender' : '➕ Create New Tender'}
              </h2>

              <div className="form-grid">
                
                {/* Post Type Toggle */}
                <div className="form-group full" style={{ marginBottom: 12 }}>
                  <label>Tender Format</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => setPostType('single')} style={{
                      flex: 1, padding: '0 16px', height: 44, borderRadius: '8px', border: `2px solid ${postType === 'single' ? C.forestGreen : '#E5E7EB'}`,
                      background: postType === 'single' ? '#EFF6FF' : C.white, cursor: 'pointer', textAlign: 'center', transition: 'all .15s ease',
                      fontWeight: 600, color: postType === 'single' ? C.darkGreen : '#6B7280'
                    }}>
                      Single Product (with Images)
                    </button>
                    <button type="button" onClick={() => setPostType('multiple')} style={{
                      flex: 1, padding: '0 16px', height: 44, borderRadius: '8px', border: `2px solid ${postType === 'multiple' ? C.forestGreen : '#E5E7EB'}`,
                      background: postType === 'multiple' ? '#EFF6FF' : C.white, cursor: 'pointer', textAlign: 'center', transition: 'all .15s ease',
                      fontWeight: 600, color: postType === 'multiple' ? C.darkGreen : '#6B7280'
                    }}>
                      Multiple Products (Smart Table)
                    </button>
                  </div>
                </div>

                <div className="form-group full">
                  <label>Title *</label>
                  <input required name="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Supply of Office Furniture" />
                </div>

                <div className="form-group full">
                  <label>Description *</label>
                  <textarea required name="description" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the tender..." style={{ resize: 'vertical' }} />
                </div>

                {postType === 'single' ? (
                  <>
                    <div className="form-group">
                      <label>Category</label>
                      <input name="category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Printing, Supplies" />
                    </div>

                    <div className="form-group">
                      <label>Item Name</label>
                      <input name="item_name" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="e.g. A4 Paper Ream" />
                    </div>

                    <div className="form-group">
                      <label>Quantity *</label>
                      <input required={postType === 'single'} type="number" min="1" name="quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label>Starting Bid Price (ETB) *</label>
                      <input required={postType === 'single'} type="number" step="0.01" min="0" name="starting_bid_price" value={form.starting_bid_price} onChange={e => setForm(f => ({ ...f, starting_bid_price: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <div className="form-group full">
                    <label>Category</label>
                    <input name="category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Printing, Supplies" />
                  </div>
                )}

                <div className="form-group full">
                  <label>Bidding Deadline *</label>
                  <input required type="datetime-local" name="deadline" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>

                <div className="form-group full">
                  <label>Refundable CPO / Bid Bond Amount (ETB)</label>
                  <input type="number" step="0.01" min="0" name="cpo_amount" value={form.cpo_amount} onChange={e => setForm(f => ({ ...f, cpo_amount: e.target.value }))} placeholder="e.g. 5000" />
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Amount bidders must pay to submit a bid. Leave blank or 0 for free bidding.</p>
                </div>

                <div className="form-group full">
                  <label>Terms & Conditions *</label>
                  <textarea required name="terms_conditions" rows={6} value={form.terms_conditions} onChange={e => setForm(f => ({ ...f, terms_conditions: e.target.value }))} placeholder="List all terms, conditions, and requirements for bidders..." style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                </div>

                {postType === 'multiple' && (
                  <div className="form-group full" style={{ marginTop: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Tender Items (Smart Table)</label>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94a3b8' }}>Set a start price for each item. Competitors will submit their bid price on the public page.</p>
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                        <thead>
                          <tr style={{ background: '#1D4ED8', textAlign: 'left' }}>
                            {['No', 'Object Type', 'Unit', 'Quantity', 'Start Price (Birr)', 'Bid / Obj (Birr)', 'Bid / Obj (Cent)', 'Total (Birr)', 'Total (Cent)', 'Checkup', ''].map((h, i) => (
                              <th key={i} style={{ padding: '12px 14px', color: i <= 4 ? 'white' : 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '12px' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tenderItems.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#94a3b8' }}>{index + 1}</td>
                              <td style={{ padding: '8px' }}>
                                <input required value={item.objectType} onChange={e => setTenderItems(tenderItems.map(i => i.id === item.id ? { ...i, objectType: e.target.value } : i))} style={{ width: '100%', minWidth: '160px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} placeholder="e.g. Laptop" />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <input required value={item.unit} onChange={e => setTenderItems(tenderItems.map(i => i.id === item.id ? { ...i, unit: e.target.value } : i))} style={{ width: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} placeholder="Pcs" />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <input type="number" min="1" required value={item.quantity} onChange={e => setTenderItems(tenderItems.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i))} style={{ width: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <input type="number" min="0" step="0.01" required value={item.startPrice || ''} onChange={e => setTenderItems(tenderItems.map(i => i.id === item.id ? { ...i, startPrice: e.target.value } : i))} style={{ width: '110px', padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', fontSize: '13px', background: '#eff6ff' }} placeholder="0.00" />
                              </td>
                              {[...Array(5)].map((_, ci) => (
                                <td key={ci} style={{ padding: '8px', background: '#f8fafc' }}>
                                  <input disabled style={{ width: '80px', padding: '8px', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'not-allowed', fontSize: '13px' }} placeholder="—" />
                                </td>
                              ))}
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                {tenderItems.length > 1 && (
                                  <button type="button" onClick={() => setTenderItems(tenderItems.filter(i => i.id !== item.id))} style={{ background: 'none', color: '#ef4444', border: 'none', padding: '4px', cursor: 'pointer' }}>
                                    <X size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start' }}>
                      <button type="button" onClick={() => setTenderItems([...tenderItems, { id: Date.now(), objectType: '', unit: '', quantity: 1, startPrice: '' }])} style={{ padding: '8px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <PlusCircle size={14} /> Add Item
                      </button>
                    </div>
                  </div>
                )}

                {postType === 'single' && (
                  <div className="form-group full">
                    <label>Attachments — up to 5 files (PDF / JPG / PNG, max 10MB each)</label>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>First image is used as the tender card thumbnail. Click each slot to pick a file.</div>
                    <div className="attach-grid">
                      {[0,1,2,3,4].map(i => {
                        const newFile = files[i];
                        const existingFile = existingFiles[i];
                        const hasNew = !!newFile;
                        const hasExisting = !!existingFile && !hasNew;
                        const hasAny = hasNew || hasExisting;
                        const isImage = f => f && /\.(jpg|jpeg|png|gif)$/i.test(typeof f === 'string' ? f : f.name);
                        return (
                          <label key={i} style={{
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: 90, cursor: 'pointer',
                            border: `2px dashed ${hasAny ? C.leafGreen : C.sage}`,
                            background: hasAny ? '#F0FDF4' : C.white,
                            transition: 'all .15s', overflow: 'hidden',
                            borderRadius: 10,
                          }}>
                            {hasNew && isImage(newFile) ? (
                              <img src={URL.createObjectURL(newFile)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : hasExisting && isImage(existingFile) ? (
                              <img src={`${API_BASE.replace('/api/v1','')}/uploads/tenders/${existingFile.split('/').pop()}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={22} color={hasAny ? '#16A34A' : C.sage} />
                            )}
                            <div style={{
                              position: 'relative', zIndex: 1,
                              fontSize: 10, fontWeight: 700, marginTop: hasAny ? 0 : 6,
                              color: hasAny ? C.white : C.darkGray,
                              background: hasAny ? 'rgba(0,0,0,0.45)' : 'transparent',
                              padding: '2px 6px', textAlign: 'center',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%',
                            }}>
                              {hasNew ? newFile.name : hasExisting ? 'Uploaded' : `File ${i+1}`}
                            </div>
                            {hasAny && (
                              <button
                                type="button"
                                onClick={ev => { ev.preventDefault(); ev.stopPropagation(); setFiles(prev => { const a=[...prev]; a[i]=null; return a; }); }}
                                style={{
                                  position: 'absolute', top: 3, right: 3, zIndex: 2,
                                  background: C.red, color: '#fff', border: 'none',
                                  width: 18, height: 18, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 900,
                                }}
                              >✕</button>
                            )}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files[0];
                                if (!f) return;
                                setFiles(prev => { const a=[...prev]; a[i]=f; return a; });
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                    {files.filter(Boolean).length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: C.forestGreen, fontWeight: 700 }}>
                        {files.filter(Boolean).length} file(s) selected{editId && existingFiles.length > 0 ? ' — will replace all existing files' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: `1px solid ${C.sage}`, paddingTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <SegmentedSpinner size={16} /> : editId ? '✔ Update Tender' : '✔ Create Tender'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setTab('list')}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Finance Submit Modal */}
      {financeModalBid && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', width: 400, borderRadius: 12, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, color: '#047857' }}>
              <CreditCard size={20} /> Submit to Finance
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Payment Method *</label>
              <select value={financePaymentMethod} onChange={e => setFinancePaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14 }}>
                <option value="Bank">Bank Transfer</option>
                <option value="Telebirr">Telebirr</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Transaction Reference (Optional)</label>
              <input type="text" value={financePaymentReference} onChange={e => setFinancePaymentReference(e.target.value)} placeholder="e.g. FT231..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14 }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setFinanceModalBid(null)} style={{ padding: '8px 16px', border: '1px solid #D1D5DB', background: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                Cancel
              </button>
              <button onClick={confirmFinanceSubmit} style={{ padding: '8px 16px', border: 'none', background: '#10B981', color: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

