import coverImage from "../../assets/report-cover.jpg";
import bessCoverImage from "../../assets/bess-cover.jpg";
import hvCoverImage from "../../assets/HV - Cover.jpg";
import pvLogo from "../../assets/PV insight Logo.png";
import defaultClientLogo from "../../assets/signal Energy.png";

function formatIssueDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB").format(date).replaceAll("/", ".");
}

function renderRevisionHistoryRows(values, reportName, issueDate, revision) {
  const rows = [];
  const tdStyle = `padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #475569; line-height: 1.3; text-align: center; font-size: 8.5pt; word-break: break-word; overflow-wrap: break-word;`;

  // 1. Check if values has a structured list of revisions (array of objects)
  if (Array.isArray(values.revisions) && values.revisions.length > 0) {
    values.revisions.forEach((rev) => {
      rows.push(`
        <tr class="tr">
          <td class="td" style="${tdStyle}">${rev.revision ?? ""}</td>
          <td class="td" style="${tdStyle}">${rev.issueDate ?? ""}</td>
          <td class="td" style="${tdStyle}">${rev.documentName ?? reportName}</td>
          <td class="td" style="${tdStyle}">${rev.description ?? ""}</td>
        </tr>
      `);
    });
  }
  // 2. Check if we have the legacy/rigid HV-DBR fields
  else if (
    values.rev0Number || values.rev0Date || values.rev0Description ||
    values.rev1Number || values.rev1Date || values.rev1Description ||
    values.rev2Number || values.rev2Date || values.rev2Description
  ) {
    const legacyRevs = [
      { num: values.rev0Number, date: values.rev0Date, desc: values.rev0Description },
      { num: values.rev1Number, date: values.rev1Date, desc: values.rev1Description },
      { num: values.rev2Number, date: values.rev2Date, desc: values.rev2Description }
    ];
    legacyRevs.forEach((rev, idx) => {
      if (rev.num || rev.date || rev.desc) {
        rows.push(`
          <tr class="tr">
            <td class="td" style="${tdStyle}">${rev.num ?? idx}</td>
            <td class="td" style="${tdStyle}">${rev.date ?? issueDate}</td>
            <td class="td" style="${tdStyle}">${reportName}</td>
            <td class="td" style="${tdStyle}">${rev.desc ?? ""}</td>
          </tr>
        `);
      }
    });
  }

  // 3. Fallback: current revision details as a single row
  if (rows.length === 0) {
    rows.push(`
      <tr class="tr">
        <td class="td" style="${tdStyle}">${revision ?? "0"}</td>
        <td class="td" style="${tdStyle}">${issueDate}</td>
        <td class="td" style="${tdStyle}">${reportName}</td>
        <td class="td" style="${tdStyle}">Initial Release</td>
      </tr>
    `);
  }

  return rows.join("");
}

export function buildReportMeta(values = {}, report = {}) {
  const reportTitle =
    values.reportTitle ||
    values.reportName ||
    report?.name ||
    "";

  const revision = values.revision || "R0";
  const issueDate = values.issueDate || formatIssueDate();

  return {
    PROJECT_NAME:
      values.projectName || values.plant_name || "",

    REPORT_TITLE: reportTitle,

    CLIENT_NAME:
      values.clientName || values.submittedToCompany || "",

    PREPARED_BY:
      values.preparedBy ||
      "PVinsight Inc",

    REVISION: revision,

    ISSUE_DATE: issueDate,

    DOCUMENT_NUMBER:
      values.documentNumber || values.documentNo || "",

    COVER_IMAGE:
      values.coverImage ||
      ((values.bessManufacturer || values.noOfPCS || report?.id?.includes('battery') || report?.vertical === 'battery')
        ? bessCoverImage
        : (report?.id?.includes('hv') || report?.vertical === 'hv')
          ? hvCoverImage
          : coverImage),

    PV_LOGO:
      values.pvLogo || pvLogo,

    CLIENT_LOGO:
      values.clientLogo || defaultClientLogo,

    submittedTo:
      values.submittedToCompany ||
      values.clientContact ||
      values.clientName ||
      "Signal Energy",

    submittedToAddress:
      (values.submittedToAddress ||
      values.clientAddress ||
      "2034 Hamilton Place BLVD. Suite 100 Chattanooga, TN 37421").replace(/\r?\n/g, '<br>'),

    REVISION_HISTORY_ROWS:
      renderRevisionHistoryRows(values, reportTitle, issueDate, revision),
  };
}