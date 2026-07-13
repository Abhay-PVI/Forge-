import React from 'react';
import ReportGenerating from "../../../../../shared/components/ReportGenerating";
import { docNumber } from "../forms/utils/docNumber.js";

export default function Generating({ values, onDone }) {
  const steps = [
    'Validating inputs', 
    'Resolving template & formulae', 
    'Computing string voltages', 
    'Composing document', 
    'Finalizing PDF'
  ];

  return (
    <ReportGenerating
      fname={docNumber(values) + '.docx'}
      steps={steps}
      onDone={onDone}
      speed={520}
    />
  );
}
