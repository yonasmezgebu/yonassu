import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * SignatureCanvas – a hand-drawn digital signature capture component.
 *
 * Props:
 *   onSave(dataUrl)  – called when the user clicks "Accept Signature"
 *   onClear()        – optional callback when cleared
 *   width            – canvas width in px (default 460)
 *   height           – canvas height in px (default 160)
 *   label            – heading text
 *   subtitle         – helper text shown under the heading
 */
const SignatureCanvas = ({ onSave, onClear, width = 460, height = 160, label = 'Signatory Signature', subtitle = 'Sign inside the box below — required before submission', autoSave = false }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [preview, setPreview] = useState(null);
  const lastPos = useRef(null);
  const hasDrawnRef = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Light ruled lines to mimic paper
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const startDraw = (e) => {
    if (accepted) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || accepted) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    setHasDrawn(true);
    hasDrawnRef.current = true;
  };

  const endDraw = () => {
    setDrawing(false);
    if (autoSave && hasDrawnRef.current && !accepted) handleAccept();
  };

  const handleClear = () => {
    setAccepted(false);
    setHasDrawn(false);
    hasDrawnRef.current = false;
    setPreview(null);
    initCanvas();
    if (onClear) onClear();
    if (onSave) onSave(null);
  };

  const handleAccept = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setPreview(dataUrl);
    setAccepted(true);
    if (onSave) onSave(dataUrl);
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      border: accepted ? '2px solid #059669' : '2px dashed #94a3b8',
      borderRadius: 12,
      padding: 16,
      background: accepted ? '#f0fdf4' : '#f8fafc',
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accepted ? '#065f46' : '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ✍️ {label}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {accepted ? '✅ Signature accepted' : subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer'
            }}
          >
            Clear
          </button>
          {hasDrawn && !accepted && (
            <button
              type="button"
              onClick={handleAccept}
              style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                border: 'none', background: '#059669', color: 'white', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(5,150,105,0.25)'
              }}
            >
              ✓ Accept Signature
            </button>
          )}
        </div>
      </div>

      {/* Canvas wrapper – paper look */}
      <div style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        background: 'white',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)',
        cursor: accepted ? 'default' : 'crosshair',
        userSelect: 'none',
      }}>
        {/* "X" marker left side */}
        <div style={{
          position: 'absolute', left: 12, bottom: 16,
          fontSize: 22, color: '#94a3b8', fontWeight: 700, pointerEvents: 'none', lineHeight: 1
        }}>×</div>

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: 'block', width: '100%', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Placeholder text when empty */}
        {!hasDrawn && !accepted && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' }}>Sign here…</span>
          </div>
        )}

        {/* Signature line */}
        <div style={{
          position: 'absolute', bottom: 24, left: 32, right: 32,
          borderBottom: '1.5px solid #94a3b8', pointerEvents: 'none'
        }} />
      </div>

      {accepted && (
        <div style={{
          marginTop: 8, fontSize: 11, color: '#059669', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span>✅</span> Hand signature captured — will appear on the document
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;
