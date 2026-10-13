import React, { useId, useState } from 'react';
import HelpIcon from './HelpIcon.jsx';

/**
 * Collapsible workflow section for lead detail and forms.
 */
export default function AccordionSection({
  id,
  title,
  subtitle,
  defaultOpen = false,
  helpText,
  helpTitle,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const headerId = useId();

  return (
    <section className="accordion-section" id={id}>
      <h2 className="accordion-heading">
        <button
          type="button"
          id={headerId}
          className="accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="accordion-trigger-text">
            <span className="accordion-title">{title}</span>
            {subtitle ? <span className="accordion-subtitle kpi-sub">{subtitle}</span> : null}
          </span>
          <span className="accordion-chevron" aria-hidden>{open ? '▾' : '▸'}</span>
        </button>
        {helpText ? (
          <HelpIcon text={helpText} title={helpTitle || title} label={`Help: ${title}`} />
        ) : null}
      </h2>
      {open ? (
        <div id={panelId} className="accordion-panel card" role="region" aria-labelledby={headerId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
