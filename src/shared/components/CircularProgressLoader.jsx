import React, { useState, useEffect } from "react";
import Icon from "./Icon";

export default function CircularProgressLoader({
  progress = 0,
  visible = false,
  fname = "report.pdf",
}) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity, setOpacity] = useState(0);

  // Handle visibility transitions (fade-in / fade-out)
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      const t = setTimeout(() => setOpacity(1), 10);
      return () => clearTimeout(t);
    } else {
      setOpacity(0);
      const t = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!shouldRender) return null;

  // Define steps matching the PDF generation phases
  const steps = [
    "Initializing PDF engine",
    "Rendering document layout",
    "Generating Table of Contents",
    "Injecting page numbers",
    "Finalizing document pages",
  ];

  // Map progress (0-100) to current active step index
  let activeIndex = 0;
  if (progress >= 100) {
    activeIndex = 5;
  } else if (progress >= 85) {
    activeIndex = 4;
  } else if (progress >= 60) {
    activeIndex = 3;
  } else if (progress >= 35) {
    activeIndex = 2;
  } else if (progress >= 15) {
    activeIndex = 1;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(231, 227, 227, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        opacity: opacity,
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: visible ? "all" : "none",
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: 350,
          textAlign: 'center',
          background: 'rgba(30, 41, 59, 0.7)',
          padding: '36px 28px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)'
        }}
        className="fade-up"
      >
        {/* Spinning settings icon inside square container */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 15,
            background: 'var(--accent-soft, rgba(14, 165, 233, 0.15))',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 22px'
          }}
        >
          <Icon name="settings" size={28} className="spin" style={{ color: 'var(--accent, #0ea5e9)' }} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: '#ffffff' }}>
          Downloading report
        </h2>
        <div className="mono" style={{ fontSize: 12, color: 'var(--text-3, #94a3b8)', marginBottom: 24 }}>
          {fname}
        </div>

        {/* Steps checklist */}
        <div style={{ display: 'grid', gap: 12, textAlign: 'left', paddingLeft: 12 }}>
          {steps.map((s, idx) => {
            const done = idx < activeIndex;
            const active = idx === activeIndex;
            return (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  opacity: done || active ? 1 : 0.4,
                  transition: 'opacity 0.3s'
                }}
              >
                {done ? (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--accent, #0ea5e9)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      flex: 'none'
                    }}
                  >
                    <Icon name="check" size={12} stroke={3} />
                  </span>
                ) : active ? (
                  <Icon name="settings" size={20} className="spin" style={{ color: 'var(--accent, #0ea5e9)', flex: 'none' }} />
                ) : (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid var(--border-strong, #475569)',
                      flex: 'none'
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#ffffff' : done ? '#cbd5e1' : '#64748b'
                  }}
                >
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
