import { useEffect, useState } from 'react';
import Icon from "../../../shared/components/Icon";
import ReportRow from "./ReportRow";
import { fetchReportsApi, fetchReportDetailApi, deleteReportApi } from "../../electrical/pv/pv-design/api/reportsApi";

const DRAFT_STATUSES = ['draft', 'generating'];

export default function Welcome({ user, onSelectRecent, onCloneReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cloningId, setCloningId] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await fetchReportsApi();
        setReports(res.success && res.reports ? res.reports : []);
      } catch (err) {
        console.error("Error loading reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const submitted = reports.filter(r => r.status === 'completed');
  const drafts = reports.filter(r => DRAFT_STATUSES.includes(r.status));

  const handleResume = async (report, targetPhase) => {
    if (!report.id || !onSelectRecent) return;
    try {
      const detailRes = await fetchReportDetailApi(report.id);
      if (detailRes.success && detailRes.data) {
        onSelectRecent({
          report_id: report.id,
          report_type: report.report_type,
          status: report.status,
          targetPhase: targetPhase
        }, detailRes.data);
      }
    } catch (err) {
      console.error("Error loading report detail:", err);
    }
  };

  const handleClone = async (report) => {
    if (!report.id || !onCloneReport) return;
    setCloningId(report.id);
    try {
      const detailRes = await fetchReportDetailApi(report.id);
      if (detailRes.success && detailRes.data) {
        onCloneReport({ report_id: report.id, report_type: report.report_type }, detailRes.data);
      }
    } catch (err) {
      console.error("Error cloning report:", err);
    } finally {
      setCloningId(null);
    }
  };

  const handleDelete = async (report) => {
    if (!report.id) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${report.report_title || 'Unnamed Report'}"?`);
    if (!confirmDelete) return;

    try {
      const res = await deleteReportApi(report.id);
      if (res.success) {
        setReports(prev => prev.filter(r => r.id !== report.id));
      } else {
        alert("Failed to delete report: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Error deleting report: " + err.message);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '52px 40px 60px' }} className="fade-up">
        <div className="label-eyebrow">Welcome back</div>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', margin: '6px 0 8px' }}>
          {user.name.split(' ')[0]}, let's build a report.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)', margin: 0, maxWidth: 560 }}>
          Pick a vertical and sub-vertical from the left to browse coded report templates, or jump back into one of yours below.
        </p>

        <div className="label-eyebrow" style={{ marginTop: 40, marginBottom: 12 }}>Submitted reports</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {submitted.length === 0 && !loading && (
            <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
              No submitted reports yet.
            </div>
          )}
          {submitted.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onClick={() => handleResume(r, "preview")}
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleResume(r, "form"); }}
                  >
                    <Icon name="edit" size={13} />
                    Edit
                  </button>
                  <button
                    className="btn btn-soft btn-sm"
                    disabled={cloningId === r.id}
                    onClick={(e) => { e.stopPropagation(); handleClone(r); }}
                  >
                    <Icon name="copy" size={13} />
                    {cloningId === r.id ? 'Cloning...' : 'Clone'}
                  </button>
                  <button
                    className="btn btn-soft btn-sm"
                    style={{
                      color: 'var(--red-text, #ef4444)',
                      background: 'var(--red-soft, rgba(239, 68, 68, 0.08))',
                      border: 'none'
                    }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                  >
                    <Icon name="trash" size={13} />
                    Delete
                  </button>
                </div>
              }
            />
          ))}
        </div>

        <div className="label-eyebrow" style={{ marginTop: 32, marginBottom: 12 }}>Draft reports</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {drafts.length === 0 && !loading && (
            <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
              No draft reports in progress.
            </div>
          )}
          {drafts.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onClick={() => handleResume(r, "form")}
              action={
                <button
                  className="btn btn-soft btn-sm"
                  style={{
                    color: 'var(--red-text, #ef4444)',
                    background: 'var(--red-soft, rgba(239, 68, 68, 0.08))',
                    border: 'none'
                  }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                >
                  <Icon name="trash" size={13} />
                  Delete
                </button>
              }
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 36 }}>
          {[
            { icon: 'zap', t: 'Electrical', d: '6 PV reports · BESS · HV', c: 'rgb(234, 179, 8)' },
            { icon: 'building', t: 'Civil', d: 'Grading · Access roads', c: 'var(--blue)' },
            { icon: 'frame', t: 'Structure', d: 'Piles · Tracker structures', c: 'var(--accent)' },
          ].map(v => (
            <div key={v.t} className="card" style={{ padding: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', color: v.c, display: 'grid', placeItems: 'center' }}>
                <Icon name={v.icon} size={18} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>{v.t}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{v.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
