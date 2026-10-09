import React from 'react';

/** Stage-native navigation (not a step wizard — same page, scroll/focus sections). */
const STAGES = [
  { key: 'capture', label: 'Capture', match: ['New'] },
  { key: 'qualify', label: 'Qualify', match: ['Contacted', 'Qualified'] },
  { key: 'appoint', label: 'Appoint', match: ['Demo / Meeting', 'Proposal', 'Negotiation'] },
  { key: 'convert', label: 'Convert', match: ['Won'] },
  { key: 'contract', label: 'Contract', match: [] },
];

function activeStage(currentStage) {
  const stage = currentStage || 'New';
  const found = STAGES.find((s) => s.match.includes(stage));
  return found?.key || 'qualify';
}

export default function LeadPipelineRibbon({ currentStage, converted }) {
  const active = converted ? 'contract' : activeStage(currentStage);

  return (
    <nav className="pipeline-ribbon" aria-label="Sales pipeline stage">
      {STAGES.map((s) => (
        <a
          key={s.key}
          href={`#lead-section-${s.key}`}
          className={`pipeline-ribbon-item${active === s.key ? ' active' : ''}${converted && s.key === 'convert' ? ' done' : ''}`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
