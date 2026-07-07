import Icon from "../../../shared/components/Icon";

const STATUS_STYLE = {
  completed: { label: 'Completed', color: 'var(--green-text)', bg: 'var(--green-soft)' },
  generating: { label: 'Generating', color: 'var(--amber-text)', bg: 'var(--amber-soft)' },
  draft: { label: 'Draft', color: 'var(--text-3)', bg: 'var(--surface-2)' },
};

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReportRow({ report, onClick, action }) {
  const statusMeta = STATUS_STYLE[report.status] || STATUS_STYLE.draft;
  const clickable = typeof onClick === 'function';

  return (
    <div
      className="card"
      onClick={clickable ? onClick : undefined}
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name="fileText" size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{report.report_title || 'Unnamed Report'}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          {[report.document_no, report.revision, report.report_type].filter(Boolean).join(' · ')}
        </div>
      </div>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: statusMeta.color,
          background: statusMeta.bg,
          padding: '3px 8px',
          borderRadius: 999,
          lineHeight: 1,
        }}
      >
        {statusMeta.label}
      </span>
      <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{formatDate(report.created_at)}</span>
      {action ? action : (clickable && <Icon name="chevronR" size={16} style={{ color: 'var(--text-4)' }} />)}
    </div>
  );
}
