import React from "react";
import ReportPreviewShell from "../../../../../shared/components/ReportPreviewShell";
import { bessGroundingDocNumber } from "../forms/utils/bessGroundingDocNumber.js";
import BessGroundingReportDoc from "./BessGroundingReportDoc.jsx";

export default function BessGroundingPreview({ values, files, onBack, onNew, onCloneToRevision, onSave }) {
    const fname = bessGroundingDocNumber(values) + '.docx';
    
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
            reportElementId="bess-grounding-report"
            values={values}
            files={files}
            onBack={onBack}
            onNew={onNew}
            onCloneToRevision={onCloneToRevision}
            onSave={onSave}
            fname={fname}
            documentDetails={documentDetails}
            showStampOption={false}
        >
            {({ isEditMode, tempHtml, setTempHtml }) => (
                <BessGroundingReportDoc 
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
