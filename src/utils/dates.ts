/** "Thursday, Oct 16" in the device locale. */
export function formatToday(date: Date = new Date()): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${weekday}, ${monthDay}`;
}
