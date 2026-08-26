import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { loadVatSafe, getVatForItem } from '../../services/vatService';
import { PublicNav } from './PublicNavFooter';
import { Store, ShoppingCart, Search, Package, Plus, Minus, Trash2, X, CheckCircle, Star, Zap, TrendingUp, ArrowRight, Truck, Phone, Mail, FileText, Shield, Info, CreditCard, Box, ChevronDown, ChevronUp, Clock, Banknote, User, LogIn, UserPlus, AlignLeft, UploadCloud, AlertTriangle } from 'lucide-react';
import retailStoreHero from '../../assets/hero-section/retail store.jpg';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.rsp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  min-height: 100vh;
  line-height: 1.625;
}

/* Container */
.rsp-container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* Hero */
.rsp-hero {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 400px;
  background-color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}
.rsp-hero-content {
  position: relative;
  z-index: 10;
  padding: 0 1.5rem;
}
.rsp-hero-title {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #ffffff;
}
@media (min-width: 768px) {
  .rsp-hero-title { font-size: 3.75rem; }
}
.rsp-hero-title span {
  color: hsl(var(--primary));
}

.rsp-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius);
  padding: 0.5rem 1rem;
  margin: 0 auto;
  transition: all 0.2s;
}
.rsp-search:focus-within {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
}
.rsp-search input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
}
.rsp-search input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

/* Toolbar */
.rsp-toolbar {
  background-color: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  padding: 1rem 0;
  position: sticky;
  top: 68px;
  z-index: 40;
}
.rsp-toolbar-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.rsp-cat-pill {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.rsp-cat-pill:hover {
  background-color: hsl(var(--muted));
  border-color: hsl(var(--primary));
}
.rsp-cat-pill.active {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

/* Main */
.rsp-main {
  padding-top: 3rem;
  padding-bottom: 5rem;
}

/* Grid & Cards */
.rsp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.rsp-card {
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}
.rsp-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
.rsp-card-img-wrap {
  aspect-ratio: 4 / 3;
  width: 100%;
  overflow: hidden;
  background-color: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.rsp-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.rsp-card-oos {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}
.rsp-card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.rsp-card-name {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.5rem;
  color: hsl(var(--foreground));
}
.rsp-card-desc {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 1.5rem;
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rsp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.rsp-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--primary));
}
.rsp-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: var(--radius);
  transition: background-color 0.2s ease-in-out;
  border: none;
  cursor: pointer;
}
.rsp-add-btn:hover:not(:disabled) {
  background-color: hsl(var(--primary) / 0.9);
}
.rsp-add-btn:disabled {
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  cursor: not-allowed;
}

/* Shimmer */
.rsp-shimmer {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmerAnim 1.5s infinite linear;
  border-radius: 0.75rem;
  height: 320px;
}
@keyframes shimmerAnim {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Cart FAB */
.rsp-cart-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  cursor: pointer;
  z-index: 50;
  transition: transform 0.2s ease;
  border: none;
}
.rsp-cart-fab:hover {
  transform: scale(1.05);
}
.rsp-cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ef4444;
  color: #ffffff;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid hsl(var(--background));
}

/* Modal / Overlay */
.rsp-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 50;
  padding: 5rem 1.5rem 2rem;
  overflow-y: auto;
}
.rsp-modal {
  background-color: hsl(var(--background));
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  overflow: hidden;
  margin: auto;
}
.rsp-modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: hsl(var(--muted));
}
.rsp-modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}
.rsp-modal-subtitle {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
}
.rsp-close-btn {
  background: transparent;
  border: none;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rsp-close-btn:hover {
  background-color: hsl(var(--border));
  color: hsl(var(--foreground));
}
.rsp-modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.rsp-section-divider {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.rsp-section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: hsl(var(--border));
}

/* Forms & Inputs */
.rsp-form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .rsp-form-row {
    grid-template-columns: 1fr 1fr;
  }
}
.rsp-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.rsp-form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.rsp-form-label span {
  color: hsl(var(--muted-foreground));
  font-weight: 400;
}
.rsp-form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  background-color: transparent;
  font-size: 1rem;
  color: hsl(var(--foreground));
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rsp-form-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
}
.rsp-form-input:disabled {
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  cursor: not-allowed;
}

/* Cart Items */
.rsp-ci {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid hsl(var(--border));
}
.rsp-ci:last-child {
  border-bottom: none;
}
.rsp-ci-img {
  width: 4rem;
  height: 4rem;
  background-color: hsl(var(--muted));
  border-radius: var(--radius);
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rsp-ci-info {
  flex: 1;
}
.rsp-ci-name {
  font-size: 1rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
}
.rsp-ci-price {
  font-size: 0.875rem;
  color: hsl(var(--primary));
  font-weight: 500;
}
.rsp-ci-ctrl {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.rsp-ci-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.rsp-ci-btn:hover {
  background-color: hsl(var(--muted));
}

/* Price summary */
.rsp-price-summary {
  background-color: hsl(var(--muted));
  padding: 1.5rem;
  border-radius: var(--radius);
}
.rsp-price-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  padding: 0.25rem 0;
}
.rsp-price-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  border-top: 1px solid hsl(var(--border));
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

/* Modal Footer */
.rsp-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid hsl(var(--border));
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background-color: hsl(var(--background));
}
.rsp-cancel-btn {
  padding: 0.5rem 1.5rem;
  background-color: transparent;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  color: hsl(var(--foreground));
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.rsp-cancel-btn:hover {
  background-color: hsl(var(--muted));
}
.rsp-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.rsp-submit-btn:hover:not(:disabled) {
  background-color: hsl(var(--primary) / 0.9);
}
.rsp-submit-btn:disabled {
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  cursor: not-allowed;
}

/* Success Body */
.rsp-success-body {
  padding: 3rem 1.5rem;
  text-align: center;
}
.rsp-success-emoji {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}
.rsp-success-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--primary));
  margin-bottom: 0.5rem;
}
.rsp-success-sub {
  color: hsl(var(--muted-foreground));
  margin-bottom: 1.5rem;
}
.rsp-view-orders-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
  border-radius: var(--radius);
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.rsp-view-orders-btn:hover {
  background-color: hsl(var(--primary) / 0.9);
}

/* Section wrappers */
.rsp-section {
  padding: 4rem 0;
}
.rsp-section-muted {
  padding: 4rem 0;
  background-color: hsl(var(--muted));
}
.rsp-section-title {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  color: hsl(var(--foreground));
  margin-bottom: 0.5rem;
  text-align: center;
}
.rsp-section-sub {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 2rem;
  text-align: center;
}
.rsp-section-sub-center {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 2rem;
  text-align: center;
}

/* How to Buy */
.rsp-how-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
.rsp-how-card {
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 2rem 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.rsp-how-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
.rsp-how-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius);
  background-color: hsl(var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.rsp-how-title {
  font-size: 1rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.5rem;
}
.rsp-how-desc {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.625;
}

/* Delivery & Payment */
.rsp-dp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
.rsp-dp-card {
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 2rem 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
.rsp-dp-head {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.rsp-dp-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: hsl(var(--muted));
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
}
.rsp-dp-row-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius);
  background-color: hsl(var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rsp-dp-row-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
}
.rsp-dp-row-desc {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
}

/* FAQs */
.rsp-faq-item {
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  margin-bottom: 0.5rem;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}
.rsp-faq-item:hover {
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.06);
}
.rsp-faq-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: hsl(var(--foreground));
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  gap: 1rem;
  font-family: inherit;
  transition: color 0.2s ease;
}
.rsp-faq-btn:hover {
  color: hsl(var(--primary));
}
.rsp-faq-ans {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.75;
  padding: 0 1.5rem 1.25rem;
}

/* No results */
.rsp-no-results {
  text-align: center;
  padding: 5rem 1.5rem;
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  margin-top: 1.5rem;
}
.rsp-no-results h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.rsp-no-results p {
  color: hsl(var(--muted-foreground));
}

/* Product heading */
.rsp-products-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: 1.5rem;
  text-align: center;
}

/* Hero overlay */
.rsp-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}
.rsp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 76, 53, 0.7) 100%);
  z-index: 1;
}
.rsp-hero-search-wrap {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}
`;

const RetailStorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [cartOpen, setCartOpen]         = useState(false);
  const [cartItems, setCartItems]       = useState([]);
  const [vatCtx, setVatCtx]             = useState(null);
  useEffect(() => { loadVatSafe().then(setVatCtx).catch(() => {}); }, []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [orderForm, setOrderForm]       = useState({
    delivery_type: 'pickup',
    delivery_address: '',
    notes: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });

  // ── Payment proof (payment ID OR screenshot — at least one required) ──
  const [paymentMethod, setPaymentMethod]    = useState('bank_transfer');
  const [paymentRef, setPaymentRef]          = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const [paymentError, setPaymentError]      = useState('');
  const [formError, setFormError]            = useState('');
  const paymentProofInputRef                 = useRef(null);
  const submitErrorRef                       = useRef(null);

  const scrollFormError = () => {
    setTimeout(() => {
      submitErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handlePaymentProofChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPaymentProofFile(file);
    setPaymentProofPreview(URL.createObjectURL(file));
    setPaymentError('');
    setFormError('');
  };
  const clearPaymentProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview('');
    if (paymentProofInputRef.current) paymentProofInputRef.current.value = '';
  };

  const [openFaq, setOpenFaq] = useState(null);

  const HOW_TO_BUY = [
    { n: '1', title: 'Buy Direct (In-Stock)', desc: 'Browse available products, add to cart, and check out instantly.', icon: Package },
    { n: '2', title: 'Order from Supplier', desc: 'Request out-of-stock items. We source directly from trusted suppliers.', icon: Truck },
  ];

  const FAQS = [
    { q: 'How do supplier orders work?', a: 'If an item is out of stock, you can still request it. We will confirm the price and delivery timeline from our suppliers before finalizing your order.' },
    { q: 'What is the wait time for supplier orders?', a: 'Supplier orders typically take 3-7 business days depending on availability and logistics.' },
    { q: 'What if a requested item is unavailable?', a: 'If we cannot source the item from our suppliers, your request will be cancelled and any deposits fully refunded.' },
  ];

  // ── On mount: load user, cart, products, categories; auto-open modal if returning from login
  useEffect(() => {
    // 1. Read user from localStorage synchronously
    let parsedUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        parsedUser = JSON.parse(raw);
        setUser(parsedUser);
        setOrderForm(prev => ({
          ...prev,
          customer_name: parsedUser.fullName || parsedUser.full_name || '',
          customer_email: parsedUser.email || '',
          customer_phone: parsedUser.phone || '',
        }));
      }
    } catch {}

    // 2. Load products and categories (public — no auth needed)
    axios.get('/retail/products')
      .then(r => setProducts(Array.isArray(r?.data?.products) ? r.data.products : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    axios.get('/retail/categories')
      .then(r => setCategories(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});

    // 3. Handle pending cart items from before login, then auto-open modal
    if (parsedUser) {
      const pendingProductId = location.state?.pendingRetailCartItem || sessionStorage.getItem('pendingRetailCartItem');
      const shouldOpenCart = location.state?.openRetailCart || sessionStorage.getItem('openRetailCart') === 'true';
      
      const loadCartAndOpen = () => {
        axios.get('/retail/cart')
          .then(r => {
            const items = r?.data?.items || [];
            setCartItems(Array.isArray(items) ? items : []);
            if (shouldOpenCart) {
              sessionStorage.removeItem('openRetailCart');
              setCartOpen(true);
              // Clean up location state so a refresh doesn't trigger it again
              window.history.replaceState({}, document.title);
            }
          })
          .catch(() => {
            if (shouldOpenCart) {
              sessionStorage.removeItem('openRetailCart');
              setCartOpen(true);
              window.history.replaceState({}, document.title);
            }
          });
      };

      if (pendingProductId) {
        // User clicked "Add" before logging in — add the item now!
        sessionStorage.removeItem('pendingRetailCartItem');
        axios.post('/retail/cart/add', { product_id: pendingProductId, quantity: 1 })
          .then(() => loadCartAndOpen())
          .catch(() => loadCartAndOpen()); // Still load cart if add fails
      } else {
        // Normal load
        loadCartAndOpen();
      }
    } else {
      // Not logged in — still check the flag (shouldn't happen, but be safe)
      if (sessionStorage.getItem('openRetailCart') === 'true') {
        sessionStorage.removeItem('openRetailCart');
        sessionStorage.removeItem('pendingRetailCartItem');
      }
    }
  }, [location]); // Depend on location so return from login triggers it

  // Reload cart whenever user changes (e.g. login/logout)
  const loadCart = () => {
    axios.get('/retail/cart')
      .then(r => setCartItems(Array.isArray(r?.data?.items) ? r.data.items : []))
      .catch(() => {});
  };

  const addToCart = async (product) => {
    setSelectedProduct(product);
    setOrderSuccess(null);
    if (!user) {
      sessionStorage.setItem('openRetailCart', 'true');
      sessionStorage.setItem('pendingRetailCartItem', product.id.toString());
      navigate('/login', { state: { from: '/services/retail' } });
      return;
    }
    try {
      await axios.post('/retail/cart/add', { product_id: product.id, quantity: 1 });
      loadCart();
      setCartOpen(true);
    } catch (err) {
      const msg = err?.message || 'Failed to add to cart';
      alert(msg);
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return removeItem(itemId);
    try {
      await axios.put('/retail/cart/item/' + itemId, { quantity: newQty });
      loadCart();
    } catch (_) {}
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete('/retail/cart/item/' + itemId);
      loadCart();
    } catch (_) {}
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    // Manual validation (form uses noValidate so the button always responds)
    const missing = [];
    if (!(orderForm.customer_name || '').trim()) missing.push('Full Name');
    if (!(orderForm.customer_email || '').trim()) missing.push('Email');
    if (!(orderForm.customer_phone || '').trim()) missing.push('Phone Number');
    if (missing.length) {
      setFormError(`Please fill in: ${missing.join(', ')}`);
      scrollFormError();
      return;
    }
    // Payment proof — at least one of Payment ID or Screenshot is required
    const ref = paymentRef.trim();
    if (!ref && !paymentProofFile) {
      setPaymentError('Payment ID or Payment Screenshot is required — please provide at least one.');
      setFormError('Payment ID or Payment Screenshot is required — please provide at least one.');
      scrollFormError();
      return;
    }
    setPlacingOrder(true);
    setPaymentError('');
    setFormError('');
    try {
      const formData = new FormData();
      Object.entries(orderForm).forEach(([k, v]) => {
        if (k === 'delivery_type') return; // appended once below, computed from address
        formData.append(k, v);
      });
      formData.append('delivery_type', orderForm.delivery_address ? 'delivery' : 'pickup');
      formData.append('payment_method', paymentMethod);
      formData.append('payment_ref', ref);
      if (paymentProofFile) formData.append('payment_proof', paymentProofFile);

      const res = await axios.post('/retail/orders/place', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const invoice = res.data?.data?.invoice_number || res.data?.invoice_number || 'N/A';
      setOrderSuccess(invoice);
      setCartItems([]);
      clearPaymentProof();
    } catch (err) {
      const msg = err?.message || 'Failed to place order. Please try again.';
      setFormError(msg);
      scrollFormError();
      alert(msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || String(p.category_id) === String(catFilter);
    return matchSearch && matchCat && p.is_active !== 0 && p.is_active !== false;
  });

  const cartCount = cartItems.reduce((a, b) => a + (b.quantity || 0), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  let cartVat = 0;
  if (vatCtx) {
    cartItems.forEach((item) => {
      const r = getVatForItem(vatCtx, 'retail', item.product_id, parseFloat(item.price) * item.quantity);
      cartVat += r.vat;
    });
  }

  const imgSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : 'http://localhost:5000' + url;
  };

  return (
    <div className="rsp-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ─── Hero Section ─── */}
      <div className="rsp-hero">
        <div className="rsp-hero-bg" style={{ backgroundImage: `url("${retailStoreHero}")` }} />
        <div className="rsp-hero-overlay" />
        <div className="rsp-hero-content">
          <h1 className="rsp-hero-title">
            Shop Premium <span>Commercial</span> Goods
          </h1>
          <div className="rsp-hero-search-wrap">
            <div className="rsp-search">
              <Search size={18} color="rgba(255,255,255,0.8)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Toolbar ─── */}
      <div className="rsp-toolbar">
        <div className="rsp-container">
          <div className="rsp-toolbar-inner">
            <button
              className={'rsp-cat-pill' + (catFilter === 'all' ? ' active' : '')}
              onClick={() => setCatFilter('all')}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={'rsp-cat-pill' + (String(catFilter) === String(c.id) ? ' active' : '')}
                onClick={() => setCatFilter(String(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="rsp-main">
        <div className="rsp-container">
          <h2 className="rsp-products-heading">
            {catFilter === 'all' ? 'All Products' : categories.find(c => String(c.id) === catFilter)?.name || 'Products'}
          </h2>

          {loading ? (
            <div className="rsp-grid">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="rsp-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rsp-no-results">
              <Package size={48} color="hsl(215.4, 16.3%, 46.9%)" />
              <h3>No products found</h3>
              <p>Try a different search term or category.</p>
            </div>
          ) : (
            <div className="rsp-grid">
              {filtered.map((p) => (
                <div key={p.id} className="rsp-card">
                  <div className="rsp-card-img-wrap">
                    {imgSrc(p.product_image) ? (
                      <img src={imgSrc(p.product_image)} className="rsp-card-img" alt={p.name} />
                    ) : (
                      <Package size={44} color="hsl(215.4, 16.3%, 46.9%)" />
                    )}
                    {(p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0) && (
                      <div className="rsp-card-oos">OUT OF STOCK</div>
                    )}
                  </div>
                  <div className="rsp-card-body">
                    <h3 className="rsp-card-name">{p.name}</h3>
                    {p.description && <p className="rsp-card-desc">{p.description}</p>}
                    <div className="rsp-card-footer">
                      <div className="rsp-price">{parseFloat(p.price || p.selling_price || 0).toLocaleString()} ETB</div>
                      <button
                        className="rsp-add-btn"
                        disabled={p.stock_quantity !== null && p.stock_quantity !== undefined && p.stock_quantity <= 0}
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      >
                        <ShoppingCart size={16} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section: How to Buy ── */}
      <section className="rsp-section-muted">
        <div className="rsp-container">
          <h2 className="rsp-section-title">How to Buy</h2>
          <p className="rsp-section-sub">Two simple ways to get what you need.</p>
          <div className="rsp-how-grid">
            {HOW_TO_BUY.map(step => (
              <div key={step.n} className="rsp-how-card">
                <div className="rsp-how-icon"><step.icon size={22} color="hsl(210, 40%, 98%)" /></div>
                <h3 className="rsp-how-title">{step.title}</h3>
                <p className="rsp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section: Delivery & Payment ── */}
      <section className="rsp-section">
        <div className="rsp-container">
          <div className="rsp-dp-grid">
            <div className="rsp-dp-card">
              <h2 className="rsp-dp-head"><Truck size={20} color="hsl(221.2, 83.2%, 53.3%)" /> Delivery / Pickup</h2>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Truck size={18} color="hsl(210, 40%, 98%)" /></div>
                <div>
                  <p className="rsp-dp-row-title">Standard Delivery</p>
                  <p className="rsp-dp-row-desc">Available in major areas. Fees calculated at checkout. Delivery within 1-2 business days for in-stock items.</p>
                </div>
              </div>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Package size={18} color="hsl(210, 40%, 98%)" /></div>
                <div>
                  <p className="rsp-dp-row-title">Store Pickup</p>
                  <p className="rsp-dp-row-desc">Free pickup from our main branch. Ready within 2 hours for in-stock items.</p>
                </div>
              </div>
            </div>
            <div className="rsp-dp-card">
              <h2 className="rsp-dp-head"><CreditCard size={20} color="hsl(221.2, 83.2%, 53.3%)" /> Payment Methods</h2>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><Banknote size={18} color="hsl(210, 40%, 98%)" /></div>
                <div>
                  <p className="rsp-dp-row-title">Bank Transfer</p>
                  <p className="rsp-dp-row-desc">Direct transfer to our accounts (CBE, Awash, etc.)</p>
                </div>
              </div>
              <div className="rsp-dp-row">
                <div className="rsp-dp-row-icon"><CreditCard size={18} color="hsl(210, 40%, 98%)" /></div>
                <div>
                  <p className="rsp-dp-row-title">Mobile Money</p>
                  <p className="rsp-dp-row-desc">Telebirr, CBE Birr, and other wallets supported.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: FAQs ── */}
      <section className="rsp-section-muted">
        <div className="rsp-container" style={{ maxWidth: '760px' }}>
          <h2 className="rsp-section-title" style={{ textAlign: 'center' }}>Common Questions</h2>
          <p className="rsp-section-sub-center">Answers to the most common retail questions.</p>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="rsp-faq-item">
                <button className="rsp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={18} color="hsl(221.2, 83.2%, 53.3%)" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={18} color="hsl(215.4, 16.3%, 46.9%)" style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && <div className="rsp-faq-ans">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ─────────────── ORDER MODAL ─────────────── */}
      {cartOpen && (
        <div className="rsp-overlay" onClick={() => setCartOpen(false)}>
          <div className="rsp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="rsp-modal-header">
              <div>
                <h3 className="rsp-modal-title">
                  <ShoppingCart size={22} /> Place Retail Order
                </h3>
                <p className="rsp-modal-subtitle">
                  Review your items and fill in the details below
                </p>
              </div>
              <button className="rsp-close-btn" onClick={() => setCartOpen(false)}><X size={22} /></button>
            </div>

            {/* ── SUCCESS ── */}
            {orderSuccess ? (
              <div className="rsp-success-body">

                <span className="rsp-success-emoji">✅</span>
                <h3 className="rsp-success-title">Order Placed Successfully!</h3>
                <p className="rsp-success-sub">
                  Invoice <strong>{orderSuccess}</strong> has been received.<br />
                  Our sales team will confirm your order shortly.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="rsp-view-orders-btn" onClick={() => navigate('/customer/orders')}>
                    <Package size={20} /> View My Orders
                  </button>
                  <button className="rsp-cancel-btn" onClick={() => { setOrderSuccess(null); setCartOpen(false); }}>
                    Continue Shopping
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
                  You can track your order anytime from <strong>Customer Portal → My Orders</strong>
                </p>
              </div>

            ) : (
              /* ── ORDER FORM ── */
              <form onSubmit={e => { e.preventDefault(); placeOrder(); }} noValidate>
                <div className="rsp-modal-body">

                  {/* Customer Info (pre-filled, read-only) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: 0 }}>
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <User size={14} /> Customer Information
                    </div>
                    <div className="rsp-form-row">
                      <div className="rsp-form-group">
                        <label className="rsp-form-label">Full Name *</label>
                        <input
                          type="text"
                          className="rsp-form-input"
                          required
                          placeholder="Your full name"
                          value={orderForm.customer_name}
                          onChange={e => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))}
                        />
                      </div>
                      <div className="rsp-form-group">
                        <label className="rsp-form-label">Email *</label>
                        <input
                          type="email"
                          className="rsp-form-input"
                          required
                          placeholder="your@email.com"
                          value={orderForm.customer_email}
                          onChange={e => setOrderForm(prev => ({ ...prev, customer_email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="rsp-form-group" style={{ marginTop: 12 }}>
                      <label className="rsp-form-label">Phone Number *</label>
                      <input
                        type="text"
                        className="rsp-form-input"
                        required
                        placeholder="e.g. +251 911 000 000"
                        value={orderForm.customer_phone}
                        onChange={e => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="rsp-section-divider">
                    <Package size={14} /> Order Items
                  </div>

                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Your cart is empty</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {cartItems.map(item => (
                        <div key={item.id} className="rsp-ci">
                          <div className="rsp-ci-img">
                            {imgSrc(item.product_image)
                              ? <img src={imgSrc(item.product_image)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 0 }} alt={item.name} />
                              : <Package size={22} color="#cbd5e1" />
                            }
                          </div>
                          <div className="rsp-ci-info">
                            <div className="rsp-ci-name">{item.name}</div>
                            <div className="rsp-ci-price">{parseFloat(item.price).toLocaleString()} ETB</div>
                            <div className="rsp-ci-ctrl">
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={12} /></button>
                              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                              <button type="button" className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={12} /></button>
                              <button type="button" onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', borderRadius: 0, padding: 4 }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delivery Details */}
                  <div className="rsp-section-divider">
                    <Truck size={14} /> Delivery Details
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label"><ArrowRight size={14} /> Delivery Address <span>(Leave blank for pickup)</span></label>
                    <input
                      className="rsp-form-input"
                      placeholder="e.g. Building A, Room 202, Wolaita Sodo University..."
                      value={orderForm.delivery_address}
                      onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    />
                  </div>
                  <div className="rsp-form-group">
                    <label className="rsp-form-label"><AlignLeft size={14} /> Special Notes <span>(Optional)</span></label>
                    <textarea
                      className="rsp-form-input"
                      rows={3}
                      placeholder="e.g. Call before delivery, specific packaging requests, etc."
                      value={orderForm.notes}
                      onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Payment Proof — Payment ID OR Screenshot (at least one required) */}
                  <div className="rsp-section-divider">
                    <Banknote size={14} /> Payment Proof
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="rsp-form-group">
                      <label className="rsp-form-label"><CreditCard size={14} /> Payment Method *</label>
                      <select
                        className="rsp-form-input"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{
                          appearance: 'auto',
                          height: 'auto',
                          minHeight: 46,
                          padding: '12px 16px',
                          lineHeight: 1.4,
                          color: '#0f172a',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="telebirr">Mobile Money (Telebirr)</option>
                      </select>
                    </div>
                    <div className="rsp-form-group">
                      <label className="rsp-form-label"><FileText size={14} /> Payment ID / Reference</label>
                      <input
                        type="text"
                        className="rsp-form-input"
                        placeholder="e.g. TRX-123456789"
                        value={paymentRef}
                        onChange={e => { setPaymentRef(e.target.value); if (paymentError) setPaymentError(''); setFormError(''); }}
                      />
                    </div>
                  </div>
                  <div className="rsp-form-group" style={{ marginTop: 10 }}>
                    <label className="rsp-form-label">
                      <UploadCloud size={14} /> Payment Screenshot
                      <span> (Enter a Payment ID above OR upload a screenshot — at least one is required)</span>
                    </label>
                    <div
                      onClick={() => paymentProofInputRef.current && paymentProofInputRef.current.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: '18px 12px', border: `2px dashed ${paymentProofFile ? '#0D7C66' : '#cbd5e1'}`,
                        background: paymentProofFile ? '#f0fdf4' : '#f8fafc', borderRadius: 0, cursor: 'pointer',
                        transition: 'border-color 0.15s ease', textAlign: 'center',
                      }}
                    >
                      {paymentProofPreview ? (
                        <img src={paymentProofPreview} alt="Payment proof" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <>
                          <UploadCloud size={28} color={paymentProofFile ? '#0D7C66' : '#94a3b8'} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>Click to upload JPG / PNG / PDF</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={paymentProofInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={handlePaymentProofChange}
                    />
                    {paymentProofFile && (
                      <button
                        type="button"
                        onClick={clearPaymentProof}
                        style={{ marginTop: 8, background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', padding: 0 }}
                      >
                        <X size={14} /> Remove screenshot
                      </button>
                    )}
                    {paymentError && (
                      <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600, marginTop: 6 }}>{paymentError}</div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="rsp-price-summary">
                    <div className="rsp-section-divider" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <Banknote size={14} /> Price Summary
                    </div>
                    <div className="rsp-price-row">
                      <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                      <span style={{ fontWeight: 700 }}>{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                    <div className="rsp-price-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Banknote size={14} /> VAT Amount</span>
                      <span>{cartVat > 0 ? `${cartVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : '—'}</span>
                    </div>
                    <div className="rsp-price-row rsp-price-total">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Total Amount Due (incl. VAT)</span>
                      <span>{(cartTotal + cartVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB</span>
                    </div>
                  </div>

                </div>

                {/* Error banner — always visible above the buttons */}
                {formError && (
                  <div
                    ref={submitErrorRef}
                    style={{
                      margin: '0 28px 14px', padding: '12px 16px', background: '#fef2f2',
                      border: '2px solid #dc2626', borderLeft: '6px solid #dc2626', color: '#b91c1c',
                      fontWeight: 700, fontSize: '0.85rem', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {formError}
                  </div>
                )}

                {/* Footer */}
                <div className="rsp-modal-footer">
                  <button type="button" className="rsp-cancel-btn" onClick={() => setCartOpen(false)}>Cancel</button>
                  <button type="submit" className="rsp-submit-btn" disabled={placingOrder || cartItems.length === 0}>
                    {placingOrder
                      ? <>Processing…</>
                      : <><ShoppingCart size={18} /> Confirm Order</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RetailStorePage;