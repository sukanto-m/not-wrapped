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