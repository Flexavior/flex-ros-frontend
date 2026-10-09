import React from 'react';

/** Reusable schema-driven dropdown — options from GET /leads/schema picklists. */
export default function PicklistSelect({
  label,
  value,
  options = [],
  onChange,
  allowEmpty = true,
  emptyLabel = 'Select…',
  required = false,
  id,
}) {
  const selectId = id || `picklist-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="form-row">
      {label && <label htmlFor={selectId}>{label}{required ? ' *' : ''}</label>}
      <select
        id={selectId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
