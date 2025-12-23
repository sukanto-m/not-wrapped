export default function MiniBarChart({ data, labelKey, valueKey, height = 140 }) {
  const max = Math.max(1e-9, ...data.map((d) => d[valueKey]));
  return (
    <div className="card">
      <div className="small">Bars show relative intensity (not exact scale labels).</div>
      <svg width="100%" height={height} viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d[valueKey] / max) * 95;
          return (
            <g key={i}>
              <rect
                x={i + 0.12}
                y={100 - h}
                width={0.76}
                height={h}
                rx="0.15"
                ry="0.15"
                fill="url(#grad)"
                opacity="0.95"
              />
            </g>
          );
        })}
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
      </svg>

      <div className="small" style={{ marginTop: 8 }}>
        {data.slice(0, 6).map((d, idx) => (
          <span key={idx} style={{ marginRight: 10, opacity: 0.8 }}>
            {String(d[labelKey])}
          </span>
        ))}
        {data.length > 6 ? <span style={{ opacity: 0.6 }}>…</span> : null}
      </div>
    </div>
  );
}