import React from 'react';
import ReportGenerating from "../../../../../shared/components/ReportGenerating";
import { bessAmpacityDocNumber } from "../forms/utils/bessAmpacityDocNumber.js";

export default function BessAmpacityGenerating({ values, onDone }) {
  const steps = [
    'Validating inputs', 
    'Resolving template & formulae', 
    'Calculating cable currents', 
    'Applying temperature deratings', 
    'Composing document', 
    'Finalizing PDF'
  ];

  return (
    <ReportGenerating
      fname={bessAmpacityDocNumber(values) + '.docx'}
      steps={steps}
      onDone={onDone}
      speed={480}
    />
  );
}
