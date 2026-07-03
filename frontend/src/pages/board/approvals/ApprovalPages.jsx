import React, { useState, useEffect } from 'react';
import ApprovalQueue from './ApprovalQueue';
import { boardAggregationService } from '../../../utils/boardAggregationService';

export const BudgetApproval = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = () => setItems(boardAggregationService.getApprovalItems().filter(i => i.type === 'budget'));
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <ApprovalQueue 
      items={items} 
      title="Budget Approvals" 
      description="Review and approve departmental budget requests. Counter-propose amounts by using the Amend feature." 
      allowAmend={true} 
      allowHold={false} 
    />
  );
};

export const CEODecisions = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = () => setItems(boardAggregationService.getApprovalItems().filter(i => i.type === 'ceo_decision'));
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <ApprovalQueue 
      items={items} 
      title="CEO Decisions Approval" 
      description="Governance oversight on major strategic and operational decisions submitted by the CEO." 
      allowAmend={false} 
      allowHold={false} 
    />
  );
};

export const MajorInvestments = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = () => setItems(boardAggregationService.getApprovalItems().filter(i => i.type === 'investment'));
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <ApprovalQueue 
      items={items} 
      title="Major Investments" 
      description="Capital expenditure proposals, ROI analysis, and risk assessments. You may place items on hold for further auditing." 
      allowAmend={false} 
      allowHold={true} 
    />
  );
};

export const PolicyChanges = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = () => setItems(boardAggregationService.getApprovalItems().filter(i => i.type === 'policy'));
    fetch();
    return boardAggregationService.subscribe(fetch);
  }, []);

  return (
    <ApprovalQueue 
      items={items} 
      title="Policy Changes" 
      description="Review proposed amendments to company-wide policies, handbooks, and compliance procedures." 
      allowAmend={false} 
      allowHold={false} 
    />
  );
};
