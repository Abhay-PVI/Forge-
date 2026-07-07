import React, { useState } from "react";
import Icon from "../../../../../shared/components/Icon";
import HvDbrReportDoc from "./HvDbrReportDoc.jsx";
import { exportPdfWithToc } from "../../../../../shared/utils/exporter/exportPdf";
import { exportDocx } from "../../../../../shared/utils/exporter/exportDocx";

export default function HvDbrPreview({ values, files, onBack, onNew }) {
    const docNo = values.documentNo || "PVI-HV-DBR-001";
    const fname = docNo + '.docx';
    const [selectedFormat, setSelectedFormat] = useState("pdf");
    const [selectedPageSize, setPageSize] = useState("A4");

    const handleDownload = () => {
        if (selectedFormat === "pdf") {
            exportPdfWithToc(
                "hv-dbr-report",
                fname.replace(".docx", ".pdf"),
                selectedPageSize
            );
        } else {
            exportDocx(
                "hv-dbr-report",
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
                        <HvDbrReportDoc values={values} files={files} />
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
                            <div className={`segmented-control-pill ${selectedPageSize === "Letter" ? "left" : "right"}`} />
                            <div 
                                onClick={() => setPageSize("Letter")}
                                className={`segmented-control-option ${selectedPageSize === "Letter" ? "active" : ""}`}
                            >
                                Letter
                            </div>
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
                                color: selectedFormat === "docx" ? "var(--text-1)" : "var(--text-3)",
                                background: selectedFormat === "docx" ? "var(--bg)" : "transparent"
                            }} onClick={() => setSelectedFormat("docx")}>DOCX</button>
                            <button className="btn btn-soft btn-sm" style={{
                                flex: 1,
                                color: selectedFormat === "pdf" ? "var(--text-1)" : "var(--text-3)",
                                background: selectedFormat === "pdf" ? "var(--bg)" : "transparent"
                            }} onClick={() => setSelectedFormat("pdf")}>PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
