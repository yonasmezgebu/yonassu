import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { STAGE_BUTTONS } from './printingStageConfig';

const StageNav = ({ current, showNew = true }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  // Map a stage button id -> count of orders currently in that stage (real DB).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await apiClient.get('/printing/statistics');
        const breakdown = res?.data?.statusBreakdown || [];
        const byCode = {};
        breakdown.forEach(s => { if (s.status_code) byCode[s.status_code] = Number(s.count) || 0; });
        const stageCounts = {};
        STAGE_BUTTONS.forEach(b => {
          stageCounts[b.id] = b.statuses.reduce((sum, code) => sum + (byCode[code] || 0), 0);
        });
        if (alive) setCounts(stageCounts);
      } catch (err) {
        if (alive) setCounts({});
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  return (
    <nav className="stg-nav">
      <div className="stg-nav-track">
        {STAGE_BUTTONS.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <span className="stg-nav-arrow">›</span>}
            <button
              type="button"
              className={`stg-nav-item${current === s.id ? ' is-active' : ''}`}
              onClick={() => navigate(s.path)}
            >
              <span className="stg-nav-dot" />
              {s.label}
              {(counts[s.id] !== undefined) && (
                <span
                  style={{
                    minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: current === s.id ? '#2563EB' : '#E2E8F0',
                    color: current === s.id ? '#fff' : '#334155',
                    fontSize: 11, fontWeight: 700, lineHeight: 1
                  }}
                >
                  {counts[s.id]}
                </span>
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
      {showNew && (
        <button type="button" className="stg-btn stg-btn--primary stg-btn--sm stg-nav-new" onClick={() => navigate('/printing-manager/jobs/new')}>
          <Plus size={14} /> New Job
        </button>
      )}
    </nav>
  );
};

export default StageNav;