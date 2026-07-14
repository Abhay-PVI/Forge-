
import React, { useEffect, useRef, useState } from 'react';
import Icon from "../../../../../shared/components/Icon";
import Field from "../../../../../shared/components/Field";
import { STRING_SIZE_TABS } from "../forms/stringSizingTabs";
import CalcPanel from "./CalcPanel";
import Stepper from "../../../../../shared/components/Stepper";
import UploadZone from "../../../../../shared/components/UploadZone";
import ReportDoc from "../reports/ReportDoc";
import Papa from "papaparse";
import { calculateYearlyVoc, calculateYearlyIsc, prepareTableData } from "../calculations/calculateYearlyVoc&Isc";
import { buildMinVoltageDegradationTable } from "../forms/utils/buildVoc&IscTable";
import { extractPvsyst, generateAshrae, } from '../api/extractionApi';
import { API_BASE_URL } from "../api/apiConfig";
import { parseModuleExcel } from "../forms/utils/parseModuleExcel";
import { fetchLastPvReportApi } from "../api/reportsApi";

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

async function convertPdfToImages(pdfBlob) {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      processPdf(window.pdfjsLib, pdfBlob, resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      processPdf(pdfjsLib, pdfBlob, resolve, reject);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js library"));
    document.head.appendChild(script);
  });
}

async function processPdf(pdfjsLib, pdfBlob, resolve, reject) {
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const images = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      const pngDataUrl = canvas.toDataURL("image/png");
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      console.log(`[FormScreen] Appendix Page ${pageNum} compressed from PNG (${(pngDataUrl.length / 1024).toFixed(1)} KB) to JPEG (${(jpegDataUrl.length / 1024).toFixed(1)} KB)`);
      images.push(jpegDataUrl);
    }

    resolve(images);
  } catch (error) {
    reject(error);
  }
}


// export default function FormScreen() {
//   return <div>Form Screen</div>;
// }

function tabRequiredKeys(tab) {
  const fields = tab.fields || (tab.groups || []).flatMap((group) => group.fields);
  const fieldKeys = fields.filter((field) => field.required).map((field) => field.key);
  const uploadKeys = (tab.uploads || []).filter((upload) => upload.required).map((upload) => upload.key);
  return [...fieldKeys, ...uploadKeys];
}

function tabStatus(tab, values, files) {
  const keys = tabRequiredKeys(tab);
  if (!keys.length) return 'complete';

  const filled = keys.filter((key) => {
    if (tab.uploads && tab.uploads.some((upload) => upload.key === key)) {
      return !!files[key];
    }

    return values[key] != null && String(values[key]).trim() !== '';
  }).length;

  if (filled === 0) return 'empty';
  if (filled < keys.length) return 'partial';
  return 'complete';
}
// Handing the UPLOAD CSV FILE

function overallStatus(values, files) {
  const total = STRING_SIZE_TABS.reduce((sum, tab) => sum + tabRequiredKeys(tab).length, 0);
  let done = 0;

  STRING_SIZE_TABS.forEach((tab) => {
    tabRequiredKeys(tab).forEach((key) => {
      const isUpload = tab.uploads && tab.uploads.some((upload) => upload.key === key);
      const hasValue = isUpload
        ? !!files[key]
        : values[key] != null && String(values[key]).trim() !== '';

      if (hasValue) done += 1;
    });
  });

  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    complete: done === total,
  };
}

function docNumber(values) {
  const code = (values.projectCode || 'XXX').toUpperCase().replace(/\s/g, '');
  const rev = values.revision || 'R0';
  return `PVI-STR-${code}-DBR-${rev}`;
}

function StatusDot({ status }) {
  if (status === 'complete') {
    return (
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name="check" size={11} stroke={3} />
      </span>
    );
  }

  const color = status === 'partial' ? 'var(--amber)' : 'var(--border-strong)';
  return <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${color}`, flex: 'none', background: status === 'partial' ? 'var(--amber-soft)' : 'transparent' }} />;
}

function ProgressMini({ status }) {
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
        <span className="mono">{status.pct}%</span>
        <span>{status.done}/{status.total}</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: status.pct + '%', background: 'var(--accent)', borderRadius: 99, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}

function SectionTitle({ tab }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name={tab.icon} size={17} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>{tab.name}</h2>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '6px 0 0' }}>{tab.blurb}</p>
    </div>
  );
}

function TabBody({ tab, values, setValue, files, setFile, showErrors }) {
  const [solarCalcTable, setSolarCalcTable] = useState(null);
  const [solarCalcValues, setSolarCalcValues] = useState(null);

  const errFor = (field, isUpload = false) => {
    if (!showErrors || !field.required) return null;
    const hasValue = isUpload
      ? !!files[field.key]
      : values[field.key] != null && String(values[field.key]).trim() !== '';

    return hasValue ? null : 'Required';
  };

  if (tab.uploads) {

    // ==========================
    // PVSYST PDF EXTRACTION
    // ==========================


    // Uploading the Pvsyst File 
    const handleFileUpload = async (key, value) => {
      // Safety file size check (20MB limit)
      const maxFileSize = 20 * 1024 * 1024; // 20 MB
      if (value && value.file && value.file.size > maxFileSize) {
        alert(`File size exceeds 20MB limit. Please upload a smaller file.`);
        return;
      }

      setFile(key, value);

      // ===================
      // 26-YEAR HISTORICAL IMAGES
      // ===================
      if (key === "Results_of_26-year_voltage" || key === "Results_of_26-year_current") {
        if (value && value.file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const originalDataUrl = reader.result;
            const originalLength = originalDataUrl.length;
            console.log(`[FormScreen] Converted ${key} to Base64, original size: ${(originalLength / 1024).toFixed(1)} KB`);

            const compressedDataUrl = await compressImage(originalDataUrl, 1200, 0.8);
            const compressedLength = compressedDataUrl.length;
            console.log(`[FormScreen] Compressed ${key} Base64 size: ${(compressedLength / 1024).toFixed(1)} KB (Reduced by ${((originalLength - compressedLength) / originalLength * 100).toFixed(1)}%)`);

            setValue(key, `src="${compressedDataUrl}"`);
          };
          reader.readAsDataURL(value.file);
        } else {
          setValue(key, "");
        }
      }

      // ===================
      // PVSYST PDF
      // ===================

      if (key === "pvsystReport" && !values.pvsystData) {

        try {

          console.log("Starting PVsyst extraction...");
          const result = await extractPvsyst(value.file);
          setValue("pvsystData", result.data);
          console.log("PVsyst extraction complete");

        } catch (err) {

          console.error(
            "PVsyst extraction failed",
            err
          );
        }
      }

      // ===================
      // MODULE EXCEL
      // ===================

      if (key === "moduleExcel") {
        try {
          console.log("Starting Module Excel parsing...");
          const result = await parseModuleExcel(value.file);

          console.log("parseModuleExcel result:", result);

          // Guard Clause: If parsing failed completely, stop here safely
          if (!result || !result.values) {
            console.error("Parsing completed but 'result' or 'result.values' is missing entirely.");
            return;
          }

          // 1. Set the raw generated variant table HTML
          setValue("MODULE_VARIANT_TABLE", result.variantTable || "");

          if (!result.values || Object.keys(result.values).length === 0) {
            console.warn("parseModuleExcel returned an empty or missing values object:", result);
          }
          async function triggerPdfCompilation(excelMetrics) {
            try {
              // --- STEP 1: FETCH CALCULATION VALUES & TABLES (JSON) ---
              console.log("Fetching structured metrics data...");
              const dataResponse = await fetch(
                `${API_BASE_URL}/generate-solar-report-data`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    values: excelMetrics,
                  }),
                }
              );

              if (!dataResponse.ok) {
                throw new Error(`Data fetch failed: ${dataResponse.status}`);
              }

              const dataResult = await dataResponse.json();
              console.log("Solar report JSON data result:", dataResult);

              // Access calculation table and structured scalar values
              const calcTable = dataResult?.calc_table;
              const calcValues = dataResult?.calc_values;

              // Use standard react/form hooks to automatically fill placeholders
              if (calcValues) {
                console.log("Injecting calculated constants to placeholders:", calcValues);
                setSolarCalcValues(calcValues);
                setValue("solarCalcValues", calcValues);
                console.log("solarCalcValues in form state====>>:", solarCalcValues);
                // Set selected modules value straight into form management state
                if (calcValues.selected_modules && calcValues.selected_modules.length > 0) {
                  setValue("SELECTED_MODULES_IN_SERIES", calcValues.selected_modules[0]);
                }
              }


              // console.log("solarCalcValues in form state:", getValues("solarCalcValues"));

              // Keep local preview synchronized
              if (calcTable) {
                setSolarCalcTable(calcTable);
              }


              // --- STEP 2: FETCH APPENDIX FILE (BINARY BLOB) ---
              console.log("Compiling appendix document structure...");
              const pdfResponse = await fetch(
                `${API_BASE_URL}/generate-solar-report-pdf`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    values: excelMetrics,
                  }),
                }
              );

              if (!pdfResponse.ok) {
                throw new Error(`PDF generation failed: ${pdfResponse.status}`);
              }

              // Extracted cleanly as an isolated binary object assignment
              const pdfBlob = await pdfResponse.blob();
              console.log("Appendix document asset successfully compiled:", pdfBlob);

              // Convert PDF pages to high-resolution base64 images and store in state
              try {
                console.log("Converting appendix PDF pages to images...");
                const images = await convertPdfToImages(pdfBlob);
                setValue("appendixPages", images);
                console.log("Appendix PDF successfully converted. Total pages:", images.length);
              } catch (convErr) {
                console.error("Failed to convert PDF pages to images:", convErr);
              }

            } catch (pdfError) {
              console.error("Solar Report Processing Error:", pdfError);
              alert(`Failed to sync calculations or compile appendix: ${pdfError.message}`);
            }
          }

          // 2. Map all extracted values directly into the template context state
          Object.entries(result.values || {}).forEach(([parsedKey, val]) => {
            console.log(`Setting parsed module value: ${parsedKey} ->`, val);
            setValue(parsedKey, val);
          });

          // Send the full parsed payload to the backend once
          await triggerPdfCompilation(result.values);

          // 3. Fallback/Safeguard check for complex split layout variables 
          const templateFallbacks = [
            "module_length", "module_width", "module_height",
            "wind_load", "snow_load",
            "deg_year1", "deg_year30", "deg_yearly",
            "warranty_product", "warranty_performance"
          ];

          templateFallbacks.forEach((fallbackKey) => {
            if (result.values && result.values[fallbackKey] !== undefined) {
              setValue(fallbackKey, result.values[fallbackKey]);
            } else {
              console.warn(`Template field "${fallbackKey}" was not captured from Excel sheet. Initializing as empty.`);
              setValue(fallbackKey, "");
            }
          });

          console.log("Module Excel parsing and structural synchronization complete.");
        } catch (err) {
          console.error("Module Excel parsing failed", err);
        }
      }
    };
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {tab.uploads.map((upload) => (
          <div key={upload.key}>
            <UploadZone
              spec={upload}
              file={files[upload.key]}
              onSet={(value) => handleFileUpload(upload.key, value)}
              onClear={() => {
                setFile(upload.key, null);
                if (upload.key === "Results_of_26-year_voltage" || upload.key === "Results_of_26-year_current") {
                  setValue(upload.key, "");
                }
              }}
            />
            {errFor(upload, true) && (
              <div className="field-hint" style={{ color: 'var(--red-text)', marginLeft: 4 }}>
                This datasheet is required.
              </div>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--blue-soft)', borderRadius: 'var(--r-md)', marginTop: 4 }}>
          <Icon name="info" size={15} style={{ color: 'var(--blue-text)', marginTop: 1, flex: 'none' }} />
          <div style={{ fontSize: 12, color: 'var(--blue-text)', lineHeight: 1.5 }}>
            Uploaded datasheets are embedded in the report appendix and cross-referenced against the Technical Inputs you provide in the next step.
          </div>

        </div>
      </div>

    );
  }

  if (tab.groups) {
    const isTrackerSheet = tab.id === 'tracker'; // adjust ID

    return (
      <div style={{ display: 'grid', gap: 26 }}>
        {tab.groups.map((group) => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
              <h3
                style={{
                  fontSize: 12.5, fontWeight: 600, margin: 0,
                  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)',
                }}>
                {group.title}
              </h3>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isTrackerSheet ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '16px 20px',
              }}  >
              {group.fields.map((field) => (
                <div
                  key={field.key}
                  style={{
                    gridColumn: isTrackerSheet ? field.size === 'full' ? '1 / -1' : field.size === 'large' ? 'span 2' : 'span 1' : (field.type === 'textarea' || field.type === 'revision-table') ? '1 / -1' : 'auto',
                  }}
                >
                  <Field
                    field={field}
                    value={values[field.key]}
                    onChange={(value) => setValue(field.key, value)}
                    error={errFor(field)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab.groups) {
    return (
      <div style={{ display: 'grid', gap: 26 }}>
        {tab.groups.map((group) => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
              <h3 style={{ fontSize: 12.5, fontWeight: 600, margin: 0, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>{group.title}</h3>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
              {group.fields.map((field) => (
                <div key={field.key} style={{ gridColumn: field.size === 'full' ? '1 / -1' : field.size === 'large' ? 'span 2' : 'span 1' }}>
                  <Field field={field} value={values[field.key]} onChange={(value) => setValue(field.key, value)} error={errFor(field)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
      {tab.fields.map((field) => (
        <div key={field.key} style={{ gridColumn: (field.type === 'textarea' || field.type === 'revision-table') ? '1 / -1' : 'auto' }}>
          <Field field={field} value={values[field.key]} onChange={(value) => setValue(field.key, value)} error={errFor(field)} />
        </div>
      ))}
    </div>
  );
}

function AlertBanner({ banner, onClose }) {
  if (!banner) return null;
  
  const bg = banner.type === 'success' ? 'var(--green-soft)' : banner.type === 'warning' ? 'var(--amber-soft)' : 'var(--red-soft)';
  const color = banner.type === 'success' ? 'var(--green-text)' : banner.type === 'warning' ? 'var(--amber-text)' : 'var(--red-text)';
  const icon = banner.type === 'success' ? 'check' : banner.type === 'warning' ? 'info' : 'alert';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: bg,
      color: color,
      borderRadius: 'var(--r-md)',
      marginBottom: 20,
      border: `1px solid ${color}20`,
      fontSize: 13,
      lineHeight: 1.4,
      animation: 'fadeIn 0.2s ease-out',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <Icon name={icon} size={16} style={{ color: color, flex: 'none' }} />
      <div style={{ flex: 1 }}>{banner.text}</div>
      <button 
        onClick={onClose} 
        style={{
          background: 'transparent',
          border: 'none',
          color: color,
          cursor: 'pointer',
          padding: 4,
          display: 'grid',
          placeItems: 'center',
          opacity: 0.6
        }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

function FormHeader({ report, vertical, values, status, onGenerate, onSaveDraft, onLoadLastEntry, onClearAll }) {
  return (
    <div style={{ padding: '22px 32px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Icon name="fileText" size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{report.name}</h1>
            <span className="badge badge-coded"><Icon name="check" size={11} />Coded</span>
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            {docNumber(values)} - {vertical.name} / PV
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          {onLoadLastEntry && (
            <button className="btn btn-ghost btn-sm" onClick={onLoadLastEntry}>
              <Icon name="download" size={14} />Start from last entry
            </button>
          )}
          {onClearAll && (
            <button className="btn btn-ghost btn-sm" onClick={onClearAll}>
              <Icon name="trash" size={14} />Clear all fields
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => onSaveDraft && onSaveDraft(values)}><Icon name="copy" size={14} />Save draft</button>
          <button className="btn btn-primary btn-sm" disabled={!status.complete} onClick={onGenerate}>
            <Icon name="zap" size={14} />Generate report
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistRail({ values, files, step, setStep }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label-eyebrow" style={{ marginBottom: 10 }}>Completion</div>
      {STRING_SIZE_TABS.map((tab, index) => {
        const status = tabStatus(tab, values, files);
        const required = tabRequiredKeys(tab).length;

        return (
          <button key={tab.id} onClick={() => setStep(index)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 8px', border: 'none', borderRadius: 'var(--r-sm)', background: step === index ? 'var(--surface-2)' : 'transparent', cursor: 'pointer' }}>
            <StatusDot status={status} />
            <span style={{ fontSize: 12.5, fontWeight: step === index ? 600 : 400, flex: 1 }}>{tab.name}</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-4)' }}>{required || '-'}</span>
          </button>
        );
      })}
    </div>
  );
}

function FormFooter({ step, isLast, status, onBack, onNext, onGenerate }) {
  return (
    <div style={{ flex: 'none', borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <button className="btn btn-ghost" disabled={step === 0} onClick={onBack} style={{ opacity: step === 0 ? 0.4 : 1 }}>
        <Icon name="arrowL" size={15} />Back
      </button>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{status.done}/{status.total} required fields</span>
        {isLast ? (
          <button className="btn btn-primary" disabled={!status.complete} onClick={onGenerate}><Icon name="zap" size={15} />Generate report</button>
        ) : (
          <button className="btn btn-primary" onClick={onNext}>Next<Icon name="arrowR" size={15} /></button>
        )}
      </div>
    </div>
  );
}

export default function FormScreen({ report, vertical, sub, values, setValue, files, setFile, calc, layout, showCalc, onGenerate, onSaveDraft, onClearAll }) {
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [sourceEntityId, setSourceEntityId] = useState(null);
  const [banner, setBanner] = useState(null);
  const status = overallStatus(values, files);
  const scrollRef = useRef(null);

  useEffect(() => { setStep(0); setShowErrors(false); setBanner(null); }, [report.id]);

  const loadLastEntry = async () => {
    try {
      setBanner(null);
      const res = await fetchLastPvReportApi();
      if (res.success && res.data) {
        const reportData = res.data;
        const metadata = reportData.metadata || {};
        const metadata_json = metadata.metadata_json || {};
        
        const inputs = reportData.inputs || {};
        const details = inputs.details || inputs;
        
        const flatPv = {
          module_make: details.module_manufacturer || "",
          module_model: details.module_model || "",
        };
        
        const jsonColumns = [
          "electrical_characteristics",
          "mechanical_characteristics",
          "temperature_coefficients",
          "pvsyst_results",
          "irradiation_data",
          "energy_yield",
          "loss_analysis",
          "voc_calculations",
          "isc_calculations",
          "degradation_tables",
          "site_conditions",
        ];
        
        jsonColumns.forEach(col => {
          if (details[col] && typeof details[col] === "object") {
            Object.entries(details[col]).forEach(([key, val]) => {
              flatPv[key] = val;
            });
          }
        });

        const mergedValues = {
          ...metadata_json,
          ...flatPv
        };

        // Pre-fill form fields
        setValue(mergedValues);

        // Store source entity's id separately
        setSourceEntityId(metadata.id);
        
        setBanner({
          type: "success",
          text: `Loaded details from last PV entry (Source ID: ${metadata.id}).`
        });
      } else {
        setBanner({
          type: "warning",
          text: "No previous entry found."
        });
      }
    } catch (err) {
      console.error("Error loading last PV entry:", err);
      setBanner({
        type: "error",
        text: `Failed to load last entry: ${err.message}`
      });
    }
  };

  const tab = STRING_SIZE_TABS[step];
  const isLast = step === STRING_SIZE_TABS.length - 1;

  const continueNext = () => {
    setShowErrors(false);

    if (!isLast) {
      setStep(step + 1);

      if (scrollRef.current) { scrollRef.current.scrollTop = 0; }
    }
  };

  const next = async () => {
    const st = tabStatus(tab, values, files);

    if (st !== "complete") { setShowErrors(true); return; }

    // ==========================
    // ASHRAE FETCH
    // ==========================
    if (
      tab.id === "project" &&
      values.latitude &&
      values.longitude
    ) {
      try {
        const ashrae = await generateAshrae(
          Number(values.latitude),
          Number(values.longitude)
        );

        const ashraeData = ashrae?.data || ashrae;
        if (ashraeData) {
          Object.entries(ashraeData).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "N/A") {
              setValue(k, String(v));
            }
          });
          
          const tempMin = ashraeData.extreme_annual_DB_mean_min;
          const tempCellMax = ashraeData.extreme_annual_DB_mean_max;
          if (tempMin !== undefined && tempMin !== null && tempMin !== "N/A") {
            setValue("tempMin", String(tempMin));
          }
          if (tempCellMax !== undefined && tempCellMax !== null && tempCellMax !== "N/A") {
            setValue("tempCellMax", String(tempCellMax));
          }
        }
      } catch (error) {
        console.error("ASHRAE fetch failed:", error);
      }
    }

    // ==========================
    // VOC CSV PROCESSING
    // ==========================

    // Process Voc CSV if uploaded
    if (tab.id === "uploads") {

      if (files?.vocCsv?.file) {
        Papa.parse(files.vocCsv.file, {
          header: true, skipEmptyLines: true,
          complete: (results) => {

            const vocSummary = calculateYearlyVoc(results.data);
            if (!vocSummary.success) { alert(vocSummary.error); return; }
            const iscSummary = calculateYearlyIsc(results.data);
            if (!iscSummary.success) { alert(iscSummary.error); return; }

            // Parse GHI and DHI CSV files for peak table data
            let ghiRows = [];
            let dhiRows = [];
            let ghiParsed = false;
            let dhiParsed = false;

            const onAllParsed = () => {
              if (ghiParsed && dhiParsed) {
                const peakTableData = prepareTableData(ghiRows, dhiRows);
                if (!peakTableData.success) { console.warn("prepareTableData warning:", peakTableData.errorMessage); }

                console.log("VOC Summary:");
                console.log(vocSummary.data);
                console.log("ISC Summary:");
                console.log(iscSummary.data);
                console.log("Peak Table Data:");
                console.log(peakTableData.tableTemplateData);

                setValue("yearlyVocSummary", vocSummary.data);
                setValue("allTimeMaxVoc", vocSummary.allTimeMax);
                setValue("yearlyIscSummary", iscSummary.data);
                setValue("max_3hr_isc", iscSummary.max_3hr_isc);
                setValue("max_isc_year", iscSummary.max_isc_year);
                setValue("peakTableData", peakTableData.tableTemplateData);

                console.log("Form values for degradation:", {
                  moduleVmp: values.moduleVmp,
                  numberOfModules: values.numberOfModules,
                  moduleDegradation: values.moduleDegradation,
                });

                // Generate degradation table from form input
                const initialVoltage = Number(values.moduleVmp) * Number(values.numberOfModules);
                const degradationTable = buildMinVoltageDegradationTable(initialVoltage, Number(values.moduleDegradation), 30);

                setValue("minVoltageDegradationTable", degradationTable);
                console.log("Saved minVoltageDegradationTable:", degradationTable);
                continueNext();
              }
            };

            // Parse GHI CSV if available
            if (files?.ghiCsv?.file) {
              Papa.parse(files.ghiCsv.file, {
                header: true, skipEmptyLines: true,
                complete: (ghiResults) => {
                  ghiRows = ghiResults.data;
                  ghiParsed = true;
                  onAllParsed();
                },
                error: (err) => {
                  console.warn("GHI CSV parsing warning:", err?.message);
                  ghiParsed = true;
                  onAllParsed();
                }
              });
            } else {
              ghiParsed = true;
            }

            // Parse DHI CSV if available
            if (files?.dhiCsv?.file) {
              Papa.parse(files.dhiCsv.file, {
                header: true, skipEmptyLines: true,
                complete: (dhiResults) => {
                  dhiRows = dhiResults.data;
                  dhiParsed = true;
                  onAllParsed();
                },
                error: (err) => {
                  console.warn("DHI CSV parsing warning:", err?.message);
                  dhiParsed = true;
                  onAllParsed();
                }
              });
            } else {
              dhiParsed = true;
            }
          },

          error: (err) => {
            alert(
              err?.message ||
              "Failed to parse CSV file."
            );
          },
        });

        return;
      }


    }


    continueNext();
  };

  useEffect(() => {
    console.log("FormScreen mounted");
  }, []);

  // ---------- SCROLL layout ----------
  if (layout === 'scroll') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <FormHeader report={report} vertical={vertical} values={values} status={status} onGenerate={onGenerate} onSaveDraft={onSaveDraft} onLoadLastEntry={loadLastEntry} onClearAll={onClearAll} />
        <div style={{ flex: 1, overflowY: 'auto' }} ref={scrollRef}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '26px 32px 80px', display: 'grid', gridTemplateColumns: showCalc ? '186px 1fr 250px' : '186px 1fr', gap: 28, alignItems: 'start' }}>
            {/* section nav */}
            <div style={{ position: 'sticky', top: 0, paddingTop: 4 }}>
              <div className="label-eyebrow" style={{ marginBottom: 10 }}>Sections</div>
              {STRING_SIZE_TABS.map((t, i) => {
                const st = tabStatus(t, values, files);
                return (
                  <a key={t.id} href={'#sec_' + t.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', textDecoration: 'none', color: 'var(--text-2)' }}>
                    <StatusDot status={st} />
                    <span style={{ fontSize: 12.5 }}>{t.name}</span>
                  </a>
                );
              })}
              <ProgressMini status={status} />
            </div>
            {/* all sections */}
            <div style={{ display: 'grid', gap: 30, minWidth: 0 }}>
              <AlertBanner banner={banner} onClose={() => setBanner(null)} />
              {STRING_SIZE_TABS.map(t => (
                <section key={t.id} id={'sec_' + t.id} className="card" style={{ padding: 22 }}>
                  <SectionTitle tab={t} />
                  <TabBody tab={t} values={values} setValue={setValue} files={files} setFile={setFile} showErrors={showErrors} />
                </section>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-lg" disabled={!status.complete} onClick={onGenerate}>
                  <Icon name="zap" size={16} />Generate report
                </button>
              </div>
            </div>
            {/* calc rail */}
            {showCalc && (
              <div style={{ position: 'sticky', top: 4, display: 'grid', gap: 12 }}>
                <CalcPanel calc={calc} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- SPLIT layout ----------
  if (layout === 'split') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <FormHeader report={report} vertical={vertical} values={values} status={status} onGenerate={onGenerate} onSaveDraft={onSaveDraft} onLoadLastEntry={loadLastEntry} onClearAll={onClearAll} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: 0 }}>
          {/* form */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid var(--border)' }}>
            <Stepper step={step} setStep={setStep} values={values} files={files} tabs={STRING_SIZE_TABS} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 24px' }} ref={scrollRef}>
              <AlertBanner banner={banner} onClose={() => setBanner(null)} />
              <SectionTitle tab={tab} />
              <TabBody tab={tab} values={values} setValue={setValue} files={files} setFile={setFile} showErrors={showErrors} />
            </div>
            <FormFooter step={step} isLast={isLast} status={status} onBack={() => setStep(step - 1)} onNext={next} onGenerate={onGenerate} />
          </div>
          {/* live preview */}
          <div style={{ background: 'var(--surface-2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, background: 'var(--surface-2)', zIndex: 1 }}>
              <Icon name="fileText" size={14} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Live preview</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-4)' }}>{docNumber(values)}</span>
            </div>
            <div style={{ padding: '20px 0', display: 'grid', placeItems: 'start center' }}>
              <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
                <ReportDoc values={values} calc={calc} files={files} mini solarCalcValues={values?.solarCalcValues} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- TABBED layout (default) ----------
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <FormHeader report={report} vertical={vertical} values={values} status={status} onGenerate={onGenerate} onSaveDraft={onSaveDraft} onLoadLastEntry={loadLastEntry} onClearAll={onClearAll} />
      <Stepper step={step} setStep={setStep} values={values} files={files} tabs={STRING_SIZE_TABS} />
      <div style={{ flex: 1, overflowY: 'auto' }} ref={scrollRef}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 32px 40px', display: 'grid', gridTemplateColumns: '1fr 256px', gap: 28, alignItems: 'start' }}>
          <div className="card fade-in" key={tab.id} style={{ padding: 24, minWidth: 0 }}>
            <AlertBanner banner={banner} onClose={() => setBanner(null)} />
            <SectionTitle tab={tab} />
            <TabBody tab={tab} values={values} setValue={setValue} files={files} setFile={setFile} showErrors={showErrors} />
          </div>
          <div style={{ display: 'grid', gap: 14, position: 'sticky', top: 0 }}>
            {showCalc && <CalcPanel calc={calc} />}
            <ChecklistRail values={values} files={files} step={step} setStep={setStep} />
          </div>
        </div>
      </div>
      <FormFooter step={step} isLast={isLast} status={status} onBack={() => setStep(step - 1)} onNext={next} onGenerate={onGenerate} />
    </div>
  );
}
