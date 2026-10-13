import React, { useId } from 'react';
import HelpIcon from './HelpIcon.jsx';

function Chevron({ open }) {
  return (
    <span className={`accordion-chevron-wrap${open ? ' is-open' : ''}`} aria-hidden>
      <svg className="accordion-chevron-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Collapsible workflow section — help sits inside the header bar (aligned with other sections).
 */
export default function AccordionSection({
  id,
  title,
  subtitle,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  helpText,
  helpTitle,
  children,
}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const panelId = useId();
  const headerId = useId();

  return (
    <section className="accordion-section" id={id}>
      <div className="accordion-header-bar">
        <button
          type="button"
          id={headerId}
          className="accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <span className="accordion-trigger-text">
            <span className="accordion-title">{title}</span>
            {subtitle ? <span className="accordion-subtitle kpi-sub">{subtitle}</span> : null}
          </span>
          <span className="accordion-trigger-actions">
            {helpText ? (
              <span
                className="accordion-help-inline"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <HelpIcon text={helpText} title={helpTitle || title} label={`Help: ${title}`} />
              </span>
            ) : null}
            <Chevron open={open} />
          </span>
        </button>
      </div>
      {open ? (
        <div id={panelId} className="accordion-panel card" role="region" aria-labelledby={headerId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
