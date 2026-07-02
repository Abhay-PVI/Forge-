import React from 'react';

// export default function ReportDoc() {
//   return <div>Report Document</div>;
// }

import template from "../templates/bessReportTemplate.html?raw";

import coverPage from "../../../../../shared/reports/coverPage.html?raw";
import documentControlPage from "../../../../../shared/reports/documentControlPage.html?raw";
import listOfTables from "../../../../../shared/reports/listOfTables.html?raw";
import listOfAbbreviations from "../../../../../shared/reports/copy/listOfAbbreviations.html?raw";
import tableOfContents from "../../../../../shared/reports/tableOfContents.html?raw";
import { scanAndNumberReportContent, renderSimpleList, renderSectionIfNotEmpty, renderAbbreviationsTable } from "../../../../../shared/reports/utils/tocScanner";
// <-- NEW: bring in the navigation helper
import { getReportNodeById } from "../../../../../data/navigation";

import { fillTemplate } from "../../../../report-engine/templateEngine";

import ashraeTableTemplate from "../../../../../backend/Ashrae/ASHARE.html?raw";
// import reportTemplate from "../templates/bessReportTemplate.html?raw";
console.log(ashraeTableTemplate);

import Logo from "../../../../../shared/components/Logo";

const TODAY = new Date().toLocaleDateString("en-GB");

function V(value, fallback = "—") {
  return value === undefined || value === null || value === ""
    ? fallback
    : value;
}

function docNumber(values) {
  return `${values?.projectCode || "SH2"}-STR-${values?.revision || "R0"}`;
}

function DocPage({ children }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 900,
        background: "#fff",
        padding: 40,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      {children}
    </div>
  );
}

function DocH({ n, t }) {
  return (
    <h3 style={{ marginTop: 20 }}>
      {n}. {t}
    </h3>
  );
}

CoverStat.displayName = 'CoverStat';
function CoverStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function DocRow({ k, v }) {
  return (
    <tr>
      <td>{k}</td>
      <td>{v}</td>
    </tr>
  );
}

export default function BessReportDoc({ values = {}, files = {} }) {
  const safeValues = values;
  const safeFiles = files;


  // 1. Fill the BESS report body template to resolve its placeholders first
  const initialValues = {
    ...values,
    ASHRAE_TABLE: ashraeTableTemplate,
    REPORT_NAME: "BESS Design Basis Report",
  };
  const bodyHtml = fillTemplate(template, initialValues);

  // 2. Scan and number the resolved body HTML
  const { numberedBodyHtml, headings, tables, figures, abbreviations } = scanAndNumberReportContent(bodyHtml);

  // 3. Assemble final values with list placeholders
  const finalValues = {
    ...initialValues,
    TOC_PLACEHOLDER: renderSimpleList(headings),
    LIST_OF_TABLES_PLACEHOLDER: renderSectionIfNotEmpty("List of Tables", tables, { key: "title" }),
    LIST_OF_FIGURES_PLACEHOLDER: renderSectionIfNotEmpty("List of Figures", figures, { key: "title" }),
    LIST_OF_ABBREVIATIONS_PLACEHOLDER: renderAbbreviationsTable(abbreviations),
  };

  const appendixPages = values.appendixPages || [];
  let appendixTemplate = "";

  if (appendixPages.length > 0) {
    appendixTemplate = `
      <div class="report-page appendix-page" style="page-break-before: always; page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-sizing: border-box;">
        <h1 style="font-size: 36pt; color: #163c7a; font-weight: 700; margin-top: 250px;">Appendix</h1>
        <p style="font-size: 14pt; color: #64748b; margin-top: 15px;">Solar String Sizing Calculations & Specs</p>
      </div>
      
      ${appendixPages.map((imgData, index) => `
        <div class="page" style="page-break-before: always; padding: 0 !important; display: flex; justify-content: center; align-items: center;">
          <img src="${imgData}" style="width: 100%; height: 100%; object-fit: contain; display: block;" alt="Appendix Page ${index + 1}" />
        </div>
      `).join('')}
    `;
  }

  // 4. Concatenate and fill final template
  const completeTemplate = `${coverPage} ${documentControlPage} ${tableOfContents} ${listOfTables} ${listOfAbbreviations} ${numberedBodyHtml} ${appendixTemplate}`;
  const reportHtml = fillTemplate(completeTemplate, finalValues);




  React.useEffect(() => {
    // Temporary debug logging to trace async prop initialization.
    console.debug("[BessReportDoc] values prop:", values);
    console.debug("[BessReportDoc] files prop:", files);
    console.debug("[BessReportDoc] safeFiles.batteryDs:", safeFiles.batteryDs);
  }, [values, files, safeFiles.batteryDs]);

  return (

    <div id="bess-report" dangerouslySetInnerHTML={{ __html: reportHtml }} />

  );
}
