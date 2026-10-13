import React from 'react';

/**
 * Pipeline chips — scroll/open matching accordion sections on Lead detail.
 */
export const PIPELINE_SECTIONS = [
  { key: 'capture', chip: 'Capture', sectionId: 'lead-section-capture' },
  { key: 'qualify', chip: 'Qualify', sectionId: 'lead-section-qualify' },
  { key: 'appoint', chip: 'Appoint', sectionId: 'lead-section-appoint' },
  { key: 'convert', chip: 'Convert', sectionId: 'lead-section-convert' },
  { key: 'contract', chip: 'Contract', sectionId: 'lead-section-contract' },
];

const STAGE_MATCH = [
  { key: 'capture', match: ['New', 'Not Qualified'] },
  { key: 'qualify', match: ['Contacted', 'Qualified'] },
  { key: 'appoint', match: ['Demo / Meeting', 'Proposal', 'Proposal Sent', 'Negotiation'] },
  { key: 'convert', match: ['Won'] },
  { key: 'contract', match: [] },
];

function activeChipKey(currentStage, converted) {
  if (converted) return 'contract';
  const stage = currentStage || 'New';
  const found = STAGE_MATCH.find((s) => s.match.includes(stage));
  if (found) return found.key;
  if (stage === 'Lost') return 'capture';
  return 'qualify';
}

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="m4 8 8 5 8-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function LeadPipelineRibbon({
  currentStage,
  converted,
  onJumpToSection,
  onEmailClick,
  emailHint = 'Send email (Microsoft 365)',
}) {
  const active = activeChipKey(currentStage, converted);

  const jump = (sectionId) => {
    if (onJumpToSection) onJumpToSection(sectionId);
  };

  return (
    <nav className="pipeline-ribbon" aria-label="Sales pipeline">
      {PIPELINE_SECTIONS.map((s) => (
        <button
          key={s.key}
          type="button"
          className={`pipeline-ribbon-item${active === s.key ? ' active' : ''}${converted && s.key === 'convert' ? ' done' : ''}`}
          onClick={() => jump(s.sectionId)}
        >
          {s.chip}
        </button>
      ))}
      <button
        type="button"
        className="pipeline-ribbon-email"
        aria-label="Send email to lead"
        title={emailHint}
        onClick={() => (onEmailClick ? onEmailClick() : jump('lead-section-email'))}
      >
        <EmailIcon />
        <span className="pipeline-ribbon-email-label">Email</span>
      </button>
    </nav>
  );
}
