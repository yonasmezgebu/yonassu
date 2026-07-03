import React from 'react';

const DigitalStamp = ({ stamp, label = 'OFFICIALLY APPROVED' }) => {
  if (!stamp) return null;

  return (
    <div className="signature-container-outer">
      <div className="signature-container">
        <div className="signature-text">{stamp.approved_by_name || 'Authorized Signatory'}</div>
        <div className="digital-stamp">
          SUTANA<br />OFFICIAL<br />{label}
        </div>
      </div>
    </div>
  );
};

export default DigitalStamp;
