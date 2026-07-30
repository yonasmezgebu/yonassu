import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Package, Plus, Loader2, X, ArrowLeft,
  Upload, CheckCircle2, AlertCircle, RefreshCw,
  ChevronRight, Info,
} from 'lucide-react';
import apiClient from '../../services/apiClient';

// ═══════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Natural University Green Palette
// ═══════════════════════════════════════════════════════════════════════
const G = {
  forest:    '#228B22', // Primary
  dark:      '#1B5E20', // Header / Sidebar
  emerald:   '#2E8B57', // Buttons / Highlights
  leaf:      '#4CAF50', // Success
  sage:      '#A5D6A7', // Cards / Backgrounds
  olive:     '#6B8E23', // Secondary Accents
  mint:      '#98FF98', // Soft Backgrounds
  lime:      '#8BC34A', // Notifications / Active
  earth:     '#8D6E63', // Borders / Icons
  sky:       '#87CEEB', // Links
  white:     '#FFFFFF',
  lightGray: '#F5F5F5', // Page Background
  darkGray:  '#424242', // Text
  warning:   '#FF9800',
  error:     '#F44336',
  rowAlt:    '#F1F8E9', // alternating row
  rowHov:    '#E8F5E9', // hover row
};

// ═══════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ═══════════════════════════════════════════════════════════════════════
// SHARP INPUT — bold border only on focus, no radius anywhere
// ═══════════════════════════════════════════════════════════════════════
function SharpInput({ style, onFocus: extFocus, onBlur: extBlur, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFoc(true);  extFocus?.(e); }}
      onBlur ={e => { setFoc(false); extBlur?.(e); }}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: foc ? `2px solid ${G.forest}` : `1px solid ${G.sage}`,
        borderRadius: 0,
        outline: 'none',
        fontSize: 14,
        color: G.darkGray,
        background: G.white,
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        transition: 'border-color 0.12s',
        ...style,
      }}
    />
  );
}

function SharpSelect({ style, children, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <select
      {...props}
      onFocus={() => setFoc(true)}
      onBlur ={() => setFoc(false)}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: foc ? `2px solid ${G.forest}` : `1px solid ${G.sage}`,
        borderRadius: 0,
        outline: 'none',
        fontSize: 14,
        color: G.darkGray,
        background: G.white,
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        cursor: 'pointer',
        appearance: 'none',
        transition: 'border-color 0.12s',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function SharpTextarea({ style, ...props }) {
  const [foc, setFoc] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={() => setFoc(true)}
      onBlur ={() => setFoc(false)}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: foc ? `2px solid ${G.forest}` : `1px solid ${G.sage}`,
        borderRadius: 0,
        outline: 'none',
        fontSize: 14,
        color: G.darkGray,
        background: G.white,
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        resize: 'vertical',
        lineHeight: 1.5,
        transition: 'border-color 0.12s',
        ...style,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FIELD LABEL
// ═══════════════════════════════════════════════════════════════════════
function FL({ children, required, hint }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: G.darkGray,
        textTransform: 'uppercase', letterSpacing: '0.6px',
        display: 'flex', gap: 3, alignItems: 'center',
      }}>
        {children}
        {required && <span style={{ color: G.error }}>*</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: G.olive, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// IN-APP NOTIFICATION BANNER (no browser alert)
// ═══════════════════════════════════════════════════════════════════════
function NotifBanner({ notif }) {
  if (!notif.show) return null;
  const ok = notif.type === 'success';
  return (
    <div style={{
      background: ok ? G.leaf : G.error,
      color: G.white,
      padding: '11px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 700,
      borderBottom: `3px solid ${ok ? G.dark : '#B71C1C'}`,
      flexShrink: 0,
    }}>
      {ok ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}
      <span style={{ flex: 1 }}>{notif.message}</span>
      {notif.dismissible && (
        <button onClick={notif.onDismiss} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: G.white,
          cursor: 'pointer', padding: '2px 8px', fontSize: 12, borderRadius: 0,
        }}>×</button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION HEADER (used inside form)
// ═══════════════════════════════════════════════════════════════════════
function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 800, color: G.dark,
      textTransform: 'uppercase', letterSpacing: '0.8px',
      borderLeft: `4px solid ${G.forest}`,
      paddingLeft: 10,
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ImportStoreProductModal({ onClose, onImportSuccess }) {
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  // ── List state ──────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [allItems,   setAllItems]   = useState([]);
  const [items,      setItems]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [importedSkus, setImportedSkus] = useState(new Set());
  const [search,     setSearch]     = useState('');
  const [view,       setView]       = useState('list'); // 'list' | 'form'

  // ── Form state ──────────────────────────────────────────────────────
  const [form,         setForm]         = useState({});
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [saving,       setSaving]       = useState(false);

  // ── Notification ────────────────────────────────────────────────────
  const [notif, setNotif] = useState({ show: false, type: '', message: '' });
  const timerRef = useRef(null);
  const fileRef  = useRef(null);

  const showNotif = useCallback((type, message, duration = 5000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotif({ show: true, type, message });
    timerRef.current = setTimeout(() =>
      setNotif({ show: false, type: '', message: '' }), duration);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [invRes, catRes, retRes] = await Promise.all([
          apiClient.get('/retail/store-inventory'),
          apiClient.get('/retail/categories'),
          // include_inactive=true so hidden products still show as "already posted"
          // but deleted products (hard-deleted) are absent → re-import allowed
          apiClient.get('/retail/products?limit=1000&include_inactive=true'),
        ]);
        const inv = Array.isArray(invRes?.data) ? invRes.data
                  : Array.isArray(invRes)        ? invRes : [];
        const cat = Array.isArray(catRes?.data)  ? catRes.data
                  : Array.isArray(catRes)         ? catRes : [];
                  
        const rBody = retRes?.data || retRes || {};
        const rProds = rBody?.products || rBody?.data?.products || (Array.isArray(rBody) ? rBody : []);
        const imported = new Set(rProds.map(p => p.sku));
        
        setAllItems(inv);
        setItems(inv);
        setCategories(cat);
        setImportedSkus(imported);
        if (inv.length === 0) {
          showNotif('error', 'Store Inventory is empty. Add items there first.');
        }
      } catch (e) {
        showNotif('error', `Could not load inventory: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Search ───────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) { setItems(allItems); return; }
    const lq = q.toLowerCase();
    setItems(allItems.filter(p =>
      (p.material_name || p.name || '').toLowerCase().includes(lq) ||
      (p.material_id   || '').toLowerCase().includes(lq) ||
      (p.category      || '').toLowerCase().includes(lq)
    ));
  };

  // ── Open publish form ────────────────────────────────────────────────
  const openForm = (prod) => {
    setNotif({ show: false, type: '', message: '' });
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setForm({
      _source:        prod,
      name:           prod.material_name || prod.name || '',
      sku:            prod.material_id   || `STORE-${prod.id}`,
      category_id:    '',
      description:    '',
      price:          String(prod.unit_value || prod.price || ''),
      cost_price:     String(prod.unit_value || prod.cost_price || 0),
      stock_quantity: String(parseFloat(prod.quantity_in_store ?? prod.stock_quantity ?? 0)),
      reorder_level:  String(parseInt(prod.reorder_level) || 10),
      expiry_date:    '',
    });
    setView('form');
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Image handlers ───────────────────────────────────────────────────
  const applyImage = (file) => {
    if (!file.type.startsWith('image/')) {
      showNotif('error', 'Please select an image file (JPG, PNG, WEBP)'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotif('error', 'Image must be smaller than 5 MB'); return;
    }
    setImageFile(file);
    const r = new FileReader();
    r.onload = ev => setImagePreview(ev.target.result);
    r.readAsDataURL(file);
  };
  const handleImageInput = (e) => { const f = e.target.files?.[0]; if (f) applyImage(f); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) applyImage(f);
  };
  const removeImage = () => {
    setImageFile(null); setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Publish ──────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!form.name?.trim())             { showNotif('error', 'Product name is required.');          return; }
    if (!form.sku?.trim())              { showNotif('error', 'SKU is required.');                   return; }
    if (!form.price || parseFloat(form.price) <= 0) {
      showNotif('error', 'Selling price must be greater than 0.'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',           form.name.trim());
      fd.append('sku',            form.sku.trim());
      fd.append('price',          parseFloat(form.price));
      fd.append('cost_price',     parseFloat(form.cost_price || 0));
      fd.append('stock_quantity', parseInt(form.stock_quantity || 0));
      fd.append('reorder_level',  parseInt(form.reorder_level || 10));
      if (form.description?.trim()) fd.append('description', form.description.trim());
      if (form.category_id)         fd.append('category_id', form.category_id);
      if (form.expiry_date)         fd.append('expiry_date', form.expiry_date);
      if (imageFile)                fd.append('product_image', imageFile);

      await apiClient.post('/retail/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showNotif('success', `"${form.name}" has been published to the Retail Store successfully!`, 3000);
      // Mark this SKU as imported so re-post is blocked in the same session
      setImportedSkus(prev => new Set([...prev, form.sku.trim()]));
      setTimeout(() => { onImportSuccess?.(); onClose(); }, 2500);
    } catch (e) {
      showNotif('error', e?.message || 'Failed to publish. The SKU may already exist in the retail store.');
    } finally {
      setSaving(false);
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      width:  '100vw',
      height: '100vh',
      background: G.lightGray,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── NOTIFICATION BANNER ─────────────────────────────────────── */}
      <NotifBanner notif={notif}/>

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <div style={{
        background: G.dark,
        color: G.white,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 14,
        flexShrink: 0,
        borderBottom: `3px solid ${G.forest}`,
      }}>
        {view === 'form' && (
          <button
            onClick={() => setView('list')}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: G.white, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              borderRadius: 0, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <ArrowLeft size={13}/> BACK
          </button>
        )}

        <Package size={17} color={G.sage}/>
        <span style={{
          fontWeight: 700, fontSize: 15, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {view === 'list'
            ? 'Import Product from Store Inventory'
            : `Publish to Retail — ${form.name || ''}`}
        </span>

        {view === 'list' && !isMobile && (
          <span style={{ fontSize: 12, color: G.sage, fontWeight: 600 }}>
            {allItems.length} item{allItems.length !== 1 ? 's' : ''} available
          </span>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none',
            color: G.white, cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={20}/>
        </button>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {view === 'list' && (
          <ListView
            loading={loading}
            items={items}
            allItems={allItems}
            search={search}
            importedSkus={importedSkus}
            onSearch={handleSearch}
            onSelect={openForm}
            isMobile={isMobile}
          />
        )}

        {view === 'form' && (
          <PublishForm
            form={form}
            setF={setF}
            categories={categories}
            imageFile={imageFile}
            imagePreview={imagePreview}
            dragOver={dragOver}
            setDragOver={setDragOver}
            fileRef={fileRef}
            onImageInput={handleImageInput}
            onDrop={handleDrop}
            onRemoveImage={removeImage}
            saving={saving}
            onSubmit={handlePublish}
            onBack={() => setView('list')}
            isMobile={isMobile}
          />
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════════
function ListView({ loading, items, allItems, search, importedSkus, onSearch, onSelect, isMobile }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Search + stats bar */}
      <div style={{
        background: G.forest,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: 10,
            color: G.darkGray, pointerEvents: 'none',
          }}/>
          <input
            value={search}
            onChange={onSearch}
            placeholder="Search by name, Store ID or category…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: 'none', borderRadius: 0, outline: 'none',
              fontSize: 13, background: G.white, color: G.darkGray,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <span style={{ color: G.white, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
          📦 Sales Dept · {allItems.length} item{allItems.length !== 1 ? 's' : ''}
          {search && ` · ${items.length} match${items.length !== 1 ? 'es' : ''}`}
        </span>
      </div>

      {/* Table / Cards */}
      <div style={{ flex: 1, overflowY: 'auto', background: G.white }}>
        {loading ? (
          <CentreMsg>
            <Loader2 size={34} color={G.forest} className="lucide-spin"/>
            <div style={{ marginTop: 14, color: G.darkGray, fontSize: 14, fontWeight: 600 }}>
              Loading store inventory…
            </div>
          </CentreMsg>
        ) : items.length === 0 ? (
          <CentreMsg>
            <Package size={52} color={G.sage}/>
            <div style={{ marginTop: 14, fontWeight: 800, color: G.dark, fontSize: 16 }}>
              No products found
            </div>
            <div style={{ marginTop: 6, color: G.olive, fontSize: 13 }}>
              {allItems.length === 0
                ? 'Store Inventory is empty. Add items there first.'
                : `No match for "${search}".`}
            </div>
          </CentreMsg>
        ) : isMobile ? (
          /* ── Mobile card list ──────────────────────────────────────── */
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((p, i) => (
              <MobileProductCard key={p.id} prod={p} idx={i} onSelect={onSelect} importedSkus={importedSkus} />
            ))}
          </div>
        ) : (
          /* ── Desktop table ─────────────────────────────────────────── */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: G.dark, color: G.white, position: 'sticky', top: 0 }}>
                {['#','PRODUCT NAME','STORE ID','STOCK','UNIT','UNIT PRICE (ETB)','CATEGORY','ACTION'].map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: i === 7 ? 'center' : 'left',
                    fontWeight: 800, fontSize: 11, letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    borderRight: i < 7 ? `1px solid rgba(255,255,255,0.1)` : 'none',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p, idx) => (
                <DesktopProductRow key={p.id} prod={p} idx={idx} onSelect={onSelect} importedSkus={importedSkus} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: G.sage }}>
                <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 800, color: G.dark, fontSize: 12 }}>
                  TOTAL: {items.length} PRODUCT{items.length !== 1 ? 'S' : ''}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: G.dark }}>
                  {items.reduce((s, p) => s + parseFloat(p.quantity_in_store || 0), 0).toLocaleString()}
                </td>
                <td colSpan={1}/>
                <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 800, color: G.dark, fontSize: 12 }}>
                  TOTAL VALUE: ETB {items.reduce((s, p) => s + (parseFloat(p.quantity_in_store ?? p.stock_quantity ?? 0) * parseFloat(p.unit_value || p.price || 0)), 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

// Centred message box
function CentreMsg({ children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 60, textAlign: 'center',
    }}>{children}</div>
  );
}

// ── Desktop table row ─────────────────────────────────────────────────
function DesktopProductRow({ prod, idx, onSelect, importedSkus }) {
  const [hov, setHov] = useState(false);
  const qty   = parseFloat(prod.quantity_in_store ?? prod.stock_quantity ?? 0);
  const price = parseFloat(prod.unit_value || prod.price || 0);
  const isLow = qty <= (parseInt(prod.reorder_level) || 10);
  
  const sku = prod.material_id || `STORE-${prod.id}`;
  const isImported = importedSkus.has(sku);

  const bg = hov ? G.rowHov : idx % 2 === 0 ? G.white : G.rowAlt;

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: bg, borderBottom: `1px solid ${G.sage}`, transition: 'background 0.1s' }}
    >
      <td style={tdS()}>{idx + 1}</td>
      <td style={tdS()}>
        <span style={{ fontWeight: 700, color: G.dark, fontSize: 14 }}>
          {prod.material_name || prod.name}
        </span>
      </td>
      <td style={tdS()}>
        <code style={{
          background: G.dark, color: G.mint,
          padding: '2px 8px', fontSize: 11, fontWeight: 700, borderRadius: 0,
        }}>
          {sku}
        </code>
      </td>
      <td style={tdS()}>
        <span style={{ fontWeight: 700, color: isLow ? G.error : G.dark }}>
          {qty.toLocaleString()}
        </span>
        {isLow && (
          <span style={{
            marginLeft: 6, fontSize: 9, background: G.warning, color: G.white,
            padding: '2px 5px', fontWeight: 800, borderRadius: 0,
          }}>LOW</span>
        )}
      </td>
      <td style={tdS()}>
        <span style={{ color: G.olive, fontWeight: 600 }}>{prod.unit || '—'}</span>
      </td>
      <td style={tdS()}>
        <span style={{ fontWeight: 700, color: G.forest }}>
          {price.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td style={tdS()}>
        {prod.category ? (
          <span style={{
            background: G.sage, color: G.dark, padding: '3px 9px',
            fontSize: 11, fontWeight: 700, borderRadius: 0,
          }}>{prod.category}</span>
        ) : <span style={{ color: '#B0BEC5' }}>—</span>}
      </td>
      <td style={{ ...tdS(), textAlign: 'center' }}>
        <Btn onClick={() => onSelect(prod)} small disabled={isImported} outline={isImported}>
          {isImported ? <><CheckCircle2 size={12}/> IMPORTED</> : <><Plus size={12}/> SELECT</>}
        </Btn>
      </td>
    </tr>
  );
}

const tdS = () => ({
  padding: '11px 14px', verticalAlign: 'middle',
  borderRight: `1px solid ${G.sage}`,
});

// ── Mobile card ───────────────────────────────────────────────────────
function MobileProductCard({ prod, idx, onSelect, importedSkus }) {
  const qty   = parseFloat(prod.quantity_in_store ?? prod.stock_quantity ?? 0);
  const price = parseFloat(prod.unit_value || prod.price || 0);
  
  const sku = prod.material_id || `STORE-${prod.id}`;
  const isImported = importedSkus.has(sku);
  
  return (
    <div style={{
      background: G.white,
      border: `1px solid ${G.sage}`,
      borderLeft: `4px solid ${G.forest}`,
      borderRadius: 0,
      padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: G.dark }}>{prod.material_name || prod.name}</div>
          <code style={{ fontSize: 11, color: G.olive, fontWeight: 600 }}>{sku}</code>
        </div>
        {prod.category && (
          <span style={{
            background: G.sage, color: G.dark, fontSize: 10,
            padding: '2px 8px', fontWeight: 700, borderRadius: 0,
          }}>{prod.category}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: G.darkGray, marginBottom: 12 }}>
        <span>📦 <b>{qty}</b> {prod.unit}</span>
        <span>💰 <b>ETB {price.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</b></span>
      </div>
      <Btn onClick={() => onSelect(prod)} full disabled={isImported} outline={isImported}>
        {isImported ? <><CheckCircle2 size={13}/> IMPORTED</> : <><Plus size={13}/> SELECT & PUBLISH</>}
      </Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLISH FORM VIEW
// ═══════════════════════════════════════════════════════════════════════
function PublishForm({
  form, setF, categories,
  imageFile, imagePreview, dragOver, setDragOver,
  fileRef, onImageInput, onDrop, onRemoveImage,
  saving, onSubmit, onBack, isMobile,
}) {
  const src     = form._source || {};
  const qty     = parseFloat(src.quantity_in_store ?? src.stock_quantity ?? 0);
  const srcPrice = parseFloat(src.unit_value || src.price || 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Source banner */}
      <div style={{
        background: G.forest, color: G.white,
        padding: '9px 20px',
        display: 'flex', flexWrap: 'wrap', gap: '6px 24px',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
        borderBottom: `2px solid ${G.dark}`,
      }}>
        <span>📦 Source: <span style={{ color: G.mint }}>{src.material_name || src.name}</span></span>
        <span>🔑 <span style={{ color: G.mint }}>{src.material_id}</span></span>
        <span>Stock: <span style={{ color: G.mint }}>{qty} {src.unit}</span></span>
        <span>Unit Value: <span style={{ color: G.mint }}>ETB {srcPrice.toLocaleString('en-ET', { minimumFractionDigits: 2 })}</span></span>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr',
        alignItems: 'start',
      }}>

        {/* ── LEFT: All form fields ──────────────────────────────────── */}
        <div style={{
          padding: '22px 24px',
          background: G.white,
          borderRight: isMobile ? 'none' : `2px solid ${G.sage}`,
          borderBottom: isMobile ? `2px solid ${G.sage}` : 'none',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          <SectionHead>Product Information</SectionHead>

          {/* Name + SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <FL required>Product Name</FL>
              <SharpInput
                value={form.name}
                onChange={e => setF('name', e.target.value)}
                placeholder="e.g. TEFF"
              />
            </div>
            <div>
              <FL required hint="From Store ID — edit if needed">SKU</FL>
              <SharpInput
                value={form.sku}
                onChange={e => setF('sku', e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          </div>

          {/* Category + Expiry */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <FL>Retail Category</FL>
              <div style={{ position: 'relative' }}>
                <SharpSelect
                  value={form.category_id}
                  onChange={e => setF('category_id', e.target.value)}
                >
                  <option value="">— Select category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SharpSelect>
                <span style={{
                  position: 'absolute', right: 10, top: 11,
                  pointerEvents: 'none', color: G.olive, fontSize: 13,
                }}>▾</span>
              </div>
            </div>
            <div>
              <FL hint="Leave blank if not applicable">Expiry Date</FL>
              <SharpInput
                type="date"
                value={form.expiry_date}
                onChange={e => setF('expiry_date', e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${G.sage}`, paddingTop: 16 }}>
            <SectionHead>Pricing</SectionHead>
          </div>

          {/* Selling Price + Cost Price */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <FL required hint="Price shown to customers">Selling Price (ETB)</FL>
              <SharpInput
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setF('price', e.target.value)}
                placeholder="0.00"
                style={{ fontWeight: 700, fontSize: 15 }}
              />
            </div>
            <div>
              <FL hint="Pre-filled from store unit value">Cost Price (ETB)</FL>
              <SharpInput
                type="number" min="0" step="0.01"
                value={form.cost_price}
                onChange={e => setF('cost_price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${G.sage}`, paddingTop: 16 }}>
            <SectionHead>Stock Settings</SectionHead>
          </div>

          {/* Stock + Reorder */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <FL hint="Pre-filled from store quantity">Initial Stock Quantity</FL>
              <SharpInput
                type="number" min="0"
                value={form.stock_quantity}
                onChange={e => setF('stock_quantity', e.target.value)}
                disabled={true}
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', color: '#888' }}
              />
            </div>
            <div>
              <FL hint="Alert triggers when stock falls below this">Reorder Level</FL>
              <SharpInput
                type="number" min="0"
                value={form.reorder_level}
                onChange={e => setF('reorder_level', e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${G.sage}`, paddingTop: 16 }}>
            <SectionHead>Description</SectionHead>
          </div>

          {/* Description */}
          <div>
            <FL hint="Optional — shown publicly to customers">Product Description</FL>
            <SharpTextarea
              rows={isMobile ? 3 : 4}
              value={form.description}
              onChange={e => setF('description', e.target.value)}
              placeholder="Describe the product quality, use, origin, benefits…"
            />
          </div>

        </div>

        {/* ── RIGHT: Image + Summary + Actions ──────────────────────── */}
        <div style={{
          padding: '22px 20px',
          background: G.lightGray,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {/* Image Upload */}
          <div>
            <SectionHead>Product Image</SectionHead>

            {imagePreview ? (
              <div>
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview} alt="Product preview"
                    style={{
                      width: '100%', maxHeight: 200,
                      objectFit: 'cover', display: 'block',
                      border: `2px solid ${G.forest}`,
                      borderRadius: 0,
                    }}
                  />
                  <button
                    onClick={onRemoveImage}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none', color: G.white,
                      width: 28, height: 28, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 0,
                    }}
                  >
                    <X size={13}/>
                  </button>
                </div>
                <div style={{
                  marginTop: 6, fontSize: 11, color: G.dark,
                  background: G.sage, padding: '4px 10px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <CheckCircle2 size={12} color={G.forest}/>
                  {imageFile?.name} · {((imageFile?.size || 0) / 1024).toFixed(0)} KB
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { onDrop(e); }}
                style={{
                  border: `2px dashed ${dragOver ? G.forest : G.earth}`,
                  padding: '30px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? '#E8F5E9' : G.white,
                  transition: 'all 0.15s',
                  borderRadius: 0,
                }}
              >
                <Upload size={30} color={G.earth} style={{ marginBottom: 8 }}/>
                <div style={{ fontWeight: 700, color: G.dark, fontSize: 13 }}>
                  Click to upload image
                </div>
                <div style={{ fontSize: 11, color: G.olive, marginTop: 4 }}>or drag & drop</div>
                <div style={{ fontSize: 10, color: '#9E9E9E', marginTop: 6 }}>
                  JPG · PNG · WEBP · max 5 MB
                </div>
              </div>
            )}
            <input
              ref={fileRef} type="file" accept="image/*"
              onChange={onImageInput} style={{ display: 'none' }}
            />
          </div>

          {/* Publish Summary */}
          <div style={{
            background: G.dark,
            borderLeft: `4px solid ${G.lime}`,
            borderRadius: 0,
            padding: 16,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: G.sage,
              textTransform: 'uppercase', letterSpacing: '0.7px',
              marginBottom: 12,
            }}>
              Publish Summary
            </div>
            {[
              { label: 'Name',  val: form.name  || '—' },
              { label: 'SKU',   val: form.sku   || '—', mono: true },
              { label: 'Price', val: `ETB ${parseFloat(form.price || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`, hi: true },
              { label: 'Stock', val: `${form.stock_quantity || 0} units` },
              { label: 'Reorder', val: form.reorder_level || 0 },
              { label: 'Category', val: categories.find(c => String(c.id) === String(form.category_id))?.name || '—' },
              { label: 'Image', val: imageFile ? `✓ ${imageFile.name}` : 'None' },
            ].map(({ label, val, mono, hi }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid rgba(165,214,167,0.15)',
                gap: 8,
              }}>
                <span style={{ color: G.sage, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {label}
                </span>
                <span style={{
                  color: hi ? G.lime : G.white,
                  fontWeight: hi ? 800 : 600,
                  fontSize: hi ? 14 : 12,
                  fontFamily: mono ? 'monospace' : 'inherit',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={onSubmit}
              disabled={saving}
              style={{
                width: '100%', padding: '13px 16px',
                background: saving ? G.olive : G.forest,
                color: G.white, border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 800, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '0.4px', borderRadius: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = G.dark; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = G.forest; }}
            >
              {saving
                ? <><Loader2 size={15} className="lucide-spin"/> PUBLISHING TO RETAIL…</>
                : <><Plus size={15}/> PUBLISH TO RETAIL STORE</>}
            </button>

            <button
              onClick={onBack}
              disabled={saving}
              style={{
                width: '100%', padding: '10px 16px',
                background: 'transparent',
                color: G.dark,
                border: `2px solid ${G.sage}`,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 12,
                letterSpacing: '0.3px', borderRadius: 0,
              }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = G.sage; e.currentTarget.style.color = G.dark; }}}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G.dark; }}
            >
              ← BACK TO PRODUCT LIST
            </button>
          </div>

          {/* Info note */}
          <div style={{
            background: G.sage, padding: '10px 12px',
            display: 'flex', gap: 8, alignItems: 'flex-start',
            borderLeft: `3px solid ${G.forest}`, borderRadius: 0,
          }}>
            <Info size={14} color={G.dark} style={{ flexShrink: 0, marginTop: 1 }}/>
            <span style={{ fontSize: 11, color: G.dark, lineHeight: 1.5, fontWeight: 600 }}>
              Publishing adds this product directly to the <b>Retail Products</b> table.
              It will immediately appear in the public store and POS.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REUSABLE BUTTON  (sharp corners, no radius)
// ═══════════════════════════════════════════════════════════════════════
function Btn({ children, onClick, small, full, outline, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: full ? '100%' : undefined,
        padding: small ? '6px 14px' : '10px 20px',
        background: outline
          ? (hov ? G.sage : 'transparent')
          : (hov ? G.dark : G.emerald),
        color: outline ? G.dark : G.white,
        border: outline ? `2px solid ${G.sage}` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        fontSize: small ? 11 : 13,
        letterSpacing: '0.3px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        borderRadius: 0,
        transition: 'background 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
