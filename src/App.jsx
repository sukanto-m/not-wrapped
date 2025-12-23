import { useMemo, useRef, useState } from "react";
import { computeNotWrapped, parseSpotifyStreamingHistory } from "./lib/wrapped";
import { computeViz } from "./lib/viz";
import { llamaCommentary } from "./lib/llama";
import MiniBarChart from "./components/MiniBarChart";
import LoopMonsters from "./components/LoopMonsters";
import ThenNow from "./components/ThenNow";
import MoodMap from "./components/MoodMap";
import ExportPNG from "./components/ExportPNG";
import "./index.css";

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      {sub ? <div className="statSub">{sub}</div> : null}
    </div>
  );
}

function BarList({ title, items, valueKey = "minutes", suffix = "min" }) {
  const max = Math.max(1e-9, ...items.map((i) => i[valueKey]));
  return (
    <div className="card">
      <div className="sectionTitle">{title}</div>
      <div className="barList">
        {items.map((it) => {
          const pct = Math.round((it[valueKey] / max) * 100);
          return (
            <div key={it.name}>
              <div className="barRowTop">
                <div className="name">{it.name}</div>
                <div className="val">
                  {it[valueKey].toFixed(1)} {suffix}
                </div>
              </div>
              <div className="trackBarBg">
                <div className="trackBarFg" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [rawRows, setRawRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [minSec, setMinSec] = useState(30);

  // Local Llama (Ollama)
  const [model, setModel] = useState("llama3.2");
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");

  // For PNG export (viz section only)
  const vizRef = useRef(null);

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFileName(f.name);
    setAiText("");
    setAiErr("");

    const text = await f.text();
    const json = JSON.parse(text);
    const parsed = parseSpotifyStreamingHistory(json);
    setRawRows(parsed);
  }

  const minMs = useMemo(() => Math.max(0, Math.floor(minSec * 1000)), [minSec]);

  const report = useMemo(() => {
    if (!rawRows) return null;
    return computeNotWrapped(rawRows, minMs);
  }, [rawRows, minMs]);

  const viz = useMemo(() => {
    if (!rawRows) return null;
    return computeViz(rawRows, minMs);
  }, [rawRows, minMs]);

  async function onGenerateAI() {
    if (!report?.ok) return;
    setAiBusy(true);
    setAiErr("");
    try {
      const text = await llamaCommentary({ report, model });
      setAiText(text);
    } catch (e) {
      setAiErr(String(e?.message || e));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="glow">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
      </div>

      <div className="container">
        <div className="headerRow">
          <div>
            <div className="badge">
              <span className="dot" />
              Not-Wrapped (DIY edition)
            </div>

            <div className="h1">
              Your year in music.
              <span className="grad">Minus the corporate horoscope.</span>
            </div>

            <div className="p">
              Upload your Spotify streaming history JSON. We compute loops, binge days, night-owl stats, quirky visuals,
              and optionally ask local Llama to narrate your musical personality.
            </div>
          </div>

          <div className="card">
            <div className="label">Upload JSON</div>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <input
                className="fileInput"
                type="file"
                accept=".json,application/json"
                onChange={onPickFile}
              />
            </div>

            <div className="row">
              <div
                className="label"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "55%",
                }}
                title={fileName}
              >
                {fileName || "No file yet."}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="label">Min play</span>
                <input
                  className="range"
                  type="range"
                  min="0"
                  max="60"
                  value={minSec}
                  onChange={(e) => setMinSec(Number(e.target.value))}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                  {minSec}s
                </span>
              </div>
            </div>

            <div className="row">
              <span className="pill">AI (local) via Ollama</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama3.2"
                className="textarea"
                style={{ minHeight: 0, height: 36, padding: "8px 10px" }}
              />
            </div>

            <div className="small">
              Tip: run <b>ollama serve</b>. Model example: <b>llama3.2</b>, <b>llama3</b>.
            </div>
          </div>
        </div>

        {!report ? (
          <div className="card" style={{ marginTop: 18, color: "rgba(255,255,255,0.7)" }}>
            Upload your JSON to begin. Bonus points if you don’t flinch at the 3–4 AM section.
          </div>
        ) : !report.ok ? (
          <div
            className="card"
            style={{
              marginTop: 18,
              borderColor: "rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.10)",
            }}
          >
            {report.error}
          </div>
        ) : (
          <>
            <div className="statsGrid">
              <StatCard
                label="Listening time"
                value={`${report.totals.hours.toFixed(1)} hrs`}
                sub={`${report.totals.minutes.toFixed(0)} minutes`}
              />
              <StatCard label="Days active" value={`${report.totals.daysActive}`} sub="Days with ≥ threshold plays" />
              <StatCard label="Unique artists" value={`${report.totals.uniqueArtists}`} sub="Your musical multiverse" />
              <StatCard
                label="Night share"
                value={`${(report.totals.nightShare * 100).toFixed(1)}%`}
                sub="00:00–05:59 listening"
              />
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="sectionTitle">Highlights</div>
              <div className="statsGrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 12 }}>
                <StatCard
                  label="Peak hour"
                  value={`${report.highlights.peakHour.hour}:00`}
                  sub={`${report.highlights.peakHour.minutes.toFixed(0)} min total`}
                />
                <StatCard
                  label="Most diverse day"
                  value={report.highlights.mostDiverseDay.date}
                  sub={`${report.highlights.mostDiverseDay.uniqueArtists} artists`}
                />
                <StatCard
                  label="Biggest binge"
                  value={report.highlights.biggestArtistBinge.artist}
                  sub={`${report.highlights.biggestArtistBinge.minutes.toFixed(1)} min on ${report.highlights.biggestArtistBinge.date}`}
                />
                <StatCard
                  label="Max loop"
                  value={`${report.highlights.maxLoop.plays} plays`}
                  sub={`${report.highlights.maxLoop.trackKey} (${report.highlights.maxLoop.date})`}
                />
              </div>

              <div className="small" style={{ marginTop: 10 }}>
                Micro-skips (&lt;10s): {(report.highlights.microSkipRate * 100).toFixed(1)}% of entries.
              </div>
            </div>

            <div className="twoCol" style={{ marginTop: 12 }}>
              <BarList title="Top Artists" items={report.topArtists} />
              <BarList title="Top Tracks" items={report.topTracks} />
            </div>

            {/* Visualizations block (exportable) */}
            {rawRows ? (
              <div style={{ marginTop: 12 }}>
                <div className="row">
                  <div className="sectionTitle">Visualizations</div>
                  <ExportPNG targetRef={vizRef} fileBase="not-wrapped" />
                </div>

                <div
                  ref={vizRef}
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* Existing charts */}
                  {viz ? (
                    <div className="twoCol">
                      <div className="card">
                        <div className="sectionTitle">Night Owl Radar 🌙</div>
                        <div className="small" style={{ marginTop: 6 }}>
                          Minutes by hour. If 3–4 AM is your peak, we already know you’re plotting something.
                        </div>
                        <MiniBarChart data={viz.hourlyMinutes} labelKey="hour" valueKey="minutes" />
                      </div>

                      <div className="card">
                        <div className="sectionTitle">Monthly Pulse 📅</div>
                        <div className="small" style={{ marginTop: 6 }}>
                          Minutes by month. Your year’s rhythm in one glance.
                        </div>
                        <MiniBarChart data={viz.monthlyMinutes} labelKey="month" valueKey="minutes" />
                      </div>

                      <LoopMonsters items={viz.loopMonsters} />
                    </div>
                  ) : null}

                  {/* New: Then vs Now */}
                  <ThenNow rows={rawRows} minMs={minMs} />

                  {/* New: Mood map */}
                  <MoodMap rows={rawRows} minMs={minMs} />
                </div>

                <div className="small" style={{ marginTop: 8 }}>
                  Export captures the visuals section as a PNG (local-only).
                </div>
              </div>
            ) : null}

            {/* AI Commentary */}
            <div className="card" style={{ marginTop: 12 }}>
              <div className="sectionTitle">AI Commentary (local)</div>
              <div className="small" style={{ marginTop: 8 }}>
                Generates a tagline + short personality read + 3 “awards” using your computed stats. Runs locally via Ollama.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                <button className="btn" onClick={onGenerateAI} disabled={aiBusy}>
                  {aiBusy ? "Summoning Llama..." : "Generate AI commentary"}
                </button>
                {aiErr ? (
                  <span className="small" style={{ color: "rgba(248,113,113,0.95)" }}>
                    {aiErr}
                  </span>
                ) : null}
              </div>

              <textarea
                className="textarea"
                readOnly
                value={aiText}
                style={{ marginTop: 12 }}
                placeholder="AI output will appear here..."
              />
            </div>

            <div className="footer">No ads. No guilt. Just patterns.</div>
          </>
        )}
      </div>
    </div>
  );
}
