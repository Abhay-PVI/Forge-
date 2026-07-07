import { API_BASE_URL } from "./apiConfig";
import { USER } from "../../../../../data/constants";

const AUTH_SESSION_STORAGE_KEY = "forge_auth_session";

function getStoredAccessToken() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.session?.access_token || null;
  } catch {
    return null;
  }
}

function buildAuthHeaders(contentType = false, accessToken = null) {
  const headers = {
    "X-User-Id": USER.id,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = accessToken || getStoredAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function saveReportApi({ report_id, report_type, document_no, revision, prepared_date, report_title, status, values }, accessToken = null) {
  const response = await fetch(`${API_BASE_URL}/api/reports/save`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(true, accessToken),
    },
    body: JSON.stringify({
      report_id,
      report_type,
      document_no,
      revision,
      prepared_date,
      report_title,
      status,
      values
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to save report: ${response.status}`);
  }
  return await response.json();
}

export async function fetchReportsApi(accessToken = null) {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    headers: buildAuthHeaders(false, accessToken),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch reports list: ${response.status}`);
  }
  return await response.json();
}

export async function fetchReportDetailApi(reportId, accessToken = null) {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
    headers: buildAuthHeaders(false, accessToken),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch report details: ${response.status}`);
  }
  return await response.json();
}

export async function fetchLastPvReportApi(accessToken = null) {
  const response = await fetch(`${API_BASE_URL}/api/reports/last-pv`, {
    headers: buildAuthHeaders(false, accessToken),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch last PV report: ${response.status}`);
  }
  return await response.json();
}

export async function fetchLastReportApi(reportType, accessToken = null) {
  const response = await fetch(`${API_BASE_URL}/api/reports/last/${reportType}`, {
    headers: buildAuthHeaders(false, accessToken),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch last report of type ${reportType}: ${response.status}`);
  }
  return await response.json();
}
