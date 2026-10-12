import React from 'react';

export default function ListSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  id = 'list-search',
  inline = false,
}) {
  return (
    <div
      className="form-row"
      style={inline ? undefined : { marginBottom: 12, maxWidth: 420 }}
    >
      <label htmlFor={id} className="kpi-sub">Search</label>
      <input
        id={id}
        name="q"
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
