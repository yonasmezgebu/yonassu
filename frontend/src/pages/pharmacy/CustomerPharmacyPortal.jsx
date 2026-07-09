import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerPharmacyPortal.css';

const API = '/api/pharmacy-sales';

export default function CustomerPharmacyPortal() {
  const [tab, setTab] = useState('browse'); // browse | prescriptions | track | login | register
  const [drugs, setDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('customer_token'));
  const [cart, setCart] = useState([]);
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  // Auth forms
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ full_name: '', phone: '', password: '', email: '' });
  const [authError, setAuthError] = useState('');

  // Prescription form
  const [rxForm, setRxForm] = useState({ branch_id: '', drug_name_text: '', special_instructions: '', quantity_requested: 1, file_url: '' });
  const [rxSuccess, setRxSuccess] = useState(null);

  useEffect(() => {
    loadDrugs();
    loadBranches();
    if (token) loadPrescriptions();
  }, [token]);

  const loadDrugs = async (q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drugs`, { params: { search: q } });
      setDrugs(res.data.data || []);
    } catch { }
    setLoading(false);
  };

  const loadBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches`);
      setBranches(res.data.data || []);
    } catch { }
  };

  const loadPrescriptions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/prescriptions`, { headers: { Authorization: `Bearer ${token}` } });
      setPrescriptions(res.data.data || []);
    } catch { }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post(`${API}/customer/login`, loginForm);
      const t = res.data.token;
      localStorage.setItem('customer_token', t);
      setToken(t);
      setCustomer(res.data.data);
      setTab('prescriptions');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await axios.post(`${API}/customer/register`, regForm);
      setTab('login');
      setAuthError('Registered successfully. Please log in.');
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    setToken(null);
    setCustomer(null);
    setPrescriptions([]);
    setTab('browse');
  };

  const handleSubmitRx = async (e) => {
    e.preventDefault();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/prescriptions`, rxForm, { headers });
      setRxSuccess(res.data.data);
      setRxForm({ branch_id: '', drug_name_text: '', special_instructions: '', quantity_requested: 1, file_url: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prescription');
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackResult(null);
    try {
      const res = await axios.get(`${API}/prescriptions/track/${trackCode}`);
      setTrackResult(res.data.data);
    } catch (err) {
      setTrackResult({ error: err.response?.data?.message || 'Not found' });
    }
  };

  const addToCart = (drug) => {
    setCart(c => {
      const ex = c.find(i => i.id === drug.id);
      if (ex) return c.map(i => i.id === drug.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...drug, qty: 1 }];
    });
  };

  const statusColor = (s) => {
    const m = { SUBMITTED: '#f59e0b', READY_FOR_PICKUP: '#3b82f6', FULFILLED: '#10b981', CANCELLED: '#ef4444' };
    return m[s] || '#6b7280';
  };

  return (
    <div className="cp-portal">
      {/* Header */}
      <header className="cp-header">
        <div className="cp-header-inner">
          <div className="cp-brand">
            <span className="cp-brand-icon">💊</span>
            <div>
              <h1 className="cp-brand-name">SUTANA Pharmacy</h1>
              <p className="cp-brand-sub">Ethiopia's trusted healthcare partner</p>
            </div>
          </div>
          <nav className="cp-nav">
            {['browse', 'prescriptions', 'track'].map(t => (
              <button key={t} className={`cp-nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'browse' ? '🔍 Medicines' : t === 'prescriptions' ? '📋 Prescriptions' : '📍 Track Order'}
              </button>
            ))}
          </nav>
          <div className="cp-auth-area">
            {token ? (
              <div className="cp-user-pill">
                <span>👤 {customer?.name || 'Account'}</span>
                <button className="cp-logout-btn" onClick={handleLogout}>Sign Out</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="cp-btn-outline" onClick={() => setTab('login')}>Log In</button>
                <button className="cp-btn-primary" onClick={() => setTab('register')}>Register</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="cp-main">
        {/* BROWSE TAB */}
        {tab === 'browse' && (
          <div className="cp-browse">
            <div className="cp-browse-hero">
              <h2>Find Your Medicine</h2>
              <p>Search our stock of available pharmaceuticals</p>
              <div className="cp-search-row">
                <input
                  className="cp-search"
                  placeholder="Search by drug name…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadDrugs(e.target.value); }}
                />
              </div>
            </div>
            {loading ? (
              <div className="cp-loading">Loading medicines…</div>
            ) : (
              <div className="cp-drug-grid">
                {drugs.length === 0 && <p className="cp-empty">No medicines found matching your search.</p>}
                {drugs.map(d => (
                  <div key={d.id} className="cp-drug-card">
                    <div className="cp-drug-header">
                      <span className="cp-drug-icon">💊</span>
                      {d.requires_prescription && <span className="cp-rx-badge">Rx Required</span>}
                    </div>
                    <h3 className="cp-drug-name">{d.name}</h3>
                    {d.strength && <p className="cp-drug-strength">{d.strength} · {d.unit}</p>}
                    {d.category && <span className="cp-drug-cat">{d.category}</span>}
                    {d.therapeutic_use && <p className="cp-drug-use">{d.therapeutic_use}</p>}
                    <div className="cp-drug-footer">
                      <span className="cp-drug-price">
                        ETB {parseFloat(d.unit_price || 0).toFixed(2)}
                        {d.vat_rate > 0 && <small> (+{d.vat_rate}% VAT)</small>}
                      </span>
                      {d.requires_prescription ? (
                        <button className="cp-btn-rx" onClick={() => setTab('prescriptions')}>
                          Submit Prescription
                        </button>
                      ) : (
                        <button className="cp-btn-primary" onClick={() => addToCart(d)}>
                          {cart.find(i => i.id === d.id) ? `In Cart (${cart.find(i => i.id === d.id).qty})` : 'Visit Pharmacy'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {tab === 'prescriptions' && (
          <div className="cp-rx-tab">
            <h2 className="cp-section-title">📋 Submit a Prescription</h2>
            <div className="cp-rx-layout">
              {/* Submit form */}
              <div className="cp-card">
                <h3>New Prescription Request</h3>
                {rxSuccess ? (
                  <div className="cp-success-box">
                    <div className="cp-success-icon">✅</div>
                    <h4>Prescription Submitted!</h4>
                    <p>Your reference code:</p>
                    <div className="cp-ref-code">{rxSuccess.reference_code}</div>
                    <p className="cp-ref-hint">Save this code to track your prescription status.</p>
                    <button className="cp-btn-primary" onClick={() => setRxSuccess(null)}>Submit Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRx} className="cp-rx-form">
                    <label>Branch <span className="req">*</span>
                      <select value={rxForm.branch_id} onChange={e => setRxForm(f => ({ ...f, branch_id: e.target.value }))} required>
                        <option value="">Select branch</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </label>
                    <label>Medicine Name (if known)
                      <input placeholder="e.g. Amoxicillin 500mg" value={rxForm.drug_name_text}
                        onChange={e => setRxForm(f => ({ ...f, drug_name_text: e.target.value }))} />
                    </label>
                    <label>Quantity Requested
                      <input type="number" min="1" value={rxForm.quantity_requested}
                        onChange={e => setRxForm(f => ({ ...f, quantity_requested: parseInt(e.target.value) }))} />
                    </label>
                    <label>Prescription File URL <span className="req">*</span>
                      <input placeholder="https://… or ask staff to scan" value={rxForm.file_url} required
                        onChange={e => setRxForm(f => ({ ...f, file_url: e.target.value }))} />
                    </label>
                    <label>Special Instructions
                      <textarea rows="3" placeholder="Any additional notes for the pharmacist"
                        value={rxForm.special_instructions}
                        onChange={e => setRxForm(f => ({ ...f, special_instructions: e.target.value }))} />
                    </label>
                    <button type="submit" className="cp-btn-primary cp-btn-full">Submit Prescription</button>
                    {!token && <p className="cp-hint">💡 <button className="cp-link" onClick={() => setTab('login')}>Log in</button> to track your submission history.</p>}
                  </form>
                )}
              </div>

              {/* Prescription history */}
              {token && (
                <div className="cp-card">
                  <h3>My Submissions</h3>
                  {prescriptions.length === 0 ? (
                    <p className="cp-empty">No prescriptions submitted yet.</p>
                  ) : (
                    <div className="cp-rx-list">
                      {prescriptions.map(rx => (
                        <div key={rx.id} className="cp-rx-item">
                          <div className="cp-rx-ref">{rx.reference_code}</div>
                          <div className="cp-rx-meta">
                            <span>{rx.branch_name}</span>
                            <span style={{ color: statusColor(rx.status), fontWeight: 600 }}>{rx.status}</span>
                          </div>
                          <div className="cp-rx-date">{new Date(rx.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRACK TAB */}
        {tab === 'track' && (
          <div className="cp-track-tab">
            <div className="cp-card cp-card-center">
              <div className="cp-track-icon">📍</div>
              <h2>Track Your Prescription</h2>
              <p>Enter your reference code to check the current status</p>
              <form onSubmit={handleTrack} className="cp-track-form">
                <input className="cp-track-input" placeholder="e.g. RX-20260705-AB12"
                  value={trackCode} onChange={e => setTrackCode(e.target.value)} required />
                <button type="submit" className="cp-btn-primary">Track Now</button>
              </form>
              {trackResult && !trackResult.error && (
                <div className="cp-track-result">
                  <div className="cp-status-badge" style={{ background: statusColor(trackResult.status) }}>
                    {trackResult.status}
                  </div>
                  <p><strong>Branch:</strong> {trackResult.branch_name}</p>
                  <p><strong>Submitted:</strong> {new Date(trackResult.created_at).toLocaleString()}</p>
                  {trackResult.status === 'READY_FOR_PICKUP' && (
                    <div className="cp-pickup-notice">🎉 Your prescription is ready! Please come to {trackResult.branch_name}.</div>
                  )}
                </div>
              )}
              {trackResult?.error && <div className="cp-error-box">{trackResult.error}</div>}
            </div>
          </div>
        )}

        {/* LOGIN TAB */}
        {tab === 'login' && (
          <div className="cp-auth-tab">
            <div className="cp-auth-card">
              <h2>Customer Login</h2>
              {authError && <div className={`cp-auth-msg ${authError.includes('success') ? 'success' : 'error'}`}>{authError}</div>}
              <form onSubmit={handleLogin}>
                <label>Phone Number
                  <input type="tel" placeholder="09XXXXXXXX" value={loginForm.phone}
                    onChange={e => setLoginForm(f => ({ ...f, phone: e.target.value }))} required />
                </label>
                <label>Password
                  <input type="password" value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                </label>
                <button type="submit" className="cp-btn-primary cp-btn-full">Sign In</button>
              </form>
              <p className="cp-switch">Don't have an account? <button className="cp-link" onClick={() => setTab('register')}>Register</button></p>
            </div>
          </div>
        )}

        {/* REGISTER TAB */}
        {tab === 'register' && (
          <div className="cp-auth-tab">
            <div className="cp-auth-card">
              <h2>Create Account</h2>
              {authError && <div className="cp-auth-msg error">{authError}</div>}
              <form onSubmit={handleRegister}>
                <label>Full Name <span className="req">*</span>
                  <input placeholder="Your full name" value={regForm.full_name}
                    onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))} required />
                </label>
                <label>Phone Number <span className="req">*</span>
                  <input type="tel" placeholder="09XXXXXXXX" value={regForm.phone}
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} required />
                </label>
                <label>Email (optional)
                  <input type="email" placeholder="email@example.com" value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label>Password <span className="req">*</span>
                  <input type="password" value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required />
                </label>
                <button type="submit" className="cp-btn-primary cp-btn-full">Create Account</button>
              </form>
              <p className="cp-switch">Already registered? <button className="cp-link" onClick={() => setTab('login')}>Sign In</button></p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
