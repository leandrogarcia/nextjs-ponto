export const TIME_ZONE = "America/Sao_Paulo";

const DATE_KEY_RE = /^(19|20)\d{2}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

export function isDateKey(value: string) {
  if (!DATE_KEY_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isMonthKey(value: string) {
  return MONTH_KEY_RE.test(value);
}

/** AAAA-MM-DD da data no fuso informado. */
export function toDateKey(date: Date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function toMonthKey(date: Date, timeZone = TIME_ZONE) {
  return toDateKey(date, timeZone).slice(0, 7);
}

export function formatTime(date: Date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function keyToUtc(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

export function addDays(key: string, days: number) {
  const d = keyToUtc(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado */
export function weekdayOf(key: string) {
  return keyToUtc(key).getUTCDay();
}

export function isWorkday(key: string) {
  const d = weekdayOf(key);
  return d >= 1 && d <= 5;
}

export function daysBetween(start: string, end: string) {
  const days: string[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) days.push(k);
  return days;
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, "0")}` };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function formatDateKey(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export function weekdayLabel(key: string) {
  return WEEKDAYS[weekdayOf(key)];
}

export function formatMonthKey(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 15)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Minutos como HH:MM, com sinal opcional para saldos. */
export function formatMinutes(minutes: number, signed = false) {
  const sign = minutes < 0 ? "-" : signed && minutes > 0 ? "+" : "";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
