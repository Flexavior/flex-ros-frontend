import React, { useState } from 'react';
import HelpIcon from './HelpIcon.jsx';
import { help } from '../content/helpText.js';

const STEPS = [
  { title: '1. Capture', body: 'Business + initial contact, geo, sector/industry, source.' },
  { title: '2. Qualify', body: 'Engagement loops — contacts, channels, response notes; watch for idle follow-ups.' },
  { title: '3. Appoint', body: 'Meetings and high-potential actions (proposal, pricing, volume).' },
  { title: '4. Convert', body: 'Deal → Customer with Client ID (YYMMDD_Cn); map products.' },
  { title: '5. Contract', body: 'NDA/MoU/contract and provisioning (logo, data) on the customer record.' },
];

export default function LeadJourneyGuide() {
  const [open, setOpen] = useState(true);

  return (
    <section className="card journey-guide" aria-labelledby="lead-journey-heading">
      <div className="journey-guide-header">
        <h2 id="lead-journey-heading" className="journey-guide-title">
          Lead generation &amp; pipeline journey
          <HelpIcon text={help.leadGeneration} label="Help: lead journey" />
        </h2>
        <button type="button" className="secondary small" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'} steps
        </button>
      </div>
      {open && (
        <ol className="journey-steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <strong>{s.title}</strong>
              <span>{s.body}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
