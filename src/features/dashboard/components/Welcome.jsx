import { useEffect, useState } from 'react';
import Icon from "../../../shared/components/Icon";
import ReportRow from "./ReportRow";
import { fetchReportsApi, fetchReportDetailApi } from "../../electrical/pv/pv-design/api/reportsApi";

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

  const handleResume = async (report) => {
    if (!report.id || !onSelectRecent) return;
    try {
      const detailRes = await fetchReportDetailApi(report.id);
      if (detailRes.success && detailRes.data) {
        onSelectRecent({ report_id: report.id, report_type: report.report_type }, detailRes.data);
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
              action={
                <button
                  className="btn btn-soft btn-sm"
                  disabled={cloningId === r.id}
                  onClick={(e) => { e.stopPropagation(); handleClone(r); }}
                >
                  <Icon name="copy" size={13} />
                  {cloningId === r.id ? 'Cloning...' : 'Clone'}
                </button>
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
            <ReportRow key={r.id} report={r} onClick={() => handleResume(r)} />
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
