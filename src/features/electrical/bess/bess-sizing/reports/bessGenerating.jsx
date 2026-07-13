import React from 'react';
import ReportGenerating from "../../../../../shared/components/ReportGenerating";
import { bessDocNumber } from "../forms/utils/bessDocNumber.js";

export default function BessGenerating({ values, onDone }) {
  const steps = [
    'Validating inputs', 
    'Resolving template & formulae', 
    'Computing string voltages', 
    'Composing document', 
    'Finalizing PDF'
  ];

  return (
    <ReportGenerating
      fname={bessDocNumber(values) + '.docx'}
      steps={steps}
      onDone={onDone}
      speed={520}
    />
  );
}
