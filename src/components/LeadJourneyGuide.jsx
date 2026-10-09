import React, { useState } from 'react';
import HelpIcon from './HelpIcon.jsx';
import { help } from '../content/helpText.js';

const STEPS = [
  { title: '1. Capture', body: 'Create lead with source, stage, contact details, and custom fields.' },
  { title: '2. Qualify & follow up', body: 'Log engagements with outcome and next follow-up; move stage as the deal progresses.' },
  { title: '3. Meeting & proposal', body: 'Schedule appointments; email via Microsoft 365 when connected.' },
  { title: '4. Convert', body: 'Convert to customer to generate Client ID, products, and onboarding checklists.' },
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
