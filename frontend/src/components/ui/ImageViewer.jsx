import React, { useEffect } from 'react';

const ImageViewer = ({ file, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!file) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(2, 6, 23, 0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'min(92vw, 1100px)' }}>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
          {file.originalName || file.name || 'Uploaded Work'}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
              color: '#2563EB', background: '#fff', border: 'none', borderRadius: 6,
              padding: '7px 12px', textDecoration: 'none', cursor: 'pointer'
            }}
          >
            Open in Browser
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: "'Inter', sans-serif", background: 'transparent', border: 'none',
              color: '#e2e8f0', fontSize: 26, lineHeight: 1, cursor: 'pointer', padding: 4
            }}
          >
            ×
          </button>
        </div>
      </div>
      <img
        src={file.url}
        alt={file.originalName || file.name || 'Uploaded Work'}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          maxHeight: '86vh',
          objectFit: 'contain',
          backgroundColor: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '2px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}
      />
    </div>
  );
};

export default ImageViewer;