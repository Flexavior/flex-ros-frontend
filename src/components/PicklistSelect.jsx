import React from 'react';

/** Reusable schema-driven dropdown — options from GET /leads/schema picklists. */
function withLegacyOption(options, value) {
  const list = Array.isArray(options) ? options : [];
  const v = value || '';
  if (v && !list.includes(v)) {
    return [v, ...list];
  }
  return list;
}

export default function PicklistSelect({
  label,
  value,
  options = [],
  onChange,
  allowEmpty = true,
  emptyLabel = 'Select…',
  required = false,
  id,
  preserveUnknownValue = true,
}) {
  const selectId = id || `picklist-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const optionList = preserveUnknownValue ? withLegacyOption(options, value) : options;

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
        {optionList.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
