// 표시용 포맷터

const RTF = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeKo(date: Date): string {
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "방금";
  if (abs < HOUR) return RTF.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return RTF.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return RTF.format(Math.round(diff / DAY), "day");
  if (abs < 30 * DAY) return RTF.format(Math.round(diff / WEEK), "week");
  return new Intl.DateTimeFormat("ko", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function formatCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000) return `${(n / 1000).toFixed(1)}천`;
  return `${(n / 10000).toFixed(1)}만`;
}
