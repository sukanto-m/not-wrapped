import { useMemo, useState } from "react";
import { computeThenNow } from "../lib/viz";

function mergeRanks(early, late) {
  const map = new Map();
  early.forEach((x, i) => map.set(x.name, { name: x.name, earlyRank: i + 1, earlyMin: x.minutes, lateRank: null, lateMin: 0 }));
  late.forEach((x, i) => {
    if (!map.has(x.name)) map.set(x.name, { name: x.name, earlyRank: null, earlyMin: 0, lateRank: i + 1, lateMin: x.minutes });
    else {
      const v = map.get(x.name);
      v.lateRank = i + 1;
      v.lateMin = x.minutes;
      map.set(x.name, v);
    }
  });
  const arr = [...map.values()];
  arr.sort((a, b) => {
    const aBest = Math.min(a.earlyRank ?? 999, a.lateRank ?? 999);
    const bBest = Math.min(b.earlyRank ?? 999, b.lateRank ?? 999);
    return aBest - bBest;
  });
  return arr.slice(0, 12);
}

export default function ThenNow({ rows, minMs }) {
  const [pct, setPct] = useState(25);

  const data = useMemo(() => {
    const p = Math.max(10, Math.min(50, pct)) / 100;
    return computeThenNow(rows, minMs, p, 10);
  }, [rows, minMs, pct]);

  const merged = useMemo(() => mergeRanks(data.early.topArtists, data.late.topArtists), [data]);

  return (
    <div className="card">
      <div className="sectionTitle">Then vs Now ⏳</div>
      <div className="small" style={{ marginTop: 6 }}>
        Compare early-year vs end-year taste. Slider controls how big each window is.
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <div className="label">Window size</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="range"
            type="range"
            min="10"
            max="50"
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
          />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{pct}%</span>
        </div>
      </div>

      <div className="twoCol" style={{ marginTop: 12 }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="small">{data.early.label} (plays: {data.early.count})</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {data.early.topArtists.map((a, i) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div className="name">{i + 1}. {a.name}</div>
                <div className="val">{a.minutes.toFixed(0)} min</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="small">{data.late.label} (plays: {data.late.count})</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {data.late.topArtists.map((a, i) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div className="name">{i + 1}. {a.name}</div>
                <div className="val">{a.minutes.toFixed(0)} min</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 12 }}>
        <div className="small">Movement snapshot (artists appearing in either top list)</div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {merged.map((x) => {
            const delta =
              x.earlyRank && x.lateRank ? x.earlyRank - x.lateRank : null; // positive means improved
            const arrow =
              delta === null ? "•" : delta > 0 ? "⬆️" : delta < 0 ? "⬇️" : "➡️";

            const left = x.earlyRank ? `#${x.earlyRank}` : "—";
            const right = x.lateRank ? `#${x.lateRank}` : "—";

            return (
              <div key={x.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div className="name">{arrow} {x.name}</div>
                <div className="val">{left} → {right}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}