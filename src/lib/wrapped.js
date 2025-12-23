export function parseSpotifyStreamingHistory(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((r) => {
      const endTime = new Date(String(r.endTime || "").replace(" ", "T") + ":00");
      const msPlayed = Number(r.msPlayed ?? 0);
      const artistName = String(r.artistName ?? "").trim();
      const trackName = String(r.trackName ?? "").trim();
      if (!artistName || !trackName || isNaN(endTime.getTime())) return null;
      return {
        endTime,
        msPlayed: Number.isFinite(msPlayed) ? msPlayed : 0,
        artistName,
        trackName,
        trackKey: `${artistName} — ${trackName}`,
        year: endTime.getFullYear(),
        month: `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, "0")}`,
        hour: endTime.getHours(),
        date: endTime.toISOString().slice(0, 10),
      };
    })
    .filter(Boolean);
}

function sumMs(rows) {
  let s = 0;
  for (const r of rows) s += r.msPlayed;
  return s;
}

function topNBySum(rows, keyFn, n = 10) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + r.msPlayed);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, ms]) => ({ name, minutes: ms / 60000 }));
}

function topNByCount(rows, keyFn, n = 10) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

export function computeNotWrapped(allRows, minMs = 30000) {
  const rows = allRows.filter((r) => r.msPlayed >= minMs);

  if (!rows.length) {
    return { ok: false, error: "No plays found after filtering. Lower threshold or check file." };
  }

  const start = new Date(Math.min(...rows.map((r) => r.endTime.getTime())));
  const end = new Date(Math.max(...rows.map((r) => r.endTime.getTime())));

  const totalMs = sumMs(rows);
  const totalHours = totalMs / 3600000;
  const daysActive = new Set(rows.map((r) => r.date)).size;
  const uniqueArtists = new Set(rows.map((r) => r.artistName)).size;
  const uniqueTracks = new Set(rows.map((r) => r.trackKey)).size;

  const nightMs = sumMs(rows.filter((r) => r.hour >= 0 && r.hour <= 5));
  const nightShare = nightMs / totalMs;

  const hourMs = new Map();
  for (const r of rows) hourMs.set(r.hour, (hourMs.get(r.hour) || 0) + r.msPlayed);
  const peakHourEntry = [...hourMs.entries()].sort((a, b) => b[1] - a[1])[0];

  const dayArtists = new Map();
  for (const r of rows) {
    if (!dayArtists.has(r.date)) dayArtists.set(r.date, new Set());
    dayArtists.get(r.date).add(r.artistName);
  }
  const mostDiverse = [...dayArtists.entries()]
    .map(([date, set]) => ({ date, uniqueArtists: set.size }))
    .sort((a, b) => b.uniqueArtists - a.uniqueArtists)[0];

  const artistDayMs = new Map();
  for (const r of rows) {
    const k = `${r.date}||${r.artistName}`;
    artistDayMs.set(k, (artistDayMs.get(k) || 0) + r.msPlayed);
  }
  const binge = [...artistDayMs.entries()]
    .map(([k, ms]) => {
      const [date, artist] = k.split("||");
      return { date, artist, minutes: ms / 60000 };
    })
    .sort((a, b) => b.minutes - a.minutes)[0];

  const dayTrackCount = new Map();
  for (const r of rows) {
    const k = `${r.date}||${r.trackKey}`;
    dayTrackCount.set(k, (dayTrackCount.get(k) || 0) + 1);
  }
  const maxLoop = [...dayTrackCount.entries()]
    .map(([k, plays]) => {
      const [date, trackKey] = k.split("||");
      return { date, trackKey, plays };
    })
    .sort((a, b) => b.plays - a.plays)[0];

  const byYear = new Map();
  for (const r of rows) byYear.set(r.year, (byYear.get(r.year) || 0) + r.msPlayed);
  const yearSplit = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, ms]) => ({ year, hours: ms / 3600000 }));

  const microSkips = allRows.filter((r) => r.msPlayed < 10000);
  const microSkipRate = microSkips.length / Math.max(1, allRows.length);
  const mostMicroSkipped = topNByCount(microSkips, (r) => r.trackKey, 1)[0] || null;

  const topArtists = topNBySum(rows, (r) => r.artistName, 10);
  const topTracks = topNBySum(rows, (r) => r.trackKey, 10);

  return {
    ok: true,
    meta: { startISO: start.toISOString(), endISO: end.toISOString(), minMs },
    totals: { hours: totalHours, minutes: totalMs / 60000, daysActive, uniqueArtists, uniqueTracks, nightShare },
    highlights: {
      peakHour: { hour: peakHourEntry?.[0], minutes: (peakHourEntry?.[1] || 0) / 60000 },
      mostDiverseDay: mostDiverse,
      biggestArtistBinge: binge,
      maxLoop,
      microSkipRate,
      mostMicroSkipped,
    },
    yearSplit,
    topArtists,
    topTracks,
  };
}