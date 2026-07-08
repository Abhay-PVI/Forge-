import React, { useEffect, useRef, useState } from 'react';
import Icon from "../../../../../shared/components/Icon";
import Field from "../../../../../shared/components/Field";
import { CABLE_AMPACITY_TABS } from "../forms/bessAmpacityTabs";
import BessAmpacityStepper from "./BessAmpacityStepper";
import UploadZone from "../../../pv/pv-design/components/UploadZone.jsx";
import BessAmpacityReportDoc from "../reports/BessAmpacityReportDoc";
import { fetchLastReportApi } from "../../../pv/pv-design/api/reportsApi";

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

function overallStatus(values, files) {
  const total = CABLE_AMPACITY_TABS.reduce((sum, tab) => sum + tabRequiredKeys(tab).length, 0);
  let done = 0;

  CABLE_AMPACITY_TABS.forEach((tab) => {
    tabRequiredKeys(tab).forEach((key) => {
      const isUpload = tab.uploads && tab.uploads.some((upload) => upload.key === key);
      const hasValue = isUpload ? !!files[key] : values[key] != null && String(values[key]).trim() !== '';
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
  return `${values?.documentNo || "PVI-BESS-AMP-001"}-${values?.revision || "A"}`;
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
  const errFor = (field, isUpload = false) => {
    if (!showErrors || !field.required) return null;
    const hasValue = isUpload ? !!files[field.key] : values[field.key] != null && String(values[field.key]).trim() !== '';
    return hasValue ? null : 'Required';
  };

  let fieldsContent = null;
  if (tab.groups) {
    fieldsContent = (
      <div style={{ display: 'grid', gap: 26 }}>
        {tab.groups.map((group) => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
              <h3 style={{ fontSize: 12.5, fontWeight: 600, margin: 0, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>{group.title}</h3>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
              {group.fields.map((field) => (
                <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                  <Field field={field} value={values[field.key]} onChange={(value) => setValue(field.key, value)} error={errFor(field)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else if (tab.fields) {
    fieldsContent = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
        {tab.fields.map((field) => (
          <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
            <Field field={field} value={values[field.key]} onChange={(value) => setValue(field.key, value)} error={errFor(field)} />
          </div>
        ))}
      </div>
    );
  }

  let uploadsContent = null;
  if (tab.uploads) {
    uploadsContent = (
      <div style={{ display: 'grid', gap: 12 }}>
        {tab.uploads.map((upload) => (
          <div key={upload.key}>
            <UploadZone
              spec={upload}
              file={files[upload.key]}
              onSet={(value) => setFile(upload.key, value)}
              onClear={() => setFile(upload.key, null)}
            />
            {errFor(upload, true) && (
              <div className="field-hint" style={{ color: 'var(--red-text)', marginLeft: 4 }}>
                This file is required.
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (fieldsContent && uploadsContent) {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        {fieldsContent}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <h3 style={{ fontSize: 12.5, fontWeight: 600, margin: 0, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>Layout Media</h3>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        {uploadsContent}
      </div>
    );
  }

  return fieldsContent || uploadsContent || null;
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
            {docNumber(values)} - {vertical.name} / BESS
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

function Banner({ banner, onClose }) {
  return (
    <div style={{ padding: '10px 32px', background: banner.type === 'success' ? 'var(--green-soft)' : banner.type === 'warning' ? 'var(--yellow-soft)' : 'var(--red-soft)', color: banner.type === 'success' ? 'var(--green-text)' : banner.type === 'warning' ? 'var(--yellow-text)' : 'var(--red-text)', fontSize: 13, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name={banner.type === 'success' ? 'check' : 'info'} size={15} />
      <span>{banner.text}</span>
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}><Icon name="x" size={14} /></button>
    </div>
  );
}

function ChecklistRail({ values, files, step, setStep }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label-eyebrow" style={{ marginBottom: 10 }}>Completion</div>
      {CABLE_AMPACITY_TABS.map((tab, index) => {
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

export default function BessAmpacityFormScreen({ report, vertical, sub, values, setValue, files, setFile, calc, layout, showCalc, onGenerate, onSaveDraft, onClearAll }) {
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [banner, setBanner] = useState(null);
  const status = overallStatus(values, files);
  const scrollRef = useRef(null);

  useEffect(() => { setStep(0); setShowErrors(false); setBanner(null); }, [report.id]);

  const loadLastEntry = async () => {
    try {
      setBanner(null);
      const res = await fetchLastReportApi("cable");
      if (res.success && res.data) {
        const reportData = res.data;
        const metadata = reportData.metadata || {};
        const metadata_json = metadata.metadata_json || {};
        const inputs = reportData.inputs || {};
        
        setValue({
          ...metadata_json,
          ...inputs
        });
        
        setBanner({
          type: "success",
          text: `Loaded details from last ampacity entry (Source ID: ${metadata.id}).`
        });
      } else {
        setBanner({
          type: "warning",
          text: "No previous entry found."
        });
      }
    } catch (err) {
      console.error("Error loading last BESS ampacity entry:", err);
      setBanner({
        type: "error",
        text: `Failed to load last entry: ${err.message}`
      });
    }
  };

  const tab = CABLE_AMPACITY_TABS[step];
  const isLast = step === CABLE_AMPACITY_TABS.length - 1;

  const next = () => {
    const st = tabStatus(tab, values, files);
    if (st !== 'complete') { setShowErrors(true); return; }
    setShowErrors(false);
    if (!isLast) { setStep(step + 1); if (scrollRef.current) scrollRef.current.scrollTop = 0; }
  };

  // Default layout rendering (tabbed)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <FormHeader report={report} vertical={vertical} values={values} status={status} onGenerate={onGenerate} onSaveDraft={onSaveDraft} onLoadLastEntry={loadLastEntry} onClearAll={onClearAll} />
      {banner && <Banner banner={banner} onClose={() => setBanner(null)} />}
      <BessAmpacityStepper step={step} setStep={setStep} values={values} files={files} />
      <div style={{ flex: 1, overflowY: 'auto' }} ref={scrollRef}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 32px 40px', display: 'grid', gridTemplateColumns: '1fr 256px', gap: 28, alignItems: 'start' }}>
          <div className="card fade-in" key={tab.id} style={{ padding: 24, minWidth: 0 }}>
            <SectionTitle tab={tab} />
            <TabBody tab={tab} values={values} setValue={setValue} files={files} setFile={setFile} showErrors={showErrors} />
          </div>
          <div style={{ display: 'grid', gap: 14, position: 'sticky', top: 0 }}>
            <ChecklistRail values={values} files={files} step={step} setStep={setStep} />
          </div>
        </div>
      </div>
      <FormFooter step={step} isLast={isLast} status={status} onBack={() => setStep(step - 1)} onNext={next} onGenerate={onGenerate} />
    </div>
  );
}
