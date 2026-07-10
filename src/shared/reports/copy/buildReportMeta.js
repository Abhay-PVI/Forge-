import coverImage from "../../../assets/report-cover.jpg";
import bessCoverImage from "../../../assets/bess-cover.jpg";
import hvCoverImage from "../../../assets/HV - Cover.jpg";
import pvLogo from "../../../assets/PV insight Logo.png";
import defaultClientLogo from "../../../assets/signal Energy.png";

function formatIssueDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB").format(date).replaceAll("/", ".");
}

export function buildReportMeta(values = {}, report = {}) {
  return {
    PROJECT_NAME:
      values.projectName || values.plant_name || "",

    REPORT_TITLE:
      values.reportTitle ||
      values.reportName ||
      report?.name ||
      "",

    CLIENT_NAME:
      values.clientName || "",

    PREPARED_BY:
      values.preparedBy ||
      "PVinsight Inc",

    REVISION:
      values.revision || "R0",

    ISSUE_DATE:
      values.issueDate ||
      formatIssueDate(),

    DOCUMENT_NUMBER:
      values.documentNumber || "",

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
      values.submittedToAddress ||
      values.clientAddress ||
      "2034 Hamilton Place BLVD. Suite 100 Chattanooga, TN 37421",
  };
}