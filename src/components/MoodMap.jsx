import { useMemo, useState } from "react";
import { computeMoodMap } from "../lib/viz";

export default function MoodMap({ rows, minMs }) {
  const [focus, setFocus] = useState(null);

  const data = useMemo(() => computeMoodMap(rows, minMs, 40), [rows, minMs]);

  // pick quadrant labels
  const quadrants = [
    { name: "Zen Zone", hint: "high calm, low chaos", x: 70, y: 20 },
    { name: "Focused Loop", hint: "high calm, high chaos", x: 70, y: 78 },
    { name: "Background Drift", hint: "low calm, low chaos", x: 10, y: 20 },
    { name: "Chaos Goblin", hint: "low calm, high chaos", x: 10, y: 78 },
  ];

  return (
    <div className="card">
      <div className="sectionTitle">Mood Map (Calm vs Chaos) 🧭</div>
      <div className="small" style={{ marginTop: 6 }}>
        Genre-agnostic proxy: longer plays push “calm”, looping + quick switching push “chaos”.
      </div>

      <div style={{ marginTop: 12 }}>
        <svg width="100%" height="260" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* grid */}
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />

          {/* labels */}
          {quadrants.map((q) => (
            <text
              key={q.name}
              x={q.x}
              y={q.y}
              fontSize="4"
              fill="rgba(255,255,255,0.45)"
              textAnchor={q.x > 50 ? "end" : "start"}
            >
              {q.name}
            </text>
          ))}

          {/* points */}
          {data.points.map((p) => {
            const cx = p.calmN; // x axis
            const cy = 100 - p.chaosN; // invert for y-up visual
            const r = Math.max(1.2, Math.min(4.0, 1.2 + Math.log1p(p.minutes) * 0.7));
            const isFocus = focus?.trackKey === p.trackKey;

            return (
              <circle
                key={p.trackKey}
                cx={cx}
                cy={cy}
                r={isFocus ? r + 1.3 : r}
                fill="url(#grad)"
                opacity={isFocus ? 0.95 : 0.70}
                onMouseEnter={() => setFocus(p)}
                onMouseLeave={() => setFocus(null)}
              />
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

        <div className="row" style={{ marginTop: 10 }}>
          <div className="small">x: Calm →</div>
          <div className="small">↑ Chaos</div>
        </div>

        <div className="card" style={{ marginTop: 10, padding: 12 }}>
          {focus ? (
            <>
              <div className="name">{focus.trackKey}</div>
              <div className="small" style={{ marginTop: 6 }}>
                minutes: {focus.minutes.toFixed(1)} · max same-day repeats: {focus.maxRepeats} · avg play:{" "}
                {(focus.avgMs / 1000).toFixed(1)}s
              </div>
            </>
          ) : (
            <div className="small">Hover a dot to see what your brain was doing.</div>
          )}
        </div>
      </div>
    </div>
  );
}
