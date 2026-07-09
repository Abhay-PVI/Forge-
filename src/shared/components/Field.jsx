import React from 'react';

const errStyle = {
  borderColor: 'var(--red)',
  boxShadow: '0 0 0 3px oklch(0.58 0.17 25 / 0.13)',
};

export default function Field({ field, value, onChange, error }) {
  const id = 'f_' + field.key;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const formElements = Array.from(
        document.querySelectorAll('input:not([type="file"]):not([placeholder*="Search"]):not([type="search"]), textarea, select')
      );
      const currentIndex = formElements.indexOf(event.target);
      if (currentIndex === -1) return;

      // Find next empty field forward
      for (let i = currentIndex + 1; i < formElements.length; i++) {
        const nextEl = formElements[i];
        if (!nextEl.value || nextEl.value.trim() === '') {
          nextEl.focus();
          return;
        }
      }

      // Wrap around from the beginning
      for (let i = 0; i < currentIndex; i++) {
        const nextEl = formElements[i];
        if (!nextEl.value || nextEl.value.trim() === '') {
          nextEl.focus();
          return;
        }
      }

      // Fallback: move to next element regardless
      if (currentIndex + 1 < formElements.length) {
        formElements[currentIndex + 1].focus();
      }
    }
  };

  const commonProps = {
    id,
    value: value || '',
    placeholder: field.placeholder,
    onChange: (event) => onChange(event.target.value),
    onKeyDown: handleKeyDown,
  };

  let control;

  if (field.type === 'textarea') {
    control = (
      <textarea
        {...commonProps}
        className="input"
        style={error ? errStyle : null}
      />
    );
  } else if (field.type === 'file') {
    control = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          id={id}
          type="file"
          accept="image/*"
          className="input"
          onChange={(event) => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                onChange(reader.result);
              };
              reader.readAsDataURL(file);
            }
          }}
          style={error ? errStyle : null}
        />
        {value && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Current logo:</span>
            <img 
              src={value} 
              alt="Preview" 
              style={{ 
                maxHeight: 30, 
                maxWidth: 100, 
                objectFit: 'contain', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--r-xs)', 
                padding: 2, 
                background: 'white' 
              }} 
            />
          </div>
        )}
      </div>
    );
  } else if (field.type === 'select') {
    control = (
      <select
        id={id}
        className="select"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        style={error ? errStyle : null}
      >
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (field.unit) {
    control = (
      <div className="input-affix" style={error ? errStyle : null}>
        <input
          {...commonProps}
          className={'input' + (field.mono ? ' mono' : '')}
          inputMode={field.type === 'number' ? 'decimal' : 'text'}
        />
        <span className="affix">{field.unit}</span>
      </div>
    );
  } else {
    control = (
      <input
        {...commonProps}
        className={'input' + (field.mono ? ' mono' : '')}
        inputMode={field.type === 'number' ? 'decimal' : 'text'}
        style={error ? errStyle : null}
      />
    );
  }

  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {field.label}
        {field.required && <span className="req">*</span>}
      </label>
      {control}
      {error ? (
        <div className="field-hint" style={{ color: 'var(--red-text)' }}>
          {error}
        </div>
      ) : field.hint ? (
        <div className="field-hint">{field.hint}</div>
      ) : null}
    </div>
  );
}
