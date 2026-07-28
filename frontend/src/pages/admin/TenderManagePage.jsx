import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../services/apiClient';
import {
  Plus, Edit3, Send, Check, X, Clock, Award, Search, FileText,
  Trash2, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon,
  AlertCircle, CheckCircle2, Info, XCircle, Eye, Filter, Calendar, PlusCircle
} from 'lucide-react';

/* ─── Natural Green Palette ─── */
const C = {
  forestGreen:  '#228B22',
  darkGreen:    '#1B5E20',
  emerald:      '#2E8B57',
  leafGreen:    '#4CAF50',
  sage:         '#A5D6A7',
  olive:        '#6B8E23',
  mint:         '#E8F5E9',
  limeGreen:    '#8BC34A',
  earthBrown:   '#8D6E63',
  skyBlue:      '#87CEEB',
  white:        '#FFFFFF',
  lightGray:    '#F5F5F5',
  darkGray:     '#424242',
  orange:       '#FF9800',
  red:          '#F44336',
};

/* ─── Status config ─── */
const STATUS_CFG = {
  draft:            { bg: '#E8F5E9', color: '#1B5E20', label: 'Draft' },
  open:             { bg: '#E3F2FD', color: '#0D47A1', label: 'Open' },
  closed:           { bg: '#FFF8E1', color: '#E65100', label: 'Closed' },
  awarded:          { bg: '#E8F5E9', color: '#2E7D32', label: 'Awarded' },
  cancelled:        { bg: '#FFEBEE', color: '#B71C1C', label: 'Cancelled' },
  pending_approval: { bg: '#FFF8E1', color: '#F57F17', label: 'Pending Approval' },
};

const BID_STATUS_CFG = {
  pending:        { bg: '#E3F2FD', color: '#0D47A1' },
  awarded:        { bg: '#E8F5E9', color: '#2E7D32' },
  not_selected:   { bg: '#FFF8E1', color: '#E65100' },
  disqualified:   { bg: '#FFEBEE', color: '#B71C1C' },
};

/* ─── Global styles ─── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: ${C.lightGray}; color: ${C.darkGray}; }

  /* ── Kill all rounded corners globally ── */
  input, textarea, select, button { border-radius: 0 !important; }

  .tm-page { width: 100%; min-height: 100vh; background: ${C.lightGray}; }

  .tm-header {
    background: ${C.darkGreen};
    color: ${C.white};
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    border-bottom: 4px solid ${C.forestGreen};
  }
  .tm-header h1 { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px; color: #FFFFFF !important; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }

  .tm-toolbar {
    background: ${C.forestGreen};
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    border-bottom: 2px solid ${C.emerald};
  }

  .tm-tab {
    padding: 7px 18px;
    background: transparent;
    color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.3);
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.15s;
  }
  .tm-tab.active {
    background: ${C.white};
    color: ${C.darkGreen};
    border-color: ${C.white};
  }
  .tm-tab:hover:not(.active) { background: rgba(255,255,255,0.15); color: ${C.white}; }

  .tm-body { padding: 20px 24px 60px; }

  /* Search */
  .tm-search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${C.white};
    border: 2px solid ${C.sage};
    padding: 8px 14px;
    max-width: 420px;
    width: 100%;
  }
  .tm-search-bar input { border: none; outline: none; flex: 1; font-size: 14px; color: ${C.darkGray}; background: transparent; }

  /* Cards grid */
  .tm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; margin-top: 16px; }

  /* Tender Card */
  .tm-card {
    background: ${C.white};
    border: 1px solid ${C.sage};
    border-left: 4px solid ${C.forestGreen};
    overflow: hidden;
    transition: box-shadow 0.15s, transform 0.15s;
    cursor: pointer;
  }
  .tm-card:hover { box-shadow: 0 4px 20px rgba(34,139,34,0.18); transform: translateY(-1px); }
  .tm-card.selected { border-left-color: ${C.olive}; background: #F1F8E9; }

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
    border-bottom: 1px solid ${C.sage};
    position: relative;
  }
  .tm-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .tm-card-img .placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: ${C.emerald}; }

  .tm-card-body { padding: 14px 16px 10px; }
  .tm-card-ref { font-size: 11px; font-weight: 700; color: ${C.olive}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .tm-card-title { font-size: 15px; font-weight: 700; color: ${C.darkGreen}; margin-bottom: 6px; line-height: 1.3; }
  .tm-card-item { font-size: 12px; color: ${C.earthBrown}; margin-bottom: 8px; }
  .tm-card-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .tm-card-price { font-size: 16px; font-weight: 800; color: ${C.forestGreen}; }
  .tm-card-deadline { font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px; }

  .tm-card-footer {
    border-top: 1px solid ${C.sage};
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #FAFAFA;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tm-card-actions { display: flex; align-items: center; gap: 6px; }

  /* Buttons */
  .btn {
    padding: 7px 14px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s, background 0.15s;
  }
  .btn:hover { opacity: 0.88; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary   { background: ${C.forestGreen}; color: ${C.white}; }
  .btn-emerald   { background: ${C.emerald};     color: ${C.white}; }
  .btn-blue      { background: #1565C0;           color: ${C.white}; }
  .btn-orange    { background: ${C.orange};       color: ${C.white}; }
  .btn-red       { background: ${C.red};          color: ${C.white}; }
  .btn-ghost     { background: ${C.lightGray};    color: ${C.darkGray}; border: 1px solid #DDD; }
  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .btn-icon { padding: 6px; background: transparent; border: 1px solid #DDD; cursor: pointer; display: inline-flex; align-items: center; transition: all 0.15s; }
  .btn-icon:hover { background: ${C.mint}; border-color: ${C.emerald}; color: ${C.darkGreen}; }
  .btn-icon.danger:hover { background: #FFEBEE; border-color: ${C.red}; color: ${C.red}; }

  /* Status badge */
  .status-badge {
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Section panel */
  .tm-panel {
    background: ${C.white};
    border: 1px solid ${C.sage};
    border-top: 3px solid ${C.forestGreen};
    margin-top: 20px;
  }
  .tm-panel-header {
    padding: 14px 20px;
    background: #F9FBF9;
    border-bottom: 1px solid ${C.sage};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tm-panel-header h3 { font-size: 15px; font-weight: 700; color: ${C.darkGreen}; }
  .tm-panel-body { padding: 16px 20px; }

  /* Bids table */
  .bids-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .bids-table th {
    padding: 10px 12px;
    text-align: left;
    background: ${C.darkGreen};
    color: ${C.white};
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .bids-table td { padding: 10px 12px; border-bottom: 1px solid ${C.mint}; vertical-align: middle; }
  .bids-table tr:hover td { background: #F9FBF9; }
  .bids-table tr.awarded td { background: #F1F8E9; }
  .bids-table tr.disqualified td { background: #FFEBEE; opacity: 0.75; }

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
    border: 1px solid ${C.sage};
  }

  /* Form */
  .tm-form { background: ${C.white}; border: 2px solid ${C.forestGreen}; border-top: 5px solid ${C.darkGreen}; padding: 28px; border-radius: 0; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid .full { grid-column: 1 / -1; }
  .form-group { margin-bottom: 4px; }
  .form-group label { display: block; font-size: 12px; font-weight: 800; color: ${C.darkGreen}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.6px; }
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid #9E9E9E;
    border-radius: 0 !important;
    background: ${C.white};
    font-size: 13px;
    color: ${C.darkGray};
    outline: none;
    transition: border-color 0.15s, border-left-width 0.1s;
    box-shadow: none !important;
    -webkit-appearance: none;
    appearance: none;
  }
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    border-color: ${C.forestGreen};
    border-left: 4px solid ${C.darkGreen};
    background: #FAFFF8;
  }
  .form-group input:hover,
  .form-group textarea:hover,
  .form-group select:hover { border-color: ${C.emerald}; }

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
    border-left: 4px solid;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    animation: slideIn 0.25s ease;
  }
  .tm-notify-item.success { border-color: ${C.leafGreen}; }
  .tm-notify-item.error   { border-color: ${C.red}; }
  .tm-notify-item.info    { border-color: ${C.skyBlue}; }
  .tm-notify-item.warning { border-color: ${C.orange}; }
  .tm-notify-text { flex: 1; font-size: 13px; font-weight: 600; color: ${C.darkGray}; }
  .tm-notify-close { cursor: pointer; color: #888; flex-shrink: 0; }

  @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

  /* Modal */
  .tm-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .tm-modal {
    background: ${C.white}; border-top: 5px solid ${C.darkGreen}; border: 2px solid ${C.forestGreen}; border-top: 5px solid ${C.darkGreen};
    width: 100%; max-width: 420px; padding: 24px; border-radius: 0;
  }
  .tm-modal h3 { font-size: 16px; font-weight: 700; color: ${C.darkGreen}; margin-bottom: 16px; }
  .tm-modal textarea, .tm-modal input {
    width: 100%; padding: 10px 14px; border: 2px solid #9E9E9E; border-radius: 0 !important;
    font-size: 13px; color: ${C.darkGray}; outline: none; resize: vertical;
    box-shadow: none !important;
  }
  .tm-modal textarea:focus, .tm-modal input:focus { border-color: ${C.forestGreen}; border-left: 4px solid ${C.darkGreen}; background: #FAFFF8; }

  /* Filter pills */
  .filter-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .filter-pill {
    padding: 5px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 2px solid transparent;
    background: ${C.white};
    color: ${C.darkGray};
    transition: all 0.15s;
  }
  .filter-pill.active { background: ${C.forestGreen}; color: ${C.white}; border-color: ${C.forestGreen}; }
  .filter-pill:hover:not(.active) { border-color: ${C.emerald}; color: ${C.darkGreen}; }

  /* Skeleton */
  .skeleton { background: linear-gradient(90deg, #e8f5e9 25%, #f1f8f1 50%, #e8f5e9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0% { background-position: -200px 0 } 100% { background-position: calc(200px + 100%) 0 } }

  /* Responsive */
  @media (max-width: 700px) {
    .tm-header { padding: 12px 14px; }
    .tm-toolbar { padding: 8px 14px; }
    .tm-body { padding: 14px 12px 60px; }
    .tm-cards { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .form-grid .full { grid-column: 1; }
    .bids-table { font-size: 11px; }
    .bids-table th, .bids-table td { padding: 7px 8px; }
    .tm-notify { top: auto; bottom: 16px; right: 12px; left: 12px; max-width: 100%; }
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
  if (type === 'success') return <CheckCircle2 {...s} color={C.leafGreen} />;
  if (type === 'error')   return <XCircle {...s} color={C.red} />;
  if (type === 'warning') return <AlertCircle {...s} color={C.orange} />;
  return <Info {...s} color={C.skyBlue} />;
}

/* ─── Tender Card ─── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TenderCard({ tender, selected, onClick, onEdit, onDelete, onPublish, onClose, onCancel, onApprove, onToggleHidden, isCEOorAdmin }) {
  const st = STATUS_CFG[tender.status] || { bg: '#eee', color: '#666', label: tender.status };

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

  return (
    <div className={`tm-card${selected ? ' selected' : ''}`} onClick={onClick}>
      {/* Image section */}
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

      {/* Body */}
      <div className="tm-card-body">
        <div className="tm-card-ref">{tender.reference_number || `TND-${tender.id}`}</div>
        <div className="tm-card-title">{tender.title}</div>
        {tender.item_name && <div className="tm-card-item">📦 {tender.item_name}{tender.quantity ? ` × ${tender.quantity}` : ''}</div>}
        <div className="tm-card-meta">
          <div className="tm-card-price">ETB {parseFloat(tender.starting_bid_price || 0).toLocaleString()}</div>
          {tender.deadline && (
            <div className="tm-card-deadline">
              <Calendar size={11} />
              {new Date(tender.deadline).toLocaleDateString('en-CA')}
            </div>
          )}
        </div>
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
              style={{ border: '1px solid #4CAF50', background: '#E8F5E9' }}>
              <Check size={14} color={C.leafGreen} />
            </button>
          )}
          {/* Force Close */}
          {canClose && (
            <button className="btn-icon" title="Force Close Bidding" onClick={() => onClose(tender.id)}
              style={{ border: '1px solid #FF9800', background: '#FFF8E1' }}>
              <Clock size={14} color={C.orange} />
            </button>
          )}
          {/* Cancel */}
          {canCancel && (
            <button className="btn-icon" title="Cancel Tender" onClick={() => onCancel(tender)}
              style={{ border: '1px solid #E53935', background: '#FFEBEE' }}>
              <X size={14} color="#E53935" />
            </button>
          )}
          {/* Hide / Show toggle */}
          <button className="btn-icon" title={isHidden ? 'Show to Public' : 'Hide from Public'}
            onClick={() => onToggleHidden(tender)}
            style={{ border: `1px solid ${isHidden ? '#1565C0' : '#757575'}`, background: isHidden ? '#E3F2FD' : '#F5F5F5' }}>
            <Eye size={14} color={isHidden ? '#1565C0' : '#757575'} />
          </button>
          {/* Edit */}
          <button className="btn-icon" title="Edit Tender" onClick={() => onEdit(tender)}
            style={{ border: '1px solid #1565C0', background: '#E3F2FD' }}>
            <Edit3 size={14} color="#1565C0" />
          </button>
          {/* Delete */}
          <button className="btn-icon danger" title="Delete Tender" onClick={() => onDelete(tender)}
            style={{ border: '1px solid #F44336', background: '#FFEBEE' }}>
            <Trash2 size={14} color="#F44336" />
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
    starting_bid_price: '', deadline: '', terms_conditions: '',
  });
  const [postType, setPostType] = useState('single');
  const [tenderItems, setTenderItems] = useState([
    { id: Date.now(), objectType: '', unit: '', quantity: 1 }
  ]);
  const [editId, setEditId] = useState(null);
  const [files, setFiles] = useState([null, null, null, null, null]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  /* Award & extend */
  const [selectedBids, setSelectedBids] = useState([]);
  const [extendDate, setExtendDate] = useState('');

  /* Modals */
  const [deleteModal, setDeleteModal] = useState(null);
  const [disqModal, setDisqModal] = useState(null);
  const [disqReason, setDisqReason] = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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
    setSelectedTender(t); setSelectedBids([]); setExtendDate('');
    await fetchBids(t.id);
  };

  /* ── CRUD ── */
  const handleNew = () => {
    setEditId(null);
    setForm({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
    setFiles([null, null, null, null, null]); setExistingFiles([]); 
    setPostType('single');
    setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
    setTab('form');
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description || '', category: t.category || '',
      item_name: t.item_name || '', quantity: t.quantity || '', starting_bid_price: t.starting_bid_price || '',
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
    
    if (parsedItems.length > 0) {
      setPostType('multiple');
      setTenderItems(parsedItems.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })));
    } else {
      setPostType('single');
      setTenderItems([{ id: Date.now(), objectType: '', unit: '', quantity: 1 }]);
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

  const handleEvaluate = async (bidId, field, value) => {
    try { const r = await axios.put(`/tenders/bids/${bidId}/evaluate`, { [field]: value }); if (r.status === 'success') { notify('info', 'Evaluation updated'); await fetchBids(selectedTender.id); } }
    catch (err) { notify('error', err.message); }
  };

  const handleAward = async () => {
    if (!selectedBids.length) { notify('warning', 'Select at least one bid to award'); return; }
    try {
      const r = await axios.put(`/tenders/${selectedTender.id}/award`, { bid_ids: selectedBids });
      if (r.status === 'success') { notify('success', r.message || 'Bid(s) awarded'); fetchTenders(); setSelectedTender(null); setSelectedBids([]); }
    } catch (err) { notify('error', err.message); }
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
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
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
                            style={{ padding: '6px 10px', border: `2px solid ${C.sage}`, fontSize: 12, borderRadius: 0, outline: 'none', color: C.darkGray }} />
                          <button className="btn btn-blue btn-sm" disabled={!extendDate} onClick={handleExtend}>
                            <Clock size={12} /> Extend
                          </button>
                        </div>
                      )}
                      {/* Award */}
                      {['closed', 'open'].includes(selectedTender.status) && (
                        <button className="btn btn-primary btn-sm" disabled={!selectedBids.length} onClick={handleAward}>
                          <Award size={13} /> Award ({selectedBids.length})
                        </button>
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
                    ) : (
                      <table className="bids-table">
                        <thead>
                          <tr>
                            {selectedTender.status !== 'awarded' && (
                              <th style={{ width: 36 }}>
                                <input type="checkbox"
                                  onChange={e => setSelectedBids(e.target.checked ? bids.filter(b => b.status !== 'disqualified').map(b => b.id) : [])}
                                  checked={selectedBids.length > 0 && selectedBids.length === bids.filter(b => b.status !== 'disqualified').length}
                                />
                              </th>
                            )}
                            <th>Image</th>
                            <th>Bidder</th>
                            <th style={{ textAlign: 'right' }}>Price/Unit</th>
                            <th style={{ textAlign: 'right' }}>Qty</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th>Status</th>
                            <th>Evaluation</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bids.map(b => {
                            const bst = BID_STATUS_CFG[b.status] || { bg: '#eee', color: '#666' };
                            /* bid image */
                            let bidImg = null;
                            try {
                              const atts = typeof b.attachments === 'string' ? JSON.parse(b.attachments) : b.attachments;
                              if (Array.isArray(atts) && atts.length > 0) {
                                const images = atts.filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a));
                                if (images.length > 0) {
                                  const imgAtt = images[images.length - 1]; // Use the newest one
                                  const baseUrl = API_BASE.replace('/api/v1', '');
                                  bidImg = `${baseUrl}/uploads/tenders/${imgAtt.split('/').pop()}`;
                                }
                              }
                            } catch (_) {}

                            return (
                              <tr key={b.id} className={b.status === 'disqualified' ? 'disqualified' : b.status === 'awarded' ? 'awarded' : ''}>
                                {selectedTender.status !== 'awarded' && (
                                  <td>
                                    <input type="checkbox"
                                      checked={selectedBids.includes(b.id)}
                                      disabled={b.status === 'disqualified'}
                                      onChange={e => setSelectedBids(prev => e.target.checked ? [...prev, b.id] : prev.filter(x => x !== b.id))}
                                    />
                                  </td>
                                )}
                                {/* Image */}
                                <td>
                                  <div className="bid-img">
                                    {bidImg ? (
                                      <img src={bidImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                    ) : null}
                                    <div style={{ display: bidImg ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                      <ImageIcon size={18} color={C.sage} />
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: C.darkGreen }}>{b.customer_name || `User #${b.customer_id}`}</div>
                                  <div style={{ fontSize: 11, color: '#888' }}>{b.customer_email}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: C.forestGreen }}>
                                  {parseFloat(b.bid_price_per_unit || 0).toLocaleString()}
                                </td>
                                <td style={{ textAlign: 'right', color: '#666' }}>{b.quantity_requested}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  {parseFloat(b.total_bid_value || 0).toLocaleString()}
                                </td>
                                <td>
                                  <span className="status-badge" style={{ ...bst }}>
                                    {(b.status || '').replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td>
                                  <select value={b.evaluation_label || ''} onChange={e => handleEvaluate(b.id, 'evaluation_label', e.target.value)}
                                    style={{ padding: '6px 8px', border: `2px solid ${C.sage}`, borderRadius: 0, fontSize: 12, background: C.white, width: '100%', color: C.darkGray, outline: 'none' }}>
                                    <option value="">— Evaluate —</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="highest">Highest</option>
                                    <option value="lowest">Lowest</option>
                                    <option value="disqualified">Disqualified</option>
                                  </select>
                                </td>
                                {/* Actions */}
                                <td>
                                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                    {/* View bid details */}
                                    <button className="btn-icon" title="View Details"
                                      onClick={() => notify('info', `Bidder: ${b.customer_name || 'Unknown'} | Amount: ETB ${parseFloat(b.total_bid_value||0).toLocaleString()}`)}>
                                      <Eye size={13} color="#1565C0" />
                                    </button>
                                    {/* Disqualify */}
                                    {b.status !== 'disqualified' && b.status !== 'awarded' && (
                                      <button className="btn-icon danger" title="Disqualify"
                                        onClick={() => { setDisqModal(b.id); setDisqReason(''); }}>
                                        <X size={13} />
                                      </button>
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
                      flex: 1, padding: '14px', borderRadius: '8px', border: `2px solid ${postType === 'single' ? C.forestGreen : '#e2e8f0'}`,
                      background: postType === 'single' ? '#F2FFF5' : C.white, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      fontWeight: 700, color: postType === 'single' ? C.darkGreen : '#64748b'
                    }}>
                      Single Product (with Images)
                    </button>
                    <button type="button" onClick={() => setPostType('multiple')} style={{
                      flex: 1, padding: '14px', borderRadius: '8px', border: `2px solid ${postType === 'multiple' ? C.forestGreen : '#e2e8f0'}`,
                      background: postType === 'multiple' ? '#F2FFF5' : C.white, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                      fontWeight: 700, color: postType === 'multiple' ? C.darkGreen : '#64748b'
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
                  <label>Terms & Conditions *</label>
                  <textarea required name="terms_conditions" rows={6} value={form.terms_conditions} onChange={e => setForm(f => ({ ...f, terms_conditions: e.target.value }))} placeholder="List all terms, conditions, and requirements for bidders..." style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                </div>

                {postType === 'multiple' && (
                  <div className="form-group full" style={{ marginTop: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Tender Items (Smart Table)</label>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94a3b8' }}>Define items. Suppliers will fill in pricing on the public page.</p>
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', textAlign: 'left' }}>
                            {['No', 'Object Type', 'Unit', 'Quantity', 'Price / Obj (Birr)', 'Price / Obj (Cent)', 'Total (Birr)', 'Total (Cent)', 'Checkup', ''].map((h, i) => (
                              <th key={i} style={{ padding: '12px 14px', color: i < 4 ? 'white' : '#94a3b8', fontWeight: 600, fontSize: '12px', fontStyle: i >= 4 && i <= 8 ? 'italic' : 'normal' }}>
                                {h}{i >= 4 && i <= 8 ? ' ← supplier fills' : ''}
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
                      <button type="button" onClick={() => setTenderItems([...tenderItems, { id: Date.now(), objectType: '', unit: '', quantity: 1 }])} style={{ padding: '8px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <PlusCircle size={14} /> Add Item
                      </button>
                    </div>
                  </div>
                )}

                {postType === 'single' && (
                  <div className="form-group full">
                    <label>Attachments — up to 5 files (PDF / JPG / PNG, max 10MB each)</label>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>First image is used as the tender card thumbnail. Click each slot to pick a file.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
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
                            background: hasAny ? '#E8F5E9' : C.white,
                            transition: 'all .2s', overflow: 'hidden',
                          }}>
                            {hasNew && isImage(newFile) ? (
                              <img src={URL.createObjectURL(newFile)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : hasExisting && isImage(existingFile) ? (
                              <img src={`${API_BASE.replace('/api/v1','')}/uploads/tenders/${existingFile.split('/').pop()}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={22} color={hasAny ? C.forestGreen : C.sage} />
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
                  {saving ? 'Saving...' : editId ? '✔ Update Tender' : '✔ Create Tender'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setTab('list')}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
