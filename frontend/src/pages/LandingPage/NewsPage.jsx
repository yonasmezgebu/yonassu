import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, MapPin, Briefcase, Clock, Play, ArrowLeft, X } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

/* ─── Helpers ─────────────────────────────────────────────────────── */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  const safePath = path.startsWith('/') ? path : `/uploads/news/${path}`;
  return `${baseUrl}${safePath}`;
};

const extractYoutubeId = (url) => {
  const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

/* ─── Skeleton Components ─────────────────────────────────────────── */
const ShimmerBlock = ({ width = '100%', height = 16, margin = '0 0 8px', borderRadius = 6 }) => (
  <div style={{
    width, height, margin, borderRadius,
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'newsShimmer 1.5s infinite',
  }} />
);

const CardSkeleton = () => (
  <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #8D6E63' }}>
    <ShimmerBlock width="60px" height={18} borderRadius={99} />
    <ShimmerBlock width="90%" height={18} margin="12px 0 8px" />
    <ShimmerBlock height={13} margin="0 0 4px" />
    <ShimmerBlock width="70%" height={13} margin="0 0 12px" />
    <ShimmerBlock width="120px" height={12} />
  </div>
);

const VideoSkeleton = () => (
  <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden', border: '1px solid #8D6E63' }}>
    <div style={{ aspectRatio: '16/9', background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Play size={24} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
      </div>
    </div>
    <div style={{ padding: 14 }}>
      <ShimmerBlock width="80%" height={14} />
      <ShimmerBlock width="60%" height={12} margin="6px 0 0" />
    </div>
  </div>
);

/* ─── Post Image (news / hiring side image) ─────────────────────── */
const PostImage = ({ images, alt }) => {
  if (!images) return null;
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
    if (parsed && parsed.length > 0) {
      return (
        <div style={{
          flex: '0 0 40%', maxWidth: '40%', paddingLeft: 32,
          borderLeft: '1px solid #8D6E63', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', background: '#F5F5F5', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <img
              src={getImageUrl(parsed[0])}
              alt={alt || 'Post Image'}
              style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 400, display: 'block', transition: 'transform 0.15s ease' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          </div>
        </div>
      );
    }
  } catch (e) { return null; }
  return null;
};

/* ─── Styles ──────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes newsShimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
  @keyframes newsTitleShimmer {
    0%   { background-position: 0%   50%; }
    100% { background-position: 300% 50%; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(24px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }

  /* ── Page ── */
  .news-page {
    min-height: 100vh;
    background: #F5F5F5;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .news-inner {
    width: 100%;
    padding: 0 24px 64px;
    box-sizing: border-box;
  }

  /* ── Top bar ── */
  .news-topbar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 0 18px;
  }
  marquee { scrollbar-width: none; -ms-overflow-style: none; }
  marquee::-webkit-scrollbar { display: none; }

  /* ── Back button — green per ruleset ── */
  .news-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px 10px 8px;
    border: none;
    border-radius: 8px;
    background: #2E8B57;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }
  .news-back-btn:hover {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,94,32,0.3);
  }
  .news-back-btn:active { transform: translateY(0); }
  .news-back-btn .back-icon-wrap {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.2);
    transition: transform 0.15s ease;
  }
  .news-back-btn:hover .back-icon-wrap { transform: translateX(-2px); }

  /* ── Marquee title ── */
  .news-marquee-title {
    font-size: clamp(18px, 3vw, 26px);
    font-weight: 900;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, #1B5E20, #228B22, #4CAF50, #A5D6A7, #228B22, #1B5E20);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: newsTitleShimmer 5s linear infinite;
    padding-right: 60px;
    white-space: nowrap;
  }

  /* ── Filter bar — UNTOUCHED (keep existing blue 3D style) ── */
  .news-filter-bar {
    display: flex;
    width: 100%;
    margin-bottom: 28px;
    border-radius: 0;
    overflow: visible;
    gap: 0;
    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15));
  }
  .news-filter-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 10px 12px;
    border: none;
    border-right: 2px solid rgba(0,0,0,0.06);
    background: linear-gradient(180deg, #1B5E20 0%, #2E7D32 40%, #388E3C 100%);
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.02em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.25),
      inset 0 -1px 0 rgba(0,0,0,0.1),
      0 8px 0 #145214,
      0 9px 0 #0d3d0d,
      0 10px 0 #092909,
      0 12px 18px rgba(0,0,0,0.14);
    transform: translateY(0px);
    user-select: none;
    text-transform: uppercase;
  }
  .news-filter-btn:first-child { border-radius: 0; }
  .news-filter-btn:last-child { border-right: none; border-radius: 0; }
  .news-filter-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s ease;
    pointer-events: none;
  }
  .news-filter-btn:hover::before { left: 150%; }
  .news-filter-btn::after {
    content: '';
    position: absolute;
    bottom: 0; left: 50%; transform: translateX(-50%);
    width: 0; height: 3px;
    background: #8BC34A;
    border-radius: 3px 3px 0 0;
    transition: width 0.3s ease;
  }
  .news-filter-btn:hover {
    background: linear-gradient(180deg, #2E7D32 0%, #388E3C 40%, #43A047 100%);
    color: #e8f5e9;
    transform: translateY(-4px);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.35),
      inset 0 -1px 0 rgba(0,0,0,0.05),
      0 12px 0 #145214,
      0 13px 0 #0d3d0d,
      0 14px 0 #092909,
      0 18px 28px rgba(0,0,0,0.2);
  }
  .news-filter-btn:active {
    transform: translateY(6px);
    box-shadow:
      inset 0 2px 4px rgba(0,0,0,0.12),
      0 2px 0 #145214,
      0 3px 8px rgba(0,0,0,0.1);
  }
  .news-filter-btn.active {
    background: linear-gradient(180deg, #fefce8 0%, #f59e0b 40%, #d97706 100%);
    color: #1c1917;
    transform: translateY(4px);
    text-shadow: 0 1px 2px rgba(255,255,255,0.3);
    box-shadow:
      inset 0 2px 8px rgba(120,70,0,0.12),
      inset 0 1px 0 rgba(255,255,255,0.7),
      0 4px 0 #b45309,
      0 5px 0 #92400e,
      0 6px 0 #78350f,
      0 8px 18px rgba(0,0,0,0.12);
  }
  .news-filter-btn.active::after {
    width: 60%;
    background: #1B5E20;
  }
  .news-filter-btn.active::before { display: none; }
  .news-filter-btn.active:hover {
    transform: translateY(2px);
    box-shadow:
      inset 0 2px 6px rgba(120,70,0,0.1),
      0 6px 0 #b45309,
      0 7px 0 #92400e,
      0 8px 20px rgba(0,0,0,0.15);
  }
  .news-filter-btn.active:active {
    transform: translateY(7px);
    box-shadow:
      inset 0 3px 8px rgba(120,70,0,0.15),
      0 1px 0 #b45309;
  }
  .news-filter-btn .btn-icon-wrap {
    width: 38px; height: 38px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.15);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.3);
    transition: all 0.2s;
    flex-shrink: 0;
    font-size: 18px;
  }
  .news-filter-btn:hover .btn-icon-wrap {
    background: rgba(255,255,255,0.22);
    transform: scale(1.1);
  }
  .news-filter-btn.active .btn-icon-wrap {
    background: rgba(27,94,32,0.15);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 0 8px rgba(27,94,32,0.2);
  }
  .btn-label { line-height: 1; position: relative; z-index: 2; }

  /* ── Section heading ── */
  .news-section-title {
    font-size: 18px;
    font-weight: 800;
    color: #1B5E20;
    margin: 0 0 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #A5D6A7;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── News / Hiring article card ── */
  .news-article-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 32px 36px;
    border: 1px solid #8D6E63;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    align-items: flex-start;
    gap: 0;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    animation: fadeInUp 0.3s ease both;
  }
  .news-article-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.09);
    transform: translateY(-2px);
  }
  .news-article-body { flex: 1; padding-right: 0; }

  /* News badge */
  .news-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
  }
  .news-badge--news     { background: #A5D6A7; color: #1B5E20; }
  .news-badge--hiring   { background: #8BC34A; color: #1B3A00; }

  /* Article title */
  .news-article-title {
    margin: 0 0 14px;
    font-size: 20px;
    font-weight: 800;
    color: #424242;
    line-height: 1.3;
  }
  .news-article-content {
    margin: 0 0 20px;
    font-size: 14px;
    color: #424242;
    line-height: 1.75;
    white-space: pre-wrap;
  }
  .news-article-meta {
    font-size: 13px;
    color: #8D6E63;
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid #F5F5F5;
    padding-top: 14px;
    flex-wrap: wrap;
  }
  .news-article-meta span {
    display: flex; align-items: center; gap: 4px;
  }

  /* Hiring location pill */
  .hiring-location-pill {
    font-size: 12px;
    color: #1B5E20;
    background: #A5D6A7;
    padding: 3px 10px;
    border-radius: 99px;
    font-weight: 700;
    white-space: nowrap;
  }

  /* ── Apply button ── */
  .news-apply-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    background: #2E8B57;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .news-apply-btn:hover {
    background: #1B5E20;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,94,32,0.3);
  }

  /* ── Video grid ── */
  .news-video-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .news-video-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .news-video-grid { grid-template-columns: 1fr; } }

  /* ── Video card ── */
  .news-video-card {
    background: #FFFFFF;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #8D6E63;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    animation: fadeInUp 0.3s ease both;
  }
  .news-video-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    transform: translateY(-3px);
  }
  .news-video-thumb {
    aspect-ratio: 16/9;
    background: #1B5E20;
    position: relative;
    cursor: pointer;
    overflow: hidden;
  }
  .news-video-thumb img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.15s ease;
    display: block;
  }
  .news-video-card:hover .news-video-thumb img { transform: scale(1.03); }
  .news-video-play {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.2);
    transition: background 0.15s ease;
  }
  .news-video-thumb:hover .news-video-play { background: rgba(0,0,0,0.4); }
  .news-video-play-btn {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: rgba(0,0,0,0.72);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s ease, background 0.15s ease;
  }
  .news-video-thumb:hover .news-video-play-btn {
    background: #2E8B57;
    transform: scale(1.1);
  }
  .news-video-body { padding: 12px 14px 16px; }
  .news-video-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 700;
    color: #424242;
  }
  .news-video-desc {
    margin: 0;
    font-size: 12px;
    color: #8D6E63;
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* ── Empty state ── */
  .news-empty {
    text-align: center;
    padding: 56px 0;
    color: #8D6E63;
    font-size: 15px;
    font-weight: 500;
  }

  /* ── Skeleton grid ── */
  .news-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  /* ── Video player modal ── */
  .news-video-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.82);
    z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }
  .news-video-modal {
    position: relative;
    width: 100%; max-width: 960px;
    aspect-ratio: 16/9;
    background: #000;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
  }
  .news-video-close {
    position: absolute; top: 12px; right: 12px; z-index: 10;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(0,0,0,0.6);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    transition: background 0.15s ease;
  }
  .news-video-close:hover { background: rgba(0,0,0,0.9); }

  /* ── Application form modal ── */
  .news-form-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
    display: flex; align-items: flex-start; justify-content: center;
    backdrop-filter: blur(5px);
    padding: 20px;
    overflow-y: auto;
  }
  .news-form-modal {
    background: #FFFFFF;
    border-radius: 14px;
    width: 100%; max-width: 520px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    margin: auto;
    animation: fadeInUp 0.2s ease;
    border: 1px solid #8D6E63;
  }
  .news-form-header {
    padding: 18px 24px;
    border-bottom: 1px solid #8D6E63;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1B5E20;
    color: #fff;
  }
  .news-form-header h2 { margin: 0; font-size: 17px; font-weight: 800; }
  .news-form-header p  { margin: 4px 0 0; font-size: 13px; color: #A5D6A7; }
  .news-form-close {
    border: none; background: rgba(255,255,255,0.15); cursor: pointer;
    padding: 4px; color: #fff; border-radius: 6px;
    display: flex; align-items: center;
    transition: background 0.15s ease;
  }
  .news-form-close:hover { background: rgba(255,255,255,0.3); }
  .news-form-body {
    padding: 24px;
    display: flex; flex-direction: column; gap: 16px;
    overflow-y: auto; max-height: 70vh;
  }
  .news-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 480px) { .news-form-row { grid-template-columns: 1fr; } }
  .news-form-group { display: flex; flex-direction: column; gap: 6px; }
  .news-form-group label { font-size: 13px; font-weight: 600; color: #424242; }
  .news-form-group input,
  .news-form-group select {
    padding: 10px 12px;
    border: 1px solid #8D6E63;
    border-radius: 6px;
    font-size: 14px;
    color: #424242;
    background: #FFFFFF;
    box-sizing: border-box;
    width: 100%;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    font-family: inherit;
  }
  .news-form-group input:focus,
  .news-form-group select:focus {
    border-color: #2E8B57;
    box-shadow: 0 0 0 3px rgba(46,139,87,0.15);
  }
  .news-form-submit {
    margin-top: 4px;
    padding: 12px;
    background: #2E8B57;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
    width: 100%;
  }
  .news-form-submit:hover:not(:disabled) {
    background: #1B5E20;
    transform: translateY(-1px);
  }
  .news-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Success modal ── */
  .news-success-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1001;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(5px);
    padding: 20px;
  }
  .news-success-modal {
    background: #FFFFFF;
    border-radius: 14px;
    width: 100%; max-width: 480px;
    padding: 36px;
    text-align: center;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    border: 1px solid #8D6E63;
    animation: fadeInUp 0.25s ease;
  }
  .news-success-icon {
    width: 68px; height: 68px;
    background: #A5D6A7;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .news-success-title {
    margin: 0 0 14px;
    font-size: 20px;
    color: #424242;
    font-weight: 800;
  }
  .news-success-info {
    margin: 0 0 20px;
    font-size: 14px;
    color: #424242;
    line-height: 1.7;
    text-align: left;
    background: #F5F5F5;
    border-radius: 10px;
    padding: 16px 20px;
    border: 1px solid #8D6E63;
  }
  .news-success-note {
    margin: 0 0 24px;
    font-size: 13px;
    color: #8D6E63;
    line-height: 1.6;
  }
  .news-success-btn {
    width: 100%;
    padding: 12px;
    background: #2E8B57;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .news-success-btn:hover {
    background: #1B5E20;
    transform: translateY(-1px);
  }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .news-filter-btn { padding: 16px 4px 12px; font-size: 10px; gap: 5px; }
    .news-filter-btn .btn-icon-wrap { width: 28px; height: 28px; font-size: 14px; }
    .news-inner { padding: 0 12px 48px; }
    .news-article-card { flex-direction: column; padding: 20px; }
    .news-article-card > div:last-child { max-width: 100% !important; width: 100% !important; padding-left: 0 !important; border-left: none !important; border-top: 1px solid #8D6E63; padding-top: 16px; margin-top: 16px; }
  }
  @media (max-width: 480px) {
    .news-filter-btn .btn-label { display: none; }
    .news-filter-btn { padding: 14px 4px; }
  }
`;

/* ─── Main Component ──────────────────────────────────────────────── */
export default () => {
  const { type: filterParam } = useParams();
  const navigate = useNavigate();
  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState(filterParam || 'all');
  const [playingVideo,  setPlayingVideo]  = useState(null);
  const [applyingPost,  setApplyingPost]  = useState(null);
  const [formData,      setFormData]      = useState({
    full_name: '', phone_number: '', email: '',
    education_status: 'High School', national_id: '', sex: 'Male'
  });
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [showSuccess,   setShowSuccess]   = useState(false);

  useEffect(() => { setActiveFilter(filterParam || 'all'); }, [filterParam]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/news/public');
      const data = res.data;
      if (Array.isArray(data))              setPosts(data);
      else if (data?.data)                  setPosts(data.data);
      else if (data?.status === 'success')  setPosts(data.data ?? []);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = (playingVideo || applyingPost || showSuccess) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [playingVideo, applyingPost, showSuccess]);

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/applications', { ...formData, post_id: applyingPost.id });
      setApplyingPost(null);
      setShowSuccess(true);
      setFormData({ full_name: '', phone_number: '', email: '', education_status: 'High School', national_id: '', sex: 'Male' });
    } catch (err) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = activeFilter === 'all' ? posts : posts.filter(p => p.type === activeFilter);

  const FILTERS = [
    { key: 'all',     label: 'All',     icon: '✨' },
    { key: 'hiring',  label: 'Hiring',  icon: '💼' },
    { key: 'news',    label: 'News',    icon: '📰' },
    { key: 'video',   label: 'Video',   icon: '🎬' },
  ];

  const newsItems    = filtered.filter(p => p.type === 'news');
  const hiringItems  = filtered.filter(p => p.type === 'hiring');
  const videoItems   = filtered.filter(p => p.type === 'video');

  return (
    <>
      <style>{STYLES}</style>
      <PublicNav />

      <div className="news-page">
        <div className="news-inner">

          {/* ── Top bar ── */}
          <div className="news-topbar">
            <button className="news-back-btn" onClick={() => navigate(-1)}>
              <div className="back-icon-wrap">
                <ArrowLeft size={16} strokeWidth={2.5} />
              </div>
              <span>Back</span>
            </button>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '4px 0' }}>
                <span className="news-marquee-title">
                  📢 News &amp; Announcements &nbsp;·&nbsp; Stay informed with the latest from Sutana &nbsp;·&nbsp;
                </span>
              </marquee>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="news-filter-bar">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`news-filter-btn${activeFilter === f.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <div className="btn-icon-wrap">{f.icon}</div>
                <span className="btn-label">{f.label}</span>
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div className="news-skeleton-grid">
                {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
              </div>
              <div className="news-video-grid">
                {[1,2,3].map(i => <VideoSkeleton key={i} />)}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="news-empty">
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📭</span>
              No {activeFilter === 'all' ? '' : activeFilter} posts found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* ── News posts ── */}
              {(activeFilter === 'all' || activeFilter === 'news') && newsItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">📰 News Announcements</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {newsItems.map(p => (
                      <div key={p.id} className="news-article-card">
                        <div className="news-article-body" style={{ paddingRight: p.images ? 32 : 0 }}>
                          <span className="news-badge news-badge--news">News Announcement</span>
                          <h3 className="news-article-title">{p.title}</h3>
                          {p.content && <p className="news-article-content">{p.content}</p>}
                          <div className="news-article-meta">
                            <span><Calendar size={13} /> {new Date(p.created_at).toLocaleDateString('en-CA')}</span>
                          </div>
                        </div>
                        <PostImage images={p.images} alt={p.title} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Hiring posts ── */}
              {(activeFilter === 'all' || activeFilter === 'hiring') && hiringItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">💼 Job Openings</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {hiringItems.map(p => (
                      <div key={p.id} className="news-article-card">
                        <div className="news-article-body" style={{ paddingRight: p.images ? 32 : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                            <h3 className="news-article-title" style={{ margin: 0 }}>{p.hiring_position || p.title}</h3>
                            <span className="hiring-location-pill">{p.hiring_location || 'Addis Ababa'}</span>
                          </div>
                          <span className="news-badge news-badge--hiring">Now Hiring</span>
                          {p.content && <p className="news-article-content">{p.content}</p>}
                          <div className="news-article-meta" style={{ marginBottom: 16 }}>
                            {p.hiring_deadline && (
                              <span><Clock size={13} /> <strong>Deadline:</strong> {new Date(p.hiring_deadline).toLocaleDateString('en-CA')}</span>
                            )}
                            <span><MapPin size={13} /> <strong>Location:</strong> {p.hiring_location || 'Addis Ababa'}</span>
                          </div>
                          <button className="news-apply-btn" onClick={() => setApplyingPost(p)}>
                            <Briefcase size={14} /> Apply Now
                          </button>
                        </div>
                        <PostImage images={p.images} alt={p.hiring_position || p.title} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Video posts ── */}
              {(activeFilter === 'all' || activeFilter === 'video') && videoItems.length > 0 && (
                <div>
                  <h2 className="news-section-title">🎬 Videos</h2>
                  <div className="news-video-grid">
                    {videoItems.map(p => {
                      const vid = extractYoutubeId(p.youtube_url);
                      return vid ? (
                        <div key={p.id} className="news-video-card">
                          <div className="news-video-thumb" onClick={() => setPlayingVideo(vid)}>
                            <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt={p.title} />
                            <div className="news-video-play">
                              <div className="news-video-play-btn">
                                <Play size={22} color="white" fill="white" />
                              </div>
                            </div>
                          </div>
                          <div className="news-video-body">
                            <h4 className="news-video-title">{p.title}</h4>
                            {p.content && (
                              <p className="news-video-desc">{p.content.replace(/<[^>]*>/g, '').slice(0, 120)}</p>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Video player modal ── */}
      {playingVideo && (
        <div className="news-video-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="news-video-modal" onClick={e => e.stopPropagation()}>
            <button className="news-video-close" onClick={() => setPlayingVideo(null)}>
              <X size={20} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title="Video Player"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── Application form modal ── */}
      {applyingPost && (
        <div className="news-form-overlay">
          <div className="news-form-modal">
            <div className="news-form-header">
              <div>
                <h2>Apply for Position</h2>
                <p>{applyingPost.hiring_position || applyingPost.title}</p>
              </div>
              <button className="news-form-close" onClick={() => setApplyingPost(null)}>
                <X size={20} />
              </button>
            </div>
            <form className="news-form-body" onSubmit={handleApply}>
              <div className="news-form-row">
                <div className="news-form-group">
                  <label>Full Name</label>
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="news-form-group">
                  <label>Phone Number</label>
                  <input required type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                </div>
              </div>
              <div className="news-form-group">
                <label>Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="news-form-row">
                <div className="news-form-group">
                  <label>National ID</label>
                  <input required type="text" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} />
                </div>
                <div className="news-form-group">
                  <label>Sex</label>
                  <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="news-form-group">
                <label>Highest Education Status</label>
                <select value={formData.education_status} onChange={e => setFormData({...formData, education_status: e.target.value})}>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <button type="submit" className="news-form-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Success notification modal ── */}
      {showSuccess && (
        <div className="news-success-overlay">
          <div className="news-success-modal">
            <div className="news-success-icon">
              <Briefcase size={32} color="#1B5E20" />
            </div>
            <h2 className="news-success-title">🎉 Congratulations!</h2>
            <p className="news-success-info">
              Your application has been received. Please visit our office within <strong>5 working days</strong>, bringing your:<br /><br />
              &nbsp;&nbsp;📄 <strong>Original education certificate(s)</strong><br />
              &nbsp;&nbsp;🪪 <strong>National ID card</strong><br /><br />
              to continue the hiring process.
            </p>
            <p className="news-success-note">
              ✉️ A confirmation email has been sent to your email address with full details and our office address.
            </p>
            <button className="news-success-btn" onClick={() => setShowSuccess(false)}>
              Understood — I Will Visit the Office
            </button>
          </div>
        </div>
      )}
    </>
  );
};
