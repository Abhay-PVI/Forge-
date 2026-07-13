import React from 'react';
import ReportGenerating from "../../../../../shared/components/ReportGenerating";

export default function HvDbrGenerating({ values, onDone }) {
  const steps = [
    'Validating substation inputs',
    'Resolving transformer and equipment ratings',
    'Applying IEEE Std 80 grounding guidelines',
    'Composing document sections',
    'Finalizing PDF document'
  ];

  const docNo = values.documentNo || "PVI-HV-DBR-001";

  return (
    <ReportGenerating
      fname={docNo + '.docx'}
      steps={steps}
      onDone={onDone}
      speed={480}
    />
  );
}
