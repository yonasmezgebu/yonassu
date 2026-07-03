import React from 'react';

const styles = `
@keyframes stampEffect {
  0% { transform: scale(3) rotate(-5deg); opacity: 0; }
  100% { transform: scale(1) rotate(-5deg); opacity: 1; }
}
@keyframes fadeSlideUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ceo-stamp-animate { animation: stampEffect 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.ceo-stamp-fade { animation: fadeSlideUp 0.5s ease-out forwards; }
.signature-font { font-family: 'Brush Script MT', 'cursive', 'Segoe Script'; font-size: 28px; line-height: 1; }
`;

const CEOStampSignature = ({ stamp, signerName, label = 'APPROVED' }) => {
  if (!stamp) return null;

  const hashPreview = stamp.stamp_id && stamp.stamp_id.length > 8
    ? `${stamp.stamp_id.slice(0, 4)}...${stamp.stamp_id.slice(-4)}`
    : stamp.stamp_id || '';

  return (
    <div className="ceo-stamp-fade" style={{ marginTop: 24 }}>
      <style>{styles}</style>
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        maxWidth: 420,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
          Digital Approval Record
        </div>

        <div style={{ position: 'relative', minHeight: 80, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%' }}>
            <div className="signature-font" style={{ color: '#1E3A5F', borderBottom: '2px solid #94A3B8', paddingBottom: 4 }}>
              {signerName || stamp.approved_by_name || 'Authorized Signatory'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94A3B8' }}>
              <span>Digitally Authenticated: {stamp.timestamp ? new Date(stamp.timestamp).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>#{hashPreview}</span>
            </div>
            {stamp.role && (
              <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600, marginTop: 2 }}>
                Role: {stamp.role}
              </div>
            )}
          </div>

          <div className="ceo-stamp-animate" style={{ position: 'absolute', top: -10, right: 0, pointerEvents: 'none' }}>
            <div style={{
              width: 130,
              height: 66,
              border: '3px double #1E3A5F',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 6px',
              background: 'rgba(255,255,255,0.9)',
              transform: 'rotate(-5deg)',
              borderRadius: 2
            }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: '#1E3A5F' }}>SUTANA</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A5F', borderTop: '1px solid #1E3A5F', borderBottom: '1px solid #1E3A5F', width: '100%', textAlign: 'center', margin: '1px 0', lineHeight: 1.3 }}>{label}</span>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: '#1E3A5F' }}>VERIFIED</span>
            </div>
          </div>
        </div>

        {stamp.stamp_id && (
          <div style={{ marginTop: 12, padding: '8px 10px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 9, fontFamily: 'monospace', color: '#64748B', wordBreak: 'break-all' }}>
            SHA-256: {stamp.stamp_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default CEOStampSignature;
