import React from "react";
import ReportPreviewShell from "../../../../../shared/components/ReportPreviewShell";
import { bessAmpacityDocNumber } from "../forms/utils/bessAmpacityDocNumber.js";
import BessAmpacityReportDoc from "./BessAmpacityReportDoc.jsx";

export default function BessAmpacityPreview({ values, files, onBack, onNew, onSave }) {
    const fname = bessAmpacityDocNumber(values) + '.docx';
    
    const TODAY = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const V = (val) => (val === null || val === undefined || val === "") ? "—" : val;

    const documentDetails = [
        ['Project', V(values.projectName)],
        ['Client', V(values.clientName)],
        ['Revision', V(values.revision)],
        ['Pages', '2'],
        ['Generated', TODAY]
    ];

    return (
        <ReportPreviewShell
            reportElementId="bess-ampacity-report"
            values={values}
            files={files}
            onBack={onBack}
            onNew={onNew}
            onSave={onSave}
            fname={fname}
            documentDetails={documentDetails}
            showStampOption={false}
        >
            {({ isEditMode, tempHtml, setTempHtml }) => (
                <BessAmpacityReportDoc 
                    values={values} 
                    files={files} 
                    isEditMode={isEditMode}
                    customHtml={tempHtml}
                    onHtmlChange={setTempHtml}
                />
            )}
        </ReportPreviewShell>
    );
}
