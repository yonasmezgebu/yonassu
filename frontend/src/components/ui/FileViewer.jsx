import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

const getExt = (name = '') => String(name || '').split('.').pop().toLowerCase();

const FileViewer = ({ file, onClose }) => {
  const isImage = !!file && IMAGE_EXTS.includes(getExt(file.originalName || file.name));
  const isDocx = !!file && getExt(file.originalName || file.name) === 'docx';
  const [docStatus, setDocStatus] = useState('idle'); // idle | loading | ready | error
  const docContainerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isDocx) { setDocStatus('idle'); return; }
    let cancelled = false;
    setDocStatus('loading');
    (async () => {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        if (!docContainerRef.current) {
          // Container not mounted yet — wait a frame and retry once mounted.
          await new Promise(r => setTimeout(r, 50));
          if (cancelled || !docContainerRef.current) throw new Error('Container not ready');
        }
        docContainerRef.current.innerHTML = '';
        await renderAsync(blob, docContainerRef.current, undefined, {
          useBase64URL: true,
          experimental: true,
          breakPages: false,
          ignoreLastRenderedPageBreak: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderComments: true,
        });
        if (!cancelled) setDocStatus('ready');
      } catch (err) {
        if (!cancelled) setDocStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [file, isDocx]);

  if (!file) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(2, 6, 23, 0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0', gap: 12, fontFamily: "'Inter', sans-serif"
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'min(94vw, 1100px)' }}>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
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

      {isImage && (
        <img
          src={file.url}
          alt={file.originalName || file.name || 'Uploaded Work'}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '94vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            backgroundColor: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '2px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        />
      )}

      {isDocx && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(94vw, 1000px)',
            borderRadius: 6,
            overflow: 'auto',
            background: '#fff',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
            minHeight: 200,
            maxHeight: '88vh',
            alignSelf: 'center'
          }}
        >
          <div ref={docContainerRef} style={{ minHeight: 200 }} />
          {docStatus === 'loading' && (
            <div
              style={{
                position: 'absolute', inset: 0, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', fontSize: 14, fontWeight: 600
              }}
            >
              Loading document…
            </div>
          )}
          {docStatus === 'error' && (
            <div
              style={{
                position: 'absolute', inset: 0, background: '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: 30, textAlign: 'center'
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                This document could not be previewed here.
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                It is saved to the server correctly. Use "Open in Browser" above.
              </span>
            </div>
          )}
        </div>
      )}

      {!isImage && !isDocx && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 10, padding: '40px 50px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            maxWidth: 480, textAlign: 'center'
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            This file type can't be previewed in the browser.
          </span>
          <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            It is saved correctly on the server. Open it in a new Chrome tab to download and view it.
          </span>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
              color: '#fff', background: '#2563EB', border: 'none', borderRadius: 8,
              padding: '10px 18px', textDecoration: 'none', cursor: 'pointer'
            }}
          >
            Open in Chrome
          </a>
        </div>
      )}
    </div>
  );
};

export default FileViewer;