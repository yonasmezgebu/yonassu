import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, Mail } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      icon: Eye,
      title: 'Information We Collect',
      content: [
        'Personal identification information (name, email address, phone number) when you register or place an order.',
        'Order details including document specifications, paper size, quantity, and binding preferences.',
        'Payment transaction references (we do not store full card numbers or Telebirr PINs).',
        'Device and browser information collected automatically when you visit our site for analytics purposes.',
        'Communication records if you contact our support team via email or chat.',
      ],
    },
    {
      icon: Database,
      title: 'How We Use Your Information',
      content: [
        'To process and fulfill your printing orders and send order confirmations and receipts.',
        'To communicate with you about your order status, updates, and delivery notifications.',
        'To improve our services, website functionality, and customer experience.',
        'To comply with legal obligations and regulatory requirements under Ethiopian law.',
        'To send newsletters and promotional updates — only if you have opted in.',
      ],
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        'All data is transmitted over HTTPS with TLS 1.2+ encryption.',
        'Uploaded documents are stored on secured servers and are auto-deleted 30 days after order pickup or delivery.',
        'Your health and medical data is strictly confidential and secured in compliance with Ethiopian data privacy laws.',
        'Access to your personal and health data is restricted to authorized SUTANA staff only.',
        'We conduct regular security audits and apply software patches promptly.',
        'We do not sell, rent, or trade your personal information to third parties.',
      ],
    },
    {
      icon: Bell,
      title: 'Cookies & Tracking',
      content: [
        'We use essential cookies to maintain your session and shopping cart.',
        'Analytics cookies (anonymized) help us understand how visitors use our site.',
        'You may disable non-essential cookies via your browser settings at any time.',
        'We do not use third-party advertising trackers or behavioral profiling cookies.',
      ],
    },
    {
      icon: Shield,
      title: 'Your Rights',
      content: [
        'You have the right to request access to the personal data we hold about you.',
        'You may request correction of inaccurate or incomplete information at any time.',
        'You may request deletion of your account and associated data (subject to legal retention requirements).',
        'You may opt out of marketing communications at any time by clicking "Unsubscribe" or contacting us.',
        'To exercise any of these rights, contact us at privacy@sutana.com.',
      ],
    },
    {
      icon: Shield,
      title: 'Changes to This Policy',
      content: [
        'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.',
        'We will notify registered users of significant changes via email or an in-app notification.',
        'The date at the top of this page reflects the most recent revision.',
        'Continued use of our services after changes constitutes acceptance of the updated policy.',
      ],
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
      <PublicNav />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', color: '#2E8B57',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            marginBottom: 40, padding: 0, fontFamily: 'inherit',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#1B5E20'}
          onMouseLeave={e => e.currentTarget.style.color = '#2E8B57'}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, color: '#1B5E20', margin: '0 0 8px', lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#424242', marginBottom: 12 }}>Last updated: August 2026</p>
        <hr style={{ border: 'none', borderTop: '1px solid #F5F5F5', margin: '0 0 32px' }} />

        {/* Intro */}
        <p style={{ fontSize: '1rem', color: '#424242', lineHeight: 1.8, marginBottom: 40 }}>
          SUTANA Enterprise Management System ("SUTANA", "we", "us") is committed to protecting your privacy.
          This policy explains what data we collect, why we collect it, and how we keep it safe.
          By using our services, you agree to the practices described here.
        </p>

        {/* Sections */}
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <div key={i} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Icon size={18} color="#228B22" />
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B5E20' }}>
                  {sec.title}
                </h2>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 28px' }}>
                {sec.content.map((item, j) => (
                  <li key={j} style={{
                    fontSize: '0.92rem', color: '#424242',
                    lineHeight: 1.8, marginBottom: j < sec.content.length - 1 ? 8 : 0,
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
              {i < sections.length - 1 && (
                <hr style={{ border: 'none', borderTop: '1px solid #F5F5F5', margin: '32px 0 0' }} />
              )}
            </div>
          );
        })}

        {/* Contact */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: '#424242', marginBottom: 16 }}>
            Questions about this policy? Contact our privacy team.
          </p>
          <a
            href="mailto:privacy@sutana.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: '#2E8B57', padding: '10px 24px', borderRadius: 8,
              fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
              border: '1px solid #2E8B57',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2E8B57'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2E8B57'; }}
          >
            <Mail size={15} /> privacy@sutana.com
          </a>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
