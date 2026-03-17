/**
 * Business days calculation (excludes weekends)
 */

export function businessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function hoursSince(d: Date): number {
  return (Date.now() - d.getTime()) / (1000 * 60 * 60);
}
