import React, { useState, useEffect, useRef } from 'react';
import './ResponsiveFixes.css';

import event1 from '../../assets/event/event1.png';
import event2 from '../../assets/event/man2.png';
import event3 from '../../assets/event/event3.jpg';
import event4 from '../../assets/event/event4.jpg';
import event5 from '../../assets/event/event5.jpg';

const images = [event1, event2, event3, event4, event5];

export default function EventSection() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % images.length);
        setFade(true);
      }, 600);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <section className="event-section" style={sectionStyle}>
      <div className="event-row" style={containerStyle}>
        {/* Left — Image */}
        <div style={imageWrapStyle}>
          <div style={imageInnerStyle}>
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Event ${i + 1}`}
                style={{
                  ...imgStyle,
                  opacity: i === index ? (fade ? 1 : 0) : 0,
                  transition: 'opacity 0.6s ease',
                  position: 'absolute',
                  inset: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — Text */}
        <div style={textWrapStyle}>
          <h2 style={headingStyle}>SUTANA ENTERPRISE & CONSULTANCY</h2>
          <p style={subStyle}>Empowering Agriculture Through Innovation</p>
          <p style={descStyle}>
            SUTANA Enterprise is a leading agricultural technology
            and consultancy firm dedicated to transforming farming
            practices across Ethiopia.
          </p>

          <div style={servicesStyle}>
            <span style={serviceTagStyle}>Agricultural ERP Solutions</span>
            <span style={serviceTagStyle}>Farming Consultancy</span>
            <span style={serviceTagStyle}>Supply Chain Management</span>
            <span style={serviceTagStyle}>Training & Capacity Building</span>
          </div>

          <div style={visionStyle}>
            <h3 style={miniHeadStyle}>OUR VISION</h3>
            <p style={miniTextStyle}>
              To be the premier agricultural technology partner in Ethiopia,
              driving sustainable farming through innovation.
            </p>
          </div>

          <div style={missionStyle}>
            <h3 style={miniHeadStyle}>OUR MISSION</h3>
            <p style={miniTextStyle}>
              To empower farmers and agricultural enterprises with cutting-edge
              technology solutions that increase productivity, efficiency, and profitability.
            </p>
          </div>

          <p style={taglineStyle}>
            Together, we grow. <strong>SUTANA</strong> — Cultivating Tomorrow.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── New Unified Design System Styles ── */

const sectionStyle = {
  padding: '80px 40px',
  background: '#F5F5F5', // Light Gray background
  color: '#424242',      // Dark Gray text
  width: '100%',
  boxSizing: 'border-box'
};

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'flex',
  gap: 48,
  alignItems: 'center',
};

const imageWrapStyle = {
  flex: '0 0 50%',
  borderRadius: 10, // Images / thumbnails get 10px radius
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)', // Soft shadow
  border: '1px solid #8D6E63', // Earth Brown default border
};

const imageInnerStyle = {
  position: 'relative',
  width: '100%',
  paddingTop: '75%',
  background: '#FFFFFF',
};

const imgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const textWrapStyle = {
  flex: '0 0 50%',
  color: '#424242', // Text on light background -> Dark Gray
};

const headingStyle = {
  fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
  fontWeight: 800,
  color: '#1B5E20', // Dark Green
  letterSpacing: '-0.01em',
  marginBottom: 8,
};

const subStyle = {
  fontSize: 'clamp(0.85rem, 1.6vw, 1.15rem)',
  color: '#228B22', // Forest Green
  fontWeight: 600,
  marginBottom: 20,
};

const descStyle = {
  fontSize: '1rem',
  lineHeight: 1.6,
  color: '#424242',
  marginBottom: 24,
};

const servicesStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 24,
};

const serviceTagStyle = {
  padding: '6px 14px',
  background: '#A5D6A7', // Sage Green for small informational cards
  border: '1px solid #8D6E63', // Earth Brown thin border
  borderRadius: 6, // small elements get smaller radius
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#424242', // Dark Gray text on Sage Green background
};

const visionStyle = {
  marginBottom: 16,
};

const missionStyle = {
  marginBottom: 20,
};

const miniHeadStyle = {
  fontSize: '0.75rem',
  fontWeight: 800,
  color: '#1B5E20', // Dark Green
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: 4,
};

const miniTextStyle = {
  fontSize: '0.9rem',
  lineHeight: 1.6,
  color: '#424242',
};

const taglineStyle = {
  fontSize: '1rem',
  fontStyle: 'italic',
  color: '#2E8B57', // Emerald Green accent
  borderTop: '1px solid #8D6E63', // Earth Brown border
  paddingTop: 16,
};
