import React from 'react';
import ReportGenerating from "../../../../../shared/components/ReportGenerating";
import { bessGroundingDocNumber } from "../forms/utils/bessGroundingDocNumber.js";

export default function BessGroundingGenerating({ values, onDone }) {
  const steps = [
    'Validating inputs', 
    'Resolving template & constants', 
    'Modeling grid potentials', 
    'Calculating step and touch voltages', 
    'Composing document', 
    'Finalizing PDF'
  ];

  return (
    <ReportGenerating
      fname={bessGroundingDocNumber(values) + '.docx'}
      steps={steps}
      onDone={onDone}
      speed={480}
    />
  );
}
