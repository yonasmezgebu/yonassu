import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import { ArrowLeft, FileText, ShoppingCart, AlertTriangle, CreditCard, Scale, RefreshCw, Mail, Shield, Award, CheckCircle2 } from 'lucide-react';

const TermsOfServicePage = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: [
        'By accessing or using any SUTANA printing service, you agree to be bound by these Terms of Service.',
        'These terms apply to all visitors, registered users, and customers who access our services.',
        'If you do not agree to these terms, you may not use our services.',
        'We reserve the right to update these terms at any time. Continued use constitutes acceptance.',
      ],
    },
    {
      icon: ShoppingCart,
      title: 'Order Placement & Processing',
      content: [
        'All orders must be submitted through the official SUTANA platform with a valid account.',
        'You are responsible for verifying all order details (quantity, file content, specifications) before submission.',
        'Orders are confirmed only after successful payment or approved credit arrangement.',
        'SUTANA reserves the right to reject any order that violates our content policy or is technically unfeasible.',
        'Rush orders require explicit confirmation from our team and may carry additional fees.',
      ],
    },
    {
      icon: AlertTriangle,
      title: 'Cancellations & Revisions',
      content: [
        'Orders that have entered the printing queue cannot be cancelled or revised.',
        'Cancellations are only accepted within 30 minutes of order placement, before production begins.',
        'To request a cancellation, contact our support team immediately at orders@sutana.com.',
        'SUTANA is not responsible for errors in submitted files — please proof-read before submitting.',
        'Reprint requests due to file errors are at the customer\'s expense.',
      ],
    },
    {
      icon: CreditCard,
      title: 'Payments & Pricing',
      content: [
        'Prices are listed in Ethiopian Birr (ETB) and are subject to change without prior notice.',
        'Accepted payment methods: Cash on pickup, Telebirr, CBE Birr, Visa/Mastercard, and Amole.',
        'Payment is due at the time of pickup or upon confirmed delivery, unless otherwise agreed in writing.',
        'Bulk order pricing is available on request — contact us at billing@sutana.com.',
        'Invoices and official receipts are issued upon successful payment.',
      ],
    },
    {
      icon: RefreshCw,
      title: 'Refunds & Quality Guarantee',
      content: [
        'If your order has a demonstrable printing defect (e.g. missing pages, ink smear, wrong binding), we will reprint at no charge.',
        'Refund or reprint requests must be raised within 48 hours of order pickup.',
        'Refunds are not issued for orders where the error originated from the submitted file.',
        'SUTANA\'s liability is limited to the cost of reprinting the defective portion of the order.',
      ],
    },
    {
      icon: Scale,
      title: 'Intellectual Property & Content Policy',
      content: [
        'By submitting a file, you confirm you have the legal right to print the content.',
        'SUTANA will not knowingly print copyrighted material without proper authorization.',
        'SUTANA reserves the right to refuse orders for content that is unlawful, harmful, or violates third-party rights.',
        'All SUTANA branding, software, and website content is protected by Ethiopian and international copyright law.',
      ],
    },
    {
      icon: Shield,
      title: 'Pharmacy & Medical Disclaimer',
      content: [
        'The information provided on this platform is for general informational and educational purposes only.',
        'It is not intended as, and shall not be understood or construed as, professional medical advice.',
        'Always consult a qualified healthcare professional before starting any medication.',
        'Sutana Pharmacy & Health is not liable for any decisions made based on the content of this platform.',
      ],
    },
    {
      icon: Award,
      title: 'Pharmacy Licensing & Certifications',
      content: [
        'MOH Licensed: License No. ETH/MOH/PH-2024-00451. Fully accredited by the Ethiopian Ministry of Health.',
        'EFDA Certified: All medications sourced from Ethiopian Food & Drug Authority approved suppliers only.',
        'Verified Pharmacists: Every dispensing pharmacist holds a valid B.Pharm degree and a current professional license.',
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
          Terms of Service
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#424242', marginBottom: 12 }}>Last updated: August 2026</p>
        <hr style={{ border: 'none', borderTop: '1px solid #F5F5F5', margin: '0 0 32px' }} />

        {/* Intro */}
        <p style={{ fontSize: '1rem', color: '#424242', lineHeight: 1.8, marginBottom: 40 }}>
          These Terms of Service govern your use of SUTANA printing services, including our website, order platform,
          and any associated services. Please read them carefully before placing an order. By using our services,
          you acknowledge that you have read, understood, and agreed to be bound by these terms.
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

        {/* Governing law note */}
        <p style={{ fontSize: '0.88rem', color: '#424242', lineHeight: 1.7, marginTop: 8, marginBottom: 32 }}>
          <strong style={{ color: '#1B5E20' }}>Governing Law:</strong> These terms are governed by the laws of the
          Federal Democratic Republic of Ethiopia. Any disputes shall be resolved through the competent courts
          of Addis Ababa, Ethiopia.
        </p>

        {/* Contact */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: '#424242', marginBottom: 16 }}>
            Have questions about these terms? Our support team is happy to help.
          </p>
          <a
            href="mailto:support@sutana.com"
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
            <Mail size={15} /> support@sutana.com
          </a>
        </div>

      </div>
    </div>
  );
};

export default TermsOfServicePage;
