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
    <section className="ld-section ld-section--alt">
      <div className="ld-container">
        <div className="ld-grid-2col">
          {/* Left — Image */}
          <div className="ld-grid-2col__aside">
            <div className="ws-image-wrap" style={{ position: 'relative', paddingTop: '75%' }}>
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Event ${i + 1}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: i === index ? (fade ? 1 : 0) : 0,
                    transition: 'opacity 0.6s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right — Text */}
          <div className="ld-grid-2col__main">
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '-0.01em', marginBottom: '0.5rem' }}>
              SUTANA ENTERPRISE & CONSULTANCY
            </h2>
            <p style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.15rem)', color: 'hsl(var(--accent))', fontWeight: 600, marginBottom: '1.25rem' }}>
              Empowering Agriculture Through Innovation
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
              SUTANA Enterprise is a leading agricultural technology
              and consultancy firm dedicated to transforming farming
              practices across Ethiopia.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="cta-card__badge" style={{ marginBottom: 0 }}>Agricultural ERP Solutions</span>
              <span className="cta-card__badge" style={{ marginBottom: 0 }}>Farming Consultancy</span>
              <span className="cta-card__badge" style={{ marginBottom: 0 }}>Supply Chain Management</span>
              <span className="cta-card__badge" style={{ marginBottom: 0 }}>Training & Capacity Building</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                OUR VISION
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>
                To be the premier agricultural technology partner in Ethiopia,
                driving sustainable farming through innovation.
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                OUR MISSION
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>
                To empower farmers and agricultural enterprises with cutting-edge
                technology solutions that increase productivity, efficiency, and profitability.
              </p>
            </div>

            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'hsl(var(--accent))', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
              Together, we grow. <strong>SUTANA</strong> — Cultivating Tomorrow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
