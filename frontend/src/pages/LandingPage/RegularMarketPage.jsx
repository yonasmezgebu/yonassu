import React, { useState, useEffect } from 'react';
import { PublicNav } from './PublicNavFooter';
import './LandingRedesign.css';
import './RegularMarketPage.css';

const launchDate = new Date();
launchDate.setDate(launchDate.getDate() + 30);

const RegularMarketPage = () => {
  const [time, setTime] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const tick = () => {
      const now  = Date.now();
      const dist = launchDate - now;
      if (dist < 0) {
        setTime({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      setTime({
        days:    Math.floor(dist / 86400000).toString().padStart(2, '0'),
        hours:   Math.floor((dist % 86400000) / 3600000).toString().padStart(2, '0'),
        minutes: Math.floor((dist % 3600000) / 60000).toString().padStart(2, '0'),
        seconds: Math.floor((dist % 60000) / 1000).toString().padStart(2, '0'),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const UNITS = [
    { label: 'Days',    value: time.days },
    { label: 'Hours',   value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];

  return (
    <>
      <PublicNav />
      <div className="rmp-page">
        <div className="rmp-card">
          <h1 className="rmp-title">Coming Soon</h1>
          <p className="rmp-sub">We're building something amazing. Stay tuned!</p>
          <div className="rmp-countdown">
            {UNITS.map(t => (
              <div key={t.label} className="rmp-count-box">
                <span className="rmp-count-value">{t.value}</span>
                <span className="rmp-count-label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegularMarketPage;
