function sumMs(rows) {
  let s = 0;
  for (const r of rows) s += r.msPlayed;
  return s;
}

export function computeViz(rows, minMs = 30000) {
  const filtered = rows.filter((r) => r.msPlayed >= minMs);

  // Hourly minutes
  const byHour = Array.from({ length: 24 }, () => 0);
  for (const r of filtered) byHour[r.hour] += r.msPlayed;
  const hourlyMinutes = byHour.map((ms, hour) => ({ hour, minutes: ms / 60000 }));

  // Monthly minutes
  const monthMap = new Map(); // "YYYY-MM" -> ms
  for (const r of filtered) monthMap.set(r.month, (monthMap.get(r.month) || 0) + r.msPlayed);
  const monthlyMinutes = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, ms]) => ({ month, minutes: ms / 60000 }));

  // Loop monsters: same-day repeats per track
  const dayTrackCount = new Map(); // `${date}||${trackKey}` -> count
  for (const r of filtered) {
    const k = `${r.date}||${r.trackKey}`;
    dayTrackCount.set(k, (dayTrackCount.get(k) || 0) + 1);
  }
  const trackLoopScore = new Map(); // trackKey -> max repeats on any day
  for (const [k, count] of dayTrackCount.entries()) {
    const trackKey = k.split("||")[1];
    trackLoopScore.set(trackKey, Math.max(trackLoopScore.get(trackKey) || 0, count));
  }
  const loopMonsters = [...trackLoopScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([trackKey, repeats]) => ({ trackKey, repeats }));

  // Total for extra context
  const totalMinutes = sumMs(filtered) / 60000;

  return { hourlyMinutes, monthlyMinutes, loopMonsters, totalMinutes };
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

export function sliceByPercent(rows, startPct, endPct) {
  const filtered = [...rows].sort((a, b) => a.endTime - b.endTime);
  const n = filtered.length;
  const a = Math.max(0, Math.min(n, Math.floor(n * startPct)));
  const b = Math.max(0, Math.min(n, Math.floor(n * endPct)));
  return filtered.slice(a, Math.max(a, b));
}

export function computeThenNow(rows, minMs = 30000, pct = 0.25, topN = 10) {
  const filtered = rows.filter((r) => r.msPlayed >= minMs);
  const early = sliceByPercent(filtered, 0, pct);
  const late = sliceByPercent(filtered, 1 - pct, 1);

  return {
    early: {
      label: `First ${Math.round(pct * 100)}%`,
      topArtists: topNBySum(early, (r) => r.artistName, topN),
      count: early.length,
    },
    late: {
      label: `Last ${Math.round(pct * 100)}%`,
      topArtists: topNBySum(late, (r) => r.artistName, topN),
      count: late.length,
    },
  };
}

export function computeMoodMap(rows, minMs = 30000, topN = 40) {
  const filtered = rows.filter((r) => r.msPlayed >= minMs);

  // repeats per track per day
  const dayTrackCount = new Map(); // date||trackKey -> count
  for (const r of filtered) {
    const k = `${r.date}||${r.trackKey}`;
    dayTrackCount.set(k, (dayTrackCount.get(k) || 0) + 1);
  }

  // Aggregate per track:
  // avgPlayMs, maxSameDayRepeats, totalMinutes
  const agg = new Map(); // trackKey -> {sumMs, plays, maxRepeats, totalMs}
  for (const r of filtered) {
    const v = agg.get(r.trackKey) || { sumMs: 0, plays: 0, maxRepeats: 1, totalMs: 0 };
    v.sumMs += r.msPlayed;
    v.plays += 1;
    v.totalMs += r.msPlayed;
    agg.set(r.trackKey, v);
  }
  for (const [k, v] of agg.entries()) {
    // find max repeats across days for this track
    let maxRep = 1;
    for (const [dk, c] of dayTrackCount.entries()) {
      if (dk.endsWith(`||${k}`)) maxRep = Math.max(maxRep, c);
    }
    v.maxRepeats = maxRep;
    agg.set(k, v);
  }

  const items = [...agg.entries()]
    .map(([trackKey, v]) => {
      const avgMs = v.sumMs / Math.max(1, v.plays);
      const minutes = v.totalMs / 60000;

      // Normalize-ish:
      // calm ~ log(avgMs) + minutes weight
      // chaos ~ log(maxRepeats) + shortness penalty
      const calm = Math.log1p(avgMs / 1000) + Math.log1p(minutes);
      const chaos = Math.log1p(v.maxRepeats) + Math.log1p(180000 / Math.max(1000, avgMs)); // shorter avg => higher chaos

      return { trackKey, calm, chaos, minutes, maxRepeats: v.maxRepeats, avgMs };
    })
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, topN);

  // scale to 0..100 for plotting
  const calmMax = Math.max(1e-9, ...items.map((x) => x.calm));
  const calmMin = Math.min(...items.map((x) => x.calm));
  const chaosMax = Math.max(1e-9, ...items.map((x) => x.chaos));
  const chaosMin = Math.min(...items.map((x) => x.chaos));

  const scaled = items.map((x) => ({
    ...x,
    calmN: ((x.calm - calmMin) / (calmMax - calmMin || 1)) * 100,
    chaosN: ((x.chaos - chaosMin) / (chaosMax - chaosMin || 1)) * 100,
  }));

  return { points: scaled };
}