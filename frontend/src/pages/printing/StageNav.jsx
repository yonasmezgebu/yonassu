import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const STAGES = [
  { id: 'queue',     label: 'Pending',    path: '/printing-manager/jobs/queue' },
  { id: 'design',    label: 'Design',     path: '/printing-manager/jobs/design' },
  { id: 'prepress',  label: 'Prepress',   path: '/printing-manager/jobs/prepress' },
  { id: 'printing',  label: 'Printing',   path: '/printing-manager/jobs/printing' },
  { id: 'finishing', label: 'Finishing',  path: '/printing-manager/jobs/finishing' },
  { id: 'delivery',  label: 'Delivery',   path: '/printing-manager/jobs/delivery' },
];

const StageNav = ({ current, showNew = true }) => {
  const navigate = useNavigate();

  return (
    <nav className="stg-nav">
      <div className="stg-nav-track">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <span className="stg-nav-arrow">›</span>}
            <button
              type="button"
              className={`stg-nav-item${current === s.id ? ' is-active' : ''}`}
              onClick={() => navigate(s.path)}
            >
              <span className="stg-nav-dot" />
              {s.label}
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
