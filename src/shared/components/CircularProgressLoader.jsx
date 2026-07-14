import React, { useState, useEffect } from "react";

export default function CircularProgressLoader({
  progress = 0,
  size = 160,
  strokeWidth = 6,
  color = "#58e64cff",
  backgroundColor = "#c0f0c0ff",
  loadingText = "Loading...",
  visible = false,
}) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity, setOpacity] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

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

  // Smooth counter text interpolation (counting up smoothly to target progress)
  useEffect(() => {
    let animationFrameId;
    const startValue = displayProgress;
    const endValue = progress;
    const duration = 400; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const timeProgress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeProgress = timeProgress * (2 - timeProgress);
      const currentVal = startValue + (endValue - startValue) * easeProgress;
      setDisplayProgress(Math.round(currentVal));

      if (timeProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [progress]);

  if (!shouldRender) return null;

  // Circle Math
  const center = size / 2;
  const radius = (size - strokeWidth - 16) / 2; // Offset to leave space for orbiting dots
  const circumference = 2 * Math.PI * radius;
  // Progress goes counter-clockwise starting from the top (-90deg rotation on SVG)
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
      <style>{`
        @keyframes orbitRotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .circular-loader-orbit {
          transform-origin: center;
          animation: orbitRotation 6s linear infinite;
        }
      `}</style>

      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            {/* Subtle gradient for progress ring */}
            <linearGradient id="loader-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#50a03bff" />
            </linearGradient>
            {/* Glow drop-shadow filter */}
            <filter id="loader-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={color} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            opacity="0.25"
          />

          {/* Glowing Animated Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#loader-ring-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.4s ease-out",
            }}
            filter="url(#loader-glow-filter)"
          />

          {/* Orbiting outer accent dots */}
          <g className="circular-loader-orbit" style={{ transformOrigin: `${center}px ${center}px` }}>
            <circle cx={center} cy={center - radius - 8} r="3.5" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
            <circle cx={center + radius + 8} cy={center} r="2" fill="#36a545ff" opacity="0.6" />
            <circle cx={center - radius - 8} cy={center} r="2.5" fill={color} opacity="0.8" />
          </g>
        </svg>

        {/* Central percentage counter */}
        <div
          style={{
            position: "absolute",
            fontSize: "2rem",
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center",
            userSelect: "none",
            letterSpacing: "-0.02em",
          }}
        >
          {displayProgress}%
        </div>
      </div>

      {/* Loading text below */}
      <div
        style={{
          marginTop: 24,
          fontSize: "1.05rem",
          fontWeight: "500",
          color: "#e2e8f0",
          letterSpacing: "0.01em",
          textAlign: "center",
          maxWidth: 280,
          lineHeight: 1.4,
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.4)",
        }}
      >
        {loadingText}
      </div>
    </div>
  );
}
