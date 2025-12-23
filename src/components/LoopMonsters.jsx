export default function LoopMonsters({ items }) {
  return (
    <div className="card">
      <div className="sectionTitle">Loop Monsters 👾</div>
      <div className="small" style={{ marginTop: 6 }}>
        Tracks with the highest same-day repeats. The “again” button was working overtime.
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => (
          <div key={it.trackKey}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div className="name">{it.trackKey}</div>
              <div className="val">{it.repeats}x</div>
            </div>
            <div className="trackBarBg">
              <div className="trackBarFg" style={{ width: `${Math.min(100, it.repeats * 12)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}