import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import {
  Truck, User, Mail, Phone, Building2, Tag, MapPin, FileText,
  CheckCircle2, Clock, AlertCircle, ShieldCheck, Star, Package, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';
import styles from './CustomerBecomeSupplier.module.css';

const CATEGORIES = [
  { label: 'Medicine & Pharmacy', icon: '💊' },
  { label: 'Stationery & Office', icon: '📎' },
  { label: 'Printing Materials', icon: '🖨️' },
  { label: 'Food & Agriculture', icon: '🌾' },
  { label: 'Electronics & IT', icon: '💻' },
  { label: 'Construction', icon: '🏗️' },
  { label: 'Furniture', icon: '🪑' },
  { label: 'Cleaning & Hygiene', icon: '🧹' },
  { label: 'Vehicle & Equipment', icon: '🚜' },
  { label: 'Textile & Uniforms', icon: '👕' },
  { label: 'Other', icon: '📦' },
];

const BENEFITS = [
  { icon: <ShieldCheck size={20} color="hsl(var(--primary))" />, title: 'Verified Listings', desc: 'Your profile appears in our official supplier directory' },
  { icon: <Star size={20} color="hsl(36 100% 40%)" />, title: 'Direct Outreach', desc: 'Purchase managers contact you directly for purchasing' },
  { icon: <Package size={20} color="hsl(var(--secondary))" />, title: 'All Categories', desc: 'Register under any product or service category' },
  { icon: <CheckCircle2 size={20} color="hsl(200 90% 40%)" />, title: 'Instant Activation', desc: 'Profile goes live immediately after registration' },
];

const CustomerBecomeSupplier = () => {
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { user } = useAuth();

  const [form, setForm] = useState({
    company_name: '',
    category: '',
    business_address: '',
    description: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, supplierRes] = await Promise.all([
          apiClient.get('/customer/profile'),
          apiClient.get('/suppliers/me'),
        ]);
        const customer = profileRes.data?.data?.customer || profileRes.data?.customer || {};
        setUserProfile(customer);
        setSupplierProfile(supplierRes.data?.data || null);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { showToast('Please select a product/service category.', 'error'); return; }
    if (!form.business_address.trim()) { showToast('Business address is required.', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/suppliers', form);
      setSupplierProfile(res.data?.data);
      showToast('You are now registered as a supplier! Companies can contact you to purchase your products.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (val) => val || '—';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.spinnerBox}><SegmentedSpinner size={36} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Truck size={40} color="currentColor" />
          </div>
          <div className={styles.heroText}>
            <h1>{supplierProfile ? 'My Supplier Profile' : 'Become a Supplier'}</h1>
            <p>
              {supplierProfile
                ? 'Your supplier profile is live. Purchase managers can see and contact you for procurement needs.'
                : 'Register as a supplier to appear in our official supplier directory. Purchase managers will reach out to you directly for products and services.'}
            </p>
          </div>
        </div>

        {/* Benefits (only on registration form) */}
        {!supplierProfile && (
          <div className={styles.benefits}>
            {BENEFITS.map((b, i) => (
              <div className={styles.benefit} key={i}>
                <div className={styles.benefitIcon}>{b.icon}</div>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        <div className={styles.card}>
          {supplierProfile ? (
            /* ── Read-only profile view ── */
            <>
              <div className={styles.cardHeader}>
                <CheckCircle2 size={22} color="hsl(var(--primary))" />
                <div>
                  <h2>Supplier Profile</h2>
                  <p>Your information visible to Purchase Managers</p>
                </div>
              </div>
              <div className={styles.profileView}>
                <div className={styles.profileBanner}>
                  <ShieldCheck size={36} color="hsl(var(--primary))" />
                  <div>
                    <h3>Profile Active</h3>
                    <p>You are listed in the Supplier Directory. Expect direct outreach from the Purchase Department.</p>
                  </div>
                </div>

                <div className={styles.profileGrid}>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Full Name</p>
                    <div className={styles.profileItemValue}>
                      {supplierProfile.profile_photo ? (
                        <img src={supplierProfile.profile_photo} alt={supplierProfile.full_name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <User size={14} color="hsl(var(--muted-foreground))" />
                      )}
                      {fmt(supplierProfile.full_name)}
                    </div>
                  </div>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Email</p>
                    <p className={styles.profileItemValue}><Mail size={14} color="hsl(var(--muted-foreground))" />{fmt(supplierProfile.email)}</p>
                  </div>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Phone</p>
                    <p className={styles.profileItemValue}><Phone size={14} color="hsl(var(--muted-foreground))" />{fmt(supplierProfile.phone)}</p>
                  </div>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Company Name</p>
                    <p className={styles.profileItemValue}><Building2 size={14} color="hsl(var(--muted-foreground))" />{fmt(supplierProfile.company_name)}</p>
                  </div>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Category</p>
                    <p className={styles.profileItemValue}><Tag size={14} color="hsl(var(--muted-foreground))" />{fmt(supplierProfile.category)}</p>
                  </div>
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Status</p>
                    <p className={styles.profileItemValue}>
                      <span className={`${styles.statusBadge} ${supplierProfile.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                        <CheckCircle2 size={12} />
                        {supplierProfile.status}
                      </span>
                    </p>
                  </div>
                  <div className={styles.profileItem} style={{ gridColumn: '1 / -1' }}>
                    <p className={styles.profileItemLabel}>Business Address</p>
                    <p className={styles.profileItemValue}><MapPin size={14} color="hsl(var(--muted-foreground))" />{fmt(supplierProfile.business_address)}</p>
                  </div>
                  {supplierProfile.description && (
                    <div className={styles.profileItem} style={{ gridColumn: '1 / -1' }}>
                      <p className={styles.profileItemLabel}>Description</p>
                      <p className={styles.profileItemValue} style={{ display: 'block', fontSize: '0.875rem' }}>
                        {supplierProfile.description}
                      </p>
                    </div>
                  )}
                  <div className={styles.profileItem}>
                    <p className={styles.profileItemLabel}>Registered On</p>
                    <p className={styles.profileItemValue}><Clock size={14} color="hsl(var(--muted-foreground))" />
                      {supplierProfile.created_at ? new Date(supplierProfile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Registration form ── */
            <>
              <div className={styles.cardHeader}>
                <Truck size={22} color="hsl(var(--primary))" />
                <div>
                  <h2>Supplier Registration</h2>
                  <p>Your account details are auto-filled — just add your business information</p>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles.form}>
                  {/* Auto-filled section */}
                  <p className={styles.sectionLabel}><User size={12} />Account Details (Auto-filled)</p>

                  {/* ── Profile Avatar Block ── */}
                  {(() => {
                    const fullName = userProfile?.name || userProfile?.full_name || '';
                    const initials = fullName.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || '?';
                    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
                    const rawPic = userProfile?.profile_picture || user?.profilePhoto;
                    const picUrl = rawPic
                      ? (rawPic.startsWith('http') ? rawPic : `${baseUrl}${rawPic.startsWith('/') ? rawPic : `/${rawPic}`}`)
                      : null;
                    return (
                      <div className={styles.avatarWrap}>
                        <div className={styles.avatar}>
                          {picUrl
                            ? <img src={picUrl} alt="Profile" className={styles.avatarImg} />
                            : initials
                          }
                        </div>
                        <div className={styles.avatarInfo}>
                          <p className={styles.avatarName}>{fullName || 'Your Name'}</p>
                          <span className={styles.avatarRole}>Customer</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <p className={styles.label}><User size={14} />Full Name</p>
                      <div className={styles.readonlyBox}>
                        {userProfile?.name || userProfile?.full_name || '—'}
                        <span className={styles.readonlyBadge}>AUTO</span>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <p className={styles.label}><Mail size={14} />Email</p>
                      <div className={styles.readonlyBox}>
                        {userProfile?.email || '—'}
                        <span className={styles.readonlyBadge}>AUTO</span>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <p className={styles.label}><Phone size={14} />Phone</p>
                      <div className={styles.readonlyBox}>
                        {userProfile?.phone || '—'}
                        <span className={styles.readonlyBadge}>AUTO</span>
                      </div>
                    </div>
                  </div>

                  {/* Business section */}
                  <p className={styles.sectionLabel}><Building2 size={12} />Business Details</p>
                  <div className={styles.fieldFull}>
                    <p className={styles.label}>
                      <Building2 size={14} />Company / Business Name 
                      <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(optional — leave blank if individual)</span>
                    </p>
                    <input
                      className={styles.input}
                      placeholder="e.g. AT Traders PLC, Almaz Supplies..."
                      value={form.company_name}
                      onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <p className={styles.label}>
                      <Tag size={14} />Product / Service Category <span style={{ color: 'hsl(0 72% 51%)' }}>*</span>
                    </p>
                    <div className={styles.categoryGrid}>
                      {CATEGORIES.map(cat => (
                        <div
                          key={cat.label}
                          className={`${styles.categoryChip} ${form.category === cat.label ? styles.categoryChipSelected : ''}`}
                          onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </div>
                      ))}
                    </div>
                    <input
                      className={styles.input}
                      placeholder="Or type a custom category..."
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ marginTop: '0.5rem' }}
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <p className={styles.label}>
                      <MapPin size={14} />Business Address <span style={{ color: 'hsl(0 72% 51%)' }}>*</span>
                    </p>
                    <input
                      className={styles.input}
                      placeholder="e.g. Bole, Addis Ababa, Ethiopia"
                      value={form.business_address}
                      onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.fieldFull}>
                    <p className={styles.label}>
                      <FileText size={14} />Description 
                      <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>(optional)</span>
                    </p>
                    <textarea
                      className={styles.textarea}
                      placeholder="Briefly describe what you can supply — e.g. 'We supply pharmaceutical products and medical consumables wholesale...'"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.submitRow}>
                  <p>Your profile will be immediately visible to Purchase Managers.</p>
                  <button className={styles.btnPrimary} type="submit" disabled={submitting}>
                    {submitting ? <SegmentedSpinner size={16} /> : <ArrowRight size={16} />}
                    {submitting ? 'Registering...' : 'Register as Supplier'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default CustomerBecomeSupplier;
