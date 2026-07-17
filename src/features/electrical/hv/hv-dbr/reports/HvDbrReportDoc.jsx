import React from 'react';
import template from "../templates/hvDbrReportTemplate.html?raw";

import coverPage from "../../../../../shared/reports/coverPage.html?raw";
import documentControlPage from "../../../../../shared/reports/documentControlPage.html?raw";
import listOfTables from "../../../../../shared/reports/listOfTables.html?raw";
import listOfAbbreviations from "../../../../../shared/reports/listOfAbbreviations.html?raw";
import tableOfContents from "../../../../../shared/reports/tableOfContents.html?raw";
import { scanAndNumberReportContent, renderSimpleList, renderSectionIfNotEmpty, renderAbbreviationsTable } from "../../../../../shared/reports/utils/tocScanner";
import { fillTemplate } from "../../../../report-engine/templateEngine";
import { buildReportMeta } from "../../../../../shared/reports/buildReportMeta";

const TODAY = new Date().toLocaleDateString("en-GB");

export default function HvDbrReportDoc({ values = {}, files = {}, showStamp = false, isEditMode = false, customHtml = null, onHtmlChange = null }) {
  const htmlToRender = customHtml || values.custom_html;

  if (htmlToRender) {
    return (
      <div 
        id="hv-dbr-report" 
        contentEditable={isEditMode}
        suppressContentEditableWarning={true}
        onBlur={onHtmlChange ? (e) => onHtmlChange(e.currentTarget.innerHTML) : undefined}
        dangerouslySetInnerHTML={{ __html: htmlToRender }} 
      />
    );
  }

  // Cache for object URLs to prevent memory leaks from creating them on every render
  const objectUrlsRef = React.useRef({});

  // Clean up object URLs on unmount
  React.useEffect(() => {
    const currentUrls = objectUrlsRef.current;
    return () => {
      Object.values(currentUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const getFileUrl = (fileObj) => {
    if (!fileObj || !fileObj.file) return null;
    const cacheKey = fileObj.name + '_' + fileObj.size + '_' + fileObj.lastModified;
    if (objectUrlsRef.current[cacheKey]) {
      return objectUrlsRef.current[cacheKey];
    }
    const url = URL.createObjectURL(fileObj.file);
    objectUrlsRef.current[cacheKey] = url;
    return url;
  };

  const coverPhotoUrl = getFileUrl(files?.coverPhoto);

  const reportMeta = buildReportMeta(values, {
    name: "HV Design Basis Report",
    vertical: "hv",
    id: "hv-dbr"
  });

  const sealContent = values.SEAL_IMAGE
    ? `<img src="${values.SEAL_IMAGE}" alt="Professional Engineer Seal" class="seal-img" />`
    : `
        <div class="seal-placeholder">
          <strong>STATE OF TEXAS</strong><br>
          JOSHUA D. MILLS<br>
          No. 129710<br>
          LICENSED PROFESSIONAL ENGINEER<br>
          ${reportMeta.ISSUE_DATE || TODAY}
        </div>
      `;

  const initialValues = {
    ...values,
    ...reportMeta,
    REPORT_NAME: values.reportTitle || "HV Design Basis Report",
    sldDrawing: files?.sldDrawing?.name || "—",
    relayListTripMatrix: files?.relayListTripMatrix?.name || "—",
    transformerDatasheet: files?.transformerDatasheet?.name || "—",
    breakerDatasheets: files?.breakerDatasheets?.name || "—",
    coverPhoto: coverPhotoUrl
      ? `<img src="${coverPhotoUrl}" alt="Substation Cover Photo" />`
      : `<div style="border: 1px dashed #cbd5e1; padding: 20px; color: #64748b; font-style: italic; background: #f8fafc; border-radius: 4px; text-align: center;">No Substation Cover Photo uploaded</div>`,
  };
  const bodyHtml = fillTemplate(template, initialValues);

  const { numberedBodyHtml, headings, tables, figures, abbreviations } = scanAndNumberReportContent(bodyHtml);

  const finalValues = {
    ...initialValues,
    COVER_IMAGE: coverPhotoUrl || reportMeta.COVER_IMAGE,
    TOC_PLACEHOLDER: renderSimpleList(headings),
    LIST_OF_TABLES_PLACEHOLDER: renderSectionIfNotEmpty("List of Tables", tables, { key: "title" }),
    LIST_OF_FIGURES_PLACEHOLDER: renderSectionIfNotEmpty("List of Figures", figures, { key: "title" }),
    LIST_OF_ABBREVIATIONS_PLACEHOLDER: renderAbbreviationsTable(abbreviations),
    SHOW_STAMP: showStamp ? "flex" : "none",
    SEAL_CONTENT: sealContent,
  };

  const lotHtml = tables.length > 0 || figures.length > 0 ? listOfTables : "";
  const loaHtml = abbreviations.length > 0 ? listOfAbbreviations : "";

  const completeTemplate = `${coverPage} ${documentControlPage} ${tableOfContents} ${lotHtml} ${loaHtml} ${numberedBodyHtml}`;
  const reportHtml = fillTemplate(completeTemplate, finalValues);

  return (
    <div 
      id="hv-dbr-report" 
      contentEditable={isEditMode}
      suppressContentEditableWarning={true}
      onBlur={onHtmlChange ? (e) => onHtmlChange(e.currentTarget.innerHTML) : undefined}
      dangerouslySetInnerHTML={{ __html: reportHtml }} 
    />
  );
}
