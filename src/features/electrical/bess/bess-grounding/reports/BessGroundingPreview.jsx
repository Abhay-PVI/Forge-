import React, { useState } from "react";
import Icon from "../../../../../shared/components/Icon";
import { bessGroundingDocNumber } from "../forms/utils/bessGroundingDocNumber.js";
import BessGroundingReportDoc from "./BessGroundingReportDoc.jsx";
import { exportPdf, exportPdfServer, exportPdfWithToc } from "../../../../../shared/utils/exporter/exportPdf";
import { exportDocx } from "../../../../../shared/utils/exporter/exportDocx";

function V(value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }
    return value;
}

const TODAY = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function BessGroundingPreview({ values, files, onBack, onNew }) {
    const fname = bessGroundingDocNumber(values) + '.docx';
    const [selectedFormat, setSelectedFormat] = useState("pdf");
    const [selectedPageSize, setPageSize] = useState("A4");

    const handleDownload = () => {
        if (selectedFormat === "pdf") {
            exportPdfWithToc(
                "bess-grounding-report",
                fname.replace(".docx", ".pdf"),
                selectedPageSize
            );
        } else {
            exportDocx(
                "bess-grounding-report",
                fname
            );
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* success banner */}
            <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrowL" size={14} />Edit inputs</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 4 }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="check" size={15} stroke={3} /></span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Report generated</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-soft btn-sm" onClick={onNew}><Icon name="plus" size={14} />New report</button>
                    <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                        <Icon name="download" size={14} />Download .{selectedFormat}
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0 }}>
                {/* doc canvas */}
                <div style={{ overflowY: 'auto', background: 'var(--surface-2)', padding: '34px 0' }}>
                    <div style={{ display: 'grid', placeItems: 'start center' }} className={`fade-up preview-size-${selectedPageSize.toLowerCase()}`}>
                        <BessGroundingReportDoc values={values} files={files} />
                    </div>
                </div>
                {/* download rail */}
                <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: 20 }}>
                    <div className="card" style={{ padding: 16, borderColor: 'var(--accent-line)' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ width: 44, height: 52, borderRadius: 6, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="fileText" size={22} /></div>
                            <div style={{ minWidth: 0 }}>
                                <div className="label-eyebrow">Standard document name</div>
                                <div className="mono" style={{ fontSize: 12, fontWeight: 600, marginTop: 4, wordBreak: 'break-all', lineHeight: 1.4 }}>{fname}</div>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={handleDownload}>
                            <Icon name="download" size={15} />Download
                        </button>
                        
                        {/* Dynamic Slider Segment Switch */}
                        <div className="segmented-control" style={{ marginTop: "10px" }}>
                            {/* Selector pill */}
                            <div className={`segmented-control-pill ${selectedPageSize === "Letter" ? "left" : "right"}`} />
                            
                            {/* Letter option */}
                            <div 
                                onClick={() => setPageSize("Letter")}
                                className={`segmented-control-option ${selectedPageSize === "Letter" ? "active" : ""}`}
                            >
                                Letter
                            </div>
                            
                            {/* A4 option */}
                            <div 
                                onClick={() => setPageSize("A4")}
                                className={`segmented-control-option ${selectedPageSize === "A4" ? "active" : ""}`}
                            >
                                A4
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button className="btn btn-soft btn-sm" style={{
                                flex: 1,
                                color:
                                    selectedFormat === "docx"
                                         ? "var(--accent-text)"
                                         : "var(--text-3)",
                                background:
                                    selectedFormat === "docx"
                                         ? "var(--accent-soft)"
                                         : "transparent",
                                border:
                                    selectedFormat === "docx"
                                         ? "1px solid var(--accent-line)"
                                         : undefined
                            }} onClick={() => setSelectedFormat("docx")}>
                                .docx
                            </button>
                            <button className="btn btn-soft btn-sm" style={{
                                flex: 1,
                                color:
                                    selectedFormat === "pdf"
                                         ? "var(--accent-text)"
                                         : "var(--text-3)",
                                background:
                                    selectedFormat === "pdf"
                                         ? "var(--accent-soft)"
                                         : "transparent",
                                border:
                                    selectedFormat === "pdf"
                                         ? "1px solid var(--accent-line)"
                                         : undefined
                            }} onClick={() => setSelectedFormat("pdf")}>
                                .pdf
                            </button>
                        </div>
                    </div>

                    <div className="label-eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>Document details</div>
                    <div style={{ display: 'grid', gap: 1, background: 'var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {[
                          ['Project', V(values.projectName)],
                          ['Client', V(values.clientName)],
                          ['Revision', V(values.revision)],
                          ['Pages', '2'],
                          ['Generated', TODAY]
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'var(--surface)', padding: '9px 12px' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{k}</span>
                                <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
