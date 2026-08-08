import React from 'react';

/**
 * Fiori/Fluent-style segmented circular spinner.
 * Looks like a ring divided into gear-like teeth/notches, rotating continuously.
 */
const SegmentedSpinner = ({
  size = 40,
  segments = 12,
  color = '#2563EB',
  trackColor = '#E5E7EB',
  speed = 1.0,
  label = null,
  center = false,
}) => {
  const r = size / 2;
  const strokeW = size * 0.09;
  const innerR = r - strokeW * 0.5;
  const gap = 0.18; // gap ratio per segment in radians

  // Build SVG arc segments
  const arcSegments = [];
  const anglePerSeg = (2 * Math.PI) / segments;

  for (let i = 0; i < segments; i++) {
    const startAngle = i * anglePerSeg + gap / 2 - Math.PI / 2;
    const endAngle   = startAngle + anglePerSeg - gap;

    const x1 = r + innerR * Math.cos(startAngle);
    const y1 = r + innerR * Math.sin(startAngle);
    const x2 = r + innerR * Math.cos(endAngle);
    const y2 = r + innerR * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const opacity  = 0.15 + (0.85 * i) / (segments - 1); // fade trail

    arcSegments.push(
      <path
        key={i}
        d={`M ${x1} ${y1} A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        opacity={opacity}
      />
    );
  }

  const spinId = `spin-seg-${size}`;

  const wrapper = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...(center ? { width: '100%', padding: '48px 0' } : {}),
      }}
    >
      <style>{`
        @keyframes ${spinId} {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          animation: `${spinId} ${(1 / speed).toFixed(2)}s linear infinite`,
        }}
      >
        {/* Track ring */}
        <circle
          cx={r}
          cy={r}
          r={innerR}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeW * 0.4}
          opacity={0.5}
        />
        {/* Segmented teeth */}
        {arcSegments}
      </svg>

      {label && (
        <p style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 500,
          color: '#6B7280',
          letterSpacing: '0.02em',
        }}>
          {label}
        </p>
      )}
    </div>
  );

  return wrapper;
};

export default SegmentedSpinner;
