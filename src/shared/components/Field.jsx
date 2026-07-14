import React from 'react';

const errStyle = {
  borderColor: 'var(--red)',
  boxShadow: '0 0 0 3px oklch(0.58 0.17 25 / 0.13)',
};

function compressImage(dataUrl, maxDim = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Limit longest side to maxDim, preserving aspect ratio
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // Fallback to original
    img.src = dataUrl;
  });
}

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
              // Safety size limit (20MB)
              const maxFileSize = 20 * 1024 * 1024;
              if (file.size > maxFileSize) {
                alert(`File size exceeds 20MB limit. Please upload a smaller image.`);
                return;
              }
              const reader = new FileReader();
              reader.onloadend = async () => {
                const originalDataUrl = reader.result;
                const originalLength = originalDataUrl.length;
                console.log(`[Field] Logo uploaded, original size: ${(originalLength / 1024).toFixed(1)} KB`);

                const compressedDataUrl = await compressImage(originalDataUrl, 1200, 0.8);
                const compressedLength = compressedDataUrl.length;
                console.log(`[Field] Compressed logo size: ${(compressedLength / 1024).toFixed(1)} KB (Reduced by ${((originalLength - compressedLength) / originalLength * 100).toFixed(1)}%)`);

                onChange(compressedDataUrl);
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
